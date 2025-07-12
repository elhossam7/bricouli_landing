import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
// IMPORTANT: Replace with your actual Supabase credentials if different
const SUPABASE_URL = 'https://wecbjkfyaqorwmvrabjb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlY2Jqa2Z5YXFvcndtdnJhYmpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5OTEyODYsImV4cCI6MjA2NzU2NzI4Nn0.HzfxgDjLQtqlpvH2k-EK9QgGYg7GT0Qifb-2Yh4ObO4';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', async () => {
    const userMenuButton = document.getElementById('user-menu-button');
    const userMenuDropdown = document.getElementById('user-menu-dropdown');
    const logoutButton = document.getElementById('logout-button');
    const userNameHeader = document.getElementById('user-name-header');
    const userAvatar = document.getElementById('user-avatar');

    const searchButton = document.getElementById('search-button');
    const searchQuery = document.getElementById('search-query');
    const categoryFilter = document.getElementById('category-filter');
    const artisanResults = document.getElementById('artisan-results');
    const resultsCount = document.getElementById('results-count');

    let allArtisans = []; // To store fetched artisans
    let searchDebounceTimer; // Timer for debounced search

    // Retrieve authenticated session from Supabase
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) console.error('Supabase session error:', sessionError);
    const user = session?.user || null;
    const token = session?.access_token;

    // Populate user info in header if elements exist
    if (userNameHeader) {
        // Use metadata name or email prefix
        const displayName = user?.user_metadata?.name || (user?.email?.split('@')[0]) || 'User';
        userNameHeader.textContent = displayName;
        userNameHeader.classList.remove('hidden');
    }
    if (userAvatar) {
        userAvatar.src = user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userNameHeader?.textContent || 'User')}&background=3B82F6&color=fff&size=128`;
    }

    // User menu toggle
    if (userMenuButton && userMenuDropdown) {
        userMenuButton.addEventListener('click', (e) => {
            e.stopPropagation();
            userMenuDropdown.classList.toggle('hidden');
        });
    }

    // Logout
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'login.html';
        });
    }

    // Show loading spinner/message
    function showLoading() {
        artisanResults.innerHTML = '<p class="text-gray-600 col-span-full text-center">Loading artisans...</p>';
        resultsCount.textContent = '';
    }

    // Fetch artisans from the backend
    async function fetchArtisans() {
        // Mock data for testing
        allArtisans = [
            { name: 'John Doe', business_name: 'Doe Plumbing', skills: ['Plumbing','Installation'], zip_code: '10001', hourly_rate: 75, rating: 4.5 },
            { name: 'Jane Smith', business_name: 'Smith Electrical', skills: ['Electrical','Wiring'], zip_code: '10002', hourly_rate: 65, rating: 4.7 },
            { name: 'Mike Johnson', business_name: 'Johnson Carpentry', skills: ['Carpentry','Woodwork'], zip_code: '10003', hourly_rate: 80, rating: 4.8 }
        ];
        displayArtisans(allArtisans);
        return;
        showLoading();
        try {
            const response = await fetch('http://localhost:5000/api/users/artisans', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch artisans');
            }
            const artisans = await response.json();
            allArtisans = artisans;
            
            // Handle incoming search query from URL or display all
            const urlParams = new URLSearchParams(window.location.search);
            const queryFromUrl = urlParams.get('query');
            if (queryFromUrl) {
                searchQuery.value = queryFromUrl;
            }
            performSearch(); // Perform initial search/display
        } catch (error) {
            console.error('Error fetching artisans:', error);
            artisanResults.innerHTML = '<p class="text-red-500 col-span-full text-center">Could not load artisans. Please try again later.</p>';
        }
    }

    // Debounce wrapper for search
    function debounceSearch() {
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(performSearch, 300);
    }

    // Search functionality
    searchButton.addEventListener('click', performSearch);
    searchQuery.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    // Use debounced search on keyup for a more responsive interface
    searchQuery.addEventListener('keyup', debounceSearch);
    categoryFilter.addEventListener('change', performSearch);

    function performSearch() {
        const query = searchQuery.value.trim().toLowerCase();
        const categoryFilterValue = categoryFilter.value.trim().toLowerCase();

        const filteredArtisans = allArtisans.filter(artisan => {
            const name = artisan.name || '';
            const businessName = artisan.business_name || '';
            const skills = Array.isArray(artisan.skills) ? artisan.skills : (artisan.skills || '').split(',').map(s => s.trim());

            const nameMatch = name.toLowerCase().includes(query);
            const businessNameMatch = businessName.toLowerCase().includes(query);
            const skillsMatch = skills.some(skill => skill.toLowerCase().includes(query));
            
            const categoryMatch = categoryFilterValue ? businessName.toLowerCase().includes(categoryFilterValue) : true;

            return (nameMatch || businessNameMatch || skillsMatch) && categoryMatch;
        });

        displayArtisans(filteredArtisans);
    }

    function displayArtisans(artisans) {
        artisanResults.innerHTML = '';
        resultsCount.textContent = `${artisans.length} artisan(s) found`;
        // Load saved list to mark icons
        const savedList = JSON.parse(localStorage.getItem('savedArtisans') || '[]');

        if (artisans.length === 0) {
            artisanResults.innerHTML = '<p class="text-gray-600 col-span-full text-center">No artisans found matching your criteria.</p>';
            return;
        }

        artisans.forEach((artisan, index) => {
             const skills = Array.isArray(artisan.skills) ? artisan.skills : (artisan.skills || '').split(',').map(s => s.trim());
             const isSaved = savedList.some(a => a.name === artisan.name);
             const artisanCard = `
                 <div class="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-craft-md transition-shadow duration-200 flex flex-col">
                     <div class="flex items-start space-x-4">
                         <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(artisan.name)}&background=random&color=fff" alt="${artisan.name}" class="w-16 h-16 rounded-full object-cover" loading="lazy" />
                         <div class="flex-1">
                             <h3 class="text-lg font-bold text-gray-900">${artisan.name}</h3>
                             <p class="text-primary font-medium">${artisan.business_name || 'Specialist'}</p>
                             <div class="flex items-center mt-1">
                                 <div class="flex text-accent">
                                    ${getStarRating(artisan.rating || Math.random() * 2 + 3)}
                                 </div>
                                 <span class="text-xs text-gray-500 ml-1">${(artisan.rating || (Math.random() * 2 + 3)).toFixed(1)} (${Math.floor(Math.random() * 50) + 5} reviews)</span>
                             </div>
                         </div>
                     </div>
                     <div class="mt-4 flex-grow">
                         <p class="text-sm text-gray-600 mb-3"><strong>Skills:</strong> ${skills.join(', ')}</p>
                         <p class="text-sm text-gray-600"><strong>Location:</strong> ${artisan.zip_code || 'N/A'}</p>
                         <p class="text-sm text-gray-600"><strong>Hourly Rate:</strong> ${artisan.hourly_rate ? `$${artisan.hourly_rate}` : 'N/A'}</p>
                     </div>
                     <div class="mt-4 pt-4 border-t border-gray-100 flex items-center space-x-2">
                         <button class="view-button btn-primary flex-1" data-index="${index}">View Profile</button>
                         <button class="save-button p-2 rounded-md border border-gray-200 hover:bg-gray-100" data-index="${index}">
                             <svg class="w-5 h-5 ${isSaved ? 'text-red-500' : 'text-gray-500'}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                         </button>
                     </div>
                 </div>
             `;
             artisanResults.innerHTML += artisanCard;
         });
         // Attach save-button listeners
         document.querySelectorAll('.save-button').forEach(btn => {
             btn.addEventListener('click', () => {
                 const idx = btn.getAttribute('data-index');
                 const artisan = allArtisans[idx];
                 let saved = JSON.parse(localStorage.getItem('savedArtisans') || '[]');
                 const exists = saved.some(a => a.name === artisan.name);
                 if (exists) {
                     // Remove from saved
                     saved = saved.filter(a => a.name !== artisan.name);
                 } else {
                     // Add to saved
                     saved.push(artisan);
                 }
                 localStorage.setItem('savedArtisans', JSON.stringify(saved));
                 const svg = btn.querySelector('svg');
                 if (exists) {
                     // Unsaved: gray heart
                     svg.classList.remove('text-red-500');
                     svg.classList.add('text-gray-500');
                 } else {
                     // Saved: red heart
                     svg.classList.add('text-red-500');
                     svg.classList.remove('text-gray-500');
                 }
                 // Update dashboard count if on dashboard
                 const countEl = document.getElementById('saved-artisans-count');
                 if (countEl) {
                     countEl.textContent = saved.length;
                 }
             });
         });
         // Attach view-button listeners
         document.querySelectorAll('.view-button').forEach(btn => {
             btn.addEventListener('click', () => {
                 const idx = btn.getAttribute('data-index');
                 const artisan = allArtisans[idx];
                 // Store selected artisan for profile page
                 localStorage.setItem('currentArtisan', JSON.stringify(artisan));
                 // Navigate to profile page
                 window.location.href = 'artisan_profile.html';
             });
         });
    }

    function getStarRating(rating) {
        let stars = '';
        const fullStars = Math.floor(rating);
        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                stars += '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>';
            } else {
                stars += '<svg class="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>';
            }
        }
        return stars;
    }

    // Close dropdown when clicking outside
    window.addEventListener('click', (e) => {
        if (userMenuButton && !userMenuButton.contains(e.target) && userMenuDropdown) {
            userMenuDropdown.classList.add('hidden');
        }
    });

    // Initial fetch
    fetchArtisans();
});
