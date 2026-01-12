import { z } from 'zod';
import { quickTextCheck } from '@/lib/moderation/contentModeration';

/**
 * Validation schemas for visualization-related inputs
 * Used for client-side validation before database insertion
 */

// Custom refinement for content moderation
const contentSafeCheck = (fieldName: string) => (value: string, ctx: z.RefinementCtx) => {
  const check = quickTextCheck(value);
  if (!check.safe) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: check.reason || `${fieldName} contains inappropriate content`,
    });
  }
  return value;
};

// Visualization title validation with content moderation
export const visualizationTitleSchema = z.string()
  .trim()
  .min(1, 'Title is required')
  .max(200, 'Title must be 200 characters or less')
  .regex(/^[^<>]*$/, 'Title cannot contain < or > characters')
  .superRefine(contentSafeCheck('Title'));

// PGN data validation (chess game notation)
export const pgnDataSchema = z.string()
  .max(100000, 'PGN data is too large (max 100KB)')
  .optional()
  .nullable();

// Full visualization save schema
export const saveVisualizationSchema = z.object({
  title: visualizationTitleSchema,
  pgn: pgnDataSchema,
});

// Marketplace listing price validation
export const listingPriceSchema = z.object({
  priceCents: z.number()
    .int('Price must be a whole number of cents')
    .min(0, 'Price cannot be negative')
    .max(1000000, 'Maximum price is $10,000'),
});

// Display name validation (matches database constraints) with content moderation
export const displayNameSchema = z.string()
  .trim()
  .min(1, 'Display name is required')
  .max(50, 'Display name must be 50 characters or less')
  .regex(/^[^\x00-\x1F\x7F]*$/, 'Display name cannot contain control characters')
  .superRefine(contentSafeCheck('Display name'));

/**
 * Validate visualization title before saving
 * @returns Object with success boolean and either data or error message
 */
export function validateVisualizationTitle(title: string): { 
  success: boolean; 
  data?: string; 
  error?: string 
} {
  const result = visualizationTitleSchema.safeParse(title);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error.errors[0]?.message || 'Invalid title' };
}

/**
 * Validate PGN data before processing
 * @returns Object with success boolean and either data or error message
 */
export function validatePgnData(pgn: string | null | undefined): { 
  success: boolean; 
  data?: string | null; 
  error?: string 
} {
  const result = pgnDataSchema.safeParse(pgn);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error.errors[0]?.message || 'Invalid PGN data' };
}

/**
 * Validate complete visualization save request
 */
export function validateVisualizationSave(data: { title: string; pgn?: string | null }): {
  success: boolean;
  data?: { title: string; pgn: string | null | undefined };
  errors?: Record<string, string>;
} {
  const result = saveVisualizationSchema.safeParse(data);
  if (result.success) {
    return { 
      success: true, 
      data: { 
        title: result.data.title, 
        pgn: result.data.pgn 
      } 
    };
  }
  
  const errors: Record<string, string> = {};
  result.error.errors.forEach(err => {
    if (err.path[0]) {
      errors[err.path[0] as string] = err.message;
    }
  });
  return { success: false, errors };
}
