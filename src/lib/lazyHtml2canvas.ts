type Html2Canvas = typeof import('html2canvas').default;

/**
 * Loads html2canvas on first use so it stays out of the initial bundle.
 */
export const html2canvas = async (...args: Parameters<Html2Canvas>): Promise<HTMLCanvasElement> => {
  const mod = await import('html2canvas');
  return mod.default(...args);
};
