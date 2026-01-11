import GIF from 'gif.js';
import html2canvas from 'html2canvas';
import { SimulationResult, SquareData } from './gameSimulator';

interface GifGeneratorOptions {
  board: SquareData[][];
  totalMoves: number;
  frameDelay?: number; // ms between frames
  quality?: number; // 1-30, lower is better quality
  onProgress?: (progress: number) => void;
}

// Filter board to show only moves up to a certain point
function filterBoardToMove(board: SquareData[][], moveNumber: number): SquareData[][] {
  return board.map(rank =>
    rank.map(square => ({
      ...square,
      visits: square.visits.filter(visit => visit.moveNumber <= moveNumber)
    }))
  );
}

export async function generateGameGif(
  captureElement: HTMLElement,
  options: GifGeneratorOptions
): Promise<Blob> {
  const {
    board,
    totalMoves,
    frameDelay = 150,
    quality = 10,
    onProgress
  } = options;

  return new Promise(async (resolve, reject) => {
    try {
      // Capture the first frame to get dimensions
      const firstCanvas = await html2canvas(captureElement, {
        scale: 2, // Good quality without being too large
        useCORS: true,
        allowTaint: true,
        logging: false,
      });

      const gif = new GIF({
        workers: 2,
        quality,
        width: firstCanvas.width,
        height: firstCanvas.height,
        workerScript: '/gif.worker.js',
      });

      // Determine which moves to capture (sample if too many)
      const maxFrames = 60; // Limit frames for reasonable file size
      const step = totalMoves > maxFrames ? Math.ceil(totalMoves / maxFrames) : 1;
      const movesToCapture: number[] = [];
      
      for (let i = 1; i <= totalMoves; i += step) {
        movesToCapture.push(i);
      }
      // Always include the final frame
      if (movesToCapture[movesToCapture.length - 1] !== totalMoves) {
        movesToCapture.push(totalMoves);
      }

      // Add starting position (move 0)
      movesToCapture.unshift(0);

      const totalFrames = movesToCapture.length;
      let capturedFrames = 0;

      // Capture frames for each move
      for (const moveNum of movesToCapture) {
        // We need to trigger a re-render with the filtered board
        // This is handled by the component that calls this function
        
        // Wait for render
        await new Promise(r => setTimeout(r, 50));

        const canvas = await html2canvas(captureElement, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
        });

        // Add frame - hold first and last frames longer
        const isFirstOrLast = moveNum === 0 || moveNum === totalMoves;
        gif.addFrame(canvas, { 
          delay: isFirstOrLast ? frameDelay * 3 : frameDelay,
          copy: true 
        });

        capturedFrames++;
        onProgress?.(capturedFrames / totalFrames * 0.8); // 80% for capture
      }

      gif.on('progress', (p: number) => {
        onProgress?.(0.8 + p * 0.2); // Last 20% for encoding
      });

      gif.on('finished', (blob: Blob) => {
        resolve(blob);
      });

      gif.render();
    } catch (error) {
      reject(error);
    }
  });
}
