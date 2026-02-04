# High-Frequency Trading System - Production Deployment

## Quick Start

### Option 1: PM2 (Recommended for 24/7)
```bash
# Install PM2 globally
npm install -g pm2

# Start all services
pm2 start ecosystem.config.json

# Monitor
pm2 monit

# View logs
pm2 logs

# Stop all
pm2 stop all
```

### Option 2: Simple Node Script
```bash
# Start production mode
node farm/scripts/start-production.mjs
```

### Option 3: Background Processes
```bash
# Terminal 1: Start Bridge
node public/ib-gateway-bridge/server-simple.js > /tmp/bridge.log 2>&1 &

# Terminal 2: Start Trader (after bridge is running)
node farm/workers/high-frequency-paper-trader.mjs > /tmp/trader.log 2>&1 &
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| IB Bridge | 4000 | Connects to IB Gateway |
| HF Trader | - | Executes trades every 30s |
| Dashboard | 5173 | Web UI for monitoring |

## Monitoring

- **Dashboard**: http://localhost:5173/stock-predictions
- **Bridge Status**: http://localhost:4000/api/status
- **Supabase**: https://aufycarwflhsdgszbnop.supabase.co

## Auto-Restart on Boot (macOS)

Create a plist file:
```bash
# Create LaunchAgent
mkdir -p ~/Library/LaunchAgents
cat > ~/Library/LaunchAgents/com.hf-trader.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.hf-trader</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>$(pwd)/farm/scripts/start-production.mjs</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$(pwd)</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/hf-trader.stdout</string>
    <key>StandardErrorPath</key>
    <string>/tmp/hf-trader.stderr</string>
</dict>
</plist>
EOF

# Load and start
launchctl load ~/Library/LaunchAgents/com.hf-trader.plist
launchctl start com.hf-trader
```

## Configuration

Edit `farm/workers/high-frequency-paper-trader.mjs`:
```javascript
const CONFIG = {
  CYCLE_INTERVAL_MS: 30000,        // Trade frequency
  SIMULATED_FILL: true,            // Set to false for live IBKR
  // ... other settings
};
```

## Logs

- Bridge: `/tmp/bridge-simple.log` or `pm2 logs ib-bridge`
- Trader: `/tmp/hf-trader.log` or `pm2 logs hf-trader`
- System: `/tmp/pm2-*.log`

## Troubleshooting

**Bridge won't connect:**
```bash
curl -X POST http://localhost:4000/api/connect
```

**Check if services running:**
```bash
pm2 status
# or
ps aux | grep -E "(bridge|high-frequency)"
```

**View recent trades:**
```bash
tail -f /tmp/hf-trader.log | grep "OPENED\|CLOSED"
```
