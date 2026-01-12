import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Crown, Award, Sparkles, ShoppingCart, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import carlsenCover from '@/assets/book/carlsen-cover.jpg';

interface BookShowcaseProps {
  variant?: 'hero' | 'compact' | 'featured';
  onOrderClick?: () => void;
  showCTA?: boolean;
}

export const BookShowcase: React.FC<BookShowcaseProps> = ({
  variant = 'featured',
  onOrderClick,
  showCTA = true,
}) => {
  const handleOrder = () => {
    if (onOrderClick) {
      onOrderClick();
    } else {
      // Open Shopify store with book products
      window.open('https://printify-shop-manager-fs4kw.myshopify.com/collections/all?tag=book', '_blank');
    }
  };

  if (variant === 'hero') {
    return (
      <motion.section 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="relative py-20 overflow-hidden bg-gradient-to-br from-amber-50 via-background to-orange-50"
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(251,191,36,0.3),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(249,115,22,0.2),transparent_50%)]" />
        </div>
        
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Book Image */}
            <motion.div 
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative max-w-md mx-auto lg:mx-0">
                {/* Shadow/depth effect */}
                <div className="absolute inset-0 translate-x-4 translate-y-4 bg-gradient-to-br from-amber-900/20 to-orange-900/30 rounded-lg blur-xl" />
                
                {/* Book cover */}
                <div className="relative rounded-lg overflow-hidden shadow-2xl transform hover:scale-105 transition-transform duration-500">
                  <img 
                    src={carlsenCover} 
                    alt="Carlsen in Color Book Cover"
                    className="w-full h-auto"
                  />
                  
                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500" />
                </div>
                
                {/* Floating badges */}
                <Badge className="absolute -top-3 -right-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1.5 shadow-lg">
                  <Sparkles className="w-3 h-3 mr-1" />
                  NEW
                </Badge>
              </div>
            </motion.div>
            
            {/* Content */}
            <motion.div 
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-2 text-amber-600">
                <Crown className="w-5 h-5" />
                <span className="text-sm font-medium uppercase tracking-wider">Collector's Edition</span>
              </div>
              
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground">
                Carlsen in Color
              </h2>
              
              <p className="text-xl text-muted-foreground font-serif italic">
                100 Masterpieces of Magnus Carlsen
              </p>
              
              <p className="text-muted-foreground leading-relaxed">
                A stunning coffee table book featuring En Pensent visualizations of the 
                greatest games from the world champion's legendary career. Each spread 
                pairs AI-generated haiku poetry with the signature Hot & Cold palette.
              </p>
              
              <div className="flex flex-wrap gap-3">
                <Badge variant="outline" className="text-sm">
                  <BookOpen className="w-3 h-3 mr-1" />
                  100 Spreads
                </Badge>
                <Badge variant="outline" className="text-sm">
                  <Award className="w-3 h-3 mr-1" />
                  Premium Hardcover
                </Badge>
                <Badge variant="outline" className="text-sm">
                  Museum-Quality Print
                </Badge>
              </div>
              
              {/* Pricing */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Card className="flex-1 bg-card/50 border-amber-200">
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">Standard Edition</p>
                    <p className="text-sm text-muted-foreground">8.5" × 11"</p>
                    <p className="text-2xl font-bold text-foreground">$79.99</p>
                  </CardContent>
                </Card>
                <Card className="flex-1 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-300">
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-amber-700 font-medium">Large Format</p>
                    <p className="text-sm text-muted-foreground">11" × 14"</p>
                    <p className="text-2xl font-bold text-amber-900">$99.99</p>
                  </CardContent>
                </Card>
              </div>
              
              {showCTA && (
                <div className="flex gap-3 pt-4">
                  <Button 
                    size="lg" 
                    onClick={handleOrder}
                    className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-lg"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Order Now
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline"
                    onClick={() => window.location.href = '/book'}
                    className="border-amber-300"
                  >
                    Learn More
                  </Button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </motion.section>
    );
  }

  if (variant === 'compact') {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200"
      >
        <img 
          src={carlsenCover} 
          alt="Carlsen in Color"
          className="w-20 h-auto rounded-lg shadow-md"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-serif font-bold text-foreground truncate">Carlsen in Color</h4>
            <Badge className="bg-amber-500 text-white text-xs">NEW</Badge>
          </div>
          <p className="text-sm text-muted-foreground">100 Masterpieces • From $79.99</p>
        </div>
        {showCTA && (
          <Button size="sm" variant="outline" onClick={handleOrder} className="flex-shrink-0">
            <ExternalLink className="w-3 h-3 mr-1" />
            Order
          </Button>
        )}
      </motion.div>
    );
  }

  // Featured variant (default)
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-100 via-orange-50 to-amber-50 p-6 border border-amber-200"
    >
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-amber-300/20 to-orange-300/20 rounded-full blur-3xl" />
      
      <div className="relative flex flex-col md:flex-row gap-6">
        <div className="flex-shrink-0">
          <img 
            src={carlsenCover} 
            alt="Carlsen in Color"
            className="w-40 h-auto rounded-lg shadow-xl"
          />
        </div>
        
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
              <Sparkles className="w-3 h-3 mr-1" />
              NEW RELEASE
            </Badge>
          </div>
          
          <h3 className="text-2xl font-serif font-bold text-foreground">Carlsen in Color</h3>
          <p className="text-muted-foreground text-sm">
            A premium coffee table book featuring 100 En Pensent visualizations 
            of Magnus Carlsen's greatest games with AI-generated haiku poetry.
          </p>
          
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">
              Standard: <strong className="text-foreground">$79.99</strong>
            </span>
            <span className="text-muted-foreground">
              Large: <strong className="text-amber-700">$99.99</strong>
            </span>
          </div>
          
          {showCTA && (
            <Button onClick={handleOrder} className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Order Now
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default BookShowcase;
