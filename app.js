const MOCK_USERS = [
  { id: '1', username: 'Harsh', online: true, lastOnline: new Date(), avatar: 'avatar1.jpg' },
  { id: '2', username: 'Jaimin', online: false, lastOnline: new Date(Date.now() - 3600000), avatar: 'avatar2.jpg' },
  { id: '3', username: 'Swayam', online: true, lastOnline: new Date(), avatar: 'avatar3.jpg' }
];

const MOCK_CHATS = MOCK_USERS.map(user => ({
  _id: user.id,
  participants: [user],
  messages: [{ sender: user.id, content: `wassup man`, timestamp: new Date() }],
  lastMessage: `Hello from ${user.username}`,
  updatedAt: user.lastOnline
}));

const MOCK_GROUPS = [
  { _id: '1', name: 'General', members: MOCK_USERS, messages: [], avatar: 'group-avatar.png' },
  { _id: '2', name: 'Work', members: [MOCK_USERS[0], MOCK_USERS[1]], messages: [], avatar: 'group-avatar.png' }
];

const API_BASE_URL = 'http://localhost:5000/api';
let token = localStorage.getItem('token');
let currentUser = null;
let socket = null;

async function apiCall(endpoint, method = 'GET', body = null) {
  console.log(`Making ${method} request to ${endpoint}`);
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

  if (endpoint === '/chats') {
    return MOCK_CHATS;
  } else if (endpoint.startsWith('/chats/')) {
    const chatId = endpoint.split('/')[2];
    return MOCK_CHATS.find(chat => chat._id === chatId);
  } else if (endpoint === '/groups') {
    return MOCK_GROUPS;
  } else if (endpoint.startsWith('/groups/')) {
    const groupId = endpoint.split('/')[2];
    return MOCK_GROUPS.find(group => group._id === groupId);
  } else if (endpoint === '/users/online') {
    return MOCK_USERS.filter(user => user.online);
  } else if (endpoint === '/users/profile' && method === 'PUT') {
    currentUser = { ...currentUser, ...body };
    return currentUser;
  }

  throw new Error('Not found');
}

function showLoadingSpinner() {
  document.getElementById('loading-spinner').style.display = 'block';
}

function hideLoadingSpinner() {
  document.getElementById('loading-spinner').style.display = 'none';
}

function showAuthModal() {
  document.getElementById('auth-modal').classList.add('show');
  document.getElementById('app').style.display = 'none';
}

function hideAuthModal() {
  document.getElementById('auth-modal').classList.remove('show');
  document.getElementById('app').style.display = 'flex';
}

async function login(username, password) {
  currentUser = {
    id: '0',
    username: username,
    email: `${username}@example.com`,
    avatar: 'avatar.png'
  };
  try {
    showLoadingSpinner();
    // Simulate login API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    token = 'mock_token';
    localStorage.setItem('token', token);
    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    hideAuthModal();
    updateUI();
    loadChats();
    initializeSocket();
  } catch (error) {
    console.error('Login error:', error);
    alert(`Login failed: ${error.message}`);
  } finally {
    hideLoadingSpinner();
  }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('currentUser');
  token = null;
  currentUser = null;
  if (socket) socket.close();
  showAuthModal();
}

async function register(username, password, email) {
  try {
    showLoadingSpinner();
    // Simulate registration API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    alert('Registration successful. Please log in.');
    showLoginForm();
  } catch (error) {
    console.error('Registration error:', error);
    alert('Registration failed. Please try again.');
  } finally {
    hideLoadingSpinner();
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
      li.addEventListener('click', () => openChat(user.id));
      onlineUsersList.appendChild(li);
    });
  } catch (error) {
    console.error('Error loading online users:', error);
  }
}

