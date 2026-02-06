import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { 
  Database, 
  HardDrive, 
  Filter, 
  Layers, 
  Users, 
  Trophy, 
  Activity, 
  ChevronDown, 
  ChevronUp,
  Target,
  GitBranch,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Search,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { isRealLichessId } from '@/lib/chess/benchmarkPersistence';

// Types
interface GamePrediction {
  game_id: string;
  worker_id?: string;
  fen?: string;
  data_source?: string;
  hybrid_archetype?: string;
  created_at?: string;
  actual_result?: string;
  stockfish_prediction?: string;
  hybrid_prediction?: string;
  whiteName?: string;
  blackName?: string;
  gameMode?: string;
  rated?: boolean;
  variant?: string;
}

interface AggregatedStats {
  // Total counts
  totalDatabasePredictions: number;
  totalLocalPredictions: number;
  totalTrueUniqueGames: number;
  
  // Breakdowns
  byDataSource: Record<string, number>;
  byArchetype: Record<string, number>;
  byGameMode: Record<string, number>;
  byPlayer: Record<string, number>;
  byVariant: Record<string, number>;
  
  // Deduplication stats
  duplicateIds: string[];
  uniqueIds: Set<string>;
  
  // Quality metrics
  realGameIds: number;
  syntheticGameIds: number;
}

interface FilterState {
  dataSource: string | 'all';
  archetype: string | 'all';
  gameMode: string | 'all';
  player: string | 'all';
  variant: string | 'all';
  searchQuery: string;
  showDuplicatesOnly: boolean;
  showRealOnly: boolean;
}

// Helper to load local prediction files
async function loadLocalPredictions(): Promise<GamePrediction[]> {
  const predictions: GamePrediction[] = [];
  
  try {
    // Dynamically import all prediction files from farm/data
    const predictionModules = import.meta.glob('/farm/data/predictions*.json', { eager: true });
    
    for (const [path, module] of Object.entries(predictionModules)) {
      const data = (module as { default?: GamePrediction[] })?.default || [];
      predictions.push(...data.map(p => ({
        ...p,
        data_source: p.worker_id?.includes('chess-benchmark') ? 'local_benchmark' : 'local_farm',
      })));
    }
  } catch (error) {
    console.warn('Failed to load local predictions:', error);
  }
  
  return predictions;
}

export const ChessGameTotalsDashboard: React.FC = () => {
  const [filters, setFilters] = useState<FilterState>({
    dataSource: 'all',
    archetype: 'all',
    gameMode: 'all',
    player: 'all',
    variant: 'all',
    searchQuery: '',
    showDuplicatesOnly: false,
    showRealOnly: false,
  });
  
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['totals', 'breakdown']));
  const [localPredictions, setLocalPredictions] = useState<GamePrediction[]>([]);

  // Fetch database predictions
  const { data: dbPredictions = [], isLoading: dbLoading } = useQuery({
    queryKey: ['chess-predictions-database'],
    queryFn: async () => {
      const allPredictions: GamePrediction[] = [];
      let from = 0;
      const pageSize = 1000;
      let hasMore = true;
      
      while (hasMore) {
        const { data, error } = await supabase
          .from('chess_prediction_attempts')
          .select('game_id, data_source, hybrid_archetype, created_at, actual_result, stockfish_prediction, hybrid_prediction, fen')
          .range(from, from + pageSize - 1);
          
        if (error) {
          console.error('Error fetching predictions:', error);
          break;
        }
        
        if (!data || data.length === 0) {
          hasMore = false;
          break;
        }
        
        allPredictions.push(...data);
        from += pageSize;
        hasMore = data.length === pageSize;
      }
      
      return allPredictions;
    },
    staleTime: 60000, // Cache for 1 minute
  });

  // Load local predictions on mount
  useEffect(() => {
    loadLocalPredictions().then(setLocalPredictions);
  }, []);

  // Calculate aggregated stats
  const stats: AggregatedStats = useMemo(() => {
    const allPredictions = [...dbPredictions, ...localPredictions];
    
    // Initialize counters
    const byDataSource: Record<string, number> = {};
    const byArchetype: Record<string, number> = {};
    const byGameMode: Record<string, number> = {};
    const byPlayer: Record<string, number> = {};
    const byVariant: Record<string, number> = {};
    
    const idCount = new Map<string, number>();
    const uniqueIds = new Set<string>();
    let realGameIds = 0;
    let syntheticGameIds = 0;
    
    allPredictions.forEach(pred => {
      const gameId = pred.game_id || 'unknown';
      
      // Count occurrences for deduplication
      idCount.set(gameId, (idCount.get(gameId) || 0) + 1);
      uniqueIds.add(gameId);
      
      // Check if real game ID
      if (isRealLichessId(gameId)) {
        realGameIds++;
      } else {
        syntheticGameIds++;
      }
      
      // Data source breakdown
      const source = pred.data_source || 'unknown';
      byDataSource[source] = (byDataSource[source] || 0) + 1;
      
      // Archetype breakdown
      const archetype = pred.hybrid_archetype || 'unknown';
      byArchetype[archetype] = (byArchetype[archetype] || 0) + 1;
      
      // Game mode breakdown
      const mode = pred.gameMode || 'unknown';
      byGameMode[mode] = (byGameMode[mode] || 0) + 1;
      
      // Player breakdown
      if (pred.whiteName) {
        byPlayer[pred.whiteName] = (byPlayer[pred.whiteName] || 0) + 1;
      }
      if (pred.blackName) {
        byPlayer[pred.blackName] = (byPlayer[pred.blackName] || 0) + 1;
      }
      
      // Variant breakdown
      const variant = pred.variant || 'standard';
      byVariant[variant] = (byVariant[variant] || 0) + 1;
    });
    
    // Find duplicates
    const duplicateIds = Array.from(idCount.entries())
      .filter(([, count]) => count > 1)
      .map(([id]) => id);
    
    return {
      totalDatabasePredictions: dbPredictions.length,
      totalLocalPredictions: localPredictions.length,
      totalTrueUniqueGames: uniqueIds.size,
      byDataSource,
      byArchetype,
      byGameMode,
      byPlayer,
      byVariant,
      duplicateIds,
      uniqueIds,
      realGameIds,
      syntheticGameIds,
    };
  }, [dbPredictions, localPredictions]);

  // Apply filters to get filtered predictions
  const filteredPredictions = useMemo(() => {
    let predictions = [...dbPredictions, ...localPredictions];
    
    // Search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      predictions = predictions.filter(p => 
        p.game_id?.toLowerCase().includes(query) ||
        p.hybrid_archetype?.toLowerCase().includes(query) ||
        p.whiteName?.toLowerCase().includes(query) ||
        p.blackName?.toLowerCase().includes(query)
      );
    }
    
    // Data source filter
    if (filters.dataSource !== 'all') {
      predictions = predictions.filter(p => p.data_source === filters.dataSource);
    }
    
    // Archetype filter
    if (filters.archetype !== 'all') {
      predictions = predictions.filter(p => p.hybrid_archetype === filters.archetype);
    }
    
    // Game mode filter
    if (filters.gameMode !== 'all') {
      predictions = predictions.filter(p => p.gameMode === filters.gameMode);
    }
    
    // Player filter
    if (filters.player !== 'all') {
      predictions = predictions.filter(p => 
        p.whiteName === filters.player || p.blackName === filters.player
      );
    }
    
    // Variant filter
    if (filters.variant !== 'all') {
      predictions = predictions.filter(p => p.variant === filters.variant);
    }
    
    // Duplicates only filter
    if (filters.showDuplicatesOnly) {
      const idCount = new Map<string, number>();
      predictions.forEach(p => {
        idCount.set(p.game_id || '', (idCount.get(p.game_id || '') || 0) + 1);
      });
      predictions = predictions.filter(p => (idCount.get(p.game_id || '') || 0) > 1);
    }
    
    // Real only filter
    if (filters.showRealOnly) {
      predictions = predictions.filter(p => isRealLichessId(p.game_id || ''));
    }
    
    return predictions;
  }, [dbPredictions, localPredictions, filters]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const getUniqueCount = (predictions: GamePrediction[]) => {
    return new Set(predictions.map(p => p.game_id)).size;
  };

  if (dbLoading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Database className="h-6 w-6 text-primary" />
            True Game Totals Dashboard
          </h2>
          <p className="text-muted-foreground mt-1">
            Comprehensive view of all chess predictions across database and local storage
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {stats.totalTrueUniqueGames.toLocaleString()} Unique Games
        </Badge>
      </motion.div>

      {/* Main Totals Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Database className="h-4 w-4" />
              Database Predictions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalDatabasePredictions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round((stats.totalDatabasePredictions / (stats.totalDatabasePredictions + stats.totalLocalPredictions || 1)) * 100)}% of total
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              Local Predictions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalLocalPredictions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              From farm/data JSON files
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Real Game IDs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.realGameIds.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Lichess & Chess.com verified
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Layers className="h-4 w-4" />
              True Unique Games
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalTrueUniqueGames.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              After deduplication
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters Section */}
      <Card>
        <CardHeader 
          className="cursor-pointer"
          onClick={() => toggleSection('filters')}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Advanced Filters
              {(filters.dataSource !== 'all' || filters.archetype !== 'all' || filters.searchQuery) && (
                <Badge variant="secondary" className="ml-2">Active</Badge>
              )}
            </CardTitle>
            {expandedSections.has('filters') ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </div>
        </CardHeader>
        
        {expandedSections.has('filters') && (
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search game IDs, archetypes, players..."
                  value={filters.searchQuery}
                  onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                  className="pl-10"
                />
                {filters.searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                    onClick={() => setFilters(prev => ({ ...prev, searchQuery: '' }))}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label>Data Source</Label>
                <Select 
                  value={filters.dataSource} 
                  onValueChange={(v) => setFilters(prev => ({ ...prev, dataSource: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All sources" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    {Object.entries(stats.byDataSource).map(([source, count]) => (
                      <SelectItem key={source} value={source}>
                        {source} ({count.toLocaleString()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Archetype</Label>
                <Select 
                  value={filters.archetype} 
                  onValueChange={(v) => setFilters(prev => ({ ...prev, archetype: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All archetypes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Archetypes</SelectItem>
                    {Object.entries(stats.byArchetype).map(([arch, count]) => (
                      <SelectItem key={arch} value={arch}>
                        {arch} ({count.toLocaleString()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Game Mode</Label>
                <Select 
                  value={filters.gameMode} 
                  onValueChange={(v) => setFilters(prev => ({ ...prev, gameMode: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All modes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Modes</SelectItem>
                    {Object.entries(stats.byGameMode).map(([mode, count]) => (
                      <SelectItem key={mode} value={mode}>
                        {mode} ({count.toLocaleString()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Variant</Label>
                <Select 
                  value={filters.variant} 
                  onValueChange={(v) => setFilters(prev => ({ ...prev, variant: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All variants" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Variants</SelectItem>
                    {Object.entries(stats.byVariant).map(([variant, count]) => (
                      <SelectItem key={variant} value={variant}>
                        {variant} ({count.toLocaleString()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Player</Label>
                <Select 
                  value={filters.player} 
                  onValueChange={(v) => setFilters(prev => ({ ...prev, player: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All players" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Players</SelectItem>
                    {Object.entries(stats.byPlayer)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 20)
                      .map(([player, count]) => (
                        <SelectItem key={player} value={player}>
                          {player} ({count.toLocaleString()})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-6 pt-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="duplicates"
                  checked={filters.showDuplicatesOnly}
                  onCheckedChange={(v) => setFilters(prev => ({ ...prev, showDuplicatesOnly: v }))}
                />
                <Label htmlFor="duplicates" className="cursor-pointer">
                  Show Duplicates Only ({stats.duplicateIds.length})
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="real-only"
                  checked={filters.showRealOnly}
                  onCheckedChange={(v) => setFilters(prev => ({ ...prev, showRealOnly: v }))}
                />
                <Label htmlFor="real-only" className="cursor-pointer">
                  Real Games Only
                </Label>
              </div>

              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setFilters({
                  dataSource: 'all',
                  archetype: 'all',
                  gameMode: 'all',
                  player: 'all',
                  variant: 'all',
                  searchQuery: '',
                  showDuplicatesOnly: false,
                  showRealOnly: false,
                })}
              >
                Reset Filters
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Filtered Results */}
      <Card className="bg-muted/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5" />
              Filtered Results
            </CardTitle>
            <Badge variant="outline">
              {filteredPredictions.length.toLocaleString()} predictions / {getUniqueCount(filteredPredictions).toLocaleString()} unique games
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-background rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {getUniqueCount(filteredPredictions).toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Unique Games</div>
            </div>
            <div className="text-center p-4 bg-background rounded-lg">
              <div className="text-2xl font-bold text-blue-500">
                {new Set(filteredPredictions.filter(p => isRealLichessId(p.game_id || '')).map(p => p.game_id)).size.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Real Game IDs</div>
            </div>
            <div className="text-center p-4 bg-background rounded-lg">
              <div className="text-2xl font-bold text-amber-500">
                {filteredPredictions.filter(p => 
                  new Set(filteredPredictions.map(x => x.game_id)).size < filteredPredictions.length
                ).length}
              </div>
              <div className="text-sm text-muted-foreground">Potential Duplicates</div>
            </div>
            <div className="text-center p-4 bg-background rounded-lg">
              <div className="text-2xl font-bold text-green-500">
                {new Set(filteredPredictions.map(p => p.hybrid_archetype)).size}
              </div>
              <div className="text-sm text-muted-foreground">Unique Archetypes</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Breakdown Tabs */}
      <Tabs defaultValue="source" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="source" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            By Source
          </TabsTrigger>
          <TabsTrigger value="archetype" className="flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            By Archetype
          </TabsTrigger>
          <TabsTrigger value="mode" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            By Mode
          </TabsTrigger>
          <TabsTrigger value="player" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            By Player
          </TabsTrigger>
          <TabsTrigger value="duplicates" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Duplicates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="source" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Data Source Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(stats.byDataSource)
                  .sort(([,a], [,b]) => b - a)
                  .map(([source, count]) => {
                    const percentage = (count / (stats.totalDatabasePredictions + stats.totalLocalPredictions)) * 100;
                    return (
                      <div key={source} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{source}</span>
                          <span className="text-muted-foreground">
                            {count.toLocaleString()} ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="archetype" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Archetype Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(stats.byArchetype)
                  .sort(([,a], [,b]) => b - a)
                  .map(([archetype, count]) => (
                    <div 
                      key={archetype}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <span className="font-medium capitalize">{archetype.replace(/_/g, ' ')}</span>
                      <Badge>{count.toLocaleString()}</Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mode" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Game Mode Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(stats.byGameMode)
                  .sort(([,a], [,b]) => b - a)
                  .map(([mode, count]) => (
                    <div 
                      key={mode}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <span className="font-medium capitalize">{mode}</span>
                      <Badge variant="secondary">{count.toLocaleString()}</Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="player" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Top Players by Prediction Count
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {Object.entries(stats.byPlayer)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 50)
                  .map(([player, count], index) => (
                    <div 
                      key={player}
                      className="flex items-center justify-between p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground w-8">#{index + 1}</span>
                        <span className="font-medium">{player}</span>
                      </div>
                      <Badge variant="outline">{count.toLocaleString()} games</Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="duplicates" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-600">
                <AlertCircle className="h-5 w-5" />
                Duplicate Game IDs
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.duplicateIds.length === 0 ? (
                <div className="flex items-center justify-center p-8 text-muted-foreground">
                  <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />
                  No duplicate game IDs found!
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-4">
                    Found {stats.duplicateIds.length} game IDs that appear multiple times across predictions.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                    {stats.duplicateIds.map(id => (
                      <Badge key={id} variant="secondary" className="justify-center">
                        {id}
                      </Badge>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Data Quality Summary */}
      <Card className="border-green-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="h-5 w-5" />
            Data Quality Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">ID Validation</div>
              <div className="flex items-center gap-2">
                <Progress 
                  value={(stats.realGameIds / (stats.realGameIds + stats.syntheticGameIds || 1)) * 100} 
                  className="flex-1 h-2"
                />
                <span className="text-sm font-medium">
                  {((stats.realGameIds / (stats.realGameIds + stats.syntheticGameIds || 1)) * 100).toFixed(1)}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.realGameIds.toLocaleString()} real / {stats.syntheticGameIds.toLocaleString()} synthetic
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Deduplication</div>
              <div className="flex items-center gap-2">
                <Progress 
                  value={((stats.totalDatabasePredictions + stats.totalLocalPredictions - stats.duplicateIds.length) / (stats.totalDatabasePredictions + stats.totalLocalPredictions || 1)) * 100} 
                  className="flex-1 h-2"
                />
                <span className="text-sm font-medium">
                  {stats.duplicateIds.length === 0 ? '100%' : 
                    (((stats.totalDatabasePredictions + stats.totalLocalPredictions - stats.duplicateIds.length) / (stats.totalDatabasePredictions + stats.totalLocalPredictions || 1)) * 100).toFixed(1) + '%'
                  }
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.duplicateIds.length} duplicates detected
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Sources</div>
              <div className="flex flex-wrap gap-1">
                {Object.keys(stats.byDataSource).map(source => (
                  <Badge key={source} variant="outline" className="text-xs">
                    {source}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
