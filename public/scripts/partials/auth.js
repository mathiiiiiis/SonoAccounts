import { apiCall, showMessage, showScreen, tokens, logout } from './utils.js';

let PUBLIC_KEY = null;

async function getPublicKey() {
    if (!PUBLIC_KEY) {
        const response = await apiCall('/users/public-key');
        PUBLIC_KEY = response.public_key;
    }
    return PUBLIC_KEY;
}

async function encryptPassword(password) {
    const publicKey = await getPublicKey();
    const pemKey = publicKey.replace(/-----.*-----/g, '').replace(/\s/g, '');
    
    const importedKey = await crypto.subtle.importKey(
        'spki',
        str2ab(atob(pemKey)),
        {
            name: 'RSA-OAEP',
            hash: 'SHA-256'
        },
        false,
        ['encrypt']
    );

    const encrypted = await crypto.subtle.encrypt(
        { name: 'RSA-OAEP' },
        importedKey,
        new TextEncoder().encode(password)
    );

    return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
}

function str2ab(str) {
    const buf = new ArrayBuffer(str.length);
    const bufView = new Uint8Array(buf);
    for (let i = 0; i < str.length; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
}

export async function login(email, password) {
    try {
        const encryptedPassword = await encryptPassword(password);
        
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', encryptedPassword);

        const response = await apiCall('/users/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded', 
                'X-Password-Encrypted': 'true'
            },
            body: formData.toString() 
        });

        if (response.access_token) {
            tokens.set(response);
            showScreen('dashboard-screen');
        } else {
            showMessage('message', 'Login failed: No access token received.');
        }
    } catch (error) {
        console.error('Login error:', error);
        showMessage('message', error.message || 'An unknown error occurred during login.');
    }
}

export async function register(userData) {
    try {
        const encryptedPassword = await encryptPassword(userData.password);
        userData.password = encryptedPassword;
        
        const response = await apiCall('/users/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Password-Encrypted': 'true'
            },
            body: JSON.stringify(userData)
        });
        
        showMessage('register-message', 'Registration successful! Please log in.');
        showScreen('login');
    } catch (error) {
        console.error('Registration error:', error);
        showMessage('register-message', error.message || 'An unknown error occurred during registration.');
    }
}
