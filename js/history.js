// DOM Elements
const locationInput = document.getElementById('location-input');
const searchBtn = document.getElementById('search-btn');
const errorMessage = document.getElementById('error-message');
const historyList = document.getElementById('history-list');
const clearHistoryBtn = document.getElementById('clear-history');
const loadingSpinner = document.getElementById('loading-spinner');
const themeToggle = document.getElementById('theme-toggle');

// API Configuration
const API_KEY = '1fa9ff4126d95b8db54f3897a208e91c';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

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

// History Management
function loadHistory() {
    const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    displayHistory(history);
}

function displayHistory(history) {
    if (history.length === 0) {
        historyList.innerHTML = '<div class="no-history">No search history available</div>';
        return;
    }

    historyList.innerHTML = history.map(item => `
        <div class="history-item">
            <div class="history-info">
                <h3>${item.location}</h3>
                <span class="timestamp">${formatDate(item.timestamp)}</span>
            </div>
            <div class="history-actions">
                <button class="search-again" onclick="searchLocation('${item.location}')">
                    <i class="fas fa-search"></i>
                </button>
                <button class="delete-item" onclick="deleteHistoryItem('${item.timestamp}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function clearHistory() {
    localStorage.removeItem('searchHistory');
    loadHistory();
}

function deleteHistoryItem(timestamp) {
    const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    const updatedHistory = history.filter(item => item.timestamp !== timestamp);
    localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
    loadHistory();
}

function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function searchLocation(location) {
    locationInput.value = location;
    getWeatherData(location);
}

// Weather Data Functions
async function getWeatherData(location) {
    try {
        showLoading();
        const data = await fetchCurrentWeather(location);
        displayCurrentWeather(data);
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

function displayCurrentWeather(data) {
    const { temp } = data.main;
    const { description, icon } = data.weather[0];

    // Update the current weather display
    const currentWeather = document.getElementById('current-weather');
    if (currentWeather) {
        currentWeather.innerHTML = `
            <div class="current-location">
                <h2>${data.name}, ${data.sys.country}</h2>
                <p class="current-date">${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            <div class="current-weather-info">
                <div class="weather-main">
                    <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${description}">
                    <div class="temperature">
                        <h1>${Math.round(temp)}°C</h1>
                        <p class="description">${description}</p>
                    </div>
                </div>
            </div>
        `;
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
    initTheme();
    loadHistory();
});

searchBtn.addEventListener('click', () => {
    const location = locationInput.value.trim();
    if (location) {
        getWeatherData(location);
    } else {
        showError('Please enter a location');
    }
});

locationInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchBtn.click();
    }
});

clearHistoryBtn.addEventListener('click', clearHistory);

themeToggle.addEventListener('click', toggleTheme); 