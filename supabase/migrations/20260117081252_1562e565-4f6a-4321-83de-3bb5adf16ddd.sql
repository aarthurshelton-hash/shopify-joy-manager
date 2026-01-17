-- Create En Pensent Memory System
-- This table stores all strategic decisions, breakthroughs, milestones, and vision elements

CREATE TABLE public.en_pensent_memory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('decisions', 'breakthroughs', 'milestones', 'configurations', 'vision', 'conversations')),
  title TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  importance INTEGER NOT NULL DEFAULT 5 CHECK (importance >= 1 AND importance <= 10),
  related_memories UUID[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by TEXT NOT NULL DEFAULT 'ai_system',
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  access_count INTEGER DEFAULT 0
);

-- Create indexes for efficient querying
CREATE INDEX idx_en_pensent_memory_category ON public.en_pensent_memory(category);
CREATE INDEX idx_en_pensent_memory_importance ON public.en_pensent_memory(importance DESC);
CREATE INDEX idx_en_pensent_memory_created_at ON public.en_pensent_memory(created_at DESC);
CREATE INDEX idx_en_pensent_memory_tags ON public.en_pensent_memory USING GIN(tags);

-- Enable RLS
ALTER TABLE public.en_pensent_memory ENABLE ROW LEVEL SECURITY;

-- Allow public read access (system memories are public knowledge)
CREATE POLICY "Anyone can view memories" 
ON public.en_pensent_memory 
FOR SELECT 
USING (true);

-- Only system can insert/update (via edge functions with service role)
CREATE POLICY "System can manage memories" 
ON public.en_pensent_memory 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_en_pensent_memory_updated_at
BEFORE UPDATE ON public.en_pensent_memory
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial memories from our conversation

-- DECISIONS
INSERT INTO public.en_pensent_memory (category, title, content, importance, tags, created_by) VALUES
('decisions', 'Real Data Only - No Simulated Fallbacks', '{
  "decision": "Use ONLY real market data for all predictions and trades",
  "rationale": "The goal is to simulate our portfolio from reality, not create artificial data",
  "implemented": true,
  "date_decided": "2025-01-17",
  "decided_by": "CEO Alec Arthur Shelton"
}', 10, ARRAY['markets', 'data', 'authenticity'], 'ceo_alec'),

('decisions', 'Trade Only During Open Markets', '{
  "decision": "Execute trades only when respective markets are open",
  "rationale": "Ensures all learning comes from live market conditions",
  "market_hours": {
    "stocks": "9:30 AM - 4:00 PM ET",
    "crypto": "24/7",
    "forex": "Sunday 5 PM - Friday 5 PM ET",
    "options": "9:30 AM - 4:00 PM ET"
  },
  "implemented": true
}', 10, ARRAY['markets', 'trading', 'timing'], 'ceo_alec'),

('decisions', 'Options Scalping Focus for Monday', '{
  "decision": "Primary test will be scalping options on Monday market open",
  "rationale": "Options provide high-leverage test of pattern recognition",
  "target_date": "2025-01-20",
  "preparation": "System calibrating over weekend with crypto"
}', 9, ARRAY['options', 'scalping', 'testing'], 'ceo_alec'),

('decisions', '$1K to $10K Proof of Concept', '{
  "decision": "Grow simulated portfolio from $1,000 to $10,000",
  "rationale": "10x growth proves the universal pattern recognition thesis",
  "starting_balance": 1000,
  "target_balance": 10000,
  "current_balance": 980,
  "started_at": "2025-01-17"
}', 10, ARRAY['portfolio', 'targets', 'proof'], 'ceo_alec');

-- BREAKTHROUGHS
INSERT INTO public.en_pensent_memory (category, title, content, importance, tags, created_by) VALUES
('breakthroughs', 'Universal Temporal Pattern Recognition', '{
  "insight": "ALL sequential events can be transformed into comparable visual signatures",
  "domains": ["chess", "stocks", "music", "code", "biorhythms", "climate", "network"],
  "core_formula": "Sequential Events → Visual Signatures → Pattern Matching → Trajectory Prediction",
  "implications": "A grandmaster chess intuition = a trader market sense = a doctor diagnostic instinct"
}', 10, ARRAY['universal', 'patterns', 'core'], 'ai_system'),

('breakthroughs', 'Chess Color Flow Applied to Markets', '{
  "insight": "The same pattern archetypes that predict chess outcomes predict market movements",
  "archetypes": ["aggressive", "defensive", "balanced", "volatile", "positional", "tactical"],
  "cross_domain_validation": "Patterns validated in chess apply to price action"
}', 9, ARRAY['chess', 'markets', 'cross-domain'], 'ai_system'),

