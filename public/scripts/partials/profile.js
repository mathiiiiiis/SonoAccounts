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
            document.getElementById('profile-pic').innerHTML = 
                `<img src="${state.currentUser.profile_picture_url}" alt="Profile" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
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
        if (displayName) updateData.display_name = displayName;
        if (bio) updateData.bio = bio;

        const updatedUser = await apiCall('/users/me', {
            method: 'PUT',
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