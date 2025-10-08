# n8n Workflow Architecture - LLM Decision Engine

## Overview

This document describes the **LLM-powered n8n workflow** for the Agentic AI Chatbot system. The workflow uses OpenAI models to make intelligent routing decisions based on knowledge base scores, replacing simple conditional logic with AI reasoning.

## Current Workflow Architecture (LLM-Based)

The workflow consists of **7 intelligent nodes** that create an adaptive decision-making system:

```
Webhook → Controller → Message a Model2 → Switch → [KB Summarizer | Search → Message a Model1] → Response Formatter → Respond to Webhook
```

## Node-by-Node Breakdown

### 1. **Webhook** (Entry Point)
**Type**: Webhook Trigger  
**URL**: `/webhook-test/chat`  
**Purpose**: Receives chat requests from Next.js frontend

**Input Data**:
```json
{
  "message": "user query",
  "conversationHistory": [],
  "knowledgeContext": [...],
  "searchMetadata": {
    "topScore": 85
  }
}
```

### 2. **Controller** (Data Preparation)
**Type**: Code Node  
**Purpose**: Processes webhook data and prepares for LLM decision

**Function**:
- Extracts query and knowledge base score
- Formats data structure for LLM consumption
- Prepares context for intelligent routing decision

### 3. **Message a Model2** (LLM Decision Engine) 🧠
**Type**: OpenAI Chat Model  
**Model**: GPT-4  
**Purpose**: **Intelligent routing decision based on KB score**

**Decision Prompt**:
```
Query: {{ $json.body.message }}
KB Score: {{ $json.body.searchMetadata.topScore }}
KB Documents: {{ $json.body.knowledgeContext[0] }}

Decision Rules:
- KB Score < 50
- KB Score >= 50

Return the output as web_search or kb_search 

If score < 50:
  web_search

If score >= 50:
  kb_summarize

Analyze the KB score and return the response
```

**Output**: JSON decision with route, confidence, and reasoning

### 4. **Switch** (Dynamic Router)
**Type**: Switch Node  
**Mode**: Expression  
**Purpose**: Routes based on LLM decision

**Expression**:
```javascript
{{ JSON.parse($('Message a model2').item.json.content).route === "web_search" ? 0 : 1 }}
```

**Routing**:
- **Output 0**: `web_search` → Search + Message a Model1
- **Output 1**: `kb_summarize` → Message a Model1 (KB path)

### 5A. **Search** (Web Search Path)
**Type**: HTTP Request / Search Integration  
**Purpose**: Travily API web search for low-score queries
**Trigger**: When route = "web_search"

**Function**:
- Executes web search using Travily API
- Retrieves current, external information
- Handles real-time data requirements

### 5B. **Message a Model1** (Dual-Purpose Processor)
**Type**: OpenAI Chat Model  
**Model**: GPT-4  
**Purpose**: **Processes both KB summarization AND web search results**

**KB Summarization Path** (route = "kb_summarize"):
```
Query: {{ $json.message }}
KB Documents: {{ JSON.stringify($json.knowledgeContext) }}

Since KB score >= 50, summarize and enrich the knowledge base results.
Provide a comprehensive answer based on the available knowledge.
```

**Web Search Path** (route = "web_search"):
```
Query: {{ $json.message }}
Search Results: {{ JSON.stringify($json) }}

Process the web search results and provide a comprehensive answer.
```

### 6. **Response Formatter** (Output Standardization)
**Type**: Code Node  
**Purpose**: Formats responses for frontend consumption

**Function**:
- Standardizes response structure from both paths
- Adds processing metadata and timing information
- Includes LLM decision reasoning in response

### 7. **Respond to Webhook** (Final Output)
**Type**: Webhook Response  
**Purpose**: Returns formatted response to frontend

**Response Structure**:
```json
{
  "response": "LLM generated answer",
  "steps": ["Query analyzed", "LLM routing decision", "Processing completed"],
  "toolCalls": ["llm_decision", "kb_summarize|web_search", "llm_processing"],
  "latency": 2500,
  "success": true,
  "metadata": {
    "processingPath": "kb_summarize|web_search",
    "kbScore": 85,
    "llmReasoning": "KB score 85 exceeds threshold..."
  }
}
```

## Data Flow Architecture

### 🔄 **Complete Flow Diagram**
```
Frontend Query → Webhook → Controller → LLM Decision → Switch Router → [Path Execution] → Response
```

### **Input Flow**
1. **Frontend** → **Webhook**: User query + KB context + score
2. **Webhook** → **Controller**: Data preparation and formatting  
3. **Controller** → **Message a Model2**: LLM decision-making

### **Decision Flow** 🧠
4. **Message a Model2**: LLM analyzes score and returns routing decision
5. **Switch**: Dynamically routes based on LLM output

