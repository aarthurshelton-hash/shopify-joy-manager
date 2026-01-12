import React from 'react';
import { VisionaryMembershipCard } from './VisionaryMembershipCard';

interface PremiumUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthRequired?: () => void;
  trigger?: 'download' | 'save' | 'general' | 'gif' | 'analytics';
}

// This component now routes through VisionaryMembershipCard for a consistent premium funnel
const PremiumUpgradeModal: React.FC<PremiumUpgradeModalProps> = ({
  isOpen,
  onClose,
  onAuthRequired,
  trigger = 'general',
}) => {
  return (
    <VisionaryMembershipCard
      isOpen={isOpen}
      onClose={onClose}
      onAuthRequired={onAuthRequired}
      trigger={trigger}
    />
  );
};

export default PremiumUpgradeModal;
