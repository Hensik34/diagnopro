import React from 'react';
import { ChevronLeft, User, Plus, Clock, ZoomIn, ZoomOut, Download, Printer, Send, FileImage, Loader2, Sliders, FileText, CheckCircle2, Clock3 } from 'lucide-react';
import type { Patient, Doctor, Report } from '../../../types';

interface PatientInfoHeaderProps {
  patient: Patient | null;
  selectedReport: Report | null;
  selectedDoctor: Doctor | null;
  referringDoctorName: string;
  formattedCollectionDate: string;
  isEditable?: boolean;
  onBack?: () => void;
  onEditPatient?: () => void;
  onAddTest?: () => void;
  onOpenHistory?: () => void;
  patientInitials: string;
  formatAge: (age: number | undefined, unit: any) => string;
  onMarkSampleReceived?: () => void;
  onPrintSampleBarcodes?: () => void;
  
  // Preview mode props
  mode?: 'entry' | 'preview';
  onDownloadPdf?: () => void;
  onPrint?: () => void;
  onShare?: () => void;
  onToggleBranding?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  zoom?: number;
  effectiveScale?: number;
  showLetterhead?: boolean;
  hasBranding?: boolean;
  isGeneratingPdf?: boolean;
  hasVisibleTests?: boolean;
  onToggleOrderDrawer?: () => void;
  showMarketingPages?: boolean;
  onToggleMarketingPages?: () => void;
  hasMarketingPages?: boolean;
}

