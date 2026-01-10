import { SquareData, SquareVisit } from './gameSimulator';
import { boardColors, getPieceColor } from './pieceColors';

/**
 * Renders a chess visualization directly to a Canvas element
 * This bypasses DOM capture issues entirely
 */
export function renderBoardToCanvas(
  board: SquareData[][],
  size: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const squareSize = size / 8;
  const borderWidth = size * 0.02;
  const totalSize = size + borderWidth * 2;
  
  canvas.width = totalSize;
  canvas.height = totalSize;
  
  const ctx = canvas.getContext('2d')!;
  
  // Draw border
  ctx.fillStyle = boardColors.border;
  ctx.fillRect(0, 0, totalSize, totalSize);
  
  // Draw each square
  for (let rowIndex = 0; rowIndex < 8; rowIndex++) {
    const rank = 7 - rowIndex; // Flip to show rank 8 at top
    for (let file = 0; file < 8; file++) {
      const square = board[rank][file];
      const baseColor = square.isLight ? boardColors.light : boardColors.dark;
      
      const x = borderWidth + file * squareSize;
      const y = borderWidth + rowIndex * squareSize;
      
      // Draw base square
      ctx.fillStyle = baseColor;
      ctx.fillRect(x, y, squareSize, squareSize);
      
      // Draw nested piece colors
      if (square.visits.length > 0) {
        drawNestedSquares(ctx, square.visits, x, y, squareSize);
      }
    }
  }
  
  return canvas;
}

function drawNestedSquares(
  ctx: CanvasRenderingContext2D,
  visits: SquareVisit[],
  x: number,
  y: number,
  size: number
): void {
  const padding = size * 0.08;
  
  // Get unique colors in order of first appearance
  const uniqueColors: string[] = [];
  for (const visit of visits) {
    const color = getPieceColor(visit.piece, visit.color);
    if (!uniqueColors.includes(color)) {
      uniqueColors.push(color);
    }
  }
  
  // Calculate sizes for nested squares
  const maxNesting = Math.min(uniqueColors.length, 6);
  const layers: { color: string; layerSize: number }[] = [];
  
  let currentSize = size - padding * 2;
  const sizeReduction = (currentSize * 0.7) / maxNesting;
  
  for (let i = 0; i < maxNesting; i++) {
    layers.push({
      color: uniqueColors[i],
      layerSize: currentSize,
    });
    currentSize -= sizeReduction;
    if (currentSize < size * 0.1) break;
  }
  
  // Draw layers from outside in (largest first)
  for (const layer of layers) {
    const offset = (size - layer.layerSize) / 2;
    ctx.fillStyle = layer.color;
    ctx.fillRect(x + offset, y + offset, layer.layerSize, layer.layerSize);
  }
}

/**
 * Generates a complete print-ready image with board and game info
 */
