/**
 * Universal Domain Data Sources
 * 
 * Maps each of the 70 adapter domains to FREE real-data APIs.
 * Every API listed here requires NO auth key or has a free tier.
 * 
 * TIER 1: Live APIs — fetch JSON, get temporal data, predict next state
 * TIER 2: Downloadable datasets — one-time fetch, run offline benchmarks
 * TIER 3: Theoretical — no direct API, but can derive from Tier 1/2 data
 * 
 * For Alec Arthur Shelton — En Pensent Universal Intelligence
 */

// ═══════════════════════════════════════════════════════════
// TIER 1: LIVE FREE APIs (NO AUTH, JSON, TEMPORAL DATA)
// These can be polled continuously for real-time benchmarking
// ═══════════════════════════════════════════════════════════

export const TIER1_LIVE_APIS = {
  // ─── EARTH SCIENCES ───
  meteorological: {
    name: 'Weather/Meteorological',
    api: 'https://api.open-meteo.com/v1/forecast',
    sample: 'https://api.open-meteo.com/v1/forecast?latitude=45.50&longitude=-73.57&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,pressure_msl,precipitation,cloud_cover&past_days=7',
    prediction: 'Predict next-hour temperature/pressure/humidity from temporal pattern',
    baseline: 'Persistence (next hour = this hour)',
    channels: ['temperature', 'humidity', 'wind_speed', 'pressure', 'precipitation', 'cloud_cover'],
    interval: '1 hour',
    noAuth: true,
  },
  
  geologicalTectonic: {
    name: 'Seismic/Earthquake',
    api: 'https://earthquake.usgs.gov/fdsnws/event/1/query',
    sample: 'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2026-02-07&endtime=2026-02-14&minmagnitude=2',
    prediction: 'Predict magnitude class of next event in region (micro/minor/light/moderate/strong)',
    baseline: 'Persistence (same as last event magnitude class)',
    channels: ['magnitude', 'depth', 'latitude', 'longitude', 'gap', 'rms'],
    interval: 'Per event (~50-200/day globally)',
    noAuth: true,
  },
  
  oceanographic: {
    name: 'Ocean/Tides/Waves',
    api: 'https://api.open-meteo.com/v1/marine',
    sample: 'https://api.open-meteo.com/v1/marine?latitude=43.65&longitude=-70.25&hourly=wave_height,wave_direction,wave_period,swell_wave_height&past_days=7',
    prediction: 'Predict next-hour wave height and direction',
    baseline: 'Persistence',
    channels: ['wave_height', 'wave_direction', 'wave_period', 'swell_height'],
    interval: '1 hour',
    noAuth: true,
  },
  
  climateAtmospheric: {
    name: 'Air Quality/Atmospheric',
    api: 'https://air-quality-api.open-meteo.com/v1/air-quality',
    sample: 'https://air-quality-api.open-meteo.com/v1/air-quality?latitude=45.50&longitude=-73.57&hourly=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,ozone,uv_index&past_days=7',
    prediction: 'Predict next-hour PM2.5 / ozone level class',
    baseline: 'Persistence',
    channels: ['pm2_5', 'pm10', 'carbon_monoxide', 'nitrogen_dioxide', 'ozone', 'uv_index'],
    interval: '1 hour',
    noAuth: true,
  },
  
  // ─── ASTRONOMY/SPACE ───
  astronomical: {
    name: 'Solar/Space Weather',
    api: 'https://services.swpc.noaa.gov/json/',
    sample: 'https://services.swpc.noaa.gov/json/solar-cycle/predicted-solar-cycle.json',
    altApis: [
      'https://api.le-systeme-solaire.net/rest/bodies/', // Solar system bodies
      'https://api.arcsecond.io/activities/', // Astronomical activities
      'https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json', // Kp geomagnetic index
    ],
    prediction: 'Predict next Kp geomagnetic index level / solar wind state',
    baseline: 'Persistence',
    channels: ['kp_index', 'solar_wind_speed', 'bz_field', 'sunspot_number', 'xray_flux', 'proton_flux'],
    interval: '3 hours (Kp), hourly (solar wind)',
    noAuth: true,
  },
  
  // ─── ECONOMICS/FINANCE ───
  economicCircuitry: {
    name: 'Economic Indicators',
    api: 'https://api.worldbank.org/v2/',
    sample: 'https://api.worldbank.org/v2/country/USA/indicator/NY.GDP.MKTP.KD.ZG?format=json&date=2015:2024',
    altApis: [
      'https://api.coinbase.com/v2/exchange-rates?currency=USD', // Exchange rates
      'https://open.er-api.com/v6/latest/USD', // Exchange rates
      'https://api.coinpaprika.com/v1/tickers', // Crypto tickers
    ],
    prediction: 'Predict next-period exchange rate direction / crypto price direction',
    baseline: 'Random walk',
    channels: ['gdp_growth', 'inflation', 'unemployment', 'exchange_rate', 'trade_balance', 'interest_rate'],
    interval: 'Quarterly (macro), minute (crypto)',
    noAuth: true,
  },
  
  // ─── CRIME/SECURITY ───
  criminal: {
    name: 'Crime Data',
    api: 'https://data.police.uk/api/',
    sample: 'https://data.police.uk/api/crimes-street/all-crime?lat=52.629729&lng=-1.131592&date=2023-01',
    prediction: 'Predict crime category for next period in area',
    baseline: 'Most frequent category',
    channels: ['crime_type', 'latitude', 'longitude', 'outcome_status', 'month'],
    interval: 'Monthly',
    noAuth: true,
  },
  
  cybersecurity: {
    name: 'Cyber Threats',
    api: 'https://urlhaus-api.abuse.ch/v1/',
    sample: 'https://urlhaus-api.abuse.ch/v1/urls/recent/limit/100/',
    altApis: [
      'https://cve.circl.lu/api/last', // Recent CVEs
    ],
    prediction: 'Predict threat type category of next reported URL/CVE',
    baseline: 'Most frequent type',
    channels: ['threat_type', 'severity', 'target_platform', 'attack_vector', 'date_added'],
    interval: 'Per event (~hundreds/day)',
    noAuth: true,
  },
  
  // ─── SPORTS ───
  sports: {
    name: 'Sports/Competition',
    api: 'https://www.thesportsdb.com/api/v1/json/3/',
    sample: 'https://www.thesportsdb.com/api/v1/json/3/eventspastleague.php?id=4328',
    prediction: 'Predict match outcome (home/away/draw) from team form temporal pattern',
    baseline: 'Home team wins (most common)',
    channels: ['home_score', 'away_score', 'home_form', 'away_form', 'venue', 'league'],
    interval: 'Per match',
    noAuth: true,
  },
  
  // ─── ENERGY/ENVIRONMENT ───
  energy: {
    name: 'Carbon/Energy Intensity',
    api: 'https://api.carbonintensity.org.uk/',
    sample: 'https://api.carbonintensity.org.uk/intensity/date',
    prediction: 'Predict next half-hour carbon intensity level (very low/low/moderate/high/very high)',
    baseline: 'Persistence',
    channels: ['intensity_forecast', 'intensity_actual', 'generation_mix', 'wind', 'solar', 'gas'],
    interval: '30 minutes',
    noAuth: true,
  },
  
  // ─── INFORMATION/VIRALITY ───
  informationVirality: {
    name: 'Information Spread / Virality',
    api: 'https://hacker-news.firebaseio.com/v0/',
    sample: 'https://hacker-news.firebaseio.com/v0/topstories.json',
    altApis: [
      'https://www.reddit.com/r/all/top.json?limit=100&t=day', // Reddit trending
      'https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/all-agents/Bitcoin/daily/20260201/20260214',
    ],
    prediction: 'Predict score trajectory class (viral/steady/declining) of new post',
    baseline: 'Most items are steady',
    channels: ['score', 'comments', 'age_hours', 'rank_position', 'velocity', 'domain'],
    interval: 'Per item (~500 new/day on HN)',
    noAuth: true,
  },
  
  // ─── DEMOGRAPHIC ───
  demographic: {
    name: 'Population/Migration',
    api: 'https://datausa.io/api/data',
    sample: 'https://datausa.io/api/data?drilldowns=Nation&measures=Population',
    prediction: 'Predict next-period population change direction by state',
    baseline: 'Persistence (same trend as last period)',
    channels: ['population', 'growth_rate', 'median_age', 'migration_rate', 'birth_rate', 'death_rate'],
    interval: 'Yearly',
    noAuth: true,
  },
};

