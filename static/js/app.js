const state = {
  units: "metric",
  location: null,
};

const elements = {
  location: document.getElementById("location"),
  subline: document.getElementById("subline"),
  temp: document.getElementById("temp"),
  tempUnit: document.getElementById("temp-unit"),
  feels: document.getElementById("feels"),
  condition: document.getElementById("condition"),
  localTime: document.getElementById("local-time"),
  humidity: document.getElementById("humidity"),
  wind: document.getElementById("wind"),
  uv: document.getElementById("uv"),
  air: document.getElementById("air"),
  sunrise: document.getElementById("sunrise"),
  sunset: document.getElementById("sunset"),
  pm25: document.getElementById("pm25"),
  pm10: document.getElementById("pm10"),
  ozone: document.getElementById("ozone"),
  no2: document.getElementById("no2"),
  hourly: document.getElementById("hourly"),
  daily: document.getElementById("daily"),
  status: document.getElementById("status"),
  hourlyNote: document.getElementById("hourly-note"),
  dailyNote: document.getElementById("daily-note"),
  heroIcon: document.getElementById("hero-icon"),
  unitBtn: document.getElementById("unit-btn"),
  geoBtn: document.getElementById("geo-btn"),
  searchForm: document.getElementById("search-form"),
  searchInput: document.getElementById("search-input"),
};

const weatherGroups = [
  { label: "Clear", codes: [0] },
  { label: "Partly Cloudy", codes: [1, 2, 3] },
  { label: "Fog", codes: [45, 48] },
  { label: "Drizzle", codes: [51, 53, 55, 56, 57] },
  { label: "Rain", codes: [61, 63, 65, 66, 67, 80, 81, 82] },
  { label: "Snow", codes: [71, 73, 75, 77, 85, 86] },
  { label: "Thunder", codes: [95, 96, 99] },
];

const themeMap = {
  Clear: { day: "theme-clear-day", night: "theme-clear-night" },
  "Partly Cloudy": { day: "theme-cloudy-day", night: "theme-cloudy-night" },
  Fog: { day: "theme-cloudy-day", night: "theme-cloudy-night" },
  Drizzle: { day: "theme-rain-day", night: "theme-rain-night" },
  Rain: { day: "theme-rain-day", night: "theme-rain-night" },
  Snow: { day: "theme-snow-day", night: "theme-snow-night" },
  Thunder: { day: "theme-storm-day", night: "theme-storm-night" },
};

const compass = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

const formatTemp = (value) => (value == null ? "--" : Math.round(value));
const formatSpeed = (value) => (value == null ? "--" : Math.round(value));

