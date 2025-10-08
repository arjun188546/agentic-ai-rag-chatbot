# Enhanced n8n Workflow with LLM Decision Engine

## New Architecture Overview

```
Webhook → LLM Analyzer → LLM Router → [Multiple Paths] → Quality Checker → Response
```

## Node Configuration Guide

### 1. **LLM Analyzer Node** (Replaces Controller)
**Type**: OpenAI Chat Model
**Purpose**: Analyze query and extract decision factors

**Prompt Configuration**:
```json
{
  "model": "gpt-4",
  "temperature": 0.1,
  "systemMessage": "You are a query analysis specialist. Extract key factors for routing decisions.",
  "userMessage": `Analyze this query and extract decision factors:

Query: {{ $json.message }}
Context: {{ $json.knowledgeContext }}

Extract:
1. Intent (factual/current/tutorial/comparison/troubleshooting)
2. Complexity (simple/medium/complex)
3. Time sensitivity (none/low/medium/high)
4. Knowledge base relevance (0-100%)
5. Required tools (list)

Return as JSON:
{
  "intent": "",
  "complexity": "",
  "timeSensitivity": "",
  "kbRelevance": 0,
  "requiredTools": [],
  "analysisConfidence": 0
}`
}
```

### 2. **LLM Router Node** (Replaces If Node)
**Type**: OpenAI Chat Model  
**Purpose**: Make intelligent routing decisions

**Prompt Configuration**:
```json
{
  "model": "gpt-4",
  "temperature": 0.1,
  "systemMessage": "You are a routing decision specialist. Choose optimal processing path.",
  "userMessage": `Make routing decision:

Query: {{ $json.message }}
Analysis: {{ $('LLM Analyzer').item.json.choices[0].message.content }}
Available Paths: KNOWLEDGE_BASE, WEB_SEARCH, HYBRID, ESCALATE, CLARIFICATION

Decision Rules:
- KB relevance >75% + factual intent = KNOWLEDGE_BASE
- Time sensitive + recent topics = WEB_SEARCH  
- Complex multi-part = HYBRID
- Unclear intent = CLARIFICATION
- Technical debugging = ESCALATE

Return JSON:
{
  "primaryPath": "",
  "fallbackPath": "",
  "confidence": 0,
  "reasoning": "",
  "executionStrategy": ""
}`
}
```

### 3. **Switch Node** (Multi-Path Router)
**Type**: Switch
**Purpose**: Route to different processing paths

**Routing Logic**:
```javascript
// Parse LLM decision
const decision = JSON.parse($input.item.json.choices[0].message.content);

// Route based on primary path
switch(decision.primaryPath) {
  case 'KNOWLEDGE_BASE':
    return 0; // Route to KB processing
  case 'WEB_SEARCH':
    return 1; // Route to web search
  case 'HYBRID':
    return 2; // Route to hybrid processing
  case 'ESCALATE':
    return 3; // Route to escalation
  case 'CLARIFICATION':
    return 4; // Route to clarification request
  default:
    return 1; // Default to web search
}
```

### 4. **Processing Paths**

#### Path 0: Knowledge Base Processing
```json
{
  "name": "KB Processor",
  "type": "OpenAI Chat Model",
  "prompt": "Process using knowledge base context only: {{ $json.knowledgeContext }}"
}
```

#### Path 1: Web Search Processing
```json
{
  "name": "Web Search Processor", 
  "type": "HTTP Request",
  "method": "GET",
  "url": "{{ $json.searchUrl }}",
  "followupLLM": true
}
```

#### Path 2: Hybrid Processing
```json
{
  "name": "Hybrid Processor",
  "type": "Merge",
  "waitForAll": true,
  "inputs": ["KB_Result", "Web_Result"]
}
```

#### Path 3: Escalation Handler
```json
{
  "name": "Escalation Handler",
  "type": "Webhook",
  "url": "{{ $env.ESCALATION_WEBHOOK }}",
  "method": "POST"
}
```

#### Path 4: Clarification Request
```json
{
  "name": "Clarification Generator",
  "type": "OpenAI Chat Model",
  "prompt": "Generate clarifying questions for: {{ $json.message }}"
}
```

### 5. **Quality Checker Node**
**Type**: OpenAI Chat Model
**Purpose**: Evaluate response quality and trigger re-routing

**Prompt Configuration**:
```json
{
  "model": "gpt-4",
  "temperature": 0.1,
  "systemMessage": "Evaluate response quality and determine if re-routing needed.",
  "userMessage": `Evaluate this response:

Original Query: {{ $json.originalQuery }}
Processing Path: {{ $json.processingPath }}
Generated Response: {{ $json.generatedResponse }}

Rate quality (0-100) for:
- Relevance
- Completeness  
- Accuracy
- Timeliness
- Clarity

Return JSON:
{
  "overallQuality": 0,
  "relevance": 0,
  "completeness": 0,
  "accuracy": 0,
  "timeliness": 0,
  "clarity": 0,
  "shouldReRoute": false,
  "alternativePath": "",
  "reasoning": ""
}`
}
```

### 6. **Re-routing Logic** 
**Type**: If Node
**Purpose**: Decide if re-routing needed

**Condition**:
```javascript
// Parse quality assessment
const quality = JSON.parse($input.item.json.choices[0].message.content);

// Re-route if quality is low
return quality.overallQuality < 70 && quality.shouldReRoute;
```

## Implementation Steps

### Step 1: Update Existing Workflow
1. **Replace Controller node** with LLM Analyzer
2. **Replace If node** with LLM Router + Switch combination
3. **Add Quality Checker** after response generation
4. **Add Re-routing logic** for quality control

### Step 2: Configure LLM Nodes
1. **Set OpenAI API keys** in n8n credentials
2. **Configure prompts** for each LLM node
3. **Set temperature settings** (0.1 for consistency)
4. **Test prompt responses** individually

### Step 3: Add New Processing Paths
1. **Create Hybrid path** that merges KB + Web results
2. **Add Escalation path** for complex queries
3. **Add Clarification path** for ambiguous queries
4. **Configure timeout handling** for each path

### Step 4: Implement Quality Control
1. **Add Quality Checker** after all processing paths
2. **Configure re-routing logic** for low-quality responses
3. **Set quality thresholds** (70% minimum)
4. **Add maximum retry limit** (2 re-routes max)

## Testing Strategy

### Test Cases
1. **Simple factual queries** → Should route to KB
2. **Current events queries** → Should route to Web Search
3. **Complex multi-part queries** → Should route to Hybrid
4. **Ambiguous queries** → Should request clarification
5. **Technical debugging** → Should escalate

### Quality Metrics
- **Routing Accuracy**: 90%+ correct path selection
- **Response Quality**: 80%+ quality scores
- **Response Time**: <10s for simple, <30s for complex
- **Re-routing Rate**: <20% of queries need re-routing

## Benefits of LLM-Based Routing

### 1. **Intelligent Decision Making**
- Context-aware routing decisions
- Confidence-based fallback strategies
- Adaptive learning from query patterns

### 2. **Quality Assurance**
- Automatic response quality evaluation
- Self-correction through re-routing
- Continuous improvement feedback loop

### 3. **Flexibility**
- Easy to add new processing paths
- Configurable decision criteria
- Prompt-based logic updates

### 4. **Transparency**
- Clear reasoning for routing decisions
- Detailed execution strategies
- Comprehensive logging for analysis

This enhanced architecture transforms your n8n workflow from a simple if-then routing system into an intelligent, self-evaluating decision engine that can adapt to query complexity and optimize response quality.