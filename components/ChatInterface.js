import { useEffect, useMemo, useRef, useState } from 'react';

export default function ChatInterface() {
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobilePortrait, setIsMobilePortrait] = useState(false);
  const messagesEndRef = useRef(null);
  const lottieRef = useRef(null);
  const streamIntervalRef = useRef(null);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem('aria-theme');
    if (storedTheme) {
      setTheme(storedTheme);
      return;
    }

    const prefersLight = window.matchMedia?.('(prefers-color-scheme: light)').matches;
    setTheme(prefersLight ? 'light' : 'dark');
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('aria-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return undefined;
    }

    const media = window.matchMedia('(max-width: 960px)');

    const syncLayout = () => {
      setIsMobilePortrait(media.matches);
      setIsSidebarOpen(!media.matches);
    };

    syncLayout();

    if (media.addEventListener) {
      media.addEventListener('change', syncLayout);
    } else {
      media.addListener(syncLayout);
    }

    return () => {
      if (media.removeEventListener) {
        media.removeEventListener('change', syncLayout);
      } else {
        media.removeListener(syncLayout);
      }
    };
  }, []);

  useEffect(() => {
    const storedChats = window.localStorage.getItem('aria-chats');
    const storedActive = window.localStorage.getItem('aria-active-chat');

    if (storedChats) {
      try {
        const parsed = JSON.parse(storedChats);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setChats(parsed);
          if (storedActive && parsed.some((chat) => chat.id === storedActive)) {
            setActiveChatId(storedActive);
          } else {
            setActiveChatId(parsed[0].id);
          }
          return;
        }
      } catch (error) {
        window.localStorage.removeItem('aria-chats');
      }
    }

    const starter = createChat('New chat');
    setChats([starter]);
    setActiveChatId(starter.id);
  }, []);

  useEffect(() => {
    if (chats.length === 0) {
      return;
    }
    window.localStorage.setItem('aria-chats', JSON.stringify(chats));
    if (activeChatId) {
      window.localStorage.setItem('aria-active-chat', activeChatId);
    }
  }, [chats, activeChatId]);

  const activeChat = useMemo(
    () => chats.find((chat) => chat.id === activeChatId) || null,
    [chats, activeChatId]
  );

  const messages = useMemo(() => activeChat?.messages ?? [], [activeChat]);

  useEffect(() => {
    let animation = null;

    const loadAnimation = async () => {
      if (!lottieRef.current) {
        return;
      }

      const lottie = (await import('lottie-web')).default;
      animation = lottie.loadAnimation({
        container: lottieRef.current,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: 'https://gcore.jsdelivr.net/gh/AI-QL/chat-ui/lottie.json'
      });
    };

    loadAnimation();

    return () => {
      if (animation) {
        animation.destroy();
      }
    };
  }, [messages.length]);

  useEffect(() => {
    return () => {
      if (streamIntervalRef.current) {
        window.clearInterval(streamIntervalRef.current);
      }
    };
  }, []);

  const conversationHistory = useMemo(
    () => messages.map((message) => ({ role: message.role, content: message.content })),
    [messages]
  );

  function createChat(title) {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `chat-${Date.now()}`;
    const timestamp = new Date().toISOString();
    return {
      id,
      title: title || 'New chat',
      createdAt: timestamp,
      updatedAt: timestamp,
      messages: []
    };
  }

  function deriveTitle(text) {
    const cleaned = text.replace(/\s+/g, ' ').trim();
    if (!cleaned) {
      return 'New chat';
    }
    const words = cleaned.split(' ');
    const short = words.slice(0, 6).join(' ');
    return short.length > 36 ? `${short.slice(0, 33)}...` : short;
  }

  const updateActiveChat = (updater, chatId = activeChatId) => {
    if (!chatId) {
      return;
    }
    setChats((current) => current.map((chat) => {
      if (chat.id !== chatId) {
        return chat;
      }
      return updater(chat);
    }));
  };

  const sendMessage = async (overrideMessage) => {
    const message = (overrideMessage ?? input).trim();
    if (!message || isLoading) {
      return;
    }
    const now = new Date().toISOString();
    if (!activeChatId || !activeChat) {
      const fallback = createChat(deriveTitle(message));
      fallback.messages = [{ role: 'user', content: message, timestamp: now }];
      fallback.updatedAt = now;
      setChats((current) => [fallback, ...current]);
      setActiveChatId(fallback.id);
    } else {
      updateActiveChat((chat) => ({
        ...chat,
        title: chat.title === 'New chat' ? deriveTitle(message) : chat.title,
        updatedAt: now,
        messages: [...chat.messages, { role: 'user', content: message, timestamp: now }]
      }));
    }
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

      startStreaming(assistantMessage);
    } catch (error) {
      const now = new Date().toISOString();
      updateActiveChat((chat) => ({
        ...chat,
        updatedAt: now,
        messages: [
          ...chat.messages,
          {
            role: 'assistant',
            content: "I apologize, but I'm having trouble connecting right now. Please try again in a moment.",
            timestamp: now
          }
        ]
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const startStreaming = (fullText) => {
    if (streamIntervalRef.current) {
      window.clearInterval(streamIntervalRef.current);
    }

    const now = new Date().toISOString();
    updateActiveChat((chat) => ({
      ...chat,
      updatedAt: now,
      messages: [
        ...chat.messages,
        {
          role: 'assistant',
          content: '',
          fullContent: fullText,
          isStreaming: true,
          timestamp: now
        }
      ]
    }));
    let charIndex = 0;

    streamIntervalRef.current = window.setInterval(() => {
      charIndex = Math.min(charIndex + 1, fullText.length);
      updateActiveChat((chat) => {
        const nextMessages = [...chat.messages];
        const lastIndex = nextMessages.length - 1;
        if (lastIndex < 0) {
          return chat;
        }

        const lastMessage = nextMessages[lastIndex];
        if (lastMessage.role !== 'assistant' || !lastMessage.isStreaming) {
          return chat;
        }

        nextMessages[lastIndex] = {
          ...lastMessage,
          content: fullText.slice(0, charIndex),
          isStreaming: charIndex < fullText.length
        };

        return {
          ...chat,
          messages: nextMessages,
          updatedAt: new Date().toISOString()
        };
      });

      if (charIndex >= fullText.length) {
        window.clearInterval(streamIntervalRef.current);
        streamIntervalRef.current = null;
      }
    }, 20);
  };

  const skipStreaming = () => {
    if (streamIntervalRef.current) {
      window.clearInterval(streamIntervalRef.current);
      streamIntervalRef.current = null;
    }

    updateActiveChat((chat) => {
      const nextMessages = [...chat.messages];
      for (let index = nextMessages.length - 1; index >= 0; index -= 1) {
        const message = nextMessages[index];
        if (message?.isStreaming) {
          nextMessages[index] = {
            ...message,
            content: message.fullContent || message.content,
            isStreaming: false
          };
          break;
        }
      }
      return {
        ...chat,
        messages: nextMessages,
        updatedAt: new Date().toISOString()
      };
    });
  };


  const onSubmit = async (event) => {
    event.preventDefault();
    await sendMessage();
  };

  const startNewChat = () => {
    if (isLoading) {
      return;
    }

    if (streamIntervalRef.current) {
      window.clearInterval(streamIntervalRef.current);
      streamIntervalRef.current = null;
    }

    const newChat = createChat('New chat');
    setChats((current) => [newChat, ...current]);
    setActiveChatId(newChat.id);
    setInput('');
  };

  const onKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const toggleSidebar = () => setIsSidebarOpen((current) => !current);
  const closeSidebar = () => setIsSidebarOpen(false);

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

  const renderInline = (text, keyPrefix) => {
    const patterns = [
      {
        regex: /`([^`]+)`/,
        render: (match, key) => <code key={key}>{match[1]}</code>
      },
      {
        regex: /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/,
        render: (match, key) => (
          <a key={key} href={match[2]} target="_blank" rel="noreferrer">
            {match[1]}
          </a>
        )
      },
      {
        regex: /\*\*([^*]+)\*\*/,
        render: (match, key) => <strong key={key}>{match[1]}</strong>
      },
      {
        regex: /\*([^*]+)\*/,
        render: (match, key) => <em key={key}>{match[1]}</em>
      }
    ];

    const nodes = [];
    let cursor = 0;
    let tokenIndex = 0;

    while (cursor < text.length) {
      let earliest = null;
      let earliestPattern = null;

      patterns.forEach((pattern) => {
        const match = pattern.regex.exec(text.slice(cursor));
        if (!match) {
          return;
        }
        const index = match.index + cursor;
        if (!earliest || index < earliest.index) {
          earliest = { match, index };
          earliestPattern = pattern;
        }
      });

      if (!earliest) {
        nodes.push(text.slice(cursor));
        break;
      }

      if (earliest.index > cursor) {
        nodes.push(text.slice(cursor, earliest.index));
      }

      nodes.push(earliestPattern.render(earliest.match, `${keyPrefix}-${tokenIndex}`));
      tokenIndex += 1;
      cursor = earliest.index + earliest.match[0].length;
    }

    return nodes;
  };

  const renderMarkdown = (content) => {
    const segments = content.split('```');
    const blocks = [];

    segments.forEach((segment, segmentIndex) => {
      if (segmentIndex % 2 === 1) {
        const lines = segment.split('\n');
        const language = lines[0].match(/^[a-zA-Z0-9#+.-]+$/) ? lines.shift() : '';
        const code = lines.join('\n');
        blocks.push(
          <pre key={`code-${segmentIndex}`} data-language={language || undefined}>
            <code>{code}</code>
          </pre>
        );
        return;
      }

      const lines = segment.split('\n');
      let listType = null;
      let listItems = [];

      const flushList = () => {
        if (!listType || listItems.length === 0) {
          listItems = [];
          listType = null;
          return;
        }

        const list = listType === 'ol' ? (
          <ol key={`list-${segmentIndex}-${blocks.length}`}>
            {listItems.map((item, itemIndex) => (
              <li key={`li-${segmentIndex}-${itemIndex}`}>{renderInline(item, `li-${segmentIndex}-${itemIndex}`)}</li>
            ))}
          </ol>
        ) : (
          <ul key={`list-${segmentIndex}-${blocks.length}`}>
            {listItems.map((item, itemIndex) => (
              <li key={`li-${segmentIndex}-${itemIndex}`}>{renderInline(item, `li-${segmentIndex}-${itemIndex}`)}</li>
            ))}
          </ul>
        );

        blocks.push(list);
        listItems = [];
        listType = null;
      };

      lines.forEach((line) => {
        const trimmed = line.trim();

        if (!trimmed) {
          flushList();
          blocks.push(<div key={`spacer-${segmentIndex}-${blocks.length}`} className="md-spacer" />);
          return;
        }

        const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
        if (headingMatch) {
          flushList();
          const level = headingMatch[1].length;
          const Heading = `h${level}`;
          blocks.push(
            <Heading key={`heading-${segmentIndex}-${blocks.length}`}>
              {renderInline(headingMatch[2], `heading-${segmentIndex}-${blocks.length}`)}
            </Heading>
          );
          return;
        }

        const orderedMatch = trimmed.match(/^\d+\.\s+(.*)$/);
        if (orderedMatch) {
          if (listType && listType !== 'ol') {
            flushList();
          }
          listType = 'ol';
          listItems.push(orderedMatch[1]);
          return;
        }

        const unorderedMatch = trimmed.match(/^[-*]\s+(.*)$/);
        if (unorderedMatch) {
          if (listType && listType !== 'ul') {
            flushList();
          }
          listType = 'ul';
          listItems.push(unorderedMatch[1]);
          return;
        }

        flushList();
        blocks.push(
          <p key={`p-${segmentIndex}-${blocks.length}`}>
            {renderInline(trimmed, `p-${segmentIndex}-${blocks.length}`)}
          </p>
        );
      });

      flushList();
    });

    return blocks;
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, activeChatId]);


  return (
    <div
      className={`app-shell ${isSidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}${isMobilePortrait ? ' mobile-portrait' : ''}`}
    >
      <aside className="sidebar" id="sidebar" aria-hidden={isMobilePortrait && !isSidebarOpen}>
        <div className="sidebar-header">
          <div className="brand">
            <span className="brand-mark">Aria-X</span>
            <span className="brand-subtitle">AI chat</span>
          </div>
          <button
            className="theme-switch"
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-pressed={theme === 'light'}
            aria-label="Toggle light mode"
          >
            <span className="theme-switch-thumb" />
          </button>
        </div>
        <button className="primary-action" type="button" onClick={startNewChat}>
          <span className="action-icon">+</span>
          New chat
        </button>
        <div className="sidebar-section">
          <p className="section-title">Chats</p>
          {chats.map((chat) => (
            <button
              key={chat.id}
              className={`chat-row ${chat.id === activeChatId ? 'active' : ''}`}
              type="button"
              onClick={() => {
                if (chat.id === activeChatId) {
                  return;
                }
                if (streamIntervalRef.current) {
                  window.clearInterval(streamIntervalRef.current);
                  streamIntervalRef.current = null;
                }
                setIsLoading(false);
                setActiveChatId(chat.id);
                if (isMobilePortrait) {
                  setIsSidebarOpen(false);
                }
              }}
            >
              <span className="chat-title">{chat.title}</span>
              <span className="chat-meta">
                {chat.updatedAt ? new Date(chat.updatedAt).toLocaleDateString() : 'New'}
              </span>
            </button>
          ))}
        </div>
        <div className="sidebar-footer">
          <button className="ghost-action" type="button" onClick={() => setIsPrivacyOpen(true)}>Privacy</button>
        </div>
      </aside>

      {isMobilePortrait && (
        <button
          className="mobile-menu-button"
          type="button"
          onClick={toggleSidebar}
          aria-label={isSidebarOpen ? 'Close menu' : 'Open menu'}
          aria-controls="sidebar"
          aria-expanded={isSidebarOpen}
        >
          <span className="icon-lines" aria-hidden="true">
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>
      )}

      {isMobilePortrait && isSidebarOpen && (
        <button
          className="sidebar-overlay"
          type="button"
          onClick={closeSidebar}
          aria-label="Close sidebar"
        />
      )}

      <section className="content">
        <main className="chat-area">
          {messages.length === 0 && (
            <div className="hero">
              <div className="hero-badge">Welcome</div>
              <h1 className="hero-title">Ask Aria-X anything.</h1>
              <p className="hero-copy">Fast, focused answers built for your workflow.</p>
              <div className="aria-lottie-stage" role="img" aria-label="Aria floating robot">
                <div className="aria-lottie" ref={lottieRef} />
                <div className="aria-lottie-label">Aria</div>
              </div>
            </div>
          )}

          <div className="messages" id="messages">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`message-row ${message.role === 'user' ? 'user' : 'assistant'}${message.isStreaming ? ' streaming' : ''}`}
              >
                <div className="message-bubble">
                  <span className="message-role">{message.role === 'user' ? 'You' : 'Aria-X'}</span>
                  <div className="message-content">
                    {renderMarkdown(message.content)}
                    {message.isStreaming && <span className="stream-caret" aria-hidden="true" />}
                  </div>
                  {message.isStreaming && (
                    <button className="stream-skip" type="button" onClick={skipStreaming} aria-label="Skip animation">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="5 4 15 12 5 20"></polyline>
                        <line x1="19" y1="5" x2="19" y2="19"></line>
                      </svg>
                    </button>
                  )}
                  {message.role === 'assistant' && (() => {
                    if (message.isStreaming) {
                      return null;
                    }
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
      {isPrivacyOpen && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Privacy notice"
          onClick={() => setIsPrivacyOpen(false)}
        >
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2>Privacy</h2>
              <button
                className="modal-close"
                type="button"
                onClick={() => setIsPrivacyOpen(false)}
                aria-label="Close privacy notice"
              >
                ×
              </button>
            </div>
            <p>
              We do not collect personal information or store your chat content. Messages are used only to provide
              responses in the moment and are not retained after your session ends.
            </p>
            <p>
              If you share sensitive information, please do so only when necessary. You are always in control of what
              you submit.
            </p>
            <div className="modal-actions">
              <button className="primary-action" type="button" onClick={() => setIsPrivacyOpen(false)}>
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="ambient" aria-hidden="true"></div>
    </div>
  );
}