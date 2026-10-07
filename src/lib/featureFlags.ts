/**
 * Launch feature flags. Marketplace is hidden pre-launch (set
 * VITE_MARKETPLACE_ENABLED=true to re-enable) while it's rebuilt
 * around the gameHash:paletteId identity model.
 */
export const MARKETPLACE_ENABLED = import.meta.env.VITE_MARKETPLACE_ENABLED === 'true';
