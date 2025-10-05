// JavaScript for interactive elements

// Initialize Leaflet map
document.addEventListener('DOMContentLoaded', () => {
    const mapContainer = document.getElementById('map');
    if (mapContainer && typeof L !== 'undefined') {
        // Default center (Hanoi) - will be updated if geolocation is available
        let mapCenter = [21.0278, 105.8342];
        let mapZoom = 3;
        
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
                worldCopyJump: true,
                zoomControl: false
            });
            window.map.setMaxBounds([
                [-90, -Infinity],
                [90, Infinity]
            ]);
            window.map.options.maxBoundsViscosity = 1.0;
            const savedTheme = localStorage.getItem('theme');
            const isLightMode = savedTheme === 'light';

            if (isLightMode) {
                window.mapTileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
                    subdomains: 'abcd',
                    noWrap: false,
                    maxZoom: 8
                })
            } else {
                window.mapTileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
                    subdomains: 'abcd',
                    maxZoom: 8
                })
            }

            window.mapTileLayer.addTo(window.map);

            
            // Store user location globally for marker management
            window.userLocation = center;
            
            // Always add a marker to show the current center location
            addUserLocationMarker();
            console.log('Location marker added at:', center);
            
            // Listen for map events to ensure marker stays visible
            // window.map.on('moveend', ensureUserLocationMarkerVisible);
            // window.map.on('zoomend', ensureUserLocationMarkerVisible);
            // window.map.on('viewreset', ensureUserLocationMarkerVisible);
            
            // Also check periodically to ensure marker is always visible
            // setInterval(ensureUserLocationMarkerVisible, 2000); // Check every 2 seconds


            const markerIcon = L.divIcon({
                className: 'user-location-marker',
                html: '<div style="background-color:rgb(48, 35, 197); width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>',
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            });

            window.marker = null;
            
            // Add click event listener to print coordinates
            window.map.on('click', (e) => {
                const lat = e.latlng.lat.toFixed(6);
                const lng = e.latlng.lng.toFixed(6);
                console.log(`Clicked coordinates: ${lat}, ${lng}`);

                if (window.marker !== null) {
                    window.map.removeLayer(window.marker);
                }

                if (window.userLocationMarker !== null) {
                    window.map.removeLayer(window.userLocationMarker);
                    window.userLocationMarker = null;
                }

                window.marker = L.marker(e.latlng, { icon: markerIcon })
                    .addTo(window.map)
                    .bindPopup(`Latitude: ${lat}<br>Longitude: ${lng}`)
                    .openPopup();

                // Dynamic host (same as current page host)
                const host = window.location.origin;

                // Build URL: host/click/lat/lng
                const url = `${host}/click/${lat}/${lng}`;

                // Send GET request
                fetch(url)
                    .then(res => {
                        if (!res.ok) throw new Error("Request failed: " + res.status);
                        return res.text(); // or .json() if your server returns JSON
                    })
                    .then(data => {
                        console.log("Server response:", data);
                    })
                    .catch(err => console.error(err));
                
                // Also show an alert for immediate feedback
                // alert(`Coordinates: ${lat}, ${lng}`);
            });
        }
        
        function ensureUserLocationMarkerVisible() {
            // if (window.userLocation && window.map) {
            //     // Check if marker exists and is in current view
            //     const mapBounds = window.map.getBounds();
            //     let markerVisible = false;
                
            //     if (window.userLocationMarker) {
            //         const markerLatLng = window.userLocationMarker.getLatLng();
            //         markerVisible = mapBounds.contains(markerLatLng);
            //     }
                
            //     // If marker doesn't exist or is not visible, add it again
            //     if (!window.userLocationMarker || !markerVisible) {
            //         console.log('Marker not visible in current view, recreating...');
            //         addUserLocationMarker();
            //     }
            // }
        }
    }
});

function addUserLocationMarker() {
    if (window.userLocation && window.map) {
        console.log('Adding user location marker at:', window.userLocation);

        if (window.marker) {
            window.map.removeLayer(window.marker);
            console.log('Removed existing marker');
        }
        
        // Remove existing marker if it exists
        if (window.userLocationMarker) {
            window.map.removeLayer(window.userLocationMarker);
            console.log('Removed existing user marker');
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
            .bindPopup(`Your Location<br>Latitude: ${window.userLocation[0].toFixed(4)}<br>Longitude: ${window.userLocation[1].toFixed(4)}`)
            .openPopup();
        console.log('User location marker added successfully');
    } else {
        console.log('Cannot add marker - userLocation:', window.userLocation, 'map:', window.map);
    }
}

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

        // If Forecast tab clicked, open info panel and scroll to forecast section
        const mode = btn.getAttribute('data-mode');
        if (mode === 'forecast') {
            if (infoPanel && !infoPanel.classList.contains('open')) {
                infoPanel.classList.add('open');
                document.body.classList.add('info-open');
            }
            const target = document.getElementById('forecast-section');
            if (target) {
                // wait for panel open transition to complete before scrolling
                setTimeout(() => {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 350);
            }
        }
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
                    map.invalidateSize();
                    map.flyTo([userLat, userLng], map.getZoom(), { animate: false, duration: 0 });
                    
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
            // Dark mode map - using Stadia Maps Alidade Smooth Dark (modern, vibrant, less depressing)
            window.mapTileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
                subdomains: 'abcd',
                noWrap: false,
                maxZoom: 8
            }).addTo(map);
            // window.mapTileLayer = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', {
            //     attribution: '© Stadia Maps © OpenMapTiles © OpenStreetMap contributors',
            //     noWrap: false,
            //     maxZoom: 8
            // });
        } else {
            // Light mode map - using standard OpenStreetMap
            window.mapTileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
                subdomains: 'abcd',
                noWrap: false,
                maxZoom: 8
            })
        }
        
        window.mapTileLayer.addTo(window.map);
    }
}

