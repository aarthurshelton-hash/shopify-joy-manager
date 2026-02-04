/**
 * Meteorological Live Data Connector - REAL DATA ONLY
 * Connects meteorologicalAdapter to OpenWeatherMap API
 * 
 * For Alec Arthur Shelton - The Artist
 * 
 * REQUIRES: VITE_OPENWEATHER_API_KEY environment variable
 */

import { meteorologicalAdapter, type MeteorologicalEvent } from './meteorologicalAdapter';
import { liveDataCoordinator, getAPIKey } from '../../../liveData';

export interface WeatherData {
  location: {
    lat: number;
    lon: number;
    city: string;
    country: string;
  };
  current: {
    temp: number; // Celsius
    feelsLike: number;
    humidity: number; // 0-100
    pressure: number; // hPa
    windSpeed: number; // m/s
    windDeg: number;
    clouds: number; // 0-100%
    visibility: number; // meters
    weatherId: number;
    weatherMain: string;
    weatherDesc: string;
  };
  forecast?: {
    timestamp: number;
    temp: number;
    pressure: number;
    humidity: number;
    windSpeed: number;
    pop: number; // Probability of precipitation
  }[];
}

export class MeteorologicalDataFeed {
  private apiKey: string | null = null;
  private isRunning = false;

  constructor() {
    this.apiKey = getAPIKey('openWeatherMap') || null;
  }

  validateConfig(): void {
    if (!this.apiKey) {
      throw new Error(
        '[MeteorologicalFeed] VITE_OPENWEATHER_API_KEY not configured. ' +
        'Get a free API key at https://openweathermap.org/api'
      );
    }
  }

  async fetchCurrentWeather(lat: number = 40.7128, lon: number = -74.0060): Promise<WeatherData> {
    this.validateConfig();

    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`
    );

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      location: {
        lat: data.coord.lat,
        lon: data.coord.lon,
        city: data.name,
        country: data.sys.country
      },
      current: {
        temp: data.main.temp,
        feelsLike: data.main.feels_like,
        humidity: data.main.humidity,
        pressure: data.main.pressure,
        windSpeed: data.wind.speed,
        windDeg: data.wind.deg || 0,
        clouds: data.clouds.all,
        visibility: data.visibility || 10000,
        weatherId: data.weather[0].id,
        weatherMain: data.weather[0].main,
        weatherDesc: data.weather[0].description
      }
    };
  }

  processToEvent(data: WeatherData): MeteorologicalEvent {
    const { current } = data;
    
    // Calculate derived metrics
    const pressureTrend = (current.pressure - 1013) / 50; // Normalized around 1013 hPa
    const tempAnomaly = current.temp - 20; // Assume 20°C baseline
    const stormIntensity = this.calculateStormIntensity(current);
    
    return {
      timestamp: Date.now(),
      pressureTrend,
      temperatureAnomaly: tempAnomaly,
      humidityLevel: current.humidity,
      windSpeed: current.windSpeed * 2.237, // Convert to mph
      precipitationProbability: 0, // Would need forecast data
      stormIntensity,
      forecastAccuracy: 0.85, // Base assumption
      climateOscillationPhase: 0 // Would need historical analysis
    };
  }

  private calculateStormIntensity(current: WeatherData['current']): number {
    // Simple storm intensity calculation
    let intensity = 0;
    
    // Wind contribution
    if (current.windSpeed > 20) intensity += 3;
    else if (current.windSpeed > 10) intensity += 1;
    
    // Pressure contribution (low pressure = storm potential)
    if (current.pressure < 990) intensity += 4;
    else if (current.pressure < 1000) intensity += 2;
    
    // Weather condition contribution
    const severeCodes = [200, 201, 202, 210, 211, 212, 221, 230, 231, 232]; // Thunderstorm
    if (severeCodes.includes(current.weatherId)) intensity += 3;
    
    return Math.min(intensity, 10);
  }

  async start(lat?: number, lon?: number): Promise<void> {
    if (this.isRunning) return;
    
    this.validateConfig();
    this.isRunning = true;

    liveDataCoordinator.registerFeed({
      adapter: 'meteorological',
      source: 'OpenWeatherMap',
      endpoint: 'https://api.openweathermap.org/data/2.5/weather',
      apiKey: this.apiKey!,
      rateLimit: 60,
      updateInterval: 600000,
      retryAttempts: 3,
      timeout: 10000
    });

    const weather = await this.fetchCurrentWeather(lat, lon);
    const event = this.processToEvent(weather);
    meteorologicalAdapter.processRawData(event);
    console.log('[MeteorologicalFeed] ✓ Real weather data processed');

    await liveDataCoordinator.startFeed('meteorological');
    console.log('[MeteorologicalFeed] Started with REAL DATA');
  }

  stop(): void {
    liveDataCoordinator.stopFeed('meteorological');
    this.isRunning = false;
    console.log('[MeteorologicalFeed] Stopped');
  }
}

// Export singleton
export const meteorologicalDataFeed = new MeteorologicalDataFeed();

console.log('[MeteorologicalFeed] Module loaded - REAL DATA MODE');
