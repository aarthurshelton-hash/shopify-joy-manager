/**
 * GIF Frame Renderer - Generates individual frames for GIF animation
 * Uses offscreen rendering with React to capture each timeline state
 * Captures the full "trademark look" with game info visible
 */

import { SquareData, GameData, SimulationResult } from './gameSimulator';
import { getCurrentPalette } from './pieceColors';

export interface GifFrameOptions {
  board: SquareData[][];
  currentMove: number;
  totalMoves: number;
  size: number;
  darkMode?: boolean;
  showCoordinates?: boolean;
  gameData?: GameData;
  showPieces?: boolean;
  pieceOpacity?: number;
  pgn?: string;
}

/**
 * Filter board data to show only moves up to a certain point
 */
export function filterBoardToMove(board: SquareData[][], moveNumber: number): SquareData[][] {
  return board.map(rank =>
    rank.map(square => ({
      ...square,
      visits: square.visits.filter(visit => visit.moveNumber <= moveNumber)
    }))
  );
}

/**
 * Render a single frame of the visualization to a canvas
 * Uses the full trademark look with game info and branding
 */
export async function renderFrameToCanvas(
  options: GifFrameOptions
): Promise<HTMLCanvasElement> {
  const { board, currentMove, totalMoves, size, darkMode = false, showCoordinates = false, gameData, showPieces = false, pieceOpacity = 0.7, pgn } = options;
  
  const html2canvas = (await import('html2canvas')).default;
  const React = await import('react');
  const ReactDOM = await import('react-dom/client');
  const { default: ChessBoardVisualization } = await import('@/components/chess/ChessBoardVisualization');
  const { default: BoardCoordinateGuide } = await import('@/components/chess/BoardCoordinateGuide');
  const { default: StaticPieceOverlay } = await import('@/components/chess/StaticPieceOverlay');
  
  // Filter board to current move
  const filteredBoard = filterBoardToMove(board, currentMove);
  
  // Create temporary container
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  document.body.appendChild(container);
  
  // Colors for trademark look
  const bgColor = darkMode ? '#0A0A0A' : '#FDFCFB';
  const borderColor = darkMode ? '#292524' : '#e7e5e4';
  const mutedColor = darkMode ? '#78716c' : '#a8a29e';
  const primaryText = darkMode ? '#e7e5e4' : '#292524';
  const secondaryText = darkMode ? '#a8a29e' : '#78716c';
  
  try {
    // Create wrapper with trademark styling
    const wrapper = document.createElement('div');
    Object.assign(wrapper.style, {
      padding: '20px',
      backgroundColor: bgColor,
      borderRadius: '8px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '16px',
      border: `1px solid ${borderColor}`,
    });
    container.appendChild(wrapper);
    
    // Render the board with optional piece overlay
    const boardContainer = document.createElement('div');
    boardContainer.style.position = 'relative';
    wrapper.appendChild(boardContainer);
    
    const root = ReactDOM.createRoot(boardContainer);
    
    await new Promise<void>((resolve) => {
      // Render board with optional static piece overlay (no context required)
      root.render(
        React.createElement('div', { style: { position: 'relative', width: size, height: size } },
          showCoordinates && React.createElement(BoardCoordinateGuide, { size, position: 'inside' }),
          React.createElement(ChessBoardVisualization, {
            board: filteredBoard,
            size: size
          }),
          // Add static piece overlay if enabled
          showPieces && pgn && React.createElement(StaticPieceOverlay, {
            pgn,
            currentMoveNumber: currentMove,
            size,
            pieceOpacity,
          })
        )
      );
      setTimeout(resolve, showPieces ? 80 : 50);
    });
    
    // Add game info section if gameData provided
    if (gameData) {
      const infoSection = document.createElement('div');
      Object.assign(infoSection.style, {
        width: '100%',
        paddingTop: '12px',
        borderTop: `1px solid ${borderColor}`,
        textAlign: 'center',
      });
      
      // Player names
      const playersDiv = document.createElement('div');
      Object.assign(playersDiv.style, {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        marginBottom: '6px',
      });
      
      const whiteSpan = document.createElement('span');
      Object.assign(whiteSpan.style, {
        fontSize: '14px',
        fontWeight: '600',
        color: primaryText,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        fontFamily: "'Cinzel', 'Times New Roman', serif",
      });
      whiteSpan.textContent = gameData.white || 'White';
      
      const vsSpan = document.createElement('span');
      Object.assign(vsSpan.style, {
        fontSize: '10px',
        color: secondaryText,
        fontStyle: 'italic',
      });
      vsSpan.textContent = 'vs';
      
      const blackSpan = document.createElement('span');
      Object.assign(blackSpan.style, {
        fontSize: '14px',
        fontWeight: '600',
        color: primaryText,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        fontFamily: "'Cinzel', 'Times New Roman', serif",
      });
      blackSpan.textContent = gameData.black || 'Black';
      
      playersDiv.appendChild(whiteSpan);
      playersDiv.appendChild(vsSpan);
      playersDiv.appendChild(blackSpan);
      infoSection.appendChild(playersDiv);
      
      // Event and date
      if (gameData.event || gameData.date) {
        const eventDiv = document.createElement('div');
        Object.assign(eventDiv.style, {
          fontSize: '10px',
          color: mutedColor,
          marginBottom: '4px',
        });
        eventDiv.textContent = [gameData.event, gameData.date].filter(Boolean).join(' • ');
        infoSection.appendChild(eventDiv);
      }
      
      // Move counter
      const moveDiv = document.createElement('div');
      Object.assign(moveDiv.style, {
        fontSize: '9px',
        color: mutedColor,
        marginTop: '4px',
      });
      moveDiv.textContent = `Move ${currentMove} of ${totalMoves}`;
      infoSection.appendChild(moveDiv);
      
      wrapper.appendChild(infoSection);
    }
    
    // Add branding footer
    const brandingDiv = document.createElement('div');
    Object.assign(brandingDiv.style, {
      fontSize: '8px',
      letterSpacing: '0.25em',
      textTransform: 'uppercase',
      fontWeight: '500',
      color: mutedColor,
      fontFamily: "'Inter', system-ui, sans-serif",
    });
    brandingDiv.textContent = '♔ En Pensent ♚';
    wrapper.appendChild(brandingDiv);
    
    // Capture the frame
    const canvas = await html2canvas(wrapper, {
      scale: 2,
      backgroundColor: bgColor,
      useCORS: true,
      allowTaint: true,
      logging: false,
    });
    
    root.unmount();
    return canvas;
  } finally {
    document.body.removeChild(container);
  }
}