export async function generatePrintCanvas(
  board: SquareData[][],
  gameData: {
    white?: string;
    black?: string;
    event?: string;
    date?: string;
    moves?: string[];
  },
  options: {
    boardSize?: number;
    darkMode?: boolean;
    withWatermark?: boolean;
    title?: string;
  } = {}
): Promise<HTMLCanvasElement> {
  const {
    boardSize = 400,
    darkMode = false,
    withWatermark = false,
    title,
  } = options;
  
  // Render the board
  const boardCanvas = renderBoardToCanvas(board, boardSize);
  
  // Calculate final canvas size
  const padding = 40;
  const infoHeight = 200; // Space for game info
  const watermarkHeight = withWatermark ? 60 : 0;
  
  const totalWidth = boardCanvas.width + padding * 2;
  const totalHeight = boardCanvas.height + infoHeight + watermarkHeight + padding * 2;
  
  const canvas = document.createElement('canvas');
  canvas.width = totalWidth;
  canvas.height = totalHeight;
  
  const ctx = canvas.getContext('2d')!;
  
  // Fill background
  ctx.fillStyle = darkMode ? '#0A0A0A' : '#FDFCFB';
  ctx.fillRect(0, 0, totalWidth, totalHeight);
  
  // Draw the board
  ctx.drawImage(boardCanvas, padding, padding);
  
  // Draw separator line
  const separatorY = padding + boardCanvas.height + 20;
  ctx.strokeStyle = darkMode ? '#292524' : '#e7e5e4';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding, separatorY);
  ctx.lineTo(totalWidth - padding, separatorY);
  ctx.stroke();
  
  // Draw game info
  const textColor = darkMode ? '#FAFAFA' : '#1A1A1A';
  const mutedColor = darkMode ? '#A8A29E' : '#78716C';
  
  let textY = separatorY + 35;
  
  // Player names
  ctx.fillStyle = textColor;
  ctx.font = 'bold 18px "Playfair Display", serif';
  ctx.textAlign = 'center';
  
  const whiteName = gameData.white || 'White';
  const blackName = gameData.black || 'Black';
  ctx.fillText(`${whiteName}  vs  ${blackName}`, totalWidth / 2, textY);
  
  textY += 25;
  
  // Event
  if (gameData.event) {
    ctx.fillStyle = mutedColor;
    ctx.font = 'italic 14px "Playfair Display", serif';
    ctx.fillText(gameData.event, totalWidth / 2, textY);
    textY += 22;
  }
  
  // Title and date
  const displayTitle = title;
  if (displayTitle || gameData.date) {
    ctx.fillStyle = mutedColor;
    ctx.font = '12px "Inter", sans-serif';
    const titleDateText = [displayTitle?.toUpperCase(), gameData.date].filter(Boolean).join('  •  ');
    ctx.fillText(titleDateText, totalWidth / 2, textY);
    textY += 22;
  }
  
  // Moves (truncated)
  if (gameData.moves && gameData.moves.length > 0) {
    ctx.fillStyle = mutedColor;
    ctx.font = '8px "Inter", sans-serif';
    const movesText = gameData.moves.join(' ');
    const truncatedMoves = movesText.length > 300 
      ? movesText.substring(0, 300) + '...' 
      : movesText;
    
    // Word wrap moves
    const maxWidth = totalWidth - padding * 2 - 20;
    const words = truncatedMoves.split(' ');
    let line = '';
    let lineY = textY;
    
    for (const word of words) {
      const testLine = line + (line ? ' ' : '') + word;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && line) {
        ctx.fillText(line, totalWidth / 2, lineY);
        line = word;
        lineY += 12;
        if (lineY > textY + 48) break; // Max 4 lines
      } else {
        line = testLine;
      }
    }
    if (line && lineY <= textY + 48) {
      ctx.fillText(line, totalWidth / 2, lineY);
    }
    textY = lineY + 20;
  }
  
  // En Pensent branding
  ctx.fillStyle = mutedColor;
  ctx.font = '10px "Inter", sans-serif';
  ctx.fillText('♔ EN PENSENT ♚', totalWidth / 2, totalHeight - padding - (withWatermark ? 50 : 10));
  
  // Watermark for free downloads
  if (withWatermark) {
    const wmX = totalWidth - padding - 100;
    const wmY = padding + boardCanvas.height - 50;
    
    // Watermark background
    ctx.fillStyle = darkMode ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)';
    ctx.fillRect(wmX - 10, wmY - 10, 120, 50);
    
    // Border
    ctx.strokeStyle = darkMode ? '#57534e' : '#d6d3d1';
    ctx.lineWidth = 1;
    ctx.strokeRect(wmX - 10, wmY - 10, 120, 50);
    
    // Text
    ctx.fillStyle = darkMode ? '#e7e5e4' : '#44403c';
    ctx.font = 'bold 9px "Inter", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('EN PENSENT', wmX + 5, wmY + 8);
    ctx.font = '7px "Inter", sans-serif';
    ctx.fillText('enpensent.com', wmX + 5, wmY + 20);
  }
  
  return canvas;
}
