# SearXNG Web Search Integration

## Overview

Aria now has integrated web search capabilities using public SearXNG instances hosted in the United States. The search feature automatically activates when users ask questions that require current information or explicitly request a web search.

## Features

✅ **Automatic Search Detection** - The AI automatically detects when to perform a web search  
✅ **US-Based Instances** - Uses only US-hosted SearXNG public instances  
✅ **Robust Fallback** - Automatically falls back to 5 different instances if one fails  
✅ **Fast Timeout** - 5-second timeout per instance to ensure quick response  
✅ **Privacy-Focused** - Uses privacy-respecting SearXNG metasearch engine  

## US-Based Instances (Priority Order)

1. `search.us.projectsegfau.lt` (Primary)
2. `search.sapti.me`
3. `paulgo.io`
4. `searx.work`
5. `priv.au` (Fallback)

## How It Works

### Automatic Detection

The system automatically performs a web search when it detects phrases like:
- "search for..."
- "look up..."
- "find information about..."
- "what's the latest..."
- "current news about..."
- "web search..."

### Manual Trigger

Users can explicitly request searches in their messages:
```
"Can you search the web for React best practices?"
"Look up the latest Next.js features"
"What's the current weather in San Francisco?"
```

### API Usage

**Request:**
```json
{
  "message": "search for latest AI developments",
  "history": [],
  "enableSearch": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Based on the latest search results...",
  "model": "llama-3.3-70b-versatile",
  "usage": {...},
  "search": {
    "query": "latest AI developments",
    "instance": "https://search.us.projectsegfau.lt",
    "resultCount": 5
  }
}
```

## Configuration

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
- Change the number of results (default: 5)
- Adjust timeout duration (default: 5000ms)
- Modify search detection patterns
- Add/remove instances

## Architecture

```
/lib/searxng.js              - Core search utility
  ├── searchWeb()            - Main search function with fallback
  ├── searchWithInstance()   - Query individual instance
  ├── formatSearchResults()  - Format for AI consumption
  ├── shouldPerformWebSearch() - Detect if search needed
  └── extractSearchQuery()   - Extract search terms

/pages/api/chat.js           - Chat API endpoint
  └── [Integrated search]    - Auto-detects and performs searches
```

## Error Handling

The system gracefully handles failures:
1. **Instance Down** - Automatically tries next instance
2. **Timeout** - Moves to next instance after 5 seconds
3. **All Instances Failed** - Falls back to AI's existing knowledge
4. **No Results** - AI responds based on training data

## Testing

### Test Basic Search
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "search for Next.js 14 features"
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

## Privacy & Performance

- **No Tracking** - SearXNG instances don't track users
- **No API Keys** - Completely free, no registration required
- **Fast** - 5-second timeout ensures quick responses
- **Reliable** - 5 fallback instances ensure high availability

## Troubleshooting

**Search not triggering:**
- Check if message contains search keywords
- Try explicit phrases like "search for..." or "look up..."

**All instances failing:**
- Instances may be temporarily down
- Check your internet connection
- AI will fall back to existing knowledge

**Slow responses:**
- First instance might be slow, will timeout and try next
- Consider adjusting timeout in `/lib/searxng.js`

## Future Enhancements

Potential improvements:
- [ ] Cache working instances
- [ ] Periodic health checks
- [ ] User preference for search behavior
- [ ] Search result caching
- [ ] More granular search categories
- [ ] Support for image/video search

## License

This integration uses public SearXNG instances. Respect their usage policies and consider donating to instance maintainers if you use them heavily.
