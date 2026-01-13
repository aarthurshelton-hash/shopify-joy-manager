import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, Crown, Award, Sparkles, ShoppingCart, ExternalLink, Eye, 
  Check, Star, Gift, Palette, PenTool, Printer, Globe, Heart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Book3DCover } from './Book3DCover';
import { BookFlipPreview } from './BookFlipPreview';
import { useCartStore, CartItem } from '@/stores/cartStore';
import carlsenCover from '@/assets/book/carlsen-cover-v2.jpg';

// Import game art for backgrounds
import immortalGame from '@/assets/games/immortal-game.jpg';
import operaGame from '@/assets/games/opera-game.jpg';
import evergreenGame from '@/assets/games/evergreen-game.jpg';
import gameOfCentury from '@/assets/games/game-of-century.jpg';
import fischerSpassky from '@/assets/games/fischer-spassky.jpg';
import carlsenKarjakin from '@/assets/games/carlsen-karjakin.jpg';
import kasparovImmortal from '@/assets/games/kasparov-immortal.jpg';

interface BookShowcaseProps {
  variant?: 'hero' | 'compact' | 'featured';
  onOrderClick?: () => void;
  showCTA?: boolean;
}

const SELLING_POINTS = [
  { icon: Crown, text: "100 of Carlsen's greatest games" },
  { icon: Palette, text: "Signature Hot & Cold visualization palette" },
  { icon: PenTool, text: "AI-generated haiku for each game" },
  { icon: Printer, text: "Premium hardcover, museum-quality print" },
  { icon: Gift, text: "Perfect gift for chess enthusiasts" },
];

const TESTIMONIALS = [
  { quote: "A masterpiece of chess art.", author: "Chess.com Editor" },
  { quote: "The perfect fusion of sport and design.", author: "Art Collector" },
];

// Book edition product data from Shopify
const BOOK_EDITIONS = {
  standard: {
    variantId: 'gid://shopify/ProductVariant/46478683537570',
    productId: 'gid://shopify/Product/8892237185186',
    title: 'Carlsen in Color: Standard Edition',
    variantTitle: 'Standard 8.5×11',
    price: '79.99',
    size: '8.5" × 11"',
    handle: 'carlsen-in-color-standard-edition',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0701/8276/4706/files/carlsen-cover.jpg?v=1768242062',
  },
  large: {
    variantId: 'gid://shopify/ProductVariant/46478683603106',
    productId: 'gid://shopify/Product/8892237217954',
    title: 'Carlsen in Color: Large Format Edition',
    variantTitle: 'Large 11×14',
    price: '99.99',
    size: '11" × 14"',
    handle: 'carlsen-in-color-large-format-edition',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0701/8276/4706/files/carlsen-cover.jpg?v=1768242062',
  },
};

type EditionType = 'standard' | 'large';

