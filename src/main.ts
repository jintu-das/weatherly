import "./style.css";
import { createWeatherWidget } from "./weather-widget.ts";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("Missing #app container");
}

app.innerHTML = `
  <main class="layout">
    <h1>Weatherly Widget</h1>
    <p class="sub">Minimal, embeddable weather card</p>
    <section id="weather-widget-demo"></section>
  </main>
`;

createWeatherWidget("#weather-widget-demo", {
  location: "Bengaluru",
  units: "celsius",
  accentColor: "#1570ef",
});
