import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Supabase credentials (replace if needed)
const SUPABASE_URL = 'https://wecbjkfyaqorwmvrabjb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlY2Jqa2Z5YXFvcndtdnJhYmpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5OTEyODYsImV4cCI6MjA2NzU2NzI4Nn0.HzfxgDjLQtqlpvH2k-EK9QgGYg7GT0Qifb-2Yh4ObO4';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', async () => {
    // Populate user header
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) console.error('Session error:', error);
    const user = session?.user;
    const nameEl = document.getElementById('user-name-header');
    const avatarEl = document.getElementById('user-avatar');
    if (nameEl) {
        const displayName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
        nameEl.textContent = displayName;
        nameEl.classList.remove('hidden');
    }
    if (avatarEl) {
        avatarEl.src = user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(nameEl?.textContent||'User')}&background=3B82F6&color=fff&size=128`;
    }

    // Attach menu and logout if exists
    const menuBtn = document.getElementById('user-menu-button');
    const menuDropdown = document.getElementById('user-menu-dropdown');
    const logoutBtn = document.getElementById('logout-button');
    if (menuBtn && menuDropdown) {
        menuBtn.addEventListener('click', e => {
            e.stopPropagation();
            menuDropdown.classList.toggle('hidden');
        });
    }
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            supabase.auth.signOut();
            window.location.href = 'login.html';
        });
    }

    // Load saved artisans
    const container = document.getElementById('saved-artisans-container');
    const saved = JSON.parse(localStorage.getItem('savedArtisans') || '[]');
    if (!saved.length) {
        container.innerHTML = '<p class="col-span-full text-gray-600 text-center">No saved artisans.</p>';
        return;
    }

    saved.forEach(artisan => {
        const skills = Array.isArray(artisan.skills) ? artisan.skills : (artisan.skills || '').split(',').map(s => s.trim());
        const card = `
            <div class="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-craft-md transition-shadow duration-200 flex flex-col">
                <div class="flex items-start space-x-4">
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(artisan.name)}&background=random&color=fff" alt="${artisan.name}" class="w-16 h-16 rounded-full object-cover" loading="lazy" />
                    <div class="flex-1">
                        <h3 class="text-lg font-bold text-gray-900">${artisan.name}</h3>
                        <p class="text-primary font-medium">${artisan.business_name || 'Specialist'}</p>
                        <div class="flex items-center mt-1">
                            <div class="flex text-accent">
                                ${getStarRating(artisan.rating || 0)}
                            </div>
                            <span class="text-xs text-gray-500 ml-1">${(artisan.rating||0).toFixed(1)} reviews</span>
                        </div>
                    </div>
                </div>
                <div class="mt-4 flex-grow">
                    <p class="text-sm text-gray-600 mb-3"><strong>Skills:</strong> ${skills.join(', ')}</p>
                    <p class="text-sm text-gray-600"><strong>Location:</strong> ${artisan.zip_code || 'N/A'}</p>
                    <p class="text-sm text-gray-600"><strong>Hourly Rate:</strong> ${artisan.hourly_rate ? `$${artisan.hourly_rate}` : 'N/A'}</p>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', card);
    });
});

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
