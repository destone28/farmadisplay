// FarmaDisplay - Display Page Application
// Ultra-lightweight vanilla JS (<10KB)

const API_BASE_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:8000/api/v1'
    : '/api/v1';

const REFRESH_INTERVAL = 60000; // 1 minute
let refreshTimer = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initClock();
    loadShifts();
    startAutoRefresh();
    registerServiceWorker();
});

// Clock functionality
function initClock() {
    const clockElement = document.getElementById('clock');

    function updateClock() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('it-IT', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        const dateString = now.toLocaleDateString('it-IT', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        clockElement.textContent = `${dateString} - ${timeString}`;
    }

    updateClock();
    setInterval(updateClock, 1000);
}

// Load shifts from API
async function loadShifts() {
    showLoading();

    try {
        const response = await fetch(`${API_BASE_URL}/shifts/active`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        renderShifts(data);
        showContent();
    } catch (error) {
        console.error('Error loading shifts:', error);
        showError('Impossibile caricare i turni. Riprovo automaticamente...');
    }
}

// Render shifts
function renderShifts(data) {
    const todayContainer = document.getElementById('today-shifts');
    const upcomingContainer = document.getElementById('upcoming-shifts');

    // Clear existing content
    todayContainer.innerHTML = '';
    upcomingContainer.innerHTML = '';

    // Render today's shifts
    if (data.today && data.today.length > 0) {
        todayContainer.innerHTML = data.today.map(shift => createShiftCard(shift, true)).join('');
    } else {
        todayContainer.innerHTML = '<p>Nessun turno oggi</p>';
    }

    // Render upcoming shifts
    if (data.upcoming && data.upcoming.length > 0) {
        upcomingContainer.innerHTML = data.upcoming.map(shift => createShiftCard(shift, false)).join('');
    } else {
        upcomingContainer.innerHTML = '<p>Nessun turno programmato</p>';
    }
}

// Create shift card HTML
function createShiftCard(shift, isToday) {
    const className = isToday ? 'shift-card today' : 'shift-card';
    return `
        <div class="${className}">
            <h3>${shift.pharmacy_name}</h3>
            <p class="address">${shift.address}</p>
            <p class="date">${formatDate(shift.date)}</p>
            ${shift.phone ? `<p class="phone">📞 ${shift.phone}</p>` : ''}
        </div>
    `;
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// UI State Management
function showLoading() {
    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('error').classList.add('hidden');
    document.getElementById('content').classList.add('hidden');
}

function showContent() {
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('error').classList.add('hidden');
    document.getElementById('content').classList.remove('hidden');
}

function showError(message) {
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('error').classList.remove('hidden');
    document.getElementById('error-message').textContent = message;
    document.getElementById('content').classList.add('hidden');
}

// Auto-refresh
function startAutoRefresh() {
    refreshTimer = setInterval(loadShifts, REFRESH_INTERVAL);
}

// Service Worker Registration
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('Service Worker registered:', reg))
            .catch(err => console.error('Service Worker registration failed:', err));
    }
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (refreshTimer) {
        clearInterval(refreshTimer);
    }
});
