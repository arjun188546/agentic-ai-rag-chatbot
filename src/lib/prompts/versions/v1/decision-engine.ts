export const DECISION_ENGINE_PROMPTS = {
  // Primary routing decision with multiple paths
  intelligentRouting: {
    version: "1.0",
    template: `You are an intelligent routing agent for an AI chatbot system. Analyze the user query and available context to determine the optimal processing path.

QUERY ANALYSIS:
User Query: "{userQuery}"
Query Intent: {queryIntent}
Query Complexity: {queryComplexity}
Time Sensitivity: {timeSensitivity}

AVAILABLE RESOURCES:
Knowledge Base Confidence: {kbConfidence}%
Knowledge Base Documents: {kbDocuments}
Web Search Capability: Available
Processing History: {processingHistory}

ROUTING OPTIONS:
1. KNOWLEDGE_BASE: Use internal knowledge base only
2. WEB_SEARCH: Use web search only
3. HYBRID: Combine knowledge base + web search
4. ESCALATE: Query too complex, needs human intervention
5. CLARIFICATION: Query needs clarification from user

DECISION CRITERIA:
- Knowledge Base Confidence > 75%: Consider KNOWLEDGE_BASE
- Time-sensitive queries (recent, latest, current): Favor WEB_SEARCH
- Complex multi-part queries: Consider HYBRID
- Ambiguous queries: Consider CLARIFICATION
- Technical errors/debugging: May need ESCALATE

ROUTING DECISION:
Primary Path: {primaryPath}
Fallback Path: {fallbackPath}
Confidence: {decisionConfidence}%

REASONING:
{routingReasoning}

EXECUTION STRATEGY:
{executionStrategy}`,
    requiredVariables: [
      "userQuery", "queryIntent", "queryComplexity", "timeSensitivity",
      "kbConfidence", "kbDocuments", "processingHistory",
      "primaryPath", "fallbackPath", "decisionConfidence", 
      "routingReasoning", "executionStrategy"
    ],
    category: "decision_engine",
    description: "Intelligent routing decision with multiple path options",
    created: "2024-01-01"
  },

  // Quality assessment and re-routing
  qualityAssessment: {
    version: "1.0", 
    template: `Evaluate the quality of the generated response and determine if re-routing is needed.

ORIGINAL QUERY: "{userQuery}"
PROCESSING PATH: {processingPath}
GENERATED RESPONSE: "{generatedResponse}"

QUALITY METRICS:
1. Relevance: How well does the response address the query?
2. Completeness: Are all aspects of the query covered?
3. Accuracy: Is the information factually correct?
4. Timeliness: Is the information current enough?
5. Clarity: Is the response clear and understandable?

ASSESSMENT:
Overall Quality Score: {qualityScore}/100
Relevance Score: {relevanceScore}/100
Completeness Score: {completenessScore}/100
Accuracy Score: {accuracyScore}/100
Timeliness Score: {timelinessScore}/100
Clarity Score: {clarityScore}/100

RE-ROUTING DECISION:
Should Re-route: {shouldReRoute}
Alternative Path: {alternativePath}
Confidence in Decision: {assessmentConfidence}%

REASONING:
{qualityReasoning}

RECOMMENDATIONS:
{qualityRecommendations}`,
    requiredVariables: [
      "userQuery", "processingPath", "generatedResponse",
      "qualityScore", "relevanceScore", "completenessScore", 
      "accuracyScore", "timelinessScore", "clarityScore",
      "shouldReRoute", "alternativePath", "assessmentConfidence",
      "qualityReasoning", "qualityRecommendations"
    ],
    category: "quality_assessment",
    description: "Response quality evaluation and re-routing decisions",
    created: "2024-01-01"
  },

  // Multi-step planning
  stepPlanning: {
    version: "1.0",
    template: `Plan the optimal processing strategy for a complex query that may require multiple steps.

QUERY: "{userQuery}"
QUERY TYPE: {queryType}
COMPLEXITY LEVEL: {complexityLevel}

AVAILABLE TOOLS:
- Knowledge Base Search
- Web Search
- Data Analysis
- Code Generation
- Document Retrieval

STEP-BY-STEP PLAN:

Step 1: {step1}
- Tool: {step1Tool}
- Purpose: {step1Purpose}
- Expected Output: {step1Output}

Step 2: {step2}
- Tool: {step2Tool}
- Purpose: {step2Purpose}
- Expected Output: {step2Output}

Step 3: {step3}
- Tool: {step3Tool}
- Purpose: {step3Purpose}
- Expected Output: {step3Output}

EXECUTION STRATEGY:
Sequential vs Parallel: {executionMode}
Estimated Time: {estimatedTime}
Success Probability: {successProbability}%

FALLBACK PLAN:
If Step 1 fails: {fallback1}
If Step 2 fails: {fallback2}
If Overall approach fails: {overallFallback}

CONFIDENCE: {planConfidence}%`,
    requiredVariables: [
      "userQuery", "queryType", "complexityLevel",
      "step1", "step1Tool", "step1Purpose", "step1Output",
      "step2", "step2Tool", "step2Purpose", "step2Output", 
      "step3", "step3Tool", "step3Purpose", "step3Output",
      "executionMode", "estimatedTime", "successProbability",
      "fallback1", "fallback2", "overallFallback", "planConfidence"
    ],
    category: "planning",
    description: "Multi-step processing plan for complex queries",
    created: "2024-01-01"
  }
};