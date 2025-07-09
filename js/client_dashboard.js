import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// IMPORTANT: Replace with your actual Supabase URL and Anon Key if they are different.
const SUPABASE_URL = 'https://bhrihossaqchglegkjes.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJocmlob3NzYXFjaGdsZWdramVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAyMTAxMjYsImV4cCI6MjAzNTc4NjEyNn0.oHq__z0B3Q2aA4u-e222u2Wq02a_h_Hk5sXy-Y_2Z-E';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
            console.error('Session error:', sessionError);
            window.location.href = 'login.html';
            return;
        }

        if (!session) {
            console.log('No session found, redirecting to login');
            window.location.href = 'login.html';
            return;
        }

        console.log('Session found:', session);
        const token = session.access_token;
        const user = session.user;

        // Debug: Log the complete user object
        console.log('Complete user object:', JSON.stringify(user, null, 2));

        // Fetch user profile from the profiles table
        const fetchUserProfile = async () => {
            try {
                console.log('Fetching user profile for ID:', user.id);
                
                // First try direct Supabase query
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('name, role')
                    .eq('id', user.id)
                    .single();
                
                if (error) {
                    console.error('Error fetching profile from Supabase:', error);
                    
                    // Fallback to backend API
                    try {
                        console.log('Attempting to fetch profile from backend API');
                        const response = await fetch('http://localhost:5000/api/users/profile', {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                            },
                        });
                        
                        if (response.ok) {
                            const profileData = await response.json();
                            console.log('Profile data from backend API:', profileData);
                            return profileData;
                        } else {
                            console.error('Backend API error:', await response.text());
                        }
                    } catch (apiError) {
                        console.error('Backend API exception:', apiError);
                    }
                    
                    return null;
                }
                
                console.log('Profile data from Supabase:', profile);
                return profile;
            } catch (error) {
                console.error('Error in fetchUserProfile:', error);
                return null;
            }
        };

        // Update user info function
        async function updateUserInfo(user) {
            // Get user name from profile, metadata, email, or default
            let userName = user.email ? user.email.split('@')[0] : 'User'; // fallback immediately
            let profile = null;
            try {
                profile = await fetchUserProfile();
            } catch (e) {
                console.error('Profile fetch failed:', e);
            }
            if (profile && profile.name) {
                userName = profile.name;
            } else if (user.user_metadata?.name) {
                userName = user.user_metadata.name;
            } else if (user.user_metadata?.full_name) {
                userName = user.user_metadata.full_name;
            } else if (user.user_metadata?.display_name) {
                userName = user.user_metadata.display_name;
            }
            // Update user name in header
            const userNameHeader = document.getElementById('user-name-header');
            if (userNameHeader) {
                userNameHeader.textContent = userName;
                userNameHeader.classList.remove('hidden');
                userNameHeader.classList.add('block');
            }
            // Update welcome message
            const welcomeMessage = document.getElementById('welcome-message');
            if (welcomeMessage) {
                welcomeMessage.textContent = `Welcome back, ${userName}! 👋`;
            }
            // Update user avatar
            const userAvatar = document.getElementById('user-avatar');
            if (userAvatar) {
                if (user.user_metadata?.avatar_url) {
                    userAvatar.src = user.user_metadata.avatar_url;
                } else {
                    userAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=3B82F6&color=fff&size=128`;
                    userAvatar.alt = `${userName}'s avatar`;
                }
            }
        }

        // Update project list function
        const updateProjectList = (projects) => {
            const projectListContainer = document.querySelector('#active-projects-list');
            if (!projectListContainer) return;

            projectListContainer.innerHTML = ''; // Clear existing content

            if (!projects || projects.length === 0) {
                projectListContainer.innerHTML = '<div class="bg-white rounded-lg border border-gray-200 p-6"><p class="text-gray-600 text-center">No active projects found. Post one to get started!</p></div>';
                return;
            }

            projects.forEach(project => {
                const projectCard = `
                    <div class="bg-white rounded-lg border border-gray-200 p-6">
                        <div class="flex items-start justify-between mb-4">
                            <div class="flex-1">
                                <h3 class="font-semibold text-gray-900 mb-1">${project.name}</h3>
                                <p class="text-gray-600 text-sm mb-2">${project.description}</p>
                                <div class="flex items-center space-x-4 text-sm text-gray-500">
                                    <span>Posted ${new Date(project.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <span class="bg-accent-100 text-accent-600 px-3 py-1 rounded-full text-sm font-medium">
                                ${project.status || 'New'}
                            </span>
                        </div>
                        <div class="flex items-center justify-between">
                            <div class="flex items-center space-x-2">
                                <!-- Artisan info can be added here later -->
                            </div>
                            <button class="btn-outline text-sm px-4 py-2">View Details</button>
                        </div>
                    </div>
                `;
                projectListContainer.insertAdjacentHTML('beforeend', projectCard);
            });
        };

        // Update stats function
        const updateStats = (projects) => {
            if (!projects) return;
            const activeProjects = projects.filter(p => p.status !== 'Completed').length;
            const completedProjects = projects.filter(p => p.status === 'Completed').length;

            const activeProjectsEl = document.getElementById('active-projects-count');
            const completedProjectsEl = document.getElementById('completed-projects-count');

            if(activeProjectsEl) activeProjectsEl.textContent = activeProjects;
            if(completedProjectsEl) completedProjectsEl.textContent = completedProjects;
            
            // For saved artisans, we can set it to 0 for now since we don't have this data
            const savedArtisansEl = document.getElementById('saved-artisans-count');
            if(savedArtisansEl) savedArtisansEl.textContent = '0';
        };

        // Fetch projects function
        const fetchProjects = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/projects', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const projects = await response.json();
                updateProjectList(projects);
                updateStats(projects);

            } catch (error) {
                console.error('Error fetching projects:', error.message);
                // Show empty state when no projects are found
                updateProjectList([]);
                updateStats([]);
            }
        };

        // Update user info in the UI
        await updateUserInfo(user);
        
        // Also try to update after a short delay in case of timing issues
        setTimeout(async () => {
            await updateUserInfo(user);
        }, 500);

        // User menu functionality
        const userMenuButton = document.getElementById('user-menu-button');
        const userMenuDropdown = document.getElementById('user-menu-dropdown');
        const logoutButton = document.getElementById('logout-button');

        if (userMenuButton && userMenuDropdown) {
            userMenuButton.addEventListener('click', () => {
                userMenuDropdown.classList.toggle('hidden');
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', (event) => {
                if (!userMenuButton.contains(event.target) && !userMenuDropdown.contains(event.target)) {
                    userMenuDropdown.classList.add('hidden');
                }
            });
        }

        if (logoutButton) {
            logoutButton.addEventListener('click', async (e) => {
                e.preventDefault();
                const { error } = await supabase.auth.signOut();
                if (error) {
                    console.error('Error signing out:', error);
                } else {
                    window.location.href = 'login.html';
                }
            });
        }

        // Fetch projects
        fetchProjects();
        
        // Test DOM elements availability
        console.log('Testing DOM elements:');
        console.log('user-name-header exists:', !!document.getElementById('user-name-header'));
        console.log('welcome-message exists:', !!document.getElementById('welcome-message'));
        console.log('user-avatar exists:', !!document.getElementById('user-avatar'));
        
    } catch (error) {
        console.error('Error in DOMContentLoaded:', error);
        window.location.href = 'login.html';
    }
});
