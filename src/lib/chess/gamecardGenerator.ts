import { SimulationResult } from './gameSimulator';
import {
  renderVictoryCardFront,
  renderVictoryCardBack,
  svgToPngDataUrl,
  buildGameFromSimulation,
} from './victoryCardBuilder';

export interface GamecardOptions {
  pgn?: string;
  darkMode?: boolean;
  source?: string;
  editionNumber?: number;
}

/**
 * Generate a victory-card-style PDF from a chess game simulation.
 * Produces a two-page PDF (front + back) matching the En Pensent victory card design.
 */
export async function generateGamecardPdf(
  simulation: SimulationResult,
  options: GamecardOptions = {}
): Promise<Blob> {
  const { pgn, source, editionNumber } = options;
  const { jsPDF } = await import('jspdf');

  const game = buildGameFromSimulation(simulation, { pgn, source, editionNumber });

  // Render front and back SVGs
  const frontSvg = await renderVictoryCardFront(simulation, game);
  const backSvg = await renderVictoryCardBack(simulation, game);

  // Convert SVGs to PNG at 1x (1500x2100 px = 5"x7" at 300 DPI)
  const frontPng = await svgToPngDataUrl(frontSvg, 1);
  const backPng = await svgToPngDataUrl(backSvg, 1);

  // Create PDF — 5" x 7" card at 300 DPI
  const cardW = 5;
  const cardH = 7;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'in',
    format: [cardW, cardH],
  });

  // Front page
  doc.addImage(frontPng, 'PNG', 0, 0, cardW, cardH, undefined, 'FAST');

  // Back page
  doc.addPage();
  doc.addImage(backPng, 'PNG', 0, 0, cardW, cardH, undefined, 'FAST');

  return doc.output('blob');
}

/**
 * Generate a gamecard PDF from a PGN string (runs simulation internally).
 * Useful for quick-generate from the GameImporter without loading the visualization.
 */
export async function generateGamecardFromPgn(
  pgn: string,
  options: GamecardOptions = {}
): Promise<Blob> {
  const { simulateGame } = await import('./gameSimulator');
  const simulation = simulateGame(pgn);
  return generateGamecardPdf(simulation, { ...options, pgn });
}

/**
 * Trigger browser download of a blob as a file.
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Sanitize a title into a safe filename.
 */
export function sanitizeFilename(title: string): string {
  return title
    .replace(/[^a-zA-Z0-9_\- ]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .substring(0, 60);
}
