# Prompt Versioning System Guide

## Overview

This guide demonstrates how to implement modular prompt templates with version management for the agentic AI system. This ensures maintainable, testable, and evolving LLM interactions.

## Prompt Architecture

### File Structure
```
src/lib/
├── prompts/
│   ├── index.ts              # Prompt manager and exports
│   ├── versions/             # Version-specific prompts
│   │   ├── v1/              # Version 1 prompts
│   │   │   ├── knowledge.ts  # Knowledge base prompts
│   │   │   ├── reasoning.ts  # Decision logic prompts
│   │   │   └── search.ts     # Web search prompts
│   │   └── v2/              # Version 2 prompts (future)
│   │       ├── knowledge.ts
│   │       ├── reasoning.ts
│   │       └── search.ts
│   └── types.ts             # TypeScript interfaces
```

## Prompt Templates

### Version 1 Prompts (v1/)

#### Knowledge Base Prompts (v1/knowledge.ts)
```typescript
export const KNOWLEDGE_BASE_PROMPTS = {
  // Primary knowledge processing prompt
  answerFromKnowledge: {
    version: "1.0",
    template: `You are an expert AI assistant with access to a curated knowledge base.

CONTEXT DOCUMENTS:
{knowledgeContext}

USER QUERY: {userQuery}

INSTRUCTIONS:
1. Analyze the provided knowledge base documents
2. Extract relevant information that directly answers the user's query
3. Synthesize information from multiple documents if needed
4. If information is incomplete, acknowledge the limitations
5. Provide accurate, helpful, and well-structured responses

RESPONSE FORMAT:
- Start with a clear, direct answer
- Include supporting details from the knowledge base
- Use bullet points or numbered lists for clarity
- Cite which documents provided the information
- If uncertain, state your confidence level

RESPONSE:`,
    requiredVariables: ["knowledgeContext", "userQuery"],
    category: "knowledge_processing"
  },

  // Educational content prompt
  educationalResponse: {
    version: "1.0", 
    template: `You are an educational AI tutor with access to comprehensive learning materials.

LEARNING MATERIALS:
{knowledgeContext}

STUDENT QUESTION: {userQuery}

TEACHING APPROACH:
1. Provide clear, beginner-friendly explanations
2. Use analogies and examples where helpful
3. Break down complex concepts into digestible parts
4. Include practical applications or real-world examples
5. Suggest follow-up learning topics

EDUCATIONAL RESPONSE:`,
    requiredVariables: ["knowledgeContext", "userQuery"],
    category: "educational"
  }
};
```

#### Reasoning Prompts (v1/reasoning.ts)
```typescript
export const REASONING_PROMPTS = {
  // Decision making for routing
  routingDecision: {
    version: "1.0",
    template: `You are a query routing specialist. Analyze the user query and available knowledge base to make an intelligent routing decision.

USER QUERY: {userQuery}
QUERY INTENT: {queryIntent}
KNOWLEDGE BASE CONFIDENCE: {confidence}%
TOP MATCHING DOCUMENTS: {topDocuments}

ANALYSIS CRITERIA:
1. Query Type Assessment:
   - Factual/Educational: Knowledge base preferred
   - Current Events: Web search required
   - Technical Documentation: Knowledge base preferred
   - Recent Developments: Web search required

2. Knowledge Base Coverage:
   - High confidence (>70%): Use knowledge base
   - Medium confidence (30-70%): Use knowledge base with web search supplement
   - Low confidence (<30%): Use web search

3. Temporal Signals:
   - Words like "recent", "latest", "current": Prefer web search
   - Fundamental concepts: Prefer knowledge base

ROUTING DECISION:
Based on the analysis above, I recommend: {recommendedPath}

REASONING: {routingReason}`,
    requiredVariables: ["userQuery", "queryIntent", "confidence", "topDocuments", "recommendedPath", "routingReason"],
    category: "routing"
  },

  // Intent classification
  intentAnalysis: {
    version: "1.0",
    template: `Analyze the user's query intent to optimize response generation.

USER QUERY: {userQuery}

INTENT CATEGORIES:
- FACTUAL: Seeking definitions, explanations, or factual information
- TUTORIAL: Looking for how-to guides or step-by-step instructions  
- CURRENT: Asking about recent events, news, or current developments
- COMPARISON: Comparing options, technologies, or approaches
- TROUBLESHOOTING: Solving problems or debugging issues

ANALYSIS:
Primary Intent: {primaryIntent}
Secondary Intent: {secondaryIntent}
Confidence: {intentConfidence}%

REASONING: {intentReasoning}`,
    requiredVariables: ["userQuery", "primaryIntent", "secondaryIntent", "intentConfidence", "intentReasoning"],
    category: "intent_analysis"
  }
};
```

