document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('profile-container');
    
    // Retrieve artisan data from localStorage
    const artisanJson = localStorage.getItem('currentArtisan');
    if (!artisanJson) {
        container.innerHTML = '<div class="bg-white rounded-lg border border-gray-200 p-6 shadow-sm"><p class="text-gray-600">No artisan selected.</p></div>';
        return;
    }
    
    const artisan = JSON.parse(artisanJson);
    const skills = Array.isArray(artisan.skills) ? artisan.skills : (artisan.skills || '').split(',').map(s => s.trim());
    
    // Check if artisan is saved
    const savedArtisans = JSON.parse(localStorage.getItem('savedArtisans') || '[]');
    const isSaved = savedArtisans.some(saved => saved.name === artisan.name);
    
    // Generate mock data for enhanced profile
    const enhancedData = generateEnhancedProfileData(artisan);
    const sectionClass = 'bg-white rounded-xl p-6 shadow-lg';

    const profileHTML = `
        <!-- Header Section -->
        <div class="bg-gradient-to-r from-primary to-accent rounded-lg p-6 shadow-lg text-white">
            <div class="flex flex-col lg:flex-row lg:items-start lg:space-x-6 space-y-4 lg:space-y-0">
                <!-- Profile Image -->
                <div class="flex-shrink-0">
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(artisan.name)}&background=random&color=fff&size=150" 
                         alt="${artisan.name}" 
                         class="w-32 h-32 lg:w-40 lg:h-40 rounded-full object-cover border-4 border-gray-100" />
                </div>
                
                <!-- Profile Info -->
                <div class="flex-1">
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                        <div>
                            <h1 class="text-3xl font-bold text-white">${artisan.name}</h1>
                            <p class="text-lg text-primary-100 font-medium">${artisan.business_name || 'Professional Artisan'}</p>
                            <p class="text-sm text-primary-200 mt-1">${enhancedData.title}</p>
                        </div>
                        <div class="flex space-x-2 mt-4 sm:mt-0">
                            <button id="save-btn" class="flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${isSaved ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-gray-50 text-gray-600 border border-gray-200'} hover:bg-opacity-80">
                                <svg class="w-4 h-4 mr-2" fill="${isSaved ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                                </svg>
                                ${isSaved ? 'Saved' : 'Save'}
                            </button>
                            <button id="contact-btn" class="bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors">
                                Contact
                            </button>
                            <button id="quote-btn" class="bg-accent text-white px-6 py-2 rounded-lg font-medium hover:bg-accent-600 transition-colors">
                                Request Quote
                            </button>
                        </div>
                    </div>
                    
                    <!-- Rating and Stats -->
                    <div class="flex flex-wrap items-center gap-6 mb-4">
                        <div class="flex items-center">
                            ${getStarRating(artisan.rating || 0)}
                            <span class="ml-2 text-sm font-medium text-gray-900">${(artisan.rating || 0).toFixed(1)}</span>
                            <span class="ml-1 text-sm text-gray-500">(${enhancedData.reviewCount} reviews)</span>
                        </div>
                        <div class="text-sm text-gray-600">
                            <span class="font-medium">${enhancedData.projectsCompleted}</span> projects completed
                        </div>
                        <div class="text-sm text-gray-600">
                            <span class="font-medium">${enhancedData.yearsExperience}</span> years experience
                        </div>
                        <div class="text-sm text-gray-600">
                            Response time: <span class="font-medium">${enhancedData.responseTime}</span>
                        </div>
                    </div>
                    
                    <!-- Quick Info -->
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div class="flex items-center text-sm text-gray-600">
                            <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                            </svg>
                            ${artisan.zip_code || 'Location not specified'}
                        </div>
                        <div class="flex items-center text-sm text-gray-600">
                            <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
                            </svg>
                            ${artisan.hourly_rate ? `$${artisan.hourly_rate}/hour` : 'Rate on request'}
                        </div>
                        <div class="flex items-center text-sm text-gray-600">
                            <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            Verified Professional
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Main Content Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Left Column -->
            <div class="lg:col-span-2 space-y-6">
                <!-- About Section -->
                <div class="${sectionClass}">
                    <h2 class="text-2xl font-semibold text-gray-800 mb-4">About</h2>
                    <p class="text-gray-600 leading-relaxed">${enhancedData.bio}</p>
                </div>

                <!-- Skills & Specialties -->
                <div class="${sectionClass}">
                    <h2 class="text-2xl font-semibold text-gray-800 mb-4">Skills & Specialties</h2>
                    <div class="flex flex-wrap gap-2">
                        ${skills.map(skill => `
                            <span class="bg-primary-100 text-primary px-3 py-1 rounded-full text-sm font-medium hover:bg-primary-200 transition">
                                ${skill}
                            </span>
                        `).join('')}
                    </div>
                </div>

                <!-- Portfolio Section -->
                <div class="${sectionClass}">
                    <h2 class="text-2xl font-semibold text-gray-800 mb-4">Recent Work</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        ${enhancedData.portfolio.map((item, index) => `
                            <div class="bg-gray-50 rounded-lg p-4 hover:shadow-md transition">
                                <div class="bg-gray-200 h-32 rounded-lg mb-3 flex items-center justify-center">
                                    <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                    </svg>
                                </div>
                                <h3 class="font-medium text-gray-900 mb-1">${item.title}</h3>
                                <p class="text-sm text-gray-600 mb-2">${item.description}</p>
                                <div class="flex items-center justify-between text-sm">
                                    <span class="text-gray-500">${item.date}</span>
                                    <span class="text-primary font-medium">${item.price}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Reviews Section -->
                <div class="${sectionClass}">
                    <h2 class="text-2xl font-semibold text-gray-800 mb-4">Recent Reviews</h2>
                    <div class="space-y-4">
                        ${enhancedData.reviews.map(review => `
                            <div class="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0 hover:bg-gray-50 transition">
                                <div class="flex items-start space-x-4">
                                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(review.clientName)}&background=random&color=fff&size=40" 
                                         alt="${review.clientName}" 
                                         class="w-10 h-10 rounded-full" />
                                    <div class="flex-1">
                                        <div class="flex items-center justify-between mb-1">
                                            <h4 class="font-medium text-gray-800">${review.clientName}</h4>
                                            <span class="text-sm text-gray-500">${review.date}</span>
                                        </div>
                                        <div class="flex items-center mb-2">
                                            ${getStarRating(review.rating)}
                                        </div>
                                        <p class="text-gray-600 text-sm">${review.comment}</p>
                                        <p class="text-xs text-gray-500 mt-1">Project: ${review.project}</p>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <button class="w-full mt-4 text-primary hover:text-primary-700 font-medium text-sm">
                        View All Reviews
                    </button>
                </div>
            </div>

            <!-- Right Column -->
            <div class="space-y-6">
                <!-- Contact Information -->
                <div class="${sectionClass}">
                    <h2 class="text-2xl font-semibold text-gray-800 mb-4">Contact Information</h2>
                    <div class="space-y-3">
                        <div class="flex items-center text-sm">
                            <svg class="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                            </svg>
                            <span class="text-gray-600">${enhancedData.contact.email}</span>
                        </div>
                        <div class="flex items-center text-sm">
                            <svg class="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                            </svg>
                            <span class="text-gray-600">${enhancedData.contact.phone}</span>
                        </div>
                        <div class="flex items-center text-sm">
                            <svg class="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9"/>
                            </svg>
                            <span class="text-gray-600">${enhancedData.contact.website}</span>
                        </div>
                    </div>
                </div>

                <!-- Availability -->
                <div class="${sectionClass}">
                    <h2 class="text-2xl font-semibold text-gray-800 mb-4">Availability</h2>
                    <div class="space-y-2">
                        <div class="flex items-center justify-between text-sm">
                            <span class="text-gray-600">Current Status:</span>
                            <span class="text-green-600 font-medium">Available</span>
                        </div>
                        <div class="flex items-center justify-between text-sm">
                            <span class="text-gray-600">Next Available:</span>
                            <span class="text-gray-900 font-medium">${enhancedData.availability.nextAvailable}</span>
                        </div>
                        <div class="flex items-center justify-between text-sm">
                            <span class="text-gray-600">Working Hours:</span>
                            <span class="text-gray-900 font-medium">${enhancedData.availability.workingHours}</span>
                        </div>
                    </div>
                </div>

                <!-- Certifications -->
                <div class="${sectionClass}">
                    <h2 class="text-2xl font-semibold text-gray-800 mb-4">Certifications</h2>
                    <div class="space-y-3">
                        ${enhancedData.certifications.map(cert => `
                            <div class="flex items-center">
                                <svg class="w-4 h-4 mr-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                                <span class="text-sm text-gray-600">${cert}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Service Area -->
                <div class="${sectionClass}">
                    <h2 class="text-2xl font-semibold text-gray-800 mb-4">Service Area</h2>
                    <p class="text-sm text-gray-600 mb-3">Serves within ${enhancedData.serviceRadius} miles of ${artisan.zip_code || 'base location'}</p>
                    <div class="bg-gray-100 h-32 rounded-lg flex items-center justify-center">
                        <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                        </svg>
                    </div>
                </div>
            </div>
        </div>

        <!-- Quote Request Modal -->
        <div id="quote-modal" class="fixed inset-0 flex items-center justify-center z-50 hidden">
            <div class="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
                <h2 class="text-xl font-semibold text-gray-800 mb-4">Request a Quote</h2>
                <form id="quote-form">
                    <div class="mb-4">
                        <label for="quote-subject" class="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                        <input type="text" id="quote-subject" name="subject" class="block w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary focus:outline-none" placeholder="Subject" />
                    </div>
                    <div class="mb-4">
                        <label for="quote-body" class="block text-sm font-medium text-gray-700 mb-2">Message</label>
                        <textarea id="quote-body" name="body" rows="4" class="block w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary focus:outline-none" placeholder="Describe your project needs"></textarea>
                    </div>
                    <div class="flex justify-end space-x-2">
                        <button type="button" id="quote-cancel" class="px-4 py-2 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" class="px-4 py-2 rounded-lg font-medium bg-accent text-white hover:bg-accent-600 transition-colors">
                            Send Request
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    container.innerHTML = profileHTML;
    
    // Contact button: open email client
    const contactBtn = document.getElementById('contact-btn');
    if (contactBtn) {
        contactBtn.addEventListener('click', () => {
            window.location.href = `mailto:${enhancedData.contact.email}`;
        });
    }

    // Request Quote button: open modal form
    const quoteBtn = document.getElementById('quote-btn');
    const quoteModal = document.getElementById('quote-modal');
    const quoteForm = document.getElementById('quote-form');
    const quoteCancel = document.getElementById('quote-cancel');
    if (quoteBtn && quoteModal) {
        quoteBtn.addEventListener('click', () => {
            quoteModal.classList.remove('hidden');
        });
    }
    if (quoteCancel && quoteModal) {
        quoteCancel.addEventListener('click', () => {
            quoteModal.classList.add('hidden');
        });
    }
    if (quoteForm) {
        quoteForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const subjectInput = document.getElementById('quote-subject');
            const bodyInput = document.getElementById('quote-body');
            const subjectVal = subjectInput.value || `Quote Request: ${artisan.name}`;
            const bodyVal = bodyInput.value || `Hi ${artisan.name},\n\nI would like to request a quote for your services. Please let me know your availability and rates.\n\nThank you.`;
            window.location.href = `mailto:${enhancedData.contact.email}?subject=${encodeURIComponent(subjectVal)}&body=${encodeURIComponent(bodyVal)}`;
            quoteModal.classList.add('hidden');
        });
    }

     // Add event listeners
     setupEventListeners(artisan);
});

