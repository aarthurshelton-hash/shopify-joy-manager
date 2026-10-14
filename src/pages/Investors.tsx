import { Link } from 'react-router-dom';
import { Header } from '@/components/shop/Header';
import { Footer } from '@/components/shop/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Palette, Trophy, Scale, ShieldCheck, ArrowRight } from 'lucide-react';
import { useChessEvidenceData } from '@/hooks/useChessEvidenceData';

const CONTACT_EMAIL = 'a.arthur.shelton@gmail.com';

const PILLARS = [
  {
    icon: Palette,
    title: 'Chess games as art',
    body: 'Any game becomes a unique colour-flow visualization: prints, framed pieces, a book, and a scannable card that opens the game it came from.',
  },
  {
    icon: Trophy,
    title: 'Tournaments that feed the art',
    body: 'Fair-play-gated lichess events with Matcherino-held prize pools. Winners’ games become the art; rewards route back into the shop and membership.',
  },
  {
    icon: Scale,
    title: 'A different way to read a game',
    body: 'The same path-based signature is used for outcome prediction. It is benchmarked against Stockfish 18 on audited, resolved predictions, with results published as they are.',
  },
];

const STATUS = [
  { label: 'Live', items: ['Game visualizer and print shop (Shopify, print-on-demand)', 'Reward-code redemption and membership', 'Tournament landing page'] },
  { label: 'In progress', items: ['Matcherino chess-section partnership', 'Recurring lichess events with entry conditions and post-event fair-play review', 'Referral loop'] },
  { label: 'Not claimed yet', items: ['Revenue or subscriber figures', 'Market-prediction performance (no audited out-of-sample benchmark yet)', 'Marketplace (built, disabled until rights and editions model is final)'] },
];

export default function Investors() {
  const { data: ev, isLoading } = useChessEvidenceData();
  const fmt = (n: number) => n.toLocaleString();
  const signed = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}pp`;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12 max-w-4xl space-y-12">
        <section className="text-center space-y-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">En Pensent — overview</p>
          <h1 className="font-display text-4xl md:text-5xl leading-tight">
            Chess, seen as colour and flow.
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            One representation, three uses: art people want to own, tournaments people want to play,
            and a prediction method we hold to an audited standard.
          </p>
        </section>

        <section className="grid md:grid-cols-3 gap-4">
          {PILLARS.map((p) => (
            <Card key={p.title}>
              <CardContent className="p-6 space-y-3">
                <p.icon className="h-6 w-6 text-primary" />
                <h2 className="font-medium">{p.title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.body}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h2 className="font-display text-2xl">Evidence, as measured</h2>
          </div>
          <Card>
            <CardContent className="p-6 space-y-4">
              {isLoading || !ev ? (
                <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin" /></div>
              ) : (
                <>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Standard chess vs Stockfish 18</p>
                      <p className="text-3xl font-bold">{signed(ev.epEdge)}</p>
                      <p className="text-sm text-muted-foreground">
                        EP {ev.epAccuracy.toFixed(2)}% vs SF {ev.sfAccuracy.toFixed(2)}% on {fmt(ev.total)} resolved predictions.
                        Statistical parity, reached without engine search.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Chess960 (no opening book)</p>
                      <p className="text-3xl font-bold">{signed(ev.chess960Edge)}</p>
                      <p className="text-sm text-muted-foreground">
                        EP {ev.chess960EP.toFixed(2)}% vs SF {ev.chess960SF.toFixed(2)}% on {fmt(ev.chess960Total)} games.
                        Measured against the stored Stockfish prediction, which is a weak baseline in near-equal positions. A comparison against a calibrated evaluation-only predictor is in progress; treat this figure as provisional.
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground border-t pt-3">
                    Population: predictions with a known result, aged 7–30 days, refreshed every 6 hours from a materialized
                    snapshot of the public prediction table. Earlier figures quoted from lifetime totals are not comparable
                    and are not used here. <Link to="/vs-stockfish" className="underline">Full breakdown</Link>.
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-2xl">Where we are</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {STATUS.map((s) => (
              <Card key={s.label}>
                <CardContent className="p-6 space-y-3">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
                  <ul className="space-y-2 text-sm leading-snug">
                    {s.items.map((i) => <li key={i}>{i}</li>)}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="text-center space-y-4 border-t pt-10">
          <h2 className="font-display text-2xl">Talk to us</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Methodology, raw audit queries and the roadmap are available on request.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild>
              <a href={`mailto:${CONTACT_EMAIL}?subject=En%20Pensent`}>
                Email the founder <ArrowRight className="h-4 w-4 ml-2" />
              </a>
            </Button>
            <Button asChild variant="outline"><Link to="/whitepaper">Read the whitepaper</Link></Button>
            <Button asChild variant="outline"><Link to="/tournament">See the tournament</Link></Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
