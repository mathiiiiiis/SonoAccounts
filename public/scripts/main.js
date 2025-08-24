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