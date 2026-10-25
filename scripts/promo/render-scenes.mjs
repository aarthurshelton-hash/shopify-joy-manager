#!/usr/bin/env node
/**
 * render-scenes.mjs — place real En Pensent print renders into photoreal
 * social settings using Gemini image editing.
 *
 * Usage: node scripts/promo/render-scenes.mjs [count=3] [model=gemini-2.5-flash-image]
 * Needs GEMINI_API_KEY in .env.local and print-renders/ from render-prints.mjs.
 * Output: print-renders/scenes/<scene>.png
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
const IN = path.join(ROOT, 'print-renders');
const OUT = path.join(IN, 'scenes');
const COUNT = Number(process.argv[2] || 3);
const MODEL = process.argv[3] || 'gemini-2.5-flash-image';

const env = fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8');
const KEY = env.split('\n').find((l) => l.startsWith('GEMINI_API_KEY='))?.split('=').slice(1).join('=').trim();
if (!KEY) throw new Error('GEMINI_API_KEY missing in .env.local');

const SCENES = [
  ['cafe-wall', 'kasparov-topalov-1999__hotCold', 'a cozy specialty coffee shop, friends chatting at a wooden table in the foreground, the print hung in a slim natural-wood frame on an exposed-brick wall'],
  ['cocktail-bar', 'deep-blue-kasparov-1997__cyberpunk', 'an upscale dimly lit cocktail bar with warm amber lighting and people sitting at the bar, the print in a thin black frame on a dark wall with a soft spotlight'],
  ['hotel-lobby', 'byrne-fischer-1956__artdeco', 'a luxury boutique hotel lobby with velvet seating and brass accents, guests chatting, the print in an ornate gold frame above a console table'],
  ['executive-office', 'carlsen-anand-2013__modern', 'a modern glass-walled executive office with a walnut desk, a colleague presenting in the background, the print in a white gallery frame on the wall'],
  ['living-room', 'morphy-opera-1858__japanese', 'a bright Scandinavian living room, friends relaxing on a sofa with tea, the print in a natural frame on a white wall above a plant'],
  ['library-lounge', 'anderssen-kieseritzky-1851__vintage', 'a classic private library lounge with leather armchairs and two people playing chess in the foreground, the print in a rich walnut frame between bookshelves'],
  ['restaurant', 'botvinnik-capablanca-1938__roman', 'a stylish Italian restaurant with diners at candlelit tables, the print in a black frame on a textured plaster wall'],
  ['coworking-loft', 'spassky-fischer-1972__nordic', 'a sunlit industrial coworking loft with people at laptops, the print leaning on a shelf in a white frame'],
  ['gallery-night', 'lasker-thomas-1912__medieval', 'an art gallery opening night, visitors with wine glasses viewing the print in a black frame on a white gallery wall'],
  ['game-cafe', 'oldest-recorded-1475__egyptian', 'a chess club cafe with players at boards in the foreground, the print in a gold frame on a green wall'],
  ['bedroom', 'karpov-kasparov-1985__ocean', 'a calm modern bedroom with linen bedding and morning light, the print in a natural frame above the headboard'],
  ['rooftop-lounge', 'anderssen-dufresne-1852__autumn', 'an evening rooftop lounge with string lights and guests laughing, the print in a black frame on an interior wall near the bar'],
];

fs.mkdirSync(OUT, { recursive: true });

for (const [name, printName, setting] of SCENES.slice(0, COUNT)) {
  const printPath = path.join(IN, `${printName}.png`);
  const small = path.join(OUT, `.in-${name}.jpg`);
  execFileSync('sips', ['-Z', '1600', '-s', 'format', 'jpeg', printPath, '--out', small], { stdio: 'ignore' });
  const prompt =
    `Create a high-resolution, photorealistic lifestyle photograph of ${setting}. ` +
    `The framed artwork in the scene MUST be the attached poster, reproduced exactly as-is: ` +
    `same colorful square grid, same title text, same layout and colors, no changes, no extra text. ` +
    `Natural lighting, shallow depth of field, editorial interior photography, landscape orientation, ` +
    `the print clearly visible and the focus of the shot. No watermarks.`;

  const body = {
    contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: 'image/jpeg', data: fs.readFileSync(small).toString('base64') } }] }],
    generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
  };
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': KEY },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  fs.unlinkSync(small);
  const part = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData || p.inline_data);
  const data = part?.inlineData?.data || part?.inline_data?.data;
  if (!data) {
    console.error(`${name}: failed (HTTP ${res.status})`, JSON.stringify(json).slice(0, 400));
    continue;
  }
  fs.writeFileSync(path.join(OUT, `${name}.png`), Buffer.from(data, 'base64'));
  console.log('wrote', `print-renders/scenes/${name}.png`);
}
