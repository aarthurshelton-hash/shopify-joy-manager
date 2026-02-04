# Memory: features/trading/ibkr-24-7-vps-setup-guide
Updated: 2026-01-29

## 24/7 IBKR Paper Trading - Windows VPS Setup Guide

### Recommended Provider: Vultr Windows VPS
- **Plan**: 2 vCPU, 4GB RAM ($24/month) - sufficient for IB Gateway + Node.js
- **OS**: Windows Server 2022
- **Location**: Choose closest to NYSE (New York, New Jersey)

### Step-by-Step Setup

#### 1. Provision VPS
1. Sign up at vultr.com (or AWS Lightsail, DigitalOcean)
2. Deploy Windows Server 2022 instance
3. Note the IP address and Administrator password
4. Wait 5-10 minutes for Windows to initialize

#### 2. Connect via RDP
- **Windows**: Open Remote Desktop Connection, enter VPS IP
- **Mac**: Download Microsoft Remote Desktop from App Store
- Login with Administrator credentials

#### 3. Install Prerequisites
```powershell
# Open PowerShell as Administrator

# Install Chocolatey (package manager)
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install Node.js LTS
choco install nodejs-lts -y

# Install Git
choco install git -y

# Refresh environment
refreshenv
```

#### 4. Download & Install IB Gateway
1. Download from: https://www.interactivebrokers.com/en/trading/ibgateway-stable.php
2. Run installer, select "IB Gateway" (not TWS)
3. Launch IB Gateway, login with paper trading credentials
4. Configure API Settings:
   - File → Global Configuration → API → Settings
   - ✅ Enable ActiveX and Socket Clients
   - ❌ Read-Only API (uncheck this!)
   - Socket port: 4002 (paper trading)
   - Trusted IPs: 127.0.0.1

#### 5. Deploy Bridge Server & Trader
```powershell
# Create trading directory
mkdir C:\Trading
cd C:\Trading

# Clone or copy the files (copy from your local machine via RDP)
# Or download directly if hosted on GitHub

# Install bridge dependencies
cd ib-gateway-bridge
npm install

# Install trader dependencies
cd ..\ib-headless-trader
npm install
```

#### 6. Install PM2 for Process Management
```powershell
npm install -g pm2
npm install -g pm2-windows-startup

# Start the bridge server
cd C:\Trading\ib-gateway-bridge
pm2 start server.js --name "ib-bridge"

# Start the headless trader
cd C:\Trading\ib-headless-trader
pm2 start trader.js --name "ib-trader"

# Save PM2 process list
pm2 save

# Configure auto-start on Windows boot
pm2-startup install
```

#### 7. Keep IB Gateway Running
IB Gateway will disconnect after market hours. Use **IBC** (IB Controller) for auto-restart:
1. Download IBC: https://github.com/IbcAlpha/IBC/releases
2. Extract to C:\IBC
3. Edit `config.ini`:
```ini
IbLoginId=YOUR_PAPER_USERNAME
IbPassword=YOUR_PAPER_PASSWORD
TradingMode=paper
AcceptIncomingConnectionAction=accept
AcceptNonBrokerageAccountWarning=yes
ExistingSessionDetectedAction=primary
```
4. Create scheduled task to run IBC at startup

### Monitoring Commands
```powershell
# Check PM2 status
pm2 status

# View trader logs
pm2 logs ib-trader

# View bridge logs
pm2 logs ib-bridge

# Restart services
pm2 restart all
```

### Security Checklist
- ✅ Use strong RDP password
- ✅ Enable Windows Firewall
- ✅ Only paper trading account
- ✅ Change RDP port from 3389 (optional)
- ✅ Regular Windows updates
