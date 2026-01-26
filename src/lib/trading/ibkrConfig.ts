/**
 * IBKR Gateway Configuration
 * Allows setting a custom gateway URL for remote access
 */

const STORAGE_KEY = 'ibkr_gateway_url';
const DEFAULT_URL = 'https://localhost:5000/v1/api';

export function getGatewayUrl(): string {
  if (typeof window === 'undefined') return DEFAULT_URL;
  return localStorage.getItem(STORAGE_KEY) || DEFAULT_URL;
}

export function setGatewayUrl(url: string): void {
  if (!url || url.trim() === '') {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  // Ensure it ends with /v1/api
  let normalized = url.trim().replace(/\/$/, '');
  if (!normalized.endsWith('/v1/api')) {
    normalized += '/v1/api';
  }
  localStorage.setItem(STORAGE_KEY, normalized);
}

export function resetGatewayUrl(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function isUsingCustomGateway(): boolean {
  return !!localStorage.getItem(STORAGE_KEY);
}
