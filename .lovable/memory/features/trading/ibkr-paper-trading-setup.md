# Memory: features/trading/ibkr-paper-trading-setup
Updated: 2026-01-25

## IBKR Client Portal Gateway Integration

### Architecture
Since Edge Functions cannot connect to localhost, the IBKR integration uses a **client-side proxy pattern**:
1. User runs IBKR Client Portal Gateway locally (Java app on port 5000)
2. Browser-side hook (`useIBKRGateway`) connects directly to `https://localhost:5000`
3. Orders are executed from the browser, with state synced to Supabase

### Setup Requirements
1. Download IBKR Client Portal Gateway from IBKR
2. Run `bin/run.sh` or `bin/run.bat`
3. Login via https://localhost:5000
4. Enable Paper Trading account in IBKR Account Management

### Key Files
- `src/hooks/useIBKRGateway.ts` - Client-side gateway connection
- `src/components/trading/IBKRPaperTradingPanel.tsx` - UI for IBKR trading
- `src/lib/trading/ibkrClient.ts` - IBKR API client utilities

### Security Notes
- Credentials (IBKR_CLIENT_ID, IBKR_CLIENT_SECRET) are for future OAuth flow
- Local gateway uses session-based auth (user logs in via browser)
- HTTPS required for localhost:5000 (self-signed cert)
