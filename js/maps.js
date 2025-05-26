// DOM Elements
const locationInput = document.getElementById('location-input');
const searchBtn = document.getElementById('search-btn');
const errorMessage = document.getElementById('error-message');
const loadingSpinner = document.getElementById('loading-spinner');
const themeToggle = document.getElementById('theme-toggle');

// API Configuration
const API_KEY = '1fa9ff4126d95b8db54f3897a208e91c';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Map Configuration
let map;
let marker;

// Initialize Map
function initMap() {
    map = L.map('map').setView([0, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
}

// Theme Management
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeToggleIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeToggleIcon(newTheme);
}

function updateThemeToggleIcon(theme) {
    const icon = themeToggle.querySelector('i');
    const text = themeToggle.querySelector('span');
    if (theme === 'dark') {
        icon.className = 'fas fa-sun';
        text.textContent = 'Light Mode';
    } else {
        icon.className = 'fas fa-moon';
        text.textContent = 'Dark Mode';
    }
}

// Weather Data Functions
async function getWeatherData(location) {
    try {
        showLoading();
        const weatherData = await fetchCurrentWeather(location);
        updateMap(weatherData);
        saveToHistory(location);
        hideLoading();
    } catch (error) {
        showError(error.message);
        hideLoading();
    }
}

async function fetchCurrentWeather(location) {
    const response = await fetch(`${BASE_URL}/weather?q=${location}&appid=${API_KEY}&units=metric`);
    if (!response.ok) {
        throw new Error('Location not found. Please try again.');
    }
    return await response.json();
}

function updateMap(weatherData) {
    const { lat, lon } = weatherData.coord;
    const { temp, humidity, pressure } = weatherData.main;
    const { description, icon } = weatherData.weather[0];
    const { speed } = weatherData.wind;

    // Update map view
    map.setView([lat, lon], 10);

    // Remove existing marker if any
    if (marker) {
        map.removeLayer(marker);
    }

    // Add new marker with popup
    marker = L.marker([lat, lon]).addTo(map);
    marker.bindPopup(`
        <div class="map-popup">
            <h3>${weatherData.name}</h3>
            <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${description}">
            <p class="temp">${Math.round(temp)}°C</p>
            <p class="description">${description}</p>
            <div class="details">
                <p>Humidity: ${humidity}%</p>
                <p>Pressure: ${pressure} hPa</p>
                <p>Wind: ${speed} m/s</p>
            </div>
        </div>
    `).openPopup();
}

// History Management
function saveToHistory(location) {
    const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    const timestamp = new Date().toISOString();

    // Check if this location is already in history
    const isDuplicate = history.some(entry => entry.location.toLowerCase() === location.toLowerCase());

    // Only add if it's not a duplicate
    if (!isDuplicate) {
        // Add new search to history
        history.unshift({ location, timestamp });

        // Keep only last 10 searches
        if (history.length > 10) {
            history.pop();
        }

        localStorage.setItem('searchHistory', JSON.stringify(history));
    }
}

// Utility Functions
function showLoading() {
    loadingSpinner.style.display = 'flex';
}

function hideLoading() {
    loadingSpinner.style.display = 'none';
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 3000);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    initTheme();
    const lastLocation = localStorage.getItem('lastLocation');
    if (lastLocation) {
        locationInput.value = lastLocation;
        getWeatherData(lastLocation);
    }
});

searchBtn.addEventListener('click', () => {
    const location = locationInput.value.trim();
    if (location) {
        getWeatherData(location);
        localStorage.setItem('lastLocation', location);
    } else {
        showError('Please enter a location');
    }
});

locationInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchBtn.click();
    }
});

themeToggle.addEventListener('click', toggleTheme); 