// ═══════════════════════════════════════════════════════════
// TIER 2: DOWNLOADABLE DATASETS (ONE-TIME FETCH, OFFLINE BENCHMARK)
// These require downloading but provide rich temporal data
// ═══════════════════════════════════════════════════════════

export const TIER2_DOWNLOADS = {
  // ─── ALREADY ACTIVE IN PRODUCTION ───
  music: {
    name: 'Music/MIDI (ACTIVE)',
    source: 'Lakh MIDI Dataset / MAESTRO',
    url: 'https://magenta.tensorflow.org/datasets/maestro',
    altUrls: [
      'https://colinraffel.com/projects/lmd/', // 176K MIDI files
      'https://magenta.tensorflow.org/datasets/nsynth', // NSynth audio features
    ],
    size: '~3.5 GB (MAESTRO), ~6 GB (Lakh)',
    prediction: 'Predict next-phrase melodic direction (ascending/descending/stable)',
    status: 'ACTIVE — 3.79M predictions at 34.7%',
    note: 'DOWNLOAD: curl -O https://storage.googleapis.com/magentadata/datasets/maestro/v3.0.0/maestro-v3.0.0-midi.zip',
  },
  
  botanical: {
    name: 'Plant/Botanical',
    source: 'iNaturalist / GBIF',
    url: 'https://api.gbif.org/v1/',
    sample: 'https://api.gbif.org/v1/occurrence/search?taxonKey=6&limit=20',
    prediction: 'Predict species family from temporal/spatial occurrence patterns',
    baseline: 'Most common family in region',
    channels: ['species', 'latitude', 'longitude', 'elevation', 'month', 'habitat_type'],
    noAuth: true,
  },
  
  genetic: {
    name: 'Genomic/Genetic',
    source: 'NCBI / Ensembl',
    url: 'https://rest.ensembl.org/',
    sample: 'https://rest.ensembl.org/info/assembly/homo_sapiens?content-type=application/json',
    prediction: 'Predict gene expression direction from regulatory pattern',
    baseline: 'Persistence',
    channels: ['expression_level', 'gc_content', 'conservation_score', 'chromatin_state'],
    noAuth: true,
  },
  
  pharmacological: {
    name: 'Drug/Pharma',
    source: 'openFDA',
    url: 'https://api.fda.gov/',
    sample: 'https://api.fda.gov/drug/event.json?limit=20',
    prediction: 'Predict adverse event category from drug interaction pattern',
    baseline: 'Most common event type',
    channels: ['reaction', 'drug_class', 'route', 'dose', 'patient_age', 'severity'],
    noAuth: true,
  },
  
  medical: {
    name: 'Medical/Health',
    source: 'openFDA + NPPES',
    url: 'https://api.fda.gov/device/event.json?limit=20',
    prediction: 'Predict event type from device/patient temporal pattern',
    baseline: 'Most frequent event',
    noAuth: true,
  },
  
  electoral: {
    name: 'Electoral/Polling',
    source: 'Dawum (German polls) + Data.gov',
    url: 'https://api.dawum.de/',
    sample: 'https://api.dawum.de/',
    prediction: 'Predict party polling direction from temporal trend',
    baseline: 'Persistence (same as last poll)',
    noAuth: true,
  },
  
  judicial: {
    name: 'Legal/Judicial',
    source: 'Federal Register + USPTO',
    url: 'https://www.federalregister.gov/api/v1/',
    sample: 'https://www.federalregister.gov/api/v1/documents.json?per_page=20&order=newest',
    prediction: 'Predict regulation category from temporal pattern',
    baseline: 'Most common category',
    noAuth: true,
  },
  
  linguisticSemantic: {
    name: 'Linguistic/NLP',
    source: 'Datamuse API / Free Dictionary',
    url: 'https://api.datamuse.com/',
    sample: 'https://api.datamuse.com/words?ml=love&max=50',
    prediction: 'Predict semantic similarity cluster from word context pattern',
    baseline: 'Most common cluster',
    noAuth: true,
  },

  artistic: {
    name: 'Art/Cultural',
    source: 'Art Institute of Chicago / Metropolitan Museum',
    url: 'https://api.artic.edu/api/v1/',
    altUrls: [
      'https://collectionapi.metmuseum.org/public/collection/v1/objects', // Met Museum
    ],
    sample: 'https://api.artic.edu/api/v1/artworks?limit=20&fields=id,title,date_start,date_end,medium_display,style_title,classification_title',
    prediction: 'Predict art movement/style from temporal/medium patterns',
    baseline: 'Most common style in period',
    noAuth: true,
  },

  gastronomic: {
    name: 'Food/Gastronomy',
    source: 'Open Food Facts',
    url: 'https://world.openfoodfacts.org/api/v0/',
    sample: 'https://world.openfoodfacts.org/api/v0/product/737628064502.json',
    prediction: 'Predict nutrition grade from ingredient pattern',
    baseline: 'Most common grade',
    noAuth: true,
  },
  
  supplyChain: {
    name: 'Supply Chain/Trade',
    source: 'UN Comtrade / World Bank Trade',
    url: 'https://api.worldbank.org/v2/',
    sample: 'http://api.worldbank.org/v2/country/USA/indicator/NE.IMP.GNFS.ZS?format=json&date=2015:2024',
    prediction: 'Predict trade balance direction from historical pattern',
    baseline: 'Persistence',
    noAuth: true,
  },
};

