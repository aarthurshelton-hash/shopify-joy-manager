import React from 'react';
import { Link } from 'react-router-dom';
import parkPhone from '@/assets/in-use/park-phone-oldest-game-ink-and-gold.jpg';
import cafeLaptop from '@/assets/in-use/cafe-laptop-opera-game-art-deco.jpg';
import kitchenLaptop from '@/assets/in-use/kitchen-laptop-rotlewi-rubinstein-woodland.jpg';
import sofaPhone from '@/assets/in-use/sofa-phone-evergreen-nordic.jpg';
import streamerDesk from '@/assets/in-use/streamer-desk-pillsbury-tarrasch-stained-glass.jpg';
import orderingOnline from '@/assets/in-use/ordering-online-shop-page.jpg';

interface Shot {
  src: string;
  alt: string;
  caption: string;
  portrait?: boolean;
}

const SHOTS: Shot[] = [
  { src: parkPhone, alt: 'Two friends in a park comparing an En Pensent visualization of the oldest recorded game on a phone', caption: 'Mid-game in the park', portrait: true },
  { src: cafeLaptop, alt: 'Woman at a cafe viewing the Opera Game in the Art Deco palette on a laptop', caption: 'The Opera Game over coffee' },
  { src: kitchenLaptop, alt: 'Father and son pointing at Rubinstein’s Immortal in the Woodland palette on a laptop', caption: 'Family game night' },
  { src: sofaPhone, alt: 'Man on a sofa with his dog viewing the Evergreen Game in the Nordic palette on his phone', caption: 'The Evergreen Game on the sofa', portrait: true },
  { src: streamerDesk, alt: 'Chess streamer presenting Pillsbury vs Tarrasch in the Stained Glass palette', caption: 'Live on stream' },
  { src: orderingOnline, alt: 'Woman ordering a museum print from the En Pensent shop on her laptop', caption: 'Ordering a print' },
];

const EverywhereSection: React.FC = () => (
  <section className="container mx-auto px-4 py-12">
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h3 className="font-editorial text-3xl md:text-4xl">
          Wherever the <span className="italic text-gold-gradient">game</span> is played
        </h3>
        <p className="text-muted-foreground font-serif max-w-xl mx-auto">
          On a phone in the park, a laptop at the kitchen table, or live on stream, every game paints itself in seconds.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 grid-flow-dense gap-3">
        {SHOTS.map((shot) => (
          <figure
            key={shot.src}
            className={`group relative overflow-hidden rounded-lg border border-border/40 bg-card/30 ${
              shot.portrait ? 'row-span-2' : 'aspect-[4/3]'
            }`}
          >
            <img
              src={shot.src}
              alt={shot.alt}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-2 pt-8 text-xs font-display uppercase tracking-wider text-white/90">
              {shot.caption}
            </figcaption>
          </figure>
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-3 pt-2">
        <a
          href="#make-your-own"
          className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Reveal your game
        </a>
        <Link
          to="/shop"
          className="rounded-md border border-primary/40 px-5 py-2.5 text-sm font-medium text-foreground hover:bg-primary/10 transition-colors"
        >
          Shop prints
        </Link>
      </div>
    </div>
  </section>
);

export default EverywhereSection;
