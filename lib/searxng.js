/**
 * SearXNG Search Utility
 * Uses US-based public SearXNG instances with automatic fallback
 */

// US-based SearXNG instances (in priority order)
const US_INSTANCES = [
  'https://search.us.projectsegfau.lt',
  'https://search.sapti.me',
  'https://paulgo.io',
  'https://searx.work',
  'https://priv.au' // Fallback option
];

/**
 * Perform a web search using SearXNG with automatic fallback
 * @param {string} query - The search query
 * @param {object} options - Search options
 * @param {number} options.maxResults - Maximum number of results to return (default: 5)
 * @param {number} options.timeout - Timeout in milliseconds (default: 5000)
 * @returns {Promise<object>} - Search results
 */
export async function searchWeb(query, options = {}) {
  const { maxResults = 5, timeout = 5000 } = options;
  
  if (!query || typeof query !== 'string') {
    throw new Error('Query must be a non-empty string');
  }

  const errors = [];
  
  // Try each instance until one succeeds
  for (const instance of US_INSTANCES) {
    try {
      const result = await searchWithInstance(instance, query, maxResults, timeout);
      if (result && result.results && result.results.length > 0) {
        return {
          success: true,
          query,
          instance,
          results: result.results,
          stats: {
            totalResults: result.results.length,
            searchTime: result.searchTime
          }
        };
      }
    } catch (error) {
      errors.push({
        instance,
        error: error.message
      });
      // Continue to next instance
      continue;
    }
  }
  
  // All instances failed
  throw new Error(`All SearXNG instances failed. Errors: ${JSON.stringify(errors)}`);
}

/**
 * Search using a specific SearXNG instance
 * @private
 */
async function searchWithInstance(instance, query, maxResults, timeout) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const url = `${instance}/search?q=${encodeURIComponent(query)}&format=json&pageno=1`;
    const startTime = Date.now();
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Aria-AI-Assistant/2.0'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    const searchTime = Date.now() - startTime;
    
    // Extract and format results
    const results = (data.results || [])
      .slice(0, maxResults)
      .map(result => ({
        title: result.title,
        url: result.url,
        content: result.content || result.snippet || '',
        engine: result.engine,
        score: result.score
      }));
    
    return {
      results,
      searchTime
    };
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

/**
 * Format search results for AI context
 * @param {object} searchResult - Result from searchWeb()
 * @returns {string} - Formatted text for AI consumption
 */
export function formatSearchResults(searchResult) {
  if (!searchResult || !searchResult.results || searchResult.results.length === 0) {
    return 'No search results found.';
  }
  
  let formatted = `Web Search Results for "${searchResult.query}":\n\n`;
  
  searchResult.results.forEach((result, index) => {
    formatted += `${index + 1}. ${result.title}\n`;
    formatted += `   URL: ${result.url}\n`;
    if (result.content) {
      formatted += `   ${result.content}\n`;
    }
    formatted += '\n';
  });
  
  formatted += `\nSource: ${searchResult.instance} (${searchResult.stats.totalResults} results in ${searchResult.stats.searchTime}ms)`;
  
  return formatted;
}

/**
 * Check if a query is asking about a business
 * @param {string} message - User message
 * @returns {boolean}
 */
export function isBusinessQuery(message) {
  const businessIndicators = [
    // Direct business queries
    /(?:hours|open|opening|closing|close)(?: (?:for|of|at))? [A-Z]/i,
    /(?:is|are) (?:the )?\w+ (?:open|closed)/i,
    /(?:when|what time) (?:does|do|is|are) (?:the )?\w+ (?:open|close)/i,
    
    // Business types with action words
    /(?:restaurant|cafe|coffee shop|bar|pub|hotel|motel|store|shop|mall|gym|bank|hospital|clinic|pharmacy|gas station|salon|spa|dentist|doctor)\b/i,
    
    // Location + business patterns
    /(?:near me|nearby|in|at) (?:the )?(?:restaurant|cafe|store|shop|hotel|gym|bank)/i,
    
    // Business information queries
    /(?:phone number|address|location|directions to|how to get to|contact) (?:for|of|to)? [A-Z]/i,
    /(?:menu|prices|rates|cost|reservations) (?:for|at|of) [A-Z]/i,
    
    // Named businesses (capitalized words + business context)
    /\b(?:hours|location|address|phone|menu|website) (?:for|of|at) [A-Z]\w+/i,
    /\b[A-Z]\w+ (?:restaurant|cafe|store|shop|hotel|gym|bank|hours|location)/i,
    
    // Business hours patterns
    /business hours/i,
    /hours of operation/i
  ];
  
  return businessIndicators.some(pattern => pattern.test(message));
}

