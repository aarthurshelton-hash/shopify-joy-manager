/**
 * PremiumPiece — the En Pensent piece in a 100x100 box.
 * Layers: contact shadow, heavy outline (painted behind the fill so only the
 * outer edge shows), gradient body with lathe + grain texture, sheen,
 * engraved grooves, edge light, eye/nostril dots. Texture seeds are fixed so
 * previews, prints and exports match.
 */
import React from 'react';
import { PieceType, PieceColor } from '@/lib/chess/pieceColors';
import { PIECE_PATHS, PIECE_DETAILS, PIECE_OUTLINE_WIDTH, getPieceTones } from '@/lib/chess/piecePaths';

interface ToneProps {
  color: PieceColor;
  hexColor?: string;
  strokeColor?: string;
}

function rgbUnit(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return '0 0 0';
  const v = (i: number) => (parseInt(m[1].slice(i, i + 2), 16) / 255).toFixed(3);
  return `${v(0)} ${v(2)} ${v(4)}`;
}

const speckMatrix = (hex: string, gain: number, bias: number) => {
  const [r, g, b] = rgbUnit(hex).split(' ');
  return `0 0 0 0 ${r}  0 0 0 0 ${g}  0 0 0 0 ${b}  ${gain} 0 0 0 ${bias}`;
};

export const PremiumPieceDefs: React.FC<ToneProps & { id: string; detail?: boolean }> = ({
  id,
  color,
  hexColor,
  strokeColor,
  detail = true,
}) => {
  const t = getPieceTones(color, hexColor, strokeColor);
  return (
    <defs>
      <linearGradient id={`${id}-body`} x1="0.1" y1="0" x2="0.9" y2="1">
        <stop offset="0" stopColor={t.light} />
        <stop offset="0.5" stopColor={t.mid} />
        <stop offset="1" stopColor={t.dark} />
      </linearGradient>
      <radialGradient id={`${id}-spec`} cx="0.32" cy="0.2" r="0.6">
        <stop offset="0" stopColor={t.highlight} stopOpacity="0.4" />
        <stop offset="1" stopColor={t.highlight} stopOpacity="0" />
      </radialGradient>
      <radialGradient id={`${id}-contact`}>
        <stop offset="0" stopColor="#000" stopOpacity="0.4" />
        <stop offset="1" stopColor="#000" stopOpacity="0" />
      </radialGradient>
      {detail && (
        <filter id={`${id}-grain`} x="0" y="0" width="1" height="1" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="1.25" numOctaves="2" seed="11" result="fine" />
          <feColorMatrix in="fine" type="matrix" values={speckMatrix(t.speck, 0.6, -0.27)} result="fineSpeck" />
          <feTurbulence type="fractalNoise" baseFrequency="0.015 0.7" numOctaves="2" seed="4" result="lathe" />
          <feColorMatrix in="lathe" type="matrix" values={speckMatrix(t.speck, 0.5, -0.22)} result="latheSpeck" />
          <feMerge result="texture">
            <feMergeNode in="fineSpeck" />
            <feMergeNode in="latheSpeck" />
          </feMerge>
          <feComposite in="texture" in2="SourceAlpha" operator="in" result="clipped" />
          <feMerge>
            <feMergeNode in="SourceGraphic" />
            <feMergeNode in="clipped" />
          </feMerge>
        </filter>
      )}
    </defs>
  );
};

export const PremiumPieceBody: React.FC<ToneProps & { type: PieceType; id: string; detail?: boolean }> = ({
  type,
  id,
  color,
  hexColor,
  strokeColor,
  detail = true,
}) => {
  const t = getPieceTones(color, hexColor, strokeColor);
  const d = PIECE_PATHS[type];
  const det = PIECE_DETAILS[type];
  return (
    <g>
      <ellipse cx="50" cy="90" rx="31" ry="3.4" fill={`url(#${id}-contact)`} />
      <path d={d} fill="none" stroke={t.outline} strokeWidth={PIECE_OUTLINE_WIDTH} strokeLinejoin="round" />
      <g filter={detail ? `url(#${id}-grain)` : undefined}>
        <path d={d} fill={`url(#${id}-body)`} />
      </g>
      <path d={d} fill={`url(#${id}-spec)`} />
      {detail && (
        <>
          <path d={det.engrave} fill="none" stroke={t.engrave} strokeWidth="1" strokeLinecap="round" opacity="0.55" />
          <path d={det.highlight} fill="none" stroke={t.highlight} strokeWidth="1.6" strokeLinecap="round" opacity="0.5" />
          {det.dots.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="1.6" fill={t.engrave} opacity="0.9" />
          ))}
        </>
      )}
    </g>
  );
};
