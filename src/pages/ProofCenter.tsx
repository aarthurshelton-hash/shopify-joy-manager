/**
 * Proof Center Page
 * 
 * The evidence dashboard for the En Pensent universal theory.
 */

import React from 'react';
import { UnifiedProofDashboard } from '@/components/proof';

export default function ProofCenterPage() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <UnifiedProofDashboard />
    </div>
  );
}
