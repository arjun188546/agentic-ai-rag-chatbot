import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Types for knowledge base
interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  tags: string[];
  source: string;
  relevance: number;
  searchScore?: number;
}

interface SearchRequest {
  query: string;
  maxResults?: number;
}

interface SearchResponse {
  results: KnowledgeDocument[];
  totalDocuments: number;
  searchTime: number;
  success: boolean;
}

// Configuration
const KNOWLEDGE_BASE_PATH = path.join(process.cwd(), 'knowledge-base');
const MAX_RESULTS = 5;
const MAX_CONTENT_LENGTH = 4000; // Trim content to keep LLM prompts lean
const SEARCH_TIMEOUT = 5000; // 5 second timeout for search operations
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache TTL

// Advanced indexing structures for small knowledge bases (8-20 docs)
interface InvertedIndex {
  [term: string]: {
    documents: Set<string>; // Document IDs containing this term
    frequency: number; // Total occurrences across all documents
    idf: number; // Inverse Document Frequency
  };
}

interface DocumentIndex {
  [docId: string]: {
    document: KnowledgeDocument;
    termFrequency: Map<string, number>; // Term -> frequency in this document
    tfidfVector: Map<string, number>; // Term -> TF-IDF score
    length: number; // Document length in words
    topics: string[]; // Core topics extracted from filename
    embeddings: number[]; // Simple word-based embeddings
  };
}

interface KnowledgeBaseIndex {
  invertedIndex: InvertedIndex;
  documentIndex: DocumentIndex;
  totalDocuments: number;
  vocabulary: Set<string>;
  averageDocumentLength: number;
  lastIndexed: number;
}

// Global index cache for small knowledge bases
let knowledgeBaseIndex: KnowledgeBaseIndex | null = null;

export async function POST(request: NextRequest): Promise<NextResponse<SearchResponse>> {
  const startTime = Date.now();

  try {
    // Parse and validate request
    const body = await request.json().catch(() => ({}));
    const query = (body.query || '').toString().trim();
    const maxResults = Math.min(parseInt(body.maxResults) || MAX_RESULTS, 10); // Cap at 10

    // Validate input
    if (!query || query.length < 2) {
      return NextResponse.json(
        {
          results: [],
          totalDocuments: 0,
          searchTime: Date.now() - startTime,
          success: false,
          error: 'Query must be at least 2 characters long'
        },
        { status: 400 }
      );
    }

    if (query.length > 500) {
      return NextResponse.json(
        {
          results: [],
          totalDocuments: 0,
          searchTime: Date.now() - startTime,
          success: false,
          error: 'Query is too long (max 500 characters)'
        },
        { status: 400 }
      );
    }

    console.log(`[Knowledge API] Processing query: "${query.substring(0, 50)}${query.length > 50 ? '...' : ''}"`);

    // Load documents with caching
    const documents = await loadKnowledgeBaseDocuments();

    if (documents.length === 0) {
      return NextResponse.json(
        {
          results: [],
          totalDocuments: 0,
          searchTime: Date.now() - startTime,
          success: false,
          error: 'No documents available in knowledge base'
        },
        { status: 503 }
      );
    }

    // Perform search with timeout
    const searchPromise = searchDocuments(query, documents, maxResults);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Search timeout')), SEARCH_TIMEOUT)
    );

    const searchResults = await Promise.race([searchPromise, timeoutPromise]);

    // Trim content to keep LLM prompts lean
    const trimmedResults = searchResults.map(doc => ({
      ...doc,
      content: doc.content.length > MAX_CONTENT_LENGTH
        ? doc.content.substring(0, MAX_CONTENT_LENGTH) + '...'
        : doc.content
    }));

    const searchTime = Date.now() - startTime;

    console.log(`[Knowledge API] Completed in ${searchTime}ms - ${trimmedResults.length} results from ${documents.length} documents`);

    return NextResponse.json({
      results: trimmedResults,
      totalDocuments: documents.length,
      searchTime: searchTime,
      success: true
    });

  } catch (error) {
    const searchTime = Date.now() - startTime;
    console.error('[Knowledge API] Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        results: [],
        totalDocuments: 0,
        searchTime: searchTime,
        success: false,
        error: errorMessage
      },
      { status: errorMessage.includes('timeout') ? 408 : 500 }
    );
  }
}

