# Aria - AI Chat UI Replica

A modern, animated AI chat interface inspired by v0.dev. Built with pure HTML, CSS, and JavaScript with smooth animations and responsive design.

## Features

### 🎨 Design
- **Dark Theme**: Professional dark interface with carefully chosen colors
- **Modern Layout**: Sidebar navigation + main chat area
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Clean Typography**: Professional font stack with excellent readability

### ✨ Animations
- **Message Animations**: Smooth slide-in effects for messages
- **Typing Indicator**: Animated dots showing AI is typing
- **Typewriter Effect**: Text appears gradually as if being typed
- **Hover Effects**: Interactive feedback on all buttons and cards
- **Loading States**: Visual feedback during interactions
- **Pop-in Suggestions**: Staggered animation on suggestion cards
- **Smooth Transitions**: 0.2-0.3s ease-out transitions throughout

### 💬 Chat Features
- **Message History**: Sidebar shows recent conversations
- **Suggestion Cards**: Quick prompts for common requests
- **Chat Context**: AI generates contextual responses
- **Real-time Input**: Type with Enter to send
- **New Chat Button**: Start fresh conversations
- **Delete Chat**: Remove history items

## File Structure

```
Aria-2/
├── index.html      # Main HTML structure
├── styles.css      # All styling and animations
├── script.js       # Interactive functionality
└── README.md       # Documentation
```

## Animation Details

### Key Animations Included

1. **slideInLeft** - Sidebar enters from left
2. **slideUp** - Messages and input area slide up on load
3. **glideDown** - Welcome title glides down
4. **popIn** - Suggestion cards pop in with stagger
5. **messageSlideIn** - Chat messages slide in
6. **avatarPop** - Message avatars scale and pop in
7. **typingAnimation** - Typing dots bounce up and down
8. **messageFadeIn** - Messages fade in smoothly

### CSS Variables

The design uses CSS variables for easy theming:
- `--bg-primary`: Main background (#0f0f0f)
- `--bg-secondary`: Secondary background (#1a1a1a)
- `--accent-color`: Primary accent (#10a37f - teal)
- `--text-primary`: Text color (#ffffff)
- `--text-secondary`: Secondary text (#b4b4b4)

## How to Run

### Option 1: Local Server (Recommended)
```bash
cd /workspaces/Aria-2
python3 -m http.server 8000
```
Then visit: `http://localhost:8000`

### Option 2: With Live Server (VS Code)
Right-click index.html > Open with Live Server

### Option 3: Direct File
Double-click index.html

## Interactive Elements

### Text Input
- Type any message and press Enter or click Send
- AI generates contextual responses based on keywords
- Typewriter effect displays the response gradually

### Suggestion Cards
- Click any suggestion card to auto-fill the input
- Message sends automatically
- Contextual AI responses:
  - "landing page" → Web design tips
  - "React component" → React best practices
  - "email template" → Email design guidance
  - "CSS animation" → Animation performance tips

### Chat History
- View recent conversations in sidebar
- Hover to reveal delete button
- Click to view/select conversations
- New Chat button clears everything

## Customization

### Change Colors
Edit the CSS variables at the top of styles.css

### Adjust Animation Speed
Modify timeline values in CSS animations

### Add More Responses
In script.js, add to the responses object in generateAIResponse()

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- Uses GPU-accelerated animations (transform, opacity)
- Smooth 60fps animations
- Lightweight JavaScript (no dependencies)
- CSS animations instead of JavaScript for better performance
- Optimized scrolling

---

**Version**: 1.0.0  
**Created**: February 2026