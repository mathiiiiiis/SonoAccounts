export const API_BASE = '/api';
export const state = {
    currentUser: null,
};
export let tokens = {
    access: localStorage.getItem('access_token'),
    refresh: localStorage.getItem('refresh_token')
};

export function showMessage(elementId, message, type = 'error') {
    const element = document.getElementById(elementId);
    element.innerHTML = `<div class="${type}">${message}</div>`;
    setTimeout(() => element.innerHTML = '', 5000);
}

export function showScreen(screenId) {
    if (screenId === 'dashboard-screen') {
        document.getElementById('auth-container').style.display = 'none';
        document.getElementById('dashboard-screen').classList.add('active');
        document.getElementById('dashboard-screen').style.display = 'block';
    } else {
        document.getElementById('auth-container').style.display = 'block';
        document.getElementById('dashboard-screen').classList.remove('active');
        document.getElementById('dashboard-screen').style.display = 'none';
        
        document.querySelectorAll('#auth-container .screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }
}

export function showTab(tabName) {
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });

    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    if (tabName === 'profile') {
        document.querySelector('.nav-tab[onclick*="profile"]').classList.add('active');
        document.getElementById('profile-tab').classList.remove('hidden');
    } else if (tabName === 'admin') {
        document.querySelector('.nav-tab[onclick*="admin"]').classList.add('active');
        document.getElementById('admin-tab-content').classList.remove('hidden');
    }
}

export async function apiCall(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;

    const headers = {
        ...options.headers
    };

    // ❌ Don't set Content-Type if body is FormData
    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    const config = {
        ...options,
        headers
    };

    if (tokens.access && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${tokens.access}`;
    }

    try {
        const response = await fetch(url, config);
        let data;
        try {
            data = await response.json();
        } catch {
            data = {};
        }

        if (!response.ok) {
            throw new Error(
                Array.isArray(data.detail) 
                ? data.detail.map(d => d.msg || JSON.stringify(d)).join(', ')
                : (data.detail || 'API request failed')
            );
        }

        return data;

    } catch (error) {
        if (error.message.includes('Could not validate credentials') && tokens.refresh) {
            try {
                const refreshResponse = await fetch(`${API_BASE}/users/token/refresh`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refresh_token: tokens.refresh })
                });

                if (refreshResponse.ok) {
                    const newTokens = await refreshResponse.json();
                    tokens.access = newTokens.access_token;
                    tokens.refresh = newTokens.refresh_token;
                    localStorage.setItem('access_token', tokens.access);
                    localStorage.setItem('refresh_token', tokens.refresh);

                    config.headers.Authorization = `Bearer ${tokens.access}`;
                    const retryResponse = await fetch(url, config);
                    return await retryResponse.json();
                }
            } catch (refreshError) {
                logout();
                throw new Error('Session expired. Please login again.');
            }
        }
        throw error;
    }
}

export function logout() {
    tokens = { access: null, refresh: null };
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    state.currentUser = null;
    showScreen('login-screen');
    showMessage('message', 'Logged out successfully', 'success');
}