// Load and index knowledge base documents (optimized for 8-20 docs)
async function loadKnowledgeBaseDocuments(): Promise<KnowledgeDocument[]> {
  const now = Date.now();

  // Check if index is valid and recent
  if (knowledgeBaseIndex && (now - knowledgeBaseIndex.lastIndexed) < CACHE_TTL) {
    console.log(`[Knowledge] Using indexed knowledge base (${knowledgeBaseIndex.totalDocuments} docs, ${knowledgeBaseIndex.vocabulary.size} terms)`);
    return Object.values(knowledgeBaseIndex.documentIndex).map(entry => entry.document);
  }

  console.log(`[Knowledge] Building fresh index from disk...`);

  try {
    // Check if knowledge base directory exists
    if (!fs.existsSync(KNOWLEDGE_BASE_PATH)) {
      console.warn('[Knowledge] Knowledge base directory not found');
      knowledgeBaseIndex = createEmptyIndex(now);
      return [];
    }

    // Read all markdown files
    const files = fs.readdirSync(KNOWLEDGE_BASE_PATH)
      .filter(file => file.endsWith('.md'))
      .sort();

    if (files.length === 0) {
      console.warn('[Knowledge] No markdown files found in knowledge base');
      knowledgeBaseIndex = createEmptyIndex(now);
      return [];
    }

    console.log(`[Knowledge] Indexing ${files.length} documents...`);

    // Parse all documents first
    const documents: KnowledgeDocument[] = [];
    let processedCount = 0;
    let errorCount = 0;

    for (const file of files) {
      try {
        const filePath = path.join(KNOWLEDGE_BASE_PATH, file);
        const content = fs.readFileSync(filePath, 'utf-8');

        const doc = parseMarkdownDocument(content, file);
        if (doc) {
          documents.push(doc);
          processedCount++;
        }
      } catch (error) {
        console.error(`[Knowledge] Error loading ${file}:`, error);
        errorCount++;
      }
    }

    // Build comprehensive index
    knowledgeBaseIndex = buildKnowledgeBaseIndex(documents, now);

    console.log(`[Knowledge] Successfully indexed ${processedCount} documents (${errorCount} errors)`);
    console.log(`[Knowledge] Index stats: ${knowledgeBaseIndex.vocabulary.size} unique terms, avg doc length: ${knowledgeBaseIndex.averageDocumentLength.toFixed(1)} words`);

    return documents;

  } catch (error) {
    console.error('[Knowledge] Error building index:', error);
    knowledgeBaseIndex = createEmptyIndex(now);
    return [];
  }
}

// Create empty index structure
function createEmptyIndex(lastIndexed: number): KnowledgeBaseIndex {
  return {
    invertedIndex: {},
    documentIndex: {},
    totalDocuments: 0,
    vocabulary: new Set(),
    averageDocumentLength: 0,
    lastIndexed
  };
}

// Build comprehensive index for small knowledge base
function buildKnowledgeBaseIndex(documents: KnowledgeDocument[], lastIndexed: number): KnowledgeBaseIndex {
  const invertedIndex: InvertedIndex = {};
  const documentIndex: DocumentIndex = {};
  const vocabulary = new Set<string>();
  let totalDocumentLength = 0;

  // Process each document
  documents.forEach(doc => {
    const docId = doc.id;
    const content = `${doc.title} ${doc.content}`.toLowerCase();
    const words = tokenizeAndNormalize(content);
    const termFrequency = new Map<string, number>();

    // Count term frequencies
    words.forEach(word => {
      termFrequency.set(word, (termFrequency.get(word) || 0) + 1);
      vocabulary.add(word);

      // Update inverted index
      if (!invertedIndex[word]) {
        invertedIndex[word] = {
          documents: new Set(),
          frequency: 0,
          idf: 0
        };
      }
      invertedIndex[word].documents.add(docId);
      invertedIndex[word].frequency++;
    });

    // Calculate document length
    const docLength = words.length;
    totalDocumentLength += docLength;

    // Extract topics from filename
    const topics = extractTopicsFromFilename(doc.source);

    // Create simple embeddings (word frequency based)
    const embeddings = createSimpleEmbeddings(words, vocabulary);

    // Store document index entry
    documentIndex[docId] = {
      document: doc,
      termFrequency,
      tfidfVector: new Map(), // Will be populated after IDF calculation
      length: docLength,
      topics,
      embeddings
    };
  });

  // Calculate IDF scores
  vocabulary.forEach(term => {
    const df = invertedIndex[term].documents.size; // Document frequency
    invertedIndex[term].idf = Math.log(documents.length / (1 + df));
  });

  // Calculate TF-IDF vectors for each document
  Object.values(documentIndex).forEach(docEntry => {
    docEntry.termFrequency.forEach((tf, term) => {
      const idf = invertedIndex[term].idf;
      const tfidf = (tf / docEntry.length) * idf;
      docEntry.tfidfVector.set(term, tfidf);
    });
  });

  const averageDocumentLength = totalDocumentLength / documents.length;

  return {
    invertedIndex,
    documentIndex,
    totalDocuments: documents.length,
    vocabulary,
    averageDocumentLength,
    lastIndexed
  };
}

