/**
 * Audio/Music Domain Adapter v2.0 (Refactored)
 * 
 * Converts sound waves to En Pensent temporal signatures
 */

import type { DomainAdapter, UniversalSignal, DomainSignature } from '../types';
import type { AudioData } from './audio/types';
import { AUDIO_BUFFER_SIZE } from './audio/types';
import { processAudioToSignal } from './audio/signalProcessing';
import { extractAudioSignature } from './audio/signatureExtraction';
import { generateMarketCorrelatedSignal } from './audio/marketCorrelation';

class AudioDomainAdapter implements DomainAdapter<AudioData> {
  domain = 'audio' as const;
  name = 'Audio Pattern Analyzer';
  isActive = false;
  lastUpdate = 0;
  
  private signalBuffer: UniversalSignal[] = [];

  async initialize(): Promise<void> {
    this.isActive = true;
    this.lastUpdate = Date.now();
    console.log('[AudioAdapter] Initialized - Audio pattern recognition active');
  }

  processRawData(data: AudioData): UniversalSignal {
    const signal = processAudioToSignal(data);
    
    this.signalBuffer.push(signal);
    if (this.signalBuffer.length > AUDIO_BUFFER_SIZE) {
      this.signalBuffer.shift();
    }
    
    this.lastUpdate = signal.timestamp;
    return signal;
  }

  extractSignature(signals: UniversalSignal[]): DomainSignature {
    return extractAudioSignature(signals);
  }

  generateMarketCorrelatedSignal(
    marketMomentum: number, 
    marketVolatility: number
  ): AudioData {
    return generateMarketCorrelatedSignal(marketMomentum, marketVolatility);
  }
}

export const audioAdapter = new AudioDomainAdapter();
export type { AudioData };
