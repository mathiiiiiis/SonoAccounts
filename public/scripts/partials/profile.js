import { apiCall, showMessage, state } from './utils.js';

export async function loadUserProfile() {
    try {
        state.currentUser = await apiCall('/users/me');
        document.getElementById('user-display-name').textContent =
            state.currentUser.display_name || state.currentUser.username;
        document.getElementById('user-email').textContent = state.currentUser.email;
        document.getElementById('update-display-name').value = state.currentUser.display_name || '';
        document.getElementById('update-bio').value = state.currentUser.bio || '';

        if (state.currentUser.profile_picture_url) {
            //force https for csp compliance
            let picUrl = state.currentUser.profile_picture_url;
            if (picUrl.startsWith('http://')) {
                picUrl = picUrl.replace('http://', 'https://');
            }

            document.getElementById('profile-pic').innerHTML = 
                `<img src="${picUrl}" alt="Profile" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
        }

        if (state.currentUser.is_superuser === true) {
            document.getElementById('admin-tab').style.display = 'block';
        } else {
            document.getElementById('admin-tab').style.display = 'none';
        }

    } catch (error) {
        console.error('Profile load error:', error);
        showMessage('dashboard-message', error.message);
    }
}

export async function updateProfile(displayName, bio) {
    try {
        const updateData = {};

        //display name validation
        if (displayName) {
            const MAX_DISPLAY_NAME_LENGTH = 50;
            const MIN_DISPLAY_NAME_LENGTH = 1;
            
            //trim whitespace
            const trimmedDisplayName = displayName.trim();
            
            if (trimmedDisplayName.length < MIN_DISPLAY_NAME_LENGTH) {
                showMessage(
                    'dashboard-message',
                    'Display name cannot be empty.',
                    'error'
                );
                return;
            }
            
            if (trimmedDisplayName.length > MAX_DISPLAY_NAME_LENGTH) {
                showMessage(
                    'dashboard-message',
                    `Display name cannot exceed ${MAX_DISPLAY_NAME_LENGTH} characters.`,
                    'error'
                );
                return;
            }
            
            //check for valid characters (alphanumeric, spaces, basic punctuation)
            const validNamePattern = /^[a-zA-Z0-9\s\-_.!@#$%&*()]+$/;
            if (!validNamePattern.test(trimmedDisplayName)) {
                showMessage(
                    'dashboard-message',
                    'Display name contains invalid characters.',
                    'error'
                );
                return;
            }
            
            updateData.display_name = trimmedDisplayName;
        }

        if (bio) {
            //enforce max length
            const MAX_BIO_LENGTH = 280;
            if (bio.length > MAX_BIO_LENGTH) {
                showMessage(
                    'dashboard-message',
                    `Bio cannot exceed ${MAX_BIO_LENGTH} characters.`,
                    'error'
                );
                return; //stop update
            }
            updateData.bio = bio;
        }

        const updatedUser = await apiCall('/users/me', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
        });

        state.currentUser = updatedUser;
        document.getElementById('user-display-name').textContent =
            updatedUser.display_name || updatedUser.username;

        showMessage('dashboard-message', 'Profile updated successfully!', 'success');
    } catch (error) {
        showMessage('dashboard-message', error.message);
    }
}