// ═══════════════════════════════════════════════════════════
// TIER 3: DERIVABLE DOMAINS (computed from Tier 1/2 data)
// No direct API — but mathematically extractable from other sources
// ═══════════════════════════════════════════════════════════

export const TIER3_DERIVED = {
  // These use the consciousness/synesthetic channels we just built
  consciousness: 'Derived from music + chess temporal patterns (déjà vu, memory depth, dream entropy)',
  mentalTimeTravel: 'Derived from cross-domain temporal correlations (past→future pattern bridges)',
  temporalConsciousnessSpeedrun: 'Derived from game/music speedrun pattern analysis',
  soul: 'Derived from cross-domain harmonic resonance scores (the interference pattern across ALL domains)',
  sensoryMemoryHumor: 'Derived from music synesthetic channels + NLP sentiment analysis',
  psychedelic: 'Derived from music dream_entropy + imagination_novelty channels',
  
  // Game theory derived from competitive domains
  gameTheory: 'Derived from chess + sports + market data (Nash equilibria in multi-agent temporal systems)',
  competitiveDynamics: 'Derived from sports + market data (competitive equilibrium patterns)',
  
  // Physics-based derived from sensor data
  atomic: 'Derived from spectral analysis of any oscillating time series',
  molecular: 'Derived from multi-channel correlation patterns (molecular binding = channel correlation)',
  nuclear: 'Derived from energy intensity + decay patterns in any domain',
  grotthussMechanism: 'Derived from cascade/propagation patterns in any temporal data',
  light: 'The grid itself IS the light — color encoding is classification',
  
  // Social/cultural derived
  diplomaticAdapter: 'Derived from electoral + economic + trade data (international relations)',
  economicWarfare: 'Derived from exchange rates + trade data + sanctions events',
  social: 'Derived from Reddit/HN virality + Wikipedia pageviews (collective behavior)',
  narrative: 'Derived from news/journalistic temporal patterns (story arc detection)',
  romantic: 'Derived from music harmonic analysis (tension/resolution/consonance patterns)',
  humanAttraction: 'Derived from music + social media engagement patterns',
  
  // Meta-domains
  universalPatterns: 'The CROSS-DOMAIN correlation engine — finds patterns that appear in ALL domains',
  universalRealizationImpulse: 'Derived from novelty detection across all domains simultaneously',
  mathematicalFoundations: 'The grid architecture itself — topology, group theory, information geometry',
  rubiksCube: 'Derived from chess (combinatorial state space search, group theory)',
  mycelium: 'Derived from network topology of cross-domain correlations (underground connections)',
  spatial: 'The 8×8 grid IS spatial — every domain maps to spatial patterns',
};

