// User Profile JavaScript
class UserProfile {
    constructor() {
        this.isEditing = false;
        this.currentUser = null;
        this.init();
    }

    init() {
        this.loadUserProfile();
        this.setupEventListeners();
        this.setupUserMenu();
    }

    setupEventListeners() {
        // Edit profile button
        const editBtn = document.getElementById('edit-profile-btn');
        if (editBtn) {
            editBtn.addEventListener('click', () => this.toggleEditMode());
        }

        // Cancel edit button
        const cancelBtn = document.getElementById('cancel-edit-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.cancelEdit());
        }

        // Profile form submission
        const profileForm = document.getElementById('profile-form');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => this.saveProfile(e));
        }

        // Avatar change
        const changeAvatarBtn = document.getElementById('change-avatar-btn');
        const avatarUpload = document.getElementById('avatar-upload');
        if (changeAvatarBtn && avatarUpload) {
            changeAvatarBtn.addEventListener('click', () => avatarUpload.click());
            avatarUpload.addEventListener('change', (e) => this.handleAvatarChange(e));
        }

        // Change password modal
        const changePasswordBtn = document.getElementById('change-password-btn');
        const passwordModal = document.getElementById('change-password-modal');
        const closePasswordModal = document.getElementById('close-password-modal');
        const cancelPasswordChange = document.getElementById('cancel-password-change');
        const passwordForm = document.getElementById('change-password-form');

        if (changePasswordBtn && passwordModal) {
            changePasswordBtn.addEventListener('click', () => {
                passwordModal.classList.remove('hidden');
            });
        }

        if (closePasswordModal) {
            closePasswordModal.addEventListener('click', () => {
                passwordModal.classList.add('hidden');
                this.resetPasswordForm();
            });
        }

        if (cancelPasswordChange) {
            cancelPasswordChange.addEventListener('click', () => {
                passwordModal.classList.add('hidden');
                this.resetPasswordForm();
            });
        }

        if (passwordForm) {
            passwordForm.addEventListener('submit', (e) => this.changePassword(e));
        }

        // Settings toggles
        const emailNotifications = document.getElementById('email-notifications');
        const smsNotifications = document.getElementById('sms-notifications');

        if (emailNotifications) {
            emailNotifications.addEventListener('change', () => this.updateNotificationSettings());
        }

        if (smsNotifications) {
            smsNotifications.addEventListener('change', () => this.updateNotificationSettings());
        }
    }

    setupUserMenu() {
        const userMenuButton = document.getElementById('user-menu-button');
        const userMenuDropdown = document.getElementById('user-menu-dropdown');
        const logoutButton = document.getElementById('logout-button');

        if (userMenuButton && userMenuDropdown) {
            userMenuButton.addEventListener('click', (e) => {
                e.stopPropagation();
                userMenuDropdown.classList.toggle('hidden');
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', () => {
                userMenuDropdown.classList.add('hidden');
            });
        }

        if (logoutButton) {
            logoutButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }
    }

    loadUserProfile() {
        try {
            // Get user data from localStorage or API
            const userData = this.getUserData();
            this.currentUser = userData;
            this.populateProfile(userData);
        } catch (error) {
            console.error('Error loading user profile:', error);
            this.showNotification('Error loading profile data', 'error');
        }
    }

    getUserData() {
        // Try to get from localStorage first
        const storedUser = localStorage.getItem('bricouli_user');
        if (storedUser) {
            return JSON.parse(storedUser);
        }

        // Mock user data for demonstration
        return {
            id: 1,
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            phone: '+1 (555) 123-4567',
            location: 'New York, NY',
            bio: 'Experienced homeowner looking for quality craftsmen for various home improvement projects.',
            role: 'Client',
            avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=3B82F6&color=fff&size=256',
            memberSince: '2023-01-15',
            totalProjects: 12,
            completedProjects: 8,
            rating: 4.8,
            settings: {
                emailNotifications: true,
                smsNotifications: false
            }
        };
    }

    populateProfile(userData) {
        // Profile header
        const profileName = document.getElementById('profile-name');
        const profileEmail = document.getElementById('profile-email');
        const profileLocation = document.getElementById('profile-location');
        const profileRole = document.getElementById('profile-role');
        const profileAvatar = document.getElementById('profile-avatar');
        const userAvatar = document.getElementById('user-avatar');
        const userNameHeader = document.getElementById('user-name-header');

        if (profileName) profileName.textContent = `${userData.firstName} ${userData.lastName}`;
        if (profileEmail) profileEmail.textContent = userData.email;
        if (profileLocation) profileLocation.textContent = userData.location || 'Not specified';
        if (profileRole) profileRole.textContent = userData.role || 'Client';
        if (profileAvatar) profileAvatar.src = userData.avatar;
        if (userAvatar) userAvatar.src = userData.avatar;
        if (userNameHeader) userNameHeader.textContent = `${userData.firstName} ${userData.lastName}`;

        // Form fields
        const firstName = document.getElementById('firstName');
        const lastName = document.getElementById('lastName');
        const email = document.getElementById('email');
        const phone = document.getElementById('phone');
        const location = document.getElementById('location');
        const bio = document.getElementById('bio');

        if (firstName) firstName.value = userData.firstName || '';
        if (lastName) lastName.value = userData.lastName || '';
        if (email) email.value = userData.email || '';
        if (phone) phone.value = userData.phone || '';
        if (location) location.value = userData.location || '';
        if (bio) bio.value = userData.bio || '';

        // Stats
        const memberSince = document.getElementById('member-since');
        const totalProjects = document.getElementById('total-projects');
        const completedProjects = document.getElementById('completed-projects');
        const userRating = document.getElementById('user-rating');

        if (memberSince) memberSince.textContent = this.formatDate(userData.memberSince);
        if (totalProjects) totalProjects.textContent = userData.totalProjects || 0;
        if (completedProjects) completedProjects.textContent = userData.completedProjects || 0;
        if (userRating) userRating.textContent = userData.rating || '5.0';

        // Settings
        const emailNotifications = document.getElementById('email-notifications');
        const smsNotifications = document.getElementById('sms-notifications');

        if (emailNotifications) emailNotifications.checked = userData.settings?.emailNotifications || false;
        if (smsNotifications) smsNotifications.checked = userData.settings?.smsNotifications || false;
    }

    toggleEditMode() {
        this.isEditing = !this.isEditing;
        const formInputs = document.querySelectorAll('#profile-form input, #profile-form textarea');
        const editBtn = document.getElementById('edit-profile-btn');
        const formActions = document.getElementById('form-actions');

        formInputs.forEach(input => {
            if (input.id !== 'email') { // Email shouldn't be editable
                input.disabled = !this.isEditing;
            }
        });

        if (this.isEditing) {
            editBtn.style.display = 'none';
            formActions.classList.remove('hidden');
        } else {
            editBtn.style.display = 'flex';
            formActions.classList.add('hidden');
        }
    }

    cancelEdit() {
        this.isEditing = false;
        this.populateProfile(this.currentUser); // Reset form to original values
        this.toggleEditMode();
    }

    async saveProfile(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const updatedUser = {
            ...this.currentUser,
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            phone: formData.get('phone'),
            location: formData.get('location'),
            bio: formData.get('bio')
        };

        try {
            // Here you would typically send to an API
            // For now, we'll just update localStorage
            localStorage.setItem('bricouli_user', JSON.stringify(updatedUser));
            this.currentUser = updatedUser;
            
            this.populateProfile(updatedUser);
            this.toggleEditMode();
            this.showNotification('Profile updated successfully!', 'success');
        } catch (error) {
            console.error('Error saving profile:', error);
            this.showNotification('Error updating profile', 'error');
        }
    }

    handleAvatarChange(e) {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                this.showNotification('File size must be less than 5MB', 'error');
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                const newAvatar = event.target.result;
                
                // Update avatar displays
                const profileAvatar = document.getElementById('profile-avatar');
                const userAvatar = document.getElementById('user-avatar');
                
                if (profileAvatar) profileAvatar.src = newAvatar;
                if (userAvatar) userAvatar.src = newAvatar;

                // Save to user data
                this.currentUser.avatar = newAvatar;
                localStorage.setItem('bricouli_user', JSON.stringify(this.currentUser));
                
                this.showNotification('Avatar updated successfully!', 'success');
            };
            reader.readAsDataURL(file);
        }
    }

    async changePassword(e) {
        e.preventDefault();
        
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (newPassword !== confirmPassword) {
            this.showNotification('New passwords do not match', 'error');
            return;
        }

        if (newPassword.length < 8) {
            this.showNotification('Password must be at least 8 characters long', 'error');
            return;
        }

        try {
            // Here you would typically verify current password and update via API
            // For demo purposes, we'll just simulate success
            
            const passwordModal = document.getElementById('change-password-modal');
            passwordModal.classList.add('hidden');
            this.resetPasswordForm();
            
            this.showNotification('Password updated successfully!', 'success');
        } catch (error) {
            console.error('Error changing password:', error);
            this.showNotification('Error updating password', 'error');
        }
    }

    resetPasswordForm() {
        const form = document.getElementById('change-password-form');
        if (form) form.reset();
    }

    updateNotificationSettings() {
        const emailNotifications = document.getElementById('email-notifications').checked;
        const smsNotifications = document.getElementById('sms-notifications').checked;

        this.currentUser.settings = {
            ...this.currentUser.settings,
            emailNotifications,
            smsNotifications
        };

        localStorage.setItem('bricouli_user', JSON.stringify(this.currentUser));
        this.showNotification('Notification settings updated', 'success');
    }

    logout() {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('bricouli_user');
            localStorage.removeItem('bricouli_token');
            window.location.href = 'login.html';
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long' 
        });
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
            type === 'success' ? 'bg-green-500 text-white' :
            type === 'error' ? 'bg-red-500 text-white' :
            'bg-blue-500 text-white'
        }`;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.classList.add('opacity-0', 'translate-x-full');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// Initialize the user profile when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new UserProfile();
});

// Export for potential use in other modules
export default UserProfile;
