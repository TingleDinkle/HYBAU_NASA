// JavaScript for interactive elements

const POLLUTANT_NAME_MAP = {
    carbon_monoxide: "Carbon Monoxide (CO)",
    nitrogen_dioxide: "Nitrogen Dioxide (NO₂)",
    ozone: "Ozone (O₃)",
    pm2_5: "PM2.5 (Fine Particulate Matter)",
    pm10: "PM10 (Coarse Particulate Matter)",
    sulphur_dioxide: "Sulfur Dioxide (SO₂)"
};

function calculateAQI(concentration, breakpoints) {
    for (let i = 0; i < breakpoints.length; i++) {
        const bp = breakpoints[i];
        if (concentration >= bp.C_low && concentration <= bp.C_high) {
            const { C_low, C_high, I_low, I_high } = bp;
            return Math.round(((I_high - I_low) / (C_high - C_low)) * (concentration - C_low) + I_low);
        }
    }
    return null;
}

const BREAKPOINTS = {
    pm2_5: [
        { C_low: 0.0, C_high: 12.0, I_low: 0, I_high: 50 },
        { C_low: 12.1, C_high: 35.4, I_low: 51, I_high: 100 },
        { C_low: 35.5, C_high: 55.4, I_low: 101, I_high: 150 },
        { C_low: 55.5, C_high: 150.4, I_low: 151, I_high: 200 },
        { C_low: 150.5, C_high: 250.4, I_low: 201, I_high: 300 },
        { C_low: 250.5, C_high: 350.4, I_low: 301, I_high: 400 },
        { C_low: 350.5, C_high: 500.4, I_low: 401, I_high: 500 }
    ]
};

function updatePollutantsFromData(data) {
    const pollutants = data.air_pollutant.hourly;
    const units = data.air_pollutant.hourly_units;

    let aqIndex = 0;

    for (const key in POLLUTANT_NAME_MAP) {
        if (pollutants[key] && pollutants[key].length > 0) {
            const currentValue = pollutants[key][pollutants[key].length - 1];
            const displayName = POLLUTANT_NAME_MAP[key];
            const unit = units && units[key] ? units[key] : '';

            addOrUpdatePollutant(displayName, currentValue, unit);

            // Calculate AQI if breakpoints are defined
            if (BREAKPOINTS[key]) {
                const aqi = calculateAQI(currentValue, BREAKPOINTS[key]);
                if (aqi !== null && aqi > aqIndex) {
                    aqIndex = aqi;
                }
            }
        }
    }

    console.log("Overall AQI:", aqIndex);

    aqiElement = document.getElementById("aqi");
    aqiElement.textContent = aqIndex;
}

function updateWeatherFromData(data) {
    if (!data.weather || !data.weather.hourly) {
        console.error("Invalid weather data format");
        return;
    }

    const w = data.weather.hourly;
    const u = data.weather.hourly_units || {}; // all units come from here

    const first = (arr) => (arr[arr.length - 1]);

    // Get values directly
    const temperature = first(w.temperature_2m);
    const humidity = first(w.relative_humidity_2m);
    const windSpeed = first(w.wind_speed_10m);
    const windDir = first(w.wind_direction_10m);
    const precipitation = first(w.precipitation);
    const cloudCover = first(w.cloud_cover);
    const pressure = first(w.surface_pressure);

    updateInfoCard("🌡️ Temperature", temperature, u.temperature_2m, `Feels like ${Math.round(temperature + 2)}${u.temperature_2m || ""}`);
    updateInfoCard("💧 Humidity", humidity, u.relative_humidity_2m, `Dew point ${Math.round((humidity / 100) * temperature)}${u.temperature_2m || ""}`);
    updateInfoCard("💨 Wind Speed", windSpeed, u.wind_speed_10m, `Direction: ${windDir}°`);
    updateInfoCard("🌧️ Precipitation", precipitation, u.precipitation, `Cloud cover: ${cloudCover}${u.cloud_cover || ""}`);
    updateInfoCard("☁️ Cloud Cover", cloudCover, u.cloud_cover, cloudCover > 80 ? "Mostly cloudy" : "Partly cloudy");
    updateInfoCard("🧭 Surface Pressure", pressure, u.surface_pressure, pressure > 1013 ? "High pressure" : "Low pressure");
}

function fetchDataAndUpdate(lat, lng) {
    const host = window.location.origin;

    // Build URL: host/click/lat/lng
    const url = `${host}/click/${lat}/${lng}`;

    // Send GET request
    fetch(url)
        .then(res => {
            if (!res.ok) throw new Error("Request failed: " + res.status);
            return res.json(); // or .json() if your server returns JSON
        })
        .then(data => {
            console.log(data);
            updatePollutantsFromData(data);
            updateWeatherFromData(data);
        })
        .catch(err => console.error(err));
}

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

                fetchDataAndUpdate(lat, lng);
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

        fetchDataAndUpdate(userLocation[0], userLocation[1]);

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

