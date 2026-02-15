import express from 'express';
import cors from 'cors';
import { Groq } from 'groq-sdk';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: '.env.local' });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files (frontend)
app.use(express.static('.'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: 'GROQ_API_KEY not configured' });
    }

    // Initialize Groq client per request for better flexibility
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

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

    res.json({
      content: assistantMessage,
      model: model,
    });
  } catch (error) {
    console.error('Groq API Error:', error);
    res.status(500).json({
      error: error.message || 'Failed to get response from AI',
    });
  }
});

// 404 handler for API routes
app.use('/api/', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Fallback to serving index.html for SPA
app.get('*', (req, res) => {
  res.sendFile('index.html', { root: '.' });
});

app.listen(PORT, () => {
  console.log(`🚀 Aria Chat Server running on http://localhost:${PORT}`);
  console.log(`📝 Chat API: POST /api/chat`);
  console.log(`✅ Health check: GET /api/health`);
  console.log(`🔑 Using model: ${process.env.GROQ_MODEL || 'mixtral-8x7b-32768'}`);
  if (process.env.GROQ_API_KEY) {
    console.log(`✓ GROQ_API_KEY loaded`);
  } else {
    console.warn(`⚠️  Warning: GROQ_API_KEY not found in environment`);
  }
});
