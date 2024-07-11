const API_BASE_URL = 'http://localhost:5000/api'; // Assuming our backend is running on localhost:5000

let token = localStorage.getItem('token');
let currentUser = null;
let socket = null;

// Utility function for making authenticated API calls
async function apiCall(endpoint, method = 'GET', body = null) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
    const config = { method, headers };
    if (body) config.body = JSON.stringify(body);
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    if (!response.ok) {
        if (response.status === 401) {
            logout();
            throw new Error('Session expired. Please login again.');
        }
        throw new Error('API call failed');
    }
    return response.json();
}

function showAuthModal() {
    document.getElementById('auth-modal').style.display = 'block';
    document.getElementById('app').style.display = 'none';
}

function hideAuthModal() {
    document.getElementById('auth-modal').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
}

async function login(username, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        if (!response.ok) throw new Error('Login failed');
        const data = await response.json();
        token = data.token;
        localStorage.setItem('token', token);
        currentUser = data.user;
        hideAuthModal();
        updateUI();
        loadChats();
        initializeSocket();
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
    }
}

function logout() {
    localStorage.removeItem('token');
    token = null;
    currentUser = null;
    if (socket) socket.close();
    showAuthModal();
}

async function register(username, password, email) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, email })
        });
        if (!response.ok) throw new Error('Registration failed');
        alert('Registration successful. Please log in.');
        showLoginForm();
    } catch (error) {
        console.error('Registration error:', error);
        alert('Registration failed. Please try again.');
    }
}

async function fetchCurrentUser() {
    try {
        currentUser = await apiCall('/users/me');
        updateUI();
    } catch (error) {
        console.error('Error fetching current user:', error);
        logout();
    }
}

function updateUI() {
    document.getElementById('username').textContent = currentUser.username;
    loadOnlineUsers();
}

async function loadOnlineUsers() {
    try {
        const onlineUsers = await apiCall('/users/online');
        const onlineUsersList = document.getElementById('online-users-list');
        onlineUsersList.innerHTML = '';
        onlineUsers.forEach(user => {
            const li = document.createElement('li');
            li.innerHTML = `
                <img src="${user.avatar}" alt="${user.username}">
                <span>${user.username}</span>
            `;
            onlineUsersList.appendChild(li);
        });
    } catch (error) {
        console.error('Error loading online users:', error);
    }
}

async function loadChats() {
    try {
        const chats = await apiCall('/chats');
        contentArea.innerHTML = `
            <h2>Your Chats</h2>
            <div class="chat-list">
                ${chats.map(chat => `
                    <div class="chat-item" data-chat-id="${chat.id}">
                        <img src="${chat.avatar}" alt="${chat.username}">
                        <div class="chat-info">
                            <h3>${chat.username}</h3>
                            <p>${chat.lastMessage}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        setActiveNavButton(chatBtn);
        attachChatListeners();
    } catch (error) {
        console.error('Error loading chats:', error);
        contentArea.innerHTML = '<p>Failed to load chats. Please try again later.</p>';
    }
}

function attachChatListeners() {
    document.querySelectorAll('.chat-item').forEach(item => {
        item.addEventListener('click', () => openChat(item.dataset.chatId));
    });
}

async function openChat(chatId) {
    try {
        const chat = await apiCall(`/chats/${chatId}`);
        contentArea.innerHTML = `
            <div class="chat-header">
                <img src="${chat.avatar}" alt="${chat.username}">
                <h3>${chat.username}</h3>
            </div>
            <div class="message-list" id="message-list">
                ${chat.messages.map(message => createMessageElement(message)).join('')}
            </div>
            <form id="message-form">
                <input type="text" id="message-input" placeholder="Type a message...">
                <button type="submit">Send</button>
            </form>
        `;
        const messageList = document.getElementById('message-list');
        messageList.scrollTop = messageList.scrollHeight;
        attachMessageFormListener(chatId);
    } catch (error) {
        console.error('Error opening chat:', error);
        contentArea.innerHTML = '<p>Failed to load chat. Please try again later.</p>';
    }
}

function createMessageElement(message) {
    return `
        <div class="message ${message.sender === currentUser.id ? 'sent' : 'received'}">
            <p>${message.content}</p>
            <span class="timestamp">${new Date(message.timestamp).toLocaleTimeString()}</span>
        </div>
    `;
}

function attachMessageFormListener(chatId) {
    const messageForm = document.getElementById('message-form');
    const messageInput = document.getElementById('message-input');
    messageForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const content = messageInput.value.trim();
        if (content) {
            try {
                const message = await apiCall(`/chats/${chatId}/messages`, 'POST', { content });
                const messageList = document.getElementById('message-list');
                messageList.insertAdjacentHTML('beforeend', createMessageElement(message));
                messageList.scrollTop = messageList.scrollHeight;
                messageInput.value = '';
            } catch (error) {
                console.error('Error sending message:', error);
                alert('Failed to send message. Please try again.');
            }
        }
    });
}

async function loadGroups() {
    try {
        const groups = await apiCall('/groups');
        contentArea.innerHTML = `
            <h2>Your Groups</h2>
            <div class="group-list">
                ${groups.map(group => `
                    <div class="group-item" data-group-id="${group.id}">
                        <img src="${group.avatar}" alt="${group.name}">
                        <h3>${group.name}</h3>
                        <p>Members: ${group.memberCount}</p>
                    </div>
                `).join('')}
            </div>
            <button id="create-group-btn" class="create-btn">Create New Group</button>
        `;
        setActiveNavButton(groupsBtn);
        attachGroupListeners();
    } catch (error) {
        console.error('Error loading groups:', error);
        contentArea.innerHTML = '<p>Failed to load groups. Please try again later.</p>';
    }
}

