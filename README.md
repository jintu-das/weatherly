# Weatherly

Minimal weather widget with two usage modes:

- App mode: import and call the widget in your TypeScript app
- Embed mode: drop one script into any website and use a custom HTML tag

## Development

Install dependencies:

```bash
npm install
```

Run dev server:

```bash
npm run dev
```

Build app:

```bash
npm run build
```

## Drop-in Embed Build

Build the standalone script for external websites:

```bash
npm run build:embed
```

Output file:

- dist/embed/weatherly-widget.js

## Use On Any Website

Host dist/embed/weatherly-widget.js on your server/CDN, then add it to any page.

### Option 1: Custom Element (recommended)

```html
<div style="max-width:320px;">
  <weatherly-widget location="Bengaluru" units="celsius" accent-color="#1570ef">
  </weatherly-widget>
</div>

<script src="https://weatherly-widget.netlify.app/embed/weatherly-widget.js"></script>
```

### Option 2: JavaScript API

```html
<div id="my-weather"></div>

<script src="https://weatherly-widget.netlify.app/embed/weatherly-widget.js"></script>
<script>
  window.WeatherlyWidget.create("#my-weather", {
    location: "London",
    units: "fahrenheit",
    accentColor: "#0ea5e9",
  });
</script>
```

## Widget Attributes

For the custom element:

- location: required city/location text
- units: optional, celsius or fahrenheit (default celsius)
- accent-color: optional CSS color for status dot

## Notes

- The widget fetches data from Open-Meteo APIs, so network and CSP policies must allow those requests.
- Best support is in modern browsers with Custom Elements, Shadow DOM, and fetch.
