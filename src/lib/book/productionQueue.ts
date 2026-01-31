/**
 * Book Production Queue System
 * Manages batch processing, job tracking, and production pipeline
 */

import { BookType } from './bookConfig';

export type ProductionStatus = 'queued' | 'processing' | 'generating' | 'printing' | 'shipping' | 'completed' | 'failed';
export type QualityLevel = 'standard' | 'high' | 'ultra';
export type EditionType = 'standard' | 'limited' | 'special' | 'collector';

export interface ProductionFeatures {
  signatures: boolean;
  numbering: boolean;
  coa: boolean;
  specialPrinting: boolean;
  foilStamping: boolean;
  ribbonMarker: boolean;
  slipcase: boolean;
}

export interface ProductionJob {
  id: string;
  bookType: BookType;
  edition: EditionType;
  editionName?: string;
  quantity: number;
  quality: QualityLevel;
  features: ProductionFeatures;
  status: ProductionStatus;
  priority: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  estimatedCompletion: Date;
  assignedTo?: string;
  progress: number;
  currentStep?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface QualityPreset {
  resolution: number;
  compression: number;
  colorSpace: 'srgb' | 'prophoto-rgb' | 'adobe-rgb';
  format: 'jpeg' | 'tiff' | 'png';
  dpi: number;
}

export const QUALITY_PRESETS: Record<QualityLevel, QualityPreset> = {
  standard: {
    resolution: 300,
    compression: 0.8,
    colorSpace: 'srgb',
    format: 'jpeg',
    dpi: 300
  },
  high: {
    resolution: 600,
    compression: 0.9,
    colorSpace: 'prophoto-rgb',
    format: 'tiff',
    dpi: 600
  },
  ultra: {
    resolution: 1200,
    compression: 1.0,
    colorSpace: 'prophoto-rgb',
    format: 'tiff',
    dpi: 1200
  }
};

export const DEFAULT_FEATURES: ProductionFeatures = {
  signatures: false,
  numbering: false,
  coa: false,
  specialPrinting: false,
  foilStamping: false,
  ribbonMarker: false,
  slipcase: false
};

/**
 * Production Queue Manager
 */
export class ProductionQueue {
  private jobs: Map<string, ProductionJob> = new Map();
  private processing: Set<string> = new Set();
  private maxConcurrent = 3;
  private listeners: Set<(jobs: ProductionJob[]) => void> = new Set();

