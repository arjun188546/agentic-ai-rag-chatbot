import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Interfaces for the API
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatRequest {
  message: string;
  conversationHistory: ChatMessage[];
}

interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  tags: string[];
  source: string;
  relevance: number;
  searchScore?: number;
}

interface N8nPayload {
  message: string;
  conversationHistory: ChatMessage[];
  timestamp: string;
  sessionId: string;
  knowledgeContext: KnowledgeDocument[];
  searchMetadata: {
    documentsSearched: number;
    resultsFound: number;
    searchTime: number;
    topScore: number;
  };
}

interface ChatResponse {
  response: string;
  steps?: string[];
  toolCalls?: string[];
  latency: number;
  success: boolean;
  error?: string;
}

// Configuration
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook-test/chat';
const API_TIMEOUT = parseInt(process.env.API_TIMEOUT || '30000'); // 30 seconds default
const KNOWLEDGE_BASE_PATH = path.join(process.cwd(), 'knowledge-base');

export async function POST(request: NextRequest): Promise<NextResponse<ChatResponse>> {
  const startTime = Date.now();

  try {
    // Parse the request body
    const body: ChatRequest = await request.json();

    // Validate the request
    if (!body.message || typeof body.message !== 'string') {
      return NextResponse.json(
        {
          response: 'Please provide a valid message.',
          latency: Date.now() - startTime,
          success: false,
          error: 'Invalid message format'
        },
        { status: 400 }
      );
    }

    console.log(`[Chat API] Processing: "${body.message.substring(0, 50)}..."`);

    // 📚 STEP 1: Simple Knowledge Base Search
    const searchResults = await searchKnowledgeBase(body.message);
    const topScore = searchResults.length > 0 ? searchResults[0].searchScore || 0 : 0;
    
    console.log(`[Chat API] KB Search completed. Top score: ${topScore}`);

    // 📤 STEP 2: Send Context + Message to n8n
    const n8nPayload: N8nPayload = {
      message: body.message.trim(),
      conversationHistory: body.conversationHistory || [],
      timestamp: new Date().toISOString(),
      sessionId: generateSessionId(request),
      knowledgeContext: searchResults.slice(0, 3), // Send top 3 documents
      searchMetadata: {
        documentsSearched: await getTotalDocuments(),
        resultsFound: searchResults.length,
        searchTime: Date.now() - startTime,
        topScore: topScore
      }
    };

    console.log(`[Chat API] Sending knowledge-enriched payload to n8n...`);

    // Use single webhook URL
    const webhookUrl = N8N_WEBHOOK_URL;
    console.log(`[Chat API] Using webhook: ${webhookUrl}`);

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    try {
      // Send request to n8n webhook
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Agentic-AI-Frontend/1.0',
        },
        body: JSON.stringify(n8nPayload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`n8n webhook returned ${response.status}: ${response.statusText}`);
      }

      const n8nResult: Record<string, unknown> = await response.json(); // Use Record to handle different response formats
      const processingTime = Date.now() - startTime;

      console.log(`[Chat API] Received response from n8n in ${processingTime}ms`);
      console.log(`[Chat API] n8n raw response:`, JSON.stringify(n8nResult).substring(0, 200) + '...');

      // Enhanced response parsing to handle different n8n response formats
      let finalResponse = '';
      let steps: string[] = [];
      let toolCalls: string[] = [];
      let latency = processingTime;
      let metadata: Record<string, unknown> = {};

      // Handle array response (if n8n returns an array)
      let responseData: Record<string, unknown> = n8nResult;
      if (Array.isArray(n8nResult) && n8nResult.length > 0) {
        responseData = n8nResult[0] as Record<string, unknown>;
        console.log(`[Chat API] Using first array element:`, JSON.stringify(responseData).substring(0, 200) + '...');
      }

      // Try to get response from different possible fields
      if (typeof responseData?.response === 'string') {
        finalResponse = responseData.response as string;
        console.log(`[Chat API] Found response in 'response' field`);
      } else if (typeof responseData === 'string') {
        finalResponse = responseData;
        console.log(`[Chat API] Using string response directly`);
      } else if (typeof responseData?.message === 'string') {
        finalResponse = responseData.message as string;
        console.log(`[Chat API] Found response in 'message' field`);
      } else if (typeof responseData?.content === 'string') {
        finalResponse = responseData.content as string;
        console.log(`[Chat API] Found response in 'content' field`);
      } else {
        console.warn('[Chat API] Could not find response in n8n result:', Object.keys(responseData || {}));
        // Log the actual structure for debugging
        console.log('[Chat API] Full response structure:', JSON.stringify(responseData, null, 2));
        finalResponse = 'I apologize, but I was unable to generate a response.';
      }

      // Get other fields
      steps = Array.isArray(responseData?.steps) ? responseData.steps as string[] : [
        'Message received',
        'Knowledge base search completed',
        'AI processing completed'
      ];

      toolCalls = Array.isArray(responseData?.toolCalls) ? responseData.toolCalls as string[] : [
        'knowledge_base_search',
        'llm_reasoning'
      ];

      latency = typeof responseData?.latency === 'number' ? responseData.latency as number : processingTime;
      metadata = responseData?.metadata as Record<string, unknown> || {};

      console.log(`[Chat API] Final response length: ${finalResponse.length} characters`);
      console.log(`[Chat API] Response preview: ${finalResponse.substring(0, 100)}...`);

      // Return formatted response
      return NextResponse.json({
        response: finalResponse,
        steps: steps,
        toolCalls: toolCalls,
        latency: latency,
        success: true,
        metadata: {
          contextSource: 'simple_kb_search',
          documentsUsed: searchResults.length,
          processingTime: processingTime,
          n8nMetadata: metadata,
          kbScore: topScore
        }
      });

    } catch (fetchError) {
      clearTimeout(timeoutId);

      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('[Chat API] Request timeout');
        return NextResponse.json(
          {
            response: 'Sorry, your request timed out. Please try again with a shorter message.',
            latency: Date.now() - startTime,
            success: false,
            error: 'Request timeout'
          },
          { status: 408 }
        );
      }

      console.error('[Chat API] n8n webhook error:', fetchError);

      // Check if n8n is available
      if (fetchError instanceof TypeError && fetchError.message.includes('fetch')) {
        return NextResponse.json(
          {
            response: 'The AI service is currently unavailable. Please check that n8n is running and the webhook URL is correct.',
            latency: Date.now() - startTime,
            success: false,
            error: 'Service unavailable'
          },
          { status: 503 }
        );
      }

      throw fetchError;
    }

  } catch (error) {
    console.error('[Chat API] Unexpected error:', error);

    return NextResponse.json(
      {
        response: 'An unexpected error occurred. Please try again.',
        latency: Date.now() - startTime,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Handle GET requests with API information
export async function GET() {
  return NextResponse.json({
    service: 'Agentic AI Chat API',
    version: '1.0.0',
    description: 'Handles chat requests by searching documents first, then forwarding to n8n workflows',
    endpoints: {
      POST: '/api/chat - Send a chat message',
    },
    configuration: {
      n8nWebhookUrl: N8N_WEBHOOK_URL,
      timeout: `${API_TIMEOUT}ms`,
      knowledgeBasePath: 'knowledge-base/',
      workflowType: 'single_workflow'
    },
    timestamp: new Date().toISOString(),
  });
}

// 📚 Knowledge Base Search Functions

// Load all documents from knowledge-base folder
async function loadKnowledgeBaseDocuments(): Promise<KnowledgeDocument[]> {
  const documents: KnowledgeDocument[] = [];

  try {
    // Check if knowledge base directory exists
    if (!fs.existsSync(KNOWLEDGE_BASE_PATH)) {
      console.warn('[Knowledge] Knowledge base directory not found');
      return documents;
    }

    // Read all markdown files
    const files = fs.readdirSync(KNOWLEDGE_BASE_PATH)
      .filter(file => file.endsWith('.md'))
      .sort();

    for (const file of files) {
      try {
        const filePath = path.join(KNOWLEDGE_BASE_PATH, file);
        const content = fs.readFileSync(filePath, 'utf-8');

        // Parse document
        const doc = parseMarkdownDocument(content, file);
        if (doc) {
          documents.push(doc);
        }
      } catch (error) {
        console.error(`[Knowledge] Error loading ${file}:`, error);
      }
    }

    return documents;

  } catch (error) {
    console.error('[Knowledge] Error loading knowledge base:', error);
    return documents;
  }
}

// Dynamic Search Algorithm Components

interface DocumentVector {
  id: string;
  title: string;
  content: string;
  tags: string[];
  tfidfVector: Map<string, number>;
  documentLength: number;
  termFrequency: Map<string, number>;
}

interface QueryVector {
  terms: string[];
  weights: Map<string, number>;
  expandedTerms: string[];
}

class DynamicSearchEngine {
  private documents: DocumentVector[] = [];
  private idfScores: Map<string, number> = new Map();
  private totalDocuments = 0;
  private averageDocumentLength = 0;

  // Term expansion mappings for query enhancement
  private termExpansions: Map<string, string[]> = new Map([
    ['ai', ['artificial intelligence', 'machine learning', 'neural networks', 'deep learning']],
    ['machine learning', ['ml', 'artificial intelligence', 'algorithms', 'data science', 'predictive models']],
    ['data science', ['analytics', 'statistics', 'data analysis', 'machine learning', 'big data']],
    ['cloud', ['cloud computing', 'aws', 'azure', 'gcp', 'scalability', 'distributed systems']],
    ['security', ['cybersecurity', 'infosec', 'encryption', 'authentication', 'threats']],
    ['web', ['web development', 'frontend', 'backend', 'javascript', 'html', 'css']],
    ['mobile', ['mobile development', 'ios', 'android', 'react native', 'flutter']],
    ['database', ['data storage', 'sql', 'nosql', 'mongodb', 'postgresql']],
    ['api', ['rest', 'graphql', 'web services', 'integration', 'microservices']],
    ['devops', ['ci/cd', 'automation', 'deployment', 'monitoring', 'infrastructure']],
  ]);

  constructor() {}

  // Initialize the search engine with documents
  async initialize(docs: KnowledgeDocument[]): Promise<void> {
    this.totalDocuments = docs.length;
    this.documents = docs.map(doc => this.createDocumentVector(doc));

    // Calculate IDF scores
    this.calculateIDF();

    // Calculate average document length for BM25
    this.averageDocumentLength = this.documents.reduce((sum, doc) => sum + doc.documentLength, 0) / this.totalDocuments;

    console.log(`[Dynamic Search] Initialized with ${this.totalDocuments} documents`);
  }

  // Create TF-IDF vector for a document
  private createDocumentVector(doc: KnowledgeDocument): DocumentVector {
    const content = `${doc.title} ${doc.content}`.toLowerCase();
    const words = this.tokenize(content);
    const termFrequency = new Map<string, number>();

    // Calculate term frequency
    words.forEach(word => {
      termFrequency.set(word, (termFrequency.get(word) || 0) + 1);
    });

    // Create TF-IDF vector (will be populated after IDF calculation)
    const tfidfVector = new Map<string, number>();

    return {
      id: doc.id,
      title: doc.title,
      content: doc.content,
      tags: doc.tags,
      tfidfVector,
      documentLength: words.length,
      termFrequency
    };
  }

  // Tokenize text into words
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2)
      .filter(word => !this.isStopWord(word));
  }

  // Check if word is a stop word
  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does',
      'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that',
      'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us',
      'them', 'my', 'your', 'his', 'its', 'our', 'their', 'what', 'which', 'who', 'when',
      'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other',
      'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very'
    ]);
    return stopWords.has(word);
  }

  // Calculate Inverse Document Frequency
  private calculateIDF(): void {
    const termDocumentCount = new Map<string, number>();

    // Count documents containing each term
    this.documents.forEach(doc => {
      const uniqueTerms = new Set(doc.termFrequency.keys());
      uniqueTerms.forEach(term => {
        termDocumentCount.set(term, (termDocumentCount.get(term) || 0) + 1);
      });
    });

    // Calculate IDF for each term
    termDocumentCount.forEach((docCount, term) => {
      const idf = Math.log(this.totalDocuments / (1 + docCount));
      this.idfScores.set(term, idf);
    });

    // Populate TF-IDF vectors
    this.documents.forEach(doc => {
      doc.termFrequency.forEach((tf, term) => {
        const idf = this.idfScores.get(term) || 0;
        const tfidf = (tf / doc.documentLength) * idf;
        doc.tfidfVector.set(term, tfidf);
      });
    });
  }

  // Expand query with related terms
  private expandQuery(query: string): string[] {
    const originalTerms = this.tokenize(query);
    const expandedTerms = new Set(originalTerms);

    // Add expanded terms
    originalTerms.forEach(term => {
      const expansions = this.termExpansions.get(term);
      if (expansions) {
        expansions.forEach(expanded => expandedTerms.add(expanded));
      }
    });

    return Array.from(expandedTerms);
  }

  // Create query vector
  private createQueryVector(query: string): QueryVector {
    const originalTerms = this.tokenize(query);
    const expandedTerms = this.expandQuery(query);

    const weights = new Map<string, number>();

    // Weight original terms higher than expanded terms
    originalTerms.forEach(term => {
      const idf = this.idfScores.get(term) || 0;
      weights.set(term, idf * 1.5); // Boost original terms
    });

    // Add expanded terms with lower weight
    expandedTerms.forEach(term => {
      if (!weights.has(term)) {
        const idf = this.idfScores.get(term) || 0;
        weights.set(term, idf * 0.7); // Lower weight for expanded terms
      }
    });

    return {
      terms: originalTerms,
      weights,
      expandedTerms
    };
  }

  // Calculate BM25 score
  private calculateBM25Score(queryVector: QueryVector, doc: DocumentVector): number {
    const k1 = 1.5; // Term frequency saturation
    const b = 0.75; // Length normalization

    let score = 0;

    queryVector.weights.forEach((weight, term) => {
      const tf = doc.termFrequency.get(term) || 0;
      const idf = this.idfScores.get(term) || 0;

      if (tf > 0 && idf > 0) {
        const numerator = tf * (k1 + 1);
        const denominator = tf + k1 * (1 - b + b * (doc.documentLength / this.averageDocumentLength));
        score += idf * (numerator / denominator);
      }
    });

    return score;
  }

  // Calculate cosine similarity between query and document
  private calculateCosineSimilarity(queryVector: QueryVector, doc: DocumentVector): number {
    let dotProduct = 0;
    let queryMagnitude = 0;
    let docMagnitude = 0;

    // Calculate dot product
    queryVector.weights.forEach((queryWeight, term) => {
      const docWeight = doc.tfidfVector.get(term) || 0;
      dotProduct += queryWeight * docWeight;
    });

    // Calculate magnitudes
    queryVector.weights.forEach(weight => {
      queryMagnitude += weight * weight;
    });

    doc.tfidfVector.forEach(weight => {
      docMagnitude += weight * weight;
    });

    queryMagnitude = Math.sqrt(queryMagnitude);
    docMagnitude = Math.sqrt(docMagnitude);

    if (queryMagnitude === 0 || docMagnitude === 0) {
      return 0;
    }

    return dotProduct / (queryMagnitude * docMagnitude);
  }

  // Calculate contextual relevance score
  private calculateContextualScore(queryVector: QueryVector, doc: DocumentVector): number {
    let score = 0;

    // Title matching boost
    const titleWords = this.tokenize(doc.title);
    const titleMatches = queryVector.terms.filter(term => titleWords.includes(term)).length;
    score += titleMatches * 20; // High boost for title matches

    // Tag matching boost
    const tagMatches = queryVector.terms.filter(term =>
      doc.tags.some(tag => tag.toLowerCase().includes(term) || term.includes(tag.toLowerCase()))
    ).length;
    score += tagMatches * 15; // Boost for tag matches

    // Exact phrase matching in content
    const content = doc.content.toLowerCase();
    queryVector.terms.forEach(term => {
      if (content.includes(term)) {
        score += 5;
      }
    });

    return score;
  }

  // Search documents using dynamic algorithm
  async search(query: string, maxResults: number = 5): Promise<KnowledgeDocument[]> {
    if (this.documents.length === 0) {
      console.log('[Dynamic Search] No documents available');
      return [];
    }

    const queryVector = this.createQueryVector(query);
    console.log(`[Dynamic Search] Query terms: ${queryVector.terms.join(', ')}`);
    console.log(`[Dynamic Search] Expanded terms: ${queryVector.expandedTerms.slice(0, 10).join(', ')}...`);

    const results: Array<{ doc: DocumentVector; score: number; bm25Score: number; cosineScore: number; contextualScore: number }> = [];

    // Score each document
    this.documents.forEach(doc => {
      const bm25Score = this.calculateBM25Score(queryVector, doc);
      const cosineScore = this.calculateCosineSimilarity(queryVector, doc);
      const contextualScore = this.calculateContextualScore(queryVector, doc);

      // Combine scores with weights
      const combinedScore = (bm25Score * 0.4) + (cosineScore * 0.4) + (contextualScore * 0.2);

      results.push({
        doc,
        score: combinedScore,
        bm25Score,
        cosineScore,
        contextualScore
      });
    });

    // Sort by combined score and return top results
    const topResults = results
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults)
      .map(result => ({
        id: result.doc.id,
        title: result.doc.title,
        content: result.doc.content,
        tags: result.doc.tags,
        source: result.doc.id, // Use id as source since DocumentVector doesn't have source
        relevance: 0.5, // Default relevance
        searchScore: Math.min(Math.round((result.score / 10) * 100), 100) // Normalize to 0-100 scale
      } as KnowledgeDocument & { searchScore: number }));

    console.log(`[Dynamic Search] Found ${topResults.length} results for "${query}"`);
    topResults.forEach((result, i) => {
      console.log(`  ${i+1}. ${result.title} (score: ${result.searchScore.toFixed(3)})`);
    });

    return topResults;
  }
}

