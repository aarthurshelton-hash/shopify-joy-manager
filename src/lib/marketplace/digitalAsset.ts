/**
 * Digital Asset Management for Vision Marketplace
 * Provides cryptographic ownership proof and asset verification
 */

import { supabase } from '@/integrations/supabase/client';

export interface DigitalAsset {
  id: string;
  visualizationId: string;
  creatorId: string;
  currentOwnerId: string;
  mintedAt: Date;
  transferCount: number;
  ownershipProof: string;
  editionNumber: number;
  maxEditions: number;
  isFrozen: boolean;
  freezeReason?: string;
  metadata: {
    title?: string;
    attributes?: Record<string, unknown>;
  };
}

export interface OwnershipProof {
  assetId: string;
  ownerId: string;
  timestamp: number;
  nonce: string;
  signature: string;
}

export interface AssetTransferResult {
  success: boolean;
  error?: string;
  visualizationId?: string;
  remainingTransfers?: number;
}

/**
 * Generates a unique nonce for ownership proofs
 */
function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generates a SHA-256 hash of the payload
 */
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export class DigitalAssetManager {
  /**
   * Generates a cryptographic ownership proof for an asset
   */
  static async generateOwnershipProof(
    assetId: string,
    ownerId: string
  ): Promise<OwnershipProof> {
    const timestamp = Date.now();
    const nonce = generateNonce();
    
    const payload = JSON.stringify({
      assetId,
      ownerId,
      timestamp,
      nonce
    });
    
    const signature = await sha256(payload);
    
    return {
      assetId,
      ownerId,
      timestamp,
      nonce,
      signature
    };
  }

  /**
   * Verifies an ownership proof against claimed ownership
   */
  static async verifyOwnershipProof(
    proof: OwnershipProof,
    claimedOwnerId: string
  ): Promise<boolean> {
    // Verify the signature matches
    const payload = JSON.stringify({
      assetId: proof.assetId,
      ownerId: proof.ownerId,
      timestamp: proof.timestamp,
      nonce: proof.nonce
    });
    
    const expectedSignature = await sha256(payload);
    
    if (proof.signature !== expectedSignature) {
      return false;
    }
    
    // Verify owner matches
    if (proof.ownerId !== claimedOwnerId) {
      return false;
    }
    
    // Check proof age (max 24 hours for cached proofs)
    const proofAge = Date.now() - proof.timestamp;
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    if (proofAge > maxAge) {
      return false;
    }
    
    return true;
  }

  /**
   * Mints a new digital asset for a visualization
   */
  static async mintAsset(
    visualizationId: string,
    creatorId: string,
    maxEditions: number = 1
  ): Promise<{ success: boolean; assetId?: string; error?: string }> {
    try {
      const proof = await this.generateOwnershipProof(visualizationId, creatorId);
      
      const { data, error } = await supabase
        .from('digital_assets')
        .insert({
          visualization_id: visualizationId,
          creator_id: creatorId,
          current_owner_id: creatorId,
          ownership_proof: proof.signature,
          edition_number: 1,
          max_editions: Math.min(maxEditions, 100),
          metadata: {}
        })
        .select('id')
        .single();
      
      if (error) {
        console.error('[DigitalAssetManager] Mint failed:', error);
        return { success: false, error: error.message };
      }
      
      return { success: true, assetId: data.id };
    } catch (error) {
      console.error('[DigitalAssetManager] Mint error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Transfers ownership using the atomic database function
   */
  static async transferAsset(
    visualizationId: string,
    fromUserId: string,
    toUserId: string,
    transferType: 'marketplace' | 'gift' | 'claim' = 'marketplace'
  ): Promise<AssetTransferResult> {
    try {
      const { data, error } = await supabase.rpc('atomic_transfer_visualization', {
        p_visualization_id: visualizationId,
        p_from_user_id: fromUserId,
        p_to_user_id: toUserId,
        p_transfer_type: transferType
      });
      
      if (error) {
        console.error('[DigitalAssetManager] Transfer RPC error:', error);
        return { success: false, error: error.message };
      }
      
      const result = data as {
        success: boolean;
        error?: string;
        visualization_id?: string;
        remaining_transfers?: number;
      };
      
      if (!result.success) {
        return { success: false, error: result.error };
      }
      
      // Update ownership proof
      const newProof = await this.generateOwnershipProof(visualizationId, toUserId);
      
      await supabase
        .from('digital_assets')
        .update({
          ownership_proof: newProof.signature,
          updated_at: new Date().toISOString()
        })
        .eq('visualization_id', visualizationId);
      
      return {
        success: true,
        visualizationId: result.visualization_id,
        remainingTransfers: result.remaining_transfers
      };
    } catch (error) {
      console.error('[DigitalAssetManager] Transfer error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Checks if a visualization can be transferred (rate limit check)
   */
  static async canTransfer(visualizationId: string): Promise<{
    canTransfer: boolean;
    remainingTransfers: number;
    resetAt?: Date;
  }> {
    try {
      const { data, error } = await supabase.rpc('can_transfer_visualization', {
        p_visualization_id: visualizationId
      });
      
      if (error) {
        console.error('[DigitalAssetManager] Rate check error:', error);
        return { canTransfer: false, remainingTransfers: 0 };
      }
      
      const { data: remaining } = await supabase.rpc('get_remaining_transfers', {
        p_visualization_id: visualizationId
      });
      
      return {
        canTransfer: !!data,
        remainingTransfers: remaining ?? 0
      };
    } catch (error) {
      console.error('[DigitalAssetManager] Rate check error:', error);
      return { canTransfer: false, remainingTransfers: 0 };
    }
  }

  /**
   * Gets the digital asset for a visualization
   */
  static async getAsset(visualizationId: string): Promise<DigitalAsset | null> {
    try {
      const { data, error } = await supabase
        .from('digital_assets')
        .select('*')
        .eq('visualization_id', visualizationId)
        .single();
      
      if (error || !data) {
        return null;
      }
      
      return {
        id: data.id,
        visualizationId: data.visualization_id,
        creatorId: data.creator_id,
        currentOwnerId: data.current_owner_id,
        mintedAt: new Date(data.minted_at),
        transferCount: data.transfer_count,
        ownershipProof: data.ownership_proof,
        editionNumber: data.edition_number,
        maxEditions: data.max_editions,
        isFrozen: data.is_frozen,
        freezeReason: data.freeze_reason,
        metadata: data.metadata as DigitalAsset['metadata']
      };
    } catch (error) {
      console.error('[DigitalAssetManager] Get asset error:', error);
      return null;
    }
  }

  /**
   * Freezes an asset (admin only)
   */
  static async freezeAsset(
    visualizationId: string,
    reason: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('digital_assets')
        .update({
          is_frozen: true,
          freeze_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('visualization_id', visualizationId);
      
      return !error;
    } catch (error) {
      console.error('[DigitalAssetManager] Freeze error:', error);
      return false;
    }
  }
}

export default DigitalAssetManager;
