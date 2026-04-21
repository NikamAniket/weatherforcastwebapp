/* =========================================================
   WeatherNow – app.js
   Uses OpenWeatherMap Current Weather API (free tier)
   ========================================================= */

// ── CONFIG ──────────────────────────────────────────────────
// Get a free API key at https://openweathermap.org/api
const API_KEY = 'c03da8e28dda59f1bbefbbe32d7e1f4b';
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

// ── STATE ───────────────────────────────────────────────────
let currentTempC = null;
let currentFeelsC = null;
let activeUnit = 'C';

// ── DOM REFS ─────────────────────────────────────────────────
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const loader = document.getElementById('loader');
const weatherCard = document.getElementById('weather-card');
const emptyState = document.getElementById('empty-state');
const errorMsg = document.getElementById('error-msg');

const cityName = document.getElementById('city-name');
const country = document.getElementById('country');
const dateTime = document.getElementById('date-time');
const weatherIcon = document.getElementById('weather-icon');
const condition = document.getElementById('condition');
const temperature = document.getElementById('temperature');
const feelsLike = document.getElementById('feels-like');
const humidity = document.getElementById('humidity');
const wind = document.getElementById('wind');
const visibility = document.getElementById('visibility');
const pressure = document.getElementById('pressure');
const sunrise = document.getElementById('sunrise');
const sunset = document.getElementById('sunset');
const btnC = document.getElementById('btn-c');
const btnF = document.getElementById('btn-f');

// ── WEATHER CONDITION → EMOJI MAP ───────────────────────────
const weatherEmoji = {
  'thunderstorm with light rain': '⛈️',
  'thunderstorm with rain': '⛈️',
  'thunderstorm with heavy rain': '⛈️',
  'light thunderstorm': '🌩️',
  'thunderstorm': '⛈️',
  'heavy thunderstorm': '⛈️',
  'ragged thunderstorm': '⛈️',
  'drizzle': '🌦️',
  'light rain': '🌧️',
  'moderate rain': '🌧️',
  'heavy intensity rain': '🌧️',
  'shower rain': '🌦️',
  'light snow': '🌨️',
  'snow': '❄️',
  'heavy snow': '🌨️',
  'sleet': '🌨️',
  'mist': '🌫️',
  'smoke': '🌫️',
  'haze': '🌫️',
  'fog': '🌁',
  'sand': '🌪️',
  'dust': '🌪️',
  'squalls': '💨',
  'tornado': '🌪️',
  'clear sky': '☀️',
  'few clouds': '🌤️',
  'scattered clouds': '⛅',
  'broken clouds': '🌥️',
  'overcast clouds': '☁️',
};

function getEmoji(desc) {
  const lower = desc.toLowerCase();
  for (const [key, emoji] of Object.entries(weatherEmoji)) {
    if (lower.includes(key)) return emoji;
  }
  return '🌡️';
}

// ── HELPERS ──────────────────────────────────────────────────
function toF(c) { return Math.round(c * 9 / 5 + 32); }

