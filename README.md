# Aria - Next.js AI Chat

Aria is a Next.js chat app with a Groq-backed API route and a dark, animated UI.

## Stack

- Next.js (Pages Router)
- React 18
- Groq SDK

## Features

- Chat UI with suggestion cards and loading indicator
- Server-side AI calls through a Next API route
- Conversation history passed to the model for context
- Single-command local development and production build

## Project Structure

```text
Aria-2/
├── components/
│   └── ChatInterface.js
├── pages/
│   ├── _app.js
│   ├── _document.js
│   ├── index.js
│   └── api/
│       └── chat.js
├── styles.css
├── package.json
├── vercel.json
└── .env.example
```

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Create local environment file:

```bash
cp .env.example .env.local
```

3. Set required environment values in `.env.local`:

```env
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
```

4. Start dev server:

```bash
npm run dev
```

Open: http://localhost:3000

## Build & Run

```bash
npm run build
npm run start
```

## API

- Endpoint: `POST /api/chat`
- Request body:

```json
{
  "message": "Design a modern dashboard",
  "history": [
    { "role": "user", "content": "Hello" },
    { "role": "assistant", "content": "Hi!" }
  ]
}
```

- Response shape:

```json
{
  "success": true,
  "message": "...",
  "model": "...",
  "usage": {}
}
```

## Deploy

Configured for Vercel with Next.js framework in `vercel.json`.
Set `GROQ_API_KEY` and `GROQ_MODEL` in Vercel environment variables.