# Memory: features/trading/ibkr-24-7-vps-setup-guide
Updated: 2026-01-29

## 24/7 IBKR Paper Trading - VPS Setup Guide

### Architecture Requirements
To run IBKR autonomous trading 24/7, you need a persistent environment with:
1. **IB Gateway** (headless mode preferred) - IBKR's desktop app
2. **Node.js Bridge Server** - Translates HTTP → TWS socket
3. **Trading Application** - React app or headless trading script

### Option 1: Windows VPS (Recommended for IB Gateway)
IB Gateway has best compatibility with Windows.

**Providers:**
- Vultr Windows VPS ($24/mo for 2GB RAM)
- AWS Lightsail Windows ($20/mo)
- DigitalOcean Windows Droplet

**Setup Steps:**
1. Provision Windows Server 2019/2022 VPS
2. RDP into the server
3. Download and install IB Gateway from IBKR
4. Install Node.js LTS
5. Clone/copy the bridge server code
6. Configure IB Gateway for auto-start
7. Set up the bridge as a Windows Service

### Option 2: Linux VPS with IBC (IB Controller)
Uses IBC to run IB Gateway headlessly on Linux.

**Providers:**
- DigitalOcean Droplet ($12/mo for 2GB)
- Vultr ($10/mo)
- Linode ($10/mo)

**Setup Steps:**
1. Provision Ubuntu 22.04 VPS
2. Install Java (required for IB Gateway)
3. Install IBC (IB Controller) - automates IB Gateway login
4. Install Xvfb (virtual framebuffer for headless)
5. Install Node.js LTS
6. Deploy bridge server
7. Configure systemd services

### Option 3: Dedicated Home Machine
Run on a spare computer at home.

**Requirements:**
- Always-on computer (old laptop, mini PC, Raspberry Pi 4)
- Stable internet connection
- UPS (uninterruptible power supply) recommended

### IBC Configuration (for headless operation)
IBC automates IB Gateway login and keeps it running:

```ini
# config.ini
IbLoginId=YOUR_IBKR_USERNAME
IbPassword=YOUR_IBKR_PASSWORD
TradingMode=paper
IbDir=/opt/ibgateway
AcceptIncomingConnectionAction=accept
AcceptNonBrokerageAccountWarning=yes
ExistingSessionDetectedAction=primary
```

### Bridge Server as Systemd Service
```ini
[Unit]
Description=IB Gateway Bridge Server
After=network.target

[Service]
Type=simple
User=trader
WorkingDirectory=/home/trader/ib-bridge
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### Monitoring & Alerts
- Set up health checks (ping bridge /api/status every minute)
- Configure email/SMS alerts for disconnection
- Use PM2 or systemd for process management
- Log all trades to database for remote monitoring

### Security Considerations
- Use paper trading account only
- Firewall: only allow localhost connections to IB Gateway
- VPN for secure RDP/SSH access
- Never expose IB Gateway ports to internet