// Global search engine instance
let dynamicSearchEngine: DynamicSearchEngine | null = null;

// Initialize dynamic search engine
async function initializeDynamicSearch(): Promise<void> {
  if (!dynamicSearchEngine) {
    dynamicSearchEngine = new DynamicSearchEngine();
    const documents = await loadKnowledgeBaseDocuments();
    await dynamicSearchEngine.initialize(documents);
  }
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
    console.error(`[Knowledge] Error parsing ${filename}:`, error);
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

// Simple search function
async function searchKnowledgeBase(query: string): Promise<KnowledgeDocument[]> {
  try {
    // Initialize search engine if needed
    await initializeDynamicSearch();

    if (!dynamicSearchEngine) {
      console.error('[Search] Failed to initialize search engine');
      return [];
    }

    // Perform search
    const results = await dynamicSearchEngine.search(query, 5);
    return results;

  } catch (error) {
    console.error('[Search] Error searching knowledge base:', error);
    return [];
  }
}

// Get total number of documents
async function getTotalDocuments(): Promise<number> {
  try {
    if (!fs.existsSync(KNOWLEDGE_BASE_PATH)) {
      return 0;
    }

    const files = fs.readdirSync(KNOWLEDGE_BASE_PATH)
      .filter(file => file.endsWith('.md'));

    return files.length;
  } catch (error) {
    console.error('[Knowledge] Error counting documents:', error);
    return 0;
  }
}

// Utility functions
function generateSessionId(request: NextRequest): string {
  // Simple session ID generation based on IP and timestamp
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
  return `session_${Buffer.from(`${ip}_${Date.now()}`).toString('base64').substring(0, 16)}`;
}