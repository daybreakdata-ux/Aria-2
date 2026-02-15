import { Groq } from 'groq-sdk';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GROQ_API_KEY not configured' });
    }

    const groq = new Groq({ apiKey });
    const model = process.env.GROQ_MODEL || 'mixtral-8x7b-32768';

    const completion = await groq.chat.completions.create({
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      model: model,
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 1,
      stream: false,
    });

    const assistantMessage = completion.choices[0]?.message?.content || '';

    return res.status(200).json({
      content: assistantMessage,
      model: model,
    });
  } catch (error) {
    console.error('Groq API Error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to get response from AI',
    });
  }
}
