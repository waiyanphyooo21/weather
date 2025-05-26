// DOM Elements
const locationInput = document.getElementById('location-input');
const searchBtn = document.getElementById('search-btn');
const errorMessage = document.getElementById('error-message');
const loadingSpinner = document.getElementById('loading-spinner');
const themeToggle = document.getElementById('theme-toggle');
const hourlyForecast = document.getElementById('hourly-forecast');
const dailyForecast = document.getElementById('daily-forecast');

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

// Weather Data Functions
async function getWeatherData(location) {
    try {
        showLoading();
        const [currentData, forecastData] = await Promise.all([
            fetchCurrentWeather(location),
            fetchForecast(location)
        ]);
        displayCurrentWeather(currentData);
        displayHourlyForecast(forecastData);
        displayDailyForecast(forecastData);
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

async function fetchForecast(location) {
    const response = await fetch(`${BASE_URL}/forecast?q=${location}&appid=${API_KEY}&units=metric`);
    if (!response.ok) {
        throw new Error('Forecast data not available.');
    }
    return await response.json();
}

function displayCurrentWeather(data) {
    const { temp } = data.main;
    const { description, icon } = data.weather[0];

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

function displayHourlyForecast(data) {
    const hourlyData = data.list.slice(0, 24); // Get next 24 hours
    const hourlyGrid = document.createElement('div');
    hourlyGrid.className = 'hourly-grid';

    hourlyGrid.innerHTML = hourlyData.map(item => {
        const date = new Date(item.dt * 1000);
        const hour = date.getHours();
        const { temp } = item.main;
        const { description, icon } = item.weather[0];

        return `
            <div class="hourly-card">
                <div class="hour">${hour}:00</div>
                <img src="https://openweathermap.org/img/wn/${icon}.png" alt="${description}">
                <div class="temp">${Math.round(temp)}°C</div>
                <div class="description">${description}</div>
            </div>
        `;
    }).join('');

    hourlyForecast.innerHTML = `
        <h3>Hourly Forecast</h3>
        ${hourlyGrid.outerHTML}
    `;
}

function displayDailyForecast(data) {
    const dailyData = getDailyForecasts(data.list);
    const dailyGrid = document.createElement('div');
    dailyGrid.className = 'daily-grid';

    dailyGrid.innerHTML = dailyData.map(item => {
        const date = new Date(item.dt * 1000);
        const { temp_max, temp_min } = item.main;
        const { description, icon } = item.weather[0];

        return `
            <div class="daily-card">
                <div class="day">${date.toLocaleDateString('en-US', { weekday: 'long' })}</div>
                <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${description}">
                <div class="temp-range">
                    <span class="max">${Math.round(temp_max)}°C</span>
                    <span class="min">${Math.round(temp_min)}°C</span>
                </div>
                <div class="description">${description}</div>
            </div>
        `;
    }).join('');

    dailyForecast.innerHTML = `
        <h3>Daily Forecast</h3>
        ${dailyGrid.outerHTML}
    `;
}

function getDailyForecasts(forecastList) {
    const dailyForecasts = [];
    const today = new Date().setHours(0, 0, 0, 0);

    forecastList.forEach(forecast => {
        const forecastDate = new Date(forecast.dt * 1000).setHours(0, 0, 0, 0);
        if (forecastDate > today) {
            const existingForecast = dailyForecasts.find(f =>
                new Date(f.dt * 1000).setHours(0, 0, 0, 0) === forecastDate
            );
            if (!existingForecast) {
                dailyForecasts.push(forecast);
            }
        }
    });

    return dailyForecasts.slice(0, 5);
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