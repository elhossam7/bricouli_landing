// Supabase client configuration
const SUPABASE_URL = 'https://mmqxgkzqpgzjyqmvnzlh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tcXhna3pxcGd6anlxbXZuemxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzEyMjkyMjEsImV4cCI6MjA0NjgwNTIyMX0.ZJnYoKdnEcQCXsWmB_1OLdKUkAMOBnrXRgHU7CYVb2s';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Global state
let currentUser = null;
let currentPage = 1;
let currentFilters = {
    query: '',
    status: '',
    dateRange: '',
    sortBy: 'created_at',
    sortOrder: 'desc'
};
let allProjects = [];
let currentView = 'list'; // 'list' or 'grid'

// DOM elements
const elements = {
    // Stats
    totalProjects: document.getElementById('total-projects'),
    activeProjects: document.getElementById('active-projects'),
    completedProjects: document.getElementById('completed-projects'),
    totalBudget: document.getElementById('total-budget'),
    
    // Filters
    searchInput: document.getElementById('search-input'),
    statusFilter: document.getElementById('status-filter'),
    dateFilter: document.getElementById('date-filter'),
    sortFilter: document.getElementById('sort-filter'),
    clearFiltersBtn: document.getElementById('clear-filters'),
    
    // View toggles
    gridViewBtn: document.getElementById('grid-view'),
    listViewBtn: document.getElementById('list-view'),
    
    // Content areas
    loadingState: document.getElementById('loading-state'),
    emptyState: document.getElementById('empty-state'),
    projectsContainer: document.getElementById('projects-container'),
    paginationContainer: document.getElementById('pagination-container'),
    
    // Pagination
    prevPageBtn: document.getElementById('prev-page'),
    nextPageBtn: document.getElementById('next-page'),
    pageNumbers: document.getElementById('page-numbers'),
    showingFrom: document.getElementById('showing-from'),
    showingTo: document.getElementById('showing-to'),
    totalCount: document.getElementById('total-count'),
    
    // User info
    userAvatar: document.getElementById('user-avatar'),
    userName: document.getElementById('user-name'),
    
    // Modal
    projectDetailsModal: document.getElementById('project-details-modal'),
    
    // Export
    exportBtn: document.getElementById('export-btn')
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initializeApp();
    } catch (error) {
        console.error('Error initializing app:', error);
        showError('Failed to initialize the application. Please refresh the page.');
    }
});

// Initialize the application
async function initializeApp() {
    // Check authentication - try both methods
    let session = await supabase.auth.getSession();
    
    if (!session.data.session) {
        // Try to get session from localStorage as fallback
        const storedSession = localStorage.getItem('supabase.auth.token');
        if (storedSession) {
            try {
                const sessionData = JSON.parse(storedSession);
                if (sessionData.access_token) {
                    // Create a fake session object for compatibility
                    session.data.session = {
                        user: sessionData.user,
                        access_token: sessionData.access_token
                    };
                    currentUser = {
                        id: sessionData.user.id,
                        access_token: sessionData.access_token,
                        email: sessionData.user.email,
                        user_metadata: sessionData.user.user_metadata
                    };
                }
            } catch (e) {
                console.error('Error parsing stored session:', e);
            }
        }
    }
    
    if (!session.data.session) {
        // Redirect to login if not authenticated
        window.location.href = 'login.html';
        return;
    }

    if (!currentUser) {
        currentUser = {
            id: session.data.session.user.id,
            access_token: session.data.session.access_token,
            email: session.data.session.user.email,
            user_metadata: session.data.session.user.user_metadata
        };
    }
    
    // Update user info in header
    updateUserInfo();
    
    // Load initial data
    await Promise.all([
        loadProjectStats(),
        loadProjects()
    ]);
    
    // Set up event listeners
    setupEventListeners();
}

