import { login, register } from './partials/auth.js';
import { loadUserProfile, updateProfile } from './partials/profile.js';
import './partials/profile-picture.js';
import { loadStats } from './partials/admin.js';
import { showScreen, showTab, tokens, logout } from './partials/utils.js';

window.showLogin = () => showScreen('login-screen');
window.showRegister = () => showScreen('register-screen');
window.showTab = showTab;
window.logout = logout;
window.loadStats = loadStats;

window.addEventListener('userLoggedIn', async () => {
    try {
        await loadUserProfile();
    } catch (error) {
        console.error('Failed to load user profile after login:', error);
        logout();
    }
});

window.addEventListener('load', async () => {
    if (tokens.access) {
        try {
            await loadUserProfile();
            showScreen('dashboard-screen');
        } catch (error) {
            console.log('Auto-login failed:', error.message);
            logout();
        }
    }

    document.getElementById('login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        login(email, password);
    });

    document.getElementById('register-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const userData = {
            username: document.getElementById('reg-username').value,
            email: document.getElementById('reg-email').value,
            password: document.getElementById('reg-password').value,
            display_name: document.getElementById('reg-display-name').value || undefined
        };
        register(userData);
    });

    document.getElementById('update-profile-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const displayName = document.getElementById('update-display-name').value;
        const bio = document.getElementById('update-bio').value;
        updateProfile(displayName, bio);
    });
});

const bioInput = document.getElementById('update-bio');
const bioCounter = document.getElementById('bio-counter');

bioInput.addEventListener('input', () => {
    bioCounter.textContent = `${bioInput.value.length}/280`;
});

const displayNameInput = document.getElementById('update-display-name');
const displayNameCounter = document.getElementById('display-name-counter');

displayNameInput.addEventListener('input', () => {
    const length = displayNameInput.value.length;
    const maxLength = 50;
    displayNameCounter.textContent = `${length}/${maxLength}`;

    if (length > maxLength) {
        displayNameCounter.style.color = '#cc5f5f';
        displayNameInput.style.borderColor = '#cc5f5f';
    } else if (length > maxLength * 0.9) {
        displayNameCounter.style.color = '#ffc107';
        displayNameInput.style.borderColor = '';
    } else {
        displayNameCounter.style.color = '#acacac';
        displayNameInput.style.borderColor = '';
    }
});