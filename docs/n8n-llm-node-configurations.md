# n8n Node Configuration for LLM Decision Engine

## Complete Node Setup Guide

### 1. LLM Analyzer Node Configuration

**Node Type**: @n8n/nodes-base.openAi
**Node Name**: "LLM Query Analyzer"

```json
{
  "parameters": {
    "resource": "chat",
    "model": "gpt-4-1106-preview",
    "options": {
      "temperature": 0.1,
      "maxTokens": 1000,
      "topP": 1,
      "frequencyPenalty": 0,
      "presencePenalty": 0
    },
    "messages": {
      "messageType": "multipleMessages",
      "values": [
        {
          "role": "system",
          "content": "You are a query analysis specialist for an AI routing system. Analyze user queries and extract structured decision factors. Always respond with valid JSON only."
        },
        {
          "role": "user", 
          "content": "=Analyze this query for routing decisions:\n\nQUERY: {{ $json.message }}\nKNOWLEDGE_CONTEXT: {{ JSON.stringify($json.knowledgeContext) }}\nCONVERSATION_HISTORY: {{ JSON.stringify($json.conversationHistory) }}\n\nExtract these factors and respond with ONLY valid JSON:\n\n{\n  \"intent\": \"factual|current|tutorial|comparison|troubleshooting\",\n  \"complexity\": \"simple|medium|complex\", \n  \"timeSensitivity\": \"none|low|medium|high\",\n  \"kbRelevance\": 0-100,\n  \"requiredTools\": [\"knowledge_base\", \"web_search\", \"calculator\", \"code_gen\"],\n  \"queryType\": \"question|request|command|conversation\",\n  \"topicArea\": \"technology|science|business|general\",\n  \"analysisConfidence\": 0-100,\n  \"keywords\": [\"key\", \"terms\", \"extracted\"]\n}"
        }
      ]
    }
  },
  "id": "llm-analyzer",
  "name": "LLM Query Analyzer",
  "type": "@n8n/nodes-base.openAi",
  "typeVersion": 1.3,
  "position": [380, 240],
  "credentials": {
    "openAiApi": {
      "id": "openai-credentials",
      "name": "OpenAI API"
    }
  }
}
```

### 2. LLM Router Node Configuration

**Node Type**: @n8n/nodes-base.openAi
**Node Name**: "LLM Router Decision"

```json
{
  "parameters": {
    "resource": "chat",
    "model": "gpt-4-1106-preview", 
    "options": {
      "temperature": 0.1,
      "maxTokens": 800,
      "topP": 1
    },
    "messages": {
      "messageType": "multipleMessages",
      "values": [
        {
          "role": "system",
          "content": "You are an intelligent routing decision engine. Based on query analysis, choose the optimal processing path. Always respond with valid JSON only."
        },
        {
          "role": "user",
          "content": "=Make routing decision based on this analysis:\n\nORIGINAL_QUERY: {{ $json.message }}\nANALYSIS: {{ $('LLM Query Analyzer').item.json.choices[0].message.content }}\n\nROUTING OPTIONS:\n- KNOWLEDGE_BASE: Use internal documents only\n- WEB_SEARCH: Search web for current info\n- HYBRID: Combine both KB + web search\n- ESCALATE: Too complex, needs human help\n- CLARIFICATION: Query unclear, ask for details\n\nDECISION RULES:\n- KB relevance >75% + factual/tutorial intent = KNOWLEDGE_BASE\n- Time sensitive (high) + current events = WEB_SEARCH\n- Complex + multi-part queries = HYBRID\n- Low confidence analysis = CLARIFICATION\n- Technical errors/debugging = ESCALATE\n\nRespond with ONLY valid JSON:\n\n{\n  \"primaryPath\": \"KNOWLEDGE_BASE|WEB_SEARCH|HYBRID|ESCALATE|CLARIFICATION\",\n  \"fallbackPath\": \"KNOWLEDGE_BASE|WEB_SEARCH|HYBRID|ESCALATE|CLARIFICATION\",\n  \"confidence\": 0-100,\n  \"reasoning\": \"Brief explanation of decision\",\n  \"executionStrategy\": \"sequential|parallel|adaptive\",\n  \"estimatedTime\": \"<5s|5-15s|15-30s|>30s\",\n  \"requiredResources\": [\"kb\", \"web\", \"llm\", \"human\"]\n}"
        }
      ]
    }
  },
  "id": "llm-router",
  "name": "LLM Router Decision", 
  "type": "@n8n/nodes-base.openAi",
  "typeVersion": 1.3,
  "position": [580, 240],
  "credentials": {
    "openAiApi": {
      "id": "openai-credentials",
      "name": "OpenAI API"
    }
  }
}
```

