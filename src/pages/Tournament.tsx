/**
 * Tournament — En Pensent x Matcherino chess tournament landing page.
 * All event details flow from src/lib/tournament/tournamentConfig.ts.
 */

import React from 'react';
import { Header } from '@/components/shop/Header';
import { Footer } from '@/components/shop/Footer';
import { motion } from 'framer-motion';
import {
  Trophy,
  Crown,
  ShieldCheck,
  ExternalLink,
  Calendar,
  Sparkles,
  Handshake,
  Clock,
  Users,
  Banknote,
  Palette,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import {
  TOURNAMENT,
  TournamentStatus,
  tournamentHasRegistrationLink,
} from '@/lib/tournament/tournamentConfig';

const STATUS_LABELS: Record<TournamentStatus, string> = {
  planning: 'In Planning',
  announced: 'Coming Soon',
  registration: 'Registration Open',
  live: 'Live Now',
  completed: 'Completed',
};

const STEPS = [
  {
    icon: Handshake,
    title: 'Register on Matcherino',
    description:
      'Sign up for the event on Matcherino — the platform holding the crowdfunded prize pool in escrow and paying out winners globally.',
  },
  {
    icon: Users,
    title: 'Play on lichess',
    description:
      'Battles happen on lichess.org — free account, built-in fair-play detection, open to everyone.',
  },
  {
    icon: Palette,
    title: 'Your games become art',
    description:
      'Paste your lichess game or tournament link on the home page and it renders as an En Pensent vision — the champion’s winning game becomes a one-of-a-kind piece. Chess.com games can be turned into art too, but only lichess games count toward prizes.',
  },
];

const Tournament: React.FC = () => {
  const statusLabel = STATUS_LABELS[TOURNAMENT.status];
  const canRegister = tournamentHasRegistrationLink();

  const formatLine = [
    TOURNAMENT.format.mode === 'arena'
      ? `${TOURNAMENT.format.durationMinutes ?? ''}-minute Arena`
      : `${TOURNAMENT.format.rounds ?? ''}-round Swiss`,
    TOURNAMENT.format.timeControl,
    TOURNAMENT.format.platform === 'lichess' ? 'on lichess' : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 pt-28 pb-20 max-w-4xl">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-display uppercase tracking-widest mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            {statusLabel}
            {TOURNAMENT.entryFee === 'free' && (
              <span className="text-muted-foreground normal-case tracking-normal">
                · Free entry
              </span>
            )}
          </div>

          <h1 className="font-display text-4xl md:text-6xl mb-4 leading-tight">
            {TOURNAMENT.name}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-3">
            {TOURNAMENT.tagline}
          </p>
          <p className="text-sm text-muted-foreground">
            Powered by <span className="text-foreground font-medium">Matcherino</span>
            {' · '}Played on <span className="text-foreground font-medium">lichess.org</span>
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            {canRegister ? (
              <Button size="lg" className="btn-luxury gap-2" asChild>
                <a
                  href={TOURNAMENT.urls.matcherinoEvent!}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Trophy className="h-4 w-4" />
                  Register on Matcherino
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Button>
            ) : (
              <Button size="lg" className="btn-luxury gap-2" disabled>
                <Trophy className="h-4 w-4" />
                Registration Opening Soon
              </Button>
            )}
            <Button size="lg" variant="outline" className="gap-2" asChild>
              <Link to="/">
                <Palette className="h-4 w-4" />
                See the Art
              </Link>
            </Button>
          </div>
        </motion.div>

        {/* Event details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid sm:grid-cols-3 gap-4 mb-14"
        >
          <div className="rounded-xl border border-border/50 bg-card/50 p-5 text-center">
            <Calendar className="h-5 w-5 text-primary mx-auto mb-2" />
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Date</div>
            <div className="font-medium text-sm">
              {TOURNAMENT.startDate
                ? new Date(TOURNAMENT.startDate).toLocaleDateString(undefined, {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'To be announced'}
            </div>
          </div>
          <div className="rounded-xl border border-border/50 bg-card/50 p-5 text-center">
            <Clock className="h-5 w-5 text-primary mx-auto mb-2" />
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Format</div>
            <div className="font-medium text-sm">{formatLine}</div>
          </div>
          <div className="rounded-xl border border-border/50 bg-card/50 p-5 text-center">
            <Banknote className="h-5 w-5 text-primary mx-auto mb-2" />
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Entry</div>
            <div className="font-medium text-sm">
              {TOURNAMENT.entryFee === 'free' ? 'Free' : 'Entry fee applies'}
            </div>
          </div>
        </motion.div>

        {/* Prizes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-8 mb-14"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center">
              <Crown className="h-5 w-5 text-primary" />
            </div>
            <h2 className="font-display text-2xl">Prizes</h2>
          </div>
          <p className="text-muted-foreground mb-5">{TOURNAMENT.prize.poolDescription}</p>
          <ul className="space-y-3">
            {TOURNAMENT.prize.bonusPrizes.map((prize, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span>{prize}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-14"
        >
          <h2 className="font-display text-2xl mb-6 text-center">How It Works</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {STEPS.map((step, i) => (
              <div
                key={i}
                className="rounded-xl border border-border/50 bg-card/50 p-6 text-center"
              >
                <div className="h-11 w-11 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                  <step.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="text-xs text-muted-foreground mb-1">Step {i + 1}</div>
                <h3 className="font-medium mb-2">{step.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Rules */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-xl border border-border/50 bg-card/30 p-8"
        >
          <div className="flex items-center gap-2 mb-5">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h2 className="font-display text-xl">Tournament Rules</h2>
          </div>
          <ul className="space-y-3">
            {TOURNAMENT.rules.map((rule, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                <span className="text-primary font-mono text-xs mt-0.5">{String(i + 1).padStart(2, '0')}</span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground mt-6 pt-4 border-t border-border/30">
            Chess.com games can be visualized on En Pensent but are not eligible for tournament
            prizes. En Pensent × Matcherino — prize pools are community-funded, held in escrow, and
            paid out by Matcherino with full tax compliance. Official rules are published on
            the Matcherino event page when registration opens.
          </p>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default Tournament;