export interface GenerateGifOptions {
  simulation: SimulationResult;
  size?: number;
  darkMode?: boolean;
  showCoordinates?: boolean;
  frameDelay?: number;
  quality?: number;
  maxFrames?: number;
  onProgress?: (progress: number, message: string) => void;
  showPieces?: boolean;
  pieceOpacity?: number;
}

/**
 * Generate an animated GIF from a chess game simulation
 * Captures each move state using the timeline
 */
export async function generateAnimatedGif(
  options: GenerateGifOptions
): Promise<Blob> {
  const {
    simulation,
    size = 400,
    darkMode = false,
    showCoordinates = true,
    frameDelay = 150,
    quality = 10,
    maxFrames = 60,
    onProgress,
    showPieces = false,
    pieceOpacity = 0.7,
  } = options;
  
  // Validate simulation data
  if (!simulation || !simulation.board || simulation.totalMoves === undefined) {
    throw new Error('Invalid simulation data provided for GIF generation');
  }
  
  const { board, totalMoves, gameData } = simulation;
  
  // Handle edge case of no moves
  if (totalMoves === 0) {
    throw new Error('Cannot generate GIF for a game with no moves');
  }
  
  try {
    const GIF = (await import('gif.js')).default;
    
    // Determine which moves to capture (sample if too many)
    const step = totalMoves > maxFrames ? Math.ceil(totalMoves / maxFrames) : 1;
    const movesToCapture: number[] = [0]; // Always start with position 0
    
    for (let i = step; i <= totalMoves; i += step) {
      movesToCapture.push(i);
    }
    // Always include final frame
    if (movesToCapture[movesToCapture.length - 1] !== totalMoves) {
      movesToCapture.push(totalMoves);
    }
    
    const totalFramesToCapture = movesToCapture.length;
    onProgress?.(0, 'Preparing frames...');
    
    // Capture first frame to get dimensions
    let firstCanvas: HTMLCanvasElement;
    const pgn = gameData?.pgn || '';
    
    try {
      firstCanvas = await renderFrameToCanvas({
        board,
        currentMove: 0,
        totalMoves,
        size,
        darkMode,
        showCoordinates,
        gameData,
        showPieces,
        pieceOpacity,
        pgn,
      });
    } catch (frameError) {
      console.error('Failed to render first frame:', frameError);
      throw new Error('Failed to render visualization frame. Please try again.');
    }
    
    // Initialize GIF encoder with error handling for worker
    let gif: InstanceType<typeof GIF>;
    try {
      gif = new GIF({
        workers: 2,
        quality,
        width: firstCanvas.width,
        height: firstCanvas.height,
        workerScript: '/gif.worker.js',
      });
    } catch (workerError) {
      console.error('Failed to initialize GIF encoder:', workerError);
      throw new Error('GIF encoder initialization failed. The worker script may not be available.');
    }
    
    // Add first frame with longer delay
    gif.addFrame(firstCanvas, { delay: frameDelay * 3, copy: true });
    onProgress?.(0.05, `Captured frame 1 of ${totalFramesToCapture}`);
    
    // Capture remaining frames
    for (let i = 1; i < movesToCapture.length; i++) {
      const moveNum = movesToCapture[i];
      const isLastFrame = i === movesToCapture.length - 1;
      
      try {
        const canvas = await renderFrameToCanvas({
          board,
          currentMove: moveNum,
          totalMoves,
          size,
          darkMode,
          showCoordinates,
          gameData,
          showPieces,
          pieceOpacity,
          pgn,
        });
        
        // Hold first and last frames longer
        const delay = isLastFrame ? frameDelay * 4 : frameDelay;
        gif.addFrame(canvas, { delay, copy: true });
        
        const captureProgress = (i + 1) / totalFramesToCapture;
        onProgress?.(
          0.05 + captureProgress * 0.75,
          `Captured frame ${i + 1} of ${totalFramesToCapture}`
        );
      } catch (frameError) {
        console.warn(`Failed to capture frame ${i + 1}, skipping:`, frameError);
        // Continue with remaining frames
      }
    }
    
    onProgress?.(0.8, 'Encoding GIF...');
    
    // Render GIF with timeout protection
    return new Promise<Blob>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('GIF encoding timed out after 60 seconds'));
      }, 60000);
      
      gif.on('progress', (p: number) => {
        onProgress?.(0.8 + p * 0.2, 'Encoding GIF...');
      });
      
      gif.on('finished', (blob: Blob) => {
        clearTimeout(timeout);
        onProgress?.(1, 'Complete!');
        resolve(blob);
      });
      
      gif.on('error', (error: Error) => {
        clearTimeout(timeout);
        console.error('GIF encoding error:', error);
        reject(new Error('GIF encoding failed: ' + error.message));
      });
      
      try {
        gif.render();
      } catch (renderError) {
        clearTimeout(timeout);
        console.error('GIF render call failed:', renderError);
        reject(new Error('Failed to start GIF encoding'));
      }
    });
  } catch (error) {
    console.error('GIF generation failed:', error);
    throw error instanceof Error ? error : new Error('Unknown error during GIF generation');
  }
}
