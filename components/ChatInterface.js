import { useMemo, useState } from 'react';

const suggestions = [
  { icon: '✨', label: 'Design a modern landing page', prompt: 'Design a modern landing page with animations' },
  { icon: '⚛️', label: 'Build a React component', prompt: 'Build a React component with hooks' },
  { icon: '📧', label: 'Create an email template', prompt: 'Create an email template design' },
  { icon: '🎨', label: 'Fix CSS animations', prompt: 'Fix CSS animation performance' }
];

export default function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const conversationHistory = useMemo(
    () => messages.map((message) => ({ role: message.role, content: message.content })),
    [messages]
  );

  const sendMessage = async (overrideMessage) => {
    const message = (overrideMessage ?? input).trim();
    if (!message || isLoading) {
      return;
    }

    const nextMessages = [...messages, { role: 'user', content: message }];
    setMessages(nextMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          history: conversationHistory
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage = data?.message || "I apologize, but I couldn't generate a response.";

      setMessages((current) => [...current, { role: 'assistant', content: assistantMessage }]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: "I apologize, but I'm having trouble connecting right now. Please try again in a moment."
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    await sendMessage();
  };

  const startNewChat = () => {
    if (isLoading) {
      return;
    }

    setMessages([]);
    setInput('');
  };

  return (
    <div className="container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <button className="new-chat-btn" type="button" onClick={startNewChat}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            New Chat
          </button>
        </div>
        <nav className="chat-history">
          <div className="chat-item active">
            <span>Current chat</span>
          </div>
        </nav>
      </aside>

      <main className="chat-main">
        <div className="messages-container">
          {messages.length === 0 && (
            <div className="welcome-section">
              <h1 className="welcome-title">Welcome to Aria</h1>
              <p className="welcome-subtitle">Your creative AI design assistant</p>
              <div className="suggestions">
                {suggestions.map((item) => (
                  <button
                    key={item.label}
                    className="suggestion-card"
                    type="button"
                    onClick={() => sendMessage(item.prompt)}
                    disabled={isLoading}
                  >
                    <span className="suggestion-icon">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="messages" id="messages">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`message ${message.role === 'user' ? 'user' : 'assistant'}`}>
                <div className="message-avatar">{message.role === 'user' ? 'You' : 'AI'}</div>
                <div className="message-content">{message.content}</div>
              </div>
            ))}

            {isLoading && (
              <div className="message assistant">
                <div className="message-avatar">AI</div>
                <div className="typing-indicator">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="input-area">
          <form className="input-wrapper" onSubmit={onSubmit}>
            <input
              type="text"
              className="message-input"
              placeholder="Ask me anything..."
              value={input}
              onChange={(event) => setInput(event.target.value)}
              disabled={isLoading}
            />
            <button className="send-btn" type="submit" disabled={isLoading || !input.trim()}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </form>
          <p className="input-hint">Aria can make mistakes. Consider checking important information.</p>
        </div>
      </main>
    </div>
  );
}