import macro from '@/assets/mockups/canvas-macro-closeup.jpg';

export interface LifestyleImage {
  id: string;
  src: string;
  title: string;
  palette?: string;
}

const KEYS = ['japanese', 'art-deco', 'cyberpunk', 'medieval', 'greyscale', 'cosmic', 'autumn', 'tropical', 'vintage', 'ocean', 'nordic', 'egyptian', 'roman', 'desert', 'modern'];

const files = import.meta.glob('@/assets/lifestyle/*.{jpg,jpeg,png,webp}', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

const title = (s: string) => s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export const lifestyleImages: LifestyleImage[] = [
  ...Object.entries(files).map(([p, src]) => {
    const id = p.split('/').pop()!.replace(/\.\w+$/, '');
    const k = KEYS.find((x) => id.includes(x));
    return { id, src, title: title(id), palette: k?.replace('-', '') };
  }),
  { id: 'canvas-macro-closeup', src: macro, title: 'Museum-Grade Canvas Detail' },
];

export function getLifestyleForPalette(paletteId: string | undefined, count: number): LifestyleImage[] {
  const hit = lifestyleImages.filter((i) => i.palette && i.palette === paletteId);
  const rest = lifestyleImages.filter((i) => !hit.includes(i));
  return [...hit, ...rest].slice(0, count);
}
