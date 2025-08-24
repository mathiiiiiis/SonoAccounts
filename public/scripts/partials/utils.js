export const API_BASE = '/api';
export const state = {
    currentUser: null,
};

export const tokens = {
    _access: localStorage.getItem('access_token'),
    _refresh: localStorage.getItem('refresh_token'),

    set(data) {
        this._access = data.access_token;
        this._refresh = data.refresh_token;
        localStorage.setItem('access_token', this._access);
        localStorage.setItem('refresh_token', this._refresh);
        console.log('Tokens set successfully.');
    },

    get() {
        return {
            access_token: this._access,
            refresh_token: this._refresh
        };
    },

    clear() {
        this._access = null;
        this._refresh = null;
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        console.log('Tokens cleared.');
    },

    get access() {
        return this._access;
    },
    get refresh() {
        return this._refresh;
    },
    set access(value) {
        this._access = value;
        localStorage.setItem('access_token', value);
    },
    set refresh(value) {
        this._refresh = value;
        localStorage.setItem('refresh_token', value);
    }
};

export function showMessage(elementId, message, type = 'error') {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `<div class="${type}">${message}</div>`;
        setTimeout(() => element.innerHTML = '', 5000);
    } else {
        console.warn(`Message element with ID "${elementId}" not found. Displaying message in console: ${message}`);
    }
}

export function showScreen(screenId) {
    const authContainer = document.getElementById('auth-container');
    const dashboardScreen = document.getElementById('dashboard-screen');

    if (screenId === 'dashboard-screen') {
        if (authContainer) authContainer.style.display = 'none';
        if (dashboardScreen) {
            dashboardScreen.classList.add('active');
            dashboardScreen.style.display = 'block';
        }
    } else {
        if (authContainer) authContainer.style.display = 'block';
        if (dashboardScreen) {
            dashboardScreen.classList.remove('active');
            dashboardScreen.style.display = 'none';
        }
        
        if (authContainer) {
            authContainer.querySelectorAll('.screen').forEach(screen => {
                screen.classList.remove('active');
            });
            const targetScreen = document.getElementById(screenId);
            if (targetScreen) {
                targetScreen.classList.add('active');
            } else {
                console.warn(`Screen element with ID "${screenId}" not found.`);
            }
        }
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
    } else {
        console.warn(`Unknown tab name: ${tabName}`);
    }
}

export async function apiCall(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;

    const headers = {
        ...options.headers
    };

    let requestBody = options.body;

    if (!headers['Content-Type'] && typeof requestBody === 'object' && !(requestBody instanceof FormData) && !(requestBody instanceof URLSearchParams)) {
        headers['Content-Type'] = 'application/json';
        requestBody = JSON.stringify(requestBody);
    } else if (headers['Content-Type'] === 'application/json' && typeof requestBody === 'object') {
        requestBody = JSON.stringify(requestBody);
    }

    const config = {
        ...options,
        headers,
        body: requestBody
    };

    const currentTokens = tokens.get();
    if (currentTokens.access_token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${currentTokens.access_token}`;
    }

    try {
        const response = await fetch(url, config);
        let data;
        try {
            data = await response.json();
        } catch (e) {
            console.warn('Response not JSON:', e);
            data = {};
        }

        if (!response.ok) {
            const errorMessage = Array.isArray(data.detail) 
                ? data.detail.map(d => d.msg || JSON.stringify(d)).join(', ')
                : (data.detail || response.statusText || 'API request failed');
            throw new Error(errorMessage);
        }

        return data;

    } catch (error) {
        if (error.message.includes('Could not validate credentials') && tokens.refresh) {
            console.log('Access token expired, attempting to refresh...');
            try {
                const refreshResponse = await fetch(`${API_BASE}/users/token/refresh`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refresh_token: tokens.refresh })
                });

                if (refreshResponse.ok) {
                    const newTokens = await refreshResponse.json();
                    tokens.set(newTokens);
                    console.log('Tokens refreshed successfully.');

                    const updatedTokens = tokens.get();
                    config.headers.Authorization = `Bearer ${updatedTokens.access_token}`;
                    const retryResponse = await fetch(url, config);
                    if (!retryResponse.ok) {
                         const retryErrorData = await retryResponse.json().catch(() => ({}));
                         const retryErrorMessage = Array.isArray(retryErrorData.detail)
                            ? retryErrorData.detail.map(d => d.msg || JSON.stringify(d)).join(', ')
                            : (retryErrorData.detail || retryResponse.statusText || 'API request failed on retry');
                         throw new Error(retryErrorMessage);
                    }
                    return await retryResponse.json();
                } else {
                    console.error('Failed to refresh token:', await refreshResponse.text());
                    logout();
                    throw new Error('Session expired. Please log in again.');
                }
            } catch (refreshError) {
                console.error('Error during token refresh:', refreshError);
                logout();
                throw new Error('Session expired. Please log in again.');
            }
        }
        console.error('API Call Error:', error);
        throw error;
    }
}


export function logout() {
    tokens.clear();
    state.currentUser = null;
    showScreen('login-screen');
    showMessage('message', 'Logged out successfully', 'success');
}
