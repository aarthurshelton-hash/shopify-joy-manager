#!/bin/bash
# Chess-Market Farm CLI
# Simple wrapper for the farm manager

FARM_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MANAGER="$FARM_DIR/scripts/farm-manager.mjs"

case "$1" in
  start)
    echo "🚀 Starting Chess-Market Farm..."
    echo "   This will run continuously in the background"
    echo ""
    node "$MANAGER" start
    echo ""
    echo "Farm is now running!"
    echo "Check status: ./farm.sh status"
    echo "View logs: ./farm.sh logs <worker-name>"
    ;;
    
  stop)
    echo "🛑 Stopping Chess-Market Farm..."
    node "$MANAGER" stop
    echo "Farm stopped."
    ;;
    
  status)
    node "$MANAGER" status
    ;;
    
  logs)
    if [ -z "$2" ]; then
      echo "Usage: ./farm.sh logs <worker-name>"
      echo ""
      echo "Available workers:"
      ls -1 "$FARM_DIR/logs/" 2>/dev/null | sed 's/.log//' | sed 's/^/  - /'
    else
      node "$MANAGER" logs "$2"
    fi
    ;;
    
  tail)
    if [ -z "$2" ]; then
      echo "Usage: ./farm.sh tail <worker-name>"
      echo ""
      echo "Available workers:"
      ls -1 "$FARM_DIR/logs/" 2>/dev/null | sed 's/.log//' | sed 's/^/  - /'
    else
      tail -f "$FARM_DIR/logs/$2.log"
    fi
    ;;
    
  monitor)
    echo "📊 Farm Monitor (Ctrl+C to exit)"
    echo ""
    while true; do
      clear
      node "$MANAGER" status
      echo ""
      echo "Recent activity:"
      tail -n 5 "$FARM_DIR/logs/farm-manager.log" 2>/dev/null
      sleep 5
    done
    ;;
    
  data)
    echo "📁 Farm Data Locations:"
    echo ""
    echo "Chess games:     $FARM_DIR/data/chess_games/"
    echo "Market analysis: $FARM_DIR/data/market_analysis/"
    echo "Benchmarks:      $FARM_DIR/data/benchmarks/"
    echo ""
    echo "Stats:"
    echo "  Chess games generated: $(ls -1 "$FARM_DIR/data/chess_games/" 2>/dev/null | wc -l) files"
    echo "  Market analyses:       $(ls -1 "$FARM_DIR/data/market_analysis/" 2>/dev/null | wc -l) files"
    ;;
    
  config)
    ${EDITOR:-nano} "$FARM_DIR/config/farm.config.json"
    ;;
    
  setup-autostart)
    echo "🔧 Setting up auto-start on boot..."
    
    # Create LaunchAgent plist
    PLIST_PATH="$HOME/Library/LaunchAgents/com.chessmarket.farm.plist"
    
    cat > "$PLIST_PATH" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.chessmarket.farm</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>SCRIPT_PATH</string>
        <string>start</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>LOG_PATH/launchd.out.log</string>
    <key>StandardErrorPath</key>
    <string>LOG_PATH/launchd.err.log</string>
    <key>WorkingDirectory</key>
    <string>FARM_DIR</string>
</dict>
</plist>
EOF
    
    # Replace placeholders with actual paths
    sed -i '' "s|SCRIPT_PATH|$FARM_DIR/farm/farm.sh|g" "$PLIST_PATH"
    sed -i '' "s|LOG_PATH|$FARM_DIR/farm/logs|g" "$PLIST_PATH"
    sed -i '' "s|FARM_DIR|$FARM_DIR|g" "$PLIST_PATH"
    
    # Load the agent
    launchctl load "$PLIST_PATH" 2>/dev/null || launchctl unload "$PLIST_PATH" 2>/dev/null; launchctl load "$PLIST_PATH"
    
    echo "✅ Auto-start configured!"
    echo "   The farm will start automatically on boot."
    echo "   LaunchAgent: $PLIST_PATH"
    echo ""
    echo "To disable auto-start:"
    echo "   launchctl unload ~/Library/LaunchAgents/com.chessmarket.farm.plist"
    ;;
    
  remove-autostart)
    echo "🗑️  Removing auto-start configuration..."
    PLIST_PATH="$HOME/Library/LaunchAgents/com.chessmarket.farm.plist"
    
    if [ -f "$PLIST_PATH" ]; then
      launchctl unload "$PLIST_PATH" 2>/dev/null
      rm "$PLIST_PATH"
      echo "✅ Auto-start removed."
    else
      echo "No auto-start configuration found."
    fi
    ;;
    
  help|*)
    echo "🌾 Chess-Market Farm Management CLI"
    echo ""
    echo "Usage: ./farm.sh [command]"
    echo ""
    echo "Commands:"
    echo "  start              Start the farm (runs in background)"
    echo "  stop               Stop all farm workers"
    echo "  status             Show status of all workers"
    echo "  logs <worker>      Show logs for a specific worker"
    echo "  tail <worker>      Follow logs in real-time"
    echo "  monitor            Live monitoring dashboard"
    echo "  data               Show data locations and stats"
    echo "  config             Edit farm configuration"
    echo "  setup-autostart    Enable auto-start on boot"
    echo "  remove-autostart   Disable auto-start on boot"
    echo "  help               Show this help"
    echo ""
    echo "Examples:"
    echo "  ./farm.sh start"
    echo "  ./farm.sh status"
    echo "  ./farm.sh tail chess-game-0"
    echo ""
    echo "Workers:"
    echo "  chess-game-{n}      - Generates Stockfish vs Stockfish games"
    echo "  market-analyzer-{n} - Analyzes market data"
    echo "  prediction-benchmark-{n} - Runs prediction benchmarks"
    ;;
esac
