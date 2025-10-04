// JavaScript for interactive elements

// Initialize Leaflet map
document.addEventListener('DOMContentLoaded', () => {
    const mapContainer = document.getElementById('map');
    if (mapContainer && typeof L !== 'undefined') {
        var map = L.map('map', {
            // TODO: ASK USER LOCATION
            center: [21.0278, 105.8342], // Hanoi
            zoom: 7,
            minZoom: 3,
            maxZoom: 7,
        });
        map.setMaxBounds([
            [-90, -Infinity],
            [90, Infinity]
        ]);
        map.options.maxBoundsViscosity = 1.0;
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            noWrap: false
        }).addTo(map);
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
    });
});

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
