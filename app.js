document.addEventListener('DOMContentLoaded', () => {
    const messageForm = document.getElementById('messageForm');
    const messageInput = document.getElementById('messageInput');
    const messageList = document.getElementById('messageList');

    messageForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const message = messageInput.value.trim();
        if (message) {
            addMessage('You', message);
            messageInput.value = '';
            // Here, you would typically send the message to a server
            // For now, we'll just simulate a response
            setTimeout(() => {
                addMessage('Bot', 'This is a simulated response.');
            }, 1000);
        }
    });

    function addMessage(sender, text) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        messageElement.innerHTML = `<strong>${sender}:</strong> ${text}`;
        messageList.appendChild(messageElement);
        messageList.scrollTop = messageList.scrollHeight;
    }

    const authForms = document.getElementById('authForms');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

let token = localStorage.getItem('token');

if (!token) {
    authForms.style.display = 'block';
    document.getElementById('app').style.display = 'none';
} else {
    authForms.style.display = 'none';
    document.getElementById('app').style.display = 'block';
}

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    try {
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        const data = await response.json();
        if (data.token) {
            localStorage.setItem('token', data.token);
            authForms.style.display = 'none';
            document.getElementById('app').style.display = 'block';
        }
    } catch (error) {
        console.error('Error logging in:', error);
    }
});

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;
    try {
        const response = await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        const data = await response.json();
        if (data.message === 'User created successfully') {
            alert('Registration successful. Please log in.');
        }
    } catch (error) {
        console.error('Error registering:', error);
    }
});
});