async function loadChats() {
  try {
    showLoadingSpinner();
    const chats = await apiCall('/chats');
    const contentArea = document.getElementById('content-area');
    contentArea.innerHTML = `
      <h2>Your Chats</h2>
      <div class="chat-list">
        ${chats.map(chat => `
          <div class="chat-item slide-in" data-chat-id="${chat._id}">
            <img src="${chat.participants[0].avatar || 'avatar.png'}" alt="${chat.participants[0].username}">
            <div class="chat-info">
              <h3>${chat.participants[0].username}</h3>
              <p>${chat.lastMessage || 'No messages yet'}</p>
              <span class="online-status ${chat.participants[0].online ? 'online' : 'offline'}">
                ${chat.participants[0].online ? 'Online' : 'Last seen: ' + new Date(chat.updatedAt).toLocaleString()}
              </span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    setActiveNavButton(document.getElementById('chat-btn'));
    attachChatListeners();
  } catch (error) {
    console.error('Error loading chats:', error);
    const contentArea = document.getElementById('content-area');
    contentArea.innerHTML = '<p>Failed to load chats. Please try again later.</p>';
  } finally {
    hideLoadingSpinner();
  }
}

function attachChatListeners() {
  document.querySelectorAll('.chat-item').forEach(item => {
    item.addEventListener('click', () => openChat(item.dataset.chatId));
  });
}

async function openChat(chatId) {
  try {
    showLoadingSpinner();
    const chat = await apiCall(`/chats/${chatId}`);
    const contentArea = document.getElementById('content-area');
    contentArea.innerHTML = `
      <div class="chat-header">
        <img src="${chat.participants[0].avatar || 'avatar.png'}" alt="${chat.participants[0].username}">
        <h3>${chat.participants[0].username}</h3>
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
    const contentArea = document.getElementById('content-area');
    contentArea.innerHTML = '<p>Failed to load chat. Please try again later.</p>';
  } finally {
    hideLoadingSpinner();
  }
}

function createMessageElement(message) {
  return `
    <div class="message ${message.sender === currentUser.id ? 'sent' : 'received'} fade-in">
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
        const message = { sender: currentUser.id, content, timestamp: new Date() };
        const messageList = document.getElementById('message-list');
        messageList.insertAdjacentHTML('beforeend', createMessageElement(message));
        messageList.scrollTop = messageList.scrollHeight;
        messageInput.value = '';
        // Simulate sending message to API
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error('Error sending message:', error);
        alert('Failed to send message. Please try again.');
      }
    }
  });
}

