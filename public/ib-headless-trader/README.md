# IBKR Headless Autonomous Trader

A standalone 24/7 trading bot for IBKR paper accounts that runs on your dedicated home machine.

## Prerequisites

1. **IB Gateway** running and logged in (paper trading mode)
2. **Bridge Server** running (`ib-gateway-bridge/`)
3. **Node.js 18+** installed

## Quick Start

```bash
# 1. First, start IB Gateway and log in

# 2. Start the bridge server
cd ../ib-gateway-bridge
npm install
npm start

# 3. In a new terminal, start the headless trader
cd ../ib-headless-trader
npm install
npm start
```

## Configuration

Edit `config.js` to customize:

- **SYMBOLS**: Stocks to trade
- **MAX_POSITION_SIZE**: Max shares per trade
- **STOP_LOSS_PERCENT**: Stop loss threshold
- **TAKE_PROFIT_PERCENT**: Take profit threshold
- **MIN_CONFIDENCE**: Minimum signal confidence to enter trade
- **SCAN_INTERVAL_MS**: How often to scan for opportunities

## Running 24/7 with PM2

For true 24/7 operation, use PM2:

```bash
# Install PM2 globally
npm install -g pm2

# Start the trader with PM2
pm2 start trader.js --name "ib-trader"

# View logs
pm2 logs ib-trader

# Monitor
pm2 monit

# Auto-start on boot
pm2 startup
pm2 save
```

## Running as a System Service (macOS/Linux)

### macOS (launchd)

Create `~/Library/LaunchAgents/com.ibkr.trader.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.ibkr.trader</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>/path/to/ib-headless-trader/trader.js</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>WorkingDirectory</key>
    <string>/path/to/ib-headless-trader</string>
    <key>StandardOutPath</key>
    <string>/tmp/ib-trader.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/ib-trader.error.log</string>
</dict>
</plist>
```

Load with:
```bash
launchctl load ~/Library/LaunchAgents/com.ibkr.trader.plist
```

### Linux (systemd)

Create `/etc/systemd/system/ib-trader.service`:

```ini
[Unit]
Description=IBKR Headless Trader
After=network.target

[Service]
Type=simple
User=YOUR_USERNAME
WorkingDirectory=/path/to/ib-headless-trader
ExecStart=/usr/bin/node trader.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable with:
```bash
sudo systemctl enable ib-trader
sudo systemctl start ib-trader
```

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Headless       │────▶│  Bridge Server  │────▶│  IB Gateway     │
│  Trader         │     │  (port 4000)    │     │  (port 4002)    │
│  (this script)  │◀────│                 │◀────│                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
                                                ┌─────────────────┐
                                                │  IBKR Servers   │
                                                │  (Paper Account)│
                                                └─────────────────┘
```

## Monitoring

Check the logs for:
- `✅ Connected to IB Gateway` - Successful connection
- `Signal detected for SYMBOL` - Trading signal identified
- `✅ Order placed: ID` - Order submitted successfully
- `Stop loss triggered` - Position closed at loss
- `Take profit triggered` - Position closed at profit

## Customizing Trading Logic

The `calculateSignal()` function in `trader.js` contains the trading logic. Replace it with your own strategy:

```javascript
function calculateSignal(symbol) {
  // Your custom logic here
  // Return: { symbol, direction: 'LONG'|'SHORT', confidence: 0-1 }
}
```

## Troubleshooting

1. **"Not connected"**: Ensure IB Gateway is running and API is enabled
2. **"Could not find contract"**: Symbol may not be available on IBKR
3. **"Order failed"**: Check IB Gateway for error messages
4. **No trades executing**: Check if market is open and confidence threshold is met
