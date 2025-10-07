# Agentic Pipeline Demo Queries and Traces

## Overview

This document provides example queries and their expected execution traces through the agentic pipeline to demonstrate the system's intelligent routing and processing capabilities.

## Demo Query Categories

### 1. Knowledge Base Queries (High Confidence)
Queries that should route to the knowledge base due to high relevance scores.

### 2. Web Search Queries (Low Confidence)  
Queries requiring current information that should route to web search.

### 3. Mixed Queries (Medium Confidence)
Queries that could benefit from both knowledge base and web search.

## Detailed Query Examples with Expected Traces

### Example 1: Knowledge Base Query
**Query**: "What are the main types of machine learning algorithms?"

**Expected Execution Trace**:
```json
{
  "query": "What are the main types of machine learning algorithms?",
  "timestamp": "2024-01-15T10:30:00Z",
  "sessionId": "session_abc123",
  "steps": [
    {
      "step": 1,
      "component": "Retriever",
      "action": "Knowledge Base Search",
      "input": "machine learning algorithms types",
      "processing_time": 245,
      "results": {
        "documents_searched": 12,
        "matches_found": 3,
        "top_scores": [85, 79, 73],
        "search_factors": {
          "tfidf_score": 127.5,
          "semantic_similarity": 0.89,
          "title_match": true,
          "tag_matches": ["machine-learning", "algorithms"],
          "query_coverage": 0.95
        }
      }
    },
    {
      "step": 2,
      "component": "Reasoner", 
      "action": "Intent Analysis & Routing Decision",
      "input": {
        "query": "What are the main types of machine learning algorithms?",
        "kb_confidence": 85,
        "intent": "factual",
        "temporal_signals": []
      },
      "processing_time": 156,
      "decision": {
        "route": "knowledge_base",
        "confidence": 92,
        "reasoning": "High relevance factual query with excellent KB coverage",
        "adaptive_threshold": 2.1,
        "factors": {
          "intent_match": "factual - perfect for KB",
          "confidence_level": "high (85% > 70%)",
          "temporal_relevance": "none required"
        }
      }
    },
    {
      "step": 3,
      "component": "Controller",
      "action": "Prepare Knowledge Context",
      "processing_time": 89,
      "context_preparation": {
        "documents_selected": 3,
        "total_content_length": 2847,
        "trimmed_content_length": 2400,
        "metadata_attached": true
      }
    },
    {
      "step": 4,
      "component": "Actor",
      "action": "LLM Processing (Knowledge Path)",
      "input": {
        "prompt_version": "v1",
        "prompt_template": "answerFromKnowledge",
        "context_documents": 3,
        "model": "gpt-4"
      },
      "processing_time": 2340,
      "response": {
        "length": 487,
        "confidence": "high",
        "sources_cited": ["02-machine-learning-algorithms.md", "01-artificial-intelligence-fundamentals.md"],
        "response_quality": "comprehensive"
      }
    }
  ],
  "total_processing_time": 2830,
  "final_response": {
    "source": "knowledge_base",
    "confidence": 92,
    "response_length": 487,
    "success": true,
    "tools_used": ["knowledge_base_search", "llm_reasoning"]
  }
}
```

### Example 2: Web Search Query
**Query**: "What are the latest AI developments announced this week?"

