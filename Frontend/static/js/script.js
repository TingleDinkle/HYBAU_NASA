// JavaScript for interactive elements

// Initialize Leaflet map
document.addEventListener('DOMContentLoaded', () => {
    const mapContainer = document.getElementById('map');
    if (mapContainer && typeof L !== 'undefined') {
        // Default center (Hanoi) - will be updated if geolocation is available
        let mapCenter = [21.0278, 105.8342];
        let mapZoom = 7;
        
        // Try to get user's location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    // Success: Use user's location
                    mapCenter = [position.coords.latitude, position.coords.longitude];
                    mapZoom = 8; // Closer zoom for user location
                    console.log('User location detected:', mapCenter);
                    initializeMap(mapCenter, mapZoom);
                },
                (error) => {
                    // Error: Use default location
                    console.log('Geolocation error:', error.message);
                    console.log('Using default location (Hanoi)');
                    initializeMap(mapCenter, mapZoom);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000 // 5 minutes
                }
            );
        } else {
            // Geolocation not supported: Use default location
            console.log('Geolocation not supported, using default location (Hanoi)');
            initializeMap(mapCenter, mapZoom);
        }
        
        function initializeMap(center, zoom) {
            window.map = L.map('map', {
                center: center,
                zoom: zoom,
                minZoom: 3,
                maxZoom: 8,
                worldCopyJump: true
            });
            window.map.setMaxBounds([
                [-90, -Infinity],
                [90, Infinity]
            ]);
            window.map.options.maxBoundsViscosity = 1.0;
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                noWrap: false
            }).addTo(window.map);
            
            // Store user location globally for marker management
            window.userLocation = center;
            
            // Always add a marker to show the current center location
            addUserLocationMarker();
            console.log('Location marker added at:', center);
            
            // Listen for map events to ensure marker stays visible
            window.map.on('moveend', ensureUserLocationMarkerVisible);
            window.map.on('zoomend', ensureUserLocationMarkerVisible);
            window.map.on('viewreset', ensureUserLocationMarkerVisible);
            
            // Also check periodically to ensure marker is always visible
            setInterval(ensureUserLocationMarkerVisible, 2000); // Check every 2 seconds
        }
        
        function addUserLocationMarker() {
            if (window.userLocation && window.map) {
                console.log('Adding user location marker at:', window.userLocation);
                
                // Remove existing marker if it exists
                if (window.userLocationMarker) {
                    window.map.removeLayer(window.userLocationMarker);
                    console.log('Removed existing marker');
                }
                
                // Create a custom icon for better visibility
                const userLocationIcon = L.divIcon({
                    className: 'user-location-marker',
                    html: '<div style="background-color: #ff0000; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>',
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                });
                
                // Add new marker at user location
                window.userLocationMarker = L.marker(window.userLocation, { icon: userLocationIcon })
                    .addTo(window.map)
                    .bindPopup(`Your Location<br>Lat: ${window.userLocation[0].toFixed(4)}<br>Lng: ${window.userLocation[1].toFixed(4)}`);
                
                console.log('User location marker added successfully');
            } else {
                console.log('Cannot add marker - userLocation:', window.userLocation, 'map:', window.map);
            }
        }
        
        function ensureUserLocationMarkerVisible() {
            if (window.userLocation && window.map) {
                // Check if marker exists and is in current view
                const mapBounds = window.map.getBounds();
                let markerVisible = false;
                
                if (window.userLocationMarker) {
                    const markerLatLng = window.userLocationMarker.getLatLng();
                    markerVisible = mapBounds.contains(markerLatLng);
                }
                
                // If marker doesn't exist or is not visible, add it again
                if (!window.userLocationMarker || !markerVisible) {
                    console.log('Marker not visible in current view, recreating...');
                    addUserLocationMarker();
                }
            }
        }
    }
});

// Toggle Info Panel
const infoPanel = document.getElementById('info-panel');
const infoToggleBtn = document.getElementById('info-toggle');

if (infoToggleBtn) {
    infoToggleBtn.addEventListener('click', () => {
        infoPanel.classList.toggle('open');
        document.body.classList.toggle('info-open', infoPanel.classList.contains('open'));
    });
}

// Toggle Sidebar
const sidebar = document.getElementById('leftSidebar');
const toggleBtn = document.getElementById('toggleSidebar');
const toggleIcon = toggleBtn.querySelector('i');

toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    toggleBtn.classList.toggle('collapsed');
    
    if (sidebar.classList.contains('collapsed')) {
        toggleIcon.className = 'fas fa-chevron-right';
    } else {
        toggleIcon.className = 'fas fa-chevron-left';
    }
});

// Mode Switcher
const modeBtns = document.querySelectorAll('.mode-btn');
modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Show loading animation
        const loading = document.getElementById('loadingOverlay');
        loading.style.display = 'block';
        
        // Simulate loading
        setTimeout(() => {
            loading.style.display = 'none';
        }, 1000);
    });
});

// Layer Buttons
const layerBtns = document.querySelectorAll('.layer-btn');
layerBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        btn.classList.toggle('active');
    });
});

// Control Buttons
const controlBtns = document.querySelectorAll('.control-btn');
controlBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Add click animation
        btn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            btn.style.transform = '';
        }, 100);
        
        // Handle specific button actions
        const tooltip = btn.getAttribute('data-tooltip');
        if (tooltip === 'My Location') {
            getCurrentLocation();
        }
    });
});

