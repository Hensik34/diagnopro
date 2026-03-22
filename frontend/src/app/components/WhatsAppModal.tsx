import { useState } from 'react';
import { X, Send, FileText, User, Smartphone, MessageSquare } from 'lucide-react';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportId?: string;
  patientName?: string;
  patientPhone?: string;
  doctorName?: string;
  doctorPhone?: string;
}

export function WhatsAppModal({
  isOpen,
  onClose,
  reportId = 'REP-2024-001234',
  patientName = 'Sarah Jenkins',
  patientPhone = '+1 555-0123',
  doctorName = 'Dr. Michael Thompson',
  doctorPhone = '+1 555-2001',
}: WhatsAppModalProps) {
  const [recipient, setRecipient] = useState<'patient' | 'doctor'>('patient');
  const [phoneNumber, setPhoneNumber] = useState(patientPhone);
  const [attachPdf, setAttachPdf] = useState(true);
  const [customMessage, setCustomMessage] = useState('');

  if (!isOpen) return null;

  const handleRecipientChange = (newRecipient: 'patient' | 'doctor') => {
    setRecipient(newRecipient);
    setPhoneNumber(newRecipient === 'patient' ? patientPhone : doctorPhone);
  };

  const defaultMessage = recipient === 'patient'
    ? `Hello ${patientName},\n\nYour laboratory test report (${reportId}) is now ready. Please find the attached PDF with your test results.\n\nFor any questions, please contact us.\n\nBest regards,\nDiagnoLab`
    : `Hello ${doctorName},\n\nLaboratory test report (${reportId}) for your patient ${patientName} has been completed. Please find the attached PDF with the test results.\n\nBest regards,\nDiagnoLab`;

  const messagePreview = customMessage || defaultMessage;

  const handleSend = () => {
    // In a real app, this would send via WhatsApp API
    const whatsappUrl = `https://wa.me/${phoneNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(messagePreview)}`;
    console.log('Sending WhatsApp to:', phoneNumber);
    console.log('Message:', messagePreview);
    console.log('Attach PDF:', attachPdf);
    console.log('WhatsApp URL:', whatsappUrl);
    
    // Open WhatsApp in new tab
    window.open(whatsappUrl, '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-success" />
            <h2 className="text-foreground text-sm">Share via WhatsApp</h2>
          </div>
          <button 
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-accent transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 space-y-4">
          {/* Recipient Selection */}
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-2">
              Select Recipient
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleRecipientChange('patient')}
                className={`h-20 px-4 rounded border-2 transition-all ${
                  recipient === 'patient'
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card hover:bg-accent'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <User className={`w-5 h-5 ${recipient === 'patient' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div className="text-center">
                    <div className={`text-xs font-medium ${recipient === 'patient' ? 'text-primary' : 'text-foreground'}`}>
                      Patient
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {patientName}
                    </div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleRecipientChange('doctor')}
                className={`h-20 px-4 rounded border-2 transition-all ${
                  recipient === 'doctor'
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card hover:bg-accent'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <User className={`w-5 h-5 ${recipient === 'doctor' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div className="text-center">
                    <div className={`text-xs font-medium ${recipient === 'doctor' ? 'text-primary' : 'text-foreground'}`}>
                      Doctor
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {doctorName}
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="text-xs text-foreground block mb-1">
              Phone Number <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Smartphone className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground w-3.5 h-3.5" />
              <input 
                type="tel"
                className="w-full h-9 pl-8 pr-3 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1 555-0000"
              />
            </div>
          </div>

          {/* Attach PDF Toggle */}
          <div className="flex items-center justify-between p-3 bg-secondary/50 border border-border rounded">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <div>
                <div className="text-xs text-foreground font-medium">Attach PDF Report</div>
                <div className="text-[10px] text-muted-foreground">
                  Report ID: {reportId}
                </div>
              </div>
            </div>
            <button
              onClick={() => setAttachPdf(!attachPdf)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                attachPdf ? 'bg-primary' : 'bg-border'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  attachPdf ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Custom Message */}
          <div>
            <label className="text-xs text-foreground block mb-1">
              Custom Message (Optional)
            </label>
            <textarea
              className="w-full px-2.5 py-2 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              rows={3}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Type a custom message or leave empty to use default template..."
            />
          </div>

          {/* Message Preview */}
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-2">
              Message Preview
            </label>
            <div className="bg-secondary/50 border border-border rounded p-3 max-h-40 overflow-y-auto">
              <pre className="text-xs text-foreground whitespace-pre-wrap font-sans">
                {messagePreview}
              </pre>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-card border-t border-border px-4 py-3 flex items-center justify-between">
          <div className="text-[10px] text-muted-foreground">
            {attachPdf && (
              <span className="flex items-center gap-1">
                <FileText className="w-3 h-3" />
                PDF will be shared via WhatsApp Web or App
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={onClose}
              className="h-8 px-3 bg-secondary border border-border rounded text-xs hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSend}
              className="h-8 px-3 bg-success text-white rounded text-xs hover:opacity-90 transition-opacity flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              Send via WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
