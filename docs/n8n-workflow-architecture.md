# n8n Workflow Architecture Documentation

## Overview

This document describes the complete n8n workflow architecture for the Agentic AI Chatbot system. The workflow implements an intelligent routing system that dynamically decides between knowledge base retrieval and web search based on query analysis.

## Workflow Architecture

The workflow consists of 6 main components connected in a branching pattern that enables intelligent decision-making and parallel processing paths.

## Node-by-Node Breakdown

### 1. Webhook (Entry Point)
**Type**: Webhook Trigger
**Purpose**: Receives incoming chat requests from the Next.js frontend
**Position**: Entry point of the workflow

**Function**:
- Listens for POST requests from the frontend chat API
- Receives user messages and conversation context
- Triggers the entire workflow execution
- Configured to respond using the "Respond to Webhook" node

**Input Data Structure**:
- User message text
- Conversation history
- Session information
- Knowledge context from frontend

### 2. Controller (Decision Logic)
**Type**: Code Node
**Purpose**: Analyzes incoming requests and determines processing path
**Position**: First processing node after webhook

**Function**:
- Processes the incoming webhook data
- Performs query analysis and intent detection
- Determines whether to use knowledge base or web search
- Sets up routing flags for downstream nodes
- Prepares data for both processing branches

**Key Responsibilities**:
- Query preprocessing and normalization
- Intent classification (factual, current events, technical, etc.)
- Confidence scoring for routing decisions
- Data structure preparation for downstream nodes

### 3. If Node (Routing Decision)
**Type**: If/Conditional Logic
**Purpose**: Routes requests to appropriate processing branch
**Position**: Central branching point

**Function**:
- Evaluates routing conditions set by the Controller
- Creates two execution paths: "true" and "false"
- True path: High-confidence knowledge base queries
- False path: Low-confidence queries requiring web search

**Routing Logic**:
- **True Branch**: Knowledge base has relevant information
- **False Branch**: Web search needed for current/external information

### 4A. Message a Model (Knowledge Path)
**Type**: OpenAI/LLM Integration
**Purpose**: Processes queries using knowledge base context
**Position**: True branch of If node

**Function**:
- Receives queries with high knowledge base confidence
- Uses retrieved documents as context for LLM processing
- Generates responses based on stored knowledge
- Optimized for factual, educational, and technical queries

**Processing Characteristics**:
- Uses knowledge base documents as primary context
- Faster response times due to pre-indexed content
- Higher accuracy for topics covered in knowledge base
- No external API calls required beyond LLM

### 4B. Search Node (Web Search Path)
**Type**: Query Search Integration
**Purpose**: Performs web search for current information
**Position**: False branch of If node

**Function**:
- Executes web searches for queries requiring current information
- Retrieves real-time data from external sources
- Handles time-sensitive and current event queries
- Provides up-to-date information not in knowledge base

**Processing Characteristics**:
- Accesses live web data
- Handles current events and recent developments
- Longer response times due to external API calls
- Broader information scope beyond knowledge base

### 4C. Message a Model1 (Web Search Processing)
**Type**: OpenAI/LLM Integration
**Purpose**: Processes web search results with LLM reasoning
**Position**: Follows Search node in false branch

**Function**:
- Receives web search results from Search node
- Combines search data with LLM reasoning capabilities
- Generates responses based on current web information
- Synthesizes multiple search sources into coherent answers

**Processing Characteristics**:
- Uses web search results as primary context
- Processes real-time information
- Handles complex synthesis of multiple sources
- Optimized for current events and trending topics

### 5. Response Formatter (Output Processing)
**Type**: Code Node
**Purpose**: Standardizes and formats all responses
**Position**: Convergence point from both branches

**Function**:
- Receives responses from both knowledge base and web search paths
- Standardizes response format for frontend consumption
- Adds metadata and processing information
- Prepares final JSON structure for webhook response

**Output Standardization**:
- Consistent response structure regardless of processing path
- Metadata about processing steps and tools used
- Error handling and fallback response formatting
- Performance metrics and timing information

### 6. Respond to Webhook (Output)
**Type**: Webhook Response
**Purpose**: Returns processed response to frontend
**Position**: Final node in workflow

**Function**:
- Sends the formatted response back to the Next.js frontend
- Completes the request-response cycle
- Ensures proper HTTP response formatting
- Handles response timing and error cases

## Data Flow Architecture

### Input Flow
1. **Frontend** → **Webhook**: User query with context
2. **Webhook** → **Controller**: Raw request data
3. **Controller** → **If Node**: Processed data with routing flags

### Branching Flow
4a. **If Node (True)** → **Message a Model**: Knowledge base queries
4b. **If Node (False)** → **Search** → **Message a Model1**: Web search queries

### Output Flow
5. **Both Paths** → **Response Formatter**: Standardized formatting
6. **Response Formatter** → **Respond to Webhook**: Final response
7. **Respond to Webhook** → **Frontend**: Completed response

## Processing Paths

### Knowledge Base Path (True Branch)
- **Trigger**: High confidence in knowledge base relevance
- **Process**: Controller → If (True) → Message a Model → Response Formatter → Respond to Webhook
- **Use Cases**: Educational content, technical documentation, fundamental concepts
- **Advantages**: Fast response, high accuracy for covered topics

### Web Search Path (False Branch)
- **Trigger**: Low confidence in knowledge base relevance
- **Process**: Controller → If (False) → Search → Message a Model1 → Response Formatter → Respond to Webhook
- **Use Cases**: Current events, recent developments, real-time information
- **Advantages**: Access to current information, broader knowledge scope

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

### Environment Variables
- OpenAI API keys for LLM processing
- Web search API credentials
- Knowledge base API endpoints
- Timeout and performance settings

### Node Configuration
- Webhook endpoint and authentication settings
- LLM model selection and parameters
- Search API configuration and limits
- Response formatting and error handling

### Security Considerations
- API key management and rotation
- Input validation and sanitization
- Rate limiting and abuse prevention
- Secure communication protocols

This architecture provides a robust, intelligent, and scalable foundation for the agentic AI chatbot system, enabling both rapid knowledge retrieval and comprehensive web search capabilities through a single, unified interface.