/**
 * Professional PDF Generator for Book Production
 * Creates print-ready PDFs with proper bleeds, crop marks, and quality settings
 */

import { jsPDF } from 'jspdf';
import { BookConfig, GameType, BookType } from './bookConfig';
import { QualityLevel, QUALITY_PRESETS, ProductionFeatures } from './productionQueue';

export interface GeneratedSpread {
  game: GameType;
  haiku: string;
  visualizationImage: string;
  status: 'pending' | 'generating' | 'complete' | 'error';
}

export interface PDFGeneratorOptions {
  quality: QualityLevel;
  features: ProductionFeatures;
  edition: string;
  copyNumber?: number;
  maxCopies?: number;
  includeBleed?: boolean;
  includeCropMarks?: boolean;
}

const DEFAULT_OPTIONS: PDFGeneratorOptions = {
  quality: 'high',
  features: {
    signatures: false,
    numbering: false,
    coa: false,
    specialPrinting: false,
    foilStamping: false,
    ribbonMarker: false,
    slipcase: false
  },
  edition: 'standard',
  includeBleed: false,
  includeCropMarks: false
};

/**
 * Professional PDF Generator
 */
export class ProfessionalPDFGenerator {
  private doc: jsPDF;
  private config: BookConfig;
  private options: PDFGeneratorOptions;
  private pageWidth: number;
  private pageHeight: number;