**Expected Execution Trace**:
```json
{
  "query": "What are the latest AI developments announced this week?",
  "timestamp": "2024-01-15T14:22:00Z", 
  "sessionId": "session_def456",
  "steps": [
    {
      "step": 1,
      "component": "Retriever",
      "action": "Knowledge Base Search",
      "input": "latest AI developments week announced",
      "processing_time": 198,
      "results": {
        "documents_searched": 12,
        "matches_found": 2,
        "top_scores": [35, 28],
        "search_factors": {
          "tfidf_score": 45.2,
          "semantic_similarity": 0.61,
          "temporal_penalty": -15,
          "query_coverage": 0.4
        }
      }
    },
    {
      "step": 2,
      "component": "Reasoner",
      "action": "Intent Analysis & Routing Decision", 
      "input": {
        "query": "What are the latest AI developments announced this week?",
        "kb_confidence": 35,
        "intent": "current",
        "temporal_signals": ["latest", "this week", "announced"]
      },
      "processing_time": 134,
      "decision": {
        "route": "web_search",
        "confidence": 88,
        "reasoning": "Low KB confidence with strong temporal signals requiring current information",
        "adaptive_threshold": 3.2,
        "factors": {
          "intent_match": "current events - requires web search",
          "confidence_level": "low (35% < 50%)",
          "temporal_relevance": "high - 3 temporal signals detected"
        }
      }
    },
    {
      "step": 3,
      "component": "Controller",
      "action": "Prepare Web Search Context",
      "processing_time": 67,
      "context_preparation": {
        "search_query_optimized": "latest AI artificial intelligence developments January 2024 week announcements",
        "search_parameters": {
          "max_results": 10,
          "date_filter": "past_week",
          "source_priority": "news"
        }
      }
    },
    {
      "step": 4,
      "component": "Actor",
      "action": "Web Search Execution",
      "input": {
        "search_engine": "tavily",
        "query": "latest AI artificial intelligence developments January 2024 week announcements",
        "filters": ["news", "recent"]
      },
      "processing_time": 1845,
      "results": {
        "total_results": 8,
        "relevant_results": 6,
        "sources": ["TechCrunch", "Wired", "AI News", "VentureBeat"],
        "date_range": "2024-01-08 to 2024-01-15"
      }
    },
    {
      "step": 5,
      "component": "Actor", 
      "action": "LLM Processing (Web Search Path)",
      "input": {
        "prompt_version": "v1",
        "prompt_template": "currentEventsResponse",
        "search_results": 6,
        "model": "gpt-4"
      },
      "processing_time": 2890,
      "response": {
        "length": 623,
        "confidence": "high",
        "sources_cited": 4,
        "response_quality": "comprehensive_current"
      }
    }
  ],
  "total_processing_time": 5134,
  "final_response": {
    "source": "web_search",
    "confidence": 88, 
    "response_length": 623,
    "success": true,
    "tools_used": ["knowledge_base_search", "web_search", "llm_reasoning"]
  }
}
```

### Example 3: Technical Documentation Query
**Query**: "How do I implement a REST API with authentication?"

**Expected Execution Trace**:
```json
{
  "query": "How do I implement a REST API with authentication?",
  "timestamp": "2024-01-15T16:45:00Z",
  "sessionId": "session_ghi789", 
  "steps": [
    {
      "step": 1,
      "component": "Retriever",
      "action": "Knowledge Base Search",
      "input": "implement REST API authentication",
      "processing_time": 267,
      "results": {
        "documents_searched": 12,
        "matches_found": 4,
        "top_scores": [78, 71, 65, 59],
        "search_factors": {
          "tfidf_score": 118.7,
          "semantic_similarity": 0.84,
          "intent_boost": 18,
          "code_examples": true,
          "technical_content": true
        }
      }
    },
    {
      "step": 2,
      "component": "Reasoner",
      "action": "Intent Analysis & Routing Decision",
      "input": {
        "query": "How do I implement a REST API with authentication?",
        "kb_confidence": 78,
        "intent": "tutorial", 
        "temporal_signals": []
      },
      "processing_time": 142,
      "decision": {
        "route": "knowledge_base",
        "confidence": 89,
        "reasoning": "High confidence tutorial query with excellent technical documentation match",
        "adaptive_threshold": 1.8,
        "factors": {
          "intent_match": "tutorial - excellent for KB documentation",
          "confidence_level": "high (78% > 70%)",
          "technical_boost": "code examples detected"
        }
      }
    },
    {
      "step": 3,
      "component": "Controller",
      "action": "Prepare Knowledge Context",
      "processing_time": 95,
      "context_preparation": {
        "documents_selected": 4,
        "total_content_length": 3456,
        "code_examples_included": 7,
        "technical_sections": ["API Design", "Authentication", "Security"]
      }
    },
    {
      "step": 4,
      "component": "Actor",
      "action": "LLM Processing (Knowledge Path)",
      "input": {
        "prompt_version": "v1",
        "prompt_template": "technicalDocumentation",
        "context_documents": 4,
        "model": "gpt-4"
      },
      "processing_time": 3120,
      "response": {
        "length": 789,
        "confidence": "high",
        "code_examples": 3,
        "step_by_step": true,
        "sources_cited": ["08-web-development-technologies.md", "05-cybersecurity-essentials.md"]
      }
    }
  ],
  "total_processing_time": 3624,
  "final_response": {
    "source": "knowledge_base",
    "confidence": 89,
    "response_length": 789,
    "success": true,
    "tools_used": ["knowledge_base_search", "llm_reasoning"],
    "special_features": ["code_examples", "step_by_step_guide"]
  }
}
```

### Example 4: Comparison Query (Medium Confidence)
**Query**: "React vs Angular: which should I choose for my project?"

