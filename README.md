# Pikud Haoref Alerts Dashboard

Historical alert statistics from the Israeli Home Front Command (Pikud Haoref). Explore trends, compare cities, and analyze alert patterns from 2014 onwards.

## Features

- **Overview stats** — Total alerts, peak day, days since last alert, attack origin breakdown, timing stats
- **Time series chart** — Alerts over time with drill-down
- **Alerts by hour** — Distribution by hour of day
- **Alerts by category** — Breakdown by alert type (rockets, missiles, etc.)
- **Alerts by location** — Top cities/regions
- **City comparison** — Compare alert counts across selected cities
- **Filters** — Date range picker, city filter, exclude drills toggle
- **Auto-refresh** — Data updates every 5 minutes
- **Dark mode** — System preference support

## Data Sources

- **Primary (historical):** [israel-alerts-data](https://github.com/dleshem/israel-alerts-data) CSV — alerts from 2014 onwards, no geo-restriction
- **Fallback (recent):** GetAlarmsHistory API — last 14 days from oref.org.il (may require Israeli IP)

## Geo-restriction

The Oref API may only be accessible from Israeli IP addresses. If you run outside Israel and see fetch errors, configure an HTTP proxy (e.g. via `HTTP_PROXY` / `HTTPS_PROXY` environment variables).

## Tech Stack

- Next.js 14, React 18, TypeScript
- Tailwind CSS, Recharts

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
npm start
```

## License

MIT