function attachGroupListeners() {
    document.querySelectorAll('.group-item').forEach(item => {
        item.addEventListener('click', () => openGroup(item.dataset.groupId));
    });
    document.getElementById('create-group-btn').addEventListener('click', showCreateGroupModal);
}

async function openGroup(groupId) {
    try {
        const group = await apiCall(`/groups/${groupId}`);
        contentArea.innerHTML = `
            <div class="group-header">
                <img src="${group.avatar}" alt="${group.name}">
                <h3>${group.name}</h3>
            </div>
            <div class="message-list" id="message-list">
                ${group.messages.map(message => createMessageElement(message)).join('')}
            </div>
            <form id="message-form">
                <input type="text" id="message-input" placeholder="Type a message...">
                <button type="submit">Send</button>
            </form>
        `;
        const messageList = document.getElementById('message-list');
        messageList.scrollTop = messageList.scrollHeight;
        attachGroupMessageFormListener(groupId);
    } catch (error) {
        console.error('Error opening group:', error);
        contentArea.innerHTML = '<p>Failed to load group. Please try again later.</p>';
    }
}

function attachGroupMessageFormListener(groupId) {
    const messageForm = document.getElementById('message-form');
    const messageInput = document.getElementById('message-input');
    messageForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const content = messageInput.value.trim();
        if (content) {
            try {
                const message = await apiCall(`/groups/${groupId}/messages`, 'POST', { content });
                const messageList = document.getElementById('message-list');
                messageList.insertAdjacentHTML('beforeend', createMessageElement(message));
                messageList.scrollTop = messageList.scrollHeight;
                messageInput.value = '';
            } catch (error) {
                console.error('Error sending message:', error);
                alert('Failed to send message. Please try again.');
            }
        }
    });
}

function showCreateGroupModal() {
    const modal = document.getElementById('create-group-modal');
    modal.style.display = 'block';
    document.getElementById('create-group-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('group-name').value.trim();
        if (name) {
            try {
                await apiCall('/groups', 'POST', { name });
                modal.style.display = 'none';
                loadGroups();
            } catch (error) {
                console.error('Error creating group:', error);
                alert('Failed to create group. Please try again.');
            }
        }
    });
}

function initializeSocket() {
    socket = new WebSocket('ws://localhost:5000'); // Update with your actual WebSocket server URL
    socket.addEventListener('open', () => {
        console.log('Connected to WebSocket server');
    });
    socket.addEventListener('message', (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'new_message') {
            handleNewMessage(data.message);
        } else if (data.type === 'user_status') {
            updateOnlineUserStatus(data.user);
        }
    });
    socket.addEventListener('close', () => {
        console.log('Disconnected from WebSocket server');
    });
}

function handleNewMessage(message) {
    const messageList = document.getElementById('message-list');
    if (messageList) {
        messageList.insertAdjacentHTML('beforeend', createMessageElement(message));
        messageList.scrollTop = messageList.scrollHeight;
    }
}

function updateOnlineUserStatus(user) {
    const onlineUsersList = document.getElementById('online-users-list');
    if (onlineUsersList) {
        const userElement = onlineUsersList.querySelector(`li[data-user-id="${user.id}"]`);
        if (userElement) {
            userElement.querySelector('img').classList.toggle('online', user.online);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const logoutBtn = document.getElementById('logout-btn');
    const chatBtn = document.getElementById('chat-btn');
    const groupsBtn = document.getElementById('groups-btn');
    const profileBtn = document.getElementById('profile-btn');
    const settingsBtn = document.getElementById('settings-btn');

    console.log('loginForm:', loginForm);
    console.log('registerForm:', registerForm);
    console.log('logoutBtn:', logoutBtn);
    console.log('chatBtn:', chatBtn);
    console.log('groupsBtn:', groupsBtn);
    console.log('profileBtn:', profileBtn);
    console.log('settingsBtn:', settingsBtn);

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('login-username').value.trim();
            const password = document.getElementById('login-password').value.trim();
            if (username && password) {
                login(username, password);
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('register-username').value.trim();
            const password = document.getElementById('register-password').value.trim();
            const email = document.getElementById('register-email').value.trim();
            if (username && password && email) {
                register(username, password, email);
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            logout();
        });
    }

    if (chatBtn) {
        chatBtn.addEventListener('click', loadChats);
    }

    if (groupsBtn) {
        groupsBtn.addEventListener('click', loadGroups);
    }

    if (profileBtn) {
        profileBtn.addEventListener('click', loadProfile);
    }

    if (settingsBtn) {
        settingsBtn.addEventListener('click', loadSettings);
    }

    if (token) {
        fetchCurrentUser();
    } else {
        showAuthModal();
    }
});


function setActiveNavButton(button) {
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
}

document.getElementById('chat-btn').addEventListener('click', loadChats);
document.getElementById('groups-btn').addEventListener('click', loadGroups);
document.getElementById('profile-btn').addEventListener('click', loadProfile);
document.getElementById('settings-btn').addEventListener('click', loadSettings);

function loadProfile() {
    contentArea.innerHTML = `
        <h2>Your Profile</h2>
        <p>Username: ${currentUser.username}</p>
        <p>Email: ${currentUser.email}</p>
        <button id="edit-profile-btn">Edit Profile</button>
    `;
    setActiveNavButton(profileBtn);
}

function loadSettings() {
    contentArea.innerHTML = `
        <h2>Settings</h2>
        <p>Coming soon...</p>
    `;
    setActiveNavButton(settingsBtn);
}
