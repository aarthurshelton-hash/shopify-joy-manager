import { Header } from '@/components/shop/Header';
import { Crown, Quote, Star, Newspaper } from 'lucide-react';

const testimonials = [
  {
    quote: "En Pensent turned my favorite Carlsen game into a stunning piece of art. It's the centerpiece of my study now.",
    author: "Michael T.",
    role: "Chess Enthusiast",
    rating: 5,
  },
  {
    quote: "I gifted my husband a print of our first game together. He was speechless. Absolutely beautiful work.",
    author: "Sarah K.",
    role: "Happy Customer",
    rating: 5,
  },
  {
    quote: "The quality of the prints exceeded my expectations. Museum-quality is not an exaggeration.",
    author: "David L.",
    role: "Collector",
    rating: 5,
  },
];

const newsItems = [
  {
    date: "January 2026",
    title: "En Pensent Launches New Medieval Palette",
    description: "Our latest color palette draws inspiration from illuminated manuscripts and royal courts of the Middle Ages.",
  },
  {
    date: "December 2025",
    title: "Featured in Chess Life Magazine",
    description: "En Pensent was highlighted as one of the most innovative chess products of the year.",
  },
  {
    date: "November 2025",
    title: "Partnership with World Chess Federation",
    description: "We're proud to announce our collaboration to create exclusive prints of World Championship games.",
  },
];

const News = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-16">
          {/* Hero */}
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-display uppercase tracking-widest">
              <Newspaper className="h-4 w-4" />
              News & Testimonials
            </div>
            <h1 className="text-4xl md:text-5xl font-royal font-bold uppercase tracking-wide">
              What People Are <span className="text-gold-gradient">Saying</span>
            </h1>
            <p className="text-lg text-muted-foreground font-serif leading-relaxed">
              Hear from our community of chess lovers and art enthusiasts.
            </p>
          </div>
          
          {/* Testimonials */}
          <div className="space-y-8">
            <h2 className="text-2xl font-display font-bold uppercase tracking-wider text-center">
              Customer <span className="text-gold-gradient">Testimonials</span>
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((testimonial, index) => (
                <div 
                  key={index}
                  className="p-6 rounded-lg border border-border/50 bg-card/50 space-y-4 relative"
                >
                  <Quote className="h-8 w-8 text-primary/20 absolute top-4 right-4" />
                  
                  <div className="flex gap-1">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                  
                  <p className="text-muted-foreground font-serif italic leading-relaxed">
                    "{testimonial.quote}"
                  </p>
                  
                  <div className="pt-2 border-t border-border/50">
                    <p className="font-display font-bold">{testimonial.author}</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Latest News */}
          <div className="space-y-8">
            <h2 className="text-2xl font-display font-bold uppercase tracking-wider text-center">
              Latest <span className="text-gold-gradient">News</span>
            </h2>
            
            <div className="space-y-6">
              {newsItems.map((item, index) => (
                <div 
                  key={index}
                  className="p-6 rounded-lg border border-border/50 bg-card/50 hover:border-primary/30 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="md:w-32 flex-shrink-0">
                      <span className="text-xs uppercase tracking-wider text-primary font-medium">
                        {item.date}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-display font-bold text-lg">{item.title}</h3>
                      <p className="text-muted-foreground font-serif">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* CTA */}
          <div className="text-center p-8 rounded-lg border border-primary/30 bg-primary/5 space-y-4">
            <Crown className="h-10 w-10 text-primary mx-auto" />
            <h2 className="text-xl font-display font-bold uppercase tracking-wider">
              Join Our Story
            </h2>
            <p className="text-muted-foreground font-serif max-w-lg mx-auto">
              Create your own chess masterpiece today and become part of the En Pensent community.
            </p>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-border/50 mt-20 bg-card/30">
        <div className="container mx-auto px-4 py-10 text-center space-y-3">
          <p className="text-lg font-royal font-bold tracking-widest uppercase text-gold-gradient">
            ♔ En Pensent ♚
          </p>
          <p className="text-xs text-muted-foreground tracking-widest uppercase font-sans">
            Turn every move into a masterpiece
          </p>
        </div>
      </footer>
    </div>
  );
};

export default News;
