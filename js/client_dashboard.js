import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// IMPORTANT: Replace with your actual Supabase URL and Anon Key if they are different.
const SUPABASE_URL = 'https://bhrihossaqchglegkjes.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJocmlob3NzYXFjaGdsZWdramVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjAyMTAxMjYsImV4cCI6MjAzNTc4NjEyNn0.oHq__z0B3Q2aA4u-e222u2Wq02a_h_Hk5sXy-Y_2Z-E';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
        console.error('Error getting session:', sessionError);
        // If no session, redirect to login
        window.location.href = 'login.html';
        return;
    }

    const token = session.access_token;

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
        }
    };

    const updateProjectList = (projects) => {
        const projectListContainer = document.querySelector('#active-projects-list');
        if (!projectListContainer) return;

        projectListContainer.innerHTML = ''; // Clear existing static projects

        if (!projects || projects.length === 0) {
            projectListContainer.innerHTML = '<p class="text-gray-600 p-6 bg-white rounded-lg border border-gray-200">No active projects found. Post one to get started!</p>';
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

    const updateStats = (projects) => {
        if (!projects) return;
        const activeProjects = projects.filter(p => p.status !== 'Completed').length;
        const completedProjects = projects.filter(p => p.status === 'Completed').length;

        const activeProjectsEl = document.querySelector('#active-projects-count');
        const completedProjectsEl = document.querySelector('#completed-projects-count');

        if(activeProjectsEl) activeProjectsEl.textContent = activeProjects;
        if(completedProjectsEl) completedProjectsEl.textContent = completedProjects;
    };

    fetchProjects();
});