async function loadGroups() {
  try {
    showLoadingSpinner();
    const groups = await apiCall('/groups');
    const contentArea = document.getElementById('content-area');
    contentArea.innerHTML = `
      <h2>Your Groups</h2>
      <div class="group-list">
        ${groups.map(group => `
          <div class="group-item slide-in" data-group-id="${group._id}">
            <img src="${group.avatar || 'group-avatar.png'}" alt="${group.name}">
            <h3>${group.name}</h3>
            <p>Members: ${group.members.length}</p>
          </div>
        `).join('')}
      </div>
      <button id="create-group-btn" class="create-btn">Create New Group</button>
    `;
    setActiveNavButton(document.getElementById('groups-btn'));
    attachGroupListeners();
  } catch (error) {
    console.error('Error loading groups:', error);
    const contentArea = document.getElementById('content-area');
    contentArea.innerHTML = '<p>Failed to load groups. Please try again later.</p>';
  } finally {
    hideLoadingSpinner();
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
    showLoadingSpinner();
    const group = await apiCall(`/groups/${groupId}`);
    const contentArea = document.getElementById('content-area');
    contentArea.innerHTML = `
      <div class="group-header">
        <img src="${group.avatar || 'group-avatar.png'}" alt="${group.name}">
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
    const contentArea = document.getElementById('content-area');
    contentArea.innerHTML = '<p>Failed to load group. Please try again later.</p>';
  } finally {
    hideLoadingSpinner();
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
        const message = { sender: currentUser.id, content, timestamp: new Date() };
        const messageList = document.getElementById('message-list');
        messageList.insertAdjacentHTML('beforeend', createMessageElement(message));
        messageList.scrollTop = messageList.scrollHeight;
        messageInput.value = '';
        // Simulate sending message to API
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error('Error sending message:', error);
        alert('Failed to send message. Please try again.');
      }
    }
  });
}

function showCreateGroupModal() {
  const modal = document.getElementById('create-group-modal');
  modal.classList.add('show');
  document.getElementById('create-group-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('group-name').value.trim();
    if (name) {
      try {
        showLoadingSpinner();
        // Simulate group creation
        await new Promise(resolve => setTimeout(resolve, 1000));
        modal.classList.remove('show');
        loadGroups();
      } catch (error) {
        console.error('Error creating group:', error);
        alert('Failed to create group. Please try again.');
      } finally {
        hideLoadingSpinner();
      }
    }
  });
}

function initializeSocket() {
  // Simulate WebSocket connection
  console.log('WebSocket connected');
}

function setActiveNavButton(button) {
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
  button.classList.add('active');
}

function showLoginForm() {
  document.getElementById('login-form').style.display = 'block';
  document.getElementById('register-form').style.display = 'none';
}

function showRegisterForm() {
  document.getElementById('login-form').style.display = 'none';
  document.getElementById('register-form').style.display = 'block';
}

function loadProfile() {
  const contentArea = document.getElementById('content-area');
  contentArea.innerHTML = `
    <h2>Your Profile</h2>
    <div class="profile-info">
      <img src="${currentUser.avatar || 'avatar.png'}" alt="${currentUser.username}" class="profile-avatar">
      <p><strong>Username:</strong> <span id="profile-username">${currentUser.username}</span></p>
      <p><strong>Email:</strong> <span id="profile-email">${currentUser.email}</span></p>
    </div>
    <button id="edit-profile-btn" class="btn">Edit Profile</button>
  `;
  setActiveNavButton(document.getElementById('profile-btn'));
  document.getElementById('edit-profile-btn').addEventListener('click', showEditProfileModal);
}

function loadSettings() {
  const contentArea = document.getElementById('content-area');
  contentArea.innerHTML = `
    <h2>Settings</h2>
    <div class="settings-options">
      <div class="setting-item">
        <label for="dark-mode-toggle">Dark Mode</label>
        <input type="checkbox" id="dark-mode-toggle">
      </div>
      <div class="setting-item">
        <label for="notification-toggle">Enable Notifications</label>
        <input type="checkbox" id="notification-toggle">
      </div>
    </div>
  `;
  setActiveNavButton(document.getElementById('settings-btn'));

  const darkModeToggle = document.getElementById('dark-mode-toggle');
  darkModeToggle.checked = localStorage.getItem('darkMode') === 'true';
  darkModeToggle.addEventListener('change', () => {
    document.body.classList.toggle('dark-mode', darkModeToggle.checked);
    localStorage.setItem('darkMode', darkModeToggle.checked);
  });

  const notificationToggle = document.getElementById('notification-toggle');
  notificationToggle.checked = localStorage.getItem('notifications') === 'true';
  notificationToggle.addEventListener('change', () => {
    localStorage.setItem('notifications', notificationToggle.checked);
    if (notificationToggle.checked) {
      requestNotificationPermission();
    }
  });
}

function showEditProfileModal() {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <h2>Edit Profile</h2>
      <form id="edit-profile-form">
        <input type="text" id="edit-username" value="${currentUser.username}" placeholder="Username" required>
        <input type="email" id="edit-email" value="${currentUser.email}" placeholder="Email" required>
        <input type="file" id="edit-avatar" accept="image/*">
        <button type="submit">Save Changes</button>
      </form>
    </div>
  `;
  document.body.appendChild(modal);
  modal.classList.add('show');

  const editProfileForm = document.getElementById('edit-profile-form');
  editProfileForm.addEventListener('submit', handleEditProfileSubmit);
}

async function handleEditProfileSubmit(e) {
  e.preventDefault();
  const username = document.getElementById('edit-username').value.trim();
  const email = document.getElementById('edit-email').value.trim();
  const avatarFile = document.getElementById('edit-avatar').files[0];

  const formData = new FormData();
  formData.append('username', username);
  formData.append('email', email);
  if (avatarFile) {
    formData.append('avatar', avatarFile);
  }

  try {
    showLoadingSpinner();
    await updateProfile(formData);
    loadProfile();
    document.querySelector('.modal').classList.remove('show');
    setTimeout(() => document.querySelector('.modal').remove(), 300);
  } catch (error) {
    console.error('Error updating profile:', error);
    alert('Failed to update profile. Please try again.');
  } finally {
    hideLoadingSpinner();
  }
}

async function updateProfile(formData) {
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    currentUser = {
      ...currentUser,
      username: formData.get('username'),
      email: formData.get('email'),
    };
    if (formData.get('avatar')) {
      currentUser.avatar = URL.createObjectURL(formData.get('avatar'));
    }
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    updateUI();
    showToast('Profile updated successfully', 'success');
  } catch (error) {
    console.error('Error updating profile:', error);
    showToast('Failed to update profile. Please try again.', 'error');
  }
}

