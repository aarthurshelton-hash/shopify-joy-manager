import { SimulationResult, SquareData } from './gameSimulator';
import { generateQRDataUrl } from '@/lib/qr/generateVisualizationQR';
import logo from '@/assets/en-pensent-logo-new.png';

interface CapturedState {
  currentMove: number;
  selectedPhase: string;
  lockedPieces: Array<{ pieceType: string; pieceColor: string }>;
  compareMode: boolean;
  displayMode: string;
  darkMode: boolean;
  showTerritory: boolean;
  showHeatmaps: boolean;
  capturedAt: Date;
}

interface PrintOptions {
  darkMode?: boolean;
  includeQR?: boolean;
  shareId?: string;
  capturedState?: CapturedState;
}

/**
 * Filter board data to match a specific move in the timeline
 */
function filterBoardToMove(board: SquareData[][], currentMove: number): SquareData[][] {
  if (currentMove === Infinity || currentMove <= 0) return board;
  
  return board.map(row => 
    row.map(square => ({
      ...square,
      visits: square.visits.filter(visit => visit.moveNumber <= currentMove)
    }))
  );
}

/**
 * Generates a clean (no watermark) base64 image from a chess visualization
 * This is used for Printify print orders - identical to the preview
 * For premium users, includes an artistic QR code linking to the digital version
 */