// Tokenize and normalize text for indexing
function tokenizeAndNormalize(text: string): string[] {
  const stopWords = new Set([
    'what', 'is', 'are', 'the', 'how', 'why', 'when', 'where', 'can', 'could', 'would', 'should',
    'do', 'does', 'did', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
    'with', 'by', 'from', 'about', 'search', 'find', 'tell', 'me', 'give', 'show', 'explain',
    'describe', 'want', 'know', 'need', 'help', 'this', 'that', 'these', 'those', 'i', 'you',
    'he', 'she', 'it', 'we', 'they'
  ]);

  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word))
    .slice(0, 1000); // Limit per document for performance
}

// Extract topics from filename
function extractTopicsFromFilename(filename: string): string[] {
  const baseName = filename.toLowerCase().replace('.md', '');
  const parts = baseName.split(/[-_\s]+/);

  // Extract meaningful topic words
  const topics: string[] = [];
  parts.forEach(part => {
    if (part.length > 3) {
      topics.push(part);
    }
  });

  return topics;
}

// Create simple word-based embeddings
function createSimpleEmbeddings(words: string[], vocabulary: Set<string>): number[] {
  const embeddingSize = Math.min(50, vocabulary.size); // Keep it small for performance
  const embedding = new Array(embeddingSize).fill(0);

  // Simple frequency-based embedding
  const wordFreq = new Map<string, number>();
  words.forEach(word => {
    wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
  });

  // Convert to fixed-size vector
  Array.from(vocabulary).slice(0, embeddingSize).forEach((term, index) => {
    if (index < embeddingSize) {
      embedding[index] = wordFreq.get(term) || 0;
    }
  });

  return embedding;
}

