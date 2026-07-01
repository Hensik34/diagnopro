import { useState, useEffect, useRef } from 'react';
import { CustomConfirmModal } from '../../app/components/ui/CustomConfirmModal';
import {
  Upload,
  Image as ImageIcon,
  FileSignature,
  Loader2,
  AlertCircle,
  Check,
  User,
  Settings as SettingsIcon,
  ChevronRight,
  Trash2,
  Save,
  Star,
  Plus,
  MessageCircle,
  RotateCcw,
  SlidersHorizontal
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useSettingsStore, useBranchStore, useAuthStore } from '../../stores';
import { authApi } from '../../api/auth';
import { WhatsAppIntegration } from './WhatsAppIntegration';
import { analyzeLetterhead } from '../../utils/letterheadAnalyzer';

export function Settings() {
  const { settings, isLoading, error, fetchSettings, uploadLetterhead, uploadLabSignature, updateSignatureLabel, updateDefaultSignature, removeImage: removeSettingsImage } = useSettingsStore();
  const { currentBranchId } = useBranchStore();
  const { user, fetchProfile } = useAuthStore();
  const { theme, setTheme } = useTheme();

  const activeBranchId = currentBranchId || '';

  const [activeTab, setActiveTab] = useState('letterhead-sign');

  const [letterheadPreview, setLetterheadPreview] = useState<string | null>(null);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [letterheadError, setLetterheadError] = useState<string | null>(null);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'confirm' | 'danger' | 'warning' | 'alert';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'confirm',
    onConfirm: () => {}
  });

  const [pendingLetterheadFile, setPendingLetterheadFile] = useState<File | null>(null);

  const letterheadInputRef = useRef<HTMLInputElement>(null);

  // Owner Signature state
  const [ownerSignaturePreview, setOwnerSignaturePreview] = useState<string | null>(null);
  const [pendingOwnerSignatureFile, setPendingOwnerSignatureFile] = useState<File | null>(null);
  const ownerSignatureInputRef = useRef<HTMLInputElement>(null);

  // Lab Signatures state (up to 4)
  const [sigLabels, setSigLabels] = useState<Record<number, string>>({});
  const [sigEditingLabel, setEditingLabel] = useState<number | null>(null);
  const [labSignatureFiles, setLabSignatureFiles] = useState<Record<number, File | null>>({ 1: null, 2: null, 3: null, 4: null });
  const [labSignaturePreviews, setLabSignaturePreviews] = useState<Record<number, string | null>>({ 1: null, 2: null, 3: null, 4: null });
  const labSignatureInputRefs = useRef<Record<number, HTMLInputElement | null>>({ 1: null, 2: null, 3: null, 4: null });
  const [defaultSignatureIndex, setDefaultSignatureIndex] = useState<number | null>(null);
  const [brandingDraft, setBrandingDraft] = useState({
    report_margin_top: 80,
    report_margin_bottom: 80,
    report_margin_left: 28,
    report_margin_right: 28,
    header_safe_area: 24,
    footer_safe_area: 24,
  });
  const [analysisConfidence, setAnalysisConfidence] = useState<{
    top: number;
    bottom: number;
    left: number;
    right: number;
  } | null>(null);
  const [isSavingBranding, setIsSavingBranding] = useState(false);
  const [sampleIdDraft, setSampleIdDraft] = useState({
    sample_id_format: 'numeric' as 'numeric' | 'sm_prefix',
    sample_id_reset_policy: 'yearly' as 'yearly' | 'monthly',
    sample_id_fy_start_month: 3,
    sample_id_start_number: 1001,
  });
  const [isSavingSampleId, setIsSavingSampleId] = useState(false);

  // Profile Form State
  const [formFirstname, setFormFirstname] = useState('');
  const [formLastname, setFormLastname] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Fetch settings on mount
  const normalizePx = (value: unknown, fallback: number) => {
    if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.round(value));
    if (typeof value === 'string') {
      const s = value.trim().toLowerCase();
      if (!s) return fallback;
      if (s.endsWith('mm')) {
        const n = Number.parseFloat(s.slice(0, -2));
        if (Number.isFinite(n)) return Math.max(0, Math.round(n * 3.78));
      }
      if (s.endsWith('px')) {
        const n = Number.parseFloat(s.slice(0, -2));
        if (Number.isFinite(n)) return Math.max(0, Math.round(n));
      }
      const n = Number.parseFloat(s);
      if (Number.isFinite(n)) return Math.max(0, Math.round(n));
    }
    return fallback;
  };

  // Fetch settings on mount
  useEffect(() => {
    if (activeBranchId) {
      fetchSettings(activeBranchId);
    }
  }, [fetchSettings, activeBranchId]);

  // Set profile data when user changes
  useEffect(() => {
    if (user) {
      setFormFirstname(user.firstname || '');
      setFormLastname(user.lastname || '');
      setFormPhone(user.phone || '');
    }
  }, [user]);

  // Set previews when settings load
  useEffect(() => {
    if (settings && !pendingLetterheadFile) {
      setLetterheadPreview(settings.letterhead_url || null);
    }
    if (settings && !pendingOwnerSignatureFile) {
      setOwnerSignaturePreview(settings.owner_signature_url || null);
    }
    if (settings) {
      // Initialize lab signature labels
      const labels: Record<number, string> = {};
      if (settings.signature_1_label) labels[1] = settings.signature_1_label;
      if (settings.signature_2_label) labels[2] = settings.signature_2_label;
      if (settings.signature_3_label) labels[3] = settings.signature_3_label;
      if (settings.signature_4_label) labels[4] = settings.signature_4_label;
      setSigLabels(labels);

      // Initialize lab signature previews
      const previews: Record<number, string | null> = { 1: null, 2: null, 3: null, 4: null };
      if (settings.signature_1_url) previews[1] = settings.signature_1_url;
      if (settings.signature_2_url) previews[2] = settings.signature_2_url;
      if (settings.signature_3_url) previews[3] = settings.signature_3_url;
      if (settings.signature_4_url) previews[4] = settings.signature_4_url;
      setLabSignaturePreviews(previews);

      // Initialize default signature index
      setDefaultSignatureIndex(settings.default_signature_index || null);
      setBrandingDraft({
        report_margin_top: normalizePx(settings.report_margin_top, 80),
        report_margin_bottom: normalizePx(settings.report_margin_bottom, 80),
        report_margin_left: normalizePx(settings.report_margin_left, 28),
        report_margin_right: normalizePx(settings.report_margin_right, 28),
        header_safe_area: normalizePx(settings.header_safe_area, 24),
        footer_safe_area: normalizePx(settings.footer_safe_area, 24),
      });
      if (settings.letterhead_detected_top !== undefined && settings.letterhead_detected_top !== null) {
        setAnalysisConfidence({
          top: 0.95,
          bottom: 0.95,
          left: 0.95,
          right: 0.95
        });
      }
      setSampleIdDraft({
        sample_id_format: settings.sample_id_format ?? 'numeric',
        sample_id_reset_policy: settings.sample_id_reset_policy ?? 'yearly',
        sample_id_fy_start_month: settings.sample_id_fy_start_month ?? 3,
        sample_id_start_number: settings.sample_id_start_number ?? 1001,
      });
    }
  }, [settings, pendingLetterheadFile, pendingOwnerSignatureFile]);

  const handleLetterheadSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLetterheadError(null);

    const img = new Image();
    img.onload = async () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      URL.revokeObjectURL(img.src);

      if (w >= h) {
        setLetterheadError(
          `Image must be portrait orientation (height > width). Your image is ${w}×${h}px. ` +
          'Upload a full A4 page letterhead image (e.g. 794×1123px or similar portrait ratio).'
        );
        if (letterheadInputRef.current) letterheadInputRef.current.value = '';
        return;
      }

      if (w < 600 || h < 800) {
        setLetterheadError(
          `Image is too small (${w}×${h}px). Minimum required: 600×800px. ` +
          'Upload a high-resolution full-page letterhead for best print quality.'
        );
        if (letterheadInputRef.current) letterheadInputRef.current.value = '';
        return;
      }

      setPendingLetterheadFile(file);
      setLetterheadPreview(URL.createObjectURL(file));

      // Auto-detect safe zones from the image
      try {
        const analysis = await analyzeLetterhead(file);
        setBrandingDraft(prev => ({
          ...prev,
          report_margin_top: analysis.topMargin,
          report_margin_bottom: analysis.bottomMargin,
          report_margin_left: analysis.leftMargin,
          report_margin_right: analysis.rightMargin,
          header_safe_area: 0,
          footer_safe_area: 0,
        }));
        setAnalysisConfidence(analysis.confidence);
        showSuccess("Margins auto-detected from your letterhead. Review and adjust if needed.");
      } catch (err) {
        console.error("Auto-detect failed:", err);
      }
    };
    img.onerror = () => {
      setLetterheadError('Could not read the image file. Please select a valid image.');
      if (letterheadInputRef.current) letterheadInputRef.current.value = '';
    };
    img.src = URL.createObjectURL(file);
  };


  const discardLetterhead = () => {
    setPendingLetterheadFile(null);
    setLetterheadPreview(settings?.letterhead_url || null);
    setLetterheadError(null);
    if (letterheadInputRef.current) letterheadInputRef.current.value = '';

    if (settings) {
      setBrandingDraft({
        report_margin_top: normalizePx(settings.report_margin_top, 80),
        report_margin_bottom: normalizePx(settings.report_margin_bottom, 80),
        report_margin_left: normalizePx(settings.report_margin_left, 28),
        report_margin_right: normalizePx(settings.report_margin_right, 28),
        header_safe_area: normalizePx(settings.header_safe_area, 24),
        footer_safe_area: normalizePx(settings.footer_safe_area, 24),
      });
      if (settings.letterhead_detected_top !== undefined && settings.letterhead_detected_top !== null) {
        setAnalysisConfidence({
          top: 0.95,
          bottom: 0.95,
          left: 0.95,
          right: 0.95
        });
      } else {
        setAnalysisConfidence(null);
      }
    }
  };

  const confirmLetterhead = async () => {
    if (!activeBranchId) {
      alert('Branch ID not found. Please select a branch.');
      return;
    }
    if (!pendingLetterheadFile) return;

    setUploadingField('letterhead');
    try {
      const detected = {
        top: brandingDraft.report_margin_top,
        bottom: brandingDraft.report_margin_bottom,
        left: brandingDraft.report_margin_left,
        right: brandingDraft.report_margin_right,
      };
      // Save letterhead and margins in a single API call, setting margins auto to true
      const result = await uploadLetterhead(activeBranchId, pendingLetterheadFile, detected, true);
      if (result) {
        setPendingLetterheadFile(null);
        showSuccess('Letterhead uploaded and margins auto-saved successfully');
      }
    } finally {
      setUploadingField(null);
      if (letterheadInputRef.current) letterheadInputRef.current.value = '';
    }
  };

  // Lab Signature Handlers
  const handleLabSignatureSelect = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLabSignatureFiles({ ...labSignatureFiles, [index]: file });
    setLabSignaturePreviews({ ...labSignaturePreviews, [index]: URL.createObjectURL(file) });
  };

  const discardLabSignature = (index: number) => {
    setLabSignatureFiles({ ...labSignatureFiles, [index]: null });
    setLabSignaturePreviews({ ...labSignaturePreviews, [index]: settings?.[`signature_${index}_url` as keyof typeof settings] as string | null || null });
    if (labSignatureInputRefs.current[index]) labSignatureInputRefs.current[index]!.value = '';
  };

  const confirmLabSignature = async (index: number) => {
    if (!activeBranchId) {
      alert('Branch ID not found. Please select a branch.');
      return;
    }
    const file = labSignatureFiles[index];
    if (!file) return;

    setUploadingField(`lab_sig_${index}`);
    try {
      const label = sigLabels[index] || `Signature ${index}`;
      const result = await uploadLabSignature(activeBranchId, index, file, label);
      if (result) {
        setLabSignatureFiles({ ...labSignatureFiles, [index]: null });
        showSuccess(`Lab signature ${index} uploaded successfully`);
        // Refresh settings
        fetchSettings(activeBranchId);
      }
    } finally {
      setUploadingField(null);
      if (labSignatureInputRefs.current[index]) labSignatureInputRefs.current[index]!.value = '';
    }
  };

  const handleReDetect = async () => {
    if (!letterheadPreview) return;
    try {
      setUploadingField('detecting');

      let fileToAnalyze: File | null = pendingLetterheadFile;
      if (!fileToAnalyze) {
        // Fetch from URL
        const imgUrl = getImageUrl(letterheadPreview);
        if (!imgUrl) return;
        const response = await fetch(imgUrl);
        const blob = await response.blob();
        fileToAnalyze = new File([blob], 'letterhead.png', { type: blob.type });
      }

      const analysis = await analyzeLetterhead(fileToAnalyze);
      setBrandingDraft(prev => ({
        ...prev,
        report_margin_top: analysis.topMargin,
        report_margin_bottom: analysis.bottomMargin,
        report_margin_left: analysis.leftMargin,
        report_margin_right: analysis.rightMargin,
        header_safe_area: 0,
        footer_safe_area: 0,
      }));
      setAnalysisConfidence(analysis.confidence);
      showSuccess("Letterhead margins re-detected successfully.");
    } catch (err) {
      console.error(err);
      alert("Could not re-detect margins. Try uploading the file again.");
    } finally {
      setUploadingField(null);
    }
  };

  const handleMouseDown = (edge: 'top' | 'bottom' | 'left' | 'right') => (e: React.MouseEvent) => {
    e.preventDefault();
    const startVal = brandingDraft[`report_margin_${edge}` as keyof typeof brandingDraft];
    const startPos = edge === 'top' || edge === 'bottom' ? e.clientY : e.clientX;
    const PREVIEW_WIDTH = 280;
    const PREVIEW_HEIGHT = 396;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = (edge === 'top' || edge === 'bottom' ? moveEvent.clientY : moveEvent.clientX) - startPos;
      let deltaA4 = 0;
      if (edge === 'top' || edge === 'bottom') {
        deltaA4 = Math.round((delta / PREVIEW_HEIGHT) * 1123);
      } else {
        deltaA4 = Math.round((delta / PREVIEW_WIDTH) * 794);
      }

      let newVal = 0;
      if (edge === 'top') {
        newVal = Math.max(20, Math.min(450, startVal + deltaA4));
      } else if (edge === 'bottom') {
        newVal = Math.max(10, Math.min(450, startVal - deltaA4));
      } else if (edge === 'left') {
        newVal = Math.max(8, Math.min(150, startVal + deltaA4));
      } else if (edge === 'right') {
        newVal = Math.max(8, Math.min(150, startVal - deltaA4));
      }

      setBrandingDraft(prev => ({
        ...prev,
        [`report_margin_${edge}`]: newVal
      }));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };


  const handleSetDefaultSignature = async (index: number) => {
    if (!activeBranchId) {
      alert('Branch ID not found. Please select a branch.');
      return;
    }

    setUploadingField(`default_sig`);
    try {
      const result = await updateDefaultSignature(activeBranchId, index);
      if (result) {
        setDefaultSignatureIndex(index);
        showSuccess(`Signature ${index} set as default`);
      }
    } finally {
      setUploadingField(null);
    }
  };

  const handleDeleteLabSignature = (index: number) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Signature',
      message: `Are you sure you want to delete signature ${index}?`,
      type: 'danger',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setUploadingField(`delete_lab_sig_${index}`);
        try {
          const result = await removeSettingsImage(`signature_${index}_url`);
          if (result) {
            setLabSignaturePreviews({ ...labSignaturePreviews, [index]: null });
            setSigLabels({ ...sigLabels, [index]: '' });
            if (defaultSignatureIndex === index) {
              setDefaultSignatureIndex(null);
            }
            showSuccess(`Signature ${index} deleted successfully`);
          }
        } catch (err) {
          console.error(err);
        } finally {
          setUploadingField(null);
        }
      }
    });
  };

  const handleUpdateSignatureLabel = async (index: number, newLabel: string) => {
    if (!activeBranchId) return;

    try {
      const result = await updateSignatureLabel(activeBranchId, index, newLabel);
      if (result) {
        setSigLabels({ ...sigLabels, [index]: newLabel });
        setEditingLabel(null);
        showSuccess(`Signature ${index} label updated`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOwnerSignatureSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingOwnerSignatureFile(file);
    setOwnerSignaturePreview(URL.createObjectURL(file));
  };

  const discardOwnerSignature = () => {
    setPendingOwnerSignatureFile(null);
    setOwnerSignaturePreview(settings?.owner_signature_url || null);
    if (ownerSignatureInputRef.current) ownerSignatureInputRef.current.value = '';
  };

  const confirmOwnerSignature = async () => {
    if (!activeBranchId) {
      setConfirmModal({
        isOpen: true,
        title: 'Branch Required',
        message: 'Branch ID not found. Please select a branch.',
        type: 'alert',
        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }
    if (!pendingOwnerSignatureFile) return;

    setUploadingField('owner_signature');
    try {
      const result = await useSettingsStore.getState().uploadOwnerSignature(activeBranchId, pendingOwnerSignatureFile);
      if (result) {
        setPendingOwnerSignatureFile(null);
        showSuccess('Owner signature uploaded successfully');
      }
    } finally {
      setUploadingField(null);
      if (ownerSignatureInputRef.current) ownerSignatureInputRef.current.value = '';
    }
  };

  const showSuccess = (message: string) => {
    setUploadSuccess(message);
    setTimeout(() => setUploadSuccess(null), 3000);
  };

  const handleSaveBranding = async () => {
    if (!activeBranchId) return;

    setIsSavingBranding(true);
    try {
      const result = await useSettingsStore.getState().updateSettings({
        branch_id: activeBranchId,
        report_margin_top: brandingDraft.report_margin_top,
        report_margin_bottom: brandingDraft.report_margin_bottom,
        report_margin_left: brandingDraft.report_margin_left,
        report_margin_right: brandingDraft.report_margin_right,
        header_safe_area: brandingDraft.header_safe_area,
        footer_safe_area: brandingDraft.footer_safe_area,
        letterhead_margins_auto: false,
      });

      if (result) {
        showSuccess('Branding settings saved');
      }
    } finally {
      setIsSavingBranding(false);
    }
  };

  const handleDeleteImage = (field: 'letterhead_url' | 'header_url' | 'footer_url' | 'owner_signature_url') => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Image',
      message: `Are you sure you want to delete the ${field.replace('_url', '').replace('_', ' ')}?`,
      type: 'danger',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setUploadingField(`delete_${field}`);
        try {
          const result = await useSettingsStore.getState().removeImage(field);
          if (result) {
            if (field === 'letterhead_url') setLetterheadPreview(null);
            if (field === 'owner_signature_url') setOwnerSignaturePreview(null);
            showSuccess('Image deleted successfully');
            if (activeBranchId) fetchSettings(activeBranchId);
          }
        } catch (err) {
          console.error(err);
        } finally {
          setUploadingField(null);
        }
      }
    });
  };

  const handleSaveSampleIdSettings = async () => {
    if (!activeBranchId) return;

    setIsSavingSampleId(true);
    try {
      const result = await useSettingsStore.getState().updateSettings({
        branch_id: activeBranchId,
        sample_id_format: sampleIdDraft.sample_id_format,
        sample_id_reset_policy: sampleIdDraft.sample_id_reset_policy,
        sample_id_fy_start_month: sampleIdDraft.sample_id_fy_start_month,
        sample_id_start_number: sampleIdDraft.sample_id_start_number,
      });

      if (result) {
        showSuccess('Sample ID settings saved');
      }
    } finally {
      setIsSavingSampleId(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!formFirstname.trim() || !formLastname.trim()) {
      setProfileError('First name and last name are required');
      return;
    }

    setProfileError(null);
    setIsSavingProfile(true);

    try {
      await authApi.updateProfile({
        firstname: formFirstname,
        lastname: formLastname,
        phone: formPhone || undefined,
      });
      await fetchProfile();
      showSuccess('Profile updated successfully');
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const getImageUrl = (path: string | null | undefined) => {
    if (!path) return null;
    if (path.startsWith('blob:')) return path;
    if (path.startsWith('http')) return path;
    const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:5000/api';
    const baseUrl = API_URL.replace(/\/api$/, '');
    return path.startsWith('/') ? `${baseUrl}${path}` : `${baseUrl}/${path}`;
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.85) return 'bg-emerald-500';
    if (score >= 0.6) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const getConfidenceText = (score: number) => {
    if (score >= 0.85) return 'High confidence';
    if (score >= 0.6) return 'Medium confidence';
    return 'Low confidence';
  };

  const getLowConfidenceWarnings = () => {
    if (!analysisConfidence) return null;
    const lowEdges: string[] = [];
    if (analysisConfidence.top < 0.6) lowEdges.push('top');
    if (analysisConfidence.bottom < 0.6) lowEdges.push('bottom');
    if (analysisConfidence.left < 0.6) lowEdges.push('left');
    if (analysisConfidence.right < 0.6) lowEdges.push('right');

    if (lowEdges.length === 0) return null;
    return `Low confidence on ${lowEdges.join(', ')} detection. Please verify manually.`;
  };

  return (
    <div className="p-3 md:p-4 lg:p-6 max-w-full md:max-w-7xl mx-auto h-auto md:h-[calc(100vh-5rem)] flex flex-col md:flex-row gap-4 md:gap-0">
      {/* Success Message overlay */}
      {uploadSuccess && (
        <div className="fixed top-20 right-6 z-50 p-3 md:p-4 bg-green-50 border border-green-200 rounded-lg shadow-lg flex items-center gap-3 text-green-700 animate-in slide-in-from-top-2 text-sm md:text-base">
          <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
          <span className="font-medium">{uploadSuccess}</span>
        </div>
      )}

      {/* Main Settings Container (Desktop App Style) */}
      <div className="bg-card border border-border rounded-xl shadow-sm flex flex-1 flex-col md:flex-row overflow-hidden min-h-0">

        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 bg-secondary/20 border-b md:border-b-0 md:border-r border-border flex flex-col flex-shrink-0">
          <div className="p-4 md:p-5 border-b border-border">
            <h1 className="text-base md:text-xl font-bold text-foreground">Settings</h1>
            <p className="text-xs text-muted-foreground mt-1">Manage your lab preferences</p>
          </div>

          <nav className="flex flex-row md:flex-col flex-1 overflow-x-auto md:overflow-y-auto p-2 md:p-3 space-x-1 md:space-x-0 md:space-y-1">
            <button
              onClick={() => setActiveTab('letterhead-sign')}
              className={`cursor-pointer flex-shrink-0 md:flex-shrink w-auto md:w-full flex items-center justify-center md:justify-start gap-2 md:gap-3 px-3 py-2.5 rounded-lg text-xs md:text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'letterhead-sign'
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                }`}
            >
              <FileSignature className="w-4 h-4 flex-shrink-0" />
              <span className="hidden md:inline">Letterhead & Sign</span>
              <span className="md:hidden">Letterhead</span>
              {activeTab === 'letterhead-sign' && <ChevronRight className="w-4 h-4 ml-auto opacity-50 hidden md:block" />}
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`cursor-pointer flex-shrink-0 md:flex-shrink w-auto md:w-full flex items-center justify-center md:justify-start gap-2 md:gap-3 px-3 py-2.5 rounded-lg text-xs md:text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'profile'
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                }`}
            >
              <User className="w-4 h-4 flex-shrink-0" />
              <span className="hidden md:inline">User Profile</span>
              <span className="md:hidden">Profile</span>
              {activeTab === 'profile' && <ChevronRight className="w-4 h-4 ml-auto opacity-50 hidden md:block" />}
            </button>

            <button
              onClick={() => setActiveTab('general')}
              className={`cursor-pointer flex-shrink-0 md:flex-shrink w-auto md:w-full flex items-center justify-center md:justify-start gap-2 md:gap-3 px-3 py-2.5 rounded-lg text-xs md:text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'general'
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                }`}
            >
              <SettingsIcon className="w-4 h-4" />
              <span>General Settings</span>
              {activeTab === 'general' && <ChevronRight className="w-4 h-4 ml-auto opacity-50" />}
            </button>

            <button
              onClick={() => setActiveTab('whatsapp')}
              className={`cursor-pointer flex-shrink-0 md:flex-shrink w-auto md:w-full flex items-center justify-center md:justify-start gap-2 md:gap-3 px-3 py-2.5 rounded-lg text-xs md:text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'whatsapp'
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                }`}
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp</span>
              {activeTab === 'whatsapp' && <ChevronRight className="w-4 h-4 ml-auto opacity-50" />}
            </button>
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-card">
          {error && (
            <div className="m-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-3 text-destructive">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {activeTab === 'letterhead-sign' && (
            <div className="p-8 max-w-4xl">
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-foreground tracking-tight">Letterhead & Signatures</h2>
                <p className="text-sm text-muted-foreground mt-1">Configure your lab's branding and signatures for printed reports.</p>
              </div>

              <div className="space-y-12">
                {/* Letterhead Section */}
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <ImageIcon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-foreground">Lab Letterhead</h3>
                      <p className="text-xs text-muted-foreground">Background image for A4 reports</p>
                    </div>
                  </div>

                  <div className="border-2 border-dashed border-border rounded-xl p-8 text-center bg-secondary/10">
                    {letterheadPreview ? (
                      <div className="relative">
                        <img
                          src={getImageUrl(letterheadPreview) || ''}
                          alt="Letterhead preview"
                          className="max-h-64 mx-auto rounded border border-border shadow-sm object-contain bg-white"
                        />
                      </div>
                    ) : (
                      <div className="py-8">
                        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                          <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
                        </div>
                        <p className="text-sm font-medium text-foreground mb-1">No letterhead uploaded</p>
                        <p className="text-xs text-muted-foreground">Upload a portrait A4 image (min 600×800px)</p>
                      </div>
                    )}

                    <input
                      ref={letterheadInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLetterheadSelect}
                      className="hidden"
                      id="letterhead-upload"
                    />

                    {pendingLetterheadFile ? (
                      <div className="flex justify-center gap-3 mt-6">
                        <button
                          onClick={discardLetterhead}
                          disabled={uploadingField === 'letterhead'}
                          className="h-9 px-4 bg-secondary border border-border text-foreground rounded-md text-sm font-medium hover:bg-secondary/80 disabled:opacity-50 transition-colors"
                        >
                          Discard
                        </button>
                        <button
                          onClick={confirmLetterhead}
                          disabled={uploadingField === 'letterhead'}
                          className="h-9 px-4 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 flex items-center gap-2 disabled:opacity-50 transition-colors shadow-sm"
                        >
                          {uploadingField === 'letterhead' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          Confirm Upload
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-center gap-3 mt-6">
                        <label
                          htmlFor="letterhead-upload"
                          className="inline-flex h-9 items-center gap-2 px-4 rounded-md cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium shadow-sm"
                        >
                          <Upload className="w-4 h-4" />
                          {letterheadPreview ? 'Change Image' : 'Upload Image'}
                        </label>
                        {letterheadPreview && (
                          <button
                            onClick={() => handleDeleteImage('letterhead_url')}
                            disabled={uploadingField === 'delete_letterhead_url'}
                            className="inline-flex h-9 items-center gap-2 px-4 rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors text-sm font-medium disabled:opacity-50"
                          >
                            {uploadingField === 'delete_letterhead_url' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            Remove
                          </button>
                        )}
                      </div>
                    )}

                    {letterheadError && (
                      <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-start gap-2 text-destructive text-xs text-left">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{letterheadError}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 rounded-xl border border-border bg-card p-6 shadow-sm">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-border pb-4 mb-6">
                      <div>
                        <h4 className="text-base font-semibold text-foreground">Report Margins & Interactive Preview</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          Configure report padding margins. Real-time overlay preview allows dragging borders to adjust values directly.
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {letterheadPreview && (
                          <button
                            type="button"
                            onClick={handleReDetect}
                            disabled={uploadingField === 'detecting'}
                            className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground shadow-sm transition-colors hover:bg-secondary disabled:opacity-50"
                          >
                            {uploadingField === 'detecting' ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                            Re-detect from Image
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleSaveBranding}
                          disabled={isSavingBranding || !settings || (
                            brandingDraft.report_margin_top === normalizePx(settings.report_margin_top, 80) &&
                            brandingDraft.report_margin_bottom === normalizePx(settings.report_margin_bottom, 80) &&
                            brandingDraft.report_margin_left === normalizePx(settings.report_margin_left, 28) &&
                            brandingDraft.report_margin_right === normalizePx(settings.report_margin_right, 28) &&
                            brandingDraft.header_safe_area === normalizePx(settings.header_safe_area, 24) &&
                            brandingDraft.footer_safe_area === normalizePx(settings.footer_safe_area, 24)
                          )}
                          className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-xs font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isSavingBranding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                          Save Layout
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 items-start">
                      {/* Left: Inputs & Warnings */}
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <label className="space-y-2 text-sm">
                            <span className="block font-medium text-foreground flex items-center gap-2">
                              Top Margin (px)
                              {analysisConfidence && (
                                <span
                                  className={`w-2.5 h-2.5 rounded-full ${getConfidenceColor(analysisConfidence.top)}`}
                                  title={`${getConfidenceText(analysisConfidence.top)} (${Math.round(analysisConfidence.top * 100)}%)`}
                                />
                              )}
                            </span>
                            <input
                              type="number"
                              min={0}
                              className="h-10 w-full rounded-md border border-border bg-transparent px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                              value={brandingDraft.report_margin_top}
                              onChange={(e) => setBrandingDraft((prev) => ({ ...prev, report_margin_top: parseInt(e.target.value, 10) || 0 }))}
                            />
                          </label>

                          <label className="space-y-2 text-sm">
                            <span className="block font-medium text-foreground flex items-center gap-2">
                              Bottom Margin (px)
                              {analysisConfidence && (
                                <span
                                  className={`w-2.5 h-2.5 rounded-full ${getConfidenceColor(analysisConfidence.bottom)}`}
                                  title={`${getConfidenceText(analysisConfidence.bottom)} (${Math.round(analysisConfidence.bottom * 100)}%)`}
                                />
                              )}
                            </span>
                            <input
                              type="number"
                              min={0}
                              className="h-10 w-full rounded-md border border-border bg-transparent px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                              value={brandingDraft.report_margin_bottom}
                              onChange={(e) => setBrandingDraft((prev) => ({ ...prev, report_margin_bottom: parseInt(e.target.value, 10) || 0 }))}
                            />
                          </label>

                          <label className="space-y-2 text-sm">
                            <span className="block font-medium text-foreground flex items-center gap-2">
                              Left Margin (px)
                              {analysisConfidence && (
                                <span
                                  className={`w-2.5 h-2.5 rounded-full ${getConfidenceColor(analysisConfidence.left)}`}
                                  title={`${getConfidenceText(analysisConfidence.left)} (${Math.round(analysisConfidence.left * 100)}%)`}
                                />
                              )}
                            </span>
                            <input
                              type="number"
                              min={0}
                              className="h-10 w-full rounded-md border border-border bg-transparent px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                              value={brandingDraft.report_margin_left}
                              onChange={(e) => setBrandingDraft((prev) => ({ ...prev, report_margin_left: parseInt(e.target.value, 10) || 0 }))}
                            />
                          </label>

                          <label className="space-y-2 text-sm">
                            <span className="block font-medium text-foreground flex items-center gap-2">
                              Right Margin (px)
                              {analysisConfidence && (
                                <span
                                  className={`w-2.5 h-2.5 rounded-full ${getConfidenceColor(analysisConfidence.right)}`}
                                  title={`${getConfidenceText(analysisConfidence.right)} (${Math.round(analysisConfidence.right * 100)}%)`}
                                />
                              )}
                            </span>
                            <input
                              type="number"
                              min={0}
                              className="h-10 w-full rounded-md border border-border bg-transparent px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                              value={brandingDraft.report_margin_right}
                              onChange={(e) => setBrandingDraft((prev) => ({ ...prev, report_margin_right: parseInt(e.target.value, 10) || 0 }))}
                            />
                          </label>

                          <label className="space-y-2 text-sm">
                            <span className="block font-medium text-foreground">Header Safe Area (px)</span>
                            <input
                              type="number"
                              min={0}
                              className="h-10 w-full rounded-md border border-border bg-transparent px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                              value={brandingDraft.header_safe_area}
                              onChange={(e) => setBrandingDraft((prev) => ({ ...prev, header_safe_area: parseInt(e.target.value, 10) || 0 }))}
                            />
                          </label>

                          <label className="space-y-2 text-sm">
                            <span className="block font-medium text-foreground">Footer Safe Area (px)</span>
                            <input
                              type="number"
                              min={0}
                              className="h-10 w-full rounded-md border border-border bg-transparent px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                              value={brandingDraft.footer_safe_area}
                              onChange={(e) => setBrandingDraft((prev) => ({ ...prev, footer_safe_area: parseInt(e.target.value, 10) || 0 }))}
                            />
                          </label>
                        </div>

                        {/* Low confidence warnings */}
                        {(() => {
                          const warning = getLowConfidenceWarnings();
                          if (!warning) return null;
                          return (
                            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-md flex items-start gap-2.5 text-amber-700 text-xs animate-in fade-in duration-200">
                              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                              <span>{warning}</span>
                            </div>
                          );
                        })()}

                        <div className="p-4 bg-secondary/30 border border-border rounded-lg text-xs text-muted-foreground leading-5 space-y-2">
                          <p className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                            How it works:
                          </p>
                          <ul className="list-disc pl-4 space-y-1">
                            <li>When you upload a letterhead, the system automatically scans the image to detect where your header and footer artwork are.</li>
                            <li>Margins are set automatically so report content never overlaps your letterhead design.</li>
                            <li>You can manually adjust any margin value if the auto-detection needs fine-tuning.</li>
                            <li>The visual preview shows exactly where report content will be placed on your letterhead.</li>
                            <li>Header/Footer Safe Area fields are kept for backward compatibility. If your margins are already correct (auto-detected), leave safe areas at 0.</li>
                          </ul>
                        </div>
                      </div>

                      {/* Right: Visual Preview */}
                      <div className="flex flex-col items-center">
                        <div className="text-center mb-2">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Letterhead Safe Zone Preview</p>
                          <p className="text-[10px] text-muted-foreground">Drag dashed lines to adjust margins visually</p>
                        </div>

                        <div
                          className="relative border border-border bg-white rounded-lg shadow-md overflow-hidden select-none"
                          style={{ width: '280px', height: '396px', backgroundImage: letterheadPreview ? `url(${getImageUrl(letterheadPreview)})` : 'none', backgroundSize: '100% 100%' }}
                        >
                          {!letterheadPreview && (
                            <div className="absolute inset-0 bg-secondary/10 flex items-center justify-center text-xs italic text-muted-foreground p-4 text-center">
                              Upload a letterhead to see live overlay preview
                            </div>
                          )}

                          {letterheadPreview && (
                            <>
                              {/* Top Zone Overlay (Red-ish, 15% opacity) */}
                              <div
                                className="absolute top-0 left-0 right-0 bg-rose-500/15 border-b border-dashed border-rose-400 pointer-events-none"
                                style={{ height: `${(brandingDraft.report_margin_top / 1123) * 396}px` }}
                              />
                              {/* Top Drag Handle */}
                              <div
                                onMouseDown={handleMouseDown('top')}
                                className="absolute left-0 right-0 cursor-ns-resize z-10 flex items-center justify-center"
                                style={{ top: `${((brandingDraft.report_margin_top / 1123) * 396) - 5}px`, height: '10px' }}
                              >
                                <div className="w-12 h-1 bg-rose-400/80 rounded animate-pulse" />
                              </div>

                              {/* Bottom Zone Overlay (Red-ish, 15% opacity) */}
                              <div
                                className="absolute bottom-0 left-0 right-0 bg-rose-500/15 border-t border-dashed border-rose-400 pointer-events-none"
                                style={{ height: `${(brandingDraft.report_margin_bottom / 1123) * 396}px` }}
                              />
                              {/* Bottom Drag Handle */}
                              <div
                                onMouseDown={handleMouseDown('bottom')}
                                className="absolute left-0 right-0 cursor-ns-resize z-10 flex items-center justify-center"
                                style={{ bottom: `${((brandingDraft.report_margin_bottom / 1123) * 396) - 5}px`, height: '10px' }}
                              >
                                <div className="w-12 h-1 bg-rose-400/80 rounded animate-pulse" />
                              </div>

                              {/* Left Zone Overlay (Blue-ish, 12% opacity) */}
                              <div
                                className="absolute left-0 bg-blue-500/12 border-r border-dashed border-blue-400 pointer-events-none"
                                style={{
                                  top: `${(brandingDraft.report_margin_top / 1123) * 396}px`,
                                  bottom: `${(brandingDraft.report_margin_bottom / 1123) * 396}px`,
                                  width: `${(brandingDraft.report_margin_left / 794) * 280}px`
                                }}
                              />
                              {/* Left Drag Handle */}
                              <div
                                onMouseDown={handleMouseDown('left')}
                                className="absolute top-0 bottom-0 cursor-ew-resize z-10 flex items-center justify-center"
                                style={{
                                  left: `${((brandingDraft.report_margin_left / 794) * 280) - 5}px`,
                                  width: '10px',
                                  top: `${(brandingDraft.report_margin_top / 1123) * 396}px`,
                                  bottom: `${(brandingDraft.report_margin_bottom / 1123) * 396}px`
                                }}
                              >
                                <div className="w-1 h-12 bg-blue-400/80 rounded animate-pulse" />
                              </div>

                              {/* Right Zone Overlay (Blue-ish, 12% opacity) */}
                              <div
                                className="absolute right-0 bg-blue-500/12 border-l border-dashed border-blue-400 pointer-events-none"
                                style={{
                                  top: `${(brandingDraft.report_margin_top / 1123) * 396}px`,
                                  bottom: `${(brandingDraft.report_margin_bottom / 1123) * 396}px`,
                                  width: `${(brandingDraft.report_margin_right / 794) * 280}px`
                                }}
                              />
                              {/* Right Drag Handle */}
                              <div
                                onMouseDown={handleMouseDown('right')}
                                className="absolute top-0 bottom-0 cursor-ew-resize z-10 flex items-center justify-center"
                                style={{
                                  right: `${((brandingDraft.report_margin_right / 794) * 280) - 5}px`,
                                  width: '10px',
                                  top: `${(brandingDraft.report_margin_top / 1123) * 396}px`,
                                  bottom: `${(brandingDraft.report_margin_bottom / 1123) * 396}px`
                                }}
                              >
                                <div className="w-1 h-12 bg-blue-400/80 rounded animate-pulse" />
                              </div>

                              {/* Content printable area */}
                              <div
                                className="absolute bg-[#ffffff]/60 border border-dashed border-emerald-400/50 flex flex-col justify-between p-2 pointer-events-none"
                                style={{
                                  top: `${(brandingDraft.report_margin_top / 1123) * 396}px`,
                                  bottom: `${(brandingDraft.report_margin_bottom / 1123) * 396}px`,
                                  left: `${(brandingDraft.report_margin_left / 794) * 280}px`,
                                  right: `${(brandingDraft.report_margin_right / 794) * 280}px`
                                }}
                              >
                                <div className="flex justify-between items-start">
                                  <div className="space-y-0.5">
                                    <div className="w-10 h-1 bg-foreground/30 rounded" />
                                    <div className="w-6 h-0.5 bg-foreground/20 rounded" />
                                  </div>
                                  <div className="w-8 h-1 bg-foreground/30 rounded" />
                                </div>
                                <div className="flex-1 flex items-center justify-center">
                                  <span className="text-[9px] font-bold text-emerald-700/80 uppercase tracking-widest text-center">Content Zone</span>
                                </div>
                                <div className="flex justify-between items-end">
                                  <div className="w-6 h-1 bg-foreground/25 rounded" />
                                  <div className="w-10 h-1 bg-foreground/25 rounded" />
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <hr className="border-border" />

                {/* Owner Signature Section */}
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <FileSignature className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-foreground">Lab Owner Signature</h3>
                      <p className="text-xs text-muted-foreground">Appears at the bottom right of every report</p>
                    </div>
                  </div>

                  <div className="border border-border rounded-xl p-6 bg-secondary/5">
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                      <div className="flex-shrink-0 border border-border rounded-lg bg-card p-4 min-w-[200px] flex items-center justify-center min-h-[100px] shadow-sm">
                        {ownerSignaturePreview ? (
                          <img
                            src={getImageUrl(ownerSignaturePreview) || ''}
                            alt="Owner signature"
                            className="max-h-16 object-contain"
                          />
                        ) : (
                          <span className="text-sm italic text-muted-foreground">No signature set</span>
                        )}
                      </div>

                      <div className="flex-1 space-y-4 text-center sm:text-left">
                        <input
                          ref={ownerSignatureInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleOwnerSignatureSelect}
                          className="hidden"
                          id="owner-signature-upload"
                        />

                        {pendingOwnerSignatureFile ? (
                          <div className="flex flex-wrap justify-center sm:justify-start gap-3">
                            <button
                              onClick={discardOwnerSignature}
                              disabled={uploadingField === 'owner_signature'}
                              className="h-8 px-3 bg-secondary border border-border text-foreground rounded text-xs font-medium hover:bg-secondary/80 disabled:opacity-50"
                            >
                              Discard
                            </button>
                            <button
                              onClick={confirmOwnerSignature}
                              disabled={uploadingField === 'owner_signature'}
                              className="h-8 px-3 bg-primary text-primary-foreground rounded text-xs font-medium hover:bg-primary/90 flex items-center gap-1.5 disabled:opacity-50"
                            >
                              {uploadingField === 'owner_signature' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                              Save Signature
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-wrap justify-center sm:justify-start gap-3">
                            <label
                              htmlFor="owner-signature-upload"
                              className="inline-flex h-8 items-center gap-2 px-3 rounded cursor-pointer bg-secondary border border-border hover:bg-accent text-foreground text-xs font-medium transition-colors"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              {ownerSignaturePreview ? 'Replace' : 'Upload'}
                            </label>
                            {ownerSignaturePreview && (
                              <button
                                onClick={() => handleDeleteImage('owner_signature_url')}
                                disabled={uploadingField === 'delete_owner_signature_url'}
                                className="inline-flex h-8 items-center gap-2 px-3 rounded bg-destructive/10 text-destructive hover:bg-destructive/20 text-xs font-medium disabled:opacity-50 transition-colors"
                              >
                                {uploadingField === 'delete_owner_signature_url' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                Remove
                              </button>
                            )}
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">Upload a transparent PNG for best results. This signature authorizes all tests.</p>
                      </div>
                    </div>
                  </div>
                </section>

                <hr className="border-border" />

                {/* Lab Signatures Section (up to 4) */}
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <FileSignature className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-foreground">Lab Signatures</h3>
                      <p className="text-xs text-muted-foreground">Upload up to 4 lab signatures and set a default for reports</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map((index) => (
                      <div key={index} className="border border-border rounded-xl p-6 bg-secondary/5">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                              {index}
                            </div>
                            <span className="font-medium text-foreground">Signature {index}</span>
                          </div>
                          {defaultSignatureIndex === index && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200">
                              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                              <span className="text-xs font-medium text-amber-700">Default</span>
                            </div>
                          )}
                        </div>

                        {/* Label Input */}
                        <div className="mb-4">
                          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Label</label>
                          {sigEditingLabel === index ? (
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={sigLabels[index] || ''}
                                onChange={(e) => setSigLabels({ ...sigLabels, [index]: e.target.value })}
                                placeholder={`Signature ${index} label`}
                                className="flex-1 h-8 px-2.5 bg-transparent border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                              <button
                                onClick={() => handleUpdateSignatureLabel(index, sigLabels[index] || '')}
                                disabled={uploadingField === `label_${index}`}
                                className="h-8 px-2.5 bg-primary text-primary-foreground rounded text-xs font-medium hover:bg-primary/90 disabled:opacity-50"
                              >
                                Save
                              </button>
                            </div>
                          ) : (
                            <div
                              onClick={() => setEditingLabel(index)}
                              className="h-8 px-2.5 border border-border rounded bg-card flex items-center text-sm text-muted-foreground cursor-pointer hover:bg-secondary/30 transition-colors"
                            >
                              {sigLabels[index] || `Signature ${index}`}
                            </div>
                          )}
                        </div>

                        {/* Signature Preview */}
                        <div className="border border-border rounded-lg bg-white p-3 flex items-center justify-center min-h-[100px] mb-4">
                          {labSignaturePreviews[index] ? (
                            <img
                              src={getImageUrl(labSignaturePreviews[index]) || ''}
                              alt={`Signature ${index}`}
                              className="max-h-24 object-contain"
                            />
                          ) : (
                            <span className="text-xs italic text-muted-foreground">No signature uploaded</span>
                          )}
                        </div>

                        {/* Upload Actions */}
                        <input
                          ref={(el) => {
                            labSignatureInputRefs.current[index] = el;
                          }}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleLabSignatureSelect(e, index)}
                          className="hidden"
                          id={`lab-sig-${index}`}
                        />

                        {labSignatureFiles[index] ? (
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => discardLabSignature(index)}
                              disabled={uploadingField === `lab_sig_${index}`}
                              className="h-8 px-3 bg-secondary border border-border text-foreground rounded text-xs font-medium hover:bg-secondary/80 disabled:opacity-50 transition-colors"
                            >
                              Discard
                            </button>
                            <button
                              onClick={() => confirmLabSignature(index)}
                              disabled={uploadingField === `lab_sig_${index}`}
                              className="h-8 px-3 bg-primary text-primary-foreground rounded text-xs font-medium hover:bg-primary/90 flex items-center justify-center gap-2 disabled:opacity-50 transition-colors shadow-sm"
                            >
                              {uploadingField === `lab_sig_${index}` ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Check className="w-3 h-3" />
                              )}
                              Confirm Upload
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2">
                            <label
                              htmlFor={`lab-sig-${index}`}
                              className="inline-flex h-8 items-center justify-center px-3 rounded cursor-pointer bg-secondary border border-border hover:bg-accent text-foreground text-xs font-medium transition-colors"
                            >
                              <Upload className="w-3.5 h-3.5 mr-1.5" />
                              {labSignaturePreviews[index] ? 'Replace' : 'Upload'}
                            </label>
                            {labSignaturePreviews[index] && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleSetDefaultSignature(index)}
                                  disabled={uploadingField === 'default_sig' || defaultSignatureIndex === index}
                                  className="flex-1 h-8 px-2 bg-amber-50 border border-amber-200 text-amber-700 rounded text-xs font-medium hover:bg-amber-100 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
                                >
                                  <Star className="w-3.5 h-3.5" />
                                  Set Default
                                </button>
                                <button
                                  onClick={() => handleDeleteLabSignature(index)}
                                  disabled={uploadingField === `delete_lab_sig_${index}`}
                                  className="h-8 px-2 bg-destructive/10 text-destructive rounded text-xs font-medium hover:bg-destructive/20 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                                >
                                  {uploadingField === `delete_lab_sig_${index}` ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-3 h-3" />
                                  )}
                                  Remove
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="p-8 max-w-3xl">
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-foreground tracking-tight">User Profile</h2>
                <p className="text-sm text-muted-foreground mt-1">Update your personal information and contact details.</p>
              </div>

              {profileError && (
                <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-3 text-destructive">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm">{profileError}</p>
                </div>
              )}

              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="p-6 space-y-6">
                  {/* Email (Readonly) */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Email Address</label>
                    <div className="relative">
                      <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="w-full h-10 px-3 bg-secondary/50 border border-border rounded-md text-sm text-muted-foreground cursor-not-allowed"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium bg-secondary px-2 py-0.5 rounded">
                        Non-editable
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">Email is used for login and cannot be changed here.</p>
                  </div>

                  <hr className="border-border" />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">First Name</label>
                      <input
                        type="text"
                        value={formFirstname}
                        onChange={(e) => setFormFirstname(e.target.value)}
                        placeholder="John"
                        className="w-full h-10 px-3 bg-transparent border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-shadow"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Last Name</label>
                      <input
                        type="text"
                        value={formLastname}
                        onChange={(e) => setFormLastname(e.target.value)}
                        placeholder="Doe"
                        className="w-full h-10 px-3 bg-transparent border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-shadow"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Phone Number</label>
                    <input
                      type="tel"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full h-10 px-3 bg-transparent border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-shadow max-w-sm"
                    />
                  </div>
                </div>

                <div className="px-6 py-4 bg-secondary/30 border-t border-border flex justify-end">
                  <button
                    onClick={handleSaveProfile}
                    disabled={isSavingProfile || !formFirstname.trim() || !formLastname.trim() || (formFirstname === user?.firstname && formLastname === user?.lastname && formPhone === user?.phone)}
                    className="h-9 px-4 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 flex items-center gap-2 disabled:opacity-50 transition-colors shadow-sm"
                  >
                    {isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'general' && (
            <div className="p-8 max-w-3xl">
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-foreground tracking-tight">General Settings</h2>
                <p className="text-sm text-muted-foreground mt-1">Configure app appearance, branch-level behavior, and workspace preferences.</p>
              </div>

              <div className="grid gap-6">
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-base font-semibold text-foreground">Appearance Theme</h3>
                      <p className="text-sm text-muted-foreground mt-1">Theme is stored locally through the app shell and applies instantly.</p>
                    </div>
                    <span className="rounded-full border border-border bg-secondary/60 px-3 py-1 text-xs font-medium text-foreground capitalize">
                      {theme === 'dark' ? 'Dark mode' : 'Light mode'}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setTheme('light')}
                      className={`cursor-pointer rounded-xl border px-4 py-4 text-left transition-all ${theme === 'light' ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-secondary/20 text-foreground hover:bg-secondary/40'}`}
                    >
                      <div className="text-sm font-semibold">Light</div>
                      <div className="mt-1 text-xs text-muted-foreground">Bright interface for daytime work.</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme('dark')}
                      className={`cursor-pointer rounded-xl border px-4 py-4 text-left transition-all ${theme === 'dark' ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-secondary/20 text-foreground hover:bg-secondary/40'}`}
                    >
                      <div className="text-sm font-semibold">Dark</div>
                      <div className="mt-1 text-xs text-muted-foreground">Lower-glare interface for long shifts.</div>
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-foreground">Sample ID Settings</h3>
                      <p className="text-sm text-muted-foreground mt-1">Choose predefined ID format and reset behavior for new sample IDs.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleSaveSampleIdSettings}
                      disabled={isSavingSampleId || !settings || (
                        sampleIdDraft.sample_id_format === (settings.sample_id_format ?? 'numeric') &&
                        sampleIdDraft.sample_id_reset_policy === (settings.sample_id_reset_policy ?? 'yearly') &&
                        sampleIdDraft.sample_id_fy_start_month === (settings.sample_id_fy_start_month ?? 3) &&
                        sampleIdDraft.sample_id_start_number === (settings.sample_id_start_number ?? 1001)
                      )}
                      className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSavingSampleId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Save Sample IDs
                    </button>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <label className="space-y-2 text-sm">
                      <span className="block font-medium text-foreground">ID Format</span>
                      <select
                        className="h-10 w-full rounded-md border border-border bg-transparent px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        value={sampleIdDraft.sample_id_format}
                        onChange={(e) => setSampleIdDraft((prev) => ({
                          ...prev,
                          sample_id_format: e.target.value as 'numeric' | 'sm_prefix',
                        }))}
                      >
                        <option value="numeric">1001, 1002, 1003</option>
                        <option value="sm_prefix">SM-1001, SM-1002, SM-1003</option>
                      </select>
                    </label>

                    <label className="space-y-2 text-sm">
                      <span className="block font-medium text-foreground">Reset Policy</span>
                      <select
                        className="h-10 w-full rounded-md border border-border bg-transparent px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        value={sampleIdDraft.sample_id_reset_policy}
                        onChange={(e) => setSampleIdDraft((prev) => ({
                          ...prev,
                          sample_id_reset_policy: e.target.value as 'yearly' | 'monthly',
                        }))}
                      >
                        <option value="yearly">Yearly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </label>

                    <label className="space-y-2 text-sm">
                      <span className="block font-medium text-foreground">Start Number</span>
                      <input
                        type="number"
                        min={1}
                        className="h-10 w-full rounded-md border border-border bg-transparent px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        value={sampleIdDraft.sample_id_start_number}
                        onChange={(e) => setSampleIdDraft((prev) => ({
                          ...prev,
                          sample_id_start_number: Math.max(1, parseInt(e.target.value, 10) || 1),
                        }))}
                      />
                    </label>

                    <label className="space-y-2 text-sm">
                      <span className="block font-medium text-foreground">Financial Year Start Month</span>
                      <select
                        className="h-10 w-full rounded-md border border-border bg-transparent px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        value={sampleIdDraft.sample_id_fy_start_month}
                        onChange={(e) => setSampleIdDraft((prev) => ({
                          ...prev,
                          sample_id_fy_start_month: parseInt(e.target.value, 10),
                        }))}
                        disabled={sampleIdDraft.sample_id_reset_policy !== 'yearly'}
                      >
                        <option value={1}>January</option>
                        <option value={2}>February</option>
                        <option value={3}>March</option>
                        <option value={4}>April</option>
                        <option value={5}>May</option>
                        <option value={6}>June</option>
                        <option value={7}>July</option>
                        <option value={8}>August</option>
                        <option value={9}>September</option>
                        <option value={10}>October</option>
                        <option value={11}>November</option>
                        <option value={12}>December</option>
                      </select>
                    </label>
                  </div>

                  <div className="mt-4 rounded-md border border-border bg-secondary/20 px-3 py-2 text-xs text-muted-foreground">
                    Only predefined formats are allowed. Default configuration is numeric IDs with yearly reset from March to March.
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <h3 className="text-base font-semibold text-foreground">Quick Notes</h3>
                  <div className="mt-4 space-y-3 text-sm text-muted-foreground leading-6">
                    <p>The branding and PDF spacing controls now live with letterhead and signatures.</p>
                    <p>Profile updates remain separate so account changes do not interfere with branding saves.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'whatsapp' && <WhatsAppIntegration />}
        </div>
      </div>

      <CustomConfirmModal
        isOpen={confirmModal.isOpen}
        type={confirmModal.type}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}

export default Settings;