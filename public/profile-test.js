// Test script for user profile page
// Run this in the browser console to set up test data

function setupTestUser() {
    const testUser = {
        id: 'test-user-123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@test.com',
        phone: '+1 (555) 123-4567',
        location: 'New York, NY',
        bio: 'Test user for profile page development',
        role: 'Client',
        avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=3B82F6&color=fff&size=256',
        memberSince: '2023-01-15',
        totalProjects: 5,
        completedProjects: 3,
        rating: 4.8,
        settings: {
            emailNotifications: true,
            smsNotifications: false
        }
    };

    localStorage.setItem('bricouli_user', JSON.stringify(testUser));
    console.log('✅ Test user data set in localStorage');
    console.log('You can now refresh the profile page to test without authentication');
}

function setupTestUserWithToken() {
    setupTestUser();
    // Set a fake token for testing
    localStorage.setItem('bricouli_token', 'test-token-123456789');
    console.log('✅ Test user data and token set in localStorage');
    console.log('The page will try to make API calls but fall back to localStorage data');
}

function clearTestData() {
    localStorage.removeItem('bricouli_user');
    localStorage.removeItem('bricouli_token');
    console.log('🧹 Test data cleared from localStorage');
}

function checkCurrentData() {
    const token = localStorage.getItem('bricouli_token');
    const user = localStorage.getItem('bricouli_user');
    
    console.log('Current localStorage data:');
    console.log('Token:', token ? 'Present (' + token.length + ' chars)' : 'Not set');
    console.log('User:', user ? 'Present' : 'Not set');
    
    if (user) {
        try {
            const userData = JSON.parse(user);
            console.log('User name:', userData.firstName, userData.lastName);
            console.log('User role:', userData.role);
        } catch (e) {
            console.log('User data is invalid JSON');
        }
    }
}

// Instructions
console.log(`
🧪 Profile Page Testing Commands:

1. setupTestUser() - Sets up test user without token (demo mode)
2. setupTestUserWithToken() - Sets up test user with fake token
3. clearTestData() - Removes all test data
4. checkCurrentData() - Shows current localStorage state

Example usage:
- Run setupTestUser() to test profile page in demo mode
- Run setupTestUserWithToken() to test with fake authentication
- Run clearTestData() to clean up
`);

// Export functions to global scope for console use
window.setupTestUser = setupTestUser;
window.setupTestUserWithToken = setupTestUserWithToken;
window.clearTestData = clearTestData;
window.checkCurrentData = checkCurrentData;