// Toggle Sidebar (guarded if removed)
const sidebar = document.getElementById('leftSidebar');
const toggleBtn = document.getElementById('toggleSidebar');
const toggleIcon = toggleBtn ? toggleBtn.querySelector('i') : null;

if (sidebar && toggleBtn && toggleIcon) {
    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        toggleBtn.classList.toggle('collapsed');
        
        if (sidebar.classList.contains('collapsed')) {
            toggleIcon.className = 'fas fa-chevron-right';
        } else {
            toggleIcon.className = 'fas fa-chevron-left';
        }
    });
}

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

        // Panel mode handling
        const mode = btn.getAttribute('data-mode');
        setInfoPanelMode(mode);
    });
});

function setInfoPanelMode(mode) {
    if (!infoPanel) return;

    // Always open panel for mode switches
    if (!infoPanel.classList.contains('open')) {
        infoPanel.classList.add('open');
        document.body.classList.add('info-open');
    }

    // Sections
    const city = document.getElementById('city-section');
    const weather = document.getElementById('weather-section');
    const pollutants = document.getElementById('pollutants-section');
    const forecast = document.getElementById('forecast-section');
    const lastUpdated = document.querySelector('.last-updated');

    // Reset all (show)
    [city, weather, pollutants, forecast, lastUpdated].forEach(el => {
        if (el) el.classList.remove('hidden');
    });
    // Also reset inner elements hidden in modes
    if (city) {
        const cityHeader = city.querySelector('.city-header');
        const healthAdvice = city.querySelector('.health-advice');
        if (cityHeader) cityHeader.classList.remove('hidden');
        if (healthAdvice) healthAdvice.classList.remove('hidden');
    }

    if (mode === 'air-quality') {
        if (weather) weather.classList.add('hidden');
        if (forecast) forecast.classList.add('hidden');
        // Keep AQI box visible but hide city header and health advice
        if (city) {
            const cityHeader = city.querySelector('.city-header');
            const healthAdvice = city.querySelector('.health-advice');
            if (cityHeader) cityHeader.classList.add('hidden');
            if (healthAdvice) healthAdvice.classList.add('hidden');
        }
        if (lastUpdated) lastUpdated.classList.add('hidden');
        // Focus on the AQI display box
        const aqiBox = city ? city.querySelector('.aqi-display') : null;
        if (aqiBox) {
            setTimeout(() => {
                aqiBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 300);
        }
        return;
    }

    if (mode === 'forecast') {
        // Hide other sections; show only 3-day forecast
        if (city) city.classList.add('hidden');
        if (weather) weather.classList.add('hidden');
        if (pollutants) pollutants.classList.add('hidden');
        if (lastUpdated) lastUpdated.classList.add('hidden');
        // Scroll to forecast
        if (forecast) {
            setTimeout(() => {
                forecast.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 300);
        }
        return;
    }

    if (mode === 'weather') {
        // Hide other sections; show only current weather
        if (city) city.classList.add('hidden');
        if (pollutants) pollutants.classList.add('hidden');
        if (forecast) forecast.classList.add('hidden');
        if (lastUpdated) lastUpdated.classList.add('hidden');
        // Scroll to weather section
        if (weather) {
            setTimeout(() => {
                weather.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 300);
        }
        return;
    }
}

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
                    window.map.invalidateSize();
                    window.map.flyTo([userLat, userLng], window.map.getZoom(), { animate: false, duration: 0 });
                    
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

// Time Slider (guarded; may not exist after sidebar removal)
const timeSlider = document.querySelector('.time-slider');
const currentTime = document.querySelector('.current-time');

if (timeSlider && currentTime) {
    timeSlider.addEventListener('input', (e) => {
        const hours = e.target.value;
        if (hours == 0) {
            currentTime.textContent = 'Now';
        } else {
            currentTime.textContent = `+${hours}h`;
        }
    });
}

// Play Button Animation
const playBtn = document.querySelector('.time-btn:nth-child(2)');
let isPlaying = false;

if (playBtn && timeSlider) {
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
}

function animateTimeline() {
    if (!isPlaying || !timeSlider) return;
    
    let currentValue = parseInt(timeSlider.value || '0');
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

// Simulate real-time updates (guarded for presence)
setInterval(() => {
    const lastUpdated = document.querySelector('.last-updated');
    if (!lastUpdated) return;
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
            }).addTo(window.map);
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

// Click HYBAU logo to refresh
const logoEl = document.querySelector('.logo');
if (logoEl) {
    logoEl.style.cursor = 'pointer';
    logoEl.addEventListener('click', () => {
        window.location.reload();
    });
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
    colors = ['#00e400', '#ffff00', '#ff7e00', '#ff0000', '#8f3f97'],
    availablePollutants = []
}) {
    const legend = document.querySelector(selector);
    if (!legend) {
        console.warn(`Legend container ${selector} not found.`);
        return;
    }

    // Create dropdown options
    const optionsHTML = availablePollutants.map(p => 
        `<option value="${p.key}" ${p.key === title.toLowerCase() ? 'selected' : ''}>${p.label}</option>`
    ).join('');

    legend.innerHTML = `
        <div class="legend-title">
            <label for="pollutant-select">Pollutant:</label>
            <select id="pollutant-select">${optionsHTML}</select>
            <span>(${unit})</span>
        </div>
        <div class="legend-scale" id="legend-scale"></div>
        <div id="legend-tooltip"></div>
        <div class="legend-labels">
            ${thresholds.map(v => `<span>${v}</span>`).join('')}
            <span>${maxValue}+</span>
        </div>
    `;

    const legendScale = legend.querySelector('#legend-scale');
    const tooltip = legend.querySelector('#legend-tooltip');

    const gradientStops = colors.map((c, i) => `${c} ${(i / (colors.length - 1)) * 100}%`).join(', ');
    legendScale.style.background = `linear-gradient(90deg, ${gradientStops})`;

    function getCategory(val) {
        for (let i = 0; i < thresholds.length; i++) {
            if (val <= thresholds[i]) return categories[i];
        }
        return categories[categories.length - 1];
    }

    legendScale.addEventListener('mousemove', (e) => {
        const scaleRect = legendScale.getBoundingClientRect();
        const legendRect = legend.getBoundingClientRect();
        const x = Math.max(0, Math.min(scaleRect.width, e.clientX - scaleRect.left));
        const frac = x / scaleRect.width;
        const est = Math.round(frac * maxValue);
        const label = getCategory(est);
        tooltip.innerHTML = label;
        tooltip.style.display = 'block';
        tooltip.style.left = `${e.clientX - legendRect.left}px`;
        tooltip.style.top = `${scaleRect.top - legendRect.top - (tooltip.offsetHeight || 24) - 8}px`;
        requestAnimationFrame(() => {
            tooltip.style.opacity = '1';
        });
    });

    legendScale.addEventListener('mouseleave', () => {
        tooltip.style.opacity = '0';
        setTimeout(() => { tooltip.style.display = 'none'; }, 160);
    });

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

    // Handle dropdown change
    const select = legend.querySelector('#pollutant-select');
    select.addEventListener('change', (e) => {
        const selectedKey = e.target.value;
        const config = LEGEND_CONFIGS[selectedKey];
        if (config) {
            createLegend({
                selector,
                ...config,
                availablePollutants
            });
        }
    });
}

function updateInfoCard(title, value, unit, detail) {
    const cards = document.querySelectorAll(".info-card");
    for (const card of cards) {
        const titleEl = card.querySelector(".info-card-title");
        if (titleEl && titleEl.textContent.includes(title)) {
            const valueEl = card.querySelector(".info-card-value");
            const unitEl = card.querySelector(".info-card-unit");
            const detailEl = card.querySelector(".info-card-detail");

            if (valueEl) valueEl.firstChild 
                ? valueEl.firstChild.textContent = value 
                : valueEl.prepend(document.createTextNode(value));

            if (unitEl) unitEl.textContent = unit || "";
            if (detailEl) detailEl.textContent = detail || "";
        }
    }
}

function addOrUpdatePollutant(name, value, unit) {
    const panel = document.getElementById('pollutants-section');
    if (!panel) return console.error("Panel with id 'pollutants-section' not found");

    // Try to find an existing pollutant item with the same name
    const existing = Array.from(panel.querySelectorAll('.pollutant-item'))
        .find(item => item.querySelector('.pollutant-name')?.textContent === name);

    if (existing) {
        // Update value if found
        existing.querySelector('.pollutant-value').textContent = `${value} ${unit || ''}`;
    } else {
        // Otherwise, create a new pollutant item
        const item = document.createElement('div');
        item.className = 'pollutant-item';
        item.innerHTML = `
            <span class="pollutant-name">${name}</span>
            <span class="pollutant-value">${value} ${unit || ''}</span>
        `;
        panel.appendChild(item);
    }
}

// City Search Function for Leaflet Map
// Add this to your script.js file

// Initialize search functionality
function initializeCitySearch() {
    const searchBar = document.querySelector('.search-bar');
    const searchResults = createSearchResultsDropdown();
    
    let searchTimeout;
    
    // Search on input
    searchBar.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();
        
        if (query.length < 2) {
            hideSearchResults();
            return;
        }
        
        // Debounce search requests
        searchTimeout = setTimeout(() => {
            searchCity(query);
        }, 300);
    });
    
    // Handle Enter key
    searchBar.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = e.target.value.trim();
            if (query.length >= 2) {
                searchCity(query);
            }
        }
    });
    
    // Close results when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchBar.contains(e.target) && !searchResults.contains(e.target)) {
            hideSearchResults();
        }
    });
}

