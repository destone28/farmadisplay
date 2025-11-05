// FarmaDisplay - Display Page Application
// Ultra-lightweight vanilla JS (<10KB)

// Configuration
const API_URL = 'https://api.farmadisplay.com/api/v1';
const PHARMACY_ID = new URLSearchParams(window.location.search).get('id') || 'PHARMACY_ID_HERE';
const REFRESH_INTERVAL = 60000; // 60 seconds
const HEARTBEAT_INTERVAL = 300000; // 5 minutes

// State
let displayData = null;
let isOnline = navigator.onLine;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeClock();
    initializeServiceWorker();
    loadDisplayData();
    setupHeartbeat();
    setupNetworkListeners();

    // Auto-refresh
    setInterval(loadDisplayData, REFRESH_INTERVAL);
});

// Clock Update
function initializeClock() {
    function updateClock() {
        const now = new Date();

        // Time
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        document.getElementById('clock').textContent = `${hours}:${minutes}`;

        // Date
        const days = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
        const months = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
        const dayName = days[now.getDay()];
        const day = now.getDate();
        const month = months[now.getMonth()];
        const year = now.getFullYear();

        document.getElementById('date').textContent = `${dayName}, ${day} ${month} ${year}`;
    }

    updateClock();
    setInterval(updateClock, 1000);
}

// Load Display Data
async function loadDisplayData() {
    try {
        const response = await fetch(`${API_URL}/display/${PHARMACY_ID}`);

        if (!response.ok) {
            throw new Error('Failed to fetch display data');
        }

        displayData = await response.json();

        // Save to cache for offline use
        await saveToCache(displayData);

        // Render data
        renderPharmacyInfo(displayData.pharmacy);
        renderShifts(displayData.current_shifts);
        renderNearbyPharmacies(displayData.nearby_pharmacies);

        setOnlineStatus(true);

    } catch (error) {
        console.error('Error loading display data:', error);

        // Try to load from cache
        const cachedData = await loadFromCache();
        if (cachedData) {
            displayData = cachedData;
            renderPharmacyInfo(cachedData.pharmacy);
            renderShifts(cachedData.current_shifts);
            renderNearbyPharmacies(cachedData.nearby_pharmacies);
        }

        setOnlineStatus(false);
    }
}

// Render Functions
function renderPharmacyInfo(pharmacy) {
    if (!pharmacy) return;

    document.getElementById('pharmacy-name').textContent = pharmacy.name;

    if (pharmacy.logo_url) {
        document.getElementById('pharmacy-logo').src = pharmacy.logo_url;
    }
}

function renderShifts(shifts) {
    const container = document.getElementById('shifts-list');

    if (!shifts || shifts.length === 0) {
        container.innerHTML = '<div class="loading">Nessun turno disponibile</div>';
        return;
    }

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    container.innerHTML = shifts.map(shift => {
        const isCurrent = shift.start_time <= currentTime && shift.end_time >= currentTime;

        return `
            <div class="shift-card ${isCurrent ? 'shift-current' : ''}">
                <div class="shift-time">${shift.start_time} - ${shift.end_time}</div>
                <div class="shift-date">${formatDate(shift.date)}</div>
                ${shift.notes ? `<div class="shift-notes">${shift.notes}</div>` : ''}
            </div>
        `;
    }).join('');
}

function renderNearbyPharmacies(pharmacies) {
    const container = document.getElementById('nearby-pharmacies');

    if (!pharmacies || pharmacies.length === 0) {
        container.innerHTML = '<div class="loading">Nessuna farmacia nelle vicinanze</div>';
        return;
    }

    container.innerHTML = pharmacies.slice(0, 10).map(pharmacy => `
        <div class="pharmacy-card">
            <div class="pharmacy-info">
                <h3>${pharmacy.name}</h3>
                <p>${pharmacy.address || ''} - ${pharmacy.city || ''}</p>
            </div>
            <div class="pharmacy-distance">
                ${(pharmacy.distance_meters / 1000).toFixed(1)} km
            </div>
        </div>
    `).join('');
}

// Cache Management (LocalStorage)
async function saveToCache(data) {
    try {
        localStorage.setItem('display_cache', JSON.stringify({
            data,
            timestamp: Date.now()
        }));
    } catch (error) {
        console.error('Error saving to cache:', error);
    }
}

async function loadFromCache() {
    try {
        const cached = localStorage.getItem('display_cache');
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            // Cache valid for 24 hours
            if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
                return data;
            }
        }
    } catch (error) {
        console.error('Error loading from cache:', error);
    }
    return null;
}

// Service Worker
async function initializeServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            await navigator.serviceWorker.register('sw.js');
            console.log('Service Worker registered');
        } catch (error) {
            console.error('Service Worker registration failed:', error);
        }
    }
}

// Network Status
function setupNetworkListeners() {
    window.addEventListener('online', () => {
        setOnlineStatus(true);
        loadDisplayData();
    });

    window.addEventListener('offline', () => {
        setOnlineStatus(false);
    });
}

function setOnlineStatus(online) {
    isOnline = online;
    const badge = document.getElementById('offline-badge');
    if (online) {
        badge.classList.add('hidden');
    } else {
        badge.classList.remove('hidden');
    }
}

// Device Heartbeat
async function setupHeartbeat() {
    async function sendHeartbeat() {
        if (!isOnline) return;

        try {
            const deviceId = localStorage.getItem('device_id');
            if (!deviceId) return;

            await fetch(`${API_URL}/devices/${deviceId}/heartbeat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    serial_number: deviceId,
                    status: 'active',
                    firmware_version: '1.0.0'
                })
            });
        } catch (error) {
            console.error('Heartbeat failed:', error);
        }
    }

    // Send immediate heartbeat
    sendHeartbeat();

    // Setup interval
    setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
}

// Utility Functions
function formatDate(dateString) {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}
