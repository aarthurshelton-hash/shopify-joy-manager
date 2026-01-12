import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Crown, Award, Sparkles, ShoppingCart, ExternalLink, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Book3DCover } from './Book3DCover';
import { BookFlipPreview } from './BookFlipPreview';
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
  const [showPreview, setShowPreview] = useState(false);

  const handleOrder = () => {
    if (onOrderClick) {
      onOrderClick();
    } else {
      window.open('https://printify-shop-manager-fs4kw.myshopify.com/collections/all?tag=book', '_blank');
    }
  };

  const PreviewModal = () => (
    <Dialog open={showPreview} onOpenChange={setShowPreview}>
      <DialogContent className="max-w-3xl bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif text-amber-900">
            <BookOpen className="w-5 h-5" />
            Preview: Carlsen in Color
          </DialogTitle>
        </DialogHeader>
        <BookFlipPreview />
        <div className="flex justify-center pt-4">
          <Button 
            onClick={handleOrder}
            className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-lg"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Order Now from $79.99
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  if (variant === 'hero') {
    return (
      <motion.section 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="relative py-20 overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
      >
        {/* Ambient lighting effects */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(251,191,36,0.15),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(249,115,22,0.1),transparent_50%)]" />
        </div>
        
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* 3D Book Cover */}
            <motion.div 
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative flex justify-center lg:justify-end"
            >
              <div className="relative">
                <Book3DCover 
                  onClick={() => setShowPreview(true)}
                  size="lg"
                />
                
                {/* NEW Badge */}
                <Badge className="absolute -top-4 -right-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 shadow-lg z-20 text-sm">
                  <Sparkles className="w-4 h-4 mr-1" />
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
              <div className="flex items-center gap-2 text-amber-500">
                <Crown className="w-5 h-5" />
                <span className="text-sm font-medium uppercase tracking-wider">Collector's Edition</span>
              </div>
              
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-white">
                Carlsen in Color
              </h2>
              
              <p className="text-xl text-amber-200/80 font-serif italic">
                100 Masterpieces of Magnus Carlsen
              </p>
              
              <p className="text-slate-300 leading-relaxed">
                A stunning coffee table book featuring En Pensent visualizations of the 
                greatest games from the world champion's legendary career. Each spread 
                pairs AI-generated haiku poetry with the signature Hot & Cold palette.
              </p>
              
              <div className="flex flex-wrap gap-3">
                <Badge variant="outline" className="text-sm border-amber-500/50 text-amber-200 bg-amber-500/10">
                  <BookOpen className="w-3 h-3 mr-1" />
                  100 Spreads
                </Badge>
                <Badge variant="outline" className="text-sm border-amber-500/50 text-amber-200 bg-amber-500/10">
                  <Award className="w-3 h-3 mr-1" />
                  Premium Hardcover
                </Badge>
                <Badge variant="outline" className="text-sm border-amber-500/50 text-amber-200 bg-amber-500/10">
                  Museum-Quality Print
                </Badge>
              </div>
              
              {/* Pricing Cards */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Card className="flex-1 bg-slate-800/50 border-slate-700 backdrop-blur">
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-slate-400">Standard Edition</p>
                    <p className="text-sm text-slate-500">8.5" × 11"</p>
                    <p className="text-2xl font-bold text-white">$79.99</p>
                  </CardContent>
                </Card>
                <Card className="flex-1 bg-gradient-to-br from-amber-600/20 to-orange-600/20 border-amber-500/50 backdrop-blur">
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-amber-400 font-medium">Large Format</p>
                    <p className="text-sm text-amber-200/70">11" × 14"</p>
                    <p className="text-2xl font-bold text-amber-100">$99.99</p>
                  </CardContent>
                </Card>
              </div>
              
              {showCTA && (
                <div className="flex flex-wrap gap-3 pt-4">
                  <Button 
                    size="lg" 
                    onClick={handleOrder}
                    className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-lg shadow-amber-600/25"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Order Now
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline"
                    onClick={() => setShowPreview(true)}
                    className="border-amber-500/50 text-amber-200 hover:bg-amber-500/10"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview Pages
                  </Button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
        <PreviewModal />
      </motion.section>
    );
  }

  if (variant === 'compact') {
    return (
      <>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200"
        >
          <button onClick={() => setShowPreview(true)} className="flex-shrink-0 hover:scale-105 transition-transform">
            <img 
              src={carlsenCover} 
              alt="Carlsen in Color"
              className="w-20 h-auto rounded-lg shadow-md"
            />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-serif font-bold text-foreground truncate">Carlsen in Color</h4>
              <Badge className="bg-amber-500 text-white text-xs">NEW</Badge>
            </div>
            <p className="text-sm text-muted-foreground">100 Masterpieces • From $79.99</p>
          </div>
          {showCTA && (
            <div className="flex gap-2 flex-shrink-0">
              <Button size="sm" variant="ghost" onClick={() => setShowPreview(true)} className="text-amber-700">
                <Eye className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="outline" onClick={handleOrder}>
                <ExternalLink className="w-3 h-3 mr-1" />
                Order
              </Button>
            </div>
          )}
        </motion.div>
        <PreviewModal />
      </>
    );
  }

  // Featured variant (default)
  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-100 via-orange-50 to-amber-50 p-6 border border-amber-200"
      >
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-amber-300/20 to-orange-300/20 rounded-full blur-3xl" />
        
        <div className="relative flex flex-col md:flex-row gap-6">
          <button 
            onClick={() => setShowPreview(true)}
            className="flex-shrink-0 hover:scale-105 transition-transform"
          >
            <img 
              src={carlsenCover} 
              alt="Carlsen in Color"
              className="w-40 h-auto rounded-lg shadow-xl"
            />
          </button>
          
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
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleOrder} className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Order Now
                </Button>
                <Button variant="outline" onClick={() => setShowPreview(true)} className="border-amber-300">
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
      <PreviewModal />
    </>
  );
};

export default BookShowcase;
