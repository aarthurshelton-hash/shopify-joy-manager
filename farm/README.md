# Chess-Market Compute Farm 🌾

Dedicated compute farm for continuous chess game generation and market prediction analysis.

## Quick Start

```bash
cd farm

# Start the farm (runs in background)
./farm.sh start

# Check status
./farm.sh status

# Monitor live
./farm.sh monitor

# View logs
./farm.sh logs chess-game-0
./farm.sh tail chess-game-1

# Stop everything
./farm.sh stop
```

## Architecture

### Workers
- **Chess Game Generators** (`chess-game-{n}`)
  - Continuously generate Stockfish vs Stockfish games
  - Configurable batch size, depth, max moves
  - Auto-restart on failure
  - Memory-aware throttling

- **Market Analyzers** (`market-analyzer-{n}`)
  - Periodic market data analysis
  - Configurable symbols and intervals
  - Generates predictions with confidence scores

- **Prediction Benchmarks** (`prediction-benchmark-{n}`)
  - Runs continuous accuracy benchmarks
  - Compares hybrid vs Stockfish predictions
  - Generates statistical reports

### Process Manager
- Auto-restarts failed workers
- Tracks PIDs for cleanup
- Resource monitoring (memory/CPU)
- Graceful shutdown handling

## Configuration

Edit `config/farm.config.json`:

```json
{
  "workers": {
    "chessGameGenerator": {
      "enabled": true,
      "instances": 2,
      "batchSize": 5,
      "depth": 18,
      "maxMoves": 100
    },
    "marketAnalyzer": {
      "enabled": true,
      "symbols": ["SPY", "QQQ", "IWM"]
    }
  }
}
```

## Data Locations

- Chess games: `./farm/data/chess_games/`
- Market analysis: `./farm/data/market_analysis/`
- Benchmarks: `./farm/data/benchmarks/`
- Logs: `./farm/logs/`

## System Requirements

- macOS (this Mac stays plugged in 24/7)
- Node.js 18+
- ~4GB RAM for 2 chess workers + 1 market worker
- WiFi connection
- Power adapter connected

## Monitoring

```bash
# Live dashboard
./farm.sh monitor

# Check specific worker logs
./farm.sh tail chess-game-1

# View data stats
./farm.sh data
```

## Auto-Start on Boot (Optional)

Create a LaunchAgent:

```bash
# Create plist file
cat > ~/Library/LaunchAgents/com.chessmarket.farm.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.chessmarket.farm</string>
    <key>ProgramArguments</key>
    <array>
        <string>/Users/alecshelts/shopify-joy-manager/farm/farm.sh</string>
        <string>start</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/Users/alecshelts/shopify-joy-manager/farm/logs/launchd.out.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/alecshelts/shopify-joy-manager/farm/logs/launchd.err.log</string>
</dict>
</plist>
EOF

# Load it
launchctl load ~/Library/LaunchAgents/com.chessmarket.farm.plist
```

## Troubleshooting

**High memory usage:**
- Workers auto-pause when memory > 80%
- Reduce `instances` in config
- Increase `restBetweenBatchesMs`

**Worker keeps restarting:**
- Check logs: `./farm.sh logs chess-game-0`
- Verify Stockfish engine is available
- Check disk space for data storage

**Farm won't start:**
- Ensure no orphaned processes: `pkill -f farm-manager`
- Clear PID files: `rm farm/pids/*`
- Check Node.js version: `node --version`

## License

Part of Shopify Joy Manager thesis project.
