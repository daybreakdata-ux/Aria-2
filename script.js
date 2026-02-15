class ChatApp {
    constructor() {
        this.messagesContainer = document.getElementById('messages');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.chatHistory = [];
        this.conversationHistory = []; // For API context
        this.isLoading = false;
        this.apiEndpoint = '/api/chat';

        this.init();
    }

    init() {
        // Event listeners
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Suggestion cards
        document.querySelectorAll('.suggestion-card').forEach(card => {
            card.addEventListener('click', () => {
                const prompt = card.getAttribute('data-prompt');
                this.messageInput.value = prompt;
                this.messageInput.focus();
                setTimeout(() => this.sendMessage(), 100);
            });
        });

        // New chat button
        document.querySelector('.new-chat-btn').addEventListener('click', () => {
            this.newChat();
        });

        // Make input focus on page load
        this.messageInput.focus();
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message || this.isLoading) return;

        // Hide welcome section
        const welcomeSection = document.querySelector('.welcome-section');
        if (welcomeSection) {
            welcomeSection.style.animation = 'fadeOut 0.3s ease-out forwards';
            setTimeout(() => welcomeSection.remove(), 300);
        }

        // Add user message
        this.addMessage(message, 'user');
        
        // Add to conversation history for context
        this.conversationHistory.push({
            role: 'user',
            content: message
        });

        this.messageInput.value = '';
        this.messageInput.disabled = true;
        this.sendBtn.disabled = true;
        this.messageInput.focus();

        // Show typing indicator and get AI response
        this.showTypingIndicator();
        await this.getAIResponse(message);
    }

    addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = sender === 'user' ? 'You' : 'AI';

        const content = document.createElement('div');
        content.className = 'message-content';
        content.textContent = text;

        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        bubble.appendChild(content);


        messageDiv.appendChild(avatar);
        messageDiv.appendChild(bubble);

        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    showTypingIndicator() {
        this.isLoading = true;
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message assistant';

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = 'AI';

        const indicator = document.createElement('div');
        indicator.className = 'typing-indicator';
        indicator.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
        indicator.id = 'typing-indicator';

        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        bubble.appendChild(indicator);

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(bubble);

        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    removeTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.parentElement.parentElement.remove();
        }
        this.isLoading = false;
        this.messageInput.disabled = false;
        this.sendBtn.disabled = false;
    }

    async getAIResponse(userMessage) {
        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: userMessage,
                    history: this.conversationHistory.slice(0, -1) // All messages except the last one we just added
                })
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            
            // Remove typing indicator
            this.removeTypingIndicator();

            if (data.success && data.message) {
                // Add AI response to conversation history
                this.conversationHistory.push({
                    role: 'assistant',
                    content: data.message
                });

                // Display with typewriter effect
                this.addMessageWithTypewriter(data.message, 'assistant');
            } else {
                throw new Error(data.error || 'Failed to get response');
            }

        } catch (error) {
            console.error('Error getting AI response:', error);
            this.removeTypingIndicator();
            
            const errorMessage = "I apologize, but I'm having trouble connecting right now. Please try again in a moment.";
            this.addMessage(errorMessage, 'assistant');
            
            // Add error to history so conversation can continue
            this.conversationHistory.push({
                role: 'assistant',
                content: errorMessage
            });
        }
    }

    addMessageWithTypewriter(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = sender === 'user' ? 'You' : 'AI';

        const content = document.createElement('div');
        content.className = 'message-content';
        const textNode = document.createTextNode('');
        content.appendChild(textNode);

        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';

        let caret = null;
        let skipButton = null;
        if (sender === 'assistant') {
            messageDiv.classList.add('streaming');
            caret = document.createElement('span');
            caret.className = 'stream-caret';
            content.appendChild(caret);

            skipButton = document.createElement('button');
            skipButton.type = 'button';
            skipButton.className = 'stream-skip';
            skipButton.setAttribute('aria-label', 'Skip animation');
            skipButton.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <polyline points="5 4 15 12 5 20"></polyline>
                    <line x1="19" y1="5" x2="19" y2="19"></line>
                </svg>
            `;
        }

        bubble.appendChild(content);
        if (skipButton) {
            bubble.appendChild(skipButton);
        }

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(bubble);
        this.messagesContainer.appendChild(messageDiv);

        // Typewriter effect
        let charIndex = 0;
        let typeInterval = null;

        const finishStreaming = () => {
            if (typeInterval) {
                clearInterval(typeInterval);
            }
            textNode.nodeValue = text;
            if (caret) {
                caret.remove();
            }
            if (skipButton) {
                skipButton.remove();
            }
            messageDiv.classList.remove('streaming');
            this.scrollToBottom();
        };

        if (skipButton) {
            skipButton.addEventListener('click', finishStreaming);
        }

        typeInterval = setInterval(() => {
            if (charIndex < text.length) {
                textNode.nodeValue += text[charIndex];
                charIndex++;
                this.scrollToBottom();
            } else {
                finishStreaming();
            }
        }, 20);
    }


    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    newChat() {
        // Clear messages
        this.messagesContainer.innerHTML = `
            <div class="welcome-section">
                <h1 class="welcome-title">Welcome to Aria</h1>
                <p class="welcome-subtitle">Your creative AI design assistant</p>
                <div class="suggestions">
                    <button class="suggestion-card" data-prompt="Design a modern landing page with animations">
                        <span class="suggestion-icon">✨</span>
                        <span>Design a modern landing page</span>
                    </button>
                    <button class="suggestion-card" data-prompt="Build a React component with hooks">
                        <span class="suggestion-icon">⚛️</span>
                        <span>Build a React component</span>
                    </button>
                    <button class="suggestion-card" data-prompt="Create an email template design">
                        <span class="suggestion-icon">📧</span>
                        <span>Create an email template</span>
                    </button>
                    <button class="suggestion-card" data-prompt="Fix CSS animation performance">
                        <span class="suggestion-icon">🎨</span>
                        <span>Fix CSS animations</span>
                    </button>
                </div>
            </div>
        `;

        // Re-attach suggestion card listeners
        document.querySelectorAll('.suggestion-card').forEach(card => {
            card.addEventListener('click', () => {
                const prompt = card.getAttribute('data-prompt');
                this.messageInput.value = prompt;
                this.messageInput.focus();
                setTimeout(() => this.sendMessage(), 100);
            });
        });

        this.messageInput.value = '';
        this.messageInput.focus();
        this.chatHistory = [];
        this.conversationHistory = []; // Clear API conversation history
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ChatApp();
});

// Add fadeOut animation keyframe dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from {
            opacity: 1;
            transform: translateY(0);
        }
        to {
            opacity: 0;
            transform: translateY(20px);
        }
    }
`;
document.head.appendChild(style);
