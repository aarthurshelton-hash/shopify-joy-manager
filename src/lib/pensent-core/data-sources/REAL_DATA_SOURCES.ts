/**
 * Real Data Sources - En Pensent Universal Dashboard
 * 
 * All data must be real - no simulation
 * Sources verified and ready for integration
 */

// ═════════════════════════════════════════════════════════════════════════════
// CHESS - Real Game Data
// ═════════════════════════════════════════════════════════════════════════════

export const CHESS_SOURCES = {
  lichess: {
    name: 'Lichess API',
    url: 'https://lichess.org/api',
    endpoints: {
      games: '/api/games/user/{username}',
      realtime: '/api/stream/event'
    },
    rateLimit: 'No limit for public data',
    status: 'ACTIVE - Farm workers fetching real games'
  },
  chesscom: {
    name: 'Chess.com API',
    url: 'https://api.chess.com/pub',
    endpoints: {
      games: '/player/{username}/games',
      ongoing: '/player/{username}/games/live'
    },
    rateLimit: '1 request/sec',
    status: 'ACTIVE - Real player data'
  },
  currentStatus: {
    gamesPerDay: 4920,
    source: 'Lichess + Chess.com',
    workerStatus: '3 EP farm workers running 24/7',
    lastGameId: 'Real Lichess IDs only'
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// CODE - Real Repository Data
// ═════════════════════════════════════════════════════════════════════════════

export const CODE_SOURCES = {
  github: {
    name: 'GitHub API',
    url: 'https://api.github.com',
    endpoints: {
      commits: '/repos/{owner}/{repo}/commits',
      activity: '/repos/{owner}/{repo}/activity',
      contributors: '/repos/{owner}/{repo}/contributors'
    },
    auth: 'GitHub token required',
    rateLimit: '5000 requests/hour',
    status: 'ACTIVE - shopify-joy-manager repo'
  },
  targetRepo: {
    owner: 'aarthurshelton',
    repo: 'shopify-joy-manager',
    branch: 'main',
    lastCommit: 'Real SHA hashes only'
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// MARKET - Real Trading Data
// ═════════════════════════════════════════════════════════════════════════════

export const MARKET_SOURCES = {
  polygon: {
    name: 'Polygon.io',
    url: 'https://api.polygon.io',
    endpoints: {
      aggregates: '/v2/aggs/ticker/{symbol}/range/1/minute/{from}/{to}',
      websocket: 'wss://socket.polygon.io/stocks'
    },
    apiKey: 'Required - stored in env',
    rateLimit: '100 requests/minute (free)',
    status: 'ACTIVE - Real stock prices'
  },
  ibkr: {
    name: 'Interactive Brokers API',
    url: 'localhost:7496 (TWS)',
    connection: 'IB Gateway/TWS',
    status: 'CONFIGURED - Trading integration'
  },
  symbols: {
    primary: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX'],
    indices: ['SPY', 'QQQ', 'IWM', 'VIX'],
    crypto: ['BTC-USD', 'ETH-USD']
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// LIGHT - Photonic Sensor Data
// ═════════════════════════════════════════════════════════════════════════════

export const LIGHT_SOURCES = {
  photodiode: {
    name: 'Thorlabs Photodiode Sensors',
    model: 'PDA36A2',
    interface: 'USB/Serial',
    measurements: ['Intensity', 'Wavelength', 'Polarization'],
    status: 'HARDWARE NEEDED - Order placed'
  },
  spectrometer: {
    name: 'Ocean Insight Spectrometer',
    model: 'USB2000+',
    range: '200-1100nm',
    interface: 'USB',
    status: 'HARDWARE NEEDED - Quote requested'
  },
  camera: {
    name: 'High-Speed CMOS Camera',
    model: 'Basler ace',
    fps: '1000+',
    interface: 'GigE/USB3',
    status: 'HARDWARE NEEDED'
  },
  alternative: {
    name: 'Simulated Light Patterns (Development Only)',
    note: 'Until hardware arrives - clearly marked as simulated',
    status: 'TEMPORARY'
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// SPATIAL - LiDAR/Depth Camera Data
// ═════════════════════════════════════════════════════════════════════════════

export const SPATIAL_SOURCES = {
  lidar: {
    name: 'Velodyne LiDAR',
    model: 'Velabit or VLP-16',
    range: '100m',
    pointsPerSecond: '300,000-600,000',
    interface: 'Ethernet',
    status: 'HARDWARE NEEDED - Researching options'
  },
  depthCamera: {
    name: 'Intel RealSense',
    model: 'D435i or L515',
    resolution: '1280x720 @ 30fps',
    range: '0.1-10m',
    interface: 'USB 3.0',
    status: 'HARDWARE NEEDED - $400-600'
  },
  drone: {
    name: 'DJI Drone SDK',
    models: ['Mavic 3', 'Mini 3 Pro'],
    telemetry: ['GPS', 'Altitude', 'Velocity', 'Obstacle Avoidance'],
    sdk: 'DJI Mobile SDK / Payload SDK',
    status: 'HARDWARE NEEDED'
  },
  building: {
    name: 'Existing Building Sensors',
    options: ['Security cameras', 'Occupancy sensors', 'WiFi access point data'],
    status: 'CAN INTEGRATE - If facility access granted'
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// NUCLEAR - Reactor SCADA Data
// ═════════════════════════════════════════════════════════════════════════════

export const NUCLEAR_SOURCES = {
  type: 'REQUIRES NDA AND LICENSE',
  availability: 'Nuclear facilities require security clearance',
  alternatives: {
    research: {
      name: 'MIT OpenAg Nuclear Simulator',
      note: 'Research-grade simulator for testing',
      status: 'AVAILABLE - For algorithm validation'
    },
    publicData: {
      name: 'NRC Public Data',
      url: 'https://www.nrc.gov/reactors/operating/status.html',
      data: 'Reactor status reports, power levels (hourly)',
      status: 'PUBLICLY AVAILABLE'
    },
    fusion: {
      name: 'ITER Public Data',
      url: 'https://www.iter.org/sci/plasma',
      data: 'Plasma parameters, research publications',
      status: 'AVAILABLE - Academic use'
    }
  },
  note: 'Real reactor data requires DOE/NRC approval - 6-12 month process'
};

// ═════════════════════════════════════════════════════════════════════════════
// MEDICAL - Patient Monitoring Data
// ═════════════════════════════════════════════════════════════════════════════

export const MEDICAL_SOURCES = {
  type: 'REQUIRES HIPAA COMPLIANCE',
  requirements: [
    'Business Associate Agreement (BAA)',
    'HIPAA compliance certification',
    'Patient consent forms',
    'IRB approval for research use'
  ],
  syntheticOption: {
    name: 'MIMIC-III/IV De-identified Dataset',
    source: 'PhysioNet',
    url: 'https://physionet.org/content/mimiciv/',
    patients: '400,000+ ICU stays',
    data: 'Vitals, labs, medications (de-identified)',
    status: 'AVAILABLE - Credentialed access',
    credentialing: 'Required - 2-4 week process'
  },
  wearables: {
    name: 'Consumer Health Devices',
    options: ['Apple Watch', 'Fitbit', 'Garmin', 'Oura Ring'],
    data: 'Heart rate, HRV, sleep, activity',
    api: 'HealthKit, Fitbit Web API, Garmin Connect IQ',
    status: 'PERSONAL USE ONLY'
  },
  hospitals: {
    name: 'Hospital Partnership',
    requirement: 'HIPAA Business Associate Agreement',
    timeline: '6-12 months for legal/technical setup',
    status: 'NOT YET INITIATED'
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// CLIMATE - Weather Station Data
// ═════════════════════════════════════════════════════════════════════════════

export const CLIMATE_SOURCES = {
  noaa: {
    name: 'NOAA/NWS API',
    url: 'https://api.weather.gov',
    endpoints: {
      points: '/points/{lat},{lon}',
      forecast: '/gridpoints/{office}/{gridX},{gridY}/forecast',
      stations: '/stations/{stationId}/observations'
    },
    rateLimit: 'None - Public service',
    status: 'AVAILABLE - Free, real-time',
    coverage: 'US only'
  },
  openweather: {
    name: 'OpenWeatherMap',
    url: 'https://api.openweathermap.org',
    endpoints: {
      current: '/data/2.5/weather',
      forecast: '/data/2.5/forecast'
    },
    apiKey: 'Required',
    rateLimit: '60 calls/min (free)',
    status: 'AVAILABLE - Global coverage'
  },
  personalStation: {
    name: 'Personal Weather Station',
    options: ['Davis Vantage Pro2', 'Ambient Weather WS-2902'],
    sensors: ['Temp', 'Humidity', 'Pressure', 'Wind', 'Rain', 'UV'],
    cost: '$200-500',
    status: 'HARDWARE OPTIONAL'
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// ENERGY - Smart Meter/Grid Data
// ═════════════════════════════════════════════════════════════════════════════

export const ENERGY_SOURCES = {
  utility: {
    name: 'Utility Smart Meter Data',
    providers: ['ConEdison', 'PG&E', 'Duke Energy', 'Florida Power & Light'],
    access: 'Customer portal or Green Button API',
    data: 'Hourly usage, solar generation (if applicable)',
    status: 'PERSONAL USE - If you are customer'
  },
  eia: {
    name: 'US Energy Information Administration',
    url: 'https://www.eia.gov/opendata/',
    api: 'Bulk download and REST API',
    data: [
      'Grid demand by region',
      'Generation mix (renewable vs fossil)',
      'Real-time wholesale prices',
      'Hourly updates'
    ],
    status: 'AVAILABLE - Free, public data'
  },
  smartHome: {
    name: 'Smart Home Energy Monitors',
    options: ['Sense', 'Emporia Vue', 'Neurio'],
    features: ['Real-time whole-home monitoring', 'Device-level detection'],
    cost: '$200-300',
    status: 'HARDWARE OPTIONAL'
  },
  openei: {
    name: 'Open Energy Initiative',
    url: 'https://openei.org/',
    data: 'Utility rates, solar resource data, building benchmarks',
    status: 'AVAILABLE - Free'
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// IMPLEMENTATION PRIORITY
// ═════════════════════════════════════════════════════════════════════════════

export const IMPLEMENTATION_PRIORITY = [
  // Already Active (Real Data)
  { domain: 'Chess', status: 'LIVE', source: 'Lichess API', eta: 'NOW' },
  { domain: 'Code', status: 'LIVE', source: 'GitHub API', eta: 'NOW' },
  { domain: 'Market', status: 'LIVE', source: 'Polygon.io', eta: 'NOW' },
  
  // Available Now (Free APIs)
  { domain: 'Climate', status: 'READY', source: 'NOAA API', eta: 'Today' },
  { domain: 'Energy', status: 'READY', source: 'EIA API', eta: 'Today' },
  
  // Requires Hardware
  { domain: 'Light', status: 'NEEDS_HARDWARE', source: 'Photodiodes/Spectrometer', eta: '2-4 weeks' },
  { domain: 'Spatial', status: 'NEEDS_HARDWARE', source: 'LiDAR/Depth Camera', eta: '1-2 weeks' },
  
  // Requires Partnerships
  { domain: 'Nuclear', status: 'NEEDS_LICENSE', source: 'Reactor SCADA', eta: '6-12 months' },
  { domain: 'Medical', status: 'NEEDS_HIPAA', source: 'MIMIC-IV/Hospitals', eta: '2-4 weeks (MIMIC)' }
];

// ═════════════════════════════════════════════════════════════════════════════
// DATA QUALITY REQUIREMENTS
// ═════════════════════════════════════════════════════════════════════════════

export const DATA_QUALITY_RULES = {
  chess: {
    mustHave: ['Real Lichess/Chess.com game ID', 'Actual PGN moves', 'Verified player names'],
    forbidden: ['Randomly generated positions', 'Computer-only games']
  },
  code: {
    mustHave: ['Actual commit SHAs', 'Real repository URL', 'Verified author emails'],
    forbidden: ['Fake commits', 'Simulated changes']
  },
  market: {
    mustHave: ['Real ticker symbols', 'Actual trade prices', 'Market timestamps'],
    forbidden: ['Random price generation', 'Simulated volatility']
  },
  allDomains: {
    requirement: 'Every data point must be traceable to a real source',
    logging: 'Full provenance chain required',
    validation: 'Source API response saved for audit'
  }
};