// Parse markdown document and extract metadata
function parseMarkdownDocument(content: string, filename: string): KnowledgeDocument | null {
  try {
    // Extract title (first # heading)
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : filename.replace('.md', '');

    // Extract content (remove title and clean up)
    let cleanContent = content;
    if (titleMatch) {
      cleanContent = content.replace(titleMatch[0], '').trim();
    }

    // Remove excessive whitespace and normalize
    cleanContent = cleanContent
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1') // Remove bold/italic markdown
      .replace(/`([^`]+)`/g, '$1') // Remove code backticks
      .trim();

    // Generate tags based on content analysis
    const tags = extractTags(title, cleanContent, filename);

    // Calculate base relevance score
    const relevance = calculateRelevance(title, cleanContent, tags);

    // Create document ID
    const id = filename.replace('.md', '').toLowerCase().replace(/[^a-z0-9]/g, '_');

    return {
      id,
      title,
      content: cleanContent,
      tags,
      source: filename,
      relevance
    };

  } catch (error) {
    console.error(`[Knowledge API] Error parsing ${filename}:`, error);
    return null;
  }
}

// Extract tags from document content
function extractTags(title: string, content: string, filename: string): string[] {
  const tags: Set<string> = new Set();
  
  // Add filename-based tags
  const filenameTags = filename.toLowerCase()
    .replace('.md', '')
    .split(/[-_\s]+/)
    .filter(tag => tag.length > 2);
  
  filenameTags.forEach(tag => tags.add(tag));

  // Add title-based tags
  const titleWords = title.toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 3);
  
  titleWords.forEach(word => tags.add(word));

  // Technology keywords
  const techKeywords = [
    'ai', 'artificial intelligence', 'machine learning', 'ml', 'deep learning',
    'data science', 'analytics', 'python', 'javascript', 'typescript', 'react',
    'cloud', 'aws', 'azure', 'docker', 'kubernetes', 'blockchain', 'crypto',
    'cybersecurity', 'security', 'quantum', 'computing', 'algorithm', 'database',
    'api', 'web', 'mobile', 'devops', 'agile', 'scrum'
  ];

  const lowerContent = content.toLowerCase();
  techKeywords.forEach(keyword => {
    if (lowerContent.includes(keyword)) {
      tags.add(keyword);
    }
  });

  return Array.from(tags).slice(0, 10); // Limit to 10 tags
}

// Calculate document relevance score
function calculateRelevance(title: string, content: string, tags: string[]): number {
  let score = 0.5; // Base score

  // Title quality
  if (title.length > 10) score += 0.1;
  if (title.includes('Fundamentals') || title.includes('Guide')) score += 0.1;

  // Content quality
  const contentLength = content.length;
  if (contentLength > 500) score += 0.1;
  if (contentLength > 1000) score += 0.1;
  if (contentLength > 2000) score += 0.1;

  // Tag relevance
  score += Math.min(tags.length * 0.02, 0.2);

  return Math.min(score, 1.0);
}

// Query Intent Analysis - Analyze query type and boost accordingly
function analyzeQueryIntent(queryWords: string[], doc: KnowledgeDocument): number {
  let intentScore = 0;

  // How-to queries
  const howToWords = ['how', 'guide', 'tutorial', 'steps', 'process', 'method'];
  if (queryWords.some(word => howToWords.includes(word))) {
    if (doc.content.includes('##') || doc.content.includes('###') || doc.content.includes('- ')) {
      intentScore += 15; // Structured content for how-to queries
    }
  }

  // Definition queries
  const definitionWords = ['what', 'definition', 'meaning', 'explain', 'overview'];
  if (queryWords.some(word => definitionWords.includes(word))) {
    if (doc.title.includes('Fundamentals') || doc.title.includes('Overview') || doc.content.includes('## What')) {
      intentScore += 12; // Foundational content for definition queries
    }
  }

  // Comparison queries
  const comparisonWords = ['vs', 'versus', 'compare', 'difference', 'better', 'best'];
  if (queryWords.some(word => comparisonWords.includes(word))) {
    if (doc.content.includes('vs') || doc.content.includes('versus') || doc.content.includes('Advantages:') || doc.content.includes('Disadvantages:')) {
      intentScore += 18; // Comparison content
    }
  }

  // Technical queries
  const technicalWords = ['code', 'implementation', 'api', 'framework', 'library', 'architecture'];
  if (queryWords.some(word => technicalWords.includes(word))) {
    if (doc.content.includes('```') || doc.content.includes('`') || doc.tags.includes('api') || doc.tags.includes('framework')) {
      intentScore += 20; // Technical content with code/examples
    }
  }

  return intentScore;
}

// Get related terms for cross-referencing
function getRelatedTerms(queryWords: string[]): string[] {
  const relatedTerms: string[] = [];

  const termMap: { [key: string]: string[] } = {
    'ai': ['artificial intelligence', 'machine learning', 'neural networks', 'deep learning'],
    'ml': ['machine learning', 'algorithms', 'predictive models', 'data science'],
    'data': ['analytics', 'database', 'big data', 'information'],
    'cloud': ['aws', 'azure', 'scalability', 'distributed systems'],
    'security': ['cybersecurity', 'encryption', 'authentication', 'threats'],
    'web': ['frontend', 'backend', 'javascript', 'html', 'css', 'react'],
    'mobile': ['ios', 'android', 'react native', 'flutter', 'app development'],
    'database': ['sql', 'nosql', 'mongodb', 'postgresql', 'data storage'],
    'api': ['rest', 'graphql', 'microservices', 'integration'],
    'devops': ['ci/cd', 'docker', 'kubernetes', 'automation']
  };

  queryWords.forEach(word => {
    const related = termMap[word];
    if (related) {
      relatedTerms.push(...related);
    }
  });

  return relatedTerms;
}

// Advanced indexed search using inverted index and pre-computed TF-IDF
function searchDocuments(query: string, documents: KnowledgeDocument[], maxResults: number): KnowledgeDocument[] {
  const startTime = Date.now();

  try {
    // Ensure we have a valid index
    if (!knowledgeBaseIndex) {
      console.warn('[Search] No index available, falling back to basic search');
      return searchDocumentsBasic(query, documents, maxResults);
    }

    // Enhanced query processing with expansion
    const queryWords = tokenizeAndNormalize(query);
    if (queryWords.length === 0) {
      console.log(`[Search] No meaningful query words found in: "${query}"`);
      return [];
    }

    // Detect temporal queries (recent, latest, new, current)
    const temporalTerms = ['recent', 'latest', 'new', 'current', 'modern', '2024', '2025'];
    const hasTemporalQuery = queryWords.some(word => temporalTerms.includes(word));
    console.log(`[Search] Temporal query detected: ${hasTemporalQuery}`);

    // Expand query with related terms for small knowledge bases
    const expandedQuery = expandQueryForSmallKb(queryWords, knowledgeBaseIndex);
    console.log(`[Search] Query: ${queryWords.join(', ')} | Expanded: ${expandedQuery.join(', ')}`);

    // Use inverted index to find candidate documents instantly
    const candidateDocIds = new Set<string>();
    expandedQuery.forEach(term => {
      const termEntry = knowledgeBaseIndex!.invertedIndex[term];
      if (termEntry) {
        termEntry.documents.forEach(docId => candidateDocIds.add(docId));
      }
    });

    if (candidateDocIds.size === 0) {
      console.log(`[Search] No documents found for query terms`);
      return [];
    }

    console.log(`[Search] Found ${candidateDocIds.size} candidate documents from ${knowledgeBaseIndex!.vocabulary.size} terms`);

    // Score candidate documents using enhanced multi-factor scoring
    const results: (KnowledgeDocument & { searchScore: number; matchDetails: string[] })[] = [];

    candidateDocIds.forEach(docId => {
      const docEntry = knowledgeBaseIndex!.documentIndex[docId];
      if (!docEntry) return;

      const doc = docEntry.document;
      let score = 0;
      const matchDetails: string[] = [];
      const lowerTitle = doc.title.toLowerCase();
      const lowerContent = doc.content.toLowerCase();
      const lowerQuery = query.toLowerCase();

      // === ENHANCED SCORING SYSTEM ===

      // 1. TF-IDF based scoring (primary for indexed search) - INCREASED WEIGHT
      let tfidfScore = 0;
      let tfidfMatches = 0;
      expandedQuery.forEach(term => {
        const tfidf = docEntry.tfidfVector.get(term) || 0;
        if (tfidf > 0) {
          tfidfScore += tfidf;
          tfidfMatches++;
        }
      });
      if (tfidfMatches > 0) {
        score += tfidfScore * 150; // Increased from 100
        matchDetails.push(`tfidf:${tfidfMatches}`);
      }

      // 2. Topic matching (high priority for small KBs) - INCREASED WEIGHT
      let topicMatches = 0;
      expandedQuery.forEach(word => {
        if (docEntry.topics.some(topic => topic.includes(word) || word.includes(topic))) {
          topicMatches++;
          score += 50; // Increased from 30
        }
      });
      if (topicMatches > 0) {
        matchDetails.push(`topics:${topicMatches}`);
      }

      // 3. Exact phrase matching in title/content - INCREASED WEIGHT
      if (lowerTitle.includes(lowerQuery)) {
        score += 120; // Increased from 80
        matchDetails.push('exact_title');
      }
      if (lowerContent.includes(lowerQuery)) {
        score += 80; // Increased from 40
        matchDetails.push('exact_content');
      }

      // 4. Key phrase matching (2-word combinations) - INCREASED WEIGHT
      let phraseMatches = 0;
      for (let i = 0; i < queryWords.length - 1; i++) {
        const phrase = `${queryWords[i]} ${queryWords[i + 1]}`;
        if (lowerTitle.includes(phrase)) {
          score += 40; // Increased from 25
          phraseMatches++;
        }
        if (lowerContent.includes(phrase)) {
          score += 25; // Increased from 15
          phraseMatches++;
        }
      }
      if (phraseMatches > 0) {
        matchDetails.push(`phrases:${phraseMatches}`);
      }

      // 5. Tag matching - INCREASED WEIGHT
      let tagMatches = 0;
      expandedQuery.forEach(word => {
        doc.tags.forEach(tag => {
          const lowerTag = tag.toLowerCase();
          if (lowerTag === word || lowerTag.includes(word) || word.includes(lowerTag)) {
            tagMatches++;
            score += 15; // Increased from 8
          }
        });
      });
      if (tagMatches > 0) {
        matchDetails.push(`tags:${tagMatches}`);
      }

      // 6. Semantic similarity using embeddings - INCREASED WEIGHT
      const queryEmbedding = createQueryEmbedding(expandedQuery, knowledgeBaseIndex!.vocabulary);
      const similarity = cosineSimilarity(queryEmbedding, docEntry.embeddings);
      if (similarity > 0.1) { // Only count meaningful similarity
        score += similarity * 35; // Increased from 20
        matchDetails.push(`similarity:${similarity.toFixed(2)}`);
      }

      // 7. Query Coverage Score - NEW: How much of the query is covered
      let queryCoverage = 0;
      const uniqueQueryWords = new Set(queryWords);
      uniqueQueryWords.forEach(word => {
        if (lowerContent.includes(word)) {
          queryCoverage += 1;
        }
      });
      const coverageRatio = queryCoverage / uniqueQueryWords.size;
      if (coverageRatio > 0) {
        score += coverageRatio * 30; // New scoring factor
        matchDetails.push(`coverage:${coverageRatio.toFixed(2)}`);
      }

      // 8. Term Proximity Bonus - NEW: Terms appearing close together
      let proximityScore = 0;
      if (queryWords.length > 1) {
        for (let i = 0; i < queryWords.length - 1; i++) {
          const word1 = queryWords[i];
          const word2 = queryWords[i + 1];
          // Look for words within 50 characters (more restrictive)
          const proximityPattern = new RegExp(`${word1}.{0,50}${word2}`, 'gi');
          const proximityMatches = (lowerContent.match(proximityPattern) || []).length;
          proximityScore += proximityMatches * 8; // New scoring factor
        }
      }
      if (proximityScore > 0) {
        score += proximityScore;
        matchDetails.push(`proximity:${proximityScore}`);
      }

      // 9. Section Headers Matching - NEW: Boost for matches in headers
      let headerMatches = 0;
      const headerRegex = /^#{1,6}\s+(.+)$/gm;
      let headerMatch;
      while ((headerMatch = headerRegex.exec(doc.content)) !== null) {
        const lowerHeader = headerMatch[1].toLowerCase();
        queryWords.forEach(word => {
          if (lowerHeader.includes(word)) {
            headerMatches++;
            score += 12; // New scoring factor
          }
        });
      }
      if (headerMatches > 0) {
        matchDetails.push(`headers:${headerMatches}`);
      }

      // 10. Code Examples Matching - NEW: Boost for technical content
      let codeMatches = 0;
      const codeBlockRegex = /```[\s\S]*?```|`[^`\n]+`/g;
      let codeMatch;
      while ((codeMatch = codeBlockRegex.exec(doc.content)) !== null) {
        const lowerCode = codeMatch[0].toLowerCase();
        queryWords.forEach(word => {
          if (lowerCode.includes(word)) {
            codeMatches++;
            score += 10; // New scoring factor
          }
        });
      }
      if (codeMatches > 0) {
        matchDetails.push(`code:${codeMatches}`);
      }

      // 11. List Items Matching - NEW: Boost for structured content
      let listMatches = 0;
      const listRegex = /^[\s]*[-*+]\s+(.+)$/gm;
      let listMatch;
      while ((listMatch = listRegex.exec(doc.content)) !== null) {
        const lowerList = listMatch[1].toLowerCase();
        queryWords.forEach(word => {
          if (lowerList.includes(word)) {
            listMatches++;
            score += 6; // New scoring factor
          }
        });
      }
      if (listMatches > 0) {
        matchDetails.push(`lists:${listMatches}`);
      }

      // 12. Content Density Score - NEW: Information-rich content
      const wordCount = doc.content.split(/\s+/).length;
      const uniqueWords = new Set(doc.content.toLowerCase().split(/\s+/));
      const densityRatio = uniqueWords.size / wordCount;
      if (densityRatio > 0.3) { // Good information density
        score += densityRatio * 15; // New scoring factor
        matchDetails.push(`density:${densityRatio.toFixed(2)}`);
      }

      // 13. Document Length Bonus - NEW: Substantial content
      if (wordCount > 500) score += 10;
      if (wordCount > 1000) score += 15;
      if (wordCount > 2000) score += 20;

      // 14. Filename Relevance - NEW: Source file indicates topic
      let filenameScore = 0;
      const lowerFilename = doc.source.toLowerCase();
      queryWords.forEach(word => {
        if (lowerFilename.includes(word)) {
          filenameScore += 8; // New scoring factor
        }
      });
      if (filenameScore > 0) {
        score += filenameScore;
        matchDetails.push(`filename:${filenameScore}`);
      }

      // 15. Temporal relevance boost for recent/current queries - ENHANCED
      if (hasTemporalQuery) {
        let temporalScore = 0;
        const temporalKeywords = ['recent', 'latest', 'new', 'current', 'modern', '2024', '2025', 'advances', 'breakthroughs', 'developments', 'trends', 'emerging', 'cutting-edge', 'state-of-the-art'];

        temporalKeywords.forEach(keyword => {
          if (lowerContent.includes(keyword)) {
            temporalScore += 20; // Increased from 15
          }
          if (lowerTitle.includes(keyword)) {
            temporalScore += 30; // Increased from 25
          }
        });

        // Boost for future applications or ongoing developments
        const futureTerms = ['future', 'emerging', 'evolving', 'advancing', 'progress', 'innovation', 'next-generation', 'upcoming'];
        futureTerms.forEach(term => {
          if (lowerContent.includes(term)) {
            temporalScore += 12; // Increased from 8
          }
        });

        if (temporalScore > 0) {
          score += temporalScore;
          matchDetails.push(`temporal:${temporalScore}`);
        }
      }

      // 16. Query Intent Analysis - NEW: Different scoring for different query types
      const intentScore = analyzeQueryIntent(queryWords, doc);
      if (intentScore > 0) {
        score += intentScore;
        matchDetails.push(`intent:${intentScore}`);
      }

      // 17. Cross-Reference Bonus - NEW: Documents that reference related topics
      let crossRefScore = 0;
      const relatedTerms = getRelatedTerms(queryWords);
      relatedTerms.forEach(term => {
        if (lowerContent.includes(term)) {
          crossRefScore += 5;
        }
      });
      if (crossRefScore > 0) {
        score += crossRefScore;
        matchDetails.push(`crossref:${crossRefScore}`);
      }

      // 18. Document quality boost - INCREASED WEIGHT
      const relevanceBoost = doc.relevance * 8; // Increased from 3
      score += relevanceBoost;

      // Only include results with meaningful matches
      if (score > 8) { // Lowered threshold from 5
        // Normalize score to be out of 100 (adjusted for actual max score ~1500-2000)
        const normalizedScore = Math.min(Math.round((score / 2000) * 100), 100);
        results.push({
          ...doc,
          searchScore: normalizedScore,
          matchDetails
        });
      }
    });

    // Sort by score and return top results
    const topResults = results
      .sort((a, b) => b.searchScore - a.searchScore)
      .slice(0, maxResults);

    const searchTime = Date.now() - startTime;
    console.log(`[Search] Indexed search completed in ${searchTime}ms - ${topResults.length} results`);
    topResults.forEach((result, i) => {
      console.log(`  ${i + 1}. ${result.title} (score: ${result.searchScore}) [${result.matchDetails.join(', ')}]`);
    });

    return topResults;

  } catch (error) {
    console.error('[Search] Error in indexed search:', error);
    // Fallback to basic search
    return searchDocumentsBasic(query, documents, maxResults);
  }
}

