// JavaScript for interactive elements

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