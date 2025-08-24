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

    let requestHeaders = { ...options.headers };
    let requestBody = options.body;
    let isFormData = false;

    //auto-detect if body is FormData, Blob, or File
    if (requestBody instanceof Blob || requestBody instanceof File) {
        const formData = new FormData();
        const filename = options.filename || (requestBody.name ?? 'upload.png');
        formData.append('file', requestBody, filename);
        requestBody = formData;
        isFormData = true;
    } else if (requestBody && typeof requestBody === 'object' && !(requestBody instanceof URLSearchParams)) {
        requestHeaders['Content-Type'] = 'application/json';
        requestBody = JSON.stringify(requestBody);
    }
    
    //explicitly delete content-type for FormData
    if (isFormData) {
        delete requestHeaders['Content-Type'];
    }

    const config = {
        ...options,
        headers: requestHeaders,
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
        } catch {
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