  /**
   * Add a new production job
   */
  async addJob(params: {
    bookType: BookType;
    edition: EditionType;
    editionName?: string;
    quantity: number;
    quality: QualityLevel;
    features?: Partial<ProductionFeatures>;
    priority?: number;
  }): Promise<string> {
    const id = `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    
    const job: ProductionJob = {
      id,
      bookType: params.bookType,
      edition: params.edition,
      editionName: params.editionName,
      quantity: params.quantity,
      quality: params.quality,
      features: { ...DEFAULT_FEATURES, ...params.features },
      status: 'queued',
      priority: params.priority ?? 1,
      createdAt: new Date(),
      estimatedCompletion: this.calculateETA(params.quantity, params.quality),
      progress: 0
    };

    this.jobs.set(id, job);
    this.notifyListeners();
    
    // Try to process immediately if capacity available
    await this.processQueue();

    return id;
  }

  /**
   * Get job by ID
   */
  getJob(id: string): ProductionJob | undefined {
    return this.jobs.get(id);
  }

  /**
   * Get all jobs
   */
  getAllJobs(): ProductionJob[] {
    return Array.from(this.jobs.values()).sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  /**
   * Get jobs by status
   */
  getJobsByStatus(status: ProductionStatus): ProductionJob[] {
    return this.getAllJobs().filter(job => job.status === status);
  }

  /**
   * Cancel a job
   */
  cancelJob(id: string): boolean {
    const job = this.jobs.get(id);
    if (!job || job.status === 'completed' || job.status === 'failed') {
      return false;
    }

    job.status = 'failed';
    job.error = 'Cancelled by user';
    this.processing.delete(id);
    this.notifyListeners();
    
    return true;
  }

  /**
   * Retry a failed job
   */
  async retryJob(id: string): Promise<boolean> {
    const job = this.jobs.get(id);
    if (!job || job.status !== 'failed') {
      return false;
    }

    job.status = 'queued';
    job.progress = 0;
    job.error = undefined;
    job.estimatedCompletion = this.calculateETA(job.quantity, job.quality);
    this.notifyListeners();

    await this.processQueue();
    return true;
  }

  /**
   * Process the queue
   */
  private async processQueue(): Promise<void> {
    const availableSlots = this.maxConcurrent - this.processing.size;
    if (availableSlots <= 0) return;

    // Get highest priority queued jobs
    const queuedJobs = this.getJobsByStatus('queued')
      .sort((a, b) => b.priority - a.priority)
      .slice(0, availableSlots);

    for (const job of queuedJobs) {
      this.processing.add(job.id);
      job.status = 'processing';
      job.startedAt = new Date();
      this.notifyListeners();

      // Start processing in background (non-blocking)
      this.processJob(job).catch(error => {
        console.error(`Job ${job.id} failed:`, error);
      });
    }
  }

  /**
   * Process a single job
   */
  private async processJob(job: ProductionJob): Promise<void> {
    try {
      // Step 1: Generate content
      job.currentStep = 'Generating book content';
      job.progress = 10;
      this.notifyListeners();
      await this.simulateStep(2000);

      // Step 2: Apply edition features
      job.currentStep = 'Applying edition features';
      job.progress = 30;
      this.notifyListeners();
      await this.simulateStep(1500);

      // Step 3: Generate print files
      job.currentStep = 'Creating print-ready files';
      job.status = 'generating';
      job.progress = 50;
      this.notifyListeners();
      await this.simulateStep(3000);

      // Step 4: Quality check
      job.currentStep = 'Quality verification';
      job.progress = 70;
      this.notifyListeners();
      await this.simulateStep(1000);

      // Step 5: Send to printer
      job.currentStep = 'Sending to printer';
      job.status = 'printing';
      job.progress = 85;
      this.notifyListeners();
      await this.simulateStep(2000);

      // Step 6: Complete
      job.status = 'completed';
      job.progress = 100;
      job.completedAt = new Date();
      job.currentStep = 'Complete';
      this.notifyListeners();

    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      this.notifyListeners();
    } finally {
      this.processing.delete(job.id);
      // Process next in queue
      await this.processQueue();
    }
  }

  /**
   * Simulate a processing step (for demo purposes)
   */
  private simulateStep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Calculate estimated completion time
   */
  private calculateETA(quantity: number, quality: QualityLevel): Date {
    const baseTime = 30 * 60 * 1000; // 30 minutes base
    const qualityMultiplier = quality === 'ultra' ? 3 : quality === 'high' ? 2 : 1;
    const quantityMultiplier = Math.log10(quantity + 1) + 1;
    
    const totalTime = baseTime * qualityMultiplier * quantityMultiplier;
    return new Date(Date.now() + totalTime);
  }

  /**
   * Subscribe to job updates
   */
  subscribe(listener: (jobs: ProductionJob[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(): void {
    const jobs = this.getAllJobs();
    this.listeners.forEach(listener => listener(jobs));
  }

  /**
   * Get queue statistics
   */
  getStats(): {
    queued: number;
    processing: number;
    completed: number;
    failed: number;
    totalJobs: number;
  } {
    const jobs = this.getAllJobs();
    return {
      queued: jobs.filter(j => j.status === 'queued').length,
      processing: jobs.filter(j => ['processing', 'generating', 'printing'].includes(j.status)).length,
      completed: jobs.filter(j => j.status === 'completed').length,
      failed: jobs.filter(j => j.status === 'failed').length,
      totalJobs: jobs.length
    };
  }
}

// Export singleton instance
export const productionQueue = new ProductionQueue();
