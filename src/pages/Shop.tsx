import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Crown,
  Frame,
  Gift,
  Image as ImageIcon,
  Package,
  Palette,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  Wand2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/shop/Header';
import { Footer } from '@/components/shop/Footer';
import LifestyleMockupGallery from '@/components/shop/LifestyleMockupGallery';
import { fetchProducts, type ShopifyProduct } from '@/lib/shopify/api';
import { useCurrencyStore } from '@/stores/currencyStore';
import { DISCOUNT_TIERS } from '@/lib/discounts';
import { getBaseFramePrice } from '@/lib/shop/framePricing';
import { useAuth } from '@/hooks/useAuth';

const SIZE_ORDER = ['8×10"', '11×14"', '12×16"', '16×20"', '18×24"', '24×36"'];

const STEPS = [
  {
    icon: Wand2,
    title: 'Create your vision',
    body: 'Paste any game — or let the engine render one of yours. Every move becomes color-flow art on an 8×8 field.',
    to: '/#make-your-own',
    cta: 'Make one now',
  },
  {
    icon: Frame,
    title: 'Pick size & frame',
    body: 'Six gallery sizes plus optional wood or metallic frames. Wall mockups show the exact piece in a room before you buy.',
    to: '/my-vision',
    cta: 'Order a print',
  },
  {
    icon: Truck,
    title: 'Delivered worldwide',
    body: 'Printed on archival giclée paper and shipped tracked from the closest Printify facility. Free US & Canada shipping.',
    to: '#sizes',
    cta: 'See pricing',
  },
];

const TRUST = [
  { icon: Package, label: 'Museum-quality archival paper — 100+ year color guarantee' },
  { icon: Palette, label: 'Fade-resistant giclée inks, exact palette fidelity' },
  { icon: Truck, label: 'Free shipping to USA & Canada, tracked worldwide' },
  { icon: ShieldCheck, label: 'Secure checkout via Shopify' },
];

