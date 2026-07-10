import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, QrCode, Unplug, Send, RefreshCw, AlertTriangle, Save } from 'lucide-react';
import { whatsappApi, getWhatsAppSocket, closeWhatsAppSocket, type WhatsAppSession, type WhatsAppTemplate } from '../../api/whatsapp';
import { useBranchStore } from '../../stores';

const EVENT_OPTIONS = [
  { key: 'report_ready', label: 'Report Ready', defaultTemplate: 'Hello {{patient_name}}, your report for {{test_name}} is ready at {{branch_name}}. View report: {{report_link}}' },
  { key: 'report_approved', label: 'Report Approved', defaultTemplate: 'Hello {{patient_name}}, your report for {{test_name}} has been approved by our pathologist at {{branch_name}}. View report: {{report_link}}' },
  { key: 'appointment_confirmation', label: 'Appointment Confirmation', defaultTemplate: 'Hello {{patient_name}}, your appointment is confirmed at {{branch_name}} on {{appointment_date}} at {{appointment_time}}.' },
  { key: 'appointment_reminder', label: 'Appointment Reminder', defaultTemplate: 'Reminder: {{patient_name}}, you have an appointment at {{branch_name}} on {{appointment_date}} at {{appointment_time}}.' },
  { key: 'payment_confirmation', label: 'Payment Confirmation', defaultTemplate: 'Hello {{patient_name}}, we received your payment of {{payment_amount}} for {{test_name}} at {{branch_name}}. Thank you.' },
  { key: 'registration_confirmation', label: 'Registration Confirmation', defaultTemplate: 'Welcome {{patient_name}}. Your registration at {{branch_name}} is complete for tests: {{patient_tests}}. Thank you for choosing us!' },
];

type TemplateDraft = {
  event_key: string;
  template_name: string;
  template_body: string;
  is_enabled: boolean;
};

