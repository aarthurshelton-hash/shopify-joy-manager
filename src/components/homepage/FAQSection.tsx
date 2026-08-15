import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: 'What is a PGN file?',
    answer: 'PGN (Portable Game Notation) is the standard format for recording chess games. Every game on Chess.com and Lichess can be exported as a PGN file. You can also paste a PGN directly, import from a URL, or pick one of our legendary games — no file needed.',
  },
  {
    question: 'Do I need an account to try it?',
    answer: 'No. You can upload a game, choose a palette, and watch it paint itself without signing up. An account is only needed if you want to save visualizations to your gallery, list them on the marketplace, or access HD exports.',
  },
  {
    question: 'How does the prediction engine work?',
    answer: 'En Pensent colors every square a piece passes through — not just where it lands, but the full path. Over 30-40 moves, these overlapping paths create a spatial fingerprint. That fingerprint is classified into archetypes with historical win rates. It\'s pattern recognition, not calculation.',
  },
  {
    question: 'What\'s the difference between free and premium?',
    answer: 'Free users can visualize any game, share it, and download a preview image. Premium members get HD exports, GIF animations, save-to-gallery, marketplace listing rights, and access to the full palette library.',
  },
  {
    question: 'Can I order a physical print?',
    answer: 'Yes. Every visualization can be ordered as a museum-quality giclée print with optional handcrafted framing. Prints are produced on archival paper and shipped worldwide.',
  },
  {
    question: 'What makes this different from other chess visualizers?',
    answer: 'Most chess visualizers show heatmaps or evaluation bars. En Pensent traces the full path of every piece, creating unique color-flow art that doubles as a predictive signature. The same engine that makes your game beautiful also predicts outcomes more accurately than Stockfish 18 in the middlegame.',
  },
];

const FAQItem: React.FC<{ item: FAQItem; isOpen: boolean; onToggle: () => void }> = ({
  item,
  isOpen,
  onToggle,
}) => (
  <div className="border border-border/50 rounded-lg bg-card/30 overflow-hidden">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/20 transition-colors"
    >
      <span className="font-display text-sm sm:text-base text-foreground pr-4">
        {item.question}
      </span>
      <motion.div
        animate={{ rotate: isOpen ? 180 : 0 }}
        transition={{ duration: 0.2 }}
        className="shrink-0"
      >
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </motion.div>
    </button>
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <p className="px-4 pb-4 text-sm text-muted-foreground font-serif leading-relaxed">
            {item.answer}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

export const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-16 border-t border-border/40">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8 space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-display uppercase tracking-widest">
              Questions
            </div>
            <h2 className="font-royal text-2xl sm:text-3xl font-bold uppercase tracking-wide">
              Common <span className="text-gold-gradient">Questions</span>
            </h2>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((item, i) => (
              <FAQItem
                key={i}
                item={item}
                isOpen={openIndex === i}
                onToggle={() => setOpenIndex(openIndex === i ? null : i)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
