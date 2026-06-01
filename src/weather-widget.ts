export type TemperatureUnit = "celsius" | "fahrenheit";

export interface WeatherWidgetOptions {
  location: string;
  units?: TemperatureUnit;
  accentColor?: string;
}

interface GeoResult {
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
}

interface OpenMeteoResponse {
  current?: {
    temperature_2m?: number;
    weather_code?: number;
  };
  daily?: {
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
  };
}

const WEATHER_LABELS: Record<number, string> = {
  0: "Clear",
  1: "Mostly Clear",
  2: "Partly Cloudy",
  3: "Cloudy",
  45: "Fog",
  48: "Rime Fog",
  51: "Light Drizzle",
  53: "Drizzle",
  55: "Dense Drizzle",
  61: "Light Rain",
  63: "Rain",
  65: "Heavy Rain",
  71: "Light Snow",
  73: "Snow",
  75: "Heavy Snow",
  80: "Rain Showers",
  81: "Rain Showers",
  82: "Heavy Showers",
  95: "Thunderstorm",
};

const DEFAULT_ACCENT = "#1570ef";

function toUnitSymbol(units: TemperatureUnit): string {
  return units === "fahrenheit" ? "F" : "C";
}

function toRounded(value?: number): string {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "--";
  }

  return Math.round(value).toString();
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function getLocationCoordinates(location: string): Promise<GeoResult> {
  const endpoint = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`;
  const result = await fetchJson<{ results?: GeoResult[] }>(endpoint);

  if (!result.results || result.results.length === 0) {
    throw new Error("Location not found");
  }

  return result.results[0];
}

async function getWeather(
  lat: number,
  lon: number,
  units: TemperatureUnit,
): Promise<OpenMeteoResponse> {
  const tempUnit = units === "fahrenheit" ? "fahrenheit" : "celsius";
  const endpoint = [
    "https://api.open-meteo.com/v1/forecast",
    `?latitude=${lat}`,
    `&longitude=${lon}`,
    "&current=temperature_2m,weather_code",
    "&daily=temperature_2m_max,temperature_2m_min",
    "&timezone=auto",
    `&temperature_unit=${tempUnit}`,
  ].join("");

  return fetchJson<OpenMeteoResponse>(endpoint);
}

function getLabel(weatherCode?: number): string {
  if (typeof weatherCode !== "number") {
    return "Unknown";
  }

  return WEATHER_LABELS[weatherCode] ?? "Unknown";
}

function getHost(target: string | Element): Element {
  if (typeof target === "string") {
    const found = document.querySelector(target);
    if (!found) {
      throw new Error(`Target not found for selector: ${target}`);
    }

    return found;
  }

  return target;
}

function widgetTemplate(): string {
  return `
    <article class="widget" aria-live="polite">
      <div class="top-row">
        <h2 class="city">Loading...</h2>
        <span class="status-dot" aria-hidden="true"></span>
      </div>
      <p class="condition">Fetching weather</p>
      <div class="temperature-row">
        <p class="temperature">--°</p>
        <div class="range">
          <p class="range-item">H: --°</p>
          <p class="range-item">L: --°</p>
        </div>
      </div>
    </article>
  `;
}

function widgetStyles(accentColor: string): string {
  return `
    :host {
      display: block;
      width: 100%;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #0f172a;
    }

    .widget {
      background: #ffffff;
      border: 1px solid #dbe4f0;
      border-radius: 14px;
      padding: 16px;
      box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
      width: 100%;
    }

    .top-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .city {
      margin: 0;
      font-size: 1rem;
      line-height: 1.2;
      font-weight: 600;
      color: #0f172a;
    }

    .status-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: ${accentColor};
      flex-shrink: 0;
    }

    .condition {
      margin: 8px 0 0;
      color: #334155;
      font-size: 0.92rem;
    }

    .temperature-row {
      margin-top: 14px;
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 12px;
    }

    .temperature {
      margin: 0;
      font-size: 2.1rem;
      font-weight: 700;
      line-height: 1;
      color: #0f172a;
    }

    .range {
      margin: 0;
      display: grid;
      gap: 4px;
      color: #475569;
      font-size: 0.82rem;
      text-align: right;
    }

    .range-item {
      margin: 0;
    }

    @media (max-width: 480px) {
      .widget {
        padding: 14px;
      }

      .temperature {
        font-size: 1.9rem;
      }
    }
  `;
}

export async function createWeatherWidget(
  target: string | Element,
  options: WeatherWidgetOptions,
): Promise<void> {
  const host = getHost(target);
  const units = options.units ?? "celsius";
  const accent = options.accentColor ?? DEFAULT_ACCENT;
  const location = options.location.trim();

  if (!location) {
    throw new Error("Location is required");
  }

  const wrapper = document.createElement("div");
  const shadowRoot = wrapper.attachShadow({ mode: "open" });

  shadowRoot.innerHTML = `
    <style>${widgetStyles(accent)}</style>
    ${widgetTemplate()}
  `;

  host.innerHTML = "";
  host.appendChild(wrapper);

  const cityEl = shadowRoot.querySelector<HTMLElement>(".city");
  const conditionEl = shadowRoot.querySelector<HTMLElement>(".condition");
  const tempEl = shadowRoot.querySelector<HTMLElement>(".temperature");
  const rangeItems = shadowRoot.querySelectorAll<HTMLElement>(".range-item");

  if (!cityEl || !conditionEl || !tempEl || rangeItems.length < 2) {
    throw new Error("Widget render failed");
  }

  try {
    const place = await getLocationCoordinates(location);
    const weather = await getWeather(place.latitude, place.longitude, units);

    const symbol = toUnitSymbol(units);
    const current = weather.current?.temperature_2m;
    const max = weather.daily?.temperature_2m_max?.[0];
    const min = weather.daily?.temperature_2m_min?.[0];
    const label = getLabel(weather.current?.weather_code);
    const placeLabel = place.country
      ? `${place.name}, ${place.country}`
      : place.name;

    cityEl.textContent = placeLabel;
    conditionEl.textContent = label;
    tempEl.textContent = `${toRounded(current)}°${symbol}`;
    rangeItems[0].textContent = `H: ${toRounded(max)}°${symbol}`;
    rangeItems[1].textContent = `L: ${toRounded(min)}°${symbol}`;
  } catch {
    cityEl.textContent = location;
    conditionEl.textContent = "Could not load weather data";
    tempEl.textContent = "--°";
    rangeItems[0].textContent = "H: --°";
    rangeItems[1].textContent = "L: --°";
  }
}
