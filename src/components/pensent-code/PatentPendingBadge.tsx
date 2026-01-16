import { Shield, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

export function PatentPendingBadge() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-medium cursor-pointer hover:bg-amber-500/20 transition-colors"
        >
          <Shield className="h-3.5 w-3.5" />
          <span>Patent Pending</span>
        </motion.button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-500" />
            Intellectual Property Notice
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6 text-sm">
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <h3 className="font-semibold text-amber-600 dark:text-amber-400 mb-2">
                PATENT PENDING
              </h3>
              <p className="text-muted-foreground">
                The En Pensent Universal Temporal Pattern Recognition System is protected 
                by pending patent applications. Unauthorized reproduction, distribution, 
                or commercial use of this technology is strictly prohibited.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Protected Inventions</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>System and Method for Universal Temporal Pattern Recognition</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>Temporal Signature Extraction Methodology</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>Quadrant Profiling for Sequential Data Analysis</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>Archetype Classification and Outcome Prediction</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>Domain-Agnostic Pattern Matching Engine</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Registered Trademarks</h4>
              <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                <span>• En Pensent™</span>
                <span>• Temporal Signature™</span>
                <span>• Code Flow Signature™</span>
                <span>• Archetype Prediction™</span>
                <span>• Quadrant Profiling™</span>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-muted/50">
              <h4 className="font-semibold mb-2">Inventor & Creator</h4>
              <p className="text-muted-foreground">
                <strong>Alec Arthur Shelton</strong> ("The Artist")
                <br />
                Founder & CEO, En Pensent Technologies
                <br />
                <span className="text-xs">Filing Date: January 16, 2026</span>
              </p>
            </div>

            <div className="text-xs text-muted-foreground border-t pt-4">
              <p>
                © 2026 Alec Arthur Shelton. All Rights Reserved. This technology 
                and its associated intellectual property are protected under 
                applicable patent, trademark, and copyright laws. Any unauthorized 
                use, reproduction, or distribution may result in civil and criminal 
                penalties.
              </p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