### 3. Switch Node Configuration

**Node Type**: @n8n/nodes-base.switch
**Node Name**: "Path Router"

```json
{
  "parameters": {
    "dataType": "string",
    "value1": "={{ JSON.parse($('LLM Router Decision').item.json.choices[0].message.content).primaryPath }}",
    "rules": {
      "rules": [
        {
          "operation": "equal",
          "value2": "KNOWLEDGE_BASE"
        },
        {
          "operation": "equal", 
          "value2": "WEB_SEARCH"
        },
        {
          "operation": "equal",
          "value2": "HYBRID"
        },
        {
          "operation": "equal",
          "value2": "ESCALATE"
        },
        {
          "operation": "equal",
          "value2": "CLARIFICATION"
        }
      ]
    },
    "fallbackOutput": 1
  },
  "id": "path-router",
  "name": "Path Router",
  "type": "@n8n/nodes-base.switch",
  "typeVersion": 3,
  "position": [780, 240]
}
```

### 4. Knowledge Base Processor Node

**Node Type**: @n8n/nodes-base.openAi  
**Node Name**: "KB Processor"

```json
{
  "parameters": {
    "resource": "chat",
    "model": "gpt-4-1106-preview",
    "options": {
      "temperature": 0.3,
      "maxTokens": 2000
    },
    "messages": {
      "messageType": "multipleMessages", 
      "values": [
        {
          "role": "system",
          "content": "You are a knowledge specialist. Answer queries using ONLY the provided knowledge base context. Be accurate, comprehensive, and cite sources when possible."
        },
        {
          "role": "user",
          "content": "=USER QUERY: {{ $json.message }}\n\nKNOWLEDGE BASE CONTEXT:\n{{ JSON.stringify($json.knowledgeContext, null, 2) }}\n\nROUTING ANALYSIS:\n{{ $('LLM Query Analyzer').item.json.choices[0].message.content }}\n\nProvide a comprehensive answer using ONLY the knowledge base context above. If the context doesn't fully answer the query, state what information is missing."
        }
      ]
    }
  },
  "id": "kb-processor",
  "name": "KB Processor",
  "type": "@n8n/nodes-base.openAi", 
  "typeVersion": 1.3,
  "position": [980, 120],
  "credentials": {
    "openAiApi": {
      "id": "openai-credentials",
      "name": "OpenAI API"
    }
  }
}
```

### 5. Web Search Processor Node

**Node Type**: @n8n/nodes-base.httpRequest
**Node Name**: "Web Search"

```json
{
  "parameters": {
    "method": "GET",
    "url": "=https://api.serpapi.com/search",
    "options": {
      "queryParameterArrays": "separateArrayItems",
      "timeout": 10000
    },
    "queryParameters": {
      "parameters": [
        {
          "name": "engine",
          "value": "google"
        },
        {
          "name": "q", 
          "value": "={{ $json.message }}"
        },
        {
          "name": "api_key",
          "value": "={{ $credentials.serpApi.apiKey }}"
        },
        {
          "name": "num",
          "value": "5"
        }
      ]
    }
  },
  "id": "web-search",
  "name": "Web Search",
  "type": "@n8n/nodes-base.httpRequest",
  "typeVersion": 4.2,
  "position": [980, 200],
  "credentials": {
    "serpApi": {
      "id": "serp-api-credentials", 
      "name": "SerpAPI"
    }
  }
}
```

### 6. Web Search LLM Processor

**Node Type**: @n8n/nodes-base.openAi
**Node Name**: "Web Search LLM Processor"

```json
{
  "parameters": {
    "resource": "chat",
    "model": "gpt-4-1106-preview",
    "options": {
      "temperature": 0.3,
      "maxTokens": 2000
    },
    "messages": {
      "messageType": "multipleMessages",
      "values": [
        {
          "role": "system", 
          "content": "You are a web research specialist. Synthesize web search results to answer user queries accurately and comprehensively."
        },
        {
          "role": "user",
          "content": "=USER QUERY: {{ $('Path Router').item.json.message }}\n\nWEB SEARCH RESULTS:\n{{ JSON.stringify($json, null, 2) }}\n\nSynthesize the search results to provide a comprehensive, accurate answer to the user's query. Include relevant sources and ensure the information is current."
        }
      ]
    }
  },
  "id": "web-llm-processor",
  "name": "Web Search LLM Processor",
  "type": "@n8n/nodes-base.openAi",
  "typeVersion": 1.3,
  "position": [1180, 200],
  "credentials": {
    "openAiApi": {
      "id": "openai-credentials",
      "name": "OpenAI API" 
    }
  }
}
```