const formatTime = (value) => {
  if (!value) return "--";
  const date = new Date(value);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const formatDate = (value) => {
  if (!value) return "--";
  const date = new Date(value);
  return date.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
};

const getWeatherGroup = (code) => {
  for (const group of weatherGroups) {
    if (group.codes.includes(code)) return group.label;
  }
  return "Clear";
};

const getTheme = (code, isDay) => {
  const group = getWeatherGroup(code);
  const entry = themeMap[group];
  return isDay ? entry.day : entry.night;
};

const getWeatherIcon = (code, isDay) => {
  const group = getWeatherGroup(code);
  const accent = isDay ? "#facc15" : "#38bdf8";

  if (group === "Clear") {
    return `
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="14" fill="${accent}" />
        <g stroke="${accent}" stroke-width="3" stroke-linecap="round">
          <path d="M32 4v10" />
          <path d="M32 50v10" />
          <path d="M4 32h10" />
          <path d="M50 32h10" />
          <path d="M11 11l7 7" />
          <path d="M46 46l7 7" />
          <path d="M53 11l-7 7" />
          <path d="M18 46l-7 7" />
        </g>
      </svg>
    `;
  }

  if (group === "Snow") {
    return `
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 34c0-7 6-13 13-13 5 0 9 2 11 6 6 0 11 5 11 11 0 6-5 11-11 11H22c-6 0-10-4-10-9 0-4 3-6 6-6z" fill="#e2e8f0" />
        <g stroke="#bae6fd" stroke-width="2" stroke-linecap="round">
          <path d="M24 50v8" />
          <path d="M32 52v8" />
          <path d="M40 50v8" />
        </g>
      </svg>
    `;
  }

  if (group === "Thunder") {
    return `
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 30c0-7 6-13 13-13 5 0 9 2 11 6 6 0 11 5 11 11 0 6-5 11-11 11H22c-6 0-10-4-10-9 0-4 3-6 6-6z" fill="#cbd5f5" />
        <path d="M30 38l-6 14h8l-2 10 10-16h-8l2-8z" fill="#facc15" />
      </svg>
    `;
  }

  if (group === "Rain" || group === "Drizzle") {
    return `
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 30c0-7 6-13 13-13 5 0 9 2 11 6 6 0 11 5 11 11 0 6-5 11-11 11H22c-6 0-10-4-10-9 0-4 3-6 6-6z" fill="#93c5fd" />
        <g stroke="#38bdf8" stroke-width="2" stroke-linecap="round">
          <path d="M24 46l-3 6" />
          <path d="M32 46l-3 6" />
          <path d="M40 46l-3 6" />
        </g>
      </svg>
    `;
  }

  return `
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 30c0-7 6-13 13-13 5 0 9 2 11 6 6 0 11 5 11 11 0 6-5 11-11 11H22c-6 0-10-4-10-9 0-4 3-6 6-6z" fill="#cbd5f5" />
    </svg>
  `;
};

const toCompass = (deg) => {
  if (deg == null) return "--";
  const idx = Math.round(((deg % 360) / 45)) % 8;
  return compass[idx];
};

const setStatus = (message) => {
  elements.status.textContent = message;
};

const setTheme = (code, isDay) => {
  const theme = getTheme(code, isDay === 1);
  document.body.className = theme;
};

const updateUI = (payload, label) => {
  const current = payload.current || {};
  const isDay = current.is_day === 1;
  const group = getWeatherGroup(current.weathercode);

  elements.location.textContent = label;
  elements.temp.textContent = formatTemp(current.temperature);
  elements.tempUnit.textContent = state.units === "metric" ? "C" : "F";
  elements.feels.textContent = `Feels like ${formatTemp(current.apparent_temperature)}°`;
  elements.condition.textContent = group;
  elements.localTime.textContent = current.time
    ? `Updated ${formatTime(current.time)}`
    : "--";
  elements.humidity.textContent = current.humidity == null ? "--" : `${current.humidity}%`;
  elements.wind.textContent =
    current.wind_speed == null
      ? "--"
      : `${formatSpeed(current.wind_speed)} ${state.units === "metric" ? "km/h" : "mph"} ${toCompass(current.wind_direction)}`;

  elements.uv.textContent =
    payload.daily?.[0]?.uv_max == null ? "--" : payload.daily[0].uv_max.toFixed(1);
  elements.air.textContent =
    payload.air?.aqi == null ? "--" : `AQI ${Math.round(payload.air.aqi)}`;

  elements.sunrise.textContent = formatTime(payload.daily?.[0]?.sunrise);
  elements.sunset.textContent = formatTime(payload.daily?.[0]?.sunset);
  elements.pm25.textContent = payload.air?.pm2_5 == null ? "--" : `${payload.air.pm2_5.toFixed(1)} ug/m3`;
  elements.pm10.textContent = payload.air?.pm10 == null ? "--" : `${payload.air.pm10.toFixed(1)} ug/m3`;
  elements.ozone.textContent = payload.air?.ozone == null ? "--" : `${payload.air.ozone.toFixed(1)} ug/m3`;
  elements.no2.textContent = payload.air?.no2 == null ? "--" : `${payload.air.no2.toFixed(1)} ug/m3`;

  elements.heroIcon.innerHTML = getWeatherIcon(current.weathercode, isDay);
  setTheme(current.weathercode, isDay);

  elements.hourly.innerHTML = "";
  payload.hourly.forEach((hour) => {
    const card = document.createElement("div");
    card.className = "hour-card";
    card.innerHTML = `
      <div class="time">${formatTime(hour.time)}</div>
      <div class="value">${formatTemp(hour.temperature)}°</div>
      <div class="note">${getWeatherGroup(hour.weathercode)}</div>
      <div class="note">UV ${hour.uv_index == null ? "--" : hour.uv_index.toFixed(1)}</div>
    `;
    elements.hourly.appendChild(card);
  });

  elements.daily.innerHTML = "";
  payload.daily.forEach((day) => {
    const card = document.createElement("div");
    card.className = "day-card";
    card.innerHTML = `
      <h3>${formatDate(day.date)}</h3>
      <div class="value">${formatTemp(day.temp_max)}° / ${formatTemp(day.temp_min)}°</div>
      <div class="note">${getWeatherGroup(day.weathercode)}</div>
      <div class="note">UV max ${day.uv_max == null ? "--" : day.uv_max.toFixed(1)}</div>
    `;
    elements.daily.appendChild(card);
  });

  elements.hourlyNote.textContent = state.units === "metric" ? "C / km/h" : "F / mph";
  elements.dailyNote.textContent = payload.timezone || "";
};

const fetchWeather = async (lat, lon, label) => {
  setStatus("Fetching latest radar sweep...");
  try {
    const response = await fetch(`/api/weather?lat=${lat}&lon=${lon}&units=${state.units}`);
    if (!response.ok) throw new Error("Weather fetch failed.");
    const payload = await response.json();
    updateUI(payload, label);
    setStatus("Live data updated.");
  } catch (error) {
    setStatus("Could not load weather. Try again.");
  }
};

const searchLocation = async (query) => {
  if (!query) return;
  setStatus("Searching coordinates...");
  const response = await fetch(`/api/geocode?name=${encodeURIComponent(query)}`);
  if (!response.ok) {
    setStatus("Search failed.");
    return;
  }
  const data = await response.json();
  if (!data.results || data.results.length === 0) {
    setStatus("No matches found.");
    return;
  }
  const top = data.results[0];
  const label = `${top.name}, ${top.country_code}`;
  state.location = { lat: top.latitude, lon: top.longitude, label };
  fetchWeather(top.latitude, top.longitude, label);
};

const setUnits = () => {
  state.units = state.units === "metric" ? "imperial" : "metric";
  elements.unitBtn.textContent = state.units === "metric" ? "Units: C / km" : "Units: F / mph";
  elements.unitBtn.setAttribute("aria-pressed", state.units === "imperial");
  if (state.location) {
    fetchWeather(state.location.lat, state.location.lon, state.location.label);
  }
};

const useGeolocation = () => {
  if (!navigator.geolocation) {
    setStatus("Geolocation is not available.");
    return;
  }

  setStatus("Locating you...");
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      const label = "My location";
      state.location = { lat: latitude, lon: longitude, label };
      fetchWeather(latitude, longitude, label);
    },
    () => {
      setStatus("Unable to access location.");
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
};

const registerServiceWorker = () => {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/static/js/sw.js").catch(() => {
      setStatus("Offline mode unavailable.");
    });
  }
};

const init = () => {
  elements.searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    searchLocation(elements.searchInput.value.trim());
  });

  elements.unitBtn.addEventListener("click", setUnits);
  elements.geoBtn.addEventListener("click", useGeolocation);

  registerServiceWorker();
  searchLocation("Nairobi");
};

init();