// Create dropdown for search results
function createSearchResultsDropdown() {
    const existing = document.getElementById('search-results');
    if (existing) return existing;
    
    const dropdown = document.createElement('div');
    dropdown.id = 'search-results';
    dropdown.style.cssText = `
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: rgba(17, 24, 39, 0.98);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        margin-top: 8px;
        max-height: 300px;
        overflow-y: auto;
        display: none;
        z-index: 1000;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    `;
    
    const searchContainer = document.querySelector('.search-container');
    searchContainer.style.position = 'relative';
    searchContainer.appendChild(dropdown);
    
    return dropdown;
}

// Search for cities using Nominatim (OpenStreetMap)
async function searchCity(query) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?` +
            `format=json&q=${encodeURIComponent(query)}&` +
            `addressdetails=1&limit=5&featuretype=city`
        );
        
        if (!response.ok) throw new Error('Search failed');
        
        const results = await response.json();
        displaySearchResults(results);
        
    } catch (error) {
        console.error('City search error:', error);
        showSearchError();
    }
}

// Display search results
function displaySearchResults(results) {
    const dropdown = document.getElementById('search-results');
    
    if (!results || results.length === 0) {
        dropdown.innerHTML = `
            <div style="padding: 15px; color: rgba(255, 255, 255, 0.5); text-align: center;">
                No cities found
            </div>
        `;
        dropdown.style.display = 'block';
        return;
    }
    
    dropdown.innerHTML = results.map(result => {
        const city = result.address?.city || 
                     result.address?.town || 
                     result.address?.village || 
                     result.name;
        const country = result.address?.country || '';
        const state = result.address?.state || '';
        
        return `
            <div class="search-result-item" 
                 data-lat="${result.lat}" 
                 data-lon="${result.lon}"
                 data-name="${city}"
                 style="
                     padding: 12px 15px;
                     cursor: pointer;
                     border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                     transition: background 0.2s ease;
                 "
                 onmouseover="this.style.background='rgba(255, 255, 255, 0.1)'"
                 onmouseout="this.style.background='transparent'">
                <div style="font-size: 14px; font-weight: 500; color: #fff; margin-bottom: 4px;">
                    <i class="fas fa-map-marker-alt" style="margin-right: 8px; color: #667eea;"></i>
                    ${city}
                </div>
                <div style="font-size: 12px; color: rgba(255, 255, 255, 0.6);">
                    ${state ? state + ', ' : ''}${country}
                </div>
            </div>
        `;
    }).join('');
    
    dropdown.style.display = 'block';
    
    // Add click handlers to results
    dropdown.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', () => {
            const lat = parseFloat(item.dataset.lat);
            const lon = parseFloat(item.dataset.lon);
            const name = item.dataset.name;
            
            moveMarkerToCity(lat, lon, name);
            hideSearchResults();
            
            // Clear search bar
            document.querySelector('.search-bar').value = name;
        });
    });
}

// Move marker to selected city
function moveMarkerToCity(lat, lon, cityName) {
    if (!window.map) {
        console.error('Map not initialized');
        return;
    }
    
    // Remove existing markers
    if (window.marker) {
        window.map.removeLayer(window.marker);
    }
    if (window.userLocationMarker) {
        window.map.removeLayer(window.userLocationMarker);
        window.userLocationMarker = null;
    }
    
    // Create custom icon for the marker
    const markerIcon = L.divIcon({
        className: 'user-location-marker',
        html: '<div style="background-color:rgb(48, 35, 197); width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });
    
    // Add new marker
    window.marker = L.marker([lat, lon], { icon: markerIcon })
        .addTo(window.map)
        .bindPopup(`
            <div style="text-align: center;">
                <strong>${cityName}</strong><br>
                Lat: ${lat.toFixed(4)}<br>
                Lon: ${lon.toFixed(4)}
            </div>
        `)
        .openPopup();
    
    // Fly to location with animation
    window.map.flyTo([lat, lon], 10, {
        duration: 1.5,
        easeLinearity: 0.5
    });
    
    // Fetch and update data for this location
    fetchDataAndUpdate(lat, lon);
    
    // Open info panel if not already open
    const infoPanel = document.getElementById('info-panel');
    if (infoPanel && !infoPanel.classList.contains('open')) {
        infoPanel.classList.add('open');
        document.body.classList.add('info-open');
    }
    
    console.log(`Moved to ${cityName}: ${lat}, ${lon}`);
}

// Hide search results
function hideSearchResults() {
    const dropdown = document.getElementById('search-results');
    if (dropdown) {
        dropdown.style.display = 'none';
    }
}

// Show error message
function showSearchError() {
    const dropdown = document.getElementById('search-results');
    dropdown.innerHTML = `
        <div style="padding: 15px; color: rgba(255, 100, 100, 0.8); text-align: center;">
            <i class="fas fa-exclamation-triangle" style="margin-right: 8px;"></i>
            Search error. Please try again.
        </div>
    `;
    dropdown.style.display = 'block';
}

// Light mode styling for search results
function updateSearchResultsTheme() {
    const dropdown = document.getElementById('search-results');
    if (dropdown) {
        const isLightMode = document.body.classList.contains('light-mode');
        if (isLightMode) {
            dropdown.style.background = 'rgba(255, 255, 255, 0.98)';
            dropdown.style.borderColor = 'rgba(0, 0, 0, 0.1)';
        } else {
            dropdown.style.background = 'rgba(17, 24, 39, 0.98)';
            dropdown.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for map to initialize
    setTimeout(() => {
        initializeCitySearch();
    }, 500);
});

// Update theme when toggled
const themeToggle = document.getElementById('theme-toggle');
if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        setTimeout(updateSearchResultsTheme, 100);
    });
}

// Add 72h Forecast Sliders to Air Quality and Weather Tabs
// Add this to your script.js file

// Global variables to store forecast data
let forecastAirData = null;
let forecastWeatherData = null;
let currentAirForecastHour = 0;
let currentWeatherForecastHour = 0;

// Store current (present) data
let currentAirData = null;
let currentWeatherData = null;

// Function to update forecast data from API response
function updateForecastDataWithSliders(data) {
    console.log('Updating forecast data with sliders:', data);
    
    // Store current data
    if (data.air_pollutant) {
        currentAirData = data.air_pollutant;
    }
    if (data.weather) {
        currentWeatherData = data.weather;
    }
    
    // Store forecast data
    if (data.prediction_air) {
        forecastAirData = typeof data.prediction_air === 'string' 
            ? JSON.parse(data.prediction_air) 
            : data.prediction_air;
        console.log('Forecast Air Data loaded');
    }
    
    if (data.prediction_weather) {
        forecastWeatherData = typeof data.prediction_weather === 'string' 
            ? JSON.parse(data.prediction_weather) 
            : data.prediction_weather;
        console.log('Forecast Weather Data loaded');
    }
    
    // Add sliders to both tabs
    if (forecastAirData) {
        addAirQualitySlider();
    }
    if (forecastWeatherData) {
        addWeatherSlider();
    }
}

// Add slider to Air Quality section
function addAirQualitySlider() {
    const pollutantsSection = document.getElementById('pollutants-section');
    if (!pollutantsSection) return;
    
    // Check if slider already exists
    let sliderContainer = document.getElementById('air-forecast-slider-container');
    
    if (!sliderContainer) {
        // Create slider container
        sliderContainer = document.createElement('div');
        sliderContainer.id = 'air-forecast-slider-container';
        sliderContainer.style.cssText = 'margin-top: 25px; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.1);';
        
        sliderContainer.innerHTML = `
            <h3 style="font-size: 1rem; margin-bottom: 15px; color: rgba(255, 255, 255, 0.8);">
                📊 72-Hour Forecast
            </h3>
            
            <div class="time-control">
                <div class="time-display">
                    <span class="current-time" id="air-forecast-time">Current</span>
                    <span class="forecast-badge" id="air-forecast-hours">Now</span>
                </div>
                <input type="range" class="time-slider" id="air-forecast-slider" 
                       min="0" max="72" value="0" step="1">
                <div class="time-controls">
                    <button class="time-btn" id="air-forecast-prev">
                        <i class="fas fa-step-backward"></i>
                    </button>
                    <button class="time-btn" id="air-forecast-play">
                        <i class="fas fa-play"></i>
                    </button>
                    <button class="time-btn" id="air-forecast-next">
                        <i class="fas fa-step-forward"></i>
                    </button>
                </div>
            </div>
            
            <div class="info-grid" id="air-forecast-data" style="margin-top: 15px;">
                <!-- Forecast data will be shown here -->
            </div>
        `;
        
        pollutantsSection.appendChild(sliderContainer);
    }
    
    // Setup controls
    setupAirForecastControls();
    updateAirForecastDisplay(0); // Show current data initially
}

// Add slider to Weather section
function addWeatherSlider() {
    const weatherSection = document.getElementById('weather-section');
    if (!weatherSection) return;
    
    // Check if slider already exists
    let sliderContainer = document.getElementById('weather-forecast-slider-container');
    
    if (!sliderContainer) {
        // Create slider container
        sliderContainer = document.createElement('div');
        sliderContainer.id = 'weather-forecast-slider-container';
        sliderContainer.style.cssText = 'margin-top: 25px; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.1);';
        
        sliderContainer.innerHTML = `
            <h3 style="font-size: 1rem; margin-bottom: 15px; color: rgba(255, 255, 255, 0.8);">
                📊 72-Hour Forecast
            </h3>
            
            <div class="time-control">
                <div class="time-display">
                    <span class="current-time" id="weather-forecast-time">Current</span>
                    <span class="forecast-badge" id="weather-forecast-hours">Now</span>
                </div>
                <input type="range" class="time-slider" id="weather-forecast-slider" 
                       min="0" max="72" value="0" step="1">
                <div class="time-controls">
                    <button class="time-btn" id="weather-forecast-prev">
                        <i class="fas fa-step-backward"></i>
                    </button>
                    <button class="time-btn" id="weather-forecast-play">
                        <i class="fas fa-play"></i>
                    </button>
                    <button class="time-btn" id="weather-forecast-next">
                        <i class="fas fa-step-forward"></i>
                    </button>
                </div>
            </div>
            
            <div class="info-grid" id="weather-forecast-data" style="margin-top: 15px;">
                <!-- Forecast data will be shown here -->
            </div>
        `;
        
        weatherSection.appendChild(sliderContainer);
    }
    
    // Setup controls
    setupWeatherForecastControls();
    updateWeatherForecastDisplay(0); // Show current data initially
}

// Setup Air Quality forecast controls
function setupAirForecastControls() {
    const slider = document.getElementById('air-forecast-slider');
    const playBtn = document.getElementById('air-forecast-play');
    const prevBtn = document.getElementById('air-forecast-prev');
    const nextBtn = document.getElementById('air-forecast-next');
    
    let isPlaying = false;
    let playInterval = null;
    
    if (slider) {
        slider.addEventListener('input', (e) => {
            currentAirForecastHour = parseInt(e.target.value);
            updateAirForecastDisplay(currentAirForecastHour);
        });
    }
    
    if (playBtn) {
        playBtn.addEventListener('click', () => {
            isPlaying = !isPlaying;
            const icon = playBtn.querySelector('i');
            
            if (isPlaying) {
                icon.className = 'fas fa-pause';
                playInterval = setInterval(() => {
                    if (currentAirForecastHour >= 72) {
                        currentAirForecastHour = 0;
                    } else {
                        currentAirForecastHour++;
                    }
                    slider.value = currentAirForecastHour;
                    updateAirForecastDisplay(currentAirForecastHour);
                }, 500);
            } else {
                icon.className = 'fas fa-play';
                clearInterval(playInterval);
            }
        });
    }
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentAirForecastHour > 0) {
                currentAirForecastHour--;
                slider.value = currentAirForecastHour;
                updateAirForecastDisplay(currentAirForecastHour);
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentAirForecastHour < 72) {
                currentAirForecastHour++;
                slider.value = currentAirForecastHour;
                updateAirForecastDisplay(currentAirForecastHour);
            }
        });
    }
}

// Setup Weather forecast controls
function setupWeatherForecastControls() {
    const slider = document.getElementById('weather-forecast-slider');
    const playBtn = document.getElementById('weather-forecast-play');
    const prevBtn = document.getElementById('weather-forecast-prev');
    const nextBtn = document.getElementById('weather-forecast-next');
    
    let isPlaying = false;
    let playInterval = null;
    
    if (slider) {
        slider.addEventListener('input', (e) => {
            currentWeatherForecastHour = parseInt(e.target.value);
            updateWeatherForecastDisplay(currentWeatherForecastHour);
        });
    }
    
    if (playBtn) {
        playBtn.addEventListener('click', () => {
            isPlaying = !isPlaying;
            const icon = playBtn.querySelector('i');
            
            if (isPlaying) {
                icon.className = 'fas fa-pause';
                playInterval = setInterval(() => {
                    if (currentWeatherForecastHour >= 72) {
                        currentWeatherForecastHour = 0;
                    } else {
                        currentWeatherForecastHour++;
                    }
                    slider.value = currentWeatherForecastHour;
                    updateWeatherForecastDisplay(currentWeatherForecastHour);
                }, 500);
            } else {
                icon.className = 'fas fa-play';
                clearInterval(playInterval);
            }
        });
    }
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentWeatherForecastHour > 0) {
                currentWeatherForecastHour--;
                slider.value = currentWeatherForecastHour;
                updateWeatherForecastDisplay(currentWeatherForecastHour);
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentWeatherForecastHour < 72) {
                currentWeatherForecastHour++;
                slider.value = currentWeatherForecastHour;
                updateWeatherForecastDisplay(currentWeatherForecastHour);
            }
        });
    }
}

// Update Air Quality forecast display
function updateAirForecastDisplay(hourIndex) {
    const timeDisplay = document.getElementById('air-forecast-time');
    const hoursDisplay = document.getElementById('air-forecast-hours');
    const dataGrid = document.getElementById('air-forecast-data');
    
    if (!dataGrid) return;
    
    // Update time display
    if (hourIndex === 0) {
        if (timeDisplay) timeDisplay.textContent = 'Current';
        if (hoursDisplay) hoursDisplay.textContent = 'Now';
    } else {
        const futureDate = new Date();
        futureDate.setHours(futureDate.getHours() + hourIndex);
        
        const dateStr = futureDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const timeStr = futureDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
        
        if (timeDisplay) timeDisplay.textContent = `${dateStr} ${timeStr}`;
        if (hoursDisplay) hoursDisplay.textContent = `+${hourIndex}h`;
    }
    
    // Get values (current or forecast)
    const getValue = (key) => {
        if (hourIndex === 0 && currentAirData && currentAirData.hourly && currentAirData.hourly[key]) {
            // Use current data
            return currentAirData.hourly[key][currentAirData.hourly[key].length - 1];
        } else if (forecastAirData && forecastAirData[key]) {
            // Use forecast data
            const values = Object.values(forecastAirData[key]);
            return values[hourIndex - 1] !== undefined ? values[hourIndex - 1] : '--';
        }
        return '--';
    };
    
    const pm25 = getValue('pm2_5');
    const pm10 = getValue('pm10');
    const co = getValue('carbon_monoxide');
    const no2 = getValue('nitrogen_dioxide');
    const o3 = getValue('ozone');
    const so2 = getValue('sulphur_dioxide');
    
    dataGrid.innerHTML = `
        <div class="info-card">
            <div class="info-card-title">PM2.5</div>
            <div class="info-card-value">
                ${typeof pm25 === 'number' ? pm25.toFixed(1) : pm25}
                <span class="info-card-unit">μg/m³</span>
            </div>
        </div>
        
        <div class="info-card">
            <div class="info-card-title">PM10</div>
            <div class="info-card-value">
                ${typeof pm10 === 'number' ? pm10.toFixed(1) : pm10}
                <span class="info-card-unit">μg/m³</span>
            </div>
        </div>
        
        <div class="info-card">
            <div class="info-card-title">CO</div>
            <div class="info-card-value">
                ${typeof co === 'number' ? co.toFixed(0) : co}
                <span class="info-card-unit">μg/m³</span>
            </div>
        </div>
        
        <div class="info-card">
            <div class="info-card-title">NO₂</div>
            <div class="info-card-value">
                ${typeof no2 === 'number' ? no2.toFixed(1) : no2}
                <span class="info-card-unit">μg/m³</span>
            </div>
        </div>
        
        <div class="info-card">
            <div class="info-card-title">O₃</div>
            <div class="info-card-value">
                ${typeof o3 === 'number' ? o3.toFixed(1) : o3}
                <span class="info-card-unit">μg/m³</span>
            </div>
        </div>
        
        <div class="info-card">
            <div class="info-card-title">SO₂</div>
            <div class="info-card-value">
                ${typeof so2 === 'number' ? so2.toFixed(1) : so2}
                <span class="info-card-unit">μg/m³</span>
            </div>
        </div>
    `;
}

// Update Weather forecast display
function updateWeatherForecastDisplay(hourIndex) {
    const timeDisplay = document.getElementById('weather-forecast-time');
    const hoursDisplay = document.getElementById('weather-forecast-hours');
    const dataGrid = document.getElementById('weather-forecast-data');
    
    if (!dataGrid) return;
    
    // Update time display
    if (hourIndex === 0) {
        if (timeDisplay) timeDisplay.textContent = 'Current';
        if (hoursDisplay) hoursDisplay.textContent = 'Now';
    } else {
        const futureDate = new Date();
        futureDate.setHours(futureDate.getHours() + hourIndex);
        
        const dateStr = futureDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const timeStr = futureDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
        
        if (timeDisplay) timeDisplay.textContent = `${dateStr} ${timeStr}`;
        if (hoursDisplay) hoursDisplay.textContent = `+${hourIndex}h`;
    }
    
    // Get values (current or forecast)
    const getValue = (key) => {
        if (hourIndex === 0 && currentWeatherData && currentWeatherData.hourly && currentWeatherData.hourly[key]) {
            // Use current data
            return currentWeatherData.hourly[key][currentWeatherData.hourly[key].length - 1];
        } else if (forecastWeatherData && forecastWeatherData[key]) {
            // Use forecast data
            const values = Object.values(forecastWeatherData[key]);
            return values[hourIndex - 1] !== undefined ? values[hourIndex - 1] : '--';
        }
        return '--';
    };
    
    const temp = getValue('temperature_2m');
    const humidity = getValue('relative_humidity_2m');
    const windSpeed = getValue('wind_speed_10m');
    const windDir = getValue('wind_direction_10m');
    const precipitation = getValue('precipitation');
    const cloudCover = getValue('cloud_cover');
    const pressure = getValue('surface_pressure');
    
    dataGrid.innerHTML = `
        <div class="info-card">
            <div class="info-card-title">🌡️ Temperature</div>
            <div class="info-card-value">
                ${typeof temp === 'number' ? temp.toFixed(1) : temp}
                <span class="info-card-unit">°C</span>
            </div>
            <div class="info-card-detail">
                ${typeof temp === 'number' ? `Feels like ${(temp + 2).toFixed(1)}°C` : 'N/A'}
            </div>
        </div>
        
        <div class="info-card">
            <div class="info-card-title">💧 Humidity</div>
            <div class="info-card-value">
                ${typeof humidity === 'number' ? humidity.toFixed(0) : humidity}
                <span class="info-card-unit">%</span>
            </div>
            <div class="info-card-detail">
                ${typeof humidity === 'number' && typeof temp === 'number' 
                    ? `Dew point ${((humidity / 100) * temp).toFixed(1)}°C` 
                    : 'N/A'}
            </div>
        </div>
        
        <div class="info-card">
            <div class="info-card-title">💨 Wind Speed</div>
            <div class="info-card-value">
                ${typeof windSpeed === 'number' ? windSpeed.toFixed(1) : windSpeed}
                <span class="info-card-unit">km/h</span>
            </div>
            <div class="info-card-detail">
                Direction: ${typeof windDir === 'number' ? windDir.toFixed(0) : windDir}°
            </div>
        </div>
        
        <div class="info-card">
            <div class="info-card-title">🌧️ Precipitation</div>
            <div class="info-card-value">
                ${typeof precipitation === 'number' ? precipitation.toFixed(1) : precipitation}
                <span class="info-card-unit">mm</span>
            </div>
            <div class="info-card-detail">
                Cloud: ${typeof cloudCover === 'number' ? cloudCover.toFixed(0) : cloudCover}%
            </div>
        </div>
        
        <div class="info-card">
            <div class="info-card-title">☁️ Cloud Cover</div>
            <div class="info-card-value">
                ${typeof cloudCover === 'number' ? cloudCover.toFixed(0) : cloudCover}
                <span class="info-card-unit">%</span>
            </div>
            <div class="info-card-detail">
                ${typeof cloudCover === 'number' 
                    ? (cloudCover > 80 ? 'Mostly cloudy' : 'Partly cloudy') 
                    : 'N/A'}
            </div>
        </div>
        
        <div class="info-card">
            <div class="info-card-title">🧭 Pressure</div>
            <div class="info-card-value">
                ${typeof pressure === 'number' ? pressure.toFixed(0) : pressure}
                <span class="info-card-unit">hPa</span>
            </div>
            <div class="info-card-detail">
                ${typeof pressure === 'number' 
                    ? (pressure > 1013 ? 'High pressure' : 'Low pressure') 
                    : 'N/A'}
            </div>
        </div>
    `;
}

// Modified fetchDataAndUpdate to include slider updates
function fetchDataAndUpdateWithSliders(lat, lng) {
    const host = window.location.origin;
    const url = `${host}/click/${lat}/${lng}`;

    fetch(url)
        .then(res => {
            if (!res.ok) throw new Error("Request failed: " + res.status);
            return res.json();
        })
        .then(data => {
            console.log('API Response:', data);
            
            // Update current data
            if (typeof updatePollutantsFromData === 'function') {
                updatePollutantsFromData(data);
            }
            if (typeof updateWeatherFromData === 'function') {
                updateWeatherFromData(data);
            }
            
            // Update forecast sliders
            updateForecastDataWithSliders(data);
        })
        .catch(err => console.error('Fetch error:', err));
}

// Override fetchDataAndUpdate
window.fetchDataAndUpdate = fetchDataAndUpdateWithSliders;
fetchDataAndUpdate = fetchDataAndUpdateWithSliders