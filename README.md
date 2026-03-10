# Alerts Statistics Dashboard

Israeli Home Front Command (Pikud Haoref) alerts statistics dashboard.

## Data Sources

- **Primary (historical):** [israel-alerts-data](https://github.com/dleshem/israel-alerts-data) CSV — alerts from 2014 onwards, no geo-restriction.
- **Fallback (recent):** GetAlarmsHistory API — last 14 days from oref.org.il (may require Israeli IP).

## Geo-restriction

The Oref API may only be accessible from Israeli IP addresses. If you run outside Israel and see fetch errors, configure an HTTP proxy (e.g. via `HTTP_PROXY` / `HTTPS_PROXY` environment variables or a proxy in the fetch logic).

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
npm start
```