export function PatientInfoHeader({
  patient,
  selectedReport,
  selectedDoctor,
  referringDoctorName,
  formattedCollectionDate,
  isEditable = true,
  onBack,
  onEditPatient,
  onAddTest,
  onOpenHistory,
  patientInitials,
  formatAge,
  onMarkSampleReceived,
  onPrintSampleBarcodes,
  
  mode = 'entry',
  onDownloadPdf,
  onPrint,
  onShare,
  onToggleBranding,
  onZoomIn,
  onZoomOut,
  zoom = 1,
  effectiveScale = 1,
  showLetterhead = true,
  hasBranding = false,
  isGeneratingPdf = false,
  hasVisibleTests = true,
  onToggleOrderDrawer,
  showMarketingPages = false,
  onToggleMarketingPages,
  hasMarketingPages = false,
}: PatientInfoHeaderProps) {
  return (
    <div className="flex-shrink-0 bg-white dark:bg-slate-900 rounded-xl px-3 sm:px-4 h-[60px] min-h-[60px] py-0 shadow-xs border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
      <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
        {/* Back Button */}
        {onBack && (
          <>
            <button
              onClick={onBack}
              className={`flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100 transition-colors flex-shrink-0 cursor-pointer ${mode === 'entry' ? 'lg:hidden' : ''}`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back<span className="hidden sm:inline"> to Reports</span></span>
            </button>

            <div className={`h-5 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block flex-shrink-0 ${mode === 'entry' ? 'lg:hidden' : ''}`} />
          </>
        )}

        {/* Patient Details Columns */}
        <div className="flex items-center gap-3 sm:gap-4 md:gap-5 lg:gap-6 text-xs min-w-0">
          {/* Avatar block with Name & Age/Gender info */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-xs">
              {patientInitials}
            </div>
            <div className="flex flex-col leading-tight min-w-0">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate max-w-[110px] sm:max-w-[160px]">
                {patient?.name || 'Loading...'}
              </span>
              {mode !== 'preview' && (
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                  {patient ? `${formatAge(patient.age, patient.age_unit)} / ${patient.gender || '—'}` : ''}
                </span>
              )}
            </div>
          </div>

          {mode !== 'preview' && (
            <>
              <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block flex-shrink-0" />

              {/* Sample ID */}
              <div className="hidden sm:flex flex-col leading-tight">
                <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Sample ID</span>
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 font-mono mt-0.5">
                  {selectedReport?.sample_id_code || '—'}
                </span>
              </div>

              {/* Patient ID */}
              <div className="hidden xl:flex flex-col leading-tight">
                <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Patient ID</span>
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 mt-0.5 font-mono">
                  {patient?.id ? patient.id.slice(0, 8).toUpperCase() : '—'}
                </span>
              </div>

              {/* Phone */}
              <div className="hidden 2xl:flex flex-col leading-tight">
                <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Phone</span>
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  {patient?.phone || '—'}
                </span>
              </div>

              {/* Doctor */}
              <div className="hidden md:flex flex-col leading-tight">
                <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Doctor</span>
                <span
                  className="text-[11px] font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate max-w-[100px] xl:max-w-[130px]"
                  title={
                    selectedDoctor
                      ? `${selectedDoctor.title || 'Dr'}. ${selectedDoctor.name}`
                      : referringDoctorName
                      ? referringDoctorName
                      : 'Self'
                  }
                >
                  {selectedDoctor
                    ? `${selectedDoctor.title || 'Dr'}. ${selectedDoctor.name}`
                    : referringDoctorName
                    ? referringDoctorName.toLowerCase().startsWith('dr')
                      ? referringDoctorName
                      : `Dr. ${referringDoctorName}`
                    : selectedReport?.is_self_report
                    ? 'Self'
                    : 'Self (No Doctor)'}
                </span>
              </div>

              {/* Collection Date */}
              <div className="hidden lg:flex flex-col leading-tight">
                <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Collection Date</span>
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 mt-0.5 whitespace-nowrap">
                  {formattedCollectionDate}
                </span>
              </div>

              {/* Payment */}
              <div className="hidden lg:flex flex-col leading-tight">
                <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Payment</span>
                <span
                  className={`text-[11px] font-bold mt-0.5 capitalize ${
                    selectedReport?.payment_status === 'paid'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : selectedReport?.payment_status === 'partial'
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {selectedReport?.payment_status || 'Pending'}
                </span>
              </div>

              {/* Sample Status Interactive Badge */}
              <div 
                className="flex flex-col leading-tight cursor-pointer select-none group" 
                onClick={onMarkSampleReceived}
                title={selectedReport?.sample_status === 'received' ? 'Sample Received. Click to review or print barcodes.' : 'Click to confirm sample reception'}
              >
                <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Sample Status</span>
                <div className="mt-0.5 flex items-center gap-1">
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full inline-flex items-center gap-1 transition-all ${
                      selectedReport?.sample_status === 'received'
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 group-hover:bg-amber-500/25'
                    }`}
                  >
                    {selectedReport?.sample_status === 'received' ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        Received
                      </>
                    ) : (
                      <>
                        <Clock3 className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                        Pending
                      </>
                    )}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {mode === 'preview' ? (
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* Zoom controls */}
          <div className="hidden sm:flex items-center border border-slate-200 dark:border-slate-800 rounded-lg h-8 px-1 bg-white dark:bg-slate-900">
            <button
              onClick={onZoomOut}
              className="inline-flex items-center justify-center w-6 h-6 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 min-w-10 text-center select-none">
              {Math.round(effectiveScale * 100)}%
            </span>
            <button
              onClick={onZoomIn}
              className="inline-flex items-center justify-center w-6 h-6 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Arrange button for mobile preview */}
          {mode === 'preview' && onToggleOrderDrawer && (
            <button
              onClick={onToggleOrderDrawer}
              className="lg:hidden h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Arrange Tests"
            >
              <Sliders className="w-3.5 h-3.5 text-primary" />
              <span className="hidden md:inline">Arrange</span>
            </button>
          )}

          {/* Download PDF */}
          <button
            onClick={onDownloadPdf}
            disabled={isGeneratingPdf || !hasVisibleTests}
            title={!hasVisibleTests ? 'Select at least one test to download' : 'Download as PDF'}
            className="h-8 px-2 sm:px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-xs"
          >
            {isGeneratingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5 text-primary" />}
            <span className="hidden md:inline">Download PDF</span>
          </button>

          {/* Print */}
          <button
            onClick={onPrint}
            disabled={!hasVisibleTests}
            title={!hasVisibleTests ? 'Select at least one test to print' : 'Print report'}
            className="h-8 px-2 sm:px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-xs"
          >
            <Printer className="w-3.5 h-3.5 text-primary" />
            <span className="hidden md:inline">Print</span>
          </button>

          {/* Share */}
          <button
            onClick={onShare}
            disabled={!hasVisibleTests}
            title={!hasVisibleTests ? 'Select at least one test to share' : 'Share report'}
            className="h-8 px-2 sm:px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-xs"
          >
            <Send className="w-3.5 h-3.5 text-primary" />
            <span className="hidden md:inline">Share</span>
          </button>

          {/* Branding Toggle */}
          {hasBranding && (
            <button
              onClick={onToggleBranding}
              className={`h-8 px-2 sm:px-2.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs ${
                showLetterhead
                  ? 'border-primary/30 bg-primary/10 text-primary hover:bg-primary/15'
                  : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              <FileImage className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Letterhead</span>
            </button>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {onPrintSampleBarcodes && (
            <button
              onClick={onPrintSampleBarcodes}
              className="h-8 px-2.5 sm:px-3 rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 text-xs font-bold text-primary flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Print Tube Barcodes"
            >
              <Printer className="w-3.5 h-3.5 text-primary" />
              <span className="hidden sm:inline">Tube Barcodes</span>
            </button>
          )}
          <button
            onClick={onEditPatient}
            disabled={!isEditable}
            className="h-8 px-2 sm:px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            title="Edit Patient Info"
          >
            <User className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Edit Patient</span>
          </button>
          <button
            onClick={onAddTest}
            disabled={!isEditable}
            className="h-8 px-2 sm:px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            title="Add Test to Report"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Add Test</span>
          </button>
          <button
            onClick={onOpenHistory}
            disabled={!patient}
            className="h-8 px-2 sm:px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
            title="View Patient History"
          >
            <Clock className="w-3.5 h-3.5" />
            <span className="hidden md:inline">History</span>
          </button>
        </div>
      )}
    </div>
  );
}
