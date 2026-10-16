import React from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/shop/Header';
import { Footer } from '@/components/shop/Footer';
import { Button } from '@/components/ui/button';
import { ArrowRight, FileText, Palette, Package } from 'lucide-react';

const STEPS = [
  { icon: FileText, title: 'Choose the game', body: 'Paste a PGN, import from Lichess or Chess.com, or start from a famous game.' },
  { icon: Palette, title: 'Make it theirs', body: 'Pick a palette and the moment to capture. Every square keeps the colour and flow of the pieces.' },
  { icon: Package, title: 'Add a note', body: 'Archival paper or framed to order, with an optional gift message.' },
];

const Gift: React.FC = () => (
  <div className="min-h-screen bg-background text-foreground flex flex-col">
    <Header />
    <main className="flex-1">
      <section className="container mx-auto px-4 pt-16 pb-12 md:pt-24 text-center max-w-3xl">
        <p className="text-primary/80 text-xs uppercase tracking-[0.3em] mb-5">Chess, rendered as art</p>
        <h1 className="font-editorial text-4xl md:text-6xl leading-[1.05] mb-6">
          The gift that is <span className="italic text-gold-gradient">a game they played</span>
        </h1>
        <p className="font-serif text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mb-8">
          Turn any real chess game into a one-of-a-kind museum print, framed to order.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg">
            <Link to="/">Start with a game <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/shop">Browse the shop</Link>
          </Button>
        </div>
      </section>
      <section className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="grid md:grid-cols-3 gap-6">
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <div key={title} className="rounded-xl border border-border/50 bg-card/40 p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs text-muted-foreground">0{i + 1}</span>
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h2 className="font-editorial text-2xl mb-2">{title}</h2>
              <p className="text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
    <Footer />
  </div>
);

export default Gift;