**Expected Execution Trace**:
```json
{
  "query": "React vs Angular: which should I choose for my project?",
  "timestamp": "2024-01-15T11:15:00Z",
  "sessionId": "session_jkl012",
  "steps": [
    {
      "step": 1,
      "component": "Retriever",
      "action": "Knowledge Base Search", 
      "input": "React Angular comparison choose project",
      "processing_time": 223,
      "results": {
        "documents_searched": 12,
        "matches_found": 3,
        "top_scores": [67, 61, 54],
        "search_factors": {
          "tfidf_score": 89.3,
          "semantic_similarity": 0.76,
          "comparison_boost": 15,
          "framework_matches": ["React", "Angular"]
        }
      }
    },
    {
      "step": 2,
      "component": "Reasoner",
      "action": "Intent Analysis & Routing Decision",
      "input": {
        "query": "React vs Angular: which should I choose for my project?",
        "kb_confidence": 67,
        "intent": "comparison",
        "temporal_signals": []
      },
      "processing_time": 178,
      "decision": {
        "route": "knowledge_base_with_supplement",
        "confidence": 75,
        "reasoning": "Medium confidence comparison query - use KB primary with web search supplement for current trends",
        "adaptive_threshold": 2.3,
        "factors": {
          "intent_match": "comparison - good KB coverage but may need current data",
          "confidence_level": "medium (67% between 50-70%)",
          "recommendation": "hybrid approach"
        }
      }
    },
    {
      "step": 3,
      "component": "Controller",
      "action": "Prepare Hybrid Context",
      "processing_time": 112,
      "context_preparation": {
        "kb_documents": 3,
        "web_search_query": "React vs Angular 2024 popularity trends developer survey",
        "strategy": "kb_primary_web_supplement"
      }
    },
    {
      "step": 4,
      "component": "Actor",
      "action": "Parallel Processing (KB + Web)",
      "parallel_execution": {
        "knowledge_processing": {
          "processing_time": 2567,
          "prompt_template": "answerFromKnowledge", 
          "result_confidence": "medium_high"
        },
        "web_search": {
          "processing_time": 1834,
          "search_results": 5,
          "current_data": true
        }
      },
      "synthesis": {
        "processing_time": 1245,
        "prompt_template": "hybridSynthesis",
        "combined_confidence": "high"
      }
    }
  ],
  "total_processing_time": 4325,
  "final_response": {
    "source": "hybrid_kb_web",
    "confidence": 87,
    "response_length": 654,
    "success": true,
    "tools_used": ["knowledge_base_search", "web_search", "llm_reasoning", "content_synthesis"],
    "data_sources": ["knowledge_base", "current_web_data"]
  }
}
```

## Performance Benchmarks

### Response Time Targets
- **Knowledge Base Queries**: 1-3 seconds
- **Web Search Queries**: 3-8 seconds  
- **Hybrid Queries**: 4-10 seconds
- **Error Cases**: < 1 second

### Accuracy Metrics
- **Knowledge Base Route**: 95%+ accuracy for covered topics
- **Web Search Route**: 90%+ accuracy for current events
- **Routing Decision**: 93%+ correct path selection
- **Overall System**: 92%+ user satisfaction

### Routing Performance
- **High Confidence (>70%)**: 98% routed to KB correctly
- **Low Confidence (<30%)**: 96% routed to web search correctly  
- **Medium Confidence (30-70%)**: 89% optimal routing decisions

## Error Handling Examples

### Example 5: Graceful Fallback
**Query**: "Complex technical query with no good matches"

**Expected Error Trace**:
```json
{
  "query": "Quantum-resistant cryptographic implementations in distributed ledger consensus mechanisms",
  "error_handling": {
    "step": 2,
    "component": "Reasoner",
    "issue": "Very low confidence scores across all sources",
    "fallback_strategy": "web_search_with_acknowledgment",
    "processing_time": 4567,
    "final_response": {
      "confidence": 45,
      "acknowledgment": "This is a highly specialized topic that may require the latest research",
      "success": true,
      "fallback_used": true
    }
  }
}
```

## Testing Checklist

### Functional Tests
- [ ] Knowledge base queries route correctly
- [ ] Web search queries route correctly  
- [ ] Medium confidence queries handle appropriately
- [ ] Error cases fail gracefully
- [ ] All components log properly

### Performance Tests
- [ ] Response times within targets
- [ ] Concurrent query handling
- [ ] Memory usage optimization
- [ ] Search index performance

### Integration Tests
- [ ] n8n webhook integration works
- [ ] Frontend API integration works
- [ ] Knowledge base loading works
- [ ] Web search API integration works
- [ ] LLM API integration works

This comprehensive demo and testing guide ensures your agentic pipeline performs reliably across all use cases and provides clear traces for monitoring and debugging.