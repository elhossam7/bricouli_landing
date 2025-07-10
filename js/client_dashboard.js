// Use unpkg for ESM imports
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// IMPORTANT: Replace with your actual Supabase URL and Anon Key if they are different.
const SUPABASE_URL = 'https://wecbjkfyaqorwmvrabjb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlY2Jqa2Z5YXFvcndtdnJhYmpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5OTEyODYsImV4cCI6MjA2NzU2NzI4Nn0.HzfxgDjLQtqlpvH2k-EK9QgGYg7GT0Qifb-2Yh4ObO4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', async () => {
    try {
        let session = null;
        
        // First try to get session from Supabase auth
        const { data: { session: authSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
            console.error('Session error:', sessionError);
        }
        
        if (authSession) {
            session = authSession;
        } else {
            // Fallback: Try to get session from localStorage
            const storedSession = localStorage.getItem('supabase.auth.token');
            if (storedSession) {
                try {
                    const parsedSession = JSON.parse(storedSession);
                    if (parsedSession && parsedSession.access_token) {
                        // Try to set this session in Supabase
                        const { data, error } = await supabase.auth.setSession(parsedSession);
                        if (!error && data.session) {
                            session = data.session;
                        }
                    }
                } catch (parseError) {
                    console.error('Error parsing stored session:', parseError);
                }
            }
        }

        if (!session) {
            console.log('No session found, redirecting to login');
            localStorage.clear(); // Clear any stale session data
            window.location.replace('login.html');
            return;
        }

        // Verify that the user has the correct role for this dashboard
        const userRole = session.user?.user_metadata?.role;
        if (userRole !== 'client') {
            console.error('Invalid role for client dashboard:', userRole);
            window.location.replace('login.html');
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
                                <h3 class="font-semibold text-gray-900 mb-1">${project.title || project.name}</h3>
                                <p class="text-gray-600 text-sm mb-2">${project.description}</p>
                                <div class="flex items-center space-x-4 text-sm text-gray-500">
                                    <span>Posted ${new Date(project.created_at).toLocaleDateString()}</span>
                                    ${project.category ? `<span>• ${project.category}</span>` : ''}
                                    ${project.budget ? `<span>• Budget: ${project.budget}</span>` : ''}
                                </div>
                            </div>
                            <span class="bg-accent-100 text-accent-600 px-3 py-1 rounded-full text-sm font-medium">
                                ${project.status || 'Open'}
                            </span>
                        </div>
                        <div class="flex items-center">
                            <div class="flex items-center space-x-2">
                                ${project.urgency_level ? `<span class="text-xs px-2 py-1 rounded-full bg-primary-100 text-primary-700">${project.urgency_level}</span>` : ''}
                                ${project.skills_required ? `<span class="text-xs text-gray-500">${project.skills_required}</span>` : ''}
                            </div>
                        </div>
                    </div>
                `;
                projectListContainer.insertAdjacentHTML('beforeend', projectCard);
            });
        };

        // Update stats function
        const updateStats = (projects) => {
            if (!projects) return;
            const activeProjects = projects.filter(p => p.status === 'open' || p.status === 'in_progress').length;
            const completedProjects = projects.filter(p => p.status === 'completed').length;

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

        // Project Details Modal Functions
        let currentProjectId = null;

        const openProjectModal = async (projectId) => {
            currentProjectId = projectId;
            const modal = document.getElementById('project-details-modal');
            
            try {
                // Show loading state
                modal.classList.remove('hidden');
                document.getElementById('modal-project-title').textContent = 'Loading...';
                
                // Fetch project details
                const response = await fetch(`http://localhost:5000/api/projects/${projectId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch project details');
                }

                const project = await response.json();
                
                // Populate modal with project data
                document.getElementById('modal-project-title').textContent = project.title || 'Untitled Project';
                document.getElementById('modal-project-description').textContent = project.description || 'No description provided';
                document.getElementById('modal-project-category').textContent = project.category || project.type || 'N/A';
                document.getElementById('modal-project-budget').textContent = project.budget || 'Not specified';
                document.getElementById('modal-project-timeline').textContent = project.timeline || 'Not specified';
                document.getElementById('modal-project-location').textContent = project.location || 'Not specified';
                document.getElementById('modal-project-skills').textContent = project.skills_required || 'No specific skills required';
                document.getElementById('modal-project-requirements').textContent = project.requirements || project.additional_requirements || 'No additional requirements';
                
                // Update status display
                const statusSpan = document.getElementById('modal-project-status');
                const statusSelect = document.getElementById('status-select');
                const status = project.status || 'open';
                
                statusSpan.textContent = status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
                statusSpan.className = `px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`;
                statusSelect.value = status;
                
                // Update dates
                document.getElementById('modal-project-created').textContent = new Date(project.created_at).toLocaleDateString();
                document.getElementById('modal-project-updated').textContent = new Date(project.updated_at).toLocaleDateString();
                
                // Handle photos
                const photoGallery = document.getElementById('photo-gallery');
                if (project.photos && project.photos.length > 0) {
                    photoGallery.innerHTML = project.photos.map(photo => 
                        `<img src="${photo}" alt="Project photo" class="w-full h-20 object-cover rounded-lg border border-gray-200">`
                    ).join('');
                } else {
                    photoGallery.innerHTML = '<p class="text-gray-500 text-sm col-span-2">No photos uploaded</p>';
                }
                
            } catch (error) {
                console.error('Error loading project details:', error);
                alert('Failed to load project details. Please try again.');
                modal.classList.add('hidden');
            }
        };

        const closeProjectModal = () => {
            const modal = document.getElementById('project-details-modal');
            modal.classList.add('hidden');
            currentProjectId = null;
        };

        const updateProjectStatus = async (projectId, newStatus) => {
            try {
                const response = await fetch(`http://localhost:5000/api/projects/${projectId}/status`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ status: newStatus }),
                });

                if (!response.ok) {
                    throw new Error('Failed to update project status');
                }

                // Refresh the project list and modal
                await fetchProjects();
                if (currentProjectId) {
                    await openProjectModal(currentProjectId);
                }
                
                alert('Project status updated successfully!');
                
            } catch (error) {
                console.error('Error updating project status:', error);
                alert('Failed to update project status. Please try again.');
            }
        };

        const getStatusColor = (status) => {
            switch (status) {
                case 'open':
                    return 'bg-blue-100 text-blue-800';
                case 'in_progress':
                    return 'bg-yellow-100 text-yellow-800';
                case 'completed':
                    return 'bg-green-100 text-green-800';
                case 'cancelled':
                    return 'bg-red-100 text-red-800';
                default:
                    return 'bg-gray-100 text-gray-800';
            }
        };

        // Event listeners for modal
        document.getElementById('close-modal')?.addEventListener('click', closeProjectModal);
        document.getElementById('project-details-modal')?.addEventListener('click', (e) => {
            if (e.target.id === 'project-details-modal') {
                closeProjectModal();
            }
        });

        document.getElementById('update-status-btn')?.addEventListener('click', async () => {
            const newStatus = document.getElementById('status-select').value;
            if (currentProjectId && newStatus) {
                await updateProjectStatus(currentProjectId, newStatus);
            }
        });

        // Fetch projects
        fetchProjects();
        
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
                try {
                    const { error } = await supabase.auth.signOut();
                    if (error) {
                        console.error('Error signing out:', error);
                    }
                    // Clear localStorage regardless of signOut result
                    localStorage.clear();
                    window.location.replace('login.html');
                } catch (error) {
                    console.error('Error during logout:', error);
                    // Force logout by clearing storage and redirecting
                    localStorage.clear();
                    window.location.replace('login.html');
                }
            });
        }

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
