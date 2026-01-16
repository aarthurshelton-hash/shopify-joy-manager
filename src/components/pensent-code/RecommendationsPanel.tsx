import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';

interface RecommendationsPanelProps {
  recommendations: string[];
  criticalMoments: Array<{
    index: number;
    type: string;
    description: string;
  }>;
}

const MOMENT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  major_refactor: TrendingUp,
  breaking_change: AlertCircle,
  crisis_response: AlertCircle,
  major_feature: CheckCircle,
};

const MOMENT_COLORS: Record<string, string> = {
  major_refactor: 'text-blue-500 bg-blue-500/10',
  breaking_change: 'text-orange-500 bg-orange-500/10',
  crisis_response: 'text-red-500 bg-red-500/10',
  major_feature: 'text-green-500 bg-green-500/10',
};

export function RecommendationsPanel({ recommendations, criticalMoments }: RecommendationsPanelProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Recommendations
          </CardTitle>
          <CardDescription>
            Strategic guidance based on pattern analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {recommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>
                <span className="text-sm text-muted-foreground">{rec}</span>
              </li>
            ))}
            {recommendations.length === 0 && (
              <li className="text-sm text-muted-foreground italic">
                No specific recommendations at this time
              </li>
            )}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Critical Moments
          </CardTitle>
          <CardDescription>
            Significant events in the repository history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {criticalMoments.slice(0, 5).map((moment, index) => {
              const Icon = MOMENT_ICONS[moment.type] || AlertCircle;
              const colorClass = MOMENT_COLORS[moment.type] || 'text-gray-500 bg-gray-500/10';
              
              return (
                <li key={index} className="flex items-start gap-3">
                  <div className={`flex-shrink-0 p-1.5 rounded ${colorClass}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="space-y-1">
                    <Badge variant="outline" className="text-xs">
                      {moment.type.split('_').join(' ')}
                    </Badge>
                    <p className="text-sm text-muted-foreground">{moment.description}</p>
                  </div>
                </li>
              );
            })}
            {criticalMoments.length === 0 && (
              <li className="text-sm text-muted-foreground italic">
                No critical moments detected
              </li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
