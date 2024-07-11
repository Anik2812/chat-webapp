document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chatMessages');
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');

    function addMessage(message, isUser = true) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        messageElement.classList.add(isUser ? 'user-message' : 'bot-message');
        
        // Add typing effect
        if (!isUser) {
            messageElement.textContent = '•••';
            chatMessages.appendChild(messageElement);
            chatMessages.scrollTop = chatMessages.scrollHeight;
            
            let i = 0;
            const typingEffect = setInterval(() => {
                messageElement.textContent = message.substring(0, i);
                i++;
                chatMessages.scrollTop = chatMessages.scrollHeight;
                if (i > message.length) {
                    clearInterval(typingEffect);
                }
            }, 50);
        } else {
            messageElement.textContent = message;
            chatMessages.appendChild(messageElement);
        }
        
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function handleUserMessage() {
        const message = messageInput.value.trim();
        if (message) {
            addMessage(message);
            messageInput.value = '';
            
            // Simulate bot response
            setTimeout(() => {
                const botResponses = [
                    "That's interesting! Tell me more.",
                    "I see. How does that make you feel?",
                    "Fascinating! What do you think about that?",
                    "I understand. What would you like to chat about next?",
                    "That's a great point! Can you elaborate on that?"
                ];
                const randomResponse = botResponses[Math.floor(Math.random() * botResponses.length)];
                addMessage(randomResponse, false);
            }, 1000);
        }
    }

    sendButton.addEventListener('click', handleUserMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleUserMessage();
        }
    });

    // Add button press effect
    sendButton.addEventListener('mousedown', () => {
        sendButton.style.transform = 'scale(0.95)';
    });

    sendButton.addEventListener('mouseup', () => {
        sendButton.style.transform = 'scale(1)';
    });

    // Add input focus effect
    messageInput.addEventListener('focus', () => {
        messageInput.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.2)';
    });

    messageInput.addEventListener('blur', () => {
        messageInput.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
    });
});