// Update user info in header
function updateUserInfo() {
    if (currentUser) {
        const name = currentUser.user_metadata?.full_name || 
                     currentUser.email?.split('@')[0] || 
                     'User';
        elements.userName.textContent = name;
        elements.userAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3B82F6&color=fff&size=128`;
    }
}

// Load project statistics
async function loadProjectStats() {
    try {
        const response = await fetch('http://localhost:5000/api/projects/stats', {
            headers: {
                'Authorization': `Bearer ${currentUser.access_token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const stats = await response.json();
        updateStatsDisplay(stats);
    } catch (error) {
        console.error('Error loading project stats:', error);
        // Show default stats on error
        updateStatsDisplay({
            total: 0,
            active: 0,
            completed: 0,
            totalBudget: 0
        });
    }
}

// Update statistics display
function updateStatsDisplay(stats) {
    elements.totalProjects.textContent = stats.total || 0;
    elements.activeProjects.textContent = stats.active || 0;
    elements.completedProjects.textContent = stats.completed || 0;
    elements.totalBudget.textContent = formatCurrency(stats.totalBudget || 0);
}

// Load projects with current filters
async function loadProjects() {
    showLoadingState();
    
    try {
        const queryParams = new URLSearchParams({
            page: currentPage,
            limit: 10,
            ...currentFilters
        });

        // Handle date range filter
        if (currentFilters.dateRange) {
            const daysAgo = parseInt(currentFilters.dateRange);
            const fromDate = new Date();
            fromDate.setDate(fromDate.getDate() - daysAgo);
            queryParams.set('dateFrom', fromDate.toISOString());
        }

        // Handle sort filter
        if (currentFilters.sortBy) {
            const [sortBy, sortOrder] = currentFilters.sortBy.split(':');
            queryParams.set('sortBy', sortBy);
            queryParams.set('sortOrder', sortOrder || 'desc');
        }

        const response = await fetch(`http://localhost:5000/api/projects/search?${queryParams}`, {
            headers: {
                'Authorization': `Bearer ${currentUser.access_token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        allProjects = data.projects || [];
        
        if (allProjects.length === 0) {
            showEmptyState();
        } else {
            showProjectsState();
            renderProjects(allProjects);
            updatePagination(data.pagination);
        }
    } catch (error) {
        console.error('Error loading projects:', error);
        showError('Failed to load projects. Please try again.');
        showEmptyState();
    }
}

// Show different states
function showLoadingState() {
    elements.loadingState.classList.remove('hidden');
    elements.emptyState.classList.add('hidden');
    elements.projectsContainer.classList.add('hidden');
    elements.paginationContainer.classList.add('hidden');
}

function showEmptyState() {
    elements.loadingState.classList.add('hidden');
    elements.emptyState.classList.remove('hidden');
    elements.projectsContainer.classList.add('hidden');
    elements.paginationContainer.classList.add('hidden');
}

function showProjectsState() {
    elements.loadingState.classList.add('hidden');
    elements.emptyState.classList.add('hidden');
    elements.projectsContainer.classList.remove('hidden');
    elements.paginationContainer.classList.remove('hidden');
}

// Render projects based on current view
function renderProjects(projects) {
    if (currentView === 'grid') {
        renderProjectsGrid(projects);
    } else {
        renderProjectsList(projects);
    }
}

// Render projects in list view
function renderProjectsList(projects) {
    const html = projects.map(project => `
        <div class="border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors">
            <div class="p-6">
                <div class="flex items-center justify-between">
                    <div class="flex-1">
                        <div class="flex items-center space-x-3">
                            <h3 class="text-lg font-semibold text-gray-900 cursor-pointer hover:text-primary" 
                                onclick="showProjectDetails('${project.id}')">
                                ${escapeHtml(project.title)}
                            </h3>
                            <span class="px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(project.status)}">
                                ${formatStatus(project.status)}
                            </span>
                        </div>
                        <p class="text-gray-600 mt-1 line-clamp-2">${escapeHtml(project.description)}</p>
                        <div class="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                            <span>📅 ${formatDate(project.created_at)}</span>
                            ${project.budget ? `<span>💰 ${project.budget}</span>` : ''}
                            ${project.location ? `<span>📍 ${escapeHtml(project.location)}</span>` : ''}
                        </div>
                    </div>
                    <div class="flex items-center space-x-2">
                        <button onclick="editProject('${project.id}')" 
                                class="p-2 text-gray-400 hover:text-primary rounded-lg hover:bg-gray-100">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                            </svg>
                        </button>
                        <button onclick="deleteProject('${project.id}')" 
                                class="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    elements.projectsContainer.innerHTML = html;
}

// Render projects in grid view
function renderProjectsGrid(projects) {
    const html = `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            ${projects.map(project => `
                <div class="border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                    <div class="p-6">
                        <div class="flex items-center justify-between mb-3">
                            <span class="px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(project.status)}">
                                ${formatStatus(project.status)}
                            </span>
                            <div class="flex items-center space-x-1">
                                <button onclick="editProject('${project.id}')" 
                                        class="p-1 text-gray-400 hover:text-primary rounded">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                                    </svg>
                                </button>
                                <button onclick="deleteProject('${project.id}')" 
                                        class="p-1 text-gray-400 hover:text-red-500 rounded">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <h3 class="text-lg font-semibold text-gray-900 mb-2 cursor-pointer hover:text-primary" 
                            onclick="showProjectDetails('${project.id}')">
                            ${escapeHtml(project.title)}
                        </h3>
                        <p class="text-gray-600 text-sm mb-4 line-clamp-3">${escapeHtml(project.description)}</p>
                        <div class="space-y-2 text-sm text-gray-500">
                            <div>📅 ${formatDate(project.created_at)}</div>
                            ${project.budget ? `<div>💰 ${project.budget}</div>` : ''}
                            ${project.location ? `<div>📍 ${escapeHtml(project.location)}</div>` : ''}
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    elements.projectsContainer.innerHTML = html;
}

// Update pagination
function updatePagination(pagination) {
    if (!pagination || pagination.total === 0) {
        elements.paginationContainer.classList.add('hidden');
        return;
    }

    const { page, limit, total, pages } = pagination;
    const from = (page - 1) * limit + 1;
    const to = Math.min(page * limit, total);

    elements.showingFrom.textContent = from;
    elements.showingTo.textContent = to;
    elements.totalCount.textContent = total;

    // Update page buttons
    elements.prevPageBtn.disabled = page <= 1;
    elements.nextPageBtn.disabled = page >= pages;

    // Generate page numbers
    const pageNumbersHtml = generatePageNumbers(page, pages);
    elements.pageNumbers.innerHTML = pageNumbersHtml;
}

// Generate page numbers for pagination
function generatePageNumbers(currentPage, totalPages) {
    const pages = [];
    const maxVisible = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage + 1 < maxVisible) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        pages.push(`
            <button onclick="goToPage(${i})" 
                    class="px-3 py-2 text-sm font-medium rounded-md ${
                        i === currentPage 
                            ? 'bg-primary text-white' 
                            : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                    }">
                ${i}
            </button>
        `);
    }
    
    return pages.join('');
}

// Project management functions
async function showProjectDetails(projectId) {
    try {
        const response = await fetch(`http://localhost:5000/api/projects/${projectId}`, {
            headers: {
                'Authorization': `Bearer ${currentUser.access_token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const project = await response.json();
        renderProjectDetailsModal(project);
    } catch (error) {
        console.error('Error loading project details:', error);
        showError('Failed to load project details.');
    }
}

// Render project details modal
function renderProjectDetailsModal(project) {
    const modalHtml = `
        <div class="p-6">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-2xl font-bold text-gray-900">${escapeHtml(project.title)}</h2>
                <button onclick="closeProjectDetailsModal()" class="text-gray-400 hover:text-gray-600">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="md:col-span-2">
                    <div class="mb-6">
                        <h3 class="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                        <p class="text-gray-600">${escapeHtml(project.description)}</p>
                    </div>

                    ${project.requirements ? `
                        <div class="mb-6">
                            <h3 class="text-lg font-semibold text-gray-900 mb-2">Additional Requirements</h3>
                            <p class="text-gray-600">${escapeHtml(project.requirements)}</p>
                        </div>
                    ` : ''}
                </div>

                <div class="space-y-4">
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <h3 class="font-semibold text-gray-900 mb-3">Project Details</h3>
                        <div class="space-y-2 text-sm">
                            <div class="flex justify-between">
                                <span class="text-gray-600">Status:</span>
                                <span class="px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(project.status)}">
                                    ${formatStatus(project.status)}
                                </span>
                            </div>
                            ${project.budget ? `
                                <div class="flex justify-between">
                                    <span class="text-gray-600">Budget:</span>
                                    <span class="font-medium">${project.budget}</span>
                                </div>
                            ` : ''}
                            ${project.timeline ? `
                                <div class="flex justify-between">
                                    <span class="text-gray-600">Timeline:</span>
                                    <span class="font-medium">${escapeHtml(project.timeline)}</span>
                                </div>
                            ` : ''}
                            ${project.location ? `
                                <div class="flex justify-between">
                                    <span class="text-gray-600">Location:</span>
                                    <span class="font-medium">${escapeHtml(project.location)}</span>
                                </div>
                            ` : ''}
                            <div class="flex justify-between">
                                <span class="text-gray-600">Created:</span>
                                <span class="font-medium">${formatDate(project.created_at)}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Updated:</span>
                                <span class="font-medium">${formatDate(project.updated_at)}</span>
                            </div>
                        </div>
                    </div>

                    <div class="space-y-2">
                        <h3 class="font-semibold text-gray-900">Actions</h3>
                        <div class="space-y-2">
                            <button onclick="editProject('${project.id}')" 
                                    class="w-full btn-outline text-left">
                                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                                </svg>
                                Edit Project
                            </button>
                            <button onclick="updateProjectStatus('${project.id}', '${getNextStatus(project.status)}')" 
                                    class="w-full btn-primary">
                                ${getStatusActionText(project.status)}
                            </button>
                            <button onclick="deleteProject('${project.id}')" 
                                    class="w-full text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 px-4 py-2 rounded-lg text-sm font-medium">
                                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                </svg>
                                Delete Project
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    elements.projectDetailsModal.querySelector('.bg-white').innerHTML = modalHtml;
    elements.projectDetailsModal.classList.remove('hidden');
}

// Close project details modal
function closeProjectDetailsModal() {
    elements.projectDetailsModal.classList.add('hidden');
}

// Update project status
async function updateProjectStatus(projectId, newStatus) {
    try {
        const response = await fetch(`http://localhost:5000/api/projects/${projectId}/status`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${currentUser.access_token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        closeProjectDetailsModal();
        await loadProjects();
        await loadProjectStats();
        showSuccess('Project status updated successfully!');
    } catch (error) {
        console.error('Error updating project status:', error);
        showError('Failed to update project status.');
    }
}

// Edit project (redirect to editing page)
function editProject(projectId) {
    window.location.href = `job_posting_creation.html?edit=${projectId}`;
}

// Delete project
async function deleteProject(projectId) {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await fetch(`http://localhost:5000/api/projects/${projectId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${currentUser.access_token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        closeProjectDetailsModal();
        await loadProjects();
        await loadProjectStats();
        showSuccess('Project deleted successfully!');
    } catch (error) {
        console.error('Error deleting project:', error);
        showError('Failed to delete project.');
    }
}

// Export projects
async function exportProjects() {
    try {
        // Get all projects for export
        const response = await fetch('http://localhost:5000/api/projects', {
            headers: {
                'Authorization': `Bearer ${currentUser.access_token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const projects = await response.json();
        const csv = convertToCSV(projects);
        downloadCSV(csv, 'my-projects.csv');
    } catch (error) {
        console.error('Error exporting projects:', error);
        showError('Failed to export projects.');
    }
}

// Convert projects to CSV
function convertToCSV(projects) {
    const headers = ['Title', 'Description', 'Status', 'Budget', 'Location', 'Timeline', 'Created', 'Updated'];
    const rows = projects.map(project => [
        project.title,
        project.description,
        project.status,
        project.budget || '',
        project.location || '',
        project.timeline || '',
        formatDate(project.created_at),
        formatDate(project.updated_at)
    ]);

    const csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${field.replace(/"/g, '""')}"`).join(','))
        .join('\n');

    return csvContent;
}

// Download CSV file
function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Event listeners setup
function setupEventListeners() {
    // Search and filters
    elements.searchInput.addEventListener('input', debounce(handleSearch, 300));
    elements.statusFilter.addEventListener('change', handleStatusFilter);
    elements.dateFilter.addEventListener('change', handleDateFilter);
    elements.sortFilter.addEventListener('change', handleSortFilter);
    elements.clearFiltersBtn.addEventListener('click', clearAllFilters);

    // View toggles
    elements.gridViewBtn.addEventListener('click', () => switchView('grid'));
    elements.listViewBtn.addEventListener('click', () => switchView('list'));

    // Pagination
    elements.prevPageBtn.addEventListener('click', () => goToPage(currentPage - 1));
    elements.nextPageBtn.addEventListener('click', () => goToPage(currentPage + 1));

    // Export
    elements.exportBtn.addEventListener('click', exportProjects);

    // Modal close on background click
    elements.projectDetailsModal.addEventListener('click', (e) => {
        if (e.target === elements.projectDetailsModal) {
            closeProjectDetailsModal();
        }
    });
}

// Event handlers
function handleSearch(e) {
    currentFilters.query = e.target.value.trim();
    currentPage = 1;
    loadProjects();
}

function handleStatusFilter(e) {
    currentFilters.status = e.target.value;
    currentPage = 1;
    loadProjects();
}

function handleDateFilter(e) {
    currentFilters.dateRange = e.target.value;
    currentPage = 1;
    loadProjects();
}

function handleSortFilter(e) {
    currentFilters.sortBy = e.target.value;
    currentPage = 1;
    loadProjects();
}

function clearAllFilters() {
    currentFilters = {
        query: '',
        status: '',
        dateRange: '',
        sortBy: 'created_at:desc'
    };
    currentPage = 1;
    
    // Reset form elements
    elements.searchInput.value = '';
    elements.statusFilter.value = '';
    elements.dateFilter.value = '';
    elements.sortFilter.value = 'created_at:desc';
    
    loadProjects();
}

function switchView(view) {
    currentView = view;
    
    // Update button states
    if (view === 'grid') {
        elements.gridViewBtn.classList.add('text-primary', 'border-primary');
        elements.gridViewBtn.classList.remove('text-gray-400');
        elements.listViewBtn.classList.remove('text-primary', 'border-primary');
        elements.listViewBtn.classList.add('text-gray-400');
    } else {
        elements.listViewBtn.classList.add('text-primary', 'border-primary');
        elements.listViewBtn.classList.remove('text-gray-400');
        elements.gridViewBtn.classList.remove('text-primary', 'border-primary');
        elements.gridViewBtn.classList.add('text-gray-400');
    }
    
    // Re-render projects
    renderProjects(allProjects);
}

function goToPage(page) {
    currentPage = page;
    loadProjects();
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatStatus(status) {
    const statusMap = {
        'open': 'Open',
        'in_progress': 'In Progress',
        'completed': 'Completed',
        'cancelled': 'Cancelled',
        'draft': 'Draft'
    };
    return statusMap[status] || status;
}

function getStatusBadgeClass(status) {
    const classMap = {
        'open': 'bg-blue-100 text-blue-800',
        'in_progress': 'bg-yellow-100 text-yellow-800',
        'completed': 'bg-green-100 text-green-800',
        'cancelled': 'bg-red-100 text-red-800',
        'draft': 'bg-gray-100 text-gray-800'
    };
    return classMap[status] || 'bg-gray-100 text-gray-800';
}

function getNextStatus(currentStatus) {
    const statusFlow = {
        'open': 'in_progress',
        'in_progress': 'completed',
        'completed': 'open',
        'cancelled': 'open',
        'draft': 'open'
    };
    return statusFlow[currentStatus] || 'open';
}

function getStatusActionText(status) {
    const actionMap = {
        'open': 'Mark In Progress',
        'in_progress': 'Mark Completed',
        'completed': 'Reopen Project',
        'cancelled': 'Reopen Project',
        'draft': 'Publish Project'
    };
    return actionMap[status] || 'Update Status';
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function showSuccess(message) {
    // Create a better success notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function showError(message) {
    // Create a better error notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Make functions available globally for onclick handlers
window.showProjectDetails = showProjectDetails;
window.closeProjectDetailsModal = closeProjectDetailsModal;
window.updateProjectStatus = updateProjectStatus;
window.editProject = editProject;
window.deleteProject = deleteProject;
window.goToPage = goToPage;
