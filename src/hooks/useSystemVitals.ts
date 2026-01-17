import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SystemVital {
  vital_name: string;
  vital_type: string;
  status: string;
  last_pulse_at: string;
  seconds_since_pulse: number;
  pulse_count: number;
  last_value: number;
  target_value: number;
  is_healthy: boolean;
  metadata: Record<string, unknown>;
}

interface EvolutionState {
  generation: number | null;
  fitness_score: number | null;
  total_predictions: number | null;
  last_mutation_at: string | null;
  genes: Record<string, number>;
  adaptation_history: unknown[];
}

interface SystemHealth {
  isAlive: boolean;
  healthPercentage: number;
  healthyCount: number;
  totalCount: number;
  criticalSystems: string[];
  degradedSystems: string[];
}

export function useSystemVitals() {
  const queryClient = useQueryClient();

  // Fetch all system vitals
  const vitalsQuery = useQuery({
    queryKey: ['system-vitals'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_system_vitals');
      if (error) throw error;
      return data as SystemVital[];
    },
    refetchInterval: 5000,
    staleTime: 2000,
  });

  // Fetch evolution state
  const evolutionQuery = useQuery({
    queryKey: ['evolution-state'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('evolution_state')
        .select('*')
        .eq('state_type', 'global')
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data as EvolutionState | null;
    },
    refetchInterval: 10000,
  });

  // Calculate system health
  const systemHealth: SystemHealth = (() => {
    const vitals = vitalsQuery.data || [];
    const healthyCount = vitals.filter(v => v.is_healthy).length;
    const totalCount = vitals.length;
    const criticalSystems = vitals.filter(v => v.status === 'critical').map(v => v.vital_name);
    const degradedSystems = vitals.filter(v => v.status === 'degraded').map(v => v.vital_name);
    
    return {
      isAlive: healthyCount > 0 && criticalSystems.length < totalCount / 2,
      healthPercentage: totalCount > 0 ? (healthyCount / totalCount) * 100 : 0,
      healthyCount,
      totalCount,
      criticalSystems,
      degradedSystems,
    };
  })();

  // Trigger heartbeat
  const triggerHeartbeat = useMutation({
    mutationFn: async (action: 'full_cycle' | 'collect' | 'predict' | 'resolve' | 'correlate' | 'evolve' = 'full_cycle') => {
      const { data, error } = await supabase.functions.invoke('system-heartbeat', {
        body: { action }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-vitals'] });
      queryClient.invalidateQueries({ queryKey: ['evolution-state'] });
    },
    onError: (error) => {
      toast.error('Heartbeat failed', { description: error.message });
    }
  });

  // Start automated heartbeat (for development/testing)
  const startHeartbeat = (intervalMs = 5000) => {
    const interval = setInterval(() => {
      triggerHeartbeat.mutate('full_cycle');
    }, intervalMs);
    
    return () => clearInterval(interval);
  };

  return {
    vitals: vitalsQuery.data || [],
    evolution: evolutionQuery.data,
    systemHealth,
    isLoading: vitalsQuery.isLoading,
    isError: vitalsQuery.isError,
    error: vitalsQuery.error,
    refetch: () => {
      vitalsQuery.refetch();
      evolutionQuery.refetch();
    },
    triggerHeartbeat: triggerHeartbeat.mutate,
    isTriggering: triggerHeartbeat.isPending,
    startHeartbeat,
  };
}
