#!/bin/bash
# En Pensent Bulletproof 24/7 Farm Worker
# Ensures continuous real game processing from Lichess & Chess.com

WORKER_NAME="enpensent-farm-0"
LOG_FILE="/Users/alecshelts/shopify-joy-manager/farm/logs/${WORKER_NAME}.log"
PID_FILE="/tmp/${WORKER_NAME}.pid"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  EN PENSENT BULLETPROOF FARM - 24/7 Data Sourcing        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Kill any existing workers
pkill -9 -f "enpensent-benchmark-worker\|ep-enhanced-worker" 2>/dev/null
sleep 2

# Clear old logs to ensure fresh start
echo "" > "$LOG_FILE"

echo "[$(date)] Starting 24/7 worker..."
cd /Users/alecshelts/shopify-joy-manager

# Start worker with proper environment
export USE_ENHANCED=true
export WORKER_ID="$WORKER_NAME"
export NODE_ENV=production
export ENGINE_VERSION="2.0-SF17-REAL"

# Run worker in background with auto-restart logic
while true; do
    echo "[$(date)] Starting worker cycle (v2.0-SF17-REAL)..."
    node farm/workers/enpensent-benchmark-worker-v2.mjs 0 >> "$LOG_FILE" 2>&1
    echo "[$(date)] Worker exited, restarting in 5 seconds..."
    sleep 5
done &

WORKER_PID=$!
echo $WORKER_PID > "$PID_FILE"

echo "✅ Worker started (PID: $WORKER_PID)"
echo "📊 Log file: $LOG_FILE"
echo "🔄 Auto-restart: ENABLED"
echo ""
echo "Data Sources:"
echo "  • Lichess API (GM games)"
echo "  • Chess.com API (coming soon)"
echo "  • 8-Quadrant Enhanced Predictions"
echo "  • Supabase Real-time Sync"
echo ""
echo "To monitor: tail -f $LOG_FILE | grep -E '(Saved|Lichess|accuracy)'"
