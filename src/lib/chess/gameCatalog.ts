import { generateGameHash } from '@/lib/visualizations/gameCanonical';

export interface CatalogGame {
  /** Key into MATCH_PALETTES: famous id, or `fischer:<id>` / `carlsen:<id>` for book games. */
  key: string;
  title: string;
  white: string;
  black: string;
  event: string;
  year: number;
  pgn: string;
}

let index: Promise<Map<string, CatalogGame>> | null = null;

async function load(): Promise<Map<string, CatalogGame>> {
  const [{ famousGames, carlsenLegendaryGames }, { fischerTop100 }, { carlsenTop100 }] = await Promise.all([
    import('./famousGames'),
    import('../book/fischerGames'),
    import('../book/carlsenGames'),
  ]);
  const map = new Map<string, CatalogGame>();
  const add = (key: string, g: { title: string; white: string; black: string; event: string; year: number; pgn: string }) => {
    const hash = generateGameHash(g.pgn);
    if (!map.has(hash)) map.set(hash, { key, title: g.title, white: g.white, black: g.black, event: g.event, year: g.year, pgn: g.pgn });
  };
  for (const g of [...famousGames, ...carlsenLegendaryGames]) add(g.id, g);
  for (const g of fischerTop100) add(`fischer:${g.id}`, g);
  for (const g of carlsenTop100) add(`carlsen:${g.id}`, g);
  return map;
}

/** Finds a famous or book game by its canonical game hash (loaded lazily). */
export async function findCatalogGameByHash(hash: string): Promise<CatalogGame | null> {
  index ??= load();
  return (await index).get(hash) ?? null;
}
