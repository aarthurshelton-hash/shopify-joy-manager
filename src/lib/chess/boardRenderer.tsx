import React from 'react';
import { SquareVisit } from '@/lib/chess/gameSimulator';
import { getPieceColor } from '@/lib/chess/pieceColors';
import { HighlightedPiece, HoveredMoveInfo } from '@/contexts/LegendHighlightContext';

export function getVisitColor(visit: SquareVisit): string {
  return getPieceColor(visit.piece, visit.color);
}

export function visitMatchesAnyHighlight(visit: SquareVisit, highlights: HighlightedPiece[]): boolean {
  if (highlights.length === 0) return true;
  return highlights.some(h => visit.piece === h.pieceType && visit.color === h.pieceColor);
}

export function getMatchingHighlightIndex(visit: SquareVisit, highlights: HighlightedPiece[]): number {
  return highlights.findIndex(h => visit.piece === h.pieceType && visit.color === h.pieceColor);
}

interface RenderNestedSquaresOptions {
  visits: SquareVisit[];
  x: number;
  y: number;
  squareSize: number;
  baseColor: string;
  highlightedPieces: HighlightedPiece[];
  compareMode: boolean;
  hoveredMove?: HoveredMoveInfo | null;
  squareName?: string;
  enPensentGlow?: { color: string; intensity: number };
  isHoveredSquare?: boolean;
  isHighlightedFromLegend?: boolean;
}

