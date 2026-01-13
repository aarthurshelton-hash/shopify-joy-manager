/**
 * Privacy Toggle Component
 * 
 * Allows users to toggle their visions between public and private.
 * Private visions are only visible to the owner and admins.
 */

import React, { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Globe, Lock, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PrivacyToggleProps {
  visualizationId: string;
  isPrivate: boolean;
  onToggle?: (isPrivate: boolean) => void;
  disabled?: boolean;
  compact?: boolean;
}

const PrivacyToggle: React.FC<PrivacyToggleProps> = ({
  visualizationId,
  isPrivate,
  onToggle,
  disabled = false,
  compact = false,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentPrivacy, setCurrentPrivacy] = useState(isPrivate);

  const handleToggle = async (newValue: boolean) => {
    setIsUpdating(true);
    
    try {
      const { error } = await supabase
        .from('saved_visualizations')
        .update({ is_private: newValue })
        .eq('id', visualizationId);
      
      if (error) throw error;
      
      setCurrentPrivacy(newValue);
      onToggle?.(newValue);
      
      toast.success(newValue ? 'Vision is now private' : 'Vision is now public', {
        description: newValue 
          ? 'Only you can see this vision' 
          : 'Others can now browse this vision',
      });
    } catch (error) {
      console.error('Failed to update privacy:', error);
      toast.error('Failed to update privacy setting');
    } finally {
      setIsUpdating(false);
    }
  };

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => !disabled && !isUpdating && handleToggle(!currentPrivacy)}
              disabled={disabled || isUpdating}
              className={`
                inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs
                transition-colors
                ${currentPrivacy 
                  ? 'bg-muted text-muted-foreground' 
                  : 'bg-primary/10 text-primary'
                }
                ${disabled || isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}
              `}
            >
              {isUpdating ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : currentPrivacy ? (
                <Lock className="h-3 w-3" />
              ) : (
                <Globe className="h-3 w-3" />
              )}
              {currentPrivacy ? 'Private' : 'Public'}
            </button>
          </TooltipTrigger>
          <TooltipContent>
            {currentPrivacy 
              ? 'Only you can see this vision. Click to make public.' 
              : 'Anyone can browse this vision. Click to make private.'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
      <div className="flex-1 space-y-0.5">
        <Label className="text-sm font-medium flex items-center gap-2">
          {currentPrivacy ? (
            <>
              <Lock className="h-4 w-4 text-muted-foreground" />
              Private Vision
            </>
          ) : (
            <>
              <Globe className="h-4 w-4 text-primary" />
              Public Vision
            </>
          )}
        </Label>
        <p className="text-xs text-muted-foreground">
          {currentPrivacy 
            ? 'Only you and admins can view this vision' 
            : 'Others can browse and make offers on this vision'}
        </p>
      </div>
      <Switch
        checked={!currentPrivacy}
        onCheckedChange={(checked) => handleToggle(!checked)}
        disabled={disabled || isUpdating}
      />
      {isUpdating && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
    </div>
  );
};

export default PrivacyToggle;
