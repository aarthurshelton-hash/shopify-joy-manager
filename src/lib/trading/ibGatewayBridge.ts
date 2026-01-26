/**
 * IB Gateway Bridge Configuration
 * 
 * The IB Gateway (GUI app) uses socket-based TWS API.
 * This config points to a local Node.js bridge that translates HTTP → Socket.
 * 
 * Bridge must be running on user's machine at the configured port.
 */

const STORAGE_KEY = 'ib_gateway_bridge_url';
const DEFAULT_BRIDGE_URL = 'http://localhost:4000';

export interface IBGatewayConfig {
  bridgeUrl: string;
  gatewayHost: string;
  gatewayPort: number;
  clientId: number;
}

const DEFAULT_CONFIG: IBGatewayConfig = {
  bridgeUrl: DEFAULT_BRIDGE_URL,
  gatewayHost: '127.0.0.1',
  gatewayPort: 4002, // IB Gateway paper trading port (4001 for live)
  clientId: 1,
};

export function getBridgeConfig(): IBGatewayConfig {
  if (typeof window === 'undefined') return DEFAULT_CONFIG;
  
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
    } catch {
      return DEFAULT_CONFIG;
    }
  }
  return DEFAULT_CONFIG;
}

export function setBridgeConfig(config: Partial<IBGatewayConfig>): void {
  const current = getBridgeConfig();
  const updated = { ...current, ...config };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function resetBridgeConfig(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function getBridgeUrl(): string {
  return getBridgeConfig().bridgeUrl;
}