function requestNotificationPermission() {
  if ('Notification' in window) {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        console.log('Notification permission granted');
      }
    });
  }
}

function showNotification(title, body) {
  if ('Notification' in window && Notification.permission === 'granted' && localStorage.getItem('notifications') === 'true') {
    new Notification(title, { body });
  }
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }, 100);
}

function confirmAction(message) {
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <p>${message}</p>
        <div class="modal-actions">
          <button id="confirm-yes">Yes</button>
          <button id="confirm-no">No</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.classList.add('show');

    const yesBtn = document.getElementById('confirm-yes');
    const noBtn = document.getElementById('confirm-no');

    yesBtn.addEventListener('click', () => {
      modal.classList.remove('show');
      setTimeout(() => modal.remove(), 300);
      resolve(true);
    });

    noBtn.addEventListener('click', () => {
      modal.classList.remove('show');
      setTimeout(() => modal.remove(), 300);
      resolve(false);
    });
  });
}

window.addEventListener('online', () => {
  showToast('You are back online', 'success');
  initializeSocket();
});

window.addEventListener('offline', () => {
  showToast('You are offline', 'warning');
});

function implementInfiniteScroll(messageList, chatId) {
  let page = 1;
  let loading = false;

  messageList.addEventListener('scroll', async () => {
    if (messageList.scrollTop === 0 && !loading) {
      loading = true;
      try {
        const oldMessages = await apiCall(`/chats/${chatId}/messages?page=${page + 1}`);
        if (oldMessages.length > 0) {
          page++;
          const oldMessageElements = oldMessages.map(createMessageElement).join('');
          messageList.insertAdjacentHTML('afterbegin', oldMessageElements);
          messageList.scrollTop = 100; // Scroll down a bit to show new content
        }
      } catch (error) {
        console.error('Error loading old messages:', error);
      } finally {
        loading = false;
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const logoutBtn = document.getElementById('logout-btn');
  const chatBtn = document.getElementById('chat-btn');
  const groupsBtn = document.getElementById('groups-btn');
  const profileBtn = document.getElementById('profile-btn');
  const settingsBtn = document.getElementById('settings-btn');
  const showRegisterBtn = document.getElementById('showRegister');
  const showLoginBtn = document.getElementById('showLogin');

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value.trim();
    if (username && password) {
      login(username, password);
    }
  });

  registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('register-username').value.trim();
    const password = document.getElementById('register-password').value.trim();
    const email = document.getElementById('register-email').value.trim();
    if (username && password && email) {
      register(username, password, email);
    }
  });

  logoutBtn.addEventListener('click', logout);
  chatBtn.addEventListener('click', loadChats);
  groupsBtn.addEventListener('click', loadGroups);
  profileBtn.addEventListener('click', loadProfile);
  settingsBtn.addEventListener('click', loadSettings);
  showRegisterBtn.addEventListener('click', showRegisterForm);
  showLoginBtn.addEventListener('click', showLoginForm);

  // Check if user is already logged in
  if (token) {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      currentUser = JSON.parse(storedUser);
      hideAuthModal();
      updateUI();
      loadChats();
      initializeSocket();
    } else {
      logout(); // Clear potentially invalid token
    }
  } else {
    showAuthModal();
  }

  // Initialize dark mode
  const darkMode = localStorage.getItem('darkMode') === 'true';
  document.body.classList.toggle('dark-mode', darkMode);
});