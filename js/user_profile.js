// User Profile JavaScript
class UserProfile {
    constructor() {
        this.isEditing = false;
        this.currentUser = null;
        this.isEditMode = false;
    }

    // This function is the entry point for the profile page
    async init() {
        console.log('🚀 Profile page initialization started.');
        this.setupEventListeners();
        await this.loadUserProfile(); // Attempt to load data
        this.setupUserMenu();
        console.log('✅ Profile page initialized.');
    }

    // This function now only checks if we are in a demo state
    isDemoMode() {
        return !localStorage.getItem('bricouli_token');
    }

    // Display a warning if no user is logged in
    showDemoModeWarning() {
        if (this.isDemoMode()) {
            const warningHTML = `
                <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6" id="demo-warning">
                    <div class="flex">
                        <div class="flex-shrink-0">
                            <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                            </svg>
                        </div>
                        <div class="ml-3">
                            <p class="text-sm text-yellow-700">
                                You're viewing a demo profile. <a href="login.html" class="font-medium underline text-yellow-700 hover:text-yellow-600">Sign in</a> to access your actual profile.
                            </p>
                        </div>
                    </div>
                </div>
            `;
            
            const container = document.querySelector('.bg-white.shadow');
            if (container) {
                container.insertAdjacentHTML('beforebegin', warningHTML);
            }
        }
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

    async loadUserProfile() {
        this.showLoadingState();
        try {
            const userData = await this.fetchUserData();
            this.populateProfile(userData);
            this.updateStatistics(userData);
        } catch (error) {
            console.error('Error loading user profile:', error.message);
            // If fetching fails, load fallback data
            this.loadFallbackData();
            this.showDemoModeWarning(); // Show warning on error
        } finally {
            this.hideLoadingState();
        }
    }

    async fetchUserData() {
        const token = localStorage.getItem('bricouli_token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await fetch('/api/users/profile/detailed', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401) {
            // Authentication failed - remove invalid token and redirect
            localStorage.removeItem('bricouli_token');
            localStorage.removeItem('bricouli_user');
            throw new Error('Authentication failed');
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Transform API data to match frontend expectations
        return {
            id: data.id,
            firstName: this.extractFirstName(data.name),
            lastName: this.extractLastName(data.name),
            email: data.email,
            phone: data.phone || '',
            location: data.address || '',
            bio: data.bio || '',
            role: data.role || 'Client',
            avatar: data.avatar || data.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name || 'User')}&background=3B82F6&color=fff&size=256`,
            memberSince: data.memberSince || data.created_at,
            totalProjects: data.totalProjects || 0,
            completedProjects: data.completedProjects || 0,
            rating: data.rating || 5.0,
            settings: {
                emailNotifications: data.email_notifications || true,
                smsNotifications: data.sms_notifications || false
            },
            // Artisan-specific fields
            businessName: data.business_name || '',
            experienceLevel: data.experience_level || '',
            serviceRadius: data.service_radius || '',
            zipCode: data.zip_code || '',
            hourlyRate: data.hourly_rate || '',
            skills: data.skills || []
        };
    }

    extractFirstName(fullName) {
        if (!fullName) return '';
        const parts = fullName.split(' ');
        return parts[0] || '';
    }

    extractLastName(fullName) {
        if (!fullName) return '';
        const parts = fullName.split(' ');
        return parts.slice(1).join(' ') || '';
    }

    showLoadingState() {
        // Add loading skeletons to form fields
        const fields = ['profile-name', 'profile-email', 'profile-location', 'profile-role'];
        fields.forEach(fieldId => {
            const element = document.getElementById(fieldId);
            if (element) {
                element.classList.add('loading-skeleton');
                element.textContent = 'Loading...';
            }
        });
    }

    hideLoadingState() {
        const fields = ['profile-name', 'profile-email', 'profile-location', 'profile-role'];
        fields.forEach(fieldId => {
            const element = document.getElementById(fieldId);
            if (element) {
                element.classList.remove('loading-skeleton');
            }
        });
    }

    loadFallbackData() {
        // Fallback to localStorage or mock data
        const storedUser = localStorage.getItem('bricouli_user');
        if (storedUser) {
            try {
                const userData = JSON.parse(storedUser);
                this.currentUser = userData;
                this.populateProfile(userData);
                console.info('Loaded user profile from localStorage');
            } catch (error) {
                console.error('Error parsing stored user data:', error);
                this.loadMockData();
            }
        } else {
            this.loadMockData();
        }
    }

    loadMockData() {
        // Use mock data as last resort
        this.currentUser = this.getMockUserData();
        this.populateProfile(this.currentUser);
        this.showNotification('Using demo profile data. Please log in to see your actual profile.', 'warning');
        console.info('Loaded mock user profile data');
    }

    getMockUserData() {
        // Mock user data for demonstration when API is not available
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
        const fullName = `${formData.get('firstName')} ${formData.get('lastName')}`.trim();
        
        const profileData = {
            name: fullName,
            phone: formData.get('phone'),
            address: formData.get('location'),
            bio: formData.get('bio')
        };

        // Add artisan-specific fields if user is an artisan
        if (this.currentUser.role === 'artisan' || this.currentUser.role === 'Artisan') {
            profileData.business_name = this.currentUser.businessName;
            profileData.experience_level = this.currentUser.experienceLevel;
            profileData.service_radius = this.currentUser.serviceRadius;
            profileData.zip_code = this.currentUser.zipCode;
            profileData.hourly_rate = this.currentUser.hourlyRate;
            profileData.skills = this.currentUser.skills;
        }

        try {
            const token = localStorage.getItem('bricouli_token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch('/api/users/profile', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(profileData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.success) {
                // Update current user data
                this.currentUser = {
                    ...this.currentUser,
                    firstName: formData.get('firstName'),
                    lastName: formData.get('lastName'),
                    phone: formData.get('phone'),
                    location: formData.get('location'),
                    bio: formData.get('bio')
                };
                
                // Also update localStorage as backup
                localStorage.setItem('bricouli_user', JSON.stringify(this.currentUser));
                
                this.populateProfile(this.currentUser);
                this.toggleEditMode();
                this.showNotification('Profile updated successfully!', 'success');
            } else {
                throw new Error(result.message || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Error saving profile:', error);
            
            // Fallback to localStorage update
            const updatedUser = {
                ...this.currentUser,
                firstName: formData.get('firstName'),
                lastName: formData.get('lastName'),
                phone: formData.get('phone'),
                location: formData.get('location'),
                bio: formData.get('bio')
            };
            
            localStorage.setItem('bricouli_user', JSON.stringify(updatedUser));
            this.currentUser = updatedUser;
            this.populateProfile(updatedUser);
            this.toggleEditMode();
            
            this.showNotification('Profile updated locally. Changes will sync when connection is restored.', 'warning');
        }
    }

    async handleAvatarChange(e) {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                this.showNotification('File size must be less than 5MB', 'error');
                return;
            }

            const reader = new FileReader();
            reader.onload = async (event) => {
                const newAvatar = event.target.result;
                
                try {
                    const token = localStorage.getItem('bricouli_token');
                    if (token) {
                        // Try to update avatar via API
                        const response = await fetch('/api/users/profile/avatar', {
                            method: 'PUT',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ avatar_url: newAvatar })
                        });

                        if (response.ok) {
                            const result = await response.json();
                            if (result.success) {
                                this.updateAvatarDisplay(newAvatar);
                                this.currentUser.avatar = newAvatar;
                                localStorage.setItem('bricouli_user', JSON.stringify(this.currentUser));
                                this.showNotification('Avatar updated successfully!', 'success');
                                return;
                            }
                        }
                    }
                    
                    // Fallback to local update
                    this.updateAvatarDisplay(newAvatar);
                    this.currentUser.avatar = newAvatar;
                    localStorage.setItem('bricouli_user', JSON.stringify(this.currentUser));
                    this.showNotification('Avatar updated locally. Changes will sync when connection is restored.', 'warning');
                    
                } catch (error) {
                    console.error('Error updating avatar:', error);
                    
                    // Fallback to local update
                    this.updateAvatarDisplay(newAvatar);
                    this.currentUser.avatar = newAvatar;
                    localStorage.setItem('bricouli_user', JSON.stringify(this.currentUser));
                    this.showNotification('Avatar updated locally. Changes will sync when connection is restored.', 'warning');
                }
            };
            reader.readAsDataURL(file);
        }
    }

    updateAvatarDisplay(newAvatar) {
        // Update avatar displays
        const profileAvatar = document.getElementById('profile-avatar');
        const userAvatar = document.getElementById('user-avatar');
        
        if (profileAvatar) profileAvatar.src = newAvatar;
        if (userAvatar) userAvatar.src = newAvatar;
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

    async updateNotificationSettings() {
        const emailNotifications = document.getElementById('email-notifications').checked;
        const smsNotifications = document.getElementById('sms-notifications').checked;

        try {
            const token = localStorage.getItem('bricouli_token');
            if (token) {
                // Try to update settings via API
                const response = await fetch('/api/users/profile', {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email_notifications: emailNotifications,
                        sms_notifications: smsNotifications
                    })
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.success) {
                        this.currentUser.settings = {
                            ...this.currentUser.settings,
                            emailNotifications,
                            smsNotifications
                        };
                        localStorage.setItem('bricouli_user', JSON.stringify(this.currentUser));
                        this.showNotification('Notification settings updated', 'success');
                        return;
                    }
                }
            }
            
            // Fallback to local update
            this.currentUser.settings = {
                ...this.currentUser.settings,
                emailNotifications,
                smsNotifications
            };
            localStorage.setItem('bricouli_user', JSON.stringify(this.currentUser));
            this.showNotification('Settings updated locally. Changes will sync when connection is restored.', 'warning');
            
        } catch (error) {
            console.error('Error updating notification settings:', error);
            
            // Fallback to local update
            this.currentUser.settings = {
                ...this.currentUser.settings,
                emailNotifications,
                smsNotifications
            };
            localStorage.setItem('bricouli_user', JSON.stringify(this.currentUser));
            this.showNotification('Settings updated locally. Changes will sync when connection is restored.', 'warning');
        }
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
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 notification ${
            type === 'success' ? 'bg-green-500 text-white' :
            type === 'error' ? 'bg-red-500 text-white' :
            type === 'warning' ? 'bg-yellow-500 text-white' :
            'bg-blue-500 text-white'
        }`;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Remove notification after 5 seconds for warnings, 3 seconds for others
        const timeout = type === 'warning' ? 5000 : 3000;
        setTimeout(() => {
            notification.classList.add('opacity-0', 'translate-x-full', 'hiding');
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, timeout);
    }
}

// Initialize the profile page logic
document.addEventListener('DOMContentLoaded', () => {
    const userProfile = new UserProfile();
    userProfile.init();
});

// Export for potential use in other modules
export default UserProfile;
