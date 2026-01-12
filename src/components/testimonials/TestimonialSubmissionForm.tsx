import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Star, Send, Sparkles, CheckCircle, AlertCircle, Loader2, PenLine, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { z } from 'zod';

// Validation schema
const testimonialSchema = z.object({
  quote: z.string()
    .trim()
    .min(20, 'Your story should be at least 20 characters')
    .max(500, 'Please keep your story under 500 characters'),
  displayName: z.string()
    .trim()
    .min(2, 'Name should be at least 2 characters')
    .max(50, 'Name should be under 50 characters'),
  roleTitle: z.string()
    .trim()
    .min(3, 'Role should be at least 3 characters')
    .max(100, 'Role should be under 100 characters'),
  rating: z.number().min(1).max(5)
});

interface TestimonialSubmissionFormProps {
  isPremium: boolean;
  onSubmitSuccess?: () => void;
}

export const TestimonialSubmissionForm = ({ 
  isPremium, 
  onSubmitSuccess 
}: TestimonialSubmissionFormProps) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasSubmittedThisYear, setHasSubmittedThisYear] = useState(false);
  const [lastSubmissionDate, setLastSubmissionDate] = useState<Date | null>(null);
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(true);
  
  const [quote, setQuote] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [rating, setRating] = useState(5);
  const [hoveredStar, setHoveredStar] = useState(0);

  // Check if user has already submitted a testimonial this year
  useEffect(() => {
    const checkYearlyLimit = async () => {
      if (!user) {
        setIsCheckingEligibility(false);
        return;
      }
      
      try {
        const currentYear = new Date().getFullYear();
        const yearStart = `${currentYear}-01-01T00:00:00Z`;
        const yearEnd = `${currentYear}-12-31T23:59:59Z`;
        
        const { data, error } = await supabase
          .from('testimonials')
          .select('created_at')
          .eq('user_id', user.id)
          .gte('created_at', yearStart)
          .lte('created_at', yearEnd)
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          setHasSubmittedThisYear(true);
          setLastSubmissionDate(new Date(data[0].created_at));
        } else {
          setHasSubmittedThisYear(false);
          setLastSubmissionDate(null);
        }
      } catch (error) {
        console.error('Error checking testimonial eligibility:', error);
      } finally {
        setIsCheckingEligibility(false);
      }
    };
    
    checkYearlyLimit();
  }, [user]);

  const resetForm = () => {
    setQuote('');
    setDisplayName('');
    setRoleTitle('');
    setRating(5);
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please sign in to submit your story');
      return;
    }

    if (!isPremium) {
      toast.error('Premium membership required to submit testimonials');
      return;
    }

    if (hasSubmittedThisYear) {
      toast.error('You can only submit one testimonial per year');
      return;
    }

    // Validate
    const result = testimonialSchema.safeParse({
      quote,
      displayName,
      roleTitle,
      rating
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('testimonials')
        .insert({
          user_id: user.id,
          quote: result.data.quote,
          display_name: result.data.displayName,
          role_title: result.data.roleTitle,
          rating: result.data.rating
        });

      if (error) throw error;

      setIsSubmitted(true);
      toast.success('Thank you! Your story has been submitted for review.');
      
      setTimeout(() => {
        resetForm();
        setIsSubmitted(false);
        setIsOpen(false);
        onSubmitSuccess?.();
      }, 3000);

    } catch (error: any) {
      console.error('Error submitting testimonial:', error);
      toast.error(error.message || 'Failed to submit your story. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isPremium) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative p-6 rounded-xl border border-dashed border-border/50 bg-card/30 text-center"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-xl" />
        <div className="relative space-y-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Crown className="h-6 w-6 text-primary/50" />
          </div>
          <h3 className="font-display text-sm uppercase tracking-wider text-muted-foreground">
            Share Your Story
          </h3>
          <p className="text-xs text-muted-foreground/70 font-serif max-w-xs mx-auto">
            Premium members can submit one testimonial per year to be featured on this page
          </p>
        </div>
      </motion.div>
    );
  }

  if (isCheckingEligibility) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative p-6 rounded-xl border border-dashed border-border/50 bg-card/30 text-center"
      >
        <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
        <p className="text-xs text-muted-foreground mt-2">Checking eligibility...</p>
      </motion.div>
    );
  }

  if (hasSubmittedThisYear) {
    const nextEligibleDate = new Date(new Date().getFullYear() + 1, 0, 1);
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative p-6 rounded-xl border border-primary/20 bg-primary/5 text-center"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-xl" />
        <div className="relative space-y-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <CheckCircle className="h-6 w-6 text-primary" />
          </div>
          <h3 className="font-display text-sm uppercase tracking-wider text-foreground">
            Thank You for Sharing!
          </h3>
          <p className="text-xs text-muted-foreground font-serif max-w-xs mx-auto">
            You submitted a testimonial {lastSubmissionDate ? `on ${lastSubmissionDate.toLocaleDateString()}` : 'this year'}.
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>Next eligible: {nextEligibleDate.toLocaleDateString()}</span>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      <AnimatePresence mode="wait">
        {!isOpen ? (
          <motion.button
            key="trigger"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="group w-full p-6 rounded-xl border-2 border-dashed border-primary/30 hover:border-primary/50 bg-gradient-to-br from-primary/5 to-transparent transition-all duration-300"
          >
            <div className="flex items-center justify-center gap-4">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
                className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors"
              >
                <PenLine className="h-5 w-5 text-primary" />
              </motion.div>
              <div className="text-left">
                <h3 className="font-display text-sm uppercase tracking-wider text-foreground group-hover:text-primary transition-colors">
                  Share Your Story
                </h3>
                <p className="text-xs text-muted-foreground font-serif">
                  Tell us how En Pensent has impacted your chess journey
                </p>
              </div>
              <motion.div
                className="ml-auto"
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Sparkles className="h-5 w-5 text-primary/50 group-hover:text-primary transition-colors" />
              </motion.div>
            </div>
          </motion.button>
        ) : isSubmitted ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="p-8 rounded-xl border border-green-500/30 bg-green-500/5 text-center space-y-4"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
            >
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            </motion.div>
            <h3 className="font-display text-lg uppercase tracking-wider text-foreground">
              Story Submitted!
            </h3>
            <p className="text-sm text-muted-foreground font-serif">
              Thank you for sharing. Your testimonial is under review and may be featured soon.
            </p>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onSubmit={handleSubmit}
            className="p-6 rounded-xl border border-primary/30 bg-gradient-to-br from-primary/5 via-card/50 to-transparent space-y-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Crown className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-display text-sm uppercase tracking-wider text-foreground">
                    Share Your Experience
                  </h3>
                  <p className="text-xs text-muted-foreground">As a Premium Member</p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  resetForm();
                  setIsOpen(false);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                Cancel
              </Button>
            </div>

            {/* Rating */}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Your Rating
              </Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <motion.button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredStar(star)}
                    onMouseLeave={() => setHoveredStar(0)}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-1 focus:outline-none"
                  >
                    <Star
                      className={`h-6 w-6 transition-colors ${
                        star <= (hoveredStar || rating)
                          ? 'fill-primary text-primary'
                          : 'text-muted-foreground/30'
                      }`}
                    />
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Quote */}
            <div className="space-y-2">
              <Label htmlFor="quote" className="text-xs uppercase tracking-wider text-muted-foreground">
                Your Story <span className="text-primary">*</span>
              </Label>
              <Textarea
                id="quote"
                value={quote}
                onChange={(e) => setQuote(e.target.value)}
                placeholder="Tell us how En Pensent has transformed your chess experience..."
                className="min-h-[120px] resize-none bg-background/50 border-border/50 focus:border-primary/50"
                maxLength={500}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                {errors.quote ? (
                  <span className="text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.quote}
                  </span>
                ) : (
                  <span>Share your genuine experience</span>
                )}
                <span className={quote.length > 450 ? 'text-primary' : ''}>
                  {quote.length}/500
                </span>
              </div>
            </div>

            {/* Name and Role */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-xs uppercase tracking-wider text-muted-foreground">
                  Display Name <span className="text-primary">*</span>
                </Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g., John D."
                  className="bg-background/50 border-border/50 focus:border-primary/50"
                  maxLength={50}
                />
                {errors.displayName && (
                  <span className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.displayName}
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="roleTitle" className="text-xs uppercase tracking-wider text-muted-foreground">
                  Your Role <span className="text-primary">*</span>
                </Label>
                <Input
                  id="roleTitle"
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  placeholder="e.g., Chess Coach, Tournament Player"
                  className="bg-background/50 border-border/50 focus:border-primary/50"
                  maxLength={100}
                />
                {errors.roleTitle && (
                  <span className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.roleTitle}
                  </span>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-6 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-display uppercase tracking-wider"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    Submit Your Story
                  </span>
                )}
              </Button>
            </motion.div>

            <p className="text-xs text-center text-muted-foreground/70 font-serif">
              Submissions are reviewed before being published. We may reach out for verification.
            </p>
          </motion.form>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
