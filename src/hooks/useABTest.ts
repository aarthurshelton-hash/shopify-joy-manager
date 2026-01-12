import { useEffect, useRef } from 'react';
import { 
  getMembershipCardVariants, 
  recordABEvent, 
  getAllAssignedVariants,
  MEMBERSHIP_CARD_TESTS,
  type MembershipCardVariants 
} from '@/lib/analytics/abTesting';

export function useABTest() {
  const variants = getMembershipCardVariants();
  const hasRecordedImpression = useRef(false);

  // Record impressions for all active tests
  const recordImpressions = async () => {
    if (hasRecordedImpression.current) return;
    hasRecordedImpression.current = true;

    const assignedVariants = getAllAssignedVariants();
    
    for (const [testId, variant] of Object.entries(assignedVariants)) {
      await recordABEvent(testId, variant, 'impression');
    }
  };

  // Record conversion for all active tests
  const recordConversions = async () => {
    const assignedVariants = getAllAssignedVariants();
    
    for (const [testId, variant] of Object.entries(assignedVariants)) {
      await recordABEvent(testId, variant, 'conversion');
    }
  };

  return {
    variants,
    recordImpressions,
    recordConversions,
    tests: MEMBERSHIP_CARD_TESTS,
  };
}

export type { MembershipCardVariants };