// Function to get current location
function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLat = position.coords.latitude;
                const userLng = position.coords.longitude;
                
                // Update global user location
                window.userLocation = [userLat, userLng];
                
                // Get the map instance (assuming it's stored globally)
                if (window.map) {
                    window.map.setView([userLat, userLng], 8);
                    
                    // Add or update user location marker using the new system
                    addUserLocationMarker();
                }
            },
            (error) => {
                alert('Unable to get your location. Please check your browser permissions.');
                console.log('Geolocation error:', error.message);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000
            }
        );
    } else {
        alert('Geolocation is not supported by this browser.');
    }
}

// Time Slider
const timeSlider = document.querySelector('.time-slider');
const currentTime = document.querySelector('.current-time');

timeSlider.addEventListener('input', (e) => {
    const hours = e.target.value;
    if (hours == 0) {
        currentTime.textContent = 'Now';
    } else {
        currentTime.textContent = `+${hours}h`;
    }
});

// Play Button Animation
const playBtn = document.querySelector('.time-btn:nth-child(2)');
let isPlaying = false;

playBtn.addEventListener('click', () => {
    isPlaying = !isPlaying;
    const icon = playBtn.querySelector('i');
    
    if (isPlaying) {
        icon.className = 'fas fa-pause';
        // Start animation
        animateTimeline();
    } else {
        icon.className = 'fas fa-play';
    }
});

function animateTimeline() {
    if (!isPlaying) return;
    
    let currentValue = parseInt(timeSlider.value);
    if (currentValue >= 72) {
        currentValue = 0;
    } else {
        currentValue += 1;
    }
    
    timeSlider.value = currentValue;
    timeSlider.dispatchEvent(new Event('input'));
    
    setTimeout(animateTimeline, 100);
}

// Search functionality (placeholder)
const searchBar = document.querySelector('.search-bar');
searchBar.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        console.log('Searching for:', e.target.value);
        // Add search logic here
    }
});

// Fullscreen toggle
const fullscreenBtn = document.querySelector('.control-btn[data-tooltip="Fullscreen"]');
fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        fullscreenBtn.querySelector('i').className = 'fas fa-compress';
    } else {
        document.exitFullscreen();
        fullscreenBtn.querySelector('i').className = 'fas fa-expand';
    }
});

// Simulate real-time updates
setInterval(() => {
    const lastUpdated = document.querySelector('.info-details p');
    const minutes = Math.floor(Math.random() * 5) + 1;
    lastUpdated.textContent = `Last updated: ${minutes} min ago`;
}, 30000);

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.fullscreenElement) {
        document.exitFullscreen();
    }
    if (e.key === 'f' && e.ctrlKey) {
        e.preventDefault();
        searchBar.focus();
    }
});

// Theme Toggle Functionality
const themeToggleBtn = document.getElementById('theme-toggle');
let isDarkMode = true;

// Check for saved theme preference
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'light') {
    isDarkMode = false;
    document.body.classList.add('light-mode');
    updateMapTiles();
}

if (themeToggleBtn) {
    // Update icon based on current theme
    const updateThemeIcon = () => {
        const icon = themeToggleBtn.querySelector('i');
        if (isDarkMode) {
            icon.className = 'fas fa-moon';
        } else {
            icon.className = 'fas fa-sun';
        }
    };
    
    // Set initial icon
    updateThemeIcon();
    
    themeToggleBtn.addEventListener('click', () => {
        isDarkMode = !isDarkMode;
        document.body.classList.toggle('light-mode');
        
        // Save preference
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
        
        // Update icon
        updateThemeIcon();
        
        // Update map tiles
        updateMapTiles();
        
        // Add click animation
        themeToggleBtn.style.transform = 'scale(0.95) rotate(180deg)';
        setTimeout(() => {
            themeToggleBtn.style.transform = '';
        }, 300);
    });
}

function updateMapTiles() {
    if (window.map && window.mapTileLayer) {
        window.map.removeLayer(window.mapTileLayer);
        
        if (isDarkMode) {
            // Dark mode map
            window.mapTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                noWrap: false
            });
        } else {
            // Light mode map - using a brighter tile set
            window.mapTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                noWrap: false,
                className: 'light-mode-tiles'
            });
        }
        
        window.mapTileLayer.addTo(window.map);
    }
}

// Update the initializeMap function to store the tile layer
function initializeMap(center, zoom) {
    window.map = L.map('map', {
        center: center,
        zoom: zoom,
        minZoom: 3,
        maxZoom: 8,
        worldCopyJump: true
    });
    window.map.setMaxBounds([
        [-90, -Infinity],
        [90, Infinity]
    ]);
    window.map.options.maxBoundsViscosity = 1.0;
    
    // Store tile layer globally
    window.mapTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        noWrap: false
    }).addTo(window.map);
    
    // Store user location globally for marker management
    window.userLocation = center;
    
    // Always add a marker to show the current center location
    addUserLocationMarker();
    console.log('Location marker added at:', center);
    
    // Listen for map events to ensure marker stays visible
    window.map.on('moveend', ensureUserLocationMarkerVisible);
    window.map.on('zoomend', ensureUserLocationMarkerVisible);
    window.map.on('viewreset', ensureUserLocationMarkerVisible);
    
    // Also check periodically to ensure marker is always visible
    setInterval(ensureUserLocationMarkerVisible, 2000);
}