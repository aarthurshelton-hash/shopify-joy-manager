import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Gift,
  Heart,
  Loader2,
  AlertCircle,
  Check,
  User,
  Search,
  Info,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface GiftVisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  visualizationId: string;
  visualizationTitle: string;
  currentValueCents: number;
  onSuccess?: () => void;
}

interface PremiumMember {
  user_id: string;
  display_name: string | null;
}

const GiftVisionModal: React.FC<GiftVisionModalProps> = ({
  isOpen,
  onClose,
  visualizationId,
  visualizationTitle,
  currentValueCents,
  onSuccess,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PremiumMember[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<PremiumMember | null>(null);
  const [giftMessage, setGiftMessage] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [giftComplete, setGiftComplete] = useState(false);

  const formatValue = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  // Search for premium members
  const searchMembers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Search profiles of premium users (exclude self)
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .neq('user_id', user.id)
        .ilike('display_name', `%${query}%`)
        .limit(10);

      if (error) throw error;

      // Filter to only premium members
      const premiumMembers: PremiumMember[] = [];
      for (const profile of profiles || []) {
        const { data: isPremium } = await supabase
          .rpc('is_premium_user', { p_user_id: profile.user_id });
        
        if (isPremium) {
          premiumMembers.push(profile);
        }
      }

      setSearchResults(premiumMembers);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchMembers(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleGift = async () => {
    if (!selectedRecipient) {
      toast.error('Please select a recipient');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check transfer limits
      const { data: canTransfer } = await supabase
        .rpc('can_transfer_visualization', { p_visualization_id: visualizationId });

      if (!canTransfer) {
        toast.error('Transfer limit reached', {
          description: 'This vision has reached its maximum transfer limit',
        });
        return;
      }

      // Transfer ownership (no fees for gifts)
      const { error: transferError } = await supabase
        .from('saved_visualizations')
        .update({ user_id: selectedRecipient.user_id })
        .eq('id', visualizationId);

      if (transferError) throw transferError;

      // Record the transfer
      const { error: recordError } = await supabase
        .from('visualization_transfers')
        .insert({
          visualization_id: visualizationId,
          from_user_id: user.id,
          to_user_id: selectedRecipient.user_id,
          transfer_type: 'gift',
        });

      if (recordError) throw recordError;

      // Record the interaction for scoring
      await supabase.rpc('record_vision_interaction', {
        p_visualization_id: visualizationId,
        p_user_id: selectedRecipient.user_id,
        p_interaction_type: 'gift_received',
        p_value_cents: currentValueCents,
      });

      setGiftComplete(true);
      toast.success('Vision gifted!', {
        description: `${visualizationTitle} has been sent to ${selectedRecipient.display_name || 'Member'}`,
        icon: <Gift className="h-4 w-4" />,
      });

      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2000);

    } catch (error) {
      console.error('Gift error:', error);
      toast.error('Failed to gift vision', {
        description: (error as Error).message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetModal = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedRecipient(null);
    setGiftMessage('');
    setGiftComplete(false);
  };

  useEffect(() => {
    if (!isOpen) resetModal();
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-green-500" />
            Gift Vision
          </DialogTitle>
          <DialogDescription>
            Transfer "{visualizationTitle}" to another premium member
          </DialogDescription>
        </DialogHeader>

        {giftComplete ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-8 text-center space-y-4"
          >
            <div className="mx-auto w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
              <Heart className="h-8 w-8 text-green-500" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Gift Sent!</h3>
              <p className="text-sm text-muted-foreground">
                {selectedRecipient?.display_name || 'The recipient'} now owns this vision
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-4 py-2">
            {/* Important Notice */}
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 space-y-2">
              <div className="flex items-start gap-2 text-sm">
                <Info className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium text-green-600">No fees for gifts</p>
                  <p className="text-muted-foreground text-xs">
                    The recipient receives the full value of this vision. You will no longer own this vision or its accrued value.
                  </p>
                </div>
              </div>
            </div>

            {/* Current Value Display */}
            {currentValueCents > 0 && (
              <div className="flex items-center justify-between text-sm bg-muted/50 p-3 rounded-lg">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Current Vision Value
                </span>
                <Badge variant="secondary" className="font-mono">
                  {formatValue(currentValueCents)}
                </Badge>
              </div>
            )}

            <Separator />

            {/* Recipient Search */}
            <div className="space-y-2">
              <Label>Find Premium Member</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by display name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Only premium members can receive gifted visions
              </p>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="max-h-32 overflow-y-auto space-y-1 border rounded-lg p-1">
                {searchResults.map((member) => (
                  <button
                    key={member.user_id}
                    onClick={() => {
                      setSelectedRecipient(member);
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    className="w-full flex items-center gap-2 p-2 rounded hover:bg-muted transition-colors text-left"
                  >
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{member.display_name || 'Unnamed Member'}</span>
                    <Badge variant="outline" className="ml-auto text-xs">Premium</Badge>
                  </button>
                ))}
              </div>
            )}

            {searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
              <p className="text-sm text-muted-foreground text-center py-2">
                No premium members found
              </p>
            )}

            {/* Selected Recipient */}
            {selectedRecipient && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg"
              >
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{selectedRecipient.display_name || 'Member'}</p>
                  <p className="text-xs text-muted-foreground">Premium Member</p>
                </div>
                <Check className="h-5 w-5 text-green-500" />
              </motion.div>
            )}

            {/* Gift Message */}
            <div className="space-y-2">
              <Label>Gift Message (optional)</Label>
              <Textarea
                placeholder="Add a personal message..."
                value={giftMessage}
                onChange={(e) => setGiftMessage(e.target.value)}
                rows={2}
                className="resize-none"
              />
            </div>

            {/* Warning */}
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <p>
                This action cannot be undone. You will lose ownership and all accrued value of this vision.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleGift}
                disabled={!selectedRecipient || isSubmitting}
                className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Gift className="h-4 w-4" />
                    Send Gift
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GiftVisionModal;
