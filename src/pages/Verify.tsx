/**
 * Verify — public provenance page for En Pensent victory cards.
 * /verify/:id is printed as a QR on the back of every card.
 */

import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header } from '@/components/shop/Header';
import { Footer } from '@/components/shop/Footer';
import { ShieldCheck, Fingerprint, Palette, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Known collectible card IDs — grows as cards are minted per event. */
const KNOWN_CARDS: Record<string, { title: string; subtitle: string; edition: string }> = {
  immortal1851: {
    title: 'The Immortal Game',
    subtitle: 'Adolf Anderssen vs Lionel Kieseritzky · London, Casual 1851 · 1-0',
    edition: 'Edition of 250',
  },
  opera1858: {
    title: 'The Opera Game',
    subtitle: 'Paul Morphy vs Duke Karl & Count Isouard · Paris 1858 · 1-0',
    edition: 'Edition of 250',
  },
  evergreen1852: {
    title: 'The Evergreen Game',
    subtitle: 'Adolf Anderssen vs Jean Dufresne · Berlin, Casual 1852 · 1-0',
    edition: 'Edition of 1000',
  },
};

const Verify: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const card = id ? KNOWN_CARDS[id.toLowerCase()] : undefined;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-28 pb-20 max-w-2xl">
        <div className="text-center">
          <div className="h-16 w-16 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>

          {card ? (
            <>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-medium uppercase tracking-widest mb-5">
                Verified Authentic
              </div>
              <h1 className="font-display text-4xl mb-3">{card.title}</h1>
              <p className="text-muted-foreground mb-2">{card.subtitle}</p>
              <p className="text-sm text-primary font-mono mb-10">{card.edition}</p>
              <div className="rounded-xl border border-primary/25 bg-primary/5 p-5 mb-10">
                <p className="text-sm text-muted-foreground mb-3">
                  This card may carry a reward code — check for a printed code or sticker.
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link to="/redeem">
                    Redeem a code <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </>
          ) : (
            <>
              <h1 className="font-display text-4xl mb-3">Card Verification</h1>
              {id ? (
                <p className="text-muted-foreground mb-10">
                  No record for <span className="font-mono text-foreground">{id}</span> — this card
                  may belong to an upcoming tournament series. Event cards are registered when
                  they're issued.
                </p>
              ) : (
                <p className="text-muted-foreground mb-10">
                  Every En Pensent victory card carries a QR on the back that links here.
                </p>
              )}
            </>
          )}
        </div>

        <div className="rounded-xl border border-border/50 bg-card/50 p-6 space-y-4">
          <div className="flex items-start gap-3">
            <Fingerprint className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <h2 className="font-medium text-sm mb-1">How verification works</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Each card's board art is the color-flow fingerprint of a real game — no two games
                produce the same signature. The engine fingerprint on the card face matches the
                record on this page.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Palette className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <h2 className="font-medium text-sm mb-1">Generate your own</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Paste any PGN on enpensent.com and the same engine renders your game — free.
              </p>
            </div>
          </div>
          <Button asChild className="w-full btn-luxury gap-2 mt-2">
            <Link to="/">
              Turn Your Game Into Art
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Verify;
