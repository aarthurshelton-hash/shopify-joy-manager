/**
 * Methodology Panel
 * 
 * Displays the complete benchmark methodology with fairness guarantees,
 * auto-updating with the latest methodology version.
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { motion } from 'framer-motion';
import { 
  Shield, 
  CheckCircle2, 
  BookOpen,
  Sparkles,
  Database,
  Shuffle,
  Eye,
  Scale,
  Layers,
  Clock,
  RefreshCw
} from 'lucide-react';
import {
  METHODOLOGY_SECTIONS,
  FAIRNESS_GUARANTEES,
  STYLE_METHODOLOGY,
  CONTINUOUS_LEARNING_METHODOLOGY,
  METHODOLOGY_VERSION,
  LAST_UPDATED,
  getMethodologyPanels,
} from '@/lib/pensent-core/methodology/benchmarkMethodology';

export function MethodologyPanel() {
  const panels = getMethodologyPanels();

  return (
    <Card className="bg-card/80 backdrop-blur border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Benchmark Methodology
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            v{METHODOLOGY_VERSION}
          </Badge>
        </div>
        <CardDescription>
          Scientific rigor and fairness guarantees • Updated {LAST_UPDATED}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Reference Cards */}
        <div className="grid grid-cols-2 gap-2">
          {panels.map((panel, i) => (
            <motion.div
              key={panel.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`p-3 rounded-lg border bg-gradient-to-br from-${panel.color}-500/10 to-transparent border-${panel.color}-500/20`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{panel.icon}</span>
                <span className="text-xs font-medium">{panel.title}</span>
              </div>
              <p className="text-xs text-muted-foreground">{panel.content}</p>
            </motion.div>
          ))}
        </div>

        {/* Fairness Guarantees */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Shield className="w-4 h-4 text-green-400" />
            {FAIRNESS_GUARANTEES.length} Fairness Guarantees
          </h4>
          <ScrollArea className="h-40">
            <div className="space-y-2 pr-4">
              {FAIRNESS_GUARANTEES.map((guarantee, i) => (
                <motion.div
                  key={guarantee.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-2 p-2 bg-muted/30 rounded-lg"
                >
                  <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-medium">{guarantee.name}</p>
                    <p className="text-xs text-muted-foreground">{guarantee.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Detailed Methodology Accordion */}
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="methodology">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Full Methodology Details
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                {METHODOLOGY_SECTIONS.map((section, i) => (
                  <div key={i} className="p-3 bg-muted/30 rounded-lg">
                    <h5 className="text-xs font-medium text-primary mb-1">{section.title}</h5>
                    <p className="text-xs text-muted-foreground mb-2">{section.description}</p>
                    <ul className="text-xs text-muted-foreground space-y-0.5">
                      {section.keyPoints.map((point, j) => (
                        <li key={j}>• {point}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="style">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Style Profiling Methodology
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                {STYLE_METHODOLOGY.map((section, i) => (
                  <div key={i} className="p-3 bg-muted/30 rounded-lg">
                    <h5 className="text-xs font-medium text-primary mb-1">{section.title}</h5>
                    <p className="text-xs text-muted-foreground mb-2">{section.description}</p>
                    <ul className="text-xs text-muted-foreground space-y-0.5">
                      {section.keyPoints.map((point, j) => (
                        <li key={j}>• {point}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="learning">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Continuous Learning Pipeline
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                <p className="text-xs text-muted-foreground">{CONTINUOUS_LEARNING_METHODOLOGY.description}</p>
                
                <div className="space-y-2">
                  {CONTINUOUS_LEARNING_METHODOLOGY.process.map((step) => (
                    <div key={step.step} className="flex items-start gap-2">
                      <Badge variant="outline" className="shrink-0">{step.step}</Badge>
                      <div>
                        <p className="text-xs font-medium">{step.name}</p>
                        <p className="text-xs text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 p-2 bg-muted/30 rounded">
                  <p className="text-xs font-medium mb-1">Data Quality Tiers</p>
                  <div className="space-y-1">
                    {CONTINUOUS_LEARNING_METHODOLOGY.dataQualityTiers.map((tier) => (
                      <div key={tier.tier} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{tier.description}</span>
                        <Badge variant="secondary" className="text-xs">
                          {(tier.weight * 100).toFixed(0)}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Auto-update indicator */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border/50">
          <Sparkles className="w-3 h-3 text-primary animate-pulse" />
          <span>Methodology auto-syncs with latest benchmark runs</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default MethodologyPanel;
