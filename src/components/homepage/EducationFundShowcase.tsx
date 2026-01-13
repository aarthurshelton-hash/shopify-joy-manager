import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GraduationCap, Heart, Globe, ChevronRight, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface EducationFundShowcaseProps {
  variant?: 'homepage' | 'compact' | 'card';
  className?: string;
}

export const EducationFundShowcase: React.FC<EducationFundShowcaseProps> = ({
  variant = 'homepage',
  className = '',
}) => {
  const { data: stats } = useQuery({
    queryKey: ['education-fund-summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('education_fund')
        .select('fund_contribution_cents, visions_released');
      
      if (error) throw error;
      
      const totalFundCents = data?.reduce((sum, r) => sum + (r.fund_contribution_cents || 0), 0) || 0;
      const totalVisionsReleased = data?.reduce((sum, r) => sum + (r.visions_released || 0), 0) || 0;
      const scholarshipsCount = Math.floor(totalFundCents / 700); // $7/month
      
      return {
        totalFundDollars: totalFundCents / 100,
        scholarshipsCount,
        visionsReleased: totalVisionsReleased,
      };
    },
    staleTime: 60000,
  });

  if (variant === 'card') {
    return (
      <Link to="/education-fund" className={className}>
        <Card className="group border-emerald-500/20 hover:border-emerald-500/40 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 transition-all cursor-pointer">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
              <GraduationCap className="h-5 w-5 text-emerald-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-display text-sm font-medium truncate">Chess Education Fund</h4>
              <p className="text-xs text-muted-foreground truncate">
                {stats?.scholarshipsCount || 0} scholarships funded
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
          </CardContent>
        </Card>
      </Link>
    );
  }

  if (variant === 'compact') {
    return (
      <Link 
        to="/education-fund" 
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/40 text-sm text-emerald-600 dark:text-emerald-400 transition-all ${className}`}
      >
        <GraduationCap className="h-4 w-4" />
        <span className="font-medium">Education Fund</span>
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
          {stats?.scholarshipsCount || 0} scholarships
        </Badge>
      </Link>
    );
  }

  // Full homepage variant
  return (
    <section className={`py-16 ${className}`}>
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <Card className="overflow-hidden border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-cyan-500/5">
            <CardContent className="p-8 md:p-12">
              <div className="flex flex-col md:flex-row gap-8 items-center">
                {/* Icon and Title */}
                <div className="text-center md:text-left space-y-4 flex-1">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-display uppercase tracking-wider">
                    <Heart className="h-3.5 w-3.5" />
                    Giving Back
                  </div>
                  
                  <h2 className="text-2xl md:text-3xl font-royal font-bold uppercase tracking-wide">
                    Chess <span className="text-emerald-500">Education</span> Fund
                  </h2>
                  
                  <p className="text-muted-foreground font-serif leading-relaxed max-w-lg">
                    Every premium membership contributes to scholarships for underprivileged students. 
                    When memberships lapse, vision values flow directly to chess education worldwide.
                  </p>

                  <div className="flex flex-wrap gap-6 justify-center md:justify-start pt-2">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-emerald-500">
                        ${stats?.totalFundDollars?.toFixed(0) || '0'}
                      </p>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Funded</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-emerald-500">
                        {stats?.scholarshipsCount || 0}
                      </p>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Scholarships</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-emerald-500">
                        <Globe className="h-6 w-6 inline" />
                      </p>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Worldwide</p>
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <div className="flex flex-col gap-3 items-center">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                    <GraduationCap className="h-12 w-12 text-emerald-500" />
                  </div>
                  <Link to="/education-fund">
                    <Button 
                      variant="outline" 
                      className="gap-2 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                    >
                      <Sparkles className="h-4 w-4" />
                      Learn More
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};

export default EducationFundShowcase;
