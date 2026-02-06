#!/bin/bash
# En Pensent Chess Benchmark 24/7 Service
# Runs without PM2 - pure background process with auto-restart

WORKER_DIR="/Users/alecshelts/shopify-joy-manager"
LOG_FILE="$WORKER_DIR/farm/logs/chess-benchmark-24x7.log"
PID_FILE="$WORKER_DIR/farm/pids/chess-benchmark.pid"

echo "Starting En Pensent Chess Benchmark 24/7 Service..."
echo "Log file: $LOG_FILE"
echo "PID file: $PID_FILE"

# Kill existing process
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if kill -0 "$OLD_PID" 2>/dev/null; then
        echo "Stopping existing process $OLD_PID..."
        kill -9 "$OLD_PID"
        sleep 2
    fi
fi

# Clear old log
> "$LOG_FILE"

# Start worker in background with auto-restart
cd "$WORKER_DIR" || exit 1

while true; do
    echo "[$(date)] Starting chess-benchmark worker..." >> "$LOG_FILE"
    
    USE_ENHANCED=true WORKER_ID=chess-benchmark-24x7 \
        node farm/workers/ep-enhanced-worker.mjs >> "$LOG_FILE" 2>&1 &
    
    PID=$!
    echo $PID > "$PID_FILE"
    echo "[$(date)] Worker started with PID: $PID" >> "$LOG_FILE"
    
    # Monitor the process
    wait $PID
    EXIT_CODE=$?
    
    echo "[$(date)] Worker exited with code: $EXIT_CODE. Restarting in 5 seconds..." >> "$LOG_FILE"
    sleep 5
done &

# Save the monitor PID
echo $! > "$PID_FILE.monitor"
echo "✓ Chess Benchmark 24/7 service started"
echo "Monitor PID: $!"
echo ""
echo "To stop: kill $(cat $PID_FILE.monitor)"
echo "To view logs: tail -f $LOG_FILE"
