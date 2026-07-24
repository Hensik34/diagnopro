import { useMemo, useRef, useState } from 'react';
import { Paperclip, Upload, Trash2, Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import type { ReportAttachment } from '../../../types';
import { reportApi } from '../../../api/reports';
import { fileToAttachmentPages } from '../../../utils/attachments';

interface AttachmentsCardProps {
  reportId?: string;
  isEditable: boolean;
  attachments: ReportAttachment[];
  /** Called with the full next attachments list whenever pages are added or removed. */
  onChange: (next: ReportAttachment[]) => void;
}

/**
 * Report attachments (PDF/image pages, e.g. B2B partner-lab reports).
 * PDFs are rasterized client-side and uploaded page-by-page; the caller persists
 * the resulting list into the report's test_data on save.
 */
export function AttachmentsCard({ reportId, isEditable, attachments, onChange }: AttachmentsCardProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (!reportId) {
      toast.error('Save the report before adding attachments.');
      return;
    }
    setUploading(true);
    try {
      let next = attachments;
      for (const file of Array.from(files)) {
        const { sourceType, pages } = await fileToAttachmentPages(file);
        if (pages.length === 0) continue;
        const uploaded = await reportApi.uploadAttachments(reportId, {
          name: file.name,
          sourceType,
          pages,
        });
        next = [...next, ...uploaded];
        onChange(next);
      }
      toast.success('Attachment added. Remember to save the report.');
    } catch (e) {
      console.error('Failed to add attachment:', e);
      toast.error('Failed to add attachment. Please try again.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  // Remove all pages that came from the same uploaded file (grouped by name + sourceType)
  const handleRemoveGroup = async (group: ReportAttachment[]) => {
    const urls = new Set(group.map((a) => a.url));
    onChange(attachments.filter((a) => !urls.has(a.url)));
    if (reportId) {
      for (const a of group) {
        try {
          await reportApi.deleteAttachment(reportId, a.url);
        } catch (e) {
          console.error('Failed to delete attachment asset:', e);
        }
      }
    }
  };

  // Group attachment pages by their source file for display
  const groups = useMemo(() => {
    const out: { key: string; name: string; sourceType: string; pages: ReportAttachment[] }[] = [];
    for (const att of attachments) {
      const key = `${att.name}::${att.sourceType}::${att.totalPages}`;
      let group = out.find((g) => g.key === key);
      if (!group) {
        group = { key, name: att.name, sourceType: att.sourceType, pages: [] };
        out.push(group);
      }
      group.pages.push(att);
    }
    return out;
  }, [attachments]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-sm space-y-2 flex-shrink-0">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <Paperclip className="w-3.5 h-3.5 text-primary" />
          Attachments {attachments.length > 0 && (
            <span className="text-[10px] font-semibold text-slate-500">({attachments.length} page{attachments.length > 1 ? 's' : ''})</span>
          )}
        </h3>
      </div>
      <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-snug">
        Attach a PDF or images (e.g. a B2B partner-lab report). They are added as pages after your tests and before marketing pages.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading || !reportId || !isEditable}
        className="w-full h-8 flex items-center justify-center gap-1.5 border border-blue-200 dark:border-blue-900/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 text-[11px] font-bold text-blue-600 dark:text-blue-400 rounded-lg transition-colors disabled:opacity-50 shadow-sm cursor-pointer"
      >
        {uploading ? (
          <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...</>
        ) : (
          <><Upload className="w-3.5 h-3.5" /> Add PDF / Image</>
        )}
      </button>

      {groups.length > 0 && (
        <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-0.5">
          {groups.map((group) => (
            <div
              key={group.key}
              className="flex items-center gap-2 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40"
            >
              <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                <FileText className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 truncate" title={group.name}>{group.name}</p>
                <p className="text-[9px] text-slate-400 uppercase tracking-wide">
                  {group.sourceType} · {group.pages.length} page{group.pages.length > 1 ? 's' : ''}
                </p>
              </div>
              {isEditable && (
                <button
                  type="button"
                  onClick={() => handleRemoveGroup(group.pages)}
                  className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer flex-shrink-0"
                  title="Remove attachment"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
