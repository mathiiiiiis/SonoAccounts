import { apiCall, showMessage, state, tokens } from './utils.js';

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

    //max file size 5MB
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
    //reset file input
    document.getElementById('profile-picture-input').value = '';
});

async function uploadFile(file, filename = "profile.png") {
    if (!file) {
        throw new Error('No file provided');
    }
    
    const formData = new FormData();
    formData.append('file', file, filename);
    
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const data = JSON.parse(xhr.responseText);
                        resolve(data);
                    } catch (e) {
                        resolve({});
                    }
                } else {
                    try {
                        const errorData = JSON.parse(xhr.responseText);
                        const errorMessage = Array.isArray(errorData.detail)
                            ? errorData.detail.map(d => d.msg || JSON.stringify(d)).join(', ')
                            : (errorData.detail || xhr.statusText || 'Upload failed');
                        reject(new Error(errorMessage));
                    } catch (e) {
                        reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
                    }
                }
            }
        };
        
        xhr.onerror = function() {
            reject(new Error('Network error during upload'));
        };
        
        const currentTokens = tokens.get();
        xhr.open('POST', `/api/users/me/upload-profile-picture`);
        
        if (currentTokens.access_token) {
            xhr.setRequestHeader('Authorization', `Bearer ${currentTokens.access_token}`);
        }
        
        xhr.send(formData);
    });
}

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
        showMessage('dashboard-message', error.message, 'error');
    }

    document.getElementById('cropper-modal').style.display = 'none';
    if (cropper) cropper.destroy();
    currentFile = null;
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
            const updatedUser = await uploadFile(blob, 'cropped_profile.png');

            state.currentUser = updatedUser;
            document.getElementById('profile-pic').innerHTML =
                `<img src="${updatedUser.profile_picture_url}" alt="Profile" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;

            showMessage('dashboard-message', 'Profile picture updated successfully!', 'success');
        } catch (error) {
            console.error('Profile picture upload error:', error);
            showMessage('dashboard-message', error.message, 'error');
        }

        document.getElementById('cropper-modal').style.display = 'none';
        cropper.destroy();
        currentFile = null;
        document.getElementById('profile-picture-input').value = '';
    }, 'image/png'); //specify image format
});