// Expand query terms for small knowledge bases
function expandQueryForSmallKb(queryWords: string[], index: KnowledgeBaseIndex): string[] {
  const expanded = new Set(queryWords);

  // Add synonyms and related terms for small KBs
  const synonymMap: { [key: string]: string[] } = {
    'ai': ['artificial intelligence', 'machine learning', 'neural networks', 'intelligent systems'],
    'ml': ['machine learning', 'artificial intelligence', 'algorithms', 'predictive models'],
    'data': ['data science', 'analytics', 'datasets', 'information'],
    'cloud': ['cloud computing', 'aws', 'azure', 'scalability', 'distributed'],
    'security': ['cybersecurity', 'infosec', 'encryption', 'threats', 'protection'],
    'web': ['web development', 'frontend', 'backend', 'javascript', 'html', 'css'],
    'mobile': ['mobile development', 'ios', 'android', 'react native', 'apps'],
    'database': ['data storage', 'sql', 'nosql', 'mongodb', 'postgresql'],
    'api': ['rest', 'graphql', 'web services', 'integration', 'microservices'],
    'devops': ['ci/cd', 'automation', 'deployment', 'monitoring', 'infrastructure']
  };

  queryWords.forEach(word => {
    const synonyms = synonymMap[word];
    if (synonyms) {
      synonyms.forEach(synonym => expanded.add(synonym));
    }
  });

  return Array.from(expanded);
}

