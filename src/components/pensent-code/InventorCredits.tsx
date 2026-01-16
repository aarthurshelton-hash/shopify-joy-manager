import { User, Sparkles, Award } from 'lucide-react';
import { motion } from 'framer-motion';

export function InventorCredits() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mt-16 pt-8 border-t"
    >
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 via-purple-500/10 to-primary/10">
          <Award className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-primary">Invented & Created By</span>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-primary via-purple-500 to-primary bg-clip-text text-transparent">
            Alec Arthur Shelton
          </h3>
          <p className="text-muted-foreground italic">"The Artist"</p>
        </div>

        <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>Founder & CEO</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span>En Pensent Technologies</span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground max-w-md mx-auto">
          The En Pensent Universal Pattern Recognition System represents a paradigm shift 
          in how we understand and predict outcomes from sequential data. This technology 
          was conceived, designed, and brought to life through the creative vision of its inventor.
        </p>

        <div className="pt-4 text-xs text-muted-foreground/60">
          © 2026 Alec Arthur Shelton. All Rights Reserved.
          <br />
          Patent Pending • En Pensent™ • Code Flow Signature™ • Archetype Prediction™
        </div>
      </div>
    </motion.div>
  );
}
