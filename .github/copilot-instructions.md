<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Agentic AI Chatbot Project Instructions

This project is an agentic AI system with a ChatGPT-like frontend built with Next.js and TypeScript, integrating with n8n for backend processing.

## Project Components
- Frontend: Next.js with TypeScript and Tailwind CSS
- Backend: n8n workflows for agentic AI pipeline
- Knowledge Base: 8-20 documents for retrieval
- Components: Retriever, Reasoner, Actor, Controller
- Travel API Integration: Travily API for booking flights, hotels, and activities

## Development Guidelines
- Use TypeScript for type safety
- Follow React best practices for component structure
- Implement responsive design with Tailwind CSS
- Use webhook integration for n8n communication
- Maintain comprehensive logging and evaluation metrics
- When adding travel functionality, always include booking confirmation and cancellation policies

## Current Project Status
- [x] Project structure scaffolded
- [x] UI components designed
- [x] Webhook integration implemented
- [x] Knowledge base created
- [x] n8n workflows documented
- [x] Travel API integration added
- [x] Test queries and evaluation completed
- [x] Documentation finalized

## Travel API Integration Patterns

### Adding Travel Booking Features
When implementing travel-related functionality:

1. **API Integration**: Use Travily API for flights, hotels, and activities
2. **LLM Prompt Structure**: Follow the established pattern in `docs/n8n-workflow-guide.md`
3. **Error Handling**: Always provide fallback options when API calls fail
4. **Data Processing**: Normalize API responses before sending to LLM
5. **User Experience**: Show clear pricing, dates, and booking steps

### Travel Query Processing Flow
```
User Query → Knowledge Base Search → Travel API Call → LLM Reasoning → Response
```

### Example Travel API Implementation
```typescript
// In n8n workflow - Travel API Tool
const travelQuery = extractTravelIntent($json.message);
const apiResults = await callTravilyAPI(travelQuery);
const processedResults = normalizeTravelData(apiResults);

// LLM processes with travel context
const response = await llmReasoning({
  query: $json.message,
  travelResults: processedResults,
  knowledgeContext: kbResults
});
```

## Integration Patterns

### API Response Normalization
Always normalize external API responses to consistent format:
```javascript
const normalizedResult = {
  type: 'flight|hotel|activity',
  id: result.id,
  name: result.name,
  price: result.price,
  currency: result.currency,
  availability: result.available,
  bookingUrl: result.bookingLink
};
```

### Error Handling for External APIs
```javascript
try {
  const results = await callExternalAPI(query);
  return processResults(results);
} catch (error) {
  console.error('API Error:', error);
  return getFallbackResponse(query);
}
```

### Testing Travel Features
- Test with various destinations and date ranges
- Verify API rate limits and error responses
- Check booking URL generation and validation
- Test knowledge base integration with travel queries

## Code Patterns

### Travel Component Structure
```tsx
// components/TravelResults.tsx
interface TravelResult {
  type: 'flight' | 'hotel' | 'activity';
  name: string;
  price: number;
  currency: string;
  bookingUrl: string;
}

export function TravelResults({ results }: { results: TravelResult[] }) {
  return (
    <div className="space-y-4">
      {results.map(result => (
        <div key={result.id} className="border rounded-lg p-4">
          <h3 className="font-semibold">{result.name}</h3>
          <p className="text-green-600 font-medium">
            {result.currency} {result.price}
          </p>
          <a href={result.bookingUrl} className="text-blue-500 hover:underline">
            Book Now
          </a>
        </div>
      ))}
    </div>
  );
}
```

### Environment Variables for Travel APIs
```bash
# .env.local
TRAVILY_API_KEY=your_travily_api_key
TRAVILY_BASE_URL=https://api.travily.com/v1
TRAVILY_TIMEOUT=10000
```

## Performance Optimization

### API Call Optimization
- Cache frequent queries (popular destinations)
- Implement request deduplication
- Use streaming responses for large result sets
- Set appropriate timeouts (10s for travel APIs)

### Response Processing
- Limit results to top 5-10 options
- Include only essential fields in API responses
- Pre-process data before LLM analysis
- Use pagination for large result sets

## Security Considerations

### API Key Management
- Never commit API keys to version control
- Use environment variables for all credentials
- Implement API key rotation
- Monitor API usage and costs

### Data Validation
- Validate all user inputs before API calls
- Sanitize search parameters
- Implement rate limiting per user
- Log suspicious activity patterns

## Deployment Checklist

### Travel API Deployment
- [ ] Configure production API keys
- [ ] Set up API monitoring and alerts
- [ ] Test booking flow end-to-end
- [ ] Verify error handling in production
- [ ] Set up logging for API failures
- [ ] Configure rate limiting
- [ ] Test with real payment flows (if applicable)

## Common Patterns

### Travel Query Detection
```javascript
function isTravelQuery(message: string): boolean {
  const travelKeywords = [
    'book', 'flight', 'hotel', 'vacation', 'trip',
    'travel', 'destination', 'itinerary', 'reservation'
  ];
  return travelKeywords.some(keyword => 
    message.toLowerCase().includes(keyword)
  );
}
```

### Booking Confirmation
Always include booking confirmation details:
```javascript
const bookingConfirmation = {
  bookingId: generateBookingId(),
  status: 'confirmed',
  totalPrice: calculateTotal(),
  cancellationPolicy: getCancellationPolicy(),
  contactInfo: getSupportContact()
};
```

This completes the agentic AI chatbot with travel booking capabilities. The system now supports intelligent travel planning with API integration, knowledge base retrieval, and web search augmentation.