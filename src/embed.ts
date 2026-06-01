import { createWeatherWidget, type TemperatureUnit } from "./weather-widget.ts";

declare global {
  interface Window {
    WeatherlyWidget?: {
      create: typeof createWeatherWidget;
    };
  }
}

class WeatherlyWidgetElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["location", "units", "accent-color"];
  }

  connectedCallback(): void {
    this.renderWidget();
  }

  attributeChangedCallback(): void {
    this.renderWidget();
  }

  private renderWidget(): void {
    const location = (this.getAttribute("location") ?? "").trim();
    if (!location) {
      this.textContent = "Weatherly: set location attribute";
      return;
    }

    const unitsAttr = this.getAttribute("units");
    const units: TemperatureUnit =
      unitsAttr === "fahrenheit" ? "fahrenheit" : "celsius";
    const accentColor = this.getAttribute("accent-color") ?? undefined;

    createWeatherWidget(this, {
      location,
      units,
      accentColor,
    }).catch(() => {
      this.textContent = "Weatherly: failed to render";
    });
  }
}

if (!customElements.get("weatherly-widget")) {
  customElements.define("weatherly-widget", WeatherlyWidgetElement);
}

const weatherlyGlobal = globalThis as typeof globalThis & {
  WeatherlyWidget?: {
    create: typeof createWeatherWidget;
  };
};

weatherlyGlobal.WeatherlyWidget = {
  create: createWeatherWidget,
};
