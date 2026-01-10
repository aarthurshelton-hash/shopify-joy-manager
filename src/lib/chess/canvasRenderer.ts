import { SquareData, SquareVisit } from './gameSimulator';
import { boardColors, getPieceColor, getActivePalette } from './pieceColors';

// High DPI scaling for crisp downloads
const DPI_SCALE = 3;

// Format date from PGN format (YYYY.MM.DD) to display format
function formatDate(dateStr: string): string {
  if (!dateStr || dateStr === 'Unknown' || dateStr === '????.??.??') {
    return 'Date Unknown';
  }
  
  const parts = dateStr.split('.');
  if (parts.length !== 3) return dateStr;
  
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const year = parts[0];
  const monthIndex = parseInt(parts[1]) - 1;
  const day = parseInt(parts[2]);
  
  if (isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) return dateStr;
  
  const getDaySuffix = (d: number) => {
    if (d > 3 && d < 21) return 'th';
    switch (d % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };
  
  return `${months[monthIndex]} ${day}${getDaySuffix(day)}, ${year}`;
}

// Wait for fonts to be loaded
async function ensureFontsLoaded(): Promise<void> {
  // The fonts are loaded via CSS @import, ensure they're ready
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }
  // Small delay to ensure font rendering is complete
  await new Promise(resolve => setTimeout(resolve, 100));
}

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
  
  // Apply DPI scaling for crisp output
  canvas.width = totalSize * DPI_SCALE;
  canvas.height = totalSize * DPI_SCALE;
  canvas.style.width = `${totalSize}px`;
  canvas.style.height = `${totalSize}px`;
  
  const ctx = canvas.getContext('2d')!;
  ctx.scale(DPI_SCALE, DPI_SCALE);
  
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
 * Renders everything directly to canvas - no DOM capture needed
 * Matches the preview styling exactly with proper fonts
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
  // Ensure fonts are loaded before rendering
  await ensureFontsLoaded();
  
  const {
    boardSize = 500,
    darkMode = false,
    withWatermark = false,
    title,
  } = options;
  
  // Render the board
  const boardCanvas = renderBoardToCanvas(board, boardSize);
  
  // Calculate final canvas size (in CSS pixels, will be scaled by DPI)
  const padding = 50;
  const infoHeight = 200;
  const brandingHeight = 50;
  
  const boardDisplaySize = boardSize + boardSize * 0.04; // Account for border
  const totalWidth = boardDisplaySize + padding * 2;
  const totalHeight = boardDisplaySize + infoHeight + brandingHeight + padding * 2;
  
  const canvas = document.createElement('canvas');
  // Apply DPI scaling for crisp output
  canvas.width = totalWidth * DPI_SCALE;
  canvas.height = totalHeight * DPI_SCALE;
  
  const ctx = canvas.getContext('2d')!;
  ctx.scale(DPI_SCALE, DPI_SCALE);
  
  // Enable better text rendering
  ctx.textRendering = 'optimizeLegibility';
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  // Fill background - match preview exactly
  ctx.fillStyle = darkMode ? '#0A0A0A' : '#FDFCFB';
  ctx.fillRect(0, 0, totalWidth, totalHeight);
  
  // Draw the board (accounting for DPI scaling in source)
  ctx.drawImage(
    boardCanvas, 
    0, 0, boardCanvas.width, boardCanvas.height,
    padding, padding, boardDisplaySize, boardDisplaySize
  );
  
  // Draw separator line
  const separatorY = padding + boardDisplaySize + 24;
  ctx.strokeStyle = darkMode ? '#292524' : '#e7e5e4';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding, separatorY);
  ctx.lineTo(totalWidth - padding, separatorY);
  ctx.stroke();
  
  // Colors matching the preview exactly
  const primaryText = darkMode ? '#fafaf9' : '#292524';
  const secondaryText = darkMode ? '#a8a29e' : '#78716c';
  const mutedText = darkMode ? '#78716c' : '#a8a29e';
  const vsColor = darkMode ? '#78716c' : '#a8a29e';
  const dotColor = darkMode ? '#44403c' : '#d6d3d1';
  
  let textY = separatorY + 50;
  const centerX = totalWidth / 2;
  
  // Player names - using Cinzel font to match preview
  const whiteName = gameData.white || 'White';
  const blackName = gameData.black || 'Black';
  
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Measure with actual fonts
  ctx.font = "600 22px 'Cinzel', 'Times New Roman', serif";
  const whiteWidth = ctx.measureText(whiteName).width;
  const blackWidth = ctx.measureText(blackName).width;
  
  ctx.font = "italic 500 18px 'Cormorant', Georgia, serif";
  const vsWidth = ctx.measureText(' vs ').width;
  
  const totalTextWidth = whiteWidth + vsWidth + blackWidth;
  const startX = centerX - totalTextWidth / 2;
  
  // Draw white name
  ctx.font = "600 22px 'Cinzel', 'Times New Roman', serif";
  ctx.fillStyle = primaryText;
  ctx.textAlign = 'left';
  ctx.fillText(whiteName, startX, textY);
  
  // Draw "vs" - italic Cormorant
  ctx.font = "italic 500 18px 'Cormorant', Georgia, serif";
  ctx.fillStyle = vsColor;
  ctx.fillText(' vs ', startX + whiteWidth, textY);
  
  // Draw black name
  ctx.font = "600 22px 'Cinzel', 'Times New Roman', serif";
  ctx.fillStyle = primaryText;
  ctx.fillText(blackName, startX + whiteWidth + vsWidth, textY);
  
  textY += 32;
  
  // Event - using Cormorant italic to match preview
  if (gameData.event && gameData.event !== 'Unknown') {
    ctx.fillStyle = secondaryText;
    ctx.font = "italic 500 16px 'Cormorant', Georgia, serif";
    ctx.textAlign = 'center';
    ctx.fillText(gameData.event, centerX, textY);
    textY += 28;
  }
  
  // Title and date - using Inter to match preview
  const displayTitle = title;
  const formattedDate = formatDate(gameData.date || '');
  if (displayTitle || formattedDate) {
    ctx.fillStyle = mutedText;
    ctx.font = "500 11px 'Inter', sans-serif";
    ctx.textAlign = 'center';
    
    let labelText = '';
    if (displayTitle) {
      labelText = displayTitle.toUpperCase();
      if (formattedDate && formattedDate !== 'Date Unknown') {
        labelText += '  •  ' + formattedDate;
      }
    } else if (formattedDate) {
      labelText = formattedDate;
    }
    
    // Apply letter spacing by drawing characters individually
    const letterSpacing = 1.5;
    const chars = labelText.split('');
    let charX = centerX - (ctx.measureText(labelText).width + (chars.length - 1) * letterSpacing) / 2;
    for (const char of chars) {
      ctx.fillText(char, charX, textY);
      charX += ctx.measureText(char).width + letterSpacing;
    }
    textY += 24;
  }
  
  // Moves - using Times New Roman to match preview
  if (gameData.moves && gameData.moves.length > 0) {
    ctx.fillStyle = mutedText;
    ctx.font = "400 9px 'Times New Roman', Times, serif";
    ctx.textAlign = 'center';
    const movesText = gameData.moves.join(' ');
    const truncatedMoves = movesText.length > 350 
      ? movesText.substring(0, 350) + '...' 
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
        ctx.fillText(line, centerX, lineY);
        line = word;
        lineY += 14;
        if (lineY > textY + 56) break; // Max 4 lines
      } else {
        line = testLine;
      }
    }
    if (line && lineY <= textY + 56) {
      ctx.fillText(line, centerX, lineY);
    }
  }
  
  // En Pensent branding at bottom - matching preview
  ctx.fillStyle = mutedText;
  ctx.font = "500 10px 'Inter', sans-serif";
  ctx.textAlign = 'center';
  
  // Apply letter spacing for branding
  const brandingText = '♔ EN PENSENT ♚';
  const brandLetterSpacing = 3;
  const brandChars = brandingText.split('');
  let brandCharX = centerX - (ctx.measureText(brandingText).width + (brandChars.length - 1) * brandLetterSpacing) / 2;
  const brandingY = totalHeight - padding - 15;
  for (const char of brandChars) {
    ctx.fillText(char, brandCharX, brandingY);
    brandCharX += ctx.measureText(char).width + brandLetterSpacing;
  }
  
  // Watermark for free downloads
  if (withWatermark) {
    const wmWidth = 150;
    const wmHeight = 55;
    const wmX = padding + boardDisplaySize - wmWidth - 12;
    const wmY = padding + boardDisplaySize - wmHeight - 12;
    
    // Watermark background with rounded corners
    ctx.fillStyle = darkMode ? 'rgba(0,0,0,0.88)' : 'rgba(255,255,255,0.94)';
    ctx.beginPath();
    ctx.roundRect(wmX, wmY, wmWidth, wmHeight, 6);
    ctx.fill();
    
    // Border
    ctx.strokeStyle = darkMode ? '#57534e' : '#d6d3d1';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Gold logo circle
    ctx.fillStyle = '#D4AF37';
    ctx.beginPath();
    ctx.arc(wmX + 24, wmY + wmHeight / 2, 16, 0, Math.PI * 2);
    ctx.fill();
    
    // Crown symbol in logo
    ctx.fillStyle = darkMode ? '#0A0A0A' : '#FFFFFF';
    ctx.font = "bold 16px 'Cinzel', serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('♔', wmX + 24, wmY + wmHeight / 2 + 1);
    
    // Brand text
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = darkMode ? '#e7e5e4' : '#44403c';
    ctx.font = "600 11px 'Inter', sans-serif";
    ctx.fillText('EN PENSENT', wmX + 48, wmY + 22);
    ctx.font = "400 9px 'Inter', sans-serif";
    ctx.fillStyle = darkMode ? '#a8a29e' : '#78716c';
    ctx.fillText('enpensent.com', wmX + 48, wmY + 38);
  }
  
  return canvas;
}
