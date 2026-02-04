# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

## Quick Start

### 1. Environment Setup

Create `.env` file in project root:

```bash
# Supabase (Required)
VITE_SUPABASE_URL=https://aufycarwflhsdgszbnop.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_key_here

# Trading (Optional - uses paper trading by default)
IB_BRIDGE_URL=http://localhost:4000
IB_GATEWAY_HOST=127.0.0.1
IB_GATEWAY_PORT=4002

# Price Data (Optional - enhances price accuracy)
ALPHA_VANTAGE_API_KEY=your_key
POLYGON_API_KEY=your_key

# Notifications (Optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### 2. Start Workers

**Terminal 1 - IB Gateway Bridge:**
```bash
cd ~/shopify-joy-manager && node public/ib-gateway-bridge/server-simple.js
```

**Terminal 2 - High-Frequency Trader:**
```bash
cd ~/shopify-joy-manager && node farm/workers/high-frequency-paper-trader.mjs
```

**Terminal 3 - Chess Benchmark:**
```bash
cd ~/shopify-joy-manager && node farm/workers/chess-benchmark-farm.mjs
```

**Terminal 4 - Frontend:**
```bash
cd ~/shopify-joy-manager && npm run dev
```

### 3. Access Dashboards

- Trading: http://localhost:5173/stock-predictions
- Benchmark: http://localhost:5173/benchmark

## Features

### High-Frequency Trading
- Daily drawdown limit (5% auto-shutdown)
- Trailing stops (1% trigger, 0.5% trail)
- Correlation filtering (max 2 per sector)
- Trading hours (10:00-15:30 ET)
- Multi-source price aggregation
- ATR-based position sizing
- VWAP/TWAP execution
- PnL attribution by symbol

### Chess Benchmark
- GM filtering (2500+ ELO)
- Minimum 30 moves
- Chess.com API integration
- Stockfish cache (24h TTL)
- Opening book integration

## Configuration

### Trading Worker
```javascript
{
  CYCLE_INTERVAL_MS: 30000,
  MIN_CONFIDENCE: 0.45,
  POSITION_SIZE_PERCENT: 2,
  MAX_DAILY_DRAWDOWN_PERCENT: 5.0,
  CORRELATION_GROUPS: {
    tech: ['AAPL', 'MSFT', 'NVDA', 'AMD', 'META', 'GOOGL', 'AMZN'],
    etf: ['SPY', 'QQQ', 'IWM'],
    ev: ['TSLA']
  }
}
```

### Chess Worker
```javascript
{
  MIN_ELO: 2500,
  MIN_MOVES: 30,
  MAX_GAMES_PER_CYCLE: 5
}
```

## Monitoring

### Health Checks
```bash
curl http://localhost:4000/health
```

### Logs
```bash
# Worker logs
farm/logs/*.log
```

## Documentation

- `docs/SYSTEM_ENHANCEMENT_AUDIT.md` - Feature roadmap
- `ecosystem.config.json` - PM2 configuration

## License

MIT License

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
