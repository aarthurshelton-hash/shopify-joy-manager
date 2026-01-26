# IB Gateway Bridge

A local Node.js server that bridges HTTP requests to the IB Gateway's TWS API socket protocol.

## Prerequisites

1. **Node.js 18+** installed on your machine
2. **IB Gateway** application running and logged in
3. Enable API connections in IB Gateway:
   - Configure → Settings → API → Settings
   - Check "Enable ActiveX and Socket Clients"
   - Uncheck "Read-Only API"
   - Set "Socket port" (default: 4002 for paper, 4001 for live)

## Quick Start

```bash
# Navigate to this folder
cd ib-gateway-bridge

# Install dependencies
npm install

# Start the bridge (paper trading)
npm start

# Or for live trading (port 4001)
npm run start:live
```

## Configuration

The bridge defaults to:
- **Bridge Port**: 4000 (HTTP server)
- **IB Gateway Host**: 127.0.0.1
- **IB Gateway Port**: 4002 (paper trading)
- **Client ID**: 1

To customize, set environment variables:
```bash
BRIDGE_PORT=4000 IB_HOST=127.0.0.1 IB_PORT=4002 CLIENT_ID=1 npm start
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/status | GET | Check connection status |
| /api/connect | POST | Connect to IB Gateway |
| /api/disconnect | POST | Disconnect from IB Gateway |
| /api/accounts | GET | List accounts |
| /api/positions | GET | Get positions (query: accountId) |
| /api/orders | GET | Get open orders |
| /api/orders | POST | Place order |
| /api/orders/:id | DELETE | Cancel order |
| /api/search | GET | Search contracts (query: symbol) |
| /api/quote | GET | Get quote (query: conid) |

## Troubleshooting

1. **"Connection refused"**: Ensure IB Gateway is running and API is enabled
2. **"Port in use"**: Kill existing bridge process: `lsof -ti:4000 | xargs kill -9`
3. **"Not authenticated"**: Log into IB Gateway before starting bridge