// Create query embedding for similarity matching
function createQueryEmbedding(queryWords: string[], vocabulary: Set<string>): number[] {
  const embeddingSize = Math.min(50, vocabulary.size);
  const embedding = new Array(embeddingSize).fill(0);

  const vocabArray = Array.from(vocabulary);
  queryWords.forEach(word => {
    const index = vocabArray.indexOf(word);
    if (index >= 0 && index < embeddingSize) {
      embedding[index] = 1; // Simple binary embedding
    }
  });

  return embedding;
}

// Calculate cosine similarity between embeddings
function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Fallback basic search (original algorithm)
function searchDocumentsBasic(query: string, documents: KnowledgeDocument[], maxResults: number): KnowledgeDocument[] {
  // [Original search algorithm as fallback]
  const stopWords = new Set([
    'what', 'is', 'are', 'the', 'how', 'why', 'when', 'where', 'can', 'could', 'would', 'should',
    'do', 'does', 'did', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
    'with', 'by', 'from', 'about', 'search', 'find', 'tell', 'me', 'give', 'show', 'explain',
    'describe', 'want', 'know', 'need', 'help'
  ]);

  const queryWords = query.toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));

  if (queryWords.length === 0) return [];

  const results: (KnowledgeDocument & { searchScore: number })[] = [];

  documents.forEach(doc => {
    let score = 0;
    const lowerTitle = doc.title.toLowerCase();
    const lowerContent = doc.content.toLowerCase();

    queryWords.forEach(word => {
      if (lowerTitle.includes(word)) score += 10;
      if (lowerContent.includes(word)) score += 5;
    });

    if (score > 0) {
      // Normalize score to be out of 100 for consistency
      const normalizedScore = Math.min(Math.round((score / 50) * 100), 100); // Basic search max ~50
      results.push({ ...doc, searchScore: normalizedScore });
    }
  });

  return results
    .sort((a, b) => b.searchScore - a.searchScore)
    .slice(0, maxResults);
}

