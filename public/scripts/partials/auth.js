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
    try {
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

        const encryptedB64 = btoa(String.fromCharCode(...new Uint8Array(encrypted)));
        
        
        return encryptedB64;
    } catch (error) {
        throw new Error('Failed to encrypt password. Please try again.');
    }
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
        if (!email || !password) {
            showMessage('message', 'Please enter both email/username and password.');
            return;
        }

        if (password.length < 1) {
            showMessage('message', 'Password cannot be empty.');
            return;
        }
        
        const encryptedPassword = await encryptPassword(password);
        
        const formData = new URLSearchParams();
        formData.append('username', email.trim());
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
            showMessage('dashboard-message', 'Login successful!', 'success');
            
            window.dispatchEvent(new CustomEvent('userLoggedIn'));
        } else {
            showMessage('message', 'Login failed: No access token received.');
        }
    } catch (error) {
        
        let errorMessage = 'Login failed. ';
        if (error.message.includes('401') || error.message.includes('unauthorized')) {
            errorMessage += 'Invalid username/email or password.';
        } else if (error.message.includes('400')) {
            errorMessage += 'Invalid request format.';
        } else if (error.message.includes('500')) {
            errorMessage += 'Server error. Please try again later.';
        } else {
            errorMessage += error.message || 'Please check your connection and try again.';
        }
        
        showMessage('message', errorMessage);
    }
}

export async function register(userData) {
    try {
        if (!userData.username || !userData.email || !userData.password) {
            showMessage('register-message', 'Please fill in all required fields.');
            return;
        }

        if (userData.username.length < 3) {
            showMessage('register-message', 'Username must be at least 3 characters long.');
            return;
        }

        if (userData.password.length < 6) {
            showMessage('register-message', 'Password must be at least 6 characters long.');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userData.email)) {
            showMessage('register-message', 'Please enter a valid email address.');
            return;
        }

        const encryptedPassword = await encryptPassword(userData.password);
        const registrationData = {
            ...userData,
            password: encryptedPassword,
            username: userData.username.trim(),
            email: userData.email.trim()
        };
        
        const response = await apiCall('/users/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Password-Encrypted': 'true'
            },
            body: JSON.stringify(registrationData)
        });
        
        showMessage('register-message', 'Registration successful! Please log in with your new account.', 'success');
        showScreen('login-screen');
        
        document.getElementById('login-email').value = userData.email;
        
    } catch (error) {
        
        let errorMessage = 'Registration failed. ';
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
            errorMessage += 'Username or email already exists.';
        } else if (error.message.includes('400')) {
            errorMessage += 'Invalid input data.';
        } else {
            errorMessage += error.message || 'Please try again.';
        }
        
        showMessage('register-message', errorMessage);
    }
}