export function renderNestedSquares({
  visits,
  x,
  y,
  squareSize,
  baseColor,
  highlightedPieces,
  compareMode,
  hoveredMove = null,
  squareName = '',
  enPensentGlow,
  isHoveredSquare = false,
  isHighlightedFromLegend = false,
}: RenderNestedSquaresOptions): React.ReactNode[] {
  const elements: React.ReactNode[] = [];
  const padding = squareSize * 0.08;

  const hasHighlight = highlightedPieces.length > 0;
  const isHoveredMoveTarget = hoveredMove?.targetSquare === squareName;
  const hoveredMoveMatchingVisits = hoveredMove
    ? visits.filter(v => v.piece === hoveredMove.piece.pieceType && v.color === hoveredMove.piece.pieceColor)
    : [];
  const hasHoveredMoveVisit = hoveredMoveMatchingVisits.length > 0;
  const matchingVisits = hasHighlight
    ? visits.filter(v => visitMatchesAnyHighlight(v, highlightedPieces))
    : visits;
  const hasMatchingVisit = matchingVisits.length > 0;

  const piece1Present = highlightedPieces.length > 0 && visits.some(
    v => v.piece === highlightedPieces[0].pieceType && v.color === highlightedPieces[0].pieceColor
  );
  const piece2Present = highlightedPieces.length > 1 && visits.some(
    v => v.piece === highlightedPieces[1].pieceType && v.color === highlightedPieces[1].pieceColor
  );
  const isOverlap = piece1Present && piece2Present;

  const shouldDim = (hasHighlight && !hasMatchingVisit && !isHoveredSquare) || (hoveredMove && !hasHoveredMoveVisit && !isHoveredMoveTarget);

  if (enPensentGlow && enPensentGlow.intensity > 0.1) {
    elements.push(
      <rect
        key={`pensent-glow-${x}-${y}`}
        x={x}
        y={y}
        width={squareSize}
        height={squareSize}
        fill={enPensentGlow.color}
        opacity={enPensentGlow.intensity * 0.1}
        style={{ transition: 'opacity 0.3s ease-out' }}
      />
    );
  }

  elements.push(
    <rect
      key={`base-${x}-${y}`}
      x={x}
      y={y}
      width={squareSize}
      height={squareSize}
      fill={baseColor}
      style={{
        opacity: shouldDim ? 0.3 : 1,
        transition: 'opacity 0.2s ease-out',
      }}
    />
  );

  if (visits.length === 0) return elements;

  const uniqueColors: { color: string; matches: boolean; highlightIndex: number }[] = [];
  for (const visit of visits) {
    const color = getVisitColor(visit);
    const highlightIndex = getMatchingHighlightIndex(visit, highlightedPieces);
    const matches = !hasHighlight || highlightIndex !== -1;
    const existingIndex = uniqueColors.findIndex(uc => uc.color === color);
    if (existingIndex === -1) {
      uniqueColors.push({ color, matches, highlightIndex });
    } else if (matches) {
      uniqueColors[existingIndex].matches = true;
      if (highlightIndex !== -1) uniqueColors[existingIndex].highlightIndex = highlightIndex;
    }
  }

  const maxNesting = Math.min(uniqueColors.length, 6);
  const layers: { color: string; layerSize: number; matches: boolean; highlightIndex: number }[] = [];

  let currentSize = squareSize - padding * 2;
  const sizeReduction = (currentSize * 0.7) / maxNesting;

  for (let i = 0; i < maxNesting; i++) {
    layers.push({
      color: uniqueColors[i].color,
      layerSize: currentSize,
      matches: uniqueColors[i].matches,
      highlightIndex: uniqueColors[i].highlightIndex,
    });
    currentSize -= sizeReduction;
    if (currentSize < squareSize * 0.1) break;
  }

  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i];
    const offset = (squareSize - layer.layerSize) / 2;
    let opacity = 1;
    if (hasHighlight && !isHoveredSquare) {
      opacity = layer.matches ? 1 : 0.15;
    }

    elements.push(
      <rect
        key={`layer-${x}-${y}-${i}`}
        x={x + offset}
        y={y + offset}
        width={layer.layerSize}
        height={layer.layerSize}
        fill={layer.color}
        style={{ opacity, transition: 'opacity 0.2s ease-out' }}
      />
    );
  }

  if ((hasHighlight && hasMatchingVisit) || isHoveredSquare) {
    const glowSize = squareSize * 0.02;

    if (isHoveredSquare) {
      elements.push(
        <rect
          key={`glow-hover-${x}-${y}`}
          x={x + glowSize}
          y={y + glowSize}
          width={squareSize - glowSize * 2}
          height={squareSize - glowSize * 2}
          fill="none"
          stroke="rgba(251, 191, 36, 0.8)"
          strokeWidth={glowSize * 2}
          style={{ transition: 'all 0.2s ease-out' }}
        />
      );
    } else if (compareMode && highlightedPieces.length === 2) {
      if (isOverlap) {
        elements.push(
          <rect
            key={`glow-overlap-${x}-${y}`}
            x={x + glowSize}
            y={y + glowSize}
            width={squareSize - glowSize * 2}
            height={squareSize - glowSize * 2}
            fill="none"
            stroke="rgba(168, 85, 247, 0.8)"
            strokeWidth={glowSize * 2}
            style={{ transition: 'all 0.2s ease-out' }}
          />
        );
      } else if (piece1Present) {
        elements.push(
          <rect
            key={`glow-p1-${x}-${y}`}
            x={x + glowSize}
            y={y + glowSize}
            width={squareSize - glowSize * 2}
            height={squareSize - glowSize * 2}
            fill="none"
            stroke="rgba(56, 189, 248, 0.6)"
            strokeWidth={glowSize * 1.5}
            style={{ transition: 'all 0.2s ease-out' }}
          />
        );
      } else if (piece2Present) {
        elements.push(
          <rect
            key={`glow-p2-${x}-${y}`}
            x={x + glowSize}
            y={y + glowSize}
            width={squareSize - glowSize * 2}
            height={squareSize - glowSize * 2}
            fill="none"
            stroke="rgba(251, 113, 133, 0.6)"
            strokeWidth={glowSize * 1.5}
            style={{ transition: 'all 0.2s ease-out' }}
          />
        );
      }
    } else if (isHighlightedFromLegend) {
      elements.push(
        <rect
          key={`glow-${x}-${y}`}
          x={x + glowSize}
          y={y + glowSize}
          width={squareSize - glowSize * 2}
          height={squareSize - glowSize * 2}
          fill="none"
          stroke="rgba(255,255,255,0.6)"
          strokeWidth={glowSize}
          style={{ transition: 'all 0.2s ease-out' }}
        />
      );
    }
  }

  if (hoveredMove && (isHoveredMoveTarget || hasHoveredMoveVisit)) {
    const glowSize = squareSize * 0.025;
    if (isHoveredMoveTarget) {
      elements.push(
        <rect
          key={`glow-move-target-${x}-${y}`}
          x={x + glowSize}
          y={y + glowSize}
          width={squareSize - glowSize * 2}
          height={squareSize - glowSize * 2}
          fill="none"
          stroke="rgba(251, 191, 36, 0.9)"
          strokeWidth={glowSize * 2}
        />
      );
    } else {
      elements.push(
        <rect
          key={`glow-move-piece-${x}-${y}`}
          x={x + glowSize}
          y={y + glowSize}
          width={squareSize - glowSize * 2}
          height={squareSize - glowSize * 2}
          fill="none"
          stroke="rgba(251, 191, 36, 0.4)"
          strokeWidth={glowSize}
        />
      );
    }
  }

  return elements;
}
