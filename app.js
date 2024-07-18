const API_BASE_URL = 'http://localhost:5000/api';
let token = localStorage.getItem('token');
let currentUser = null;
let socket = null;

console.log("Script starting...");

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

function showLoadingSpinner() {
  document.getElementById('loading-spinner').style.display = 'block';
}

function hideLoadingSpinner() {
  document.getElementById('loading-spinner').style.display = 'none';
}

function showAuthModal() {
    console.log("Showing auth modal");
    document.getElementById('auth-modal').style.display = 'block';
    document.getElementById('app').style.display = 'none';
}

function hideAuthModal() {
  document.getElementById('auth-modal').classList.remove('show');
  document.getElementById('app').style.display = 'flex';
  document.getElementById('app').classList.add('loaded');
}

async function login(username, password) {
  try {
    showLoadingSpinner();
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }
    
    token = data.token;
    localStorage.setItem('token', token);
    currentUser = data.user;
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
  } finally {
    hideLoadingSpinner();
  }
}

async function fetchCurrentUser() {
  try {
    const user = await apiCall('/users/me');
    currentUser = user;
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
    showLoadingSpinner();
    const chats = await apiCall('/chats');
    const contentArea = document.getElementById('content-area');
    contentArea.innerHTML = `
      <h2>Your Chats</h2>
      <div class="chat-list">
        ${chats.map(chat => `
          <div class="chat-item" data-chat-id="${chat._id}">
            <img src="${chat.avatar || 'default-avatar.png'}" alt="${chat.participants[0].username}">
            <div class="chat-info">
              <h3>${chat.participants[0].username}</h3>
              <p>${chat.lastMessage || 'No messages yet'}</p>
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
    implementInfiniteScroll(messageList, chatId);
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
      <div class="message ${message.sender === currentUser.id ? 'sent' : 'received'}" data-message-id="${message._id}">
        <p>${message.content}</p>
        <span class="timestamp">${new Date(message.timestamp).toLocaleTimeString()}</span>
        <span class="read-receipt">${message.read ? '✓✓' : '✓'}</span>
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
          showToast('Failed to send message', 'error');
        }
      }
    });
  
    messageInput.addEventListener('input', () => {
      clearTimeout(typingTimeout);
      sendTypingIndicator(chatId, true);
      typingTimeout = setTimeout(() => sendTypingIndicator(chatId, false), 1000);
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
          <div class="group-item" data-group-id="${group._id}">
            <img src="${group.avatar || 'default-group-avatar.png'}" alt="${group.name}">
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
        <img src="${group.avatar || 'default-group-avatar.png'}" alt="${group.name}">
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
  modal.classList.add('show');
  document.getElementById('create-group-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('group-name').value.trim();
    if (name) {
      try {
        showLoadingSpinner();
        await apiCall('/groups', 'POST', { name });
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
  socket = new WebSocket('ws://localhost:5000');
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
    setTimeout(initializeSocket, 5000); // Attempt to reconnect after 5 seconds
  });
}

function handleNewMessage(message) {
  const messageList = document.getElementById('message-list');
  if (messageList) {
    messageList.insertAdjacentHTML('beforeend', createMessageElement(message));
    messageList.scrollTop = messageList.scrollHeight;
  }
  
  // Show notification for new messages
  if (message.sender !== currentUser.id) {
    showNotification('New Message', `${message.senderName}: ${message.content}`);
  }
}

function updateOnlineUserStatus(user) {
  const onlineUsersList = document.getElementById('online-users-list');
  if (onlineUsersList) {
    const userElement = onlineUsersList.querySelector(`li[data-user-id="${user.id}"]`);
    if (userElement) {
      userElement.classList.toggle('online', user.online);
    } else if (user.online) {
      const li = document.createElement('li');
      li.dataset.userId = user.id;
      li.innerHTML = `
        <img src="${user.avatar}" alt="${user.username}">
        <span>${user.username}</span>
      `;
      onlineUsersList.appendChild(li);
    }
  }
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
      <img src="${currentUser.avatar || 'default-avatar.png'}" alt="${currentUser.username}" class="profile-avatar">
      <p><strong>Username:</strong> ${currentUser.username}</p>
      <p><strong>Email:</strong> ${currentUser.email}</p>
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
    
    // Add event listeners for settings changes
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
    editProfileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('edit-username').value.trim();
      const email = document.getElementById('edit-email').value.trim();
      const avatarFile = document.getElementById('edit-avatar').files[0];
  
      try {
        showLoadingSpinner();
        const formData = new FormData();
        formData.append('username', username);
        formData.append('email', email);
        if (avatarFile) {
          formData.append('avatar', avatarFile);
        }
  
        const response = await fetch(`${API_BASE_URL}/users/profile`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
  
        if (!response.ok) {
          throw new Error('Failed to update profile');
        }
  
        const updatedUser = await response.json();
        currentUser = updatedUser;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        updateUI();
        loadProfile();
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
      } catch (error) {
        console.error('Error updating profile:', error);
        alert('Failed to update profile. Please try again.');
      } finally {
        hideLoadingSpinner();
      }
    });
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

  // New feature: Theme switcher
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
  }
  
  // New feature: Emoji picker
  function addEmojiPicker() {
    const emojiBtn = document.createElement('button');
    emojiBtn.innerHTML = '😀';
    emojiBtn.className = 'emoji-picker-btn';
    emojiBtn.onclick = () => {
      const picker = new EmojiPicker({
        onEmojiSelect: emoji => {
          const messageInput = document.getElementById('message-input');
          messageInput.value += emoji.native;
        }
      });
      picker.togglePicker(emojiBtn);
    };
    document.getElementById('message-form').prepend(emojiBtn);
  }
  
  // New feature: Voice messages
  let mediaRecorder;
  let audioChunks = [];
  
  function setupVoiceRecording() {
    const recordBtn = document.createElement('button');
    recordBtn.innerHTML = '🎤';
    recordBtn.className = 'voice-record-btn';
    let isRecording = false;
  
    recordBtn.onclick = async () => {
      if (!isRecording) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
  
        mediaRecorder.ondataavailable = (e) => {
          audioChunks.push(e.data);
        };
  
        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/ogg; codecs=opus' });
          const formData = new FormData();
          formData.append('audio', audioBlob, 'voice_message.ogg');
          
          try {
            const response = await apiCall('/messages/voice', 'POST', formData);
            handleNewMessage(response.message);
          } catch (error) {
            console.error('Error sending voice message:', error);
            showToast('Failed to send voice message', 'error');
          }
        };
  
        mediaRecorder.start();
        isRecording = true;
        recordBtn.style.color = 'red';
      } else {
        mediaRecorder.stop();
        isRecording = false;
        recordBtn.style.color = '';
      }
    };
  
    document.getElementById('message-form').prepend(recordBtn);
  }
  
  // New feature: Typing indicator
  let typingTimeout;
  function sendTypingIndicator(chatId, isTyping) {
    socket.send(JSON.stringify({
      type: 'typing',
      chatId: chatId,
      isTyping: isTyping
    }));
  }
  
  function handleTypingIndicator(data) {
    const typingIndicator = document.getElementById('typing-indicator');
    if (data.isTyping) {
      typingIndicator.textContent = `${data.username} is typing...`;
    } else {
      typingIndicator.textContent = '';
    }
  }
  
  // New feature: Read receipts
  function sendReadReceipt(messageId) {
    apiCall(`/messages/${messageId}/read`, 'POST');
  }
  
  function handleReadReceipt(data) {
    const messageElement = document.querySelector(`[data-message-id="${data.messageId}"]`);
    if (messageElement) {
      messageElement.querySelector('.read-receipt').textContent = '✓✓';
    }
  }  
  
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
  
  async function deleteChat(chatId) {
    const shouldDelete = await confirmAction('Are you sure you want to delete this chat?');
    if (shouldDelete) {
      try {
        await apiCall(`/chats/${chatId}`, 'DELETE');
        loadChats();
        showToast('Chat deleted successfully', 'success');
      } catch (error) {
        console.error('Error deleting chat:', error);
        showToast('Failed to delete chat', 'error');
      }
    }
  }
  
  window.addEventListener('online', () => {
    showToast('You are back online', 'success');
    initializeSocket(); // Reconnect WebSocket
  });
  
  window.addEventListener('offline', () => {
    showToast('You are offline', 'warning');
  });
  
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
    console.log("DOM fully loaded and parsed");
  
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
  
    if (token) {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        currentUser = JSON.parse(storedUser);
        hideAuthModal();
        updateUI();
        loadChats();
        initializeSocket();
      } else {
        logout();
      }
    } else {
      showAuthModal();
    }
  
    // Initialize dark mode
    const darkMode = localStorage.getItem('darkMode') === 'true';
    document.body.classList.toggle('dark-mode', darkMode);
  });
  
  console.log("Script loaded successfully");