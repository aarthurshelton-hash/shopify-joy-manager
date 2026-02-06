#!/bin/bash
# Install PM2 globally and set up ecosystem

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     EN PENSENT PM2 INSTALLATION & SETUP                    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if PM2 is already installed
if command -v pm2 &> /dev/null; then
    echo "✅ PM2 is already installed"
    pm2 --version
else
    echo "📦 Installing PM2 globally..."
    npm install -g pm2
    
    if [ $? -eq 0 ]; then
        echo "✅ PM2 installed successfully"
        pm2 --version
    else
        echo "❌ PM2 installation failed. You may need sudo:"
        echo "   sudo npm install -g pm2"
        exit 1
    fi
fi

echo ""
echo "🔧 Setting up PM2 startup script..."
pm2 startup

echo ""
echo "🚀 Starting En Pensent ecosystem..."
cd /Users/alecshelts/shopify-joy-manager

# Stop any existing processes first
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# Start the ecosystem
pm2 start ecosystem.config.json

echo ""
echo "💾 Saving PM2 configuration..."
pm2 save

echo ""
echo "📊 Current PM2 status:"
pm2 status

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║     PM2 INSTALLATION COMPLETE                              ║"
echo "╠════════════════════════════════════════════════════════════╣
echo "║  Commands:                                                 ║"
echo "║    pm2 status          - View all processes               ║"
echo "║    pm2 logs            - View all logs                    ║"
echo "║    pm2 logs ib-bridge  - View IB Gateway logs             ║"
echo "║    pm2 logs chess-benchmark - View benchmark logs         ║"
echo "║    pm2 monit           - Monitor dashboard                ║"
echo "║    pm2 stop all        - Stop all processes               ║"
echo "║    pm2 restart all     - Restart all processes            ║"
echo "╚════════════════════════════════════════════════════════════╝"
