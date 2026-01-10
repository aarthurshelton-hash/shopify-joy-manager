import { SimulationResult } from './gameSimulator';

/**
 * Generates a clean (no watermark) base64 image from a chess visualization
 * This is used for Printify print orders - identical to the preview
 */
export async function generateCleanPrintImage(
  simulation: SimulationResult,
  darkMode: boolean = false
): Promise<string> {
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
    
    // Create board container
    const boardContainer = document.createElement('div');
    printContent.appendChild(boardContainer);
    
    // Render the chess board
    const boardRoot = ReactDOM.createRoot(boardContainer);
    await new Promise<void>((resolve) => {
      boardRoot.render(
        React.createElement(ChessBoardVisualization, {
          board: simulation.board,
          size: 400, // High-res for print
        })
      );
      // Give React time to render
      setTimeout(resolve, 100);
    });
    
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