export const BookShowcase: React.FC<BookShowcaseProps> = ({
  variant = 'featured',
  onOrderClick,
  showCTA = true,
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [selectedEdition, setSelectedEdition] = useState<EditionType>('large');
  const addItem = useCartStore(state => state.addItem);

  const handleAddToCart = () => {
    const edition = BOOK_EDITIONS[selectedEdition];
    
    const cartItem: CartItem = {
      product: {
        node: {
          id: edition.productId,
          title: edition.title,
          description: `Premium hardcover book, ${edition.size}`,
          handle: edition.handle,
          priceRange: {
            minVariantPrice: {
              amount: edition.price,
              currencyCode: 'USD',
            },
          },
          images: {
            edges: edition.imageUrl ? [{
              node: {
                url: edition.imageUrl,
                altText: edition.title,
              },
            }] : [],
          },
          variants: {
            edges: [{
              node: {
                id: edition.variantId,
                title: edition.variantTitle,
                price: {
                  amount: edition.price,
                  currencyCode: 'USD',
                },
                availableForSale: true,
                selectedOptions: [{ name: 'Title', value: edition.variantTitle }],
              },
            }],
          },
          options: [{ name: 'Title', values: [edition.variantTitle] }],
        },
      },
      variantId: edition.variantId,
      variantTitle: edition.variantTitle,
      price: {
        amount: edition.price,
        currencyCode: 'USD',
      },
      quantity: 1,
      selectedOptions: [{ name: 'Title', value: edition.variantTitle }],
    };
    
    addItem(cartItem);
  };

  const handleOrder = () => {
    if (onOrderClick) {
      onOrderClick();
    } else {
      handleAddToCart();
    }
  };

  const previewModalContent = (
    <Dialog open={showPreview} onOpenChange={setShowPreview}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-amber-500/20">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-amber-500/20 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-serif text-xl font-bold text-white">Carlsen in Color</h2>
                <p className="text-amber-400/80 text-sm">100 Masterpieces • Coffee Table Edition</p>
              </div>
            </div>
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg">
              <Sparkles className="w-3 h-3 mr-1" />
              NEW RELEASE
            </Badge>
          </div>
        </div>
        
        <div className="grid lg:grid-cols-5 gap-0">
          {/* Preview Section - Takes up more space */}
          <div className="lg:col-span-3 p-6 bg-gradient-to-br from-amber-50 to-orange-50">
            <BookFlipPreview />
          </div>
          
          {/* Sales Card */}
          <div className="lg:col-span-2 p-6 space-y-6">
            {/* Rating */}
            <div className="flex items-center gap-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-amber-200/80 text-sm">Collector's Choice</span>
            </div>
            
            {/* Key Selling Points - with faded art background */}
            <div className="relative rounded-xl overflow-hidden border border-amber-500/20">
              {/* Faded background art */}
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-[0.18]"
                style={{ backgroundImage: `url(${immortalGame})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900/85 to-slate-800/90" />
              
              <div className="relative p-4 space-y-3">
                {SELLING_POINTS.map((point, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-3 text-slate-200"
                  >
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                      <point.icon className="w-4 h-4 text-amber-400" />
                    </div>
                    <span className="text-sm">{point.text}</span>
                  </motion.div>
                ))}
              </div>
            </div>
            
            <Separator className="bg-slate-700" />
            
            {/* Testimonial - with faded art background */}
            <div className="relative rounded-lg overflow-hidden border border-slate-700">
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-[0.20]"
                style={{ backgroundImage: `url(${operaGame})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-800/85 to-slate-900/90" />
              <div className="relative p-4">
                <div className="flex items-start gap-2">
                  <Heart className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-slate-300 text-sm italic">"{TESTIMONIALS[0].quote}"</p>
                    <p className="text-amber-400/70 text-xs mt-1">— {TESTIMONIALS[0].author}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Pricing Cards - with stunning AI art */}
            <div className="space-y-3">
              {/* Standard Edition */}
              <motion.div
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedEdition('standard')}
              >
                <Card className={`group relative overflow-hidden cursor-pointer transition-all duration-500 ${
                  selectedEdition === 'standard'
                    ? 'border-2 border-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.45)] ring-3 ring-amber-400/25'
                    : 'bg-slate-800/50 border border-slate-700 hover:border-slate-500'
                }`}>
                  {/* AI Art Background */}
                  <div 
                    className={`absolute inset-0 bg-cover bg-center scale-105 transition-all duration-700 ${
                      selectedEdition === 'standard' 
                        ? 'opacity-35 group-hover:scale-110' 
                        : 'opacity-20 group-hover:opacity-30 group-hover:scale-105'
                    }`}
                    style={{ backgroundImage: `url(${carlsenKarjakin})` }}
                  />
                  <div className={`absolute inset-0 transition-all duration-500 ${
                    selectedEdition === 'standard'
                      ? 'bg-gradient-to-r from-slate-900/65 via-slate-800/55 to-amber-900/45'
                      : 'bg-gradient-to-r from-slate-800/85 to-slate-900/90'
                  }`} />
                  
                  {/* Shimmer Effect */}
                  {selectedEdition === 'standard' && (
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/15 to-transparent"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                    />
                  )}
                  
                  {/* Selection Check */}
                  {selectedEdition === 'standard' && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-2 left-2 w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center z-10 shadow-lg"
                    >
                      <Check className="w-4 h-4 text-white" />
                    </motion.div>
                  )}
                  
                  <CardContent className="relative p-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className={`font-medium ${selectedEdition === 'standard' ? 'text-amber-100' : 'text-white'}`}>Standard Edition</p>
                        {selectedEdition === 'standard' && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-300">♔ Classic</span>
                        )}
                      </div>
                      <p className={`text-sm ${selectedEdition === 'standard' ? 'text-amber-200/70' : 'text-slate-400'}`}>8.5" × 11" Hardcover</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${selectedEdition === 'standard' ? 'text-amber-100' : 'text-white'}`}>$79.99</p>
                      <p className="text-xs text-slate-500">+ shipping</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              
              {/* Large Format - Premium */}
              <motion.div
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedEdition('large')}
              >
                <Card className={`group relative overflow-hidden cursor-pointer transition-all duration-500 ${
                  selectedEdition === 'large'
                    ? 'border-2 border-amber-400 shadow-[0_0_35px_rgba(251,191,36,0.55),0_0_60px_rgba(249,115,22,0.25)] ring-3 ring-amber-400/30'
                    : 'bg-gradient-to-r from-amber-600/20 to-orange-600/20 border border-amber-500/50 hover:border-amber-400'
                }`}>
                  {/* AI Art Background */}
                  <div 
                    className={`absolute inset-0 bg-cover bg-center scale-105 transition-all duration-700 ${
                      selectedEdition === 'large' 
                        ? 'opacity-45 group-hover:scale-110' 
                        : 'opacity-25 group-hover:opacity-35 group-hover:scale-105'
                    }`}
                    style={{ backgroundImage: `url(${kasparovImmortal})` }}
                  />
                  <div className={`absolute inset-0 transition-all duration-500 ${
                    selectedEdition === 'large'
                      ? 'bg-gradient-to-r from-amber-900/55 via-orange-900/45 to-amber-800/55'
                      : 'bg-gradient-to-r from-amber-900/70 to-orange-900/80'
                  }`} />
                  
                  {/* Animated Shimmer */}
                  {selectedEdition === 'large' && (
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-300/20 to-transparent"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.5 }}
                    />
                  )}
                  
                  {/* Popular Badge */}
                  <div className="absolute top-0 right-0 z-20">
                    <div className="relative">
                      <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">
                        ★ POPULAR
                      </div>
                    </div>
                  </div>
                  
                  {/* Selection Check */}
                  {selectedEdition === 'large' && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-2 left-2 w-6 h-6 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center z-10 shadow-lg shadow-amber-400/50"
                    >
                      <Check className="w-4 h-4 text-slate-900" />
                    </motion.div>
                  )}
                  
                  <CardContent className="relative p-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-amber-100 font-medium">Large Format</p>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-400/30 text-amber-200 border border-amber-400/30">♔ Premium</span>
                      </div>
                      <p className="text-amber-200/60 text-sm">11" × 14" Premium</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-amber-100">$99.99</p>
                      <p className="text-xs text-amber-200/50">+ shipping</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
            
            {/* CTA Buttons */}
            <div className="space-y-3 pt-2">
              <Button 
                onClick={handleOrder}
                size="lg"
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg shadow-amber-600/25 h-12 text-base"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Order Your Copy
              </Button>
              
              <div className="flex items-center justify-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Check className="w-3 h-3 text-green-500" />
                  Secure checkout
                </span>
                <span className="flex items-center gap-1">
                  <Globe className="w-3 h-3 text-blue-400" />
                  Worldwide shipping
                </span>
              </div>
            </div>
            
            {/* Publisher Info - with art background */}
            <div className="relative rounded-lg overflow-hidden border-t border-slate-800 pt-4">
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-[0.05]"
                style={{ backgroundImage: `url(${fischerSpassky})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/95 to-transparent" />
              <div className="relative text-center">
                <p className="text-xs text-slate-500">Published by</p>
                <p className="text-sm text-amber-400 font-serif tracking-wider">♔ EN PENSENT ♕</p>
              </div>
            </div>
          </div>
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
              
              {/* Pricing Cards - with stunning AI art backgrounds */}
              <div className="flex flex-col sm:flex-row gap-5 pt-4">
                {/* Standard Edition Card */}
                <motion.div
                  className="flex-1"
                  whileHover={{ scale: 1.04, y: -4 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelectedEdition('standard')}
                >
                  <Card className={`group relative overflow-hidden cursor-pointer transition-all duration-500 h-full ${
                    selectedEdition === 'standard'
                      ? 'border-2 border-amber-400 shadow-[0_0_35px_rgba(251,191,36,0.5),0_0_60px_rgba(251,191,36,0.2)] ring-4 ring-amber-400/30'
                      : 'border border-slate-600/50 hover:border-amber-500/50 shadow-lg hover:shadow-amber-500/20'
                  }`}>
                    {/* AI Art Background Layer */}
                    <div 
                      className={`absolute inset-0 bg-cover bg-center scale-110 transition-all duration-700 ${
                        selectedEdition === 'standard' 
                          ? 'opacity-40 group-hover:scale-125' 
                          : 'opacity-25 group-hover:opacity-35 group-hover:scale-115'
                      }`}
                      style={{ backgroundImage: `url(${carlsenKarjakin})` }}
                    />
                    
                    {/* Gradient Overlay */}
                    <div className={`absolute inset-0 transition-all duration-500 ${
                      selectedEdition === 'standard'
                        ? 'bg-gradient-to-br from-slate-900/70 via-slate-800/60 to-amber-900/50'
                        : 'bg-gradient-to-br from-slate-900/85 via-slate-800/80 to-slate-900/85'
                    }`} />
                    
                    {/* Shimmer Effect when selected */}
                    {selectedEdition === 'standard' && (
                      <motion.div 
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/20 to-transparent"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                      />
                    )}
                    
                    {/* Corner Accent */}
                    <div className={`absolute top-0 left-0 w-16 h-16 transition-opacity duration-300 ${
                      selectedEdition === 'standard' ? 'opacity-100' : 'opacity-0'
                    }`}>
                      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-amber-400 to-transparent" />
                      <div className="absolute top-0 left-0 w-[2px] h-full bg-gradient-to-b from-amber-400 to-transparent" />
                    </div>
                    
                    {/* Selection Badge */}
                    {selectedEdition === 'standard' && (
                      <motion.div 
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className="absolute top-3 right-3 w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center z-10 shadow-lg shadow-amber-500/50"
                      >
                        <Check className="w-4 h-4 text-white" />
                      </motion.div>
                    )}
                    
                    <CardContent className="relative p-5 text-center space-y-1">
                      <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-2 transition-colors ${
                        selectedEdition === 'standard' 
                          ? 'bg-amber-500/30 text-amber-200' 
                          : 'bg-slate-700/50 text-slate-400'
                      }`}>
                        ♔ Classic
                      </div>
                      <p className={`text-lg font-serif font-semibold transition-colors ${
                        selectedEdition === 'standard' ? 'text-amber-100' : 'text-slate-200'
                      }`}>Standard Edition</p>
                      <p className={`text-sm transition-colors ${
                        selectedEdition === 'standard' ? 'text-amber-200/80' : 'text-slate-500'
                      }`}>8.5" × 11" Hardcover</p>
                      <p className={`text-3xl font-bold pt-2 transition-colors ${
                        selectedEdition === 'standard' ? 'text-amber-100' : 'text-white'
                      }`}>$79<span className="text-lg">.99</span></p>
                    </CardContent>
                  </Card>
                </motion.div>
                
                {/* Large Format Card - Premium */}
                <motion.div
                  className="flex-1"
                  whileHover={{ scale: 1.04, y: -4 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelectedEdition('large')}
                >
                  <Card className={`group relative overflow-hidden cursor-pointer transition-all duration-500 h-full ${
                    selectedEdition === 'large'
                      ? 'border-2 border-amber-400 shadow-[0_0_40px_rgba(251,191,36,0.6),0_0_80px_rgba(249,115,22,0.3)] ring-4 ring-amber-400/40'
                      : 'border border-amber-600/40 hover:border-amber-500 shadow-lg shadow-orange-500/10 hover:shadow-amber-500/25'
                  }`}>
                    {/* AI Art Background Layer */}
                    <div 
                      className={`absolute inset-0 bg-cover bg-center scale-110 transition-all duration-700 ${
                        selectedEdition === 'large' 
                          ? 'opacity-50 group-hover:scale-125' 
                          : 'opacity-30 group-hover:opacity-40 group-hover:scale-115'
                      }`}
                      style={{ backgroundImage: `url(${kasparovImmortal})` }}
                    />
                    
                    {/* Premium Gold Gradient Overlay */}
                    <div className={`absolute inset-0 transition-all duration-500 ${
                      selectedEdition === 'large'
                        ? 'bg-gradient-to-br from-amber-900/60 via-orange-900/50 to-amber-800/60'
                        : 'bg-gradient-to-br from-amber-900/75 via-orange-900/70 to-amber-900/75'
                    }`} />
                    
                    {/* Animated Shimmer when selected */}
                    {selectedEdition === 'large' && (
                      <motion.div 
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-300/25 to-transparent"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.5 }}
                      />
                    )}
                    
                    {/* Corner Accents */}
                    <div className={`absolute top-0 left-0 w-20 h-20 transition-opacity duration-300 ${
                      selectedEdition === 'large' ? 'opacity-100' : 'opacity-50'
                    }`}>
                      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-amber-400 to-transparent" />
                      <div className="absolute top-0 left-0 w-[2px] h-full bg-gradient-to-b from-amber-400 to-transparent" />
                    </div>
                    <div className={`absolute bottom-0 right-0 w-20 h-20 transition-opacity duration-300 ${
                      selectedEdition === 'large' ? 'opacity-100' : 'opacity-50'
                    }`}>
                      <div className="absolute bottom-0 right-0 w-full h-[2px] bg-gradient-to-l from-amber-400 to-transparent" />
                      <div className="absolute bottom-0 right-0 w-[2px] h-full bg-gradient-to-t from-amber-400 to-transparent" />
                    </div>
                    
                    {/* Popular Badge */}
                    <div className="absolute -top-1 -right-1 z-20">
                      <div className="relative">
                        <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 text-slate-900 text-[10px] font-bold px-3 py-1 rounded-bl-lg rounded-tr shadow-lg">
                          ★ POPULAR
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-300 to-orange-400 blur-sm opacity-50 -z-10" />
                      </div>
                    </div>
                    
                    {/* Selection Badge */}
                    {selectedEdition === 'large' && (
                      <motion.div 
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className="absolute top-10 right-3 w-8 h-8 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center z-10 shadow-lg shadow-amber-400/60"
                      >
                        <Check className="w-5 h-5 text-slate-900" />
                      </motion.div>
                    )}
                    
                    <CardContent className="relative p-5 text-center space-y-1">
                      <div className="inline-block px-3 py-1 rounded-full text-xs font-medium mb-2 bg-amber-400/30 text-amber-200 border border-amber-400/30">
                        ♔ Premium
                      </div>
                      <p className="text-lg font-serif font-semibold text-amber-100">Large Format</p>
                      <p className="text-sm text-amber-200/80">11" × 14" Premium</p>
                      <p className="text-3xl font-bold pt-2 text-amber-50">$99<span className="text-lg">.99</span></p>
                    </CardContent>
                  </Card>
                </motion.div>
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
        {previewModalContent}
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
              <Button size="sm" variant="outline" onClick={() => setShowPreview(true)}>
                <ExternalLink className="w-3 h-3 mr-1" />
                Order
              </Button>
            </div>
          )}
        </motion.div>
        {previewModalContent}
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
                <Button onClick={() => setShowPreview(true)} className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700">
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
      {previewModalContent}
    </>
  );
};

export default BookShowcase;