// GET endpoint for API information
export async function GET(request: NextRequest) {
  const documentsCount = fs.existsSync(KNOWLEDGE_BASE_PATH)
    ? fs.readdirSync(KNOWLEDGE_BASE_PATH).filter(f => f.endsWith('.md')).length
    : 0;

  // Check index status
  const indexStatus = knowledgeBaseIndex ? {
    isIndexed: true,
    indexedDocuments: knowledgeBaseIndex.totalDocuments,
    vocabularySize: knowledgeBaseIndex.vocabulary.size,
    averageDocLength: knowledgeBaseIndex.averageDocumentLength,
    indexAge: Date.now() - knowledgeBaseIndex.lastIndexed,
    indexTTL: CACHE_TTL
  } : {
    isIndexed: false,
    indexedDocuments: 0,
    vocabularySize: 0,
    averageDocLength: 0,
    indexAge: 0,
    indexTTL: CACHE_TTL
  };

  return NextResponse.json({
    service: 'Advanced Knowledge Base Retriever with Enhanced Scoring',
    version: '4.0.0',
    description: 'Optimized retriever for small knowledge bases (8-20 docs) with 18-factor scoring system, inverted indexing, TF-IDF, and semantic search',
    endpoints: {
      'POST /api/knowledge': 'Search indexed knowledge base with enhanced multi-factor scoring',
      'GET /api/knowledge': 'Get API information and index status'
    },
    features: [
      '18-factor multi-dimensional scoring algorithm',
      'Inverted index for instant term lookup',
      'Pre-computed TF-IDF scoring with 50% weight increase',
      'Document embeddings for semantic matching',
      'Query coverage and term proximity analysis',
      'Section headers, code examples, and list matching',
      'Content density and document length bonuses',
      'Temporal query detection and boosting',
      'Query intent analysis (how-to, definitions, comparisons)',
      'Cross-reference bonus for related topics',
      'Topic-based query expansion for small KBs',
      'Optimized for 8-20 document knowledge bases',
      'Content trimming and timeout protection'
    ],
    statistics: {
      documentsAvailable: documentsCount,
      knowledgeBasePath: 'knowledge-base/',
      lastUpdated: new Date().toISOString(),
      indexStatus
    },
    performance: {
      maxContentLength: MAX_CONTENT_LENGTH,
      searchTimeout: SEARCH_TIMEOUT,
      indexTTL: CACHE_TTL,
      maxQueryWords: 10,
      maxResults: MAX_RESULTS,
      optimalKbSize: '8-20 documents'
    },
    indexing: {
      supportsSmallKb: true,
      invertedIndexEnabled: true,
      tfidfPrecomputed: true,
      embeddingsEnabled: true,
      semanticMatching: true
    }
  });
}