#### Search Prompts (v1/search.ts)
```typescript
export const SEARCH_PROMPTS = {
  // Web search processing
  webSearchSynthesis: {
    version: "1.0",
    template: `You are a research analyst synthesizing web search results to answer user queries.

USER QUERY: {userQuery}
SEARCH RESULTS:
{searchResults}

SYNTHESIS INSTRUCTIONS:
1. Analyze all search results for relevant information
2. Identify the most credible and recent sources
3. Synthesize information into a coherent response
4. Include citations or source references
5. Note any conflicting information
6. Acknowledge if information is preliminary or evolving

RESPONSE STRUCTURE:
- Summary answer with key points
- Supporting details from multiple sources
- Source attribution
- Confidence level and any caveats

SYNTHESIZED RESPONSE:`,
    requiredVariables: ["userQuery", "searchResults"],
    category: "web_search"
  },

  // Current events processing
  currentEventsResponse: {
    version: "1.0",
    template: `You are a news analyst providing current information based on recent web search results.

USER QUERY: {userQuery}
RECENT SEARCH RESULTS:
{searchResults}
SEARCH DATE: {searchDate}

CURRENT EVENTS ANALYSIS:
1. Focus on the most recent and relevant information
2. Highlight key developments or changes
3. Provide context for understanding significance
4. Note the recency and reliability of sources
5. Include relevant background information

NEWS SUMMARY:`,
    requiredVariables: ["userQuery", "searchResults", "searchDate"],
    category: "current_events"
  }
};
```

### Prompt Manager (index.ts)
```typescript
import { KNOWLEDGE_BASE_PROMPTS } from './versions/v1/knowledge';
import { REASONING_PROMPTS } from './versions/v1/reasoning';
import { SEARCH_PROMPTS } from './versions/v1/search';
import { PromptTemplate, PromptCategory, PromptVersion } from './types';

export class PromptManager {
  private static instance: PromptManager;
  private currentVersion: PromptVersion = "v1";
  
  private promptLibrary = {
    v1: {
      knowledge: KNOWLEDGE_BASE_PROMPTS,
      reasoning: REASONING_PROMPTS, 
      search: SEARCH_PROMPTS
    }
    // v2: { ... } // Future versions
  };

  static getInstance(): PromptManager {
    if (!PromptManager.instance) {
      PromptManager.instance = new PromptManager();
    }
    return PromptManager.instance;
  }

  // Get a specific prompt template
  getPrompt(category: PromptCategory, promptName: string, version?: PromptVersion): PromptTemplate | null {
    const ver = version || this.currentVersion;
    const categoryPrompts = this.promptLibrary[ver]?.[category];
    return categoryPrompts?.[promptName] || null;
  }

  // Render a prompt with variables
  renderPrompt(category: PromptCategory, promptName: string, variables: Record<string, string>, version?: PromptVersion): string {
    const prompt = this.getPrompt(category, promptName, version);
    if (!prompt) {
      throw new Error(`Prompt not found: ${category}.${promptName} (version: ${version || this.currentVersion})`);
    }

    // Validate required variables
    const missing = prompt.requiredVariables.filter(var_ => !(var_ in variables));
    if (missing.length > 0) {
      throw new Error(`Missing required variables: ${missing.join(', ')}`);
    }

    // Replace variables in template
    let rendered = prompt.template;
    Object.entries(variables).forEach(([key, value]) => {
      rendered = rendered.replace(new RegExp(`{${key}}`, 'g'), value);
    });

    return rendered;
  }

  // List all available prompts
  listPrompts(version?: PromptVersion): Record<PromptCategory, string[]> {
    const ver = version || this.currentVersion;
    const versionPrompts = this.promptLibrary[ver];
    
    const result: Record<PromptCategory, string[]> = {} as any;
    Object.entries(versionPrompts).forEach(([category, prompts]) => {
      result[category as PromptCategory] = Object.keys(prompts);
    });
    
    return result;
  }

  // Get prompt statistics
  getPromptStats(version?: PromptVersion) {
    const ver = version || this.currentVersion;
    const prompts = this.listPrompts(ver);
    
    return {
      version: ver,
      totalPrompts: Object.values(prompts).flat().length,
      categories: Object.keys(prompts).length,
      promptsByCategory: Object.fromEntries(
        Object.entries(prompts).map(([cat, prompts]) => [cat, prompts.length])
      )
    };
  }

  // Switch version
  setVersion(version: PromptVersion): void {
    if (!(version in this.promptLibrary)) {
      throw new Error(`Version ${version} not available`);
    }
    this.currentVersion = version;
  }

  // Get current version
  getCurrentVersion(): PromptVersion {
    return this.currentVersion;
  }
}

// Export singleton instance
export const promptManager = PromptManager.getInstance();

// Export prompt categories for easy access
export { KNOWLEDGE_BASE_PROMPTS, REASONING_PROMPTS, SEARCH_PROMPTS };
```