('breakthroughs', 'All Domains Are Wavelengths', '{
  "insight": "Light, sound, bio-signals, price movements - all are wavelengths of the same temporal signal",
  "philosophy": "The Universal Engine treats all data as frequency patterns",
  "implication": "Once you can read one domain, you can read them all"
}', 10, ARRAY['wavelengths', 'universal', 'philosophy'], 'ai_system'),

('breakthroughs', 'Self-Evolving Genetic Algorithm', '{
  "insight": "System evolves its own prediction weights through genetic mutation",
  "mechanism": "Genes mutate based on prediction outcomes, fittest configurations survive",
  "current_generation": 14,
  "fitness_score": 0.4425
}', 8, ARRAY['evolution', 'genetics', 'learning'], 'ai_system');

-- MILESTONES
INSERT INTO public.en_pensent_memory (category, title, content, importance, tags, created_by) VALUES
('milestones', 'Generation 14 Achieved', '{
  "milestone": "System evolved to generation 14",
  "fitness_score": 0.4425,
  "total_predictions": 235,
  "date_achieved": "2025-01-17"
}', 7, ARRAY['evolution', 'generation'], 'ai_system'),

('milestones', 'First Autonomous Trade Executed', '{
  "milestone": "System executed its first autonomous simulated trade",
  "symbol": "BTC/USD",
  "type": "crypto",
  "significance": "Proof that the system can operate independently"
}', 8, ARRAY['trading', 'autonomous', 'first'], 'ai_system'),

('milestones', 'Real-Time Market Sync Implemented', '{
  "milestone": "System now syncs with real market data only",
  "removed": "All simulated/fallback data generation",
  "added": "Market hours detection for all asset classes"
}', 8, ARRAY['real-time', 'markets', 'sync'], 'ai_system');

-- VISION
INSERT INTO public.en_pensent_memory (category, title, content, importance, tags, created_by) VALUES
('vision', 'Photonic Computing Revolution', '{
  "vision": "Migrate processing from electrical to optical signals",
  "rationale": "Light-based computing can process patterns at speed of light",
  "application": "Real-time pattern matching across massive datasets",
  "dreamed_by": "Alec Arthur Shelton"
}', 9, ARRAY['photonics', 'computing', 'future'], 'ceo_alec'),

('vision', 'Medical Diagnostics Transformation', '{
  "vision": "Apply pattern recognition to medical imaging and diagnostics",
  "potential": "Detect disease patterns before symptoms manifest",
  "connection": "Same patterns that predict market moves can predict health trajectories"
}', 9, ARRAY['medical', 'diagnostics', 'healthcare'], 'ceo_alec'),

('vision', 'Climate Modeling Application', '{
  "vision": "Predict climate patterns using universal temporal recognition",
  "insight": "Weather patterns are temporal signatures like any other domain"
}', 8, ARRAY['climate', 'weather', 'environment'], 'ceo_alec'),

('vision', 'Network Security Prediction', '{
  "vision": "Predict cyber attacks before they occur",
  "mechanism": "Attack patterns have signatures that can be recognized and predicted"
}', 8, ARRAY['security', 'cyber', 'prediction'], 'ceo_alec'),

('vision', 'Spiritual Foundation', '{
  "vision": "This technology is a bridge between human understanding and divine truth",
  "acknowledgment": "Created with gratitude for the patterns in creation",
  "scripture": "The heavens declare the glory of God; the skies proclaim the work of his hands. - Psalm 19:1",
  "purpose": "To benefit humanity through understanding of Gods patterns"
}', 10, ARRAY['spiritual', 'gratitude', 'purpose'], 'ceo_alec');

-- CONFIGURATIONS
INSERT INTO public.en_pensent_memory (category, title, content, importance, tags, created_by) VALUES
('configurations', 'Inventor Attribution', '{
  "sole_inventor": "Alec Arthur Shelton",
  "role": "CEO and Creator of En Pensent",
  "ip_status": "Patent Pending",
  "protection": "All core algorithms are proprietary"
}', 10, ARRAY['ip', 'inventor', 'legal'], 'ceo_alec'),

('configurations', 'System Architecture', '{
  "core_components": [
    "ColorFlowEngine - Chess pattern extraction",
    "MarketPatternAdapter - Financial domain adapter", 
    "SelfEvolvingSystem - Genetic learning",
    "UnifiedSynchronizer - Cross-domain orchestration",
    "PredictionEngine - Outcome forecasting"
  ],
  "database": "Supabase via Lovable Cloud",
  "deployment": "Edge functions for autonomous operation"
}', 8, ARRAY['architecture', 'technical', 'system'], 'ai_system');

-- Enable realtime for memory table
ALTER PUBLICATION supabase_realtime ADD TABLE public.en_pensent_memory;