### 7. Quality Checker Node

**Node Type**: @n8n/nodes-base.openAi
**Node Name**: "Quality Checker"

```json
{
  "parameters": {
    "resource": "chat",
    "model": "gpt-4-1106-preview",
    "options": {
      "temperature": 0.1,
      "maxTokens": 800
    },
    "messages": {
      "messageType": "multipleMessages",
      "values": [
        {
          "role": "system",
          "content": "You are a response quality evaluator. Assess AI responses for quality metrics and determine if re-routing is needed. Always respond with valid JSON only."
        },
        {
          "role": "user",
          "content": "=Evaluate this response quality:\n\nORIGINAL QUERY: {{ $('Path Router').item.json.message }}\nPROCESSING PATH: {{ JSON.parse($('LLM Router Decision').item.json.choices[0].message.content).primaryPath }}\nGENERATED RESPONSE: {{ $json.choices[0].message.content }}\n\nEvaluate quality (0-100) for each metric:\n\nRespond with ONLY valid JSON:\n\n{\n  \"overallQuality\": 0-100,\n  \"relevance\": 0-100,\n  \"completeness\": 0-100,\n  \"accuracy\": 0-100,\n  \"timeliness\": 0-100,\n  \"clarity\": 0-100,\n  \"shouldReRoute\": true/false,\n  \"alternativePath\": \"KNOWLEDGE_BASE|WEB_SEARCH|HYBRID|ESCALATE\",\n  \"reasoning\": \"Brief explanation\",\n  \"recommendations\": [\"improvement\", \"suggestions\"]\n}"
        }
      ]
    }
  },
  "id": "quality-checker", 
  "name": "Quality Checker",
  "type": "@n8n/nodes-base.openAi",
  "typeVersion": 1.3,
  "position": [1380, 240],
  "credentials": {
    "openAiApi": {
      "id": "openai-credentials",
      "name": "OpenAI API"
    }
  }
}
```

### 8. Re-routing Logic Node

**Node Type**: @n8n/nodes-base.if
**Node Name**: "Re-routing Decision"

```json
{
  "parameters": {
    "conditions": {
      "options": {
        "caseSensitive": true,
        "leftValue": "",
        "typeValidation": "strict"
      },
      "conditions": [
        {
          "id": "quality-check",
          "leftValue": "={{ JSON.parse($('Quality Checker').item.json.choices[0].message.content).shouldReRoute }}",
          "rightValue": true,
          "operator": {
            "type": "boolean",
            "operation": "equal"
          }
        }
      ],
      "combinator": "and"
    }
  },
  "id": "rerouting-decision",
  "name": "Re-routing Decision", 
  "type": "@n8n/nodes-base.if",
  "typeVersion": 2,
  "position": [1580, 240]
}
```

## Workflow Connections

```
Webhook → LLM Analyzer → LLM Router → Switch Router → [5 Paths]:
  Path 0: KB Processor → Quality Checker
  Path 1: Web Search → Web LLM Processor → Quality Checker  
  Path 2: [Hybrid Logic] → Quality Checker
  Path 3: [Escalation Handler] → Response
  Path 4: [Clarification Generator] → Response

Quality Checker → Re-routing Decision:
  True: Loop back to Switch Router (with retry limit)
  False: Final Response → Webhook Response
```

## Environment Variables Required

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-key
OPENAI_ORG_ID=org-your-org-id

# Search API Configuration  
SERP_API_KEY=your-serpapi-key
GOOGLE_SEARCH_API_KEY=your-google-api-key
GOOGLE_SEARCH_ENGINE_ID=your-search-engine-id

# Workflow Configuration
MAX_REROUTING_ATTEMPTS=2
QUALITY_THRESHOLD=70
DEFAULT_TIMEOUT=30000

# Escalation Configuration
ESCALATION_WEBHOOK_URL=https://your-escalation-endpoint.com
HUMAN_SUPPORT_EMAIL=support@yourcompany.com
```

This configuration creates a sophisticated LLM-driven decision engine that can intelligently route queries, evaluate response quality, and self-correct through re-routing when necessary.