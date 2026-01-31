/**
 * Collector Edition System
 * Manages limited editions, numbering, authentication, and certificates
 */

import { BookType } from './bookConfig';

export interface CollectorEdition {
  id: string;
  bookType: BookType;
  editionName: string;
  maxCopies: number;
  currentNumber: number;
  isSoldOut: boolean;
  coaTemplate: string;
  signatureImage?: string;
  releaseDate?: Date;
  specialFeatures: string[];
}

export interface CertificateOfAuthenticity {
  editionId: string;
  bookType: BookType;
  editionName: string;
  copyNumber: number;
  maxCopies: number;
  issuedDate: string;
  authenticityCode: string;
  ownerName?: string;
  signatureUrl?: string;
}

export interface SignatureConfig {
  playerId: string;
  playerName: string;
  signatureImage: string;
  signedDate: Date;
  location: string;
  event?: string;
}

/**
 * Generate a cryptographic authenticity code
 */
export function generateAuthCode(editionId: string, copyNumber: number): string {
  const timestamp = Date.now();
  const payload = `${editionId}-${copyNumber}-${timestamp}`;
  
  // Simple hash for demonstration - in production use crypto.subtle
  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    const char = payload.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return Math.abs(hash).toString(16).toUpperCase().padStart(12, '0').slice(0, 12);
}

/**
 * Create a Certificate of Authenticity
 */
export function createCOA(
  edition: CollectorEdition,
  copyNumber: number,
  ownerName?: string
): CertificateOfAuthenticity {
  return {
    editionId: edition.id,
    bookType: edition.bookType,
    editionName: edition.editionName,
    copyNumber,
    maxCopies: edition.maxCopies,
    issuedDate: new Date().toISOString(),
    authenticityCode: generateAuthCode(edition.id, copyNumber),
    ownerName,
    signatureUrl: edition.signatureImage
  };
}

/**
 * Verify authenticity code
 */
export function verifyCOA(coa: CertificateOfAuthenticity): boolean {
  const expectedCode = generateAuthCode(coa.editionId, coa.copyNumber);
  // In production, this would verify against a database
  return coa.authenticityCode.length === 12;
}

/**
 * Collector Edition Manager
 */
export class CollectorEditionManager {
  private editions: Map<string, CollectorEdition> = new Map();

  /**
   * Create a new limited edition
   */
  createLimitedEdition(
    bookType: BookType,
    editionName: string,
    maxCopies: number,
    specialFeatures: string[] = []
  ): CollectorEdition {
    const id = `${bookType}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    
    const edition: CollectorEdition = {
      id,
      bookType,
      editionName,
      maxCopies,
      currentNumber: 1,
      isSoldOut: false,
      coaTemplate: this.generateCOATemplate(bookType, editionName),
      releaseDate: new Date(),
      specialFeatures
    };

    this.editions.set(id, edition);
    return edition;
  }

  /**
   * Get the next available copy number
   */
  getNextNumber(editionId: string): number | null {
    const edition = this.editions.get(editionId);
    if (!edition || edition.isSoldOut) return null;

    const nextNumber = edition.currentNumber;
    
    edition.currentNumber++;
    if (edition.currentNumber > edition.maxCopies) {
      edition.isSoldOut = true;
    }

    return nextNumber;
  }

  /**
   * Check if edition is available
   */
  isAvailable(editionId: string): boolean {
    const edition = this.editions.get(editionId);
    return edition ? !edition.isSoldOut : false;
  }

  /**
   * Get remaining copies
   */
  getRemainingCopies(editionId: string): number {
    const edition = this.editions.get(editionId);
    if (!edition) return 0;
    return Math.max(0, edition.maxCopies - edition.currentNumber + 1);
  }

  /**
   * Generate COA template HTML
   */
  private generateCOATemplate(bookType: BookType, editionName: string): string {
    return `
      <div class="coa-template bg-cream p-8 border-4 border-double border-amber-600">
        <div class="text-center">
          <h1 class="text-3xl font-serif mb-4">Certificate of Authenticity</h1>
          <h2 class="text-xl font-medium mb-6">${editionName}</h2>
          <p class="mb-4">This certifies that copy</p>
          <div class="text-4xl font-bold text-amber-600 mb-4">#[COPY_NUMBER] of [MAX_COPIES]</div>
          <p class="mb-6">is an authentic limited edition from En Pensent Studios</p>
          <div class="font-mono text-sm bg-gray-100 p-2 rounded mb-6">
            Authenticity Code: [AUTH_CODE]
          </div>
          <div class="flex justify-between items-center border-t pt-4">
            <div class="text-left">
              <div class="font-bold">En Pensent Studios</div>
              <div class="text-sm text-gray-600">Publisher</div>
            </div>
            <div class="text-right">
              <div class="font-bold">[ISSUED_DATE]</div>
              <div class="text-sm text-gray-600">Issue Date</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

/**
 * Signature Manager
 */
export class SignatureManager {
  private signatures: Map<string, SignatureConfig> = new Map();

  /**
   * Add a player signature
   */
  addSignature(config: SignatureConfig): void {
    this.signatures.set(config.playerId, config);
  }

  /**
   * Get signature for a player
   */
  getSignature(playerId: string): SignatureConfig | undefined {
    return this.signatures.get(playerId);
  }

  /**
   * Check if signature exists
   */
  hasSignature(playerId: string): boolean {
    return this.signatures.has(playerId);
  }

  /**
   * Generate signature page HTML
   */
  generateSignaturePage(playerId: string, pageNumber: number): string | null {
    const signature = this.signatures.get(playerId);
    if (!signature) return null;

    return `
      <div class="signature-page bg-cream p-8 text-center">
        <div class="mb-6">
          <h2 class="text-2xl font-serif">Authentic Player Signature</h2>
          <p class="text-sm text-gray-600">Page ${pageNumber}</p>
        </div>
        <div class="border-2 border-amber-500 rounded-lg p-6 mb-6 inline-block">
          <img src="${signature.signatureImage}" alt="${signature.playerName} Signature" class="max-w-xs mx-auto" />
        </div>
        <div class="text-left max-w-sm mx-auto">
          <p><strong>Signed by:</strong> ${signature.playerName}</p>
          <p><strong>Date:</strong> ${signature.signedDate.toLocaleDateString()}</p>
          ${signature.event ? `<p><strong>Event:</strong> ${signature.event}</p>` : ''}
          <p><strong>Location:</strong> ${signature.location}</p>
        </div>
        <div class="mt-6 text-sm text-gray-500">
          <p>Verify this signature at: enpensent.com/verify/${playerId}</p>
        </div>
      </div>
    `;
  }
}

// Export singleton instances
export const collectorManager = new CollectorEditionManager();
export const signatureManager = new SignatureManager();
