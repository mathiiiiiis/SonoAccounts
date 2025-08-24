import { apiCall, showMessage, showScreen, tokens, logout } from './utils.js';

export async function login(email, password) {
    try {
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);

        const response = await fetch('/api/users/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString()
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || 'Login failed');

        tokens.access = data.access_token;
        tokens.refresh = data.refresh_token;
        localStorage.setItem('access_token', tokens.access);
        localStorage.setItem('refresh_token', tokens.refresh);

        await loadUserProfile();
        showScreen('dashboard-screen');
        showMessage('dashboard-message', 'Welcome back!', 'success');

    } catch (error) {
        showMessage('message', error.message);
    }
}

export async function register(userData) {
    try {
        await apiCall('/users/', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        showMessage('register-message', 'Account created successfully! Please login.', 'success');
        setTimeout(() => showScreen('login-screen'), 2000);
    } catch (error) {
        showMessage('register-message', error.message);
    }
}
