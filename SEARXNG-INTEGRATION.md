# LangSearch Web Search Integration

## Overview

Aria now has integrated web search capabilities using the LangSearch API, a reliable and fast web search service. The search feature automatically activates when users ask questions that require current information, explicitly request a web search, or ask about business information.

## Features

✅ **Automatic Search Detection** - The AI automatically detects when to perform a web search  
✅ **Intelligent Triggers** - Activates on business queries, current events, and AI uncertainty  
✅ **Fast & Reliable** - Using LangSearch's professional API with 10-second timeout  
✅ **Business-Optimized** - Returns 8 results for business queries (hours, locations, contact info)  
✅ **Uncertainty Detection** - Automatically searches when AI lacks knowledge  

## API Provider

**LangSearch** - Professional web search API  
- Documentation: https://docs.langsearch.com/api/web-search-api
- Reliable uptime and fast response times
- Requires API key (get one at langsearch.com)

## How It Works

### 1. Explicit Search Triggers

The system automatically performs a web search when it detects phrases like:
- "search for..."
- "look up..."
- "find information about..."
- "what's the latest..."
- "current news about..."
- "web search..."

### 2. Business Query Triggers

**Automatically activated** for business-related queries:
- "What are Starbucks hours?"
- "Is Target open now?"
- "Phone number for Best Buy"
- "Where is Chipotle located?"
- Any restaurant, store, cafe, bank, gym, etc.

**Enhanced:** Business queries return **8 results** with focus on hours, location, and contact information.

### 3. Uncertainty Detection

When the AI responds with uncertainty indicators:
- "I don't know..."
- "I'm not sure..."
- "I don't have access to..."
- "My training data doesn't include..."

The system **automatically performs a search** and retries the response with current information.

## Configuration

### Required Environment Variables

Add to your `.env.local` file:
### Required Environment Variables

Add to your `.env.local` file:

```bash
# LangSearch API for web search functionality
LANGSEARCH_API_KEY=your_langsearch_api_key_here
```

For production (Vercel), add the same variable in your project settings.

### Usage Examples

Users can now ask:
```
"Search for Next.js 14 features"
"Look up the latest React best practices"
"What are the hours for Walmart?"
"Is Starbucks open now?"
"Find information about TypeScript 5.0"
```

The AI will automatically detect these patterns, perform the web search, and incorporate the results into its response.

## API Usage

### Request
```json
{
  "message": "search for latest AI developments",
  "history": [],
  "enableSearch": true
}
```

### Request

```json
{
  "message": "search for latest AI developments",
  "history": [],
  "enableSearch": true
}
```

### Response

```json
{
  "success": true,
  "message": "Based on the latest search results...",
  "model": "llama-3.3-70b-versatile",
  "usage": {...},
  "search": {
    "query": "latest AI developments",
    "instance": "LangSearch API",
    "resultCount": 5,
    "trigger": "explicit"
  }
}
```

### Trigger Types

- `explicit` - User explicitly requested a search
- `business` - Business information query detected
- `uncertainty` - AI indicated lack of knowledge

## Configuration Options

### Disable Search for Specific Requests

```javascript
fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "Your message",
    enableSearch: false  // Disable search for this request
  })
});
```

### Customize Search Behavior

Edit `/lib/searxng.js` to:
- Change the number of results (default: 5, business: 8)
- Adjust timeout duration (default: 10000ms)
- Modify search detection patterns
- Update API endpoint or configuration

## Architecture

```
/lib/searxng.js              - Core search utility (LangSearch)
  ├── searchWeb()            - Main search function
  ├── formatSearchResults()  - Format for AI consumption
  ├── shouldPerformWebSearch() - Detect if search needed
  ├── isBusinessQuery()      - Detect business queries
  ├── isUncertainResponse()  - Detect AI uncertainty
  └── extractSearchQuery()   - Extract search terms

/pages/api/chat.js           - Chat API endpoint
  └── [Integrated search]    - Auto-detects and performs searches

/.env.local                  - Environment configuration
  └── LANGSEARCH_API_KEY     - API key for LangSearch
```

## Error Handling

The system gracefully handles failures:
1. **API Error** - Falls back to AI's existing knowledge
2. **Timeout** - Returns after 10 seconds with graceful degradation
3. **No Results** - AI responds based on training data
4. **Rate Limiting** - Handled by LangSearch API

## Testing

### Test Basic Search
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "search for Next.js 14 features"
  }'
```

### Test Business Query
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are the hours for Starbucks?"
  }'
```

### Test with Search Disabled
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "search for Next.js 14 features",
    "enableSearch": false
  }'
```

## Performance

- **API Response** - Typically 1-3 seconds
- **Timeout** - 10 seconds maximum
- **Reliability** - Professional API with high uptime
- **No Fallback Needed** - Single reliable endpoint

## Troubleshooting

**Search not triggering:**
- Check if message contains search keywords or business terms
- Try explicit phrases like "search for..." or "look up..."
- Verify API key is set in environment variables

**API errors:**
- Check your LangSearch API key is valid
- Verify you have remaining API credits
- Check console logs for detailed error messages

**Slow responses:**
- LangSearch typically responds in 1-3 seconds
- Check your internet connection
- Verify timeout settings (default: 10s)

## Migration from SearXNG

The system has been migrated from free public SearXNG instances to LangSearch API for:
- ✅ Better reliability (no instance downtime)
- ✅ Faster response times
- ✅ More consistent results
- ✅ Professional support

**What changed:**
- Requires API key (LANGSEARCH_API_KEY)
- Single reliable endpoint instead of fallback instances
- Improved error handling and response format

## Future Enhancements

Potential improvements:
- [ ] Result caching to reduce API calls
- [ ] Custom search filters and categories
- [ ] Image/video search support
- [ ] Multi-language search results
- [ ] Advanced query optimization

## License & Credits

- **LangSearch API** - https://langsearch.com
- Respect API rate limits and terms of service
- Get your API key at: https://langsearch.com