/**
 * Check if AI response indicates uncertainty or lack of knowledge
 * @param {string} response - AI's response
 * @returns {boolean}
 */
export function isUncertainResponse(response) {
  if (!response || typeof response !== 'string') {
    return false;
  }
  
  const uncertaintyIndicators = [
    /I (?:don't|do not|dont) (?:have|know)/i,
    /I (?:am not|'m not|'m not) sure/i,
    /I (?:don't|do not) have (?:access to|information|data)/i,
    /I (?:cannot|can't|can not) provide/i,
    /I (?:lack|am missing) (?:the )?(?:information|data|knowledge)/i,
    /(?:my training|my knowledge|my data) (?:does not|doesn't|ended|cuts off|is limited)/i,
    /I would need (?:to|more) (?:search|look|check)/i,
    /(?:unfortunately|regrettably|sadly),? I (?:don't|do not|cannot)/i,
    /as an AI(?: language model)?,? I (?:don't|do not|cannot)/i,
    /I apologize, but I (?:don't|do not|cannot)/i,
    /without (?:current|real-time|up-to-date|recent) (?:information|data)/i,
    /I would recommend (?:searching|looking|checking)/i
  ];
  
  return uncertaintyIndicators.some(pattern => pattern.test(response));
}

/**
 * Check if a query appears to be asking for web search
 * @param {string} message - User message
 * @returns {boolean}
 */
export function shouldPerformWebSearch(message) {
  // Check if it's a business query first
  if (isBusinessQuery(message)) {
    return true;
  }
  
  const searchIndicators = [
    // Explicit search requests
    /search (?:for|the web|online)/i,
    /look up/i,
    /find (?:information|info) (?:on|about)/i,
    /web search/i,
    /google/i,
    /browse (?:for|the web)/i,
    
    // Current/recent information
    /what'?s (?:the latest|happening|new|current)/i,
    /current (?:news|events|information|status|price|weather)/i,
    /(?:latest|recent|newest|updated) (?:news|information|version|release)/i,
    /(?:today|this week|this month|right now)/i,
    
    // Real-time data
    /(?:stock price|weather|temperature|forecast)/i,
    /(?:score|result) of (?:the )?(?:game|match)/i,
    
    // Specific factual queries that may be outdated
    /(?:when|what time) (?:is|was|did)/i,
    /who (?:is|won|became)/i,
    /(?:price|cost) of/i
  ];
  
  return searchIndicators.some(pattern => pattern.test(message));
}

/**
 * Extract search query from user message
 * @param {string} message - User message
 * @returns {string|null} - Extracted query or null
 */
export function extractSearchQuery(message) {
  // Try to extract quoted search terms
  const quotedMatch = message.match(/["']([^"']+)["']/);
  if (quotedMatch) {
    return quotedMatch[1];
  }
  
  // For business queries, enhance with location/hours context
  if (isBusinessQuery(message)) {
    // Add 'hours' or 'location' to queries about businesses
    const hoursPattern = /\b(?:hours|open|opening|closing)\b/i;
    const hasHoursKeyword = hoursPattern.test(message);
    
    if (!hasHoursKeyword && /\b(?:restaurant|cafe|store|shop|hotel|bank|gym)\b/i.test(message)) {
      return message.trim() + ' hours location';
    }
  }
  
  // Try to extract after common search phrases
  const patterns = [
    /search (?:for |the web for |online for )?(.+?)(?:\?|$)/i,
    /look up (.+?)(?:\?|$)/i,
    /find (?:information|info) (?:on|about) (.+?)(?:\?|$)/i,
    /what'?s (?:the latest|happening|new) (?:on|about|with) (.+?)(?:\?|$)/i,
    /web search (?:for )?(.+?)(?:\?|$)/i,
    /(?:hours|location|address) (?:for|of|at) (.+?)(?:\?|$)/i,
    /(?:when|what time) (?:does|do|is) (.+?) (?:open|close)(?:\?|$)/i
  ];
  
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  
  // If no pattern matches, return the whole message (cleaned up)
  return message.replace(/\?$/, '').trim();
}

export default {
  searchWeb,
  formatSearchResults,
  shouldPerformWebSearch,
  extractSearchQuery,
  isBusinessQuery,
  isUncertainResponse
};
