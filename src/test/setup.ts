/**
 * Test Setup File
 * 
 * Configures the testing environment before each test run.
 * Includes mocks, global setup, and testing library configuration.
 */

import '@testing-library/jest-dom/vitest';
import { vi, afterEach } from 'vitest';

// Mock window.matchMedia for responsive component tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver for scroll/lazy loading tests
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  unobserve: vi.fn(),
}));

// Mock ResizeObserver for responsive component tests
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  unobserve: vi.fn(),
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Suppress console errors during tests (optional - remove for debugging)
const originalConsoleError = console.error;
console.error = (...args: unknown[]) => {
  // Filter out React act() warnings
  if (
    typeof args[0] === 'string' &&
    args[0].includes('Warning: An update to %s inside a test was not wrapped in act')
  ) {
    return;
  }
  originalConsoleError.apply(console, args);
};

// Cleanup after each test
afterEach(() => {
  vi.clearAllMocks();
});
