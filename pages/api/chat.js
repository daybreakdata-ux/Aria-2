import Groq from 'groq-sdk';

const defaultSystemPrompt = `You are Aria, a helpful and creative AI design assistant. You excel at:
- Web design and development advice
- Creating React components and modern UI/UX patterns
- CSS animations and styling best practices
- Email template design
- Frontend performance optimization
- Providing clear, concise, and actionable advice

Keep responses friendly, professional, and formatted with proper markdown when appropriate. Use bullet points and code examples when helpful.`;

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, history = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const systemPrompt =
      process.env.CHAT_PROMPT ||
      process.env.SYSTEM_PROMPT ||
      process.env.GROQ_SYSTEM_PROMPT ||
      defaultSystemPrompt;

    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      ...history.map((chatMessage) => ({
        role: chatMessage.role,
        content: chatMessage.content
      })),
      {
        role: 'user',
        content: message
      }
    ];

    const completion = await groq.chat.completions.create({
      messages,
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 2048,
      top_p: 1,
      stream: false
    });

    const reply = completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';

    return res.status(200).json({
      success: true,
      message: reply,
      model: completion.model,
      usage: completion.usage
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to generate response',
      details: error.message
    });
  }
}
