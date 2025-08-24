import { apiCall, showMessage, state } from './utils.js';

let cropper;
let currentFile = null;

document.getElementById('profile-picture-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    //only allow image files
    if (!file.type.startsWith('image/')) {
        showMessage('dashboard-message', 'Only image files are allowed for profile pictures.', 'error');
        e.target.value = ''; //reset file input
        return;
    }

    //only allow png, jpg, or webp
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
        showMessage('dashboard-message', 'Only PNG, JPG, or WebP images are allowed.', 'error');
        e.target.value = '';
        return;
    }

    //max file size 5mb
    if (file.size > 5 * 1024 * 1024) {
        showMessage('dashboard-message', 'File too large (max 5MB).', 'error');
        e.target.value = '';
        return;
    }

    currentFile = file; //store current file for skip upload
    const reader = new FileReader();
    reader.onload = (ev) => {
        const img = document.getElementById('cropper-image');
        img.src = ev.target.result;

        //show modal
        document.getElementById('cropper-modal').style.display = 'flex';

        //init cropper
        if (cropper) cropper.destroy();
        cropper = new Cropper(img, {
            aspectRatio: 1,
            viewMode: 1,
            background: false,
            movable: false,
            zoomable: true,
        });
    };
    reader.readAsDataURL(file);
});

//cancel crop
document.getElementById('cropper-cancel').addEventListener('click', () => {
    document.getElementById('cropper-modal').style.display = 'none';
    if (cropper) cropper.destroy();
    currentFile = null;
    // Reset file input
    document.getElementById('profile-picture-input').value = '';
});

//helper to upload file and recreate FormData for retries
async function uploadFile(fileBlob, filename = 'profile.png') {
    const formData = new FormData();
    formData.append('file', fileBlob, filename);

    return await apiCall('/users/me/upload-profile-picture', {
        method: 'POST',
        body: formData,
        headers: { 'Authorization': `Bearer ${state.token}` },
        isFile: true // optional: prevents FormData reuse issues
    });
};

//skip crop + upload original
document.getElementById('cropper-skip').addEventListener('click', async () => {
    if (!currentFile) return;

    try {
        const updatedUser = await uploadFile(currentFile, currentFile.name);

        state.currentUser = updatedUser;
        document.getElementById('profile-pic').innerHTML =
            `<img src="${updatedUser.profile_picture_url}" alt="Profile" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;

        showMessage('dashboard-message', 'Profile picture updated successfully!', 'success');
    } catch (error) {
        console.error('Profile picture upload error:', error);
        showMessage('dashboard-message', error.message);
    }

    document.getElementById('cropper-modal').style.display = 'none';
    if (cropper) cropper.destroy();
    currentFile = null;
    //reset file input
    document.getElementById('profile-picture-input').value = '';
});

//confirm crop + upload
document.getElementById('cropper-confirm').addEventListener('click', async () => {
    if (!cropper) return;

    const canvas = cropper.getCroppedCanvas({
        width: 300,
        height: 300,
    });

    canvas.toBlob(async (blob) => {
        try {
            const updatedUser = await uploadFile(blob);

            state.currentUser = updatedUser;
            document.getElementById('profile-pic').innerHTML =
                `<img src="${updatedUser.profile_picture_url}" alt="Profile" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;

            showMessage('dashboard-message', 'Profile picture updated successfully!', 'success');
        } catch (error) {
            console.error('Profile picture upload error:', error);
            showMessage('dashboard-message', error.message);
        }

        document.getElementById('cropper-modal').style.display = 'none';
        cropper.destroy();
        currentFile = null;
        //rest file input
        document.getElementById('profile-picture-input').value = '';
    });
});