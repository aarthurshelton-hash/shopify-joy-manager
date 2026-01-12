/**
 * GIF Frame Renderer - Generates individual frames for GIF animation
 * Uses offscreen rendering with React to capture each timeline state
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
 */
export async function renderFrameToCanvas(
  options: GifFrameOptions
): Promise<HTMLCanvasElement> {
  const { board, currentMove, totalMoves, size, darkMode = false, showCoordinates = false } = options;
  
  const html2canvas = (await import('html2canvas')).default;
  const React = await import('react');
  const ReactDOM = await import('react-dom/client');
  const { default: ChessBoardVisualization } = await import('@/components/chess/ChessBoardVisualization');
  const { default: BoardCoordinateGuide } = await import('@/components/chess/BoardCoordinateGuide');
  
  // Filter board to current move
  const filteredBoard = filterBoardToMove(board, currentMove);
  
  // Create temporary container
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  document.body.appendChild(container);
  
  try {
    // Create wrapper with styling
    const wrapper = document.createElement('div');
    wrapper.style.padding = '16px';
    wrapper.style.backgroundColor = darkMode ? '#0A0A0A' : '#FDFCFB';
    wrapper.style.borderRadius = '8px';
    wrapper.style.position = 'relative';
    container.appendChild(wrapper);
    
    // Render the board
    const boardContainer = document.createElement('div');
    boardContainer.style.position = 'relative';
    wrapper.appendChild(boardContainer);
    
    const root = ReactDOM.createRoot(boardContainer);
    
    await new Promise<void>((resolve) => {
      root.render(
        React.createElement('div', { style: { position: 'relative' } },
          showCoordinates && React.createElement(BoardCoordinateGuide, { size, position: 'inside' }),
          React.createElement(ChessBoardVisualization, {
            board: filteredBoard,
            size: size
          })
        )
      );
      setTimeout(resolve, 50);
    });
    
    // Capture the frame
    const canvas = await html2canvas(wrapper, {
      scale: 2,
      backgroundColor: darkMode ? '#0A0A0A' : '#FDFCFB',
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
    onProgress
  } = options;
  
  const GIF = (await import('gif.js')).default;
  const { board, totalMoves } = simulation;
  
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
  const firstCanvas = await renderFrameToCanvas({
    board,
    currentMove: 0,
    totalMoves,
    size,
    darkMode,
    showCoordinates
  });
  
  // Initialize GIF encoder
  const gif = new GIF({
    workers: 2,
    quality,
    width: firstCanvas.width,
    height: firstCanvas.height,
    workerScript: '/gif.worker.js',
  });
  
  // Add first frame with longer delay
  gif.addFrame(firstCanvas, { delay: frameDelay * 3, copy: true });
  onProgress?.(0.05, `Captured frame 1 of ${totalFramesToCapture}`);
  
  // Capture remaining frames
  for (let i = 1; i < movesToCapture.length; i++) {
    const moveNum = movesToCapture[i];
    const isLastFrame = i === movesToCapture.length - 1;
    
    const canvas = await renderFrameToCanvas({
      board,
      currentMove: moveNum,
      totalMoves,
      size,
      darkMode,
      showCoordinates
    });
    
    // Hold first and last frames longer
    const delay = isLastFrame ? frameDelay * 4 : frameDelay;
    gif.addFrame(canvas, { delay, copy: true });
    
    const captureProgress = (i + 1) / totalFramesToCapture;
    onProgress?.(
      0.05 + captureProgress * 0.75,
      `Captured frame ${i + 1} of ${totalFramesToCapture}`
    );
  }
  
  onProgress?.(0.8, 'Encoding GIF...');
  
  // Render GIF
  return new Promise<Blob>((resolve, reject) => {
    gif.on('progress', (p: number) => {
      onProgress?.(0.8 + p * 0.2, 'Encoding GIF...');
    });
    
    gif.on('finished', (blob: Blob) => {
      onProgress?.(1, 'Complete!');
      resolve(blob);
    });
    
    gif.on('error', (error: Error) => {
      reject(error);
    });
    
    gif.render();
  });
}
