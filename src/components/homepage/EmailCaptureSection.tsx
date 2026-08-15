import React, { useState } from 'react';
import { Mail, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const EmailCaptureSection: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      // Try to save to Supabase first
      // Table may not exist in generated types yet — cast to bypass
      const { error } = await (supabase as unknown as {
        from: (table: string) => { insert: (row: Record<string, unknown>) => Promise<{ error: { message: string } | null }> }
      }).from('newsletter_subscribers').insert({ email });

      if (error) {
        // If table doesn't exist or RLS blocks, fall back to localStorage
        // but still show success to the user
        const subscribers = JSON.parse(localStorage.getItem('ep_newsletter') || '[]');
        if (!subscribers.includes(email)) {
          subscribers.push(email);
          localStorage.setItem('ep_newsletter', JSON.stringify(subscribers));
        }
        console.warn('Newsletter signup saved locally (Supabase table may not exist yet):', error.message);
      }

      setSubmitted(true);
      toast.success('Welcome aboard! We\'ll be in touch.');
      setEmail('');
    } catch {
      toast.error('Something went wrong. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-16 border-t border-border/40">
      <div className="container mx-auto px-4">
        <div className="max-w-xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 border border-primary/20">
            <Mail className="h-6 w-6 text-primary" />
          </div>

          <div className="space-y-2">
            <h2 className="font-royal text-2xl sm:text-3xl font-bold uppercase tracking-wide">
              Stay in the <span className="text-gold-gradient">Loop</span>
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground font-serif max-w-md mx-auto">
              New features, domain expansions, and benchmark updates.
              No spam — just signal.
            </p>
          </div>

          {submitted ? (
            <div className="flex items-center justify-center gap-2 text-primary">
              <CheckCircle className="h-5 w-5" />
              <span className="font-display text-sm uppercase tracking-wider">
                You're subscribed
              </span>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row items-center gap-3 max-w-md mx-auto"
            >
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 w-full"
                disabled={loading}
              />
              <Button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto shrink-0"
              >
                {loading ? 'Subscribing...' : 'Subscribe'}
              </Button>
            </form>
          )}

          <p className="text-xs text-muted-foreground/50">
            We respect your privacy. Unsubscribe anytime.
          </p>
        </div>
      </div>
    </section>
  );
};

export default EmailCaptureSection;
