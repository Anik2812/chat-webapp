document.addEventListener('DOMContentLoaded', () => {
    const app = document.getElementById('app');
    const authModal = document.getElementById('auth-modal');
    const loginForm = document.getElementById('loginForm');
    const showRegisterLink = document.getElementById('showRegister');
    const chatBtn = document.getElementById('chatBtn');
    const groupsBtn = document.getElementById('groupsBtn');
    const storiesBtn = document.getElementById('storiesBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    const contentArea = document.getElementById('content-area');

    let token = localStorage.getItem('token');
    let currentUser = null;

    function showAuthModal() {
        authModal.style.display = 'block';
        app.style.display = 'none';
    }

    function hideAuthModal() {
        authModal.style.display = 'none';
        app.style.display = 'flex';
    }

    if (!token) {
        showAuthModal();
    } else {
        hideAuthModal();
        fetchCurrentUser();
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        try {
            // Simulating login for demo purposes
            token = 'fake_token';
            localStorage.setItem('token', token);
            currentUser = { username: username };
            hideAuthModal();
            updateUI();
        } catch (error) {
            console.error('Error logging in:', error);
        }
    });

    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        // Show registration form (not implemented in this demo)
        alert('Registration form would appear here');
    });

    function updateUI() {
        document.getElementById('username').textContent = currentUser.username;
    }

    chatBtn.addEventListener('click', () => loadChats());
    groupsBtn.addEventListener('click', () => loadGroups());
    storiesBtn.addEventListener('click', () => loadStories());
    settingsBtn.addEventListener('click', () => loadSettings());

    function loadChats() {
        contentArea.innerHTML = `
            <h2>Chats</h2>
            <div class="chat-list">
                <div class="chat-item">
                    <img src="https://via.placeholder.com/40" alt="User">
                    <div class="chat-info">
                        <h3>John Doe</h3>
                        <p>Hey, how's it going?</p>
                    </div>
                </div>
                <div class="chat-item">
                    <img src="https://via.placeholder.com/40" alt="User">
                    <div class="chat-info">
                        <h3>Jane Smith</h3>
                        <p>Did you see the latest update?</p>
                    </div>
                </div>
            </div>
        `;
    }

    function loadGroups() {
        contentArea.innerHTML = `
            <h2>Groups</h2>
            <div class="group-list">
                <div class="group-item">
                    <h3>Tech Talk</h3>
                    <p>Members: 120</p>
                </div>
                <div class="group-item">
                    <h3>Movie Buffs</h3>
                    <p>Members: 85</p>
                </div>
            </div>
            <button id="createGroupBtn" class="create-btn">Create New Group</button>
        `;

        document.getElementById('createGroupBtn').addEventListener('click', () => {
            // Implement group creation logic here
            alert('Group creation form would appear here');
        });
    }

    function loadStories() {
        contentArea.innerHTML = `
            <h2>Stories</h2>
            <div class="story-list">
                <div class="story-item">
                    <img src="https://via.placeholder.com/60" alt="User">
                    <p>Your Story</p>
                </div>
                <div class="story-item">
                    <img src="https://via.placeholder.com/60" alt="User">
                    <p>John's Story</p>
                </div>
                <div class="story-item">
                    <img src="https://via.placeholder.com/60" alt="User">
                    <p>Jane's Story</p>
                </div>
            </div>
            <button id="createStoryBtn" class="create-btn">Create New Story</button>
        `;

        document.getElementById('createStoryBtn').addEventListener('click', () => {
            // Implement story creation logic here
            alert('Story creation interface would appear here');
        });
    }

    function loadSettings() {
        contentArea.innerHTML = `
            <h2>Settings</h2>
            <div class="settings-list">
                <div class="setting-item">
                    <h3>Account</h3>
                    <p>Manage your account details</p>
                </div>
                <div class="setting-item">
                    <h3>Privacy</h3>
                    <p>Control your privacy settings</p>
                </div>
                <div class="setting-item">
                    <h3>Notifications</h3>
                    <p>Customize your notifications</p>
                </div>
            </div>
            <button id="logoutBtn" class="logout-btn">Logout</button>
        `;

        document.getElementById('logoutBtn').addEventListener('click', () => {
            localStorage.removeItem('token');
            showAuthModal();
        });
    }

    // Load chats by default
    loadChats();
});