### Type Definitions (types.ts)
```typescript
export type PromptVersion = "v1" | "v2" | "v3";
export type PromptCategory = "knowledge" | "reasoning" | "search";

export interface PromptTemplate {
  version: string;
  template: string;
  requiredVariables: string[];
  category: string;
  description?: string;
  author?: string;
  created?: string;
  lastModified?: string;
}

export interface PromptUsage {
  promptName: string;
  category: PromptCategory;
  version: PromptVersion;
  variables: Record<string, string>;
  timestamp: string;
  responseTime?: number;
  success: boolean;
  error?: string;
}

export interface PromptMetrics {
  totalUsage: number;
  successRate: number;
  averageResponseTime: number;
  mostUsedPrompts: { name: string; category: string; usage: number }[];
  errorRate: number;
}
```

## Usage Examples

### Basic Usage
```typescript
import { promptManager } from '@/lib/prompts';

// Render a knowledge base prompt
const knowledgePrompt = promptManager.renderPrompt(
  'knowledge',
  'answerFromKnowledge',
  {
    knowledgeContext: documents.map(d => d.content).join('\n\n'),
    userQuery: "What is artificial intelligence?"
  }
);

// Send to LLM
const response = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [{ role: "user", content: knowledgePrompt }]
});
```

### Advanced Usage with Version Control
```typescript
// Use a specific version
const v2Prompt = promptManager.renderPrompt(
  'reasoning',
  'routingDecision', 
  variables,
  'v2'  // Specify version
);

// List available prompts
const availablePrompts = promptManager.listPrompts();
console.log(availablePrompts);
// Output: { knowledge: ['answerFromKnowledge', 'educationalResponse'], ... }

// Get stats
const stats = promptManager.getPromptStats();
console.log(stats);
// Output: { version: 'v1', totalPrompts: 6, categories: 3, ... }
```

## Integration with n8n Workflow

### Node Configuration
In your n8n workflow nodes, reference prompts like this:

```javascript
// Controller Node
const promptManager = require('./lib/prompts').promptManager;

const routingPrompt = promptManager.renderPrompt(
  'reasoning',
  'routingDecision',
  {
    userQuery: $json.message,
    queryIntent: $json.metadata.intent,
    confidence: $json.metadata.confidence.toString(),
    topDocuments: $json.knowledgeContext.map(d => d.title).join(', '),
    recommendedPath: $json.metadata.shouldUseKB ? 'knowledge_base' : 'web_search',
    routingReason: $json.metadata.reason
  }
);

return { promptTemplate: routingPrompt };
```

### Message a Model Nodes
```javascript
// Knowledge Base LLM Node
const knowledgePrompt = promptManager.renderPrompt(
  'knowledge',
  'answerFromKnowledge',
  {
    knowledgeContext: $json.knowledgeContext.map(d => 
      `Title: ${d.title}\nContent: ${d.content}`
    ).join('\n\n---\n\n'),
    userQuery: $json.message
  }
);

// Web Search LLM Node  
const searchPrompt = promptManager.renderPrompt(
  'search',
  'webSearchSynthesis',
  {
    userQuery: $json.message,
    searchResults: $json.searchResults.map(r => 
      `Source: ${r.source}\nContent: ${r.content}`
    ).join('\n\n---\n\n')
  }
);
```

## Best Practices

### Version Management
1. **Semantic Versioning**: Use clear version numbers (v1, v2, etc.)
2. **Backward Compatibility**: Keep old versions for comparison
3. **Documentation**: Document changes between versions
4. **Testing**: Test prompts before deploying new versions

### Prompt Design
1. **Clear Instructions**: Be specific about desired output format
2. **Variable Validation**: Always validate required variables
3. **Error Handling**: Include fallback prompts for edge cases
4. **Performance**: Optimize prompt length for faster processing

### Monitoring
1. **Usage Tracking**: Log which prompts are used most
2. **Performance Metrics**: Track response times and success rates
3. **A/B Testing**: Compare prompt versions for effectiveness
4. **User Feedback**: Collect feedback on response quality

## Future Enhancements

### Planned Features
- **Dynamic Prompt Generation**: AI-generated prompts based on context
- **Multi-language Support**: Prompts in different languages
- **Personalization**: User-specific prompt customization
- **Analytics Dashboard**: Visual prompt performance metrics

### Version 2 Improvements
- Enhanced reasoning prompts with chain-of-thought
- More specialized prompts for different domains
- Improved error handling and fallback mechanisms
- Better integration with external tools and APIs

This prompt versioning system ensures your agentic AI pipeline has maintainable, testable, and evolving LLM interactions that can be easily updated and improved over time.