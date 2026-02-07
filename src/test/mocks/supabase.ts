/**
 * Supabase Test Mocks
 * 
 * Provides mock implementations for Supabase client and auth
 * for use in unit and integration tests.
 */

import { vi } from 'vitest';
import type { User, Session } from '@supabase/supabase-js';

// Mock user data
export const mockUser: User = {
  id: 'test-user-id',
  email: 'test@enpensent.com',
  user_metadata: {
    display_name: 'Test User',
  },
  app_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  role: 'authenticated',
  updated_at: new Date().toISOString(),
  identities: [],
};

// Mock session data
export const mockSession: Session = {
  user: mockUser,
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'bearer',
};

// Mock Supabase client
export const createMockSupabaseClient = () => ({
  auth: {
    signUp: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
    signInWithPassword: vi.fn().mockResolvedValue({ data: { user: mockUser, session: mockSession }, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    getSession: vi.fn().mockResolvedValue({ data: { session: mockSession }, error: null }),
    onAuthStateChange: vi.fn().mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    }),
    mfa: {
      listFactors: vi.fn().mockResolvedValue({ data: { totp: [] }, error: null }),
      getAuthenticatorAssuranceLevel: vi.fn().mockResolvedValue({
        data: { currentLevel: 'aal1', nextLevel: 'aal1' },
        error: null,
      }),
    },
  },
  from: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    containedBy: vi.fn().mockReturnThis(),
    rangeGt: vi.fn().mockReturnThis(),
    rangeGte: vi.fn().mockReturnThis(),
    rangeLt: vi.fn().mockReturnThis(),
    rangeLte: vi.fn().mockReturnThis(),
    rangeAdjacent: vi.fn().mockReturnThis(),
    overlaps: vi.fn().mockReturnThis(),
    textSearch: vi.fn().mockReturnThis(),
    match: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    and: vi.fn().mockReturnThis(),
    filter: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockReturnThis(),
    csv: vi.fn().mockReturnThis(),
    then: vi.fn().mockImplementation((callback) => Promise.resolve(callback({ data: [], error: null }))),
  }),
  rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
  functions: {
    invoke: vi.fn().mockResolvedValue({ data: {}, error: null }),
  },
  channel: vi.fn().mockReturnValue({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
    unsubscribe: vi.fn(),
  }),
  removeChannel: vi.fn(),
  removeAllChannels: vi.fn(),
});

// Mock supabase module
export const mockSupabaseClient = createMockSupabaseClient();

// Helper to reset all mocks
export const resetSupabaseMocks = () => {
  vi.clearAllMocks();
};

// Helper to mock authenticated state
export const mockAuthenticatedUser = (user: Partial<User> = {}) => {
  const mergedUser = { ...mockUser, ...user };
  mockSupabaseClient.auth.getSession.mockResolvedValue({
    data: { session: { ...mockSession, user: mergedUser } },
    error: null,
  });
  return mergedUser;
};

// Helper to mock unauthenticated state
export const mockUnauthenticated = () => {
  mockSupabaseClient.auth.getSession.mockResolvedValue({
    data: { session: null },
    error: null,
  });
};

// Helper to mock admin user
export const mockAdminUser = () => {
  mockSupabaseClient.from = vi.fn().mockImplementation((table: string) => {
    if (table === 'user_roles') {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { role: 'admin' },
          error: null,
        }),
      };
    }
    return createMockSupabaseClient().from(table);
  });
  
  return mockAuthenticatedUser({ email: 'a.arthur.shelton@gmail.com' });
};
