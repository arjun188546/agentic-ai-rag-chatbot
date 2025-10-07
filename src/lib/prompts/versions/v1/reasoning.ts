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
    category: "routing",
    description: "Primary routing decision prompt for query classification",
    created: "2024-01-01"
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
    category: "intent_analysis",
    description: "Intent classification prompt for query understanding",
    created: "2024-01-01"
  },

  // Confidence assessment
  confidenceEvaluation: {
    version: "1.0",
    template: `Evaluate the confidence level for answering a query based on available knowledge.

USER QUERY: {userQuery}
AVAILABLE KNOWLEDGE: {knowledgeContext}
SEARCH RESULTS: {searchResults}

CONFIDENCE FACTORS:
1. Knowledge Coverage: How well does available knowledge cover the query?
2. Information Recency: Is the information current enough for the query?
3. Information Completeness: Is there sufficient detail to provide a good answer?
4. Source Reliability: How reliable are the information sources?

CONFIDENCE ASSESSMENT:
Overall Confidence: {confidenceLevel}%
Primary Factors: {confidenceFactors}
Recommendations: {recommendations}`,
    requiredVariables: ["userQuery", "knowledgeContext", "searchResults", "confidenceLevel", "confidenceFactors", "recommendations"],
    category: "confidence",
    description: "Confidence evaluation prompt for response quality assessment",
    created: "2024-01-01"
  }
};