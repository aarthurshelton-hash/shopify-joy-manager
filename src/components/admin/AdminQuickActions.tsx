/**
 * Admin Quick Actions Bar
 * Provides rapid access to critical admin functions with live status indicators
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Banknote, 
  Scale, 
  BookOpen, 
  Zap, 
  Shield,
  TrendingUp,
  Package,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickActionProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  href: string;
  variant?: 'default' | 'warning' | 'critical' | 'success' | 'info';
  pulse?: boolean;
}

const QuickAction: React.FC<QuickActionProps> = ({ 
  icon: Icon, 
  label, 
  value, 
  href, 
  variant = 'default',
  pulse = false 
}) => {
  const variantStyles = {
    default: 'bg-muted/50 border-border text-foreground',
    warning: 'bg-amber-500/10 border-amber-500/30 text-amber-600',
    critical: 'bg-destructive/10 border-destructive/30 text-destructive',
    success: 'bg-green-500/10 border-green-500/30 text-green-600',
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-600'
  };

  return (
    <Link to={href}>
      <Card className={cn(
        "p-3 border transition-all hover:shadow-md hover:scale-[1.02] cursor-pointer",
        variantStyles[variant]
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-lg",
            variant === 'critical' && 'bg-destructive/20',
            variant === 'warning' && 'bg-amber-500/20',
            variant === 'success' && 'bg-green-500/20',
            variant === 'info' && 'bg-blue-500/20',
            variant === 'default' && 'bg-muted'
          )}>
            <Icon className={cn("h-4 w-4", pulse && "animate-pulse")} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground truncate">{label}</p>
            <p className="font-semibold text-sm">{value}</p>
          </div>
        </div>
      </Card>
    </Link>
  );
};

interface AdminQuickActionsProps {
  pendingWithdrawals?: number;
  pendingDMCA?: number;
  systemHealth?: 'healthy' | 'degraded' | 'critical';
  activeBooks?: number;
  className?: string;
}

export const AdminQuickActions: React.FC<AdminQuickActionsProps> = ({
  pendingWithdrawals = 0,
  pendingDMCA = 0,
  systemHealth = 'healthy',
  activeBooks = 2,
  className
}) => {
  const healthVariant = systemHealth === 'healthy' ? 'success' : 
                        systemHealth === 'degraded' ? 'warning' : 'critical';
  const healthLabel = systemHealth === 'healthy' ? 'All Systems Go' :
                      systemHealth === 'degraded' ? 'Degraded' : 'Critical';

  return (
    <div className={cn("mb-6", className)}>
      <div className="flex items-center gap-2 mb-3">
        <Shield className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-muted-foreground">Quick Actions</span>
        <Badge variant="outline" className="ml-auto text-xs">CEO Access</Badge>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <QuickAction 
          icon={Banknote}
          label="Pending Withdrawals"
          value={pendingWithdrawals > 0 ? pendingWithdrawals : 'None'}
          href="/admin/withdrawals"
          variant={pendingWithdrawals > 0 ? 'warning' : 'default'}
        />
        <QuickAction 
          icon={Scale}
          label="DMCA Reports"
          value={pendingDMCA > 0 ? pendingDMCA : 'None'}
          href="/admin/dmca"
          variant={pendingDMCA > 0 ? 'critical' : 'default'}
        />
        <QuickAction 
          icon={BookOpen}
          label="Book Production"
          value={`${activeBooks} Active`}
          href="/book"
          variant="info"
        />
        <QuickAction 
          icon={Zap}
          label="System Status"
          value={healthLabel}
          href="/admin/system-vitals"
          variant={healthVariant}
          pulse={systemHealth !== 'healthy'}
        />
      </div>

      {/* Secondary row for production features */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
        <QuickAction 
          icon={Package}
          label="Production Queue"
          value="View Jobs"
          href="/admin/production"
          variant="default"
        />
        <QuickAction 
          icon={TrendingUp}
          label="CEO Economics"
          value="Dashboard"
          href="/admin/economics"
          variant="default"
        />
        <QuickAction 
          icon={Shield}
          label="Content Moderation"
          value="Review"
          href="/admin/moderation"
          variant="default"
        />
        <QuickAction 
          icon={AlertTriangle}
          label="Security Audit"
          value="Logs"
          href="/admin/security-audit"
          variant="default"
        />
      </div>
    </div>
  );
};

export default AdminQuickActions;
