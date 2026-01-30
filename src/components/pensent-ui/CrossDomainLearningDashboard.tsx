/**
 * Cross-Domain Learning Dashboard
 * 
 * Visualizes the unified learning system where
 * Chess, Code, and Market patterns flow bidirectionally.
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  Code2, 
  TrendingUp, 
  ArrowRightLeft, 
  Zap, 
  Database,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react';
import { 
  crossDomainLearningPipeline, 
  historicalGameImporter,
  ibkrIntelligenceCollector,
  type ImportProgress,
  type LearningState,
  type IntelligenceState 
} from '@/lib/pensent-core/domains/learning';

interface DomainFlowProps {
  from: 'chess' | 'code' | 'market';
  to: 'chess' | 'code' | 'market';
  transfers: number;
  accuracy: number;
}

function DomainFlowCard({ from, to, transfers, accuracy }: DomainFlowProps) {
  const icons = {
    chess: Brain,
    code: Code2,
    market: TrendingUp,
  };
  
  const FromIcon = icons[from];
  const ToIcon = icons[to];
  
  const colors = {
    chess: 'text-purple-500',
    code: 'text-blue-500',
    market: 'text-green-500',
  };

  return (
    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
      <FromIcon className={`w-5 h-5 ${colors[from]}`} />
      <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
      <ToIcon className={`w-5 h-5 ${colors[to]}`} />
      <div className="flex-1 text-right">
        <span className="text-sm font-medium">{transfers} patterns</span>
        <span className="text-xs text-muted-foreground ml-2">
          {(accuracy * 100).toFixed(0)}% accurate
        </span>
      </div>
    </div>
  );
}

export function CrossDomainLearningDashboard() {
  const [learningState, setLearningState] = useState<LearningState | null>(null);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [ibkrState, setIbkrState] = useState<IntelligenceState | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isConnectingIbkr, setIsConnectingIbkr] = useState(false);

  useEffect(() => {
    // Subscribe to learning state
    const interval = setInterval(() => {
      setLearningState(crossDomainLearningPipeline.getState());
      setIbkrState(ibkrIntelligenceCollector.getState());
    }, 2000);

    // Subscribe to import progress
    const unsubscribe = historicalGameImporter.subscribe(setImportProgress);

    // Initial load
    setLearningState(crossDomainLearningPipeline.getState());
    setIbkrState(ibkrIntelligenceCollector.getState());

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  const handleImportFromDatabase = async () => {
    setIsImporting(true);
    await historicalGameImporter.importFromDatabase(500);
    setIsImporting(false);
  };

  const handleImportFresh = async () => {
    setIsImporting(true);
    await historicalGameImporter.importGames({
      sources: ['lichess', 'chesscom'],
      targetCount: 100,
      minElo: 2000,
      learnFromOutcomes: true,
    });
    setIsImporting(false);
  };

  const handleConnectIbkr = async () => {
    setIsConnectingIbkr(true);
    await ibkrIntelligenceCollector.connect();
    setIsConnectingIbkr(false);
    setIbkrState(ibkrIntelligenceCollector.getState());
  };

  return (
    <div className="space-y-4">
      {/* Header Stats */}
      <div className="grid grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{learningState?.totalPatternsLearned || 0}</p>
                <p className="text-xs text-muted-foreground">Patterns Learned</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{learningState?.crossDomainTransfers || 0}</p>
                <p className="text-xs text-muted-foreground">Cross-Domain Transfers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">
                  {((learningState?.chessToMarketAccuracy || 0.5) * 100).toFixed(0)}%
                </p>
                <p className="text-xs text-muted-foreground">Chess→Market Accuracy</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              {ibkrState?.isConnected ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              <div>
                <p className="text-2xl font-bold">{ibkrState?.tradesCollected || 0}</p>
                <p className="text-xs text-muted-foreground">IBKR Trades</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="flows" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="flows">Pattern Flows</TabsTrigger>
          <TabsTrigger value="import">Historical Import</TabsTrigger>
          <TabsTrigger value="ibkr">IBKR Intelligence</TabsTrigger>
        </TabsList>

        <TabsContent value="flows" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4" />
                Cross-Domain Pattern Transfers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <DomainFlowCard 
                from="chess" 
                to="code" 
                transfers={Math.floor((learningState?.crossDomainTransfers || 0) * 0.3)}
                accuracy={learningState?.codeToChessResonance || 0.5}
              />
              <DomainFlowCard 
                from="chess" 
                to="market" 
                transfers={Math.floor((learningState?.crossDomainTransfers || 0) * 0.4)}
                accuracy={learningState?.chessToMarketAccuracy || 0.5}
              />
              <DomainFlowCard 
                from="code" 
                to="market" 
                transfers={Math.floor((learningState?.crossDomainTransfers || 0) * 0.2)}
                accuracy={learningState?.marketToCodeAlignment || 0.5}
              />
              <DomainFlowCard 
                from="market" 
                to="chess" 
                transfers={Math.floor((learningState?.crossDomainTransfers || 0) * 0.1)}
                accuracy={(learningState?.chessToMarketAccuracy || 0.5) * 0.9}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Domain Health Matrix</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <Brain className="w-8 h-8 mx-auto text-purple-500 mb-2" />
                  <p className="text-sm font-medium">Chess</p>
                  <Progress 
                    value={(learningState?.chessToMarketAccuracy || 0.5) * 100} 
                    className="h-2 mt-2"
                  />
                </div>
                <div className="text-center">
                  <Code2 className="w-8 h-8 mx-auto text-blue-500 mb-2" />
                  <p className="text-sm font-medium">Code</p>
                  <Progress 
                    value={(learningState?.codeToChessResonance || 0.5) * 100} 
                    className="h-2 mt-2"
                  />
                </div>
                <div className="text-center">
                  <TrendingUp className="w-8 h-8 mx-auto text-green-500 mb-2" />
                  <p className="text-sm font-medium">Market</p>
                  <Progress 
                    value={(learningState?.marketToCodeAlignment || 0.5) * 100} 
                    className="h-2 mt-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="w-4 h-4" />
                Historical Game Import
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button 
                  onClick={handleImportFromDatabase}
                  disabled={isImporting}
                  variant="outline"
                >
                  {isImporting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Import from DB (500 games)
                </Button>
                <Button 
                  onClick={handleImportFresh}
                  disabled={isImporting}
                >
                  {isImporting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Fetch Fresh Games
                </Button>
              </div>

              {importProgress && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{importProgress.processedGames} / {importProgress.totalGames}</span>
                  </div>
                  <Progress 
                    value={(importProgress.processedGames / importProgress.totalGames) * 100} 
                  />
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-lg font-bold">{importProgress.patternsExtracted}</p>
                      <p className="text-xs text-muted-foreground">Patterns</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">{importProgress.crossDomainLessons}</p>
                      <p className="text-xs text-muted-foreground">Lessons</p>
                    </div>
                    <div>
                      <Badge variant={importProgress.status === 'complete' ? 'default' : 'secondary'}>
                        {importProgress.status}
                      </Badge>
                    </div>
                  </div>
                  {importProgress.errors.length > 0 && (
                    <div className="text-xs text-red-500 max-h-20 overflow-auto">
                      {importProgress.errors.slice(0, 3).map((e, i) => (
                        <p key={i}>{e}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ibkr" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                IBKR Paper Account Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {ibkrState?.isConnected ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      <span className="text-sm font-medium">Connected</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-red-500" />
                      <span className="text-sm font-medium">Disconnected</span>
                    </>
                  )}
                </div>
                <Button 
                  onClick={handleConnectIbkr}
                  disabled={isConnectingIbkr || ibkrState?.isConnected}
                  size="sm"
                >
                  {isConnectingIbkr && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Connect Gateway
                </Button>
              </div>

              {ibkrState?.isConnected && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold">{ibkrState.tradesCollected}</p>
                    <p className="text-xs text-muted-foreground">Trades Collected</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold">{ibkrState.patternsLearned}</p>
                    <p className="text-xs text-muted-foreground">Patterns Learned</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold">${ibkrState.totalPnl.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">Total P&L</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold">{(ibkrState.winRate * 100).toFixed(0)}%</p>
                    <p className="text-xs text-muted-foreground">Win Rate</p>
                  </div>
                </div>
              )}

              {!ibkrState?.isConnected && (
                <div className="text-center py-6 text-muted-foreground">
                  <p className="text-sm">Connect to IBKR Gateway to start collecting market intelligence</p>
                  <p className="text-xs mt-1">Ensure the bridge server is running on localhost:4000</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
