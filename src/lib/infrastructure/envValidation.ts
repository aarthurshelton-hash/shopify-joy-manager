/**
 * Environment Variable Validation
 * 
 * Validates all required environment variables at runtime.
 * Fails fast with clear error messages if configuration is missing.
 */

import { z } from 'zod';

/**
 * Schema for required environment variables
 */
const envSchema = z.object({
  // Supabase Configuration (Required)
  VITE_SUPABASE_URL: z.string().url().min(1, 'Supabase URL is required'),
  VITE_SUPABASE_PUBLISHABLE_KEY: z.string().min(1, 'Supabase publishable key is required'),
  
  // Trading Configuration (Optional but validated if present)
  IB_BRIDGE_URL: z.string().url().optional(),
  IB_GATEWAY_HOST: z.string().default('127.0.0.1'),
  IB_GATEWAY_PORT: z.string().regex(/^\d+$/).default('4002'),
  
  // Price Data APIs (Optional)
  ALPHA_VANTAGE_API_KEY: z.string().optional(),
  POLYGON_API_KEY: z.string().optional(),
  
  // Notifications (Optional)
  SLACK_WEBHOOK_URL: z.string().url().optional(),
});

/**
 * Validated environment variables
 */
export type ValidatedEnv = z.infer<typeof envSchema>;

/**
 * Validates environment variables and returns typed config
 * Throws error on invalid/missing required variables
 */
export function validateEnv(): ValidatedEnv {
  try {
    const env = envSchema.parse({
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      IB_BRIDGE_URL: import.meta.env.IB_BRIDGE_URL,
      IB_GATEWAY_HOST: import.meta.env.IB_GATEWAY_HOST,
      IB_GATEWAY_PORT: import.meta.env.IB_GATEWAY_PORT,
      ALPHA_VANTAGE_API_KEY: import.meta.env.ALPHA_VANTAGE_API_KEY,
      POLYGON_API_KEY: import.meta.env.POLYGON_API_KEY,
      SLACK_WEBHOOK_URL: import.meta.env.SLACK_WEBHOOK_URL,
    });
    
    console.log('[EnvValidation] ✓ All environment variables validated');
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(i => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
      console.error(`[EnvValidation] ✗ Environment validation failed:\n${issues}`);
      throw new Error(`Environment validation failed:\n${issues}`);
    }
    throw error;
  }
}

/**
 * Safe getter for environment variables with defaults
 */
export function getEnvVar(key: keyof ValidatedEnv, defaultValue?: string): string | undefined {
  const env = validateEnv();
  return (env[key] as string) ?? defaultValue;
}

/**
 * Check if trading configuration is complete
 */
export function isTradingEnabled(): boolean {
  try {
    const env = validateEnv();
    return !!env.IB_BRIDGE_URL;
  } catch {
    return false;
  }
}

/**
 * Check if price data APIs are configured
 */
export function isPriceDataEnabled(): boolean {
  try {
    const env = validateEnv();
    return !!(env.ALPHA_VANTAGE_API_KEY || env.POLYGON_API_KEY);
  } catch {
    return false;
  }
}