// Zoom In and Zoom Out buttons
const zoomInBtn = document.querySelector('.control-btn[data-tooltip="Zoom In"]');
const zoomOutBtn = document.querySelector('.control-btn[data-tooltip="Zoom Out"]');

if (zoomInBtn) {
    zoomInBtn.addEventListener('click', () => {
        if (window.map) {
            window.map.zoomIn();
            
            // Add click animation
            zoomInBtn.style.transform = 'scale(0.95)';
            setTimeout(() => {
                zoomInBtn.style.transform = '';
            }, 100);
        }
    });
}

if (zoomOutBtn) {
    zoomOutBtn.addEventListener('click', () => {
        if (window.map) {
            window.map.zoomOut();
            
            // Add click animation
            zoomOutBtn.style.transform = 'scale(0.95)';
            setTimeout(() => {
                zoomOutBtn.style.transform = '';
            }, 100);
        }
    });
}

function createLegend({
    selector = '.legend',
    title = 'PM2.5',
    unit = 'μg/m³',
    maxValue = 250,
    thresholds = [15, 35, 55, 110, 250],
    categories = ['Good', 'Moderate', 'Unhealthy for Sensitive Groups', 'Unhealthy', 'Very Unhealthy'],
    colors = ['#00e400', '#ffff00', '#ff7e00', '#ff0000', '#8f3f97']
}) {
    // Select DOM elements
    const legend = document.querySelector(selector);
    if (!legend) {
    console.warn(`Legend container ${selector} not found.`);
    return;
    }

    // Create inner elements dynamically
    legend.innerHTML = `
    <div class="legend-title">${title} (${unit})</div>
    <div class="legend-scale" id="legend-scale"></div>
    <div id="legend-tooltip"></div>
    <div class="legend-labels">
        ${thresholds.map(v => `<span>${v}</span>`).join('')}
        <span>${maxValue}+</span>
    </div>
    `;

    const legendScale = legend.querySelector('#legend-scale');
    const tooltip = legend.querySelector('#legend-tooltip');

    // Build gradient background
    const gradientStops = colors.map((c, i) => `${c} ${(i / (colors.length - 1)) * 100}%`).join(', ');
    legendScale.style.background = `linear-gradient(90deg, ${gradientStops})`;

    // Function to get category from value
    function getCategory(val) {
    for (let i = 0; i < thresholds.length; i++) {
        if (val <= thresholds[i]) return categories[i];
    }
    return categories[categories.length - 1];
    }

    // Mouse hover interaction
    legendScale.addEventListener('mousemove', (e) => {
    const scaleRect = legendScale.getBoundingClientRect();
    const legendRect = legend.getBoundingClientRect();

    const x = Math.max(0, Math.min(scaleRect.width, e.clientX - scaleRect.left));
    const frac = x / scaleRect.width;
    const est = Math.round(frac * maxValue);

    const label = getCategory(est);

    // Tooltip text — status only
    tooltip.innerHTML = label;

    // Show tooltip
    tooltip.style.display = 'block';
    const leftInsideLegend = e.clientX - legendRect.left;
    tooltip.style.left = `${leftInsideLegend}px`;

    const scaleTopInsideLegend = scaleRect.top - legendRect.top;
    const ttHeight = tooltip.offsetHeight || 24;
    tooltip.style.top = `${scaleTopInsideLegend - ttHeight - 8}px`;

    requestAnimationFrame(() => {
        tooltip.style.opacity = '1';
    });
    });

    legendScale.addEventListener('mouseleave', () => {
    tooltip.style.opacity = '0';
    setTimeout(() => { tooltip.style.display = 'none'; }, 160);
    });

    // Touch support
    legendScale.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    if (touch) {
        legendScale.dispatchEvent(new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY,
        bubbles: true
        }));
    }
    }, { passive: true });

    legendScale.addEventListener('touchmove', (e) => {
    const touch = e.touches[0];
    if (touch) {
        legendScale.dispatchEvent(new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY,
        bubbles: true
        }));
    }
    }, { passive: true });

    legendScale.addEventListener('touchend', () => {
    tooltip.style.opacity = '0';
    setTimeout(() => { tooltip.style.display = 'none'; }, 160);
    });
}

function updateInfoCard(containerSelector, { title, value, unit, detail }) {
    // Find the container (e.g. ".info-card" or parent element)
    const container = document.querySelector(containerSelector);
    if (!container) return console.error("Info card container not found:", containerSelector);

    // If the card exists, update it
    let card = container.querySelector('.info-card');
    if (!card) {
        card = document.createElement('div');
        card.className = 'info-card';
        container.appendChild(card);
    }

    // Build or update inner HTML
    card.innerHTML = `
        <div class="info-card-title">${title}</div>
        <div class="info-card-value">
            ${value}<span class="info-card-unit">${unit || ''}</span>
        </div>
        <div class="info-card-detail">${detail || ''}</div>
    `;
}

function addPollutantItem(panelSelector, name, value, unit) {
    const panel = document.querySelector(panelSelector);
    if (!panel) return console.error("Panel not found:", panelSelector);

    // Create pollutant item container
    const item = document.createElement('div');
    item.className = 'pollutant-item';

    // Inner structure
    item.innerHTML = `
        <span class="pollutant-name">${name}</span>
        <span class="pollutant-value">${value} ${unit || ''}</span>
    `;

    // Insert before the end of panel (after all existing pollutant items)
    panel.appendChild(item);
}