export async function generateCleanPrintImage(
  simulation: SimulationResult,
  options: PrintOptions = {}
): Promise<string> {
  const { darkMode = false, includeQR = false, shareId, capturedState } = options;
  const html2canvas = (await import('html2canvas')).default;
  
  // Create a temporary container for rendering
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  document.body.appendChild(container);
  
  try {
    // Import React and ReactDOM for rendering
    const React = await import('react');
    const ReactDOM = await import('react-dom/client');
    const { default: ChessBoardVisualization } = await import('@/components/chess/ChessBoardVisualization');
    const { default: GameInfoDisplay } = await import('@/components/chess/GameInfoDisplay');
    
    // Create the print content element
    const printContent = document.createElement('div');
    printContent.style.padding = '40px';
    printContent.style.backgroundColor = darkMode ? '#0A0A0A' : '#FDFCFB';
    printContent.style.width = 'fit-content';
    printContent.style.display = 'flex';
    printContent.style.flexDirection = 'column';
    printContent.style.alignItems = 'center';
    printContent.style.gap = '24px';
    
    container.appendChild(printContent);
    
    // Create board container with relative positioning for QR overlay
    const boardWrapper = document.createElement('div');
    boardWrapper.style.position = 'relative';
    printContent.appendChild(boardWrapper);
    
    const boardContainer = document.createElement('div');
    boardWrapper.appendChild(boardContainer);
    
    // Apply captured state filtering if available
    const filteredBoard = capturedState && capturedState.currentMove !== Infinity
      ? filterBoardToMove(simulation.board, capturedState.currentMove)
      : simulation.board;
    
    // Render the chess board with filtered data
    const boardRoot = ReactDOM.createRoot(boardContainer);
    await new Promise<void>((resolve) => {
      boardRoot.render(
        React.createElement(ChessBoardVisualization, {
          board: filteredBoard,
          size: 400, // High-res for print
        })
      );
      // Give React time to render
      setTimeout(resolve, 100);
    });
    
    // Add QR code for premium prints
    if (includeQR && shareId) {
      const qrContainer = document.createElement('div');
      qrContainer.style.position = 'absolute';
      qrContainer.style.bottom = '8px';
      qrContainer.style.right = '8px';
      qrContainer.style.zIndex = '10';
      
      try {
        const qrDataUrl = await generateQRDataUrl(shareId, 96);
        
        // Create QR wrapper with glass effect
        const qrWrapper = document.createElement('div');
        qrWrapper.style.backgroundColor = 'rgba(0, 0, 0, 0.75)';
        qrWrapper.style.padding = '4px';
        qrWrapper.style.borderRadius = '6px';
        qrWrapper.style.border = '1px solid rgba(212, 175, 55, 0.25)';
        qrWrapper.style.display = 'flex';
        qrWrapper.style.flexDirection = 'column';
        qrWrapper.style.alignItems = 'center';
        qrWrapper.style.gap = '2px';
        
        // QR code image
        const qrImg = document.createElement('img');
        qrImg.src = qrDataUrl;
        qrImg.style.width = '48px';
        qrImg.style.height = '48px';
        qrImg.style.display = 'block';
        qrWrapper.appendChild(qrImg);
        
        // Load and add logo overlay
        const logoImg = document.createElement('img');
        logoImg.src = logo;
        logoImg.style.position = 'absolute';
        logoImg.style.width = '14px';
        logoImg.style.height = '14px';
        logoImg.style.top = '50%';
        logoImg.style.left = '50%';
        logoImg.style.transform = 'translate(-50%, -50%)';
        logoImg.style.borderRadius = '50%';
        logoImg.style.border = '1px solid rgba(212, 175, 55, 0.4)';
        
        const logoWrapper = document.createElement('div');
        logoWrapper.style.position = 'relative';
        logoWrapper.style.width = '48px';
        logoWrapper.style.height = '48px';
        logoWrapper.appendChild(qrImg);
        logoWrapper.appendChild(logoImg);
        qrWrapper.appendChild(logoWrapper);
        
        // "SCAN" label
        const scanLabel = document.createElement('p');
        scanLabel.textContent = 'SCAN';
        scanLabel.style.fontSize = '5px';
        scanLabel.style.color = 'rgba(212, 175, 55, 0.5)';
        scanLabel.style.letterSpacing = '0.15em';
        scanLabel.style.margin = '0';
        scanLabel.style.fontFamily = "'Inter', system-ui, sans-serif";
        qrWrapper.appendChild(scanLabel);
        
        qrContainer.appendChild(qrWrapper);
        boardWrapper.appendChild(qrContainer);
        
        // Wait for QR image to load
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (qrError) {
        console.warn('Failed to generate QR code for print:', qrError);
      }
    }
    
    // Add game info section
    const infoContainer = document.createElement('div');
    infoContainer.style.width = '100%';
    infoContainer.style.paddingTop = '16px';
    infoContainer.style.borderTop = `1px solid ${darkMode ? '#292524' : '#e7e5e4'}`;
    printContent.appendChild(infoContainer);
    
    const infoRoot = ReactDOM.createRoot(infoContainer);
    await new Promise<void>((resolve) => {
      infoRoot.render(
        React.createElement(GameInfoDisplay, {
          gameData: simulation.gameData,
          darkMode,
        })
      );
      setTimeout(resolve, 100);
    });
    
    // Add subtle branding (same as preview - no watermark)
    const branding = document.createElement('p');
    branding.textContent = '♔ En Pensent ♚';
    branding.style.fontSize = '10px';
    branding.style.letterSpacing = '0.3em';
    branding.style.textTransform = 'uppercase';
    branding.style.fontWeight = '500';
    branding.style.color = darkMode ? '#78716c' : '#a8a29e';
    branding.style.fontFamily = "'Inter', system-ui, sans-serif";
    printContent.appendChild(branding);
    
    // Wait for images to load
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Capture with html2canvas
    const canvas = await html2canvas(printContent, {
      scale: 3, // High resolution for print quality
      backgroundColor: darkMode ? '#0A0A0A' : '#FDFCFB',
      useCORS: true,
      allowTaint: true,
      logging: false,
    });
    
    // Convert to base64
    const base64 = canvas.toDataURL('image/png', 1.0);
    
    // Cleanup React roots
    boardRoot.unmount();
    infoRoot.unmount();
    
    return base64;
  } finally {
    // Always cleanup the container
    document.body.removeChild(container);
  }
}

/**
 * Legacy signature for backward compatibility
 */
export async function generateCleanPrintImageLegacy(
  simulation: SimulationResult,
  darkMode: boolean = false
): Promise<string> {
  return generateCleanPrintImage(simulation, { darkMode });
}
