import { useEffect, useState } from 'react';
import { X, Send, FileText, User, Smartphone, MessageSquare, Mail, Loader2, Download, CheckCircle2, AlertCircle } from 'lucide-react';
import { reportApi } from '../../api/reports';

interface ShareReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportId: string;
  sampleIdCode?: string;
  patientName?: string;
  patientPhone?: string;
  patientEmail?: string;
  doctorName?: string;
  doctorPhone?: string;
  doctorEmail?: string;
  hasDoctorRef?: boolean;
}

export function ShareReportModal({
  isOpen,
  onClose,
  reportId,
  sampleIdCode,
  patientName = '',
  patientPhone = '',
  patientEmail = '',
  doctorName = '',
  doctorPhone = '',
  doctorEmail = '',
  hasDoctorRef = false,
}: ShareReportModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [sentItems, setSentItems] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [patientPhoneInput, setPatientPhoneInput] = useState('');
  const [patientEmailInput, setPatientEmailInput] = useState('');
  const [doctorPhoneInput, setDoctorPhoneInput] = useState('');
  const [doctorEmailInput, setDoctorEmailInput] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setPatientPhoneInput(patientPhone || '');
    setPatientEmailInput(patientEmail || '');
    setDoctorPhoneInput(doctorPhone || '');
    setDoctorEmailInput(doctorEmail || '');
  }, [isOpen, patientPhone, patientEmail, doctorPhone, doctorEmail]);

  if (!isOpen) return null;

  const displayId = sampleIdCode || reportId.slice(0, 8);

  // Download PDF directly from backend (Puppeteer generated)
  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    setError(null);
    try {
      const { blob, filename } = await reportApi.downloadPdf(reportId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF generation failed:', err);
      setError('Failed to generate PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  // Send via backend (server generates PDF and sends directly)
  const handleWhatsApp = async (recipientType: 'patient' | 'doctor') => {
    const phone = (recipientType === 'patient' ? patientPhoneInput : doctorPhoneInput).trim();
    
    if (!phone) {
      setError(`${recipientType === 'patient' ? 'Patient' : 'Doctor'} phone number is not available`);
      return;
    }

    const channel = `whatsapp-${recipientType}`;
    if (sendingTo === channel) return; // Prevent double-click

    setSendingTo(channel);
    setError(null);

    try {
      await reportApi.send(reportId, 'whatsapp', recipientType, {
        recipient_phone: phone,
      });
      setSentItems(prev => [...prev, channel]);
    } catch (err) {
      console.error('WhatsApp send failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to send via WhatsApp');
    } finally {
      setSendingTo(null);
    }
  };

  // Step 2: Send via Email
  const handleEmail = async (recipientType: 'patient' | 'doctor') => {
    const channel = `email-${recipientType}`;
    if (sendingTo === channel) return;
    setSendingTo(channel);
    setError(null);
    try {
      const targetEmail = (recipientType === 'patient' ? patientEmailInput : doctorEmailInput).trim();
      const response = await reportApi.send(reportId, 'email', recipientType, {
        recipient_email: targetEmail,
      });
      const email = response.data?.recipient_email;
      const subject = response.data?.subject;
      const body = response.data?.body;

      if (!email || !subject || !body) {
        setError(`${recipientType === 'doctor' ? 'Doctor' : 'Patient'} email is not available`);
        return;
      }

      const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(mailtoUrl, '_blank');
      setSentItems(prev => [...prev, channel]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to prepare email');
    } finally {
      setSendingTo(null);
    }
  };

  const isSent = (channel: string, recipientType: string) =>
    sentItems.includes(`${channel}-${recipientType}`);

  const isSending = (channel: string, recipientType: string) =>
    sendingTo === `${channel}-${recipientType}`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-md max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-primary" />
            <h2 className="text-foreground text-sm font-medium">Share Report</h2>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-accent transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Report Info */}
        <div className="px-4 py-3 bg-secondary/30 border-b border-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <FileText className="w-3.5 h-3.5" />
            <span>Report: <span className="text-foreground font-medium">{displayId}</span></span>
            {patientName && (
              <>
                <span>•</span>
                <span>{patientName}</span>
              </>
            )}
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Error Alert */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded p-2 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-destructive font-medium">Error</p>
                <p className="text-xs text-destructive/80">{error}</p>
              </div>
            </div>
          )}

          {/* Optional backend PDF download */}
          <div className="space-y-2">
            <button
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              className="w-full h-10 flex items-center justify-center gap-2 rounded border text-sm transition-all bg-card border-border hover:bg-accent disabled:opacity-50"
            >
              {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span>{isDownloading ? 'Generating PDF...' : 'Download PDF (Server)'}</span>
            </button>
          </div>

          {/* Step 2: Share via channel */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-semibold">1</span>
              <span className="text-xs font-medium text-foreground">Send to</span>
            </div>

            {/* Patient */}
            <div className="p-3 border border-border rounded space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-foreground">Patient</span>
                  {patientName && (
                    <span className="text-[10px] text-muted-foreground">— {patientName}</span>
                  )}
                </div>
                {patientPhone && (
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Smartphone className="w-3 h-3" />
                    {patientPhoneInput || 'Not set'}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 gap-2">
                <div>
                  <label className="block text-[10px] text-muted-foreground mb-1">WhatsApp Number</label>
                  <input
                    type="text"
                    value={patientPhoneInput}
                    onChange={(e) => setPatientPhoneInput(e.target.value)}
                    placeholder="Enter patient WhatsApp number"
                    className="w-full h-8 px-2 rounded border border-border bg-background text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-muted-foreground mb-1">Email</label>
                  <input
                    type="email"
                    value={patientEmailInput}
                    onChange={(e) => setPatientEmailInput(e.target.value)}
                    placeholder="Enter patient email"
                    className="w-full h-8 px-2 rounded border border-border bg-background text-xs"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleWhatsApp('patient')}
                  disabled={!patientPhoneInput.trim() || isSending('whatsapp', 'patient')}
                  className={`flex-1 h-9 flex items-center justify-center gap-2 rounded border text-xs transition-all ${
                    isSent('whatsapp', 'patient')
                      ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400'
                      : 'bg-card border-border hover:bg-accent'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isSending('whatsapp', 'patient') ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <MessageSquare className="w-3.5 h-3.5 text-green-500" />
                  )}
                  <span>{isSent('whatsapp', 'patient') ? 'Sent' : 'WhatsApp'}</span>
                </button>
                <button
                  onClick={() => handleEmail('patient')}
                  disabled={!patientEmailInput.trim() || isSending('email', 'patient')}
                  className={`flex-1 h-9 flex items-center justify-center gap-2 rounded border text-xs transition-all ${
                    isSent('email', 'patient')
                      ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400'
                      : 'bg-card border-border hover:bg-accent'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5 text-blue-500" />
                  <span>{isSent('email', 'patient') ? 'Opened' : 'Email'}</span>
                </button>
              </div>
            </div>

            {/* Doctor */}
            {hasDoctorRef && (
              <div className="p-3 border border-border rounded space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-foreground">Doctor</span>
                    {doctorName && (
                      <span className="text-[10px] text-muted-foreground">— {doctorName}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    {doctorPhone && (
                      <span className="flex items-center gap-1">
                        <Smartphone className="w-3 h-3" />
                        {doctorPhoneInput || 'Not set'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <div>
                    <label className="block text-[10px] text-muted-foreground mb-1">WhatsApp Number</label>
                    <input
                      type="text"
                      value={doctorPhoneInput}
                      onChange={(e) => setDoctorPhoneInput(e.target.value)}
                      placeholder="Enter doctor WhatsApp number"
                      className="w-full h-8 px-2 rounded border border-border bg-background text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-muted-foreground mb-1">Email</label>
                    <input
                      type="email"
                      value={doctorEmailInput}
                      onChange={(e) => setDoctorEmailInput(e.target.value)}
                      placeholder="Enter doctor email"
                      className="w-full h-8 px-2 rounded border border-border bg-background text-xs"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleWhatsApp('doctor')}
                    disabled={!doctorPhoneInput.trim() || isSending('whatsapp', 'doctor')}
                    className={`flex-1 h-9 flex items-center justify-center gap-2 rounded border text-xs transition-all ${
                      isSent('whatsapp', 'doctor')
                        ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400'
                        : 'bg-card border-border hover:bg-accent'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isSending('whatsapp', 'doctor') ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <MessageSquare className="w-3.5 h-3.5 text-green-500" />
                    )}
                    <span>{isSent('whatsapp', 'doctor') ? 'Sent' : 'WhatsApp'}</span>
                  </button>
                  <button
                    onClick={() => handleEmail('doctor')}
                    disabled={!doctorEmailInput.trim() || isSending('email', 'doctor')}
                    className={`flex-1 h-9 flex items-center justify-center gap-2 rounded border text-xs transition-all ${
                      isSent('email', 'doctor')
                        ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400'
                        : 'bg-card border-border hover:bg-accent'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <Mail className="w-3.5 h-3.5 text-blue-500" />
                    <span>{isSent('email', 'doctor') ? 'Opened' : 'Email'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-card border-t border-border px-4 py-3 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="h-8 px-4 bg-secondary border border-border rounded text-xs hover:bg-accent transition-colors"
          >
            {sentItems.length > 0 ? 'Done' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Keep legacy export
export { ShareReportModal as WhatsAppModal };
