const locationInput = document.getElementById('weather-location');
const locationResults = document.getElementById('location-results');

const weatherGrid = document.querySelector('.weather-grid');
const locationNameEl = document.getElementById('today-location');
const localTimeEl = document.getElementById('today-time');
const temperatureEl = document.getElementById('today-temp');
const conditionEl = document.getElementById('today-conditions');
const windSpeedEl = document.getElementById('today-wind');
const rainChanceEl = document.getElementById('today-rain');
const pressureEl = document.getElementById('today-pressure');
const uvIndexEl = document.getElementById('today-uv');

locationInput.addEventListener('input', debounce(handleInput, 400));
locationInput.addEventListener('focus', () => locationResults.classList.remove('hidden'));
locationInput.addEventListener('blur', () => {
  setTimeout(() => locationResults.classList.add('hidden'), 200);
});

let currentLocations = [];

async function handleInput() {
  const query = locationInput.value.trim();
  if (!query) {
    locationResults.innerHTML = '';
    return;
  }

  try {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`;
    const res = await fetch(geoUrl);
    if (!res.ok) throw new Error('Failed to fetch locations');
    const data = await res.json();

    if (data.results && data.results.length > 0) {
      currentLocations = data.results;
      renderLocationResults(currentLocations);
    } else {
      locationResults.innerHTML = `<li class="no-location">No locations found</li>`;
    }
  } catch (e) {
    locationResults.innerHTML = `<li class="no-location">Error fetching locations</li>`;
    console.error(e);
  }
}

function renderLocationResults(locations) {
  locationResults.innerHTML = '';
  locations.forEach((loc) => {
    const li = document.createElement('li');
    li.classList.add('location');
    li.textContent = `${loc.name}${loc.admin1 ? ', ' + loc.admin1 : ''}, ${loc.country}`;
    li.addEventListener('mousedown', () => {
      locationInput.value = li.textContent;
      locationResults.classList.add('hidden');
      fetchWeather(loc.latitude, loc.longitude, loc);
    });
    locationResults.appendChild(li);
  });
}

async function fetchWeather(lat, lon, loc) {
  try {
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_min,temperature_2m_max,precipitation_probability_max,uv_index_max,surface_pressure_mean&timezone=auto`;
    const res = await fetch(weatherUrl);
    if (!res.ok) throw new Error('Failed to fetch weather');
    const data = await res.json();
    displayWeather(data, loc);
  } catch (e) {
    alert('Failed to load weather data. Please try another location.');
    console.error(e);
  }
}

function displayWeather(data, loc) {
  weatherGrid.classList.remove('hidden');

  locationNameEl.textContent = `${loc.name}${loc.admin1 ? ', ' + loc.admin1 : ''}, ${loc.country}`;
  localTimeEl.textContent = formatTime(data.current_weather.time);

  temperatureEl.innerHTML = `${data.current_weather.temperature}&deg;C`;
  conditionEl.textContent = weatherCodeToText(data.current_weather.weathercode);

  windSpeedEl.textContent = `${data.current_weather.windspeed} km/h`;

  const daily = data.daily;
  document.getElementById('today-min').innerHTML = `${daily.temperature_2m_min[0]}&deg;C`;
  document.getElementById('today-max').innerHTML = `${daily.temperature_2m_max[0]}&deg;C`;

  rainChanceEl.textContent = daily.precipitation_probability_max
    ? `${daily.precipitation_probability_max[0]} %`
    : 'N/A';
  pressureEl.textContent = daily.surface_pressure_mean
    ? `${Math.round(daily.surface_pressure_mean[0])} hPa`
    : 'N/A';
  uvIndexEl.textContent = daily.uv_index_max ? daily.uv_index_max[0] : 'N/A';
}

function weatherCodeToText(code) {
  const codes = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    56: 'Light freezing drizzle',
    57: 'Dense freezing drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    66: 'Light freezing rain',
    67: 'Heavy freezing rain',
    71: 'Slight snow fall',
    73: 'Moderate snow fall',
    75: 'Heavy snow fall',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail',
  };
  return codes[code] || 'Unknown';
}

function formatTime(timeStr) {
  const date = new Date(timeStr);
  const options = { hour: '2-digit', minute: '2-digit', hour12: true };
  return `Local time: ${date.toLocaleTimeString(undefined, options)}`;
}

function debounce(fn, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}
