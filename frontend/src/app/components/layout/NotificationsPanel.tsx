import { Bell, CheckCircle, AlertCircle, FileText, User, Clock, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { reportApi, type ReportDeliveryNotification } from '../../../api/reports';
import { getWhatsAppSocket } from '../../../api/whatsapp';
import { getAuthToken } from '../../../api/client';
import { useBranchStore, useAuthStore } from '../../../stores';

export interface Notification {
  id: string;
  type: 'whatsapp_pdf_sent' | 'whatsapp_pdf_failed';
  status: 'success' | 'failed' | 'pending';
  recipient_type: 'patient' | 'doctor' | 'staff';
  recipient_name: string;
  document_name: string;
  timestamp: string;
  message?: string;
}

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

function mapNotification(row: ReportDeliveryNotification): Notification {
  const normalizedStatus: Notification['status'] =
    row.status === 'sent' ? 'success' : row.status === 'failed' ? 'failed' : 'pending';
  return {
    id: row.id,
    type: normalizedStatus === 'success' ? 'whatsapp_pdf_sent' : 'whatsapp_pdf_failed',
    status: normalizedStatus,
    recipient_type: (row.recipient_type === 'technician' ? 'staff' : row.recipient_type) as Notification['recipient_type'],
    recipient_name: row.recipient_name || 'Recipient',
    document_name: row.document_name || 'Lab Report',
    timestamp: row.created_at,
    message:
      normalizedStatus === 'success'
        ? 'PDF sent successfully via WhatsApp'
        : row.reason || (normalizedStatus === 'pending' ? 'Delivery in progress' : 'Failed to send report via WhatsApp'),
  };
}

function formatTimeAgo(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

function getRecipientBadgeColor(type: string) {
  switch (type) {
    case 'patient':
      return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
    case 'doctor':
      return 'bg-purple-500/10 text-purple-700 dark:text-purple-400';
    case 'staff':
      return 'bg-amber-500/10 text-amber-700 dark:text-amber-400';
    default:
      return 'bg-gray-500/10 text-gray-700 dark:text-gray-400';
  }
}

export function NotificationsPanel({ isOpen, onClose }: NotificationsPanelProps) {
  const { currentBranchId } = useBranchStore();
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !user) return;

    let mounted = true;
    const loadNotifications = async () => {
      setIsLoading(true);
      try {
        const response = await reportApi.getDeliveryNotifications(currentBranchId ?? undefined, 30);
        if (!mounted) return;
        
        const fetched = (response.data || []).map(mapNotification);
        setNotifications((prev) => {
          const liveOnly = prev.filter(n => n.id.startsWith('clock-') || n.id.includes('-live-'));
          const combined = [...liveOnly, ...fetched];
          const seen = new Set<string>();
          return combined.filter(n => {
            if (seen.has(n.id)) return false;
            seen.add(n.id);
            return true;
          }).slice(0, 50);
        });
      } catch (error) {
        console.error('Failed to load delivery notifications:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadNotifications();
    return () => {
      mounted = false;
    };
  }, [isOpen, currentBranchId, user]);

  useEffect(() => {
    if (!user || !currentBranchId) return;
    const token = getAuthToken();
    if (!token) return;

    const socket = getWhatsAppSocket(token);

    socket.emit('whatsapp:subscribe', { branch_id: currentBranchId });

    const onDeliveryEvent = (event: {
      report_id: string;
      recipient_type: 'patient' | 'doctor' | 'technician' | 'staff';
      status: 'pending' | 'sending' | 'sent' | 'failed' | 'skipped';
      reason?: string;
    }) => {
      if (!event?.report_id) return;

      const normalizedStatus: Notification['status'] =
        event.status === 'sent' ? 'success' : event.status === 'failed' ? 'failed' : 'pending';

      const liveId = `${event.report_id}-${event.recipient_type}-live-${Date.now()}`;
      const liveNotification: Notification = {
        id: liveId,
        type: normalizedStatus === 'success' ? 'whatsapp_pdf_sent' : 'whatsapp_pdf_failed',
        status: normalizedStatus,
        recipient_type: (event.recipient_type === 'technician' ? 'staff' : event.recipient_type) as Notification['recipient_type'],
        recipient_name: event.recipient_type === 'doctor' ? 'Doctor' : event.recipient_type === 'patient' ? 'Patient' : 'Technician',
        document_name: 'Lab Report',
        timestamp: new Date().toISOString(),
        message:
          normalizedStatus === 'success'
            ? 'PDF sent successfully via WhatsApp'
            : event.reason || (normalizedStatus === 'pending' ? 'Delivery in progress' : 'Failed to send report via WhatsApp'),
      };

      setNotifications((prev) => [liveNotification, ...prev].slice(0, 50));
    };

    const onStaffClockEvent = (event: {
      userId: string;
      userName: string;
      action: 'in' | 'out';
      timestamp: string;
      notes?: string;
    }) => {
      const liveId = `clock-${event.userId}-${Date.now()}`;
      const liveNotification: Notification = {
        id: liveId,
        type: 'staff_clock' as any,
        status: event.action === 'in' ? 'success' : 'failed',
        recipient_type: 'staff',
        recipient_name: event.userName,
        document_name: event.action === 'in' ? 'Clock In Alert' : 'Clock Out Alert',
        timestamp: event.timestamp,
        message: `${event.userName} clocked ${event.action === 'in' ? 'IN 🟢' : 'OUT 🔴'}${event.notes ? ` (Notes: ${event.notes})` : ''}`,
      };

      setNotifications((prev) => [liveNotification, ...prev].slice(0, 50));
    };

    socket.on('report:delivery', onDeliveryEvent);
    socket.on('staff:clock', onStaffClockEvent);

    return () => {
      socket.off('report:delivery', onDeliveryEvent);
      socket.off('staff:clock', onStaffClockEvent);
      socket.emit('whatsapp:unsubscribe', { branch_id: currentBranchId });
    };
  }, [currentBranchId, user]);

  const visibleNotifications = notifications.filter(n => !dismissedIds.has(n.id));

  if (!isOpen) return null;

  const successCount = visibleNotifications.filter(n => n.status === 'success').length;
  const failedCount = visibleNotifications.filter(n => n.status === 'failed').length;

  const handleDismiss = (id: string) => {
    setDismissedIds(prev => new Set(prev).add(id));
  };

  const handleClearAll = () => {
    setDismissedIds(new Set(notifications.map(n => n.id)));
  };

  return (
    <div className="absolute top-full right-0 mt-2 w-96 bg-card border border-border rounded-lg shadow-xl z-50 max-h-[600px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card rounded-t-lg">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Notifications</h3>
          {visibleNotifications.length > 0 && (
            <span className="ml-auto text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
              {visibleNotifications.length}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-accent transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Stats */}
      {visibleNotifications.length > 0 && (
        <div className="px-4 pt-3 pb-2 border-b border-border flex gap-4 bg-secondary/30">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs text-foreground">{successCount} Sent</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-xs text-foreground">{failedCount} Failed</span>
          </div>
        </div>
      )}

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto space-y-2 p-3">
        {isLoading && visibleNotifications.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-muted-foreground">Loading notifications...</p>
          </div>
        ) : visibleNotifications.length === 0 ? (
          <div className="py-12 text-center">
            <Bell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No notifications</p>
          </div>
        ) : (
          visibleNotifications.map(notification => (
            <div
              key={notification.id}
              className={`p-3 rounded-lg border transition-all ${
                notification.status === 'success'
                  ? 'bg-green-500/5 border-green-500/20 hover:bg-green-500/10'
                  : notification.status === 'failed'
                    ? 'bg-red-500/5 border-red-500/20 hover:bg-red-500/10'
                    : 'bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10'
              }`}
            >
              <div className="flex gap-3">
                {/* Icon */}
                <div className="flex-shrink-0 mt-0.5">
                  {notification.status === 'success' ? (
                    <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                  ) : notification.status === 'failed' ? (
                    <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
                      <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 min-w-0">
                        <FileText className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <p className="text-xs font-medium text-foreground truncate">{notification.document_name}</p>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <User className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-muted-foreground">{notification.recipient_name}</span>
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${getRecipientBadgeColor(notification.recipient_type)}`}>
                            {notification.recipient_type}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground break-words">{notification.message}</p>
                    </div>
                    <button
                      onClick={() => handleDismiss(notification.id)}
                      className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 p-1"
                      title="Dismiss"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1 mt-1.5 text-[10px] text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {formatTimeAgo(notification.timestamp)}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {visibleNotifications.length > 0 && (
        <div className="border-t border-border p-3 sticky bottom-0 bg-card rounded-b-lg">
          <button
            onClick={handleClearAll}
            className="w-full h-7 text-xs font-medium text-primary hover:bg-primary/10 rounded transition-colors"
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );
}
