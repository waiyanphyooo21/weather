// OpenWeatherMap API configuration
const API_KEY = '1fa9ff4126d95b8db54f3897a208e91c'; // Your OpenWeatherMap API key
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// DOM Elements
const locationInput = document.getElementById('location-input');
const searchBtn = document.getElementById('search-btn');
const errorMessage = document.getElementById('error-message');
const currentWeather = document.getElementById('current-weather');
const forecast = document.getElementById('forecast');
const loadingSpinner = document.getElementById('loading-spinner');
const themeToggle = document.getElementById('theme-toggle');
const navItems = document.querySelectorAll('.nav-item');

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

// Navigation Management
function initNavigation() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    navItems.forEach(item => {
        // For index.html or empty path, Overview should be active
        if (currentPage === 'index.html' || currentPage === '') {
            if (item.querySelector('span').textContent === 'Overview') {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        } else {
            // For other pages, check the onclick attribute
            const href = item.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
            if (href === currentPage) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        }
    });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initNavigation();
    // Load last searched location or default to user's location
    const lastLocation = localStorage.getItem('lastLocation');
    if (lastLocation) {
        locationInput.value = lastLocation;
        getWeatherData(lastLocation);
    } else {
        getUserLocation();
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

// Weather Data Functions
async function getWeatherData(location) {
    try {
        showLoading();
        const [currentWeatherData, forecastData] = await Promise.all([
            fetchCurrentWeather(location),
            fetchForecast(location)
        ]);
        displayCurrentWeather(currentWeatherData);
        displayForecast(forecastData);
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
    const { temp, humidity, pressure } = data.main;
    const { description, icon } = data.weather[0];
    const { speed } = data.wind;
    const visibility = data.visibility / 1000; // Convert to kilometers

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

    // Update metric cards
    document.getElementById('wind-speed').textContent = `${speed} km/h`;
    document.getElementById('humidity').textContent = `${humidity}%`;
    document.getElementById('pressure').textContent = `${pressure} hPa`;
    document.getElementById('visibility').textContent = `${visibility} km`;
}

function displayForecast(data) {
    const dailyForecasts = getDailyForecasts(data.list);

    forecast.innerHTML = dailyForecasts.map(day => `
        <div class="forecast-card">
            <p class="forecast-date">${new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' })}</p>
            <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png" alt="${day.weather[0].description}">
            <p class="forecast-temp">${Math.round(day.main.temp)}°C</p>
            <p class="forecast-description">${day.weather[0].description}</p>
        </div>
    `).join('');
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

async function getUserLocation() {
    try {
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
        });

        const { latitude, longitude } = position.coords;
        const response = await fetch(
            `${BASE_URL}/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${API_KEY}`
        );

        if (!response.ok) throw new Error('Location data not found');
        const data = await response.json();
        getWeatherData(data.name);
    } catch (error) {
        showError('Unable to get your location. Please search for a city.');
    }
} 