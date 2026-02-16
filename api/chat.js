import Groq from 'groq-sdk';
import { searchWeb, formatSearchResults, shouldPerformWebSearch, extractSearchQuery, isUncertainResponse, isBusinessQuery } from '../lib/searxng.js';

const defaultSystemPrompt = `You are Aria, a helpful and creative AI design assistant. You excel at:
- Web design and development advice
- Creating React components and modern UI/UX patterns
- CSS animations and styling best practices
- Email template design
- Frontend performance optimization
- Providing clear, concise, and actionable advice

You have access to web search capabilities. When users ask for current information, recent events, business information (hours, locations), or want you to search the web, you can use the provided search results to give accurate, up-to-date information.

IMPORTANT: If you don't have certain information or are asked about current/recent events or business details, say so clearly. The system will automatically search for the information and provide it to you.

Keep responses friendly, professional, and formatted with proper markdown when appropriate. Use bullet points and code examples when helpful.`;

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, history = [], enableSearch = true } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const systemPrompt =
      process.env.CHAT_PROMPT ||
      process.env.SYSTEM_PROMPT ||
      process.env.GROQ_SYSTEM_PROMPT ||
      defaultSystemPrompt;

    // Check if we should perform a web search upfront
    let searchContext = '';
    let searchMetadata = null;
    let shouldSearch = enableSearch && (shouldPerformWebSearch(message) || isBusinessQuery(message));
    
    if (shouldSearch) {
      let searchQuery = null;
      let isBusiness = false;
      try {
        searchQuery = extractSearchQuery(message);
        isBusiness = isBusinessQuery(message);
        // Business queries get more results for hours, location, contact info
        const maxResults = isBusiness ? 8 : 5;
        const searchResults = await searchWeb(searchQuery, { maxResults, timeout: 5000 });
        searchContext = '\n\n' + formatSearchResults(searchResults) + '\n\nPlease use the above search results to answer the user\'s question with accurate, current information.' + (isBusiness ? ' Focus on business hours, location, contact information, and current status (open/closed).' : '');
        searchMetadata = {
          query: searchQuery,
          instance: searchResults.instance,
          resultCount: searchResults.stats.totalResults,
          trigger: isBusiness ? 'business' : 'explicit'
        };
      } catch (error) {
        console.error('Search error:', {
          message: error.message,
          query: searchQuery,
          isBusiness,
          enableSearch
        });
        searchContext = '\n\n[Note: Web search was attempted but failed. Please answer based on your existing knowledge and indicate if you lack current information.]';
      }
    }

    // Build messages array with chat history
    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      ...history.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user',
        content: message + searchContext
      }
    ];

    // Call Groq API
    const completion = await groq.chat.completions.create({
      messages: messages,
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 2048,
      top_p: 1,
      stream: false
    });

    let reply = completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';

    // Check if the AI response indicates uncertainty and we haven't searched yet
    if (enableSearch && !shouldSearch && isUncertainResponse(reply)) {
      try {
        console.log('Detected uncertain response, performing automatic search...');
        const searchQuery = extractSearchQuery(message);
        const searchResults = await searchWeb(searchQuery, { maxResults: 5, timeout: 5000 });
        
        // Retry with search context
        const retryMessages = [
          {
            role: 'system',
            content: systemPrompt
          },
          ...history.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          {
            role: 'user',
            content: message + '\n\n' + formatSearchResults(searchResults) + '\n\nPlease use the above search results to provide an accurate answer.'
          }
        ];
        
        const retryCompletion = await groq.chat.completions.create({
          messages: retryMessages,
          model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
          temperature: 0.7,
          max_tokens: 2048,
          top_p: 1,
          stream: false
        });
        
        reply = retryCompletion.choices[0]?.message?.content || reply;
        searchMetadata = {
          query: searchQuery,
          instance: searchResults.instance,
          resultCount: searchResults.stats.totalResults,
          trigger: 'uncertainty'
        };
      } catch (error) {
        console.error('Retry search error:', {
          message: error.message,
          enableSearch
        });
        // Keep original uncertain response
      }
    }

    const response = {
      success: true,
      message: reply,
      model: completion.model,
      usage: completion.usage
    };
    
    if (searchMetadata) {
      response.search = searchMetadata;
    }

    return res.status(200).json(response);

  } catch (error) {
    console.error('Error calling Groq API:', {
      message: error.message,
      stack: error.stack
    });
    
    return res.status(500).json({
      success: false,
      error: 'Failed to generate response',
      details: error.message
    });
  }
}