export function WhatsAppIntegration() {
  const { branches, currentBranchId } = useBranchStore();

  const [activeBranchId, setActiveBranchId] = useState<string | null>(currentBranchId || null);
  const [connection, setConnection] = useState<WhatsAppSession | null>(null);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, _setError] = useState<string | null>(null);
  const setError = (msg: string | null) => {
    _setError(msg);
    if (msg) toast.error(msg);
  };

  const [recipient, setRecipient] = useState('');
  const [messageText, setMessageText] = useState('Hello from DiagnoPro WhatsApp integration.');
  const [sending, setSending] = useState(false);

  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [templateDrafts, setTemplateDrafts] = useState<Record<string, TemplateDraft>>({});
  const [settingsMap, setSettingsMap] = useState<Record<string, boolean>>({});
  const [socketHealthy, setSocketHealthy] = useState(true);
  const [savingTemplates, setSavingTemplates] = useState<Record<string, boolean>>({});

  const selectedBranch = useMemo(
    () => branches.find((branch) => branch.id === activeBranchId) || null,
    [branches, activeBranchId]
  );

  useEffect(() => {
    if (!activeBranchId && currentBranchId) {
      setActiveBranchId(currentBranchId);
    }
  }, [activeBranchId, currentBranchId]);

  const hydrateTemplateDrafts = (loadedTemplates: WhatsAppTemplate[]) => {
    const nextDrafts: Record<string, TemplateDraft> = {};

    for (const event of EVENT_OPTIONS) {
      const matched = loadedTemplates.find((row) => row.event_key === event.key);
      nextDrafts[event.key] = {
        event_key: event.key,
        template_name: matched?.template_name || event.label,
        template_body: matched?.template_body || event.defaultTemplate || '',
        is_enabled: matched?.is_enabled ?? true,
      };
    }

    setTemplateDrafts(nextDrafts);
  };

  const loadAll = async (branchId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const [statusRes, templatesRes, settingsRes] = await Promise.all([
        whatsappApi.getStatus(branchId),
        whatsappApi.listTemplates(branchId),
        whatsappApi.getNotificationSettings(branchId),
      ]);

      const loadedTemplates = templatesRes.data || [];
      setConnection(statusRes.data.session || null);
      setQrImage(statusRes.data.qr?.qr || null);
      setTemplates(loadedTemplates);
      hydrateTemplateDrafts(loadedTemplates);
      setSettingsMap(settingsRes.data || {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load WhatsApp data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!activeBranchId) return;
    loadAll(activeBranchId);
  }, [activeBranchId]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = getWhatsAppSocket(token);

    const handleConnect = () => {
      setSocketHealthy(true);
    };

    socket.on('connect_error', (err: Error) => {
      setSocketHealthy(false);
      setError(err.message || 'Failed to connect realtime channel');
    });

    socket.on('connect', handleConnect);

    socket.on('whatsapp:qr', (payload: { branch_id: string; qr: string }) => {
      if (payload.branch_id === activeBranchId) {
        setQrImage(payload.qr);
      }
    });

    socket.on('whatsapp:status', (payload: { branch_id: string; status: WhatsAppSession }) => {
      if (payload.branch_id === activeBranchId) {
        setConnection(payload.status);
      }
    });

    socket.on('whatsapp:connected', (payload: { branch_id: string; phone_number?: string }) => {
      if (payload.branch_id === activeBranchId) {
        setConnection((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            status: 'connected',
            phone_number: payload.phone_number || prev.phone_number,
          };
        });
        setQrImage(null);
      }
    });

    socket.on('whatsapp:disconnected', (payload: { branch_id: string }) => {
      if (payload.branch_id === activeBranchId) {
        setConnection((prev) => prev ? { ...prev, status: 'disconnected' } : prev);
        setQrImage(null);
      }
    });

    if (activeBranchId) {
      socket.emit('whatsapp:subscribe', { branch_id: activeBranchId });
    }

    return () => {
      if (activeBranchId) {
        socket.emit('whatsapp:unsubscribe', { branch_id: activeBranchId });
      }
      socket.off('connect_error');
      socket.off('connect', handleConnect);
      socket.off('whatsapp:qr');
      socket.off('whatsapp:status');
      socket.off('whatsapp:connected');
      socket.off('whatsapp:disconnected');
      closeWhatsAppSocket();
    };
  }, [activeBranchId]);

  useEffect(() => {
    if (!activeBranchId) return;

    const shouldPoll =
      !socketHealthy ||
      connection?.status === 'connecting' ||
      connection?.status === 'qr_ready';
    if (!shouldPoll) return;

    const intervalId = window.setInterval(async () => {
      try {
        const response = await whatsappApi.getStatus(activeBranchId);
        setConnection(response.data.session || null);
        if (response.data.qr?.qr) {
          setQrImage(response.data.qr.qr);
        }
      } catch {
        // Keep background fallback silent; explicit actions already surface errors.
      }
    }, 2000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [activeBranchId, socketHealthy, connection?.status]);

  const handleConnect = async () => {
    if (!activeBranchId) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await whatsappApi.connect(activeBranchId);
      setConnection(response.data.session);
      setQrImage(response.data.qr?.qr || null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error('[WhatsApp Frontend] Connect error:', errorMsg);
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshQr = async () => {
    if (!activeBranchId) return;
    setIsLoading(true);
    try {
      const response = await whatsappApi.getQr(activeBranchId);
      setQrImage(response.data?.qr || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh QR');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!activeBranchId) return;
    setIsLoading(true);
    try {
      const response = await whatsappApi.disconnect(activeBranchId);
      setConnection(response.data);
      setQrImage(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!activeBranchId || !recipient || !messageText) return;

    setSending(true);
    try {
      await whatsappApi.sendMessage(activeBranchId, recipient, messageText);
      setRecipient('');
      toast.success('Test message sent successfully');
      await loadAll(activeBranchId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const updateTemplateDraft = (eventKey: string, patch: Partial<TemplateDraft>) => {
    setTemplateDrafts((prev) => ({
      ...prev,
      [eventKey]: {
        ...(prev[eventKey] || {
          event_key: eventKey,
          template_name: '',
          template_body: '',
          is_enabled: true,
        }),
        ...patch,
      },
    }));
  };

  const saveTemplate = async (eventKey: string) => {
    if (!activeBranchId) return;

    const draft = templateDrafts[eventKey];
    if (!draft) return;

    setSavingTemplates((prev) => ({ ...prev, [eventKey]: true }));
    try {
      await whatsappApi.saveTemplate({
        branch_id: activeBranchId,
        event_key: eventKey,
        template_name: draft.template_name,
        template_body: draft.template_body,
        is_enabled: true,
      });
      toast.success('Template saved successfully');
      await loadAll(activeBranchId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save template');
    } finally {
      setSavingTemplates((prev) => ({ ...prev, [eventKey]: false }));
    }
  };

  const toggleNotification = async (eventKey: string, nextValue: boolean) => {
    if (!activeBranchId) return;

    try {
      await whatsappApi.saveNotificationSetting(activeBranchId, eventKey, nextValue);
      setSettingsMap((prev) => ({ ...prev, [eventKey]: nextValue }));
      toast.success(`Notification ${nextValue ? 'enabled' : 'disabled'} successfully`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update notification setting');
    }
  };

  if (!activeBranchId) {
    return <div className="p-8 text-sm text-muted-foreground">Select a branch to configure WhatsApp integration.</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground tracking-tight">WhatsApp Integration</h2>
          <p className="text-sm text-muted-foreground mt-1">Connect a dedicated WhatsApp account for each branch and manage templates, notifications, and delivery logs.</p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={activeBranchId || ''}
            onChange={(event) => setActiveBranchId(event.target.value)}
            className="h-10 rounded-md border border-border bg-card px-3 text-sm"
          >
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>{branch.name}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => activeBranchId && loadAll(activeBranchId)}
            className="h-10 px-3 border border-border rounded-md text-sm hover:bg-secondary/50"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-md border border-destructive/20 bg-destructive/10 text-destructive text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground">Connection</h3>
            <span className={`text-xs px-2 py-1 rounded-full border ${connection?.status === 'connected' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
              {connection?.status || 'disconnected'}
            </span>
          </div>

          <div className="text-sm text-muted-foreground">
            Branch: <span className="font-medium text-foreground">{selectedBranch?.name || 'Unknown'}</span>
          </div>

          {connection?.phone_number && (
            <div className="text-sm text-muted-foreground">
              Connected Number: <span className="font-medium text-foreground">{connection.phone_number}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleConnect}
              disabled={isLoading}
              className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
              Generate QR
            </button>
            <button
              type="button"
              onClick={handleRefreshQr}
              disabled={isLoading}
              className="h-9 px-4 rounded-md border border-border text-sm font-medium hover:bg-secondary/50"
            >
              Refresh QR
            </button>
            <button
              type="button"
              onClick={handleDisconnect}
              disabled={isLoading}
              className="h-9 px-4 rounded-md bg-destructive/10 text-destructive text-sm font-medium hover:bg-destructive/20 flex items-center gap-2"
            >
              <Unplug className="w-4 h-4" />
              Disconnect
            </button>
          </div>

          <div className="rounded-lg border border-border p-4 min-h-[280px] flex items-center justify-center bg-secondary/20">
            {qrImage ? (
              <img src={qrImage} alt="WhatsApp QR" className="w-56 h-56 object-contain" />
            ) : (
              <div className="text-center text-sm text-muted-foreground">
                <QrCode className="w-10 h-10 mx-auto mb-2 opacity-60" />
                <p>Generate QR and scan from WhatsApp Linked Devices.</p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="text-base font-semibold text-foreground">Send Test Message</h3>
          <input
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="Recipient number (e.g. 9876543210, +91 auto-handled)"
            className="w-full h-10 px-3 border border-border rounded-md bg-transparent text-sm"
          />
          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            rows={6}
            className="w-full p-3 border border-border rounded-md bg-transparent text-sm"
          />
          <button
            type="button"
            onClick={handleSendMessage}
            disabled={sending || !recipient || !messageText}
            className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 flex items-center gap-2"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send Message
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h3 className="text-base font-semibold text-foreground">Notification Settings</h3>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {EVENT_OPTIONS.map((event) => {
            const enabled = settingsMap[event.key] ?? true;
            return (
              <label key={event.key} className="flex items-center justify-between border border-border rounded-md p-3 text-sm hover:cursor-pointer">
                <span>{event.label}</span>
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => toggleNotification(event.key, e.target.checked)}
                />
              </label>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h3 className="text-base font-semibold text-foreground">Message Templates</h3>
        <div className="space-y-4">
          {EVENT_OPTIONS.map((event) => {
            const draft = templateDrafts[event.key] || {
              event_key: event.key,
              template_name: event.label,
              template_body: event.defaultTemplate || '',
              is_enabled: true,
            };

            return (
              <div key={event.key} className="border border-border rounded-md p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-foreground">{draft.template_name || event.label}</h4>
                </div>
                <textarea
                  value={draft.template_body}
                  onChange={(e) => updateTemplateDraft(event.key, { template_body: e.target.value })}
                  rows={4}
                  className="w-full p-3 border border-border rounded-md bg-transparent text-sm"
                  placeholder="Enter template message..."
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => saveTemplate(event.key)}
                    disabled={savingTemplates[event.key] || isLoading}
                    className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {savingTemplates[event.key] ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    {savingTemplates[event.key] ? 'Saving...' : 'Save Template'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>


    </div>
  );
}
