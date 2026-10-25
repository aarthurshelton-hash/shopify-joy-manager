#!/usr/bin/env node
/**
 * render-prints.mjs — render real En Pensent print images for different famous
 * games + palettes, headlessly, using the app's own print generator.
 *
 * Usage: node scripts/promo/render-prints.mjs [scale=6]
 * Output: print-renders/<game>__<palette>.png
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
const OUT = path.join(ROOT, 'print-renders');
const PORT = 5199;
const SCALE = Number(process.argv[2] || 6);

const JOBS = [
  ['kasparov-topalov-1999', 'hotCold'],
  ['byrne-fischer-1956', 'artdeco'],
  ['anderssen-kieseritzky-1851', 'vintage'],
  ['deep-blue-kasparov-1997', 'cyberpunk'],
  ['spassky-fischer-1972', 'nordic'],
  ['lasker-thomas-1912', 'medieval'],
  ['morphy-opera-1858', 'japanese'],
  ['oldest-recorded-1475', 'egyptian'],
  ['carlsen-anand-2013', 'modern'],
  ['botvinnik-capablanca-1938', 'roman'],
  ['anderssen-dufresne-1852', 'autumn'],
  ['karpov-kasparov-1985', 'ocean'],
];

fs.mkdirSync(OUT, { recursive: true });

const vite = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], { cwd: ROOT, stdio: 'pipe' });
await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error('vite did not start')), 60000);
  vite.stdout.on('data', (d) => { if (String(d).includes('Local')) { clearTimeout(t); resolve(); } });
  vite.on('exit', () => reject(new Error('vite exited')));
});

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1400, height: 1400 } });
  page.on('pageerror', (e) => console.warn('page error:', e.message));
  await page.goto(`http://localhost:${PORT}/about`, { waitUntil: 'domcontentloaded' });

  for (const [gameId, palette] of JOBS) {
    const dataUrl = await page.evaluate(async ({ gameId, palette, scale }) => {
      const { famousGames } = await import('/src/lib/chess/famousGames.ts');
      const { simulateGame } = await import('/src/lib/chess/gameSimulator.ts');
      const { setActivePalette } = await import('/src/lib/chess/pieceColors.ts');
      const { generateCleanPrintImage } = await import('/src/lib/chess/printImageGenerator.ts');
      const game = famousGames.find((g) => g.id === gameId);
      if (!game) throw new Error(`unknown game ${gameId}`);
      setActivePalette(palette);
      const sim = simulateGame(game.pgn);
      sim.gameData.title = game.title;
      return generateCleanPrintImage(sim, { pgn: game.pgn, scale });
    }, { gameId, palette, scale: SCALE });

    const file = path.join(OUT, `${gameId}__${palette}.png`);
    fs.writeFileSync(file, Buffer.from(dataUrl.split(',')[1], 'base64'));
    console.log('wrote', path.relative(ROOT, file));
  }
} finally {
  await browser.close();
  vite.kill();
}
