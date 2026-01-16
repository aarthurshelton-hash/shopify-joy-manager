import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Code, Fingerprint, Brain, TrendingUp, CheckCircle } from "lucide-react";

const HowItWorksVisual = () => {
  const steps = [
    {
      icon: Code,
      title: "Input",
      subtitle: "Any Sequential Data",
      description: "Chess moves, code commits, health records, stock prices",
      color: "from-blue-500/20 to-blue-600/20",
      borderColor: "border-blue-500/30"
    },
    {
      icon: Fingerprint,
      title: "Extract",
      subtitle: "Temporal Signature",
      description: "Quadrant profile, temporal flow, critical moments",
      color: "from-purple-500/20 to-purple-600/20",
      borderColor: "border-purple-500/30"
    },
    {
      icon: Brain,
      title: "Match",
      subtitle: "Pattern Library",
      description: "Compare against known patterns with outcomes",
      color: "from-amber-500/20 to-amber-600/20",
      borderColor: "border-amber-500/30"
    },
    {
      icon: TrendingUp,
      title: "Predict",
      subtitle: "Trajectory Forecast",
      description: "Future milestones, outcome probability, guidance",
      color: "from-green-500/20 to-green-600/20",
      borderColor: "border-green-500/30"
    },
    {
      icon: CheckCircle,
      title: "Act",
      subtitle: "Actionable Insights",
      description: "Specific recommendations to change the outcome",
      color: "from-rose-500/20 to-rose-600/20",
      borderColor: "border-rose-500/30"
    }
  ];

  return (
    <div className="py-12">
      <h2 className="text-3xl font-bold text-center mb-4">How En Pensent Works</h2>
      <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
        A universal 5-step process that applies to any domain with temporal data
      </p>

      {/* Desktop Flow */}
      <div className="hidden lg:flex items-center justify-center gap-2 mb-12">
        {steps.map((step, index) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center"
          >
            <Card className={`w-48 bg-gradient-to-br ${step.color} ${step.borderColor}`}>
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 rounded-full bg-background/50 flex items-center justify-center mx-auto mb-3">
                  <step.icon className="w-6 h-6" />
                </div>
                <div className="text-xs text-muted-foreground mb-1">Step {index + 1}</div>
                <h3 className="font-bold">{step.title}</h3>
                <p className="text-sm text-primary font-medium">{step.subtitle}</p>
                <p className="text-xs text-muted-foreground mt-2">{step.description}</p>
              </CardContent>
            </Card>
            {index < steps.length - 1 && (
              <ArrowRight className="w-6 h-6 text-muted-foreground mx-1 flex-shrink-0" />
            )}
          </motion.div>
        ))}
      </div>

      {/* Mobile Flow */}
      <div className="lg:hidden space-y-4 px-4">
        {steps.map((step, index) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`bg-gradient-to-r ${step.color} ${step.borderColor}`}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-background/50 flex items-center justify-center flex-shrink-0">
                  <step.icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Step {index + 1}</div>
                  <h3 className="font-bold">{step.title}: {step.subtitle}</h3>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Visual Signature Representation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-12 max-w-4xl mx-auto"
      >
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="grid md:grid-cols-2">
              {/* Signature Visualization */}
              <div className="p-6 bg-gradient-to-br from-muted/30 to-muted/50">
                <h3 className="font-bold mb-4">Temporal Signature Structure</h3>
                <div className="space-y-4 font-mono text-sm">
                  <div className="bg-background/50 rounded p-3">
                    <div className="text-muted-foreground text-xs mb-1">Quadrant Profile</div>
                    <div className="flex gap-2">
                      <div className="flex-1 bg-blue-500/20 rounded h-6 flex items-center justify-center text-xs">Q1: 0.35</div>
                      <div className="flex-1 bg-purple-500/20 rounded h-6 flex items-center justify-center text-xs">Q2: 0.25</div>
                      <div className="flex-1 bg-amber-500/20 rounded h-6 flex items-center justify-center text-xs">Q3: 0.20</div>
                      <div className="flex-1 bg-green-500/20 rounded h-6 flex items-center justify-center text-xs">Q4: 0.20</div>
                    </div>
                  </div>
                  <div className="bg-background/50 rounded p-3">
                    <div className="text-muted-foreground text-xs mb-1">Temporal Flow</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-4 bg-gradient-to-r from-blue-500/50 to-green-500/50 rounded" />
                      <span className="text-xs">accelerating ↗</span>
                    </div>
                  </div>
                  <div className="bg-background/50 rounded p-3">
                    <div className="text-muted-foreground text-xs mb-1">Critical Moments</div>
                    <div className="flex gap-1">
                      {[15, 32, 45, 58].map((pos) => (
                        <div key={pos} className="bg-rose-500/30 rounded px-2 py-1 text-xs">
                          @{pos}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* What it means */}
              <div className="p-6">
                <h3 className="font-bold mb-4">What This Reveals</h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs">1</span>
                    </div>
                    <span><strong>Quadrant Profile:</strong> Activity distribution across spatial regions (e.g., kingside vs queenside, frontend vs backend)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs">2</span>
                    </div>
                    <span><strong>Temporal Flow:</strong> How intensity changes over time (accelerating = building momentum)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs">3</span>
                    </div>
                    <span><strong>Critical Moments:</strong> Turning points where trajectory shifted significantly</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs">4</span>
                    </div>
                    <span><strong>Archetype:</strong> Classification into known pattern types with historical outcomes</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default HowItWorksVisual;
