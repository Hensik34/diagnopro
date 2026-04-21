import { useState } from 'react';
import { X, Send, FileText, User, Smartphone, MessageSquare, Mail, Loader2, Download, CheckCircle2 } from 'lucide-react';

interface ShareReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportId: string;
  generatePDF?: () => Promise<File | null>;
  sampleIdCode?: string;
  patientName?: string;
  patientPhone?: string;
  doctorName?: string;
  doctorPhone?: string;
  doctorEmail?: string;
  hasDoctorRef?: boolean;
}

export function ShareReportModal({
  isOpen,
  onClose,
  reportId,
  generatePDF,
  sampleIdCode,
  patientName = '',
  patientPhone = '',
  doctorName = '',
  doctorPhone = '',
  doctorEmail = '',
  hasDoctorRef = false,
}: ShareReportModalProps) {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfDownloaded, setPdfDownloaded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sentItems, setSentItems] = useState<string[]>([]);

  if (!isOpen) return null;

  const displayId = sampleIdCode || reportId.slice(0, 8);

  const buildMessage = (recipientName: string, recipientType: 'patient' | 'doctor') => {
    return recipientType === 'patient'
      ? `Hello ${recipientName},\n\nYour laboratory test report (${displayId}) is ready.\nPlease find the report PDF attached.\n\nFor any questions, please contact us.\n\nBest regards,\nDiagnoPro`
      : `Hello ${recipientName},\n\nLaboratory test report (${displayId}) for patient ${patientName} is ready.\nPlease find the report PDF attached.\n\nBest regards,\nDiagnoPro`;
  };

  // Step 1: Generate and download PDF
  const handleDownloadPdf = async () => {
    if (!generatePDF) return;
    setIsGenerating(true);
    try {
      const file = await generatePDF();
      if (file) {
        setPdfFile(file);
        // Auto-download the file
        const url = URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
        setPdfDownloaded(true);
      }
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Step 2: Open WhatsApp with pre-filled message
  const handleWhatsApp = (recipientType: 'patient' | 'doctor') => {
    const phone = recipientType === 'patient' ? patientPhone : doctorPhone;
    const name = recipientType === 'patient' ? patientName : doctorName;
    if (!phone) return;

    const message = buildMessage(name, recipientType);
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    const whatsappUrl = `https://wa.me/${cleanPhone.replace('+', '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    setSentItems(prev => [...prev, `whatsapp-${recipientType}`]);
  };

  // Step 2: Open email client with pre-filled message
  const handleEmail = (recipientType: 'patient' | 'doctor') => {
    const email = recipientType === 'doctor' ? doctorEmail : '';
    const name = recipientType === 'patient' ? patientName : doctorName;

    const subject = `Lab Report ${displayId} - DiagnoPro`;
    const body = buildMessage(name, recipientType);

    const mailtoUrl = `mailto:${email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, '_blank');
    setSentItems(prev => [...prev, `email-${recipientType}`]);
  };

  const isSent = (channel: string, recipientType: string) =>
    sentItems.includes(`${channel}-${recipientType}`);

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
          {/* Step 1: Download PDF */}
          {generatePDF && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-semibold">1</span>
                <span className="text-xs font-medium text-foreground">Download Report PDF</span>
              </div>
              <button
                onClick={handleDownloadPdf}
                disabled={isGenerating}
                className={`w-full h-10 flex items-center justify-center gap-2 rounded border text-sm transition-all ${
                  pdfDownloaded
                    ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400'
                    : 'bg-card border-border hover:bg-accent'
                } disabled:opacity-50`}
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : pdfDownloaded ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>{isGenerating ? 'Generating PDF...' : pdfDownloaded ? 'PDF Downloaded' : 'Download PDF'}</span>
              </button>
              {pdfDownloaded && (
                <p className="text-[10px] text-muted-foreground text-center">
                  Attach this PDF when sharing via WhatsApp or Email
                </p>
              )}
            </div>
          )}

          {/* Step 2: Share via channel */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-semibold">{generatePDF ? '2' : '1'}</span>
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
                    {patientPhone}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleWhatsApp('patient')}
                  disabled={!patientPhone}
                  className={`flex-1 h-9 flex items-center justify-center gap-2 rounded border text-xs transition-all ${
                    isSent('whatsapp', 'patient')
                      ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400'
                      : 'bg-card border-border hover:bg-accent'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <MessageSquare className="w-3.5 h-3.5 text-green-500" />
                  <span>{isSent('whatsapp', 'patient') ? 'Opened' : 'WhatsApp'}</span>
                </button>
                <button
                  onClick={() => handleEmail('patient')}
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
                        {doctorPhone}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleWhatsApp('doctor')}
                    disabled={!doctorPhone}
                    className={`flex-1 h-9 flex items-center justify-center gap-2 rounded border text-xs transition-all ${
                      isSent('whatsapp', 'doctor')
                        ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400'
                        : 'bg-card border-border hover:bg-accent'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-green-500" />
                    <span>{isSent('whatsapp', 'doctor') ? 'Opened' : 'WhatsApp'}</span>
                  </button>
                  <button
                    onClick={() => handleEmail('doctor')}
                    disabled={!doctorEmail}
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

          {/* Hint */}
          {generatePDF && (
            <div className="text-[10px] text-muted-foreground bg-secondary/50 rounded p-2 text-center leading-relaxed">
              Download the PDF first, then click WhatsApp/Email. Attach the downloaded PDF in the chat or email manually.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-card border-t border-border px-4 py-3 flex justify-end">
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
