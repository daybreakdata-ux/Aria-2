class ChatApp {
    constructor() {
        this.messagesContainer = document.getElementById('messages');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.conversationHistory = []; // Messages sent to AI with roles
        this.isLoading = false;
        this.apiUrl = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000/api/chat' 
            : '/api/chat';

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

    sendMessage() {
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
        this.messageInput.value = '';
        this.messageInput.focus();

        // Simulate AI response
        this.showTypingIndicator();
        setTimeout(() => this.generateAIResponse(message), 800);
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

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);

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

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(indicator);

        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    removeTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.parentElement.parentElement.remove();
        }
        this.isLoading = false;
    }

    async generateAIResponse(userMessage) {
        try {
            // Add user message to conversation history
            this.conversationHistory.push({
                role: 'user',
                content: userMessage
            });

            // Remove typing indicator and call API
            this.removeTypingIndicator();

            // Call the backend API
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages: this.conversationHistory
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `API error: ${response.status}`);
            }

            const data = await response.json();
            const assistantMessage = data.content;

            // Add assistant message to conversation history
            this.conversationHistory.push({
                role: 'assistant',
                content: assistantMessage
            });

            // Display response with typewriter effect
            this.addMessageWithTypewriter(assistantMessage, 'assistant');
        } catch (error) {
            console.error('Chat error:', error);
            this.removeTypingIndicator();
            
            // Display error message to user
            const errorMessage = `Sorry, I encountered an error: ${error.message}. Please try again.`;
            this.addMessage(errorMessage, 'assistant');
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
        content.textContent = '';

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);
        this.messagesContainer.appendChild(messageDiv);

        // Typewriter effect
        let charIndex = 0;
        const typeInterval = setInterval(() => {
            if (charIndex < text.length) {
                content.textContent += text[charIndex];
                charIndex++;
                this.scrollToBottom();
            } else {
                clearInterval(typeInterval);
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
        this.conversationHistory = []; // Clear conversation history
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
