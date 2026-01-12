import { Bell, AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useSubscriptionNotifications } from '@/hooks/useSubscriptionNotifications';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const notificationIcons: Record<string, React.ReactNode> = {
  expiring_soon: <Clock className="h-4 w-4 text-yellow-500" />,
  grace_period_started: <AlertTriangle className="h-4 w-4 text-orange-500" />,
  grace_period_ending: <AlertTriangle className="h-4 w-4 text-destructive" />,
  visions_released: <XCircle className="h-4 w-4 text-destructive" />,
  subscription_renewed: <CheckCircle className="h-4 w-4 text-green-500" />,
};

export function SubscriptionNotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useSubscriptionNotifications();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="font-semibold text-sm">Notifications</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-6" onClick={markAllAsRead}>
              Mark all read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="px-3 py-4 text-center text-muted-foreground text-sm">
            No notifications
          </div>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className={cn(
                'flex items-start gap-3 p-3 cursor-pointer',
                !notification.read_at && 'bg-muted/50'
              )}
              onClick={() => !notification.read_at && markAsRead(notification.id)}
            >
              <div className="flex-shrink-0 mt-0.5">
                {notificationIcons[notification.notification_type] || <Bell className="h-4 w-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-relaxed">{notification.message}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                </p>
              </div>
              {!notification.read_at && (
                <div className="flex-shrink-0">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                </div>
              )}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
