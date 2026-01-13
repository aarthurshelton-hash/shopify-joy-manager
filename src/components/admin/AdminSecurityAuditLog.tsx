import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Shield, 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  XCircle,
  User,
  Settings,
  LogIn,
  LogOut,
  CreditCard,
  Eye,
  Download,
  Trash2,
  Edit,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { format, formatDistanceToNow } from 'date-fns';

interface AuditLogEntry {
  id: string;
  user_id: string | null;
  admin_id: string | null;
  action_type: string;
  action_category: string;
  target_type: string | null;
  target_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown>;
  severity: string;
  created_at: string;
}

const severityConfig = {
  info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  error: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/30' },
  critical: { icon: Shield, color: 'text-red-600', bg: 'bg-red-600/10', border: 'border-red-600/30' },
  success: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/30' },
};

const actionIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  login: LogIn,
  logout: LogOut,
  signup: Plus,
  view: Eye,
  download: Download,
  delete: Trash2,
  update: Edit,
  create: Plus,
  payment: CreditCard,
  settings: Settings,
  user: User,
};

export const AdminSecurityAuditLog: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch audit logs
  const { data: auditLogs, isLoading, refetch } = useQuery({
    queryKey: ['admin-security-audit-logs', severityFilter, categoryFilter],
    queryFn: async () => {
      let query = supabase
        .from('security_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      
      if (severityFilter !== 'all') {
        query = query.eq('severity', severityFilter);
      }
      if (categoryFilter !== 'all') {
        query = query.eq('action_category', categoryFilter);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as AuditLogEntry[];
    },
    refetchInterval: autoRefresh ? 10000 : false,
  });

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('security-audit-log-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'security_audit_log' },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  // Get unique categories from logs
  const categories = React.useMemo(() => {
    if (!auditLogs) return [];
    const cats = new Set(auditLogs.map(log => log.action_category));
    return Array.from(cats).sort();
  }, [auditLogs]);

  // Filter logs by search
  const filteredLogs = React.useMemo(() => {
    if (!auditLogs) return [];
    if (!searchQuery) return auditLogs;
    
    const query = searchQuery.toLowerCase();
    return auditLogs.filter(log => 
      log.action_type.toLowerCase().includes(query) ||
      log.action_category.toLowerCase().includes(query) ||
      log.target_type?.toLowerCase().includes(query) ||
      log.target_id?.toLowerCase().includes(query) ||
      log.ip_address?.toLowerCase().includes(query)
    );
  }, [auditLogs, searchQuery]);

  // Calculate stats
  const stats = React.useMemo(() => {
    if (!auditLogs?.length) return { total: 0, critical: 0, warnings: 0, today: 0 };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return {
      total: auditLogs.length,
      critical: auditLogs.filter(l => l.severity === 'critical' || l.severity === 'error').length,
      warnings: auditLogs.filter(l => l.severity === 'warning').length,
      today: auditLogs.filter(l => new Date(l.created_at) >= today).length,
    };
  }, [auditLogs]);

  const getActionIcon = (actionType: string) => {
    const key = actionType.split('_')[0].toLowerCase();
    return actionIcons[key] || Shield;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Shield className="h-4 w-4" />
              <span className="text-sm">Total Events</span>
            </div>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-red-500 mb-1">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">Critical/Errors</span>
            </div>
            <p className="text-2xl font-bold text-red-500">{stats.critical}</p>
          </CardContent>
        </Card>
        
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-amber-500 mb-1">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">Warnings</span>
            </div>
            <p className="text-2xl font-bold text-amber-500">{stats.warnings}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Today</span>
            </div>
            <p className="text-2xl font-bold">{stats.today}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Audit Log
              </CardTitle>
              <CardDescription>Track all security-related events on the platform</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={autoRefresh ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
                {autoRefresh ? 'Live' : 'Paused'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="success">Success</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ScrollArea className="h-[500px]">
            <div className="space-y-2">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No audit log entries found</p>
                  <p className="text-sm">Events will appear here as they occur</p>
                </div>
              ) : (
                filteredLogs.map((log, index) => {
                  const config = severityConfig[log.severity as keyof typeof severityConfig] || severityConfig.info;
                  const SeverityIcon = config.icon;
                  const ActionIcon = getActionIcon(log.action_type);
                  
                  return (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className={`p-4 rounded-lg border ${config.border} ${config.bg}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-full ${config.bg}`}>
                            <SeverityIcon className={`h-4 w-4 ${config.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <ActionIcon className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{log.action_type}</span>
                              <Badge variant="outline" className="text-xs">
                                {log.action_category}
                              </Badge>
                              <Badge 
                                variant="secondary" 
                                className={`text-xs ${config.color}`}
                              >
                                {log.severity}
                              </Badge>
                            </div>
                            
                            <div className="mt-1 text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                              {log.target_type && (
                                <span>Target: {log.target_type} {log.target_id ? `(${log.target_id.slice(0, 8)}...)` : ''}</span>
                              )}
                              {log.ip_address && (
                                <span>IP: {log.ip_address}</span>
                              )}
                              {log.user_id && (
                                <span>User: {log.user_id.slice(0, 8)}...</span>
                              )}
                              {log.admin_id && (
                                <span className="text-primary">Admin: {log.admin_id.slice(0, 8)}...</span>
                              )}
                            </div>
                            
                            {log.metadata && Object.keys(log.metadata).length > 0 && (
                              <details className="mt-2">
                                <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                                  View metadata
                                </summary>
                                <pre className="mt-1 text-xs bg-muted/50 p-2 rounded overflow-x-auto">
                                  {JSON.stringify(log.metadata, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right shrink-0">
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(log.created_at), 'MMM d, HH:mm:ss')}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
