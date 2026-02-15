# Aria AI Chat - Deployment Guide

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your Groq API key:
```env
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
```

### 3. Run Development Server
```bash
npm run dev
```

Visit: `http://localhost:3000`

---

## 📦 Deploy to Vercel

### Option 1: Using Vercel CLI

1. **Install Vercel CLI** (if not already installed):
```bash
npm install -g vercel
```

2. **Login to Vercel**:
```bash
vercel login
```

3. **Deploy**:
```bash
vercel
```

For production deployment:
```bash
vercel --prod
```

### Option 2: Using Vercel Dashboard

1. **Push your code to GitHub**:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

2. **Import to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect the configuration

3. **Set Environment Variables** in Vercel Dashboard:
   - Go to Project Settings → Environment Variables
   - Add the following variables:

   | Name | Value | Environment |
   |------|-------|-------------|
   | `GROQ_API_KEY` | Your Groq API key | Production, Preview, Development |
   | `GROQ_MODEL` | `llama-3.3-70b-versatile` | Production, Preview, Development |

4. **Deploy**:
   - Click "Deploy"
   - Your app will be live at `your-project.vercel.app`

---

## 🔧 Environment Variables

### Required Variables

- **GROQ_API_KEY**: Your Groq API key from [console.groq.com](https://console.groq.com)
- **GROQ_MODEL**: The AI model to use (default: `llama-3.3-70b-versatile`)

### Available Groq Models

- `llama-3.3-70b-versatile` (Recommended) - Fast, versatile responses
- `llama-3.1-70b-versatile` - High quality, balanced
- `mixtral-8x7b-32768` - Good for longer context
- `gemma2-9b-it` - Lightweight and fast

---

## 📁 Project Structure

```
Aria-2/
├── api/
│   └── chat.js              # Vercel serverless function for Groq API
├── index.html               # Main HTML
├── styles.css               # Styling and animations
├── script.js                # Frontend JavaScript with API calls
├── package.json             # Dependencies
├── vercel.json              # Vercel configuration
├── .env.local               # Local environment variables (gitignored)
├── .env.example             # Environment variables template
├── .gitignore               # Git ignore rules
└── README.md                # Main documentation
```

---

## 🔐 Security Notes

1. **Never commit `.env.local`** - It contains your API key
2. **Use environment variables** in Vercel for production
3. **API key is server-side only** - Never exposed to client
4. **CORS is enabled** for API endpoint but can be restricted

---

## 🧪 Testing

### Test Locally
```bash
npm run dev
```

### Test API Endpoint Directly
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, how are you?"}'
```

---

## 🐛 Troubleshooting

### "Module not found: Can't resolve 'groq-sdk'"
Run: `npm install`

### "API key is required"
Check your `.env.local` file has `GROQ_API_KEY` set

### "Failed to generate response"
- Check your Groq API key is valid
- Ensure you have credits in your Groq account
- Check browser console for detailed errors

### Vercel deployment fails
- Ensure all environment variables are set in Vercel dashboard
- Check build logs in Vercel for specific errors
- Verify `vercel.json` is properly configured

---

## 💡 Customization

### Change AI Model
In `.env.local` or Vercel environment variables:
```env
GROQ_MODEL=llama-3.1-70b-versatile
```

### Modify System Prompt
Edit the system message in [`api/chat.js`](api/chat.js):
```javascript
{
  role: 'system',
  content: 'Your custom system prompt here...'
}
```

### Adjust Temperature (Creativity)
In [`api/chat.js`](api/chat.js), change:
```javascript
temperature: 0.7,  // Lower = more focused, Higher = more creative (0-2)
```

### Change Max Response Length
In [`api/chat.js`](api/chat.js), change:
```javascript
max_tokens: 2048,  // Increase for longer responses
```

---

## 📊 API Usage & Costs

Groq offers:
- **Free tier**: Generous limits for development
- **Pay-as-you-go**: Very competitive pricing
- Monitor usage at: [console.groq.com](https://console.groq.com)

---

## 🔄 CI/CD

Vercel automatically deploys when you push to GitHub:
- **main branch** → Production deployment
- **Other branches** → Preview deployments

---

## 📝 License

MIT License - Feel free to use and modify!

---

## 🆘 Support

- **Groq Documentation**: [console.groq.com/docs](https://console.groq.com/docs)
- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **Issues**: Create an issue in your GitHub repository

---

**Built with ❤️ using Groq AI and Vercel**
