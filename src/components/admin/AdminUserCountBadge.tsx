import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';

export const AdminUserCountBadge: React.FC = () => {
  const { data: count, isLoading } = useQuery({
    queryKey: ['admin-total-user-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      return count || 0;
    },
    staleTime: 30000,
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <Badge variant="outline" className="animate-pulse">
        <Users className="h-3 w-3 mr-1" />
        ...
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="bg-primary/10 text-primary">
      <Users className="h-3 w-3 mr-1" />
      {count?.toLocaleString()} users
    </Badge>
  );
};
