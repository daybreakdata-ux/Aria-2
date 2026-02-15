import { useEffect, useMemo, useRef, useState } from 'react';

const suggestions = [
  { title: 'Design a modern landing page', caption: 'with subtle motion and strong hierarchy', prompt: 'Design a modern landing page with animations and bold typography.' },
  { title: 'Build a React component', caption: 'with clean hooks and state flows', prompt: 'Build a React component with hooks and accessible patterns.' },
  { title: 'Create an email template', caption: 'for a new product launch', prompt: 'Create an email template design for a product launch.' },
  { title: 'Fix CSS animations', caption: 'that feel janky on scroll', prompt: 'Fix CSS animation performance on scroll-heavy pages.' }
];

export default function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

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

  const onKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const extractCodeBlocks = (content) => {
    const codeBlocks = [];
    const regex = /```(\w+)?\n([\s\S]*?)```/g;
    let match = null;

    while ((match = regex.exec(content)) !== null) {
      codeBlocks.push({
        language: (match[1] || '').toLowerCase(),
        code: match[2]
      });
    }

    return codeBlocks;
  };

  const extractImageUrls = (content) => {
    const regex = /https?:\/\/[^\s)"]+\.(png|jpg|jpeg|gif|webp|svg)(\?[^\s)"]*)?/gi;
    const matches = content.match(regex) || [];
    return Array.from(new Set(matches));
  };

  const getExtensionForLanguage = (language) => {
    const map = {
      javascript: 'js',
      js: 'js',
      typescript: 'ts',
      ts: 'ts',
      jsx: 'jsx',
      tsx: 'tsx',
      json: 'json',
      html: 'html',
      css: 'css',
      md: 'md',
      markdown: 'md',
      sh: 'sh',
      bash: 'sh',
      py: 'py',
      python: 'py',
      go: 'go',
      rs: 'rs',
      rust: 'rs',
      java: 'java',
      c: 'c',
      cpp: 'cpp',
      yml: 'yml',
      yaml: 'yml'
    };

    return map[language] || 'txt';
  };

  const formatTimestamp = () => new Date().toISOString().replace(/[:.]/g, '-');

  const triggerDownload = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const downloadText = (content, filename) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    triggerDownload(blob, filename);
  };

  const downloadImage = async (url, filename) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch image');
      }
      const blob = await response.blob();
      triggerDownload(blob, filename);
    } catch (error) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">Aria-X</span>
          <span className="brand-subtitle">AI chat</span>
        </div>
        <button className="primary-action" type="button" onClick={startNewChat}>
          <span className="action-icon">+</span>
          New chat
        </button>
        <div className="sidebar-section">
          <p className="section-title">Chats</p>
          <button className="chat-row active" type="button">
            <span className="chat-title">Current chat</span>
            <span className="chat-meta">Just now</span>
          </button>
        </div>
        <div className="sidebar-footer">
          <button className="ghost-action" type="button">Help</button>
          <button className="ghost-action" type="button">Privacy</button>
        </div>
      </aside>

      <section className="content">
        <header className="topbar">
          <div>
            <p className="topbar-title">Aria-X Chat</p>
            <p className="topbar-subtitle">No settings, just conversation.</p>
          </div>
          <div className="topbar-actions">
            <button className="ghost-action" type="button" onClick={startNewChat}>New chat</button>
          </div>
        </header>

        <main className="chat-area">
          {messages.length === 0 && (
            <div className="hero">
              <div className="hero-badge">Welcome</div>
              <h1 className="hero-title">Ask Aria-X anything.</h1>
              <p className="hero-copy">Fast, focused answers built for your workflow.</p>
              <div className="hero-grid">
                {suggestions.map((item) => (
                  <button
                    key={item.title}
                    className="hero-card"
                    type="button"
                    onClick={() => sendMessage(item.prompt)}
                    disabled={isLoading}
                  >
                    <p className="hero-card-title">{item.title}</p>
                    <p className="hero-card-caption">{item.caption}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="messages" id="messages">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`message-row ${message.role === 'user' ? 'user' : 'assistant'}`}
              >
                <div className="message-bubble">
                  <span className="message-role">{message.role === 'user' ? 'You' : 'Aria-X'}</span>
                  <div className="message-content">{message.content}</div>
                  {message.role === 'assistant' && (() => {
                    const codeBlocks = extractCodeBlocks(message.content);
                    const imageUrls = extractImageUrls(message.content);
                    const timestamp = formatTimestamp();

                    if (codeBlocks.length === 0 && imageUrls.length === 0) {
                      return null;
                    }

                    return (
                      <div className="message-actions">
                        {codeBlocks.map((block, blockIndex) => {
                          const extension = getExtensionForLanguage(block.language);
                          const filename = `aria-x-code-${index + 1}-${blockIndex + 1}-${timestamp}.${extension}`;
                          return (
                            <button
                              key={`code-${blockIndex}`}
                              className="download-btn"
                              type="button"
                              onClick={() => downloadText(block.code, filename)}
                            >
                              Download code {blockIndex + 1}
                            </button>
                          );
                        })}
                        {imageUrls.map((url, imageIndex) => {
                          const filename = `aria-x-image-${index + 1}-${imageIndex + 1}-${timestamp}`;
                          return (
                            <button
                              key={`image-${imageIndex}`}
                              className="download-btn secondary"
                              type="button"
                              onClick={() => downloadImage(url, filename)}
                            >
                              Download image {imageIndex + 1}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="message-row assistant">
                <div className="message-bubble">
                  <span className="message-role">Aria-X</span>
                  <div className="typing">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </main>

        <form className="composer" onSubmit={onSubmit}>
          <textarea
            className="composer-input"
            placeholder="Send a message..."
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={onKeyDown}
            disabled={isLoading}
            rows={1}
          />
          <button className="send-btn" type="submit" disabled={isLoading || !input.trim()}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </form>
        <p className="disclaimer">Aria-X can make mistakes. Check important information.</p>
        <p className="footer-note">Copyright Daybreak Digital 2026</p>
      </section>
      <div className="ambient" aria-hidden="true"></div>
    </div>
  );
}