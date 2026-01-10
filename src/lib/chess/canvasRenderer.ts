import { SquareData, SquareVisit } from './gameSimulator';
import { boardColors, getPieceColor } from './pieceColors';

// High DPI scaling for crisp downloads - 4x for max quality
const DPI_SCALE = 4;

// Format date from PGN format (YYYY.MM.DD) to display format
function formatDate(dateStr: string): string {
  if (!dateStr || dateStr === 'Unknown' || dateStr === '????.??.??') {
    return dateStr; // Keep as-is for display
  }
  return dateStr;
}

// Wait for fonts to be loaded
async function ensureFontsLoaded(): Promise<void> {
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }
  await new Promise(resolve => setTimeout(resolve, 150));
}

/**
 * Generates SVG string for the chess board - matches ChessBoardVisualization exactly
 */
function generateBoardSVG(board: SquareData[][], size: number): string {
  const squareSize = size / 8;
  const borderWidth = size * 0.02;
  const totalSize = size + borderWidth * 2;
  
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalSize}" height="${totalSize}" viewBox="0 0 ${totalSize} ${totalSize}">`;
  
  // Border
  svg += `<rect x="0" y="0" width="${totalSize}" height="${totalSize}" fill="${boardColors.border}"/>`;
  
  // Board squares
  for (let rowIndex = 0; rowIndex < 8; rowIndex++) {
    const rank = 7 - rowIndex;
    for (let file = 0; file < 8; file++) {
      const square = board[rank][file];
      const baseColor = square.isLight ? boardColors.light : boardColors.dark;
      const x = borderWidth + file * squareSize;
      const y = borderWidth + rowIndex * squareSize;
      
      // Base square
      svg += `<rect x="${x}" y="${y}" width="${squareSize}" height="${squareSize}" fill="${baseColor}"/>`;
      
      // Nested squares for piece visits
      if (square.visits.length > 0) {
        const padding = squareSize * 0.08;
        const uniqueColors: string[] = [];
        for (const visit of square.visits) {
          const color = getPieceColor(visit.piece, visit.color);
          if (!uniqueColors.includes(color)) {
            uniqueColors.push(color);
          }
        }
        
        const maxNesting = Math.min(uniqueColors.length, 6);
        const layers: { color: string; layerSize: number }[] = [];
        let currentSize = squareSize - padding * 2;
        const sizeReduction = (currentSize * 0.7) / maxNesting;
        
        for (let i = 0; i < maxNesting; i++) {
          layers.push({ color: uniqueColors[i], layerSize: currentSize });
          currentSize -= sizeReduction;
          if (currentSize < squareSize * 0.1) break;
        }
        
        for (const layer of layers) {
          const offset = (squareSize - layer.layerSize) / 2;
          svg += `<rect x="${x + offset}" y="${y + offset}" width="${layer.layerSize}" height="${layer.layerSize}" fill="${layer.color}"/>`;
        }
      }
    }
  }
  
  svg += '</svg>';
  return svg;
}

/**
 * Converts SVG string to canvas at high resolution
 */
async function svgToCanvas(svgString: string, width: number, height: number): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width * DPI_SCALE;
      canvas.height = height * DPI_SCALE;
      const ctx = canvas.getContext('2d')!;
      ctx.scale(DPI_SCALE, DPI_SCALE);
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load SVG'));
    };
    
    img.src = url;
  });
}

/**
 * Generates QR code as SVG (simple version)
 */
async function generateQRCodeDataUrl(darkMode: boolean): Promise<string> {
  // Import QRCode dynamically
  const QRCode = (await import('qrcode')).default;
  return QRCode.toDataURL('https://enpensent.com', {
    width: 100,
    margin: 1,
    color: {
      dark: darkMode ? '#FAFAFA' : '#1A1A1A',
      light: 'transparent',
    },
    errorCorrectionLevel: 'M',
  });
}

/**
 * Load logo as base64
 */
async function loadLogoAsBase64(): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    // Use the logo from assets
    img.src = new URL('@/assets/en-pensent-logo-new.png', import.meta.url).href;
  });
}