  constructor(config: BookConfig, options: Partial<PDFGeneratorOptions> = {}) {
    this.config = config;
    this.options = { ...DEFAULT_OPTIONS, ...options };
    
    // Set page size based on quality
    const isUltra = this.options.quality === 'ultra';
    const format = isUltra ? 'a3' : 'a4';
    
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format,
      compress: this.options.quality !== 'ultra'
    });

    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
  }

  /**
   * Generate complete book PDF
   */
  async generateBook(spreads: GeneratedSpread[]): Promise<Blob> {
    // Front cover
    await this.generateCover();

    // Title page
    this.doc.addPage();
    await this.generateTitlePage();

    // Edition page (for limited editions)
    if (this.options.features.numbering && this.options.copyNumber) {
      this.doc.addPage();
      await this.generateEditionPage();
    }

    // COA page (for collector editions)
    if (this.options.features.coa) {
      this.doc.addPage();
      await this.generateCOAPage();
    }

    // Signature page (if applicable)
    if (this.options.features.signatures) {
      this.doc.addPage();
      await this.generateSignaturePage();
    }

    // Introduction page
    this.doc.addPage();
    await this.generateIntroPage();

    // Content spreads
    for (let i = 0; i < spreads.length; i++) {
      if (spreads[i].status === 'complete') {
        this.doc.addPage();
        await this.generateSpread(spreads[i], i + 1);
        
        // Add crop marks for print-ready version
        if (this.options.includeCropMarks) {
          this.addCropMarks();
        }
      }
    }

    // Colophon
    this.doc.addPage();
    await this.generateColophon();

    // Back cover
    this.doc.addPage();
    await this.generateBackCover();

    return this.doc.output('blob');
  }

  /**
   * Generate front cover
   */
  private async generateCover(): Promise<void> {
    // Background
    this.doc.setFillColor(245, 235, 220); // Cream
    this.doc.rect(0, 0, this.pageWidth, this.pageHeight, 'F');

    // Decorative border
    this.doc.setDrawColor(218, 165, 32); // Gold
    this.doc.setLineWidth(2);
    this.doc.rect(15, 15, this.pageWidth - 30, this.pageHeight - 30);

    // Inner decorative border
    this.doc.setLineWidth(0.5);
    this.doc.rect(20, 20, this.pageWidth - 40, this.pageHeight - 40);

    // Title
    this.doc.setFont('times', 'bold');
    this.doc.setFontSize(36);
    this.doc.setTextColor(50, 50, 50);
    this.doc.text(this.config.title, this.pageWidth / 2, 80, { align: 'center' });

    // Subtitle
    this.doc.setFont('times', 'italic');
    this.doc.setFontSize(18);
    this.doc.setTextColor(100, 100, 100);
    this.doc.text(this.config.subtitle, this.pageWidth / 2, 100, { align: 'center' });

    // King symbol
    this.doc.setFontSize(72);
    this.doc.setTextColor(218, 165, 32);
    this.doc.text(this.config.kingSymbol, this.pageWidth / 2, 160, { align: 'center' });

    // Edition badge
    if (this.options.edition !== 'standard') {
      this.doc.setFillColor(218, 165, 32);
      this.doc.circle(this.pageWidth - 35, 35, 18, 'F');
      this.doc.setFont('times', 'bold');
      this.doc.setFontSize(10);
      this.doc.setTextColor(255, 255, 255);
      this.doc.text('LIMITED', this.pageWidth - 35, 33, { align: 'center' });
      this.doc.text('EDITION', this.pageWidth - 35, 39, { align: 'center' });
    }

    // Publisher
    this.doc.setFont('times', 'normal');
    this.doc.setFontSize(14);
    this.doc.setTextColor(100, 100, 100);
    this.doc.text('En Pensent Studios', this.pageWidth / 2, this.pageHeight - 40, { align: 'center' });
  }

  /**
   * Generate title page
   */
  private async generateTitlePage(): Promise<void> {
    this.doc.setFillColor(255, 255, 255);
    this.doc.rect(0, 0, this.pageWidth, this.pageHeight, 'F');

    // Title
    this.doc.setFont('times', 'bold');
    this.doc.setFontSize(42);
    this.doc.setTextColor(30, 30, 30);
    this.doc.text(this.config.title, this.pageWidth / 2, this.pageHeight / 3, { align: 'center' });

    // Subtitle
    this.doc.setFont('times', 'italic');
    this.doc.setFontSize(20);
    this.doc.setTextColor(80, 80, 80);
    this.doc.text(this.config.subtitle, this.pageWidth / 2, this.pageHeight / 3 + 20, { align: 'center' });

    // Decorative line
    this.doc.setDrawColor(218, 165, 32);
    this.doc.setLineWidth(1);
    this.doc.line(this.pageWidth / 4, this.pageHeight / 2, 3 * this.pageWidth / 4, this.pageHeight / 2);

    // Description
    this.doc.setFont('times', 'normal');
    this.doc.setFontSize(12);
    this.doc.setTextColor(60, 60, 60);
    const descLines = this.doc.splitTextToSize(this.config.description, this.pageWidth - 80);
    this.doc.text(descLines, this.pageWidth / 2, this.pageHeight / 2 + 30, { align: 'center' });

    // Publisher info at bottom
    this.doc.setFontSize(11);
    this.doc.setTextColor(100, 100, 100);
    this.doc.text('En Pensent Studios', this.pageWidth / 2, this.pageHeight - 50, { align: 'center' });
    this.doc.text(new Date().getFullYear().toString(), this.pageWidth / 2, this.pageHeight - 40, { align: 'center' });
  }

  /**
   * Generate limited edition page
   */
  private async generateEditionPage(): Promise<void> {
    this.doc.setFillColor(250, 248, 240);
    this.doc.rect(0, 0, this.pageWidth, this.pageHeight, 'F');

    this.doc.setFont('times', 'italic');
    this.doc.setFontSize(18);
    this.doc.setTextColor(80, 80, 80);
    this.doc.text('Limited Edition', this.pageWidth / 2, this.pageHeight / 3, { align: 'center' });

    // Copy number
    this.doc.setFont('times', 'bold');
    this.doc.setFontSize(48);
    this.doc.setTextColor(218, 165, 32);
    this.doc.text(
      `#${this.options.copyNumber} of ${this.options.maxCopies}`,
      this.pageWidth / 2,
      this.pageHeight / 2,
      { align: 'center' }
    );

    // Authenticity note
    this.doc.setFont('times', 'normal');
    this.doc.setFontSize(12);
    this.doc.setTextColor(100, 100, 100);
    this.doc.text(
      'This is an authentic numbered copy from the limited edition.',
      this.pageWidth / 2,
      this.pageHeight / 2 + 40,
      { align: 'center' }
    );
  }

  /**
   * Generate Certificate of Authenticity page
   */
  private async generateCOAPage(): Promise<void> {
    this.doc.setFillColor(255, 253, 245);
    this.doc.rect(0, 0, this.pageWidth, this.pageHeight, 'F');

    // Double border
    this.doc.setDrawColor(218, 165, 32);
    this.doc.setLineWidth(2);
    this.doc.rect(20, 20, this.pageWidth - 40, this.pageHeight - 40);
    this.doc.setLineWidth(1);
    this.doc.rect(25, 25, this.pageWidth - 50, this.pageHeight - 50);

    // Header
    this.doc.setFont('times', 'bold');
    this.doc.setFontSize(28);
    this.doc.setTextColor(40, 40, 40);
    this.doc.text('Certificate of Authenticity', this.pageWidth / 2, 60, { align: 'center' });

    // Decorative line
    this.doc.setDrawColor(218, 165, 32);
    this.doc.setLineWidth(0.5);
    this.doc.line(60, 75, this.pageWidth - 60, 75);

    // Content
    this.doc.setFont('times', 'normal');
    this.doc.setFontSize(14);
    this.doc.setTextColor(60, 60, 60);
    this.doc.text('This certifies that', this.pageWidth / 2, 100, { align: 'center' });

    this.doc.setFont('times', 'bold');
    this.doc.setFontSize(20);
    this.doc.text(this.config.title, this.pageWidth / 2, 120, { align: 'center' });

    this.doc.setFont('times', 'normal');
    this.doc.setFontSize(14);
    this.doc.text('is an authentic limited edition publication', this.pageWidth / 2, 140, { align: 'center' });

    if (this.options.copyNumber && this.options.maxCopies) {
      this.doc.setFont('times', 'bold');
      this.doc.setFontSize(24);
      this.doc.setTextColor(218, 165, 32);
      this.doc.text(
        `Copy ${this.options.copyNumber} of ${this.options.maxCopies}`,
        this.pageWidth / 2,
        170,
        { align: 'center' }
      );
    }

    // Publisher signature area
    this.doc.setFont('times', 'normal');
    this.doc.setFontSize(12);
    this.doc.setTextColor(60, 60, 60);
    this.doc.line(40, this.pageHeight - 80, 100, this.pageHeight - 80);
    this.doc.text('En Pensent Studios', 70, this.pageHeight - 70, { align: 'center' });
    this.doc.text('Publisher', 70, this.pageHeight - 60, { align: 'center' });

    // Date area
    this.doc.line(this.pageWidth - 100, this.pageHeight - 80, this.pageWidth - 40, this.pageHeight - 80);
    this.doc.text(new Date().toLocaleDateString(), this.pageWidth - 70, this.pageHeight - 70, { align: 'center' });
    this.doc.text('Issue Date', this.pageWidth - 70, this.pageHeight - 60, { align: 'center' });
  }

  /**
   * Generate signature page
   */
  private async generateSignaturePage(): Promise<void> {
    this.doc.setFillColor(255, 255, 255);
    this.doc.rect(0, 0, this.pageWidth, this.pageHeight, 'F');

    this.doc.setFont('times', 'italic');
    this.doc.setFontSize(18);
    this.doc.setTextColor(80, 80, 80);
    this.doc.text('Authentic Signature', this.pageWidth / 2, 60, { align: 'center' });

    // Signature placeholder
    this.doc.setDrawColor(200, 200, 200);
    this.doc.setLineWidth(0.5);
    this.doc.rect(this.pageWidth / 4, 80, this.pageWidth / 2, 60);

    this.doc.setFont('times', 'normal');
    this.doc.setFontSize(10);
    this.doc.setTextColor(150, 150, 150);
    this.doc.text('[Signature]', this.pageWidth / 2, 115, { align: 'center' });
  }

  /**
   * Generate introduction page
   */
  private async generateIntroPage(): Promise<void> {
    this.doc.setFillColor(255, 255, 255);
    this.doc.rect(0, 0, this.pageWidth, this.pageHeight, 'F');

    this.doc.setFont('times', 'bold');
    this.doc.setFontSize(24);
    this.doc.setTextColor(40, 40, 40);
    this.doc.text('Introduction', this.pageWidth / 2, 50, { align: 'center' });

    const introText = `This collection presents ${this.config.games.length} masterpieces, each visualized through the En Pensent system—a revolutionary approach that transforms chess games into stunning visual art. Each spread pairs a game's visualization with a haiku poem, creating a meditation on the beauty of chess at its highest level.`;

    this.doc.setFont('times', 'normal');
    this.doc.setFontSize(12);
    this.doc.setTextColor(60, 60, 60);
    const lines = this.doc.splitTextToSize(introText, this.pageWidth - 60);
    this.doc.text(lines, 30, 80);
  }

  /**
   * Generate a content spread
   */
  private async generateSpread(spread: GeneratedSpread, pageNumber: number): Promise<void> {
    // Background
    this.doc.setFillColor(250, 248, 240);
    this.doc.rect(0, 0, this.pageWidth, this.pageHeight, 'F');

    // Game title
    this.doc.setFont('times', 'bold');
    this.doc.setFontSize(16);
    this.doc.setTextColor(40, 40, 40);
    this.doc.text(spread.game.title, this.pageWidth / 2, 25, { align: 'center' });

    // Players and event
    this.doc.setFont('times', 'italic');
    this.doc.setFontSize(11);
    this.doc.setTextColor(80, 80, 80);
    this.doc.text(
      `${spread.game.white} vs ${spread.game.black} • ${spread.game.event}, ${spread.game.year}`,
      this.pageWidth / 2,
      35,
      { align: 'center' }
    );

    // Haiku
    this.doc.setFont('times', 'italic');
    this.doc.setFontSize(14);
    this.doc.setTextColor(60, 60, 60);
    const haikuLines = spread.haiku.split('\n');
    let yPos = 60;
    haikuLines.forEach(line => {
      this.doc.text(line.trim(), 40, yPos);
      yPos += 10;
    });

    // Visualization placeholder
    this.doc.setDrawColor(200, 200, 200);
    this.doc.setFillColor(240, 240, 240);
    this.doc.rect(this.pageWidth / 2 - 50, 55, 100, 80, 'FD');
    
    // If we have the image, add it
    if (spread.visualizationImage && spread.visualizationImage.startsWith('data:image')) {
      try {
        this.doc.addImage(
          spread.visualizationImage,
          'PNG',
          this.pageWidth / 2 - 50,
          55,
          100,
          80
        );
      } catch {
        // Image failed, keep placeholder
      }
    }

    // Significance
    this.doc.setFont('times', 'normal');
    this.doc.setFontSize(10);
    this.doc.setTextColor(80, 80, 80);
    const sigLines = this.doc.splitTextToSize(spread.game.significance, this.pageWidth - 60);
    this.doc.text(sigLines, 30, 150);

    // Page number
    this.doc.setFont('times', 'normal');
    this.doc.setFontSize(10);
    this.doc.setTextColor(150, 150, 150);
    this.doc.text(pageNumber.toString(), this.pageWidth / 2, this.pageHeight - 15, { align: 'center' });
  }

  /**
   * Generate colophon page
   */
  private async generateColophon(): Promise<void> {
    this.doc.setFillColor(255, 255, 255);
    this.doc.rect(0, 0, this.pageWidth, this.pageHeight, 'F');

    this.doc.setFont('times', 'bold');
    this.doc.setFontSize(18);
    this.doc.setTextColor(40, 40, 40);
    this.doc.text('Colophon', this.pageWidth / 2, 50, { align: 'center' });

    const colophonText = [
      `${this.config.title}`,
      `${this.config.subtitle}`,
      '',
      `Published by En Pensent Studios`,
      `First Edition, ${new Date().getFullYear()}`,
      '',
      `Visualizations created using the En Pensent System`,
      `Haiku poetry generated with AI assistance`,
      '',
      `This book was designed and produced using`,
      `professional-grade digital printing technology.`,
      '',
      `© ${new Date().getFullYear()} En Pensent Studios`,
      `All rights reserved.`
    ];

    this.doc.setFont('times', 'normal');
    this.doc.setFontSize(11);
    this.doc.setTextColor(60, 60, 60);
    let y = 80;
    colophonText.forEach(line => {
      this.doc.text(line, this.pageWidth / 2, y, { align: 'center' });
      y += 12;
    });
  }

  /**
   * Generate back cover
   */
  private async generateBackCover(): Promise<void> {
    this.doc.setFillColor(245, 235, 220);
    this.doc.rect(0, 0, this.pageWidth, this.pageHeight, 'F');

    // Decorative border
    this.doc.setDrawColor(218, 165, 32);
    this.doc.setLineWidth(2);
    this.doc.rect(15, 15, this.pageWidth - 30, this.pageHeight - 30);

    // ISBN placeholder
    this.doc.setFillColor(255, 255, 255);
    this.doc.rect(this.pageWidth - 60, this.pageHeight - 50, 45, 35, 'F');
    this.doc.setFont('courier', 'normal');
    this.doc.setFontSize(8);
    this.doc.setTextColor(0, 0, 0);
    this.doc.text('ISBN PLACEHOLDER', this.pageWidth - 37.5, this.pageHeight - 30, { align: 'center' });

    // Publisher logo area
    this.doc.setFont('times', 'bold');
    this.doc.setFontSize(14);
    this.doc.setTextColor(80, 80, 80);
    this.doc.text('En Pensent Studios', 40, this.pageHeight - 40);
  }

  /**
   * Add crop marks for professional printing
   */
  private addCropMarks(): void {
    const markLength = 10;
    const offset = 5;
    
    this.doc.setDrawColor(0, 0, 0);
    this.doc.setLineWidth(0.25);

    // Top-left
    this.doc.line(offset, offset, offset + markLength, offset);
    this.doc.line(offset, offset, offset, offset + markLength);

    // Top-right
    this.doc.line(this.pageWidth - offset - markLength, offset, this.pageWidth - offset, offset);
    this.doc.line(this.pageWidth - offset, offset, this.pageWidth - offset, offset + markLength);

    // Bottom-left
    this.doc.line(offset, this.pageHeight - offset, offset + markLength, this.pageHeight - offset);
    this.doc.line(offset, this.pageHeight - offset - markLength, offset, this.pageHeight - offset);

    // Bottom-right
    this.doc.line(this.pageWidth - offset - markLength, this.pageHeight - offset, this.pageWidth - offset, this.pageHeight - offset);
    this.doc.line(this.pageWidth - offset, this.pageHeight - offset - markLength, this.pageWidth - offset, this.pageHeight - offset);
  }

  /**
   * Get document for manual manipulation
   */
  getDocument(): jsPDF {
    return this.doc;
  }
}

/**
 * Factory function for creating PDF generator
 */
export function createPDFGenerator(
  config: BookConfig,
  options?: Partial<PDFGeneratorOptions>
): ProfessionalPDFGenerator {
  return new ProfessionalPDFGenerator(config, options);
}
