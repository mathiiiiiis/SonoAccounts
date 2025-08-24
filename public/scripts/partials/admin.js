import { apiCall, showMessage, state } from './utils.js';

export async function loadStats() {
    try {
        if (!state.currentUser || !state.currentUser.is_superuser) {
            throw new Error('Admin privileges required');
        }

        const stats = await apiCall('/admin/stats');

        document.getElementById('total-users').textContent = stats.total_users || '-';
        document.getElementById('active-users').textContent = stats.active_users || '-';
        document.getElementById('inactive-users').textContent = stats.inactive_users || '-';

    } catch (error) {
        console.error('Stats load error:', error);
        showMessage('admin-message', 'Unable to load stats. Admin privileges required.');

        document.getElementById('admin-tab').style.display = 'none';
        document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.add('hidden'));
        document.querySelector('.nav-tab[onclick*="profile"]').classList.add('active');
        document.getElementById('profile-tab').classList.remove('hidden');
    }
}