/**
 * Generates a complete print-ready image with board and game info
 * Matches the preview exactly by using the same SVG rendering
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
  await ensureFontsLoaded();
  
  const {
    boardSize = 600,
    darkMode = false,
    withWatermark = false,
    title,
  } = options;
  
  // Generate SVG for the board
  const svgString = generateBoardSVG(board, boardSize);
  const borderWidth = boardSize * 0.02;
  const boardTotalSize = boardSize + borderWidth * 2;
  
  // Convert SVG to high-res canvas
  const boardCanvas = await svgToCanvas(svgString, boardTotalSize, boardTotalSize);
  
  // Calculate final dimensions
  const padding = 60;
  const infoHeight = 220;
  const brandingHeight = 60;
  
  const totalWidth = boardTotalSize + padding * 2;
  const totalHeight = boardTotalSize + infoHeight + brandingHeight + padding * 2;
  
  // Create final canvas at high resolution
  const canvas = document.createElement('canvas');
  canvas.width = totalWidth * DPI_SCALE;
  canvas.height = totalHeight * DPI_SCALE;
  
  const ctx = canvas.getContext('2d')!;
  ctx.scale(DPI_SCALE, DPI_SCALE);
  
  // Enable smooth rendering
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  // Background - exact match to preview
  ctx.fillStyle = darkMode ? '#0A0A0A' : '#FDFCFB';
  ctx.fillRect(0, 0, totalWidth, totalHeight);
  
  // Draw the board from SVG canvas
  ctx.drawImage(
    boardCanvas,
    0, 0, boardCanvas.width, boardCanvas.height,
    padding, padding, boardTotalSize, boardTotalSize
  );
  
  // Separator line
  const separatorY = padding + boardTotalSize + 28;
  ctx.strokeStyle = darkMode ? '#292524' : '#e7e5e4';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding, separatorY);
  ctx.lineTo(totalWidth - padding, separatorY);
  ctx.stroke();
  
  // Text colors matching preview exactly
  const primaryText = darkMode ? '#fafaf9' : '#292524';
  const secondaryText = darkMode ? '#a8a29e' : '#78716c';
  const mutedText = darkMode ? '#78716c' : '#a8a29e';
  const vsColor = darkMode ? '#78716c' : '#a8a29e';
  
  const centerX = totalWidth / 2;
  let textY = separatorY + 55;
  
  // Player names - Cinzel font, exact preview style
  const whiteName = gameData.white || 'White';
  const blackName = gameData.black || 'Black';
  
  ctx.textBaseline = 'middle';
  
  // Measure text widths
  ctx.font = "600 24px 'Cinzel', 'Times New Roman', serif";
  const whiteWidth = ctx.measureText(whiteName).width;
  const blackWidth = ctx.measureText(blackName).width;
  
  ctx.font = "italic 500 20px 'Cormorant', Georgia, serif";
  const vsText = ' vs ';
  const vsWidth = ctx.measureText(vsText).width;
  
  const totalTextWidth = whiteWidth + vsWidth + blackWidth;
  const startX = centerX - totalTextWidth / 2;
  
  // Draw white player name
  ctx.font = "600 24px 'Cinzel', 'Times New Roman', serif";
  ctx.fillStyle = primaryText;
  ctx.textAlign = 'left';
  ctx.fillText(whiteName, startX, textY);
  
  // Draw "vs"
  ctx.font = "italic 500 20px 'Cormorant', Georgia, serif";
  ctx.fillStyle = vsColor;
  ctx.fillText(vsText, startX + whiteWidth, textY);
  
  // Draw black player name
  ctx.font = "600 24px 'Cinzel', 'Times New Roman', serif";
  ctx.fillStyle = primaryText;
  ctx.fillText(blackName, startX + whiteWidth + vsWidth, textY);
  
  textY += 36;
  
  // Event - Cormorant italic
  if (gameData.event && gameData.event !== 'Unknown') {
    ctx.fillStyle = secondaryText;
    ctx.font = "italic 500 18px 'Cormorant', Georgia, serif";
    ctx.textAlign = 'center';
    ctx.fillText(gameData.event, centerX, textY);
    textY += 32;
  }
  
  // Title and Date - Inter font with letter-spacing
  const displayTitle = title;
  const dateStr = gameData.date || '';
  if (displayTitle || dateStr) {
    ctx.fillStyle = mutedText;
    ctx.font = "500 12px 'Inter', sans-serif";
    ctx.textAlign = 'center';
    
    let labelText = '';
    if (displayTitle) {
      labelText = displayTitle.toUpperCase();
      if (dateStr) labelText += '  •  ' + dateStr;
    } else {
      labelText = dateStr;
    }
    
    // Manual letter-spacing
    const spacing = 2;
    const chars = labelText.split('');
    const totalCharWidth = chars.reduce((sum, c) => sum + ctx.measureText(c).width, 0);
    const totalSpacing = (chars.length - 1) * spacing;
    let charX = centerX - (totalCharWidth + totalSpacing) / 2;
    
    for (const char of chars) {
      ctx.textAlign = 'left';
      ctx.fillText(char, charX, textY);
      charX += ctx.measureText(char).width + spacing;
    }
    textY += 28;
  }
  
  // Moves - Times New Roman
  if (gameData.moves && gameData.moves.length > 0) {
    ctx.fillStyle = mutedText;
    ctx.font = "400 10px 'Times New Roman', Times, serif";
    ctx.textAlign = 'center';
    
    const movesText = gameData.moves.join(' ');
    const truncatedMoves = movesText.length > 400 ? movesText.substring(0, 400) + '...' : movesText;
    
    const maxWidth = totalWidth - padding * 2 - 40;
    const words = truncatedMoves.split(' ');
    let line = '';
    let lineY = textY;
    const lineHeight = 15;
    const maxLines = 4;
    let lineCount = 0;
    
    for (const word of words) {
      const testLine = line + (line ? ' ' : '') + word;
      if (ctx.measureText(testLine).width > maxWidth && line) {
        ctx.fillText(line, centerX, lineY);
        line = word;
        lineY += lineHeight;
        lineCount++;
        if (lineCount >= maxLines) break;
      } else {
        line = testLine;
      }
    }
    if (line && lineCount < maxLines) {
      ctx.fillText(line, centerX, lineY);
    }
  }
  
  // Branding at bottom
  const brandingY = totalHeight - padding - 20;
  ctx.fillStyle = mutedText;
  ctx.font = "500 11px 'Inter', sans-serif";
  ctx.textAlign = 'center';
  
  const brandText = '♔ EN PENSENT ♚';
  const brandSpacing = 4;
  const brandChars = brandText.split('');
  const brandCharWidth = brandChars.reduce((sum, c) => sum + ctx.measureText(c).width, 0);
  const brandTotalWidth = brandCharWidth + (brandChars.length - 1) * brandSpacing;
  let brandX = centerX - brandTotalWidth / 2;
  
  for (const char of brandChars) {
    ctx.textAlign = 'left';
    ctx.fillText(char, brandX, brandingY);
    brandX += ctx.measureText(char).width + brandSpacing;
  }
  
  // Watermark for free downloads - matching reference image exactly
  if (withWatermark) {
    const qrDataUrl = await generateQRCodeDataUrl(darkMode);
    
    const wmWidth = 200;
    const wmHeight = 60;
    const wmX = padding + boardTotalSize - wmWidth - 15;
    const wmY = padding + boardTotalSize - wmHeight - 15;
    
    // Background with rounded corners
    ctx.fillStyle = darkMode ? 'rgba(10,10,10,0.92)' : 'rgba(255,255,255,0.95)';
    ctx.beginPath();
    ctx.roundRect(wmX, wmY, wmWidth, wmHeight, 8);
    ctx.fill();
    
    // Subtle border
    ctx.strokeStyle = darkMode ? '#44403c' : '#e7e5e4';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Gold logo circle
    const logoSize = 40;
    const logoX = wmX + 15;
    const logoY = wmY + (wmHeight - logoSize) / 2;
    
    ctx.fillStyle = '#D4AF37';
    ctx.beginPath();
    ctx.arc(logoX + logoSize/2, logoY + logoSize/2, logoSize/2, 0, Math.PI * 2);
    ctx.fill();
    
    // Crown in logo
    ctx.fillStyle = darkMode ? '#0A0A0A' : '#FFFFFF';
    ctx.font = "bold 20px 'Cinzel', serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('♔', logoX + logoSize/2, logoY + logoSize/2 + 1);
    
    // Brand text
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    const textX = logoX + logoSize + 12;
    
    ctx.fillStyle = darkMode ? '#e7e5e4' : '#44403c';
    ctx.font = "600 12px 'Inter', sans-serif";
    ctx.fillText('EN PENSENT', textX, wmY + 26);
    
    ctx.fillStyle = darkMode ? '#a8a29e' : '#78716c';
    ctx.font = "400 10px 'Inter', sans-serif";
    ctx.fillText('enpensent.com', textX, wmY + 42);
    
    // QR Code
    const qrSize = 44;
    const qrX = wmX + wmWidth - qrSize - 10;
    const qrY = wmY + (wmHeight - qrSize) / 2;
    
    const qrImg = new Image();
    await new Promise<void>((resolve) => {
      qrImg.onload = () => {
        ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
        resolve();
      };
      qrImg.onerror = () => resolve();
      qrImg.src = qrDataUrl;
    });
  }
  
  return canvas;
}
