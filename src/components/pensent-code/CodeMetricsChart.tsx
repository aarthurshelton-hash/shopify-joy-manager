import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';

interface CodeMetricsChartProps {
  metrics: {
    featureRatio: number;
    bugfixRatio: number;
    refactorRatio: number;
    docRatio: number;
    testRatio: number;
    choreRatio: number;
    typeCounts: Record<string, number>;
  };
  quadrantProfile: {
    q1: number;
    q2: number;
    q3: number;
    q4: number;
  };
  temporalFlow: {
    opening: number;
    midgame: number;
    endgame: number;
  };
}

const COLORS = {
  feature: '#22c55e',
  bugfix: '#ef4444',
  refactor: '#3b82f6',
  documentation: '#8b5cf6',
  test: '#f59e0b',
  chore: '#6b7280',
  other: '#94a3b8',
};

export function CodeMetricsChart({ metrics, quadrantProfile, temporalFlow }: CodeMetricsChartProps) {
  const commitTypeData = [
    { name: 'Features', value: metrics.featureRatio * 100, color: COLORS.feature },
    { name: 'Bug Fixes', value: metrics.bugfixRatio * 100, color: COLORS.bugfix },
    { name: 'Refactors', value: metrics.refactorRatio * 100, color: COLORS.refactor },
    { name: 'Docs', value: metrics.docRatio * 100, color: COLORS.documentation },
    { name: 'Tests', value: metrics.testRatio * 100, color: COLORS.test },
    { name: 'Chores', value: metrics.choreRatio * 100, color: COLORS.chore },
  ].filter(d => d.value > 0);

  const quadrantData = [
    { name: 'Q1: Early High-Impact', value: quadrantProfile.q1 * 100 },
    { name: 'Q2: Early Low-Impact', value: quadrantProfile.q2 * 100 },
    { name: 'Q3: Late High-Impact', value: quadrantProfile.q3 * 100 },
    { name: 'Q4: Late Low-Impact', value: quadrantProfile.q4 * 100 },
  ];

  const temporalData = [
    { name: 'Opening', intensity: temporalFlow.opening * 100, fill: '#22c55e' },
    { name: 'Midgame', intensity: temporalFlow.midgame * 100, fill: '#3b82f6' },
    { name: 'Endgame', intensity: temporalFlow.endgame * 100, fill: '#8b5cf6' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Commit Distribution</CardTitle>
          <CardDescription>Types of changes in the codebase</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={commitTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {commitTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => `${value.toFixed(1)}%`}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Quadrant Profile</CardTitle>
          <CardDescription>Impact distribution over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={quadrantData} layout="vertical">
                <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                <Tooltip 
                  formatter={(value: number) => `${value.toFixed(1)}%`}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Temporal Flow</CardTitle>
          <CardDescription>Development intensity phases</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={temporalData}>
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <Tooltip 
                  formatter={(value: number) => `${value.toFixed(1)}%`}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="intensity" radius={[4, 4, 0, 0]}>
                  {temporalData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
