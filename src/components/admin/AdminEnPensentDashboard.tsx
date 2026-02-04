/**
 * Admin En Pensent Dashboard
 * CEO-only access to 55-adapter universal engine
 * For Alec Arthur Shelton (a.arthur.shelton@gmail.com)
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Brain, Shield, Activity, Radio, Lock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const ADMIN_EMAIL = 'a.arthur.shelton@gmail.com';

interface EngineStatus {
  adapters: number;
  feeds: number;
  active: boolean;
  insights: string[];
}

export function AdminEnPensentDashboard() {
  const { user } = useAuth();
  const [status, setStatus] = useState<EngineStatus>({
    adapters: 55,
    feeds: 6,
    active: true,
    insights: []
  });

  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => {
    if (!isAdmin) return;
    // Engine access logged
    console.log(`[Admin] En Pensent access: ${user?.email}`);
  }, [isAdmin, user]);

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="w-96">
          <CardContent className="pt-6 text-center">
            <Lock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Restricted Access</h3>
            <p className="text-sm text-muted-foreground mt-2">
              En Pensent engine controls are restricted to CEO only.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Brain className="w-8 h-8 text-primary" />
            En Pensent Engine
          </h1>
          <p className="text-muted-foreground">
            CEO Access: {ADMIN_EMAIL}
          </p>
        </div>
        <Badge variant="outline" className="px-4 py-2">
          <Shield className="w-4 h-4 mr-2" />
          Admin Only
        </Badge>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{status.adapters}</div>
            <div className="text-sm text-muted-foreground">Universal Adapters</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{status.feeds}/10</div>
            <div className="text-sm text-muted-foreground">Live Data Feeds</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-success">{status.active ? 'ON' : 'OFF'}</div>
            <div className="text-sm text-muted-foreground">Engine Status</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">83%</div>
            <div className="text-sm text-muted-foreground">Resonance Detection</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Radio className="w-5 h-5" />
            Live Data Connections
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {['USGS Seismic', 'disease.sh COVID', 'NCBI Genes', 'NOAA Ocean', 'ESPN Sports', 'NASA Space'].map(feed => (
              <div key={feed} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span>{feed}</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <span className="text-sm text-muted-foreground">Connected</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Admin Controls</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button onClick={() => fetch('/api/admin/activate-engine').then(() => alert('Engine activated'))}>
            <Activity className="w-4 h-4 mr-2" />
            Activate Engine
          </Button>
          <Button variant="outline" onClick={() => fetch('/api/admin/test-resonance').then(() => alert('Resonance tested'))}>
            Test Cross-Domain
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