function generateEnhancedProfileData(artisan) {
    // Generate realistic mock data based on the artisan
    const firstName = artisan.name.split(' ')[0];
    const businessNameForEmail = (artisan.business_name || artisan.name).toLowerCase().replace(/\s+/g, '');
    
    return {
        title: `Experienced ${artisan.skills?.[0] || 'Home Improvement'} Specialist`,
        bio: `Professional ${artisan.skills?.[0]?.toLowerCase() || 'home improvement'} contractor with extensive experience in residential and commercial projects. Known for quality workmanship, attention to detail, and excellent customer service. Licensed and insured with a commitment to completing projects on time and within budget.`,
        reviewCount: Math.floor(Math.random() * 50) + 15,
        projectsCompleted: Math.floor(Math.random() * 100) + 25,
        yearsExperience: Math.floor(Math.random() * 15) + 3,
        responseTime: ['Within 1 hour', 'Within 2 hours', 'Same day', 'Within 24 hours'][Math.floor(Math.random() * 4)],
        contact: {
            email: `${firstName.toLowerCase()}@${businessNameForEmail}.com`,
            phone: `(${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
            website: `www.${businessNameForEmail}.com`
        },
        availability: {
            nextAvailable: ['Tomorrow', 'This week', 'Next week', 'In 2 weeks'][Math.floor(Math.random() * 4)],
            workingHours: 'Mon-Fri 8AM-6PM'
        },
        serviceRadius: [15, 20, 25, 30][Math.floor(Math.random() * 4)],
        certifications: [
            'Licensed Professional',
            'Insured & Bonded',
            'Background Checked',
            'EPA Certified'
        ],
        portfolio: [
            {
                title: 'Kitchen Renovation',
                description: 'Complete kitchen remodel with modern fixtures',
                date: '2 weeks ago',
                price: '$8,500'
            },
            {
                title: 'Bathroom Upgrade',
                description: 'Full bathroom renovation with tile work',
                date: '1 month ago',
                price: '$5,200'
            },
            {
                title: 'Living Room Installation',
                description: 'Custom built-in shelving and lighting',
                date: '6 weeks ago',
                price: '$3,100'
            },
            {
                title: 'Outdoor Deck Repair',
                description: 'Deck restoration and weatherproofing',
                date: '2 months ago',
                price: '$2,800'
            }
        ],
        reviews: [
            {
                clientName: 'Sarah Johnson',
                rating: 5,
                date: '1 week ago',
                comment: 'Excellent work! Professional, on time, and exceeded expectations. Highly recommend!',
                project: 'Kitchen Installation'
            },
            {
                clientName: 'Mike Davis',
                rating: 5,
                date: '3 weeks ago',
                comment: 'Great attention to detail and very reasonable pricing. Will definitely hire again.',
                project: 'Bathroom Renovation'
            },
            {
                clientName: 'Lisa Chen',
                rating: 4,
                date: '1 month ago',
                comment: 'Solid work and good communication throughout the project.',
                project: 'Living Room Upgrade'
            }
        ]
    };
}

function getStarRating(rating) {
    let stars = '';
    const fullStars = Math.floor(rating);
    const half = (rating - fullStars) >= 0.5;
    
    for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
            stars += '<svg class="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>';
        } else if (i === fullStars && half) {
            stars += '<svg class="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M10 15l-3.09 1.63.59-3.44L4 10.27l3.46-.5L10 6l1.54 3.77 3.46.5-2.41 2.92.59 3.44z"/></svg>';
        } else {
            stars += '<svg class="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>';
        }
    }
    return `<div class="flex">${stars}</div>`;
}

function setupEventListeners(artisan) {
    // Save/Unsave button functionality
    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            let savedArtisans = JSON.parse(localStorage.getItem('savedArtisans') || '[]');
            const existingIndex = savedArtisans.findIndex(saved => saved.name === artisan.name);
            
            if (existingIndex > -1) {
                // Remove from saved
                savedArtisans.splice(existingIndex, 1);
                saveBtn.innerHTML = `
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                    </svg>
                    Save
                `;
                saveBtn.className = 'flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-gray-50 text-gray-600 border border-gray-200 hover:bg-opacity-80';
            } else {
                // Add to saved
                savedArtisans.push(artisan);
                saveBtn.innerHTML = `
                    <svg class="w-4 h-4 mr-2" fill="currentColor" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                    </svg>
                    Saved
                `;
                saveBtn.className = 'flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-red-50 text-red-600 border border-red-200 hover:bg-opacity-80';
            }
            
            localStorage.setItem('savedArtisans', JSON.stringify(savedArtisans));
            
            // Dispatch event to update dashboard count if needed
            window.dispatchEvent(new CustomEvent('savedArtisansUpdated'));
        });
    }
}
