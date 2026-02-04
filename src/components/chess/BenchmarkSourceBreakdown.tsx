import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Server, Monitor, Cloud, TrendingUp, Target } from 'lucide-react';

interface SourceStats {
  data_source: string;
  count: number;
  hybrid_accuracy: number;
  stockfish_accuracy: number;
  hybrid_wins: number;
  stockfish_wins: number;
}

export function BenchmarkSourceBreakdown() {
  const [stats, setStats] = useState<SourceStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPredictions, setTotalPredictions] = useState(0);

  useEffect(() => {
    fetchSourceStats();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('source-stats')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chess_prediction_attempts' },
        () => fetchSourceStats()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchSourceStats() {
    try {
      // Get total count
      const { count: total } = await supabase
        .from('chess_prediction_attempts')
        .select('*', { count: 'exact', head: true });
      
      setTotalPredictions(total || 0);

      // Fetch stats by source using a raw query approach
      const sources = ['web_client', 'farm_terminal', 'lichess_cloud'];
      const sourceStats: SourceStats[] = [];

      for (const source of sources) {
        const { count } = await supabase
          .from('chess_prediction_attempts')
          .select('*', { count: 'exact', head: true })
          .eq('data_source', source);

        const { count: hybridCorrect } = await supabase
          .from('chess_prediction_attempts')
          .select('*', { count: 'exact', head: true })
          .eq('data_source', source)
          .eq('hybrid_correct', true);

        const { count: sfCorrect } = await supabase
          .from('chess_prediction_attempts')
          .select('*', { count: 'exact', head: true })
          .eq('data_source', source)
          .eq('stockfish_correct', true);

        const { count: hybridWins } = await supabase
          .from('chess_prediction_attempts')
          .select('*', { count: 'exact', head: true })
          .eq('data_source', source)
          .eq('hybrid_correct', true)
          .eq('stockfish_correct', false);

        const { count: sfWins } = await supabase
          .from('chess_prediction_attempts')
          .select('*', { count: 'exact', head: true })
          .eq('data_source', source)
          .eq('stockfish_correct', true)
          .eq('hybrid_correct', false);

        const totalCount = count || 0;
        sourceStats.push({
          data_source: source,
          count: totalCount,
          hybrid_accuracy: totalCount > 0 ? ((hybridCorrect || 0) / totalCount) * 100 : 0,
          stockfish_accuracy: totalCount > 0 ? ((sfCorrect || 0) / totalCount) * 100 : 0,
          hybrid_wins: hybridWins || 0,
          stockfish_wins: sfWins || 0,
        });
      }

      setStats(sourceStats.sort((a, b) => b.count - a.count));
    } catch (error) {
      console.error('Error fetching source stats:', error);
    } finally {
      setLoading(false);
    }
  }

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'farm_terminal':
        return <Server className="h-5 w-5 text-blue-500" />;
      case 'web_client':
        return <Monitor className="h-5 w-5 text-green-500" />;
      case 'lichess_cloud':
        return <Cloud className="h-5 w-5 text-purple-500" />;
      default:
        return <Target className="h-5 w-5 text-gray-500" />;
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'farm_terminal':
        return 'Compute Farm';
      case 'web_client':
        return 'Web Dashboard';
      case 'lichess_cloud':
        return 'Lichess Cloud';
      default:
        return source;
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'farm_terminal':
        return 'bg-blue-500';
      case 'web_client':
        return 'bg-green-500';
      case 'lichess_cloud':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Benchmark Source Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {stats.map((stat) => (
            <div key={stat.data_source} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getSourceIcon(stat.data_source)}
                  <span className="font-medium">{getSourceLabel(stat.data_source)}</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold">{stat.count.toLocaleString()}</span>
                  <span className="text-sm text-gray-500 ml-1">
                    ({((stat.count / totalPredictions) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
              
              <Progress 
                value={(stat.count / totalPredictions) * 100} 
                className="h-2"
              >
                <div className={`h-full ${getSourceColor(stat.data_source)} transition-all`} 
                     style={{ width: `${(stat.count / totalPredictions) * 100}%` }} 
                />
              </Progress>

              {stat.count > 0 && (
                <div className="grid grid-cols-2 gap-4 text-sm pt-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Hybrid Accuracy:</span>
                    <span className="font-medium">{stat.hybrid_accuracy.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Stockfish Accuracy:</span>
                    <span className="font-medium">{stat.stockfish_accuracy.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Hybrid Wins:</span>
                    <span className="font-medium text-green-600">{stat.hybrid_wins}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Stockfish Wins:</span>
                    <span className="font-medium text-blue-600">{stat.stockfish_wins}</span>
                  </div>
                </div>
              )}
            </div>
          ))}

          <div className="pt-4 border-t">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Total Predictions</span>
              <span className="text-2xl font-bold">{totalPredictions.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