const Shop: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { formatPrice } = useCurrencyStore();
  const [product, setProduct] = useState<ShopifyProduct['node'] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchProducts(10);
        const print =
          data.find((p) => p.node.handle === 'chess-game-visualization-print') ||
          data.find((p) => p.node.handle.includes('chess')) ||
          data[0];
        setProduct(print?.node ?? null);
      } catch (e) {
        console.error('[Shop] product fetch failed:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const variants = useMemo(() => {
    const vs = product?.variants.edges.map((e) => e.node) ?? [];
    return [...vs].sort(
      (a, b) => SIZE_ORDER.indexOf(a.title) - SIZE_ORDER.indexOf(b.title),
    );
  }, [product]);

  const minPrice = product?.priceRange.minVariantPrice.amount;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 via-background to-background pointer-events-none" />
        <div className="container mx-auto px-4 pt-14 pb-10 md:pt-20 md:pb-14 max-w-6xl relative">
          <motion.div
            className="text-center space-y-5"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 px-3 py-1 text-xs tracking-wider uppercase">
              <Crown className="h-3 w-3 mr-1" />
              Limited-run wall art
            </Badge>
            <h1 className="text-3xl sm:text-5xl font-display font-bold tracking-tight">
              Your games, <span className="text-gold-gradient">as museum prints</span>
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
              Every chess game produces a one-of-one color-flow artwork — mathematically
              unique to the moves played. Printed on archival paper, framed to order,
              shipped worldwide.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button
                size="lg"
                className="gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-stone-900 hover:from-amber-400 hover:to-amber-500 font-semibold"
                onClick={() => navigate(user ? '/my-vision' : '/#make-your-own')}
              >
                <Sparkles className="h-4 w-4" />
                {user ? 'Print one of my visions' : 'Create your vision'}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="gap-2"
                onClick={() => document.getElementById('sizes')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <ShoppingBag className="h-4 w-4" />
                {minPrice ? `From ${formatPrice(parseFloat(minPrice))}` : 'See pricing'}
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="container mx-auto px-4 py-10 max-w-6xl">
        <div className="grid md:grid-cols-3 gap-4">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="h-full border-border/60 hover:border-amber-500/40 transition-colors">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-stone-900 font-bold text-sm">
                      {i + 1}
                    </div>
                    <s.icon className="h-5 w-5 text-amber-500" />
                  </div>
                  <h3 className="font-display font-semibold">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
                  <Link
                    to={s.to}
                    className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 hover:text-amber-500"
                  >
                    {s.cta} <ArrowRight className="h-3 w-3" />
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══ SIZES & PRICING ═══ */}
      <section id="sizes" className="container mx-auto px-4 py-10 max-w-6xl scroll-mt-20">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-display font-bold">Sizes & pricing</h2>
          <p className="text-muted-foreground text-sm mt-2">
            One artwork, six gallery sizes. Add a frame and info card at order time.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-28 rounded-xl bg-muted/40 animate-pulse" />
            ))}
          </div>
        ) : variants.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center text-muted-foreground text-sm">
              <ImageIcon className="h-8 w-8 mx-auto mb-3 opacity-50" />
              Prints are being restocked — check back shortly.
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {variants.map((v, i) => (
                <motion.div
                  key={v.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card
                    className={`text-center hover:border-amber-500/50 transition-all hover:shadow-lg hover:shadow-amber-500/5 ${
                      !v.availableForSale ? 'opacity-50' : ''
                    }`}
                  >
                    <CardContent className="p-4 space-y-1.5">
                      <div
                        className="mx-auto border-2 border-stone-300 dark:border-stone-600 rounded-sm bg-muted/30"
                        style={{
                          width: `${14 + i * 4}px`,
                          height: `${18 + i * 5}px`,
                        }}
                      />
                      <div className="font-display font-semibold text-sm">{v.title}</div>
                      <div className="text-amber-600 dark:text-amber-400 font-bold">
                        {formatPrice(parseFloat(v.price.amount))}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        + frame from {formatPrice(getBaseFramePrice(v.title))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Bulk discount strip */}
            <div className="mt-6 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 p-4 flex flex-col sm:flex-row items-center justify-center gap-3 text-center sm:text-left">
              <Gift className="h-5 w-5 text-primary flex-shrink-0" />
              <p className="text-sm">
                <span className="font-semibold">Bundle & save</span> — automatic volume
                discounts up to {DISCOUNT_TIERS[DISCOUNT_TIERS.length - 1].discountPercent}%,
                plus frame add-ons ship free in sets of 3+.
              </p>
            </div>
          </>
        )}
      </section>

      {/* ═══ LIFESTYLE MOCKUPS ═══ */}
      <section className="container mx-auto px-4 py-10 max-w-6xl">
        <LifestyleMockupGallery showTitle={true} />
      </section>

      {/* ═══ TRUST STRIP ═══ */}
      <section className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {TRUST.map((t) => (
            <div
              key={t.label}
              className="flex items-start gap-3 p-4 rounded-lg bg-muted/30 border border-border/50"
            >
              <t.icon className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <span className="text-xs text-muted-foreground leading-relaxed">{t.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="container mx-auto px-4 pb-16 max-w-4xl">
        <Card className="overflow-hidden border-amber-500/30">
          <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent">
            <CardContent className="p-8 sm:p-10 text-center space-y-4">
              <h2 className="text-2xl sm:text-3xl font-display font-bold">
                Turn a game you love into the art on your wall
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto">
                Famous matches, your own games, even live tournament boards — each renders
                a signature nobody else can own.
              </p>
              <Button
                size="lg"
                className="gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-stone-900 hover:from-amber-400 hover:to-amber-500 font-semibold"
                onClick={() => navigate(user ? '/my-vision' : '/#make-your-own')}
              >
                <Sparkles className="h-4 w-4" />
                {user ? 'Choose a vision to print' : 'Create your first vision — free'}
              </Button>
            </CardContent>
          </div>
        </Card>
      </section>

      <Footer />
    </div>
  );
};

export default Shop;