function formatTime(unixTimestamp, timezoneOffsetSeconds) {
  // Convert unix UTC timestamp + city timezone offset → local time string
  const utcMs = unixTimestamp * 1000;
  const localMs = utcMs + timezoneOffsetSeconds * 1000;
  const d = new Date(localMs);
  const h = d.getUTCHours();
  const m = String(d.getUTCMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${m} ${ampm}`;
}

function formatDate(timezoneOffsetSeconds) {
  const utcMs = Date.now();
  const localMs = utcMs + timezoneOffsetSeconds * 1000;
  const d = new Date(localMs);
  return d.toUTCString().replace(/ GMT$/, '').slice(0, -3); // readable
}

// ── UI HELPERS ───────────────────────────────────────────────
function showLoader() {
  loader.classList.remove('hidden');
  weatherCard.classList.add('hidden');
  emptyState.classList.add('hidden');
  errorMsg.classList.add('hidden');
}

function hideLoader() { loader.classList.add('hidden'); }

function showError() {
  hideLoader();
  weatherCard.classList.add('hidden');
  emptyState.classList.add('hidden');
  errorMsg.classList.remove('hidden');
  // Re-trigger shake animation
  errorMsg.style.animation = 'none';
  void errorMsg.offsetWidth;
  errorMsg.style.animation = '';
}

function showCard() {
  hideLoader();
  emptyState.classList.add('hidden');
  errorMsg.classList.add('hidden');
  // Re-trigger slide-up animation
  weatherCard.classList.add('hidden');
  void weatherCard.offsetWidth;
  weatherCard.classList.remove('hidden');
}

// ── RENDER ───────────────────────────────────────────────────
function renderTemperature() {
  if (currentTempC === null) return;
  if (activeUnit === 'C') {
    temperature.textContent = `${Math.round(currentTempC)}°`;
    feelsLike.textContent = `Feels like ${Math.round(currentFeelsC)}°C`;
  } else {
    temperature.textContent = `${toF(currentTempC)}°`;
    feelsLike.textContent = `Feels like ${toF(currentFeelsC)}°F`;
  }
}

function renderWeather(data) {
  const tz = data.timezone; // seconds offset from UTC

  cityName.textContent = data.name;
  country.textContent = `📍 ${data.sys.country}`;
  dateTime.textContent = formatDate(tz);
  condition.textContent = data.weather[0].description;
  weatherIcon.textContent = getEmoji(data.weather[0].description);

  // Store Celsius values
  currentTempC = data.main.temp;
  currentFeelsC = data.main.feels_like;

  humidity.textContent = `${data.main.humidity}%`;
  wind.textContent = `${Math.round(data.wind.speed)} m/s`;
  visibility.textContent = `${(data.visibility / 1000).toFixed(1)} km`;
  pressure.textContent = `${data.main.pressure} hPa`;
  sunrise.textContent = formatTime(data.sys.sunrise, tz);
  sunset.textContent = formatTime(data.sys.sunset, tz);

  renderTemperature();
  showCard();
}

// ── FETCH ────────────────────────────────────────────────────
async function fetchWeather(city) {
  if (!city.trim()) return;

  // Demo mode: show instructions if key not set
  if (API_KEY === 'REPLACE_WITH_YOUR_API_KEY') {
    showDemoData(city);
    return;
  }

  showLoader();

  try {
    const url = `${BASE_URL}?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
    const res = await fetch(url);
    if (!res.ok) { showError(); return; }
    const data = await res.json();
    renderWeather(data);
  } catch (err) {
    showError();
  }
}

// ── DEMO MODE (when no API key is configured) ─────────────────
// Shows realistic demo data so the UI is fully visible.
function showDemoData(city) {
  const DEMO = {
    name: city || 'London',
    sys: { country: 'GB', sunrise: 1713671234, sunset: 1713721234 },
    timezone: 3600,
    weather: [{ description: 'scattered clouds', main: 'Clouds' }],
    main: {
      temp: 18.4,
      feels_like: 17.1,
      humidity: 64,
      pressure: 1012
    },
    wind: { speed: 4.2 },
    visibility: 9000
  };

  // Patch city name from input
  DEMO.name = city.trim() || 'London';

  // Fake reasonable times
  const now = Math.floor(Date.now() / 1000);
  DEMO.sys.sunrise = now - 3 * 3600;
  DEMO.sys.sunset = now + 4 * 3600;

  renderWeather(DEMO);

  // Append notice
  const notice = document.createElement('p');
  notice.style.cssText =
    'margin-top:1rem;font-size:0.78rem;text-align:center;color:#4a6080;';
  notice.innerHTML =
    '⚠️ Demo mode — <a href="https://openweathermap.org/api" target="_blank" style="color:#63b3ff">get a free API key</a> and replace <code style="color:#a78bfa">REPLACE_WITH_YOUR_API_KEY</code> in app.js';

  // Remove previous notice if any
  const old = weatherCard.querySelector('.demo-notice');
  if (old) old.remove();
  notice.className = 'demo-notice';
  weatherCard.appendChild(notice);
}

// ── EVENTS ───────────────────────────────────────────────────
function handleSearch() {
  const city = cityInput.value.trim();
  if (city) fetchWeather(city);
}

searchBtn.addEventListener('click', handleSearch);

cityInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleSearch();
});

btnC.addEventListener('click', () => {
  if (activeUnit === 'C') return;
  activeUnit = 'C';
  btnC.classList.add('active');
  btnF.classList.remove('active');
  renderTemperature();
});

btnF.addEventListener('click', () => {
  if (activeUnit === 'F') return;
  activeUnit = 'F';
  btnF.classList.add('active');
  btnC.classList.remove('active');
  renderTemperature();
});