### **Execution Paths**
**Path A (web_search)**:
6A. **Switch** → **Search** → **Message a Model1** → **Response Formatter**

**Path B (kb_summarize)**:  
6B. **Switch** → **Message a Model1** → **Response Formatter**

### **Output Flow**
7. **Response Formatter** → **Respond to Webhook** → **Frontend**

## Processing Paths Comparison

### 🔍 **Web Search Path** (Score < 50)
- **Trigger**: LLM decides score is insufficient for KB
- **Process**: Switch → Search → Message a Model1 → Response Formatter
- **Use Cases**: Current events, news, recent developments, external information
- **Advantages**: Access to real-time data, broader information scope
- **Response Time**: 3-8 seconds (external API calls)

### 📚 **Knowledge Base Path** (Score ≥ 50)  
- **Trigger**: LLM decides KB has sufficient relevance
- **Process**: Switch → Message a Model1 → Response Formatter
- **Use Cases**: Educational content, technical documentation, covered topics
- **Advantages**: Fast response, high accuracy, consistent quality
- **Response Time**: 1-3 seconds (local processing)

## 🆕 **LLM Decision Engine Benefits**

### **Intelligence Over Rules**
- **Old**: Simple threshold checking (`if score > 50`)
- **New**: AI reasoning with context and confidence scoring
- **Result**: More nuanced, adaptive decision-making

### **Transparency**  
- **Decision Reasoning**: LLM explains why it chose each path
- **Confidence Scoring**: Provides confidence levels for decisions
- **Debugging**: Easy to understand routing logic through LLM explanations

### **Adaptability**
- **Dynamic Thresholds**: LLM can adjust based on query context
- **Context Awareness**: Considers query type, complexity, and intent
- **Learning**: Can be improved by updating prompts without code changes

### **Quality Assurance**
- **Consistent Format**: JSON output ensures reliable parsing
- **Error Handling**: LLM provides fallback reasoning
- **Monitoring**: Decision metadata tracked in response

## Integration Points

### Frontend Integration
- **Endpoint**: Webhook URL configured in Next.js environment
- **Protocol**: HTTP POST with JSON payload
- **Authentication**: Environment-based configuration
- **Timeout**: Configurable timeout settings for reliability

### Knowledge Base Integration
- **Source**: Next.js knowledge API at `/api/knowledge`
- **Method**: Dynamic search with scoring
- **Content**: 12 markdown documents with technical topics
- **Indexing**: Real-time search with TF-IDF scoring

### External Services
- **OpenAI**: LLM processing for both branches
- **Web Search**: External search API for current information
- **Error Handling**: Graceful degradation and fallback responses

## Workflow Benefits

### Intelligent Routing
- Automatic decision-making between knowledge sources
- Optimized processing paths for different query types
- Reduced latency for knowledge base queries
- Enhanced coverage through web search fallback

### Scalability
- Parallel processing capabilities
- Independent scaling of different processing paths
- Modular architecture for easy extension
- Configurable performance parameters

### Reliability
- Multiple fallback mechanisms
- Error handling at each processing stage
- Graceful degradation for service failures
- Comprehensive logging and monitoring

### Performance Optimization
- Cached knowledge base results
- Efficient routing to minimize processing time
- Parallel execution where possible
- Resource optimization based on query type

## Configuration Requirements

### **Environment Variables**
```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-key-here
OPENAI_ORG_ID=org-your-org-id

# n8n Webhook
N8N_WEBHOOK_URL=http://localhost:5678/webhook-test/chat

# Travily API (for web search)
TRAVILY_API_KEY=your-travily-api-key
TRAVILY_BASE_URL=https://api.travily.com

# Performance Settings
API_TIMEOUT=30000
LLM_TEMPERATURE=0.1
MAX_RESULTS=5
```

### **Node Configuration Summary**

| Node | Type | Key Settings |
|------|------|-------------|
| **Message a Model2** | OpenAI Chat | Model: GPT-4, Temp: 0.1, Decision prompts |
| **Switch** | Switch | Expression mode, JSON parsing |
| **Search** | HTTP Request | Travily API integration |
| **Message a Model1** | OpenAI Chat | Model: GPT-4, Dual-purpose processing |

### **Security Considerations**
- **API Key Management**: Use environment variables, rotate regularly
- **Input Validation**: Sanitize all user inputs before processing  
- **Rate Limiting**: Monitor OpenAI and Travily API usage
- **Error Handling**: Graceful degradation for API failures
- **Logging**: Comprehensive logs for debugging without exposing secrets


This LLM-powered architecture provides intelligent, adaptive, and transparent routing decisions that improve over time through prompt refinement rather than code changes.