// ═══════════════════════════════════════════════════════════
// MASTER BENCHMARK REGISTRY
// For the universal-benchmark-worker
// ═══════════════════════════════════════════════════════════

export const BENCHMARK_DOMAINS = [
  // Tier 1: Live APIs (immediate benchmarking)
  { id: 'weather', adapter: 'meteorological', tier: 1, classes: 3, classNames: ['warming', 'cooling', 'stable'], interval_ms: 3600000 },
  { id: 'earthquake', adapter: 'geologicalTectonic', tier: 1, classes: 4, classNames: ['micro', 'minor', 'light', 'moderate+'], interval_ms: 300000 },
  { id: 'ocean', adapter: 'oceanographic', tier: 1, classes: 3, classNames: ['rising', 'falling', 'stable'], interval_ms: 3600000 },
  { id: 'air_quality', adapter: 'climateAtmospheric', tier: 1, classes: 3, classNames: ['improving', 'worsening', 'stable'], interval_ms: 3600000 },
  { id: 'solar', adapter: 'astronomical', tier: 1, classes: 3, classNames: ['quiet', 'active', 'storm'], interval_ms: 10800000 },
  { id: 'economy', adapter: 'economicCircuitry', tier: 1, classes: 3, classNames: ['strengthening', 'weakening', 'stable'], interval_ms: 86400000 },
  { id: 'crime', adapter: 'criminal', tier: 1, classes: 5, classNames: ['violent', 'property', 'drug', 'public_order', 'other'], interval_ms: 86400000 },
  { id: 'cyber', adapter: 'cybersecurity', tier: 1, classes: 4, classNames: ['malware', 'phishing', 'exploit', 'other'], interval_ms: 600000 },
  { id: 'sports', adapter: 'sports', tier: 1, classes: 3, classNames: ['home_win', 'away_win', 'draw'], interval_ms: 86400000 },
  { id: 'carbon', adapter: 'energy', tier: 1, classes: 5, classNames: ['very_low', 'low', 'moderate', 'high', 'very_high'], interval_ms: 1800000 },
  { id: 'virality', adapter: 'informationVirality', tier: 1, classes: 3, classNames: ['viral', 'steady', 'declining'], interval_ms: 3600000 },
  
  // Tier 2: Downloadable (needs initial data fetch)
  { id: 'botanical', adapter: 'botanical', tier: 2, classes: 5, interval_ms: 86400000 },
  { id: 'pharma', adapter: 'pharmacological', tier: 2, classes: 4, interval_ms: 86400000 },
  { id: 'food', adapter: 'gastronomic', tier: 2, classes: 5, interval_ms: 86400000 },
  { id: 'art', adapter: 'artistic', tier: 2, classes: 4, interval_ms: 86400000 },
  { id: 'language', adapter: 'linguisticSemantic', tier: 2, classes: 3, interval_ms: 86400000 },
];

export default { TIER1_LIVE_APIS, TIER2_DOWNLOADS, TIER3_DERIVED, BENCHMARK_DOMAINS };
