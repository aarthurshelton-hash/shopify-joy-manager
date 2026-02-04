# En Pensent Live Data API Configuration

## Real Data Only Mode

To use real data feeds, you must configure the following API keys in your `.env` file:

### Required API Keys

| Feed | Environment Variable | Source | Free Tier |
|------|---------------------|--------|-----------|
| Meteorological | `VITE_OPENWEATHER_API_KEY` | https://openweathermap.org/api | 60 calls/min |
| Astronomical | `VITE_NASA_API_KEY` | https://api.nasa.gov | 1000 calls/day |
| Journalistic | `VITE_NEWSAPI_KEY` | https://newsapi.org | 100 calls/day |
| Sports | `VITE_SPORTS_API_KEY` | ESPN (no key needed) | Unlimited |
| Oceanographic | `VITE_NOAA_API_KEY` | https://coast.noaa.gov/dataviewer/ | Free |
| Genetic | `VITE_NCBI_API_KEY` | https://www.ncbi.nlm.nih.gov/home/develop/api/ | Free |
| Economic | `VITE_FRED_API_KEY` | https://fred.stlouisfed.org/docs/api/api_key.html | Free |
| Immunological | None needed | https://disease.sh/ | Free |
| Cybersecurity | None needed | https://urlhaus-api.abuse.ch/ | Free |
| Geological | None needed | https://earthquake.usgs.gov/fdsnws/event/1/ | Free |

### Sample .env Configuration

```bash
# Weather Data
VITE_OPENWEATHER_API_KEY=your_openweather_key_here

# NASA Space Data
VITE_NASA_API_KEY=your_nasa_key_here

# News Data
VITE_NEWSAPI_KEY=your_newsapi_key_here

# Federal Reserve Economic Data (optional, can use demo)
VITE_FRED_API_KEY=your_fred_key_here
```

### Getting Started

1. Sign up for free API keys at the sources above
2. Add them to your `.env` file
3. Restart your development server
4. Run `await activateLiveFeeds()` to start real data collection

### Feeds Updated to Real Data Only

✅ **Meteorological** - OpenWeatherMap (REQUIRES API KEY)
✅ **Astronomical** - NASA APIs (uses DEMO_KEY if no key provided)
✅ **Journalistic** - NewsAPI (REQUIRES API KEY)

### Important Notes

- Without valid API keys, feeds will throw errors and refuse to start
- This ensures En Pensent only processes real-world patterns
- Some APIs (USGS, disease.sh, Abuse.ch) don't require keys
- NASA provides a DEMO_KEY with limited rate limits for testing

### Verification

After configuration, check the console for:
```
[MeteorologicalFeed] ✓ Real weather data processed
[AstronomicalFeed] ✓ Real astronomical data processed
[JournalisticFeed] ✓ Real news data processed
...
```

This confirms real data is flowing into the 55-adapter universal engine.

---
For Alec Arthur Shelton - The Artist
Truth through real patterns only.
