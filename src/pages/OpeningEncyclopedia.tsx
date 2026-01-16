/**
 * Opening Encyclopedia - Browse all recognized chess openings
 * 
 * Displays the complete database of openings with marketing information,
 * famous players, and historical significance. Includes opening-specific
 * collections linking to marketplace visions.
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Search, 
  Crown, 
  History, 
  Filter,
  Sparkles,
  ChevronRight,
  Users,
  Zap,
  Shield,
  Target,
  Shuffle,
  ShoppingBag,
  ArrowRight,
} from 'lucide-react';
import { Header } from '@/components/shop/Header';
import { Footer } from '@/components/shop/Footer';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getAllOpenings, DetectedOpening } from '@/lib/chess/openingDetector';

type CategoryFilter = 'all' | 'open' | 'semi-open' | 'closed' | 'semi-closed' | 'flank' | 'gambit' | 'irregular';

interface OpeningEntry {
  eco: string;
  name: string;
  variation?: string;
  moves: string;
  category: DetectedOpening['category'];
  description: string;
  marketingDescription?: string;
  famousPlayers?: string[];
  historicalSignificance?: string;
}

// Featured opening collections for marketplace
const FEATURED_COLLECTIONS = [
  { name: "Queen's Gambit", query: "queen's gambit", icon: '👸', color: 'from-purple-500/20 to-pink-500/20 border-purple-500/40' },
  { name: 'Sicilian Defense', query: 'sicilian', icon: '🛡️', color: 'from-red-500/20 to-orange-500/20 border-red-500/40' },
  { name: 'Italian Game', query: 'italian', icon: '🏛️', color: 'from-green-500/20 to-emerald-500/20 border-green-500/40' },
  { name: "King's Gambit", query: "king's gambit", icon: '⚔️', color: 'from-amber-500/20 to-yellow-500/20 border-amber-500/40' },
  { name: 'Ruy Lopez', query: 'ruy lopez', icon: '🇪🇸', color: 'from-blue-500/20 to-indigo-500/20 border-blue-500/40' },
  { name: 'London System', query: 'london', icon: '🎩', color: 'from-gray-500/20 to-slate-500/20 border-gray-500/40' },
];

const CATEGORY_INFO: Record<CategoryFilter, { label: string; icon: React.ReactNode; color: string; description: string }> = {
  all: { label: 'All Openings', icon: <BookOpen className="h-4 w-4" />, color: 'text-foreground', description: 'Browse all recognized chess openings' },
  open: { label: 'Open Games', icon: <Target className="h-4 w-4" />, color: 'text-green-400', description: 'Classical 1.e4 e5 positions with open files and diagonals' },
  'semi-open': { label: 'Semi-Open', icon: <Shield className="h-4 w-4" />, color: 'text-blue-400', description: 'Asymmetrical responses to 1.e4 (Sicilian, French, Caro-Kann)' },
  closed: { label: 'Closed', icon: <Shield className="h-4 w-4" />, color: 'text-purple-400', description: 'Strategic 1.d4 d5 positions with locked pawn structures' },
  'semi-closed': { label: 'Semi-Closed', icon: <Shield className="h-4 w-4" />, color: 'text-violet-400', description: 'Indian defenses and hypermodern systems' },
  flank: { label: 'Flank', icon: <Shuffle className="h-4 w-4" />, color: 'text-amber-400', description: 'English, Réti, and other flank openings' },
  gambit: { label: 'Gambits', icon: <Zap className="h-4 w-4" />, color: 'text-orange-400', description: 'Sacrifice material for initiative and attack' },
  irregular: { label: 'Irregular', icon: <Sparkles className="h-4 w-4" />, color: 'text-pink-400', description: 'Unusual and surprise openings' },
};

const OpeningEncyclopedia: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [expandedOpening, setExpandedOpening] = useState<string | null>(null);

  // Get all openings from database
  const allOpenings = useMemo(() => getAllOpenings(), []);

  // Filter and group openings
  const filteredOpenings = useMemo(() => {
    let result = [...allOpenings];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(o => 
        o.name.toLowerCase().includes(query) ||
        (o.variation && o.variation.toLowerCase().includes(query)) ||
        o.eco.toLowerCase().includes(query) ||
        o.description.toLowerCase().includes(query) ||
        (o.famousPlayers && o.famousPlayers.some(p => p.toLowerCase().includes(query)))
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      result = result.filter(o => o.category === selectedCategory);
    }

    return result;
  }, [allOpenings, searchQuery, selectedCategory]);

  // Group by main opening name
  const groupedOpenings = useMemo(() => {
    const groups: Record<string, OpeningEntry[]> = {};
    filteredOpenings.forEach(o => {
      if (!groups[o.name]) {
        groups[o.name] = [];
      }
      groups[o.name].push(o);
    });
    return groups;
  }, [filteredOpenings]);

  // Stats
  const stats = useMemo(() => ({
    total: allOpenings.length,
    gambits: allOpenings.filter(o => o.category === 'gambit').length,
    withFamousPlayers: allOpenings.filter(o => o.famousPlayers && o.famousPlayers.length > 0).length,
    uniqueNames: new Set(allOpenings.map(o => o.name)).size,
  }), [allOpenings]);

  const getCategoryStyle = (category: string) => {
    switch (category) {
      case 'gambit': return 'from-orange-500/20 to-red-500/20 border-orange-500/40';
      case 'open': return 'from-green-500/20 to-emerald-500/20 border-green-500/40';
      case 'semi-open': return 'from-blue-500/20 to-cyan-500/20 border-blue-500/40';
      case 'closed': return 'from-purple-500/20 to-indigo-500/20 border-purple-500/40';
      case 'semi-closed': return 'from-violet-500/20 to-purple-500/20 border-violet-500/40';
      case 'flank': return 'from-amber-500/20 to-yellow-500/20 border-amber-500/40';
      case 'irregular': return 'from-pink-500/20 to-rose-500/20 border-pink-500/40';
      default: return 'from-gray-500/20 to-slate-500/20 border-gray-500/40';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative border-b border-border/40 overflow-hidden bg-gradient-to-b from-amber-500/5 to-transparent">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent" />
        
        <div className="relative container mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <BookOpen className="h-7 w-7 text-stone-900" />
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight mb-3">
              Opening Encyclopedia
            </h1>
            <p className="text-muted-foreground text-lg mb-6">
              Explore {stats.uniqueNames} chess openings with rich historical context and strategic insights
            </p>
            
            {/* Stats */}
            <div className="flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                <span><strong>{stats.total}</strong> variations</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-orange-400" />
                <span><strong>{stats.gambits}</strong> gambits</span>
              </div>
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-amber-400" />
                <span><strong>{stats.withFamousPlayers}</strong> with champions</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Opening Collections - Link to Marketplace */}
      <section className="border-b border-border/40 py-8 bg-gradient-to-b from-transparent to-muted/20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" />
              Opening Collections
            </h2>
            <Link to="/marketplace">
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                View Marketplace
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Explore visions featuring famous book openings
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {FEATURED_COLLECTIONS.map((collection) => (
              <Link
                key={collection.name}
                to={`/marketplace?opening=${encodeURIComponent(collection.query)}`}
              >
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-3 rounded-lg border bg-gradient-to-br ${collection.color} cursor-pointer transition-shadow hover:shadow-lg`}
                >
                  <div className="text-2xl mb-1">{collection.icon}</div>
                  <p className="font-medium text-sm truncate">{collection.name}</p>
                  <p className="text-[10px] text-muted-foreground">Browse collection →</p>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Search and Filters */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search openings, players, or ECO codes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            {(Object.keys(CATEGORY_INFO) as CategoryFilter[]).map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className="gap-1.5 whitespace-nowrap"
              >
                {CATEGORY_INFO[cat].icon}
                <span className="hidden sm:inline">{CATEGORY_INFO[cat].label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Category description */}
        {selectedCategory !== 'all' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-6 p-3 rounded-lg bg-muted/50 border border-border/50"
          >
            <div className="flex items-center gap-2">
              <span className={CATEGORY_INFO[selectedCategory].color}>
                {CATEGORY_INFO[selectedCategory].icon}
              </span>
              <span className="font-medium">{CATEGORY_INFO[selectedCategory].label}</span>
              <span className="text-muted-foreground text-sm">—</span>
              <span className="text-muted-foreground text-sm">{CATEGORY_INFO[selectedCategory].description}</span>
            </div>
          </motion.div>
        )}

        {/* Results count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            Showing {filteredOpenings.length} variations in {Object.keys(groupedOpenings).length} opening families
          </p>
        </div>

        {/* Openings Grid */}
        <div className="grid gap-4">
          <AnimatePresence mode="popLayout">
            {Object.entries(groupedOpenings).map(([name, variations], index) => {
              const mainOpening = variations.find(v => !v.variation) || variations[0];
              const isExpanded = expandedOpening === name;
              const hasVariations = variations.length > 1;
              
              return (
                <motion.div
                  key={name}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.02 }}
                >
                  <Card className={`overflow-hidden border bg-gradient-to-r ${getCategoryStyle(mainOpening.category)} hover:shadow-lg transition-shadow`}>
                    <CardContent className="p-0">
                      {/* Main opening header */}
                      <button
                        onClick={() => setExpandedOpening(isExpanded ? null : name)}
                        className="w-full p-4 text-left flex items-start gap-4 hover:bg-background/30 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-display font-semibold text-lg">{name}</h3>
                            <Badge variant="outline" className="text-[10px]">{mainOpening.eco}</Badge>
                            <Badge variant="secondary" className="text-[10px] capitalize">{mainOpening.category}</Badge>
                            {hasVariations && (
                              <Badge variant="secondary" className="text-[10px]">
                                {variations.length} variations
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-2">{mainOpening.description}</p>
                          
                          {mainOpening.marketingDescription && (
                            <p className="text-sm text-foreground/90 mb-2">{mainOpening.marketingDescription}</p>
                          )}
                          
                          {mainOpening.famousPlayers && mainOpening.famousPlayers.length > 0 && (
                            <div className="flex items-center gap-2">
                              <Crown className="h-3.5 w-3.5 text-amber-500" />
                              <span className="text-xs text-muted-foreground">
                                {mainOpening.famousPlayers.join(' • ')}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {hasVariations && (
                          <ChevronRight className={`h-5 w-5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        )}
                      </button>
                      
                      {/* Expanded variations */}
                      <AnimatePresence>
                        {isExpanded && hasVariations && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-border/50"
                          >
                            <div className="p-4 space-y-3 bg-background/50">
                              {/* Historical significance */}
                              {mainOpening.historicalSignificance && (
                                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-4">
                                  <div className="flex items-start gap-2">
                                    <History className="h-4 w-4 text-amber-500 mt-0.5" />
                                    <p className="text-sm text-foreground/90">{mainOpening.historicalSignificance}</p>
                                  </div>
                                </div>
                              )}
                              
                              {/* Variations list */}
                              <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">
                                Variations
                              </h4>
                              <div className="grid gap-2">
                                {variations.filter(v => v.variation).map((v, i) => (
                                  <div 
                                    key={i}
                                    className="p-3 rounded-lg bg-background/50 border border-border/30"
                                  >
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-medium text-sm">{v.variation}</span>
                                      <Badge variant="outline" className="text-[9px]">{v.eco}</Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground">{v.description}</p>
                                    <code className="text-[10px] text-muted-foreground font-mono block mt-1">
                                      {v.moves}
                                    </code>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Empty state */}
        {filteredOpenings.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <BookOpen className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No openings found</h3>
            <p className="text-muted-foreground text-sm">
              Try adjusting your search or filter criteria
            </p>
          </motion.div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default OpeningEncyclopedia;
