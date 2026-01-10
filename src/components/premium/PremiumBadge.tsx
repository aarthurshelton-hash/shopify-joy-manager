import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Crown } from 'lucide-react';

interface PremiumBadgeProps {
  showText?: boolean;
  size?: 'sm' | 'md';
}

const PremiumBadge: React.FC<PremiumBadgeProps> = ({ 
  showText = true,
  size = 'sm' 
}) => {
  const { isPremium } = useAuth();

  if (!isPremium) return null;

  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';

  return (
    <Badge 
      variant="secondary" 
      className="bg-gradient-to-r from-primary/20 to-primary/10 text-primary border-primary/30 gap-1"
    >
      <Crown className={iconSize} />
      {showText && <span>Premium</span>}
    </Badge>
  );
};

export default PremiumBadge;
