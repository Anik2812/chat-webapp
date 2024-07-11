document.addEventListener('DOMContentLoaded', () => {
    const app = document.getElementById('app');
    const authForms = document.getElementById('authForms');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const messageForm = document.getElementById('messageForm');
    const messageInput = document.getElementById('messageInput');
    const messageList = document.getElementById('messageList');
    const profileBtn = document.getElementById('profileBtn');
    const groupsBtn = document.getElementById('groupsBtn');
    const storiesBtn = document.getElementById('storiesBtn');
    const modal = document.getElementById('modal');
    const modalContent = document.getElementById('modalContent');
    const closeModal = document.querySelector('.close');

    let token = localStorage.getItem('token');
    let currentUser = null;

    function showAuthForms() {
        authForms.style.display = 'flex';
        app.style.display = 'none';
    }

    function showApp() {
        authForms.style.display = 'none';
        app.style.display = 'flex';
    }

    if (!token) {
        showAuthForms();
    } else {
        showApp();
        fetchCurrentUser();
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
                showApp();
                fetchCurrentUser();
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

    messageForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const message = messageInput.value.trim();
        if (message) {
            addMessage(currentUser.username, message);
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

    async function fetchCurrentUser() {
        try {
            const response = await fetch('http://localhost:5000/api/users/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            currentUser = await response.json();
            updateUI();
        } catch (error) {
            console.error('Error fetching current user:', error);
        }
    }

    function updateUI() {
        // Update UI with user information
    }

    profileBtn.addEventListener('click', () => {
        modalContent.innerHTML = `
            <h2>Profile</h2>
            <p>Username: ${currentUser.username}</p>
            <button id="logoutBtn">Logout</button>
        `;
        modal.style.display = 'block';

        document.getElementById('logoutBtn').addEventListener('click', () => {
            localStorage.removeItem('token');
            showAuthForms();
            modal.style.display = 'none';
        });
    });

    groupsBtn.addEventListener('click', () => {
        modalContent.innerHTML = `
            <h2>Groups</h2>
            <ul>
                <li>General Chat</li>
                <li>Tech Talk</li>
                <li>Random</li>
            </ul>
            <button id="createGroupBtn">Create New Group</button>
        `;
        modal.style.display = 'block';
    });

    storiesBtn.addEventListener('click', () => {
        modalContent.innerHTML = `
            <h2>Stories</h2>
            <p>Feature coming soon!</p>
        `;
        modal.style.display = 'block';
    });

    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
});