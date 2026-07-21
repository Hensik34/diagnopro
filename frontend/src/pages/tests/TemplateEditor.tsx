import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { useParams, useNavigate } from 'react-router';
import { CustomConfirmModal } from '../../app/components/ui/CustomConfirmModal';
import { SmartSelectInput } from '../../app/components/reports/SmartSelectInput';
import {
  GripVertical,
  Eye,
  EyeOff,
  Save,
  RotateCcw,
  ArrowLeft,
  Check,
  AlertCircle,
  Loader2,
  Package,
  Minus,
  BookOpen,
  Bold,
  Table,
  Plus,
  Trash2,
  X
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { layoutApi } from '../../api/layoutApi';
import { testApi } from '../../api';
import type { ParameterSetting, LayoutConfig, TestLayoutResponse } from '../../types/reportLayout';
import type { TestField } from '../../types';
import { useBranchStore } from '../../stores/branchStore';
import {
  ImprovedPatientBox,
  InvestigationTableHeader,
  InvestigationTableRow,
  SectionGroupHeader,
  TestSectionBlock,
  FormattedClinicalSignificance,
} from '../../app/components/ImprovedReportLayout';
import {
  computeReportPages,
  type Parameter,
  type TestSection,
  type PageItem,
} from '../../utils/reportPagination';

// Color tokens matching the report preview style
const colorTokens = {
  brand: '#0D47A1',
  brandLight: '#E8F0FE',
  text: '#212121',
  secondary: '#546E7A',
  muted: '#90A4AE',
  borderLight: '#E0E0E0',
  white: '#FFFFFF',
  sectionTitle: '#37474F',
  high: '#C62828',
  low: '#1565C0',
};

// ============================================
// Local State Input to avoid immediate re-renders during typing
// ============================================
interface GroupInputProps {
  id: string;
  initialValue: string;
  onChange: (value: string) => void;
  availableGroups: string[];
}

function GroupInput({ id, initialValue, onChange, availableGroups }: GroupInputProps) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const handleBlur = () => {
    if (value !== initialValue) {
      onChange(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  return (
    <div className="flex items-center gap-1.5 flex-shrink-0">
      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
        Group
      </span>
      <div className="w-24 sm:w-28">
        <SmartSelectInput
          placeholder="No group"
          value={value}
          onChange={setValue}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          options={availableGroups}
          className="w-full text-[11px] h-7 px-2 rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all font-medium"
        />
      </div>
    </div>
  );
}

// ============================================
// Sortable Field Row (individual parameter)
// ============================================
interface SortableFieldRowProps {
  id: string;
  setting: ParameterSetting;
  fieldInfo?: TestField;
  onToggleVisibility: (fieldId: string) => void;
  onChangeGroup: (fieldId: string, group: string) => void;
  index: number;
  availableGroups: string[];
  onToggleBold: (fieldId: string) => void;
  onFontSizeChange: (fieldId: string, fontSize: number | undefined) => void;
}

function SortableFieldRow({
  id,
  setting,
  fieldInfo,
  onToggleVisibility,
  onChangeGroup,
  index,
  availableGroups,
  onToggleBold,
  onFontSizeChange
}: SortableFieldRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-2.5 bg-card border border-border rounded-lg shadow-xs hover:shadow-md transition-all ${
        isDragging ? 'opacity-30 border-dashed border-primary/50 bg-primary/5' : ''
      } ${!setting.visible ? 'bg-secondary/10 opacity-60' : ''}`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-secondary rounded text-muted-foreground transition-colors"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </div>

      {/* Position */}
      <span className="text-[10px] text-muted-foreground font-mono w-4 text-center">
        {index + 1}
      </span>

      {/* Field info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-xs text-foreground truncate">
          {setting.fieldName}
        </p>
        <p className="text-[10px] text-muted-foreground truncate">
          {fieldInfo?.field_type || 'input'} {fieldInfo?.unit ? `(${fieldInfo.unit})` : ''}
        </p>
      </div>

      {/* Group input */}
      <GroupInput
        id={setting.fieldId}
        initialValue={setting.group || ''}
        onChange={(val) => onChangeGroup(setting.fieldId, val)}
        availableGroups={availableGroups}
      />

      {/* Font Size & Bold Controls */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <select
          value={setting.fontSize || ''}
          onChange={(e) => {
            const val = e.target.value;
            onFontSizeChange(setting.fieldId, val ? parseInt(val, 10) : undefined);
          }}
          className="text-[11px] h-7 px-1 rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-medium w-14"
        >
          <option value="">Def</option>
          <option value="10">10px</option>
          <option value="11">11px</option>
          <option value="12">12px</option>
          <option value="13">13px</option>
          <option value="14">14px</option>
          <option value="15">15px</option>
          <option value="16">16px</option>
        </select>

        <button
          type="button"
          onClick={() => onToggleBold(setting.fieldId)}
          className={`p-1 h-7 w-7 rounded border transition-colors cursor-pointer flex items-center justify-center ${
            setting.bold
              ? 'bg-primary/10 border-primary/20 text-primary font-bold hover:bg-primary/20'
              : 'bg-secondary border-border text-muted-foreground hover:bg-secondary/80'
          }`}
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Visibility Button */}
      <button
        type="button"
        onClick={() => onToggleVisibility(setting.fieldId)}
        className={`p-1.5 rounded-md border transition-colors cursor-pointer ${
          setting.visible
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/20'
            : 'bg-secondary border-border text-muted-foreground hover:bg-secondary/80'
        }`}
      >
        {setting.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

// ============================================
// Sortable Group Field Row (individual parameter inside a group card)
// ============================================
interface SortableGroupFieldRowProps {
  id: string;
  setting: ParameterSetting;
  fieldInfo?: TestField;
  onToggleVisibility: (fieldId: string) => void;
  onChangeGroup: (fieldId: string, group: string) => void;
  globalIdx: number;
  availableGroups: string[];
  onToggleBold: (fieldId: string) => void;
  onFontSizeChange: (fieldId: string, fontSize: number | undefined) => void;
}

function SortableGroupFieldRow({
  id,
  setting,
  fieldInfo,
  onToggleVisibility,
  onChangeGroup,
  globalIdx,
  availableGroups,
  onToggleBold,
  onFontSizeChange
}: SortableGroupFieldRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2.5 p-2 rounded-lg bg-white/75 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/40 hover:bg-white dark:hover:bg-slate-900/60 transition-all ${
        isDragging ? 'opacity-30 border-dashed border-primary bg-primary/5' : ''
      } ${!setting.visible ? 'opacity-50' : ''}`}
    >
      {/* Drag handle for sorting inside the group */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-secondary rounded text-muted-foreground transition-colors"
      >
        <GripVertical className="w-3 h-3 text-slate-400" />
      </div>

      <span className="text-[10px] text-muted-foreground font-mono w-4 text-center">
        {globalIdx + 1}
      </span>
      
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[11px] text-foreground truncate">
          {setting.fieldName}
        </p>
        <p className="text-[9px] text-muted-foreground truncate">
          {fieldInfo?.field_type || 'input'} {fieldInfo?.unit ? `(${fieldInfo.unit})` : ''}
        </p>
      </div>

      {/* Group input */}
      <GroupInput
        id={setting.fieldId}
        initialValue={setting.group || ''}
        onChange={(val) => onChangeGroup(setting.fieldId, val)}
        availableGroups={availableGroups}
      />

      {/* Font Size & Bold Controls */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <select
          value={setting.fontSize || ''}
          onChange={(e) => {
            const val = e.target.value;
            onFontSizeChange(setting.fieldId, val ? parseInt(val, 10) : undefined);
          }}
          className="text-[11px] h-7 px-1 rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-medium w-14"
        >
          <option value="">Def</option>
          <option value="10">10px</option>
          <option value="11">11px</option>
          <option value="12">12px</option>
          <option value="13">13px</option>
          <option value="14">14px</option>
          <option value="15">15px</option>
          <option value="16">16px</option>
        </select>
        
        <button
          type="button"
          onClick={() => onToggleBold(setting.fieldId)}
          className={`p-1 h-7 w-7 rounded border transition-colors cursor-pointer flex items-center justify-center ${
            setting.bold
              ? 'bg-primary/10 border-primary/20 text-primary font-bold hover:bg-primary/20'
              : 'bg-secondary border-border text-muted-foreground hover:bg-secondary/80'
          }`}
        >
          <Bold className="w-3 h-3" />
        </button>
      </div>

      {/* Visibility */}
      <button
        type="button"
        onClick={() => onToggleVisibility(setting.fieldId)}
        className={`p-1 rounded-md border transition-colors cursor-pointer ${
          setting.visible
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/20'
            : 'bg-secondary border-border text-muted-foreground hover:bg-secondary/80'
        }`}
      >
        {setting.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

// ============================================
// Sortable Group Card (box containing all grouped params)
// ============================================
interface SortableGroupCardProps {
  id: string;
  groupName: string;
  groupFields: ParameterSetting[];
  fieldsMap: Map<string, TestField>;
  onToggleVisibility: (fieldId: string) => void;
  onChangeGroup: (fieldId: string, group: string) => void;
  onToggleGroupVisibility: (groupName: string, firstFieldId: string) => void;
  parameterSettings: ParameterSetting[];
  availableGroups: string[];
  onToggleBold: (fieldId: string) => void;
  onFontSizeChange: (fieldId: string, fontSize: number | undefined) => void;
}

function SortableGroupCard({
  id,
  groupName,
  groupFields,
  fieldsMap,
  onToggleVisibility,
  onChangeGroup,
  onToggleGroupVisibility,
  parameterSettings,
  availableGroups,
  onToggleBold,
  onFontSizeChange
}: SortableGroupCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1
  };

  const allVisible = groupFields.every(f => f.visible);
  const firstFieldId = groupFields[0]?.fieldId || '';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border-2 border-cyan-200 dark:border-cyan-800/50 rounded-xl bg-gradient-to-b from-cyan-50/50 to-slate-50/30 dark:from-cyan-950/20 dark:to-slate-950/20 overflow-hidden shadow-sm hover:shadow-md transition-all ${
        isDragging ? 'opacity-30 border-dashed border-cyan-400 bg-cyan-50/10' : ''
      }`}
    >
      {/* Group Header - drag handle for the entire card */}
      <div
        className="flex items-center gap-2.5 px-3 py-2 bg-gradient-to-r from-cyan-100/80 to-slate-100/60 dark:from-cyan-900/30 dark:to-slate-900/20 border-b border-cyan-200/60 dark:border-cyan-800/40 cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4 text-cyan-600 dark:text-cyan-400 flex-shrink-0" />
        <Package className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-[9px] font-extrabold uppercase tracking-wider text-cyan-700 dark:text-cyan-400">
            Group
          </span>
          <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate uppercase leading-tight">
            {groupName}
          </h3>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-200/80 dark:bg-cyan-800/60 text-cyan-700 dark:text-cyan-300 font-bold">
            {groupFields.length} {groupFields.length === 1 ? 'param' : 'params'}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleGroupVisibility(groupName, firstFieldId);
            }}
            className={`p-1 rounded-md border transition-colors cursor-pointer ${
              allVisible
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/20'
                : 'bg-secondary border-border text-muted-foreground hover:bg-secondary/80'
            }`}
            title={allVisible ? "Hide entire group" : "Show entire group"}
          >
            {allVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Group Fields */}
      <div className="p-2 space-y-1.5">
        <SortableContext
          items={groupFields.map((f) => f.fieldId)}
          strategy={verticalListSortingStrategy}
        >
          {groupFields.map((setting, idx) => {
            const field = fieldsMap.get(setting.fieldId);
            const globalIdx = parameterSettings.findIndex(s => s.fieldId === setting.fieldId);
            return (
              <SortableGroupFieldRow
                key={setting.fieldId}
                id={setting.fieldId}
                setting={setting}
                fieldInfo={field}
                onToggleVisibility={onToggleVisibility}
                onChangeGroup={onChangeGroup}
                globalIdx={globalIdx}
                availableGroups={availableGroups}
                onToggleBold={onToggleBold}
                onFontSizeChange={onFontSizeChange}
              />
            );
          })}
        </SortableContext>
      </div>
    </div>
  );
}

// ============================================
// Normalizes contiguous groups block ordering
// ============================================
function normalizeContiguousGroups(list: ParameterSetting[]): ParameterSetting[] {
  const result: ParameterSetting[] = [];
  const groupBlocksMap = new Map<string, ParameterSetting[]>();

  // Collect all items for each group
  list.forEach((item) => {
    if (item.group && item.group.trim()) {
      const g = item.group.trim();
      if (!groupBlocksMap.has(g)) {
        groupBlocksMap.set(g, []);
      }
      groupBlocksMap.get(g)!.push(item);
    }
  });

  // Build the final list
  const handledGroups = new Set<string>();
  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    if (item.group && item.group.trim()) {
      const g = item.group.trim();
      if (!handledGroups.has(g)) {
        // Append all items of this group in order
        result.push(...groupBlocksMap.get(g)!);
        handledGroups.add(g);
      }
    } else {
      result.push(item);
    }
  }
  return result;
}

// ============================================
// Bi-directional Markdown Table & Text Parser
// ============================================
interface EditableTableBlock {
  id: string;
  type: 'table';
  headers: string[];
  rows: string[][];
}

interface EditableTextBlock {
  id: string;
  type: 'text';
  content: string;
}

type EditableBlock = EditableTableBlock | EditableTextBlock;

function parseLineToCols(line: string): string[] | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  // 1. Pipe-delimited (standard markdown table)
  if (trimmed.includes('|')) {
    const cells = trimmed.split('|').map(c => c.trim());
    if (cells[0] === '') cells.shift();
    if (cells[cells.length - 1] === '') cells.pop();
    if (cells.length >= 2) {
      return cells;
    }
  }

  // 2. Tab-delimited table line
  if (line.includes('\t')) {
    const cols = line.split('\t').map(c => c.trim()).filter(Boolean);
    if (cols.length >= 2) {
      return cols;
    }
  }

  // 3. Multi-space aligned table line (2 or more spaces separating columns)
  // Skip bullet points and normal paragraph lines starting with •, -, *
  if (!/^[•\-\*]/.test(trimmed)) {
    const hasMultipleSpaces = /\s{2,}/.test(trimmed);
    if (hasMultipleSpaces) {
      const cols = trimmed.split(/\s{2,}/).map(c => c.trim()).filter(Boolean);
      if (cols.length >= 3 || (cols.length === 2 && cols[1].length <= 30)) {
        return cols;
      }
    }
  }

  return null;
}

function parseMarkdownToEditableBlocks(markdown: string): EditableBlock[] {
  if (!markdown) return [{ id: 'b-1', type: 'text', content: '' }];

  const lines = markdown.split('\n');
  const blocks: EditableBlock[] = [];
  let currentTextLines: string[] = [];
  let currentTableRows: string[][] = [];
  let blockCounter = 1;

  const flushText = () => {
    if (currentTextLines.some(l => l.trim() !== '')) {
      blocks.push({
        id: `b-${blockCounter++}`,
        type: 'text',
        content: currentTextLines.join('\n').trim()
      });
      currentTextLines = [];
    } else {
      currentTextLines = [];
    }
  };

  const flushTable = () => {
    if (currentTableRows.length > 0) {
      const headers = currentTableRows[0] || ['Col 1', 'Col 2'];
      const rows = currentTableRows.slice(1);
      blocks.push({
        id: `b-${blockCounter++}`,
        type: 'table',
        headers,
        rows: rows.length > 0 ? rows : [Array(headers.length).fill('')]
      });
      currentTableRows = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const cols = parseLineToCols(line);

    if (cols) {
      const isSeparator = cols.every(c => /^[:\-\s]+$/.test(c));
      if (isSeparator) {
        continue;
      }
      flushText();
      currentTableRows.push(cols);
    } else {
      flushTable();
      currentTextLines.push(line);
    }
  }

  flushText();
  flushTable();

  if (blocks.length === 0) {
    blocks.push({ id: 'b-1', type: 'text', content: '' });
  }

  return blocks;
}

function serializeBlocksToMarkdown(blocks: EditableBlock[]): string {
  const blockStrings: string[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (block.type === 'text') {
      if (block.content.trim() || blocks.length === 1) {
        blockStrings.push(block.content.trim());
      }
    } else if (block.type === 'table') {
      if (block.headers && block.headers.length > 0) {
        const headerLine = '| ' + block.headers.map(h => h.trim() || ' ').join(' | ') + ' |';
        const sepLine = '| ' + block.headers.map(() => '---').join(' | ') + ' |';
        const rowLines = block.rows.map(row => {
          const paddedRow = block.headers.map((_, colIdx) => (row[colIdx] != null ? row[colIdx].trim() : ''));
          return '| ' + paddedRow.map(cell => cell || ' ').join(' | ') + ' |';
        });
        blockStrings.push([headerLine, sepLine, ...rowLines].join('\n'));
      }
    }
  }

  return blockStrings.filter(Boolean).join('\n\n');
}

// ============================================
// Clinical Significance Visual & Raw Editor Component
// ============================================
interface ClinicalSignificanceEditorProps {
  value: string;
  onChange: (newValue: string) => void;
  fontSize?: number;
  onFontSizeChange: (size?: number) => void;
  bold: boolean;
  onBoldToggle: () => void;
}

function ClinicalSignificanceEditor({
  value,
  onChange,
  fontSize,
  onFontSizeChange,
  bold,
  onBoldToggle,
}: ClinicalSignificanceEditorProps) {
  const [editorMode, setEditorMode] = useState<'visual' | 'raw'>('visual');
  const [blocks, setBlocks] = useState<EditableBlock[]>(() => parseMarkdownToEditableBlocks(value));

  // Sync blocks when value prop changes from outside
  useEffect(() => {
    setBlocks(parseMarkdownToEditableBlocks(value));
  }, [value]);

  const updateBlocksAndSave = (newBlocks: EditableBlock[]) => {
    setBlocks(newBlocks);
    const newMarkdown = serializeBlocksToMarkdown(newBlocks);
    onChange(newMarkdown);
  };

  const handleTextChange = (blockId: string, content: string) => {
    const newBlocks = blocks.map(b => (b.id === blockId ? { ...b, content } : b));
    updateBlocksAndSave(newBlocks);
  };

  const handleHeaderChange = (blockId: string, colIdx: number, text: string) => {
    const newBlocks = blocks.map(b => {
      if (b.id === blockId && b.type === 'table') {
        const newHeaders = [...b.headers];
        newHeaders[colIdx] = text;
        return { ...b, headers: newHeaders };
      }
      return b;
    });
    updateBlocksAndSave(newBlocks);
  };

  const handleCellChange = (blockId: string, rowIdx: number, colIdx: number, text: string) => {
    const newBlocks = blocks.map(b => {
      if (b.id === blockId && b.type === 'table') {
        const newRows = b.rows.map((row, rI) => {
          if (rI === rowIdx) {
            const newRow = [...row];
            newRow[colIdx] = text;
            return newRow;
          }
          return row;
        });
        return { ...b, rows: newRows };
      }
      return b;
    });
    updateBlocksAndSave(newBlocks);
  };

  const handleAddRow = (blockId: string) => {
    const newBlocks = blocks.map(b => {
      if (b.id === blockId && b.type === 'table') {
        const newRow = Array(b.headers.length).fill('');
        return { ...b, rows: [...b.rows, newRow] };
      }
      return b;
    });
    updateBlocksAndSave(newBlocks);
  };

  const handleDeleteRow = (blockId: string, rowIdx: number) => {
    const newBlocks = blocks.map(b => {
      if (b.id === blockId && b.type === 'table') {
        const newRows = b.rows.filter((_, rI) => rI !== rowIdx);
        return { ...b, rows: newRows.length > 0 ? newRows : [Array(b.headers.length).fill('')] };
      }
      return b;
    });
    updateBlocksAndSave(newBlocks);
  };

  const handleAddColumn = (blockId: string) => {
    const newBlocks = blocks.map(b => {
      if (b.id === blockId && b.type === 'table') {
        const newHeaders = [...b.headers, `Col ${b.headers.length + 1}`];
        const newRows = b.rows.map(row => [...row, '']);
        return { ...b, headers: newHeaders, rows: newRows };
      }
      return b;
    });
    updateBlocksAndSave(newBlocks);
  };

  const handleDeleteColumn = (blockId: string, colIdx: number) => {
    const newBlocks = blocks.map(b => {
      if (b.id === blockId && b.type === 'table') {
        if (b.headers.length <= 1) {
          return null; // delete table if last column deleted
        }
        const newHeaders = b.headers.filter((_, cI) => cI !== colIdx);
        const newRows = b.rows.map(row => row.filter((_, cI) => cI !== colIdx));
        return { ...b, headers: newHeaders, rows: newRows };
      }
      return b;
    }).filter(Boolean) as EditableBlock[];

    updateBlocksAndSave(newBlocks);
  };

  const handleDeleteTable = (blockId: string) => {
    const newBlocks = blocks.filter(b => b.id !== blockId);
    if (newBlocks.length === 0) {
      newBlocks.push({ id: `b-${Date.now()}`, type: 'text', content: '' });
    }
    updateBlocksAndSave(newBlocks);
  };

  const handleDeleteTextBlock = (blockId: string) => {
    const newBlocks = blocks.filter(b => b.id !== blockId);
    if (newBlocks.length === 0) {
      newBlocks.push({ id: `b-${Date.now()}`, type: 'text', content: '' });
    }
    updateBlocksAndSave(newBlocks);
  };

  const handleInsertTableBlock = () => {
    const newTableBlock: EditableTableBlock = {
      id: `b-table-${Date.now()}`,
      type: 'table',
      headers: ['Header 1', 'Header 2', 'Header 3'],
      rows: [['', '', '']]
    };

    // Filter out any empty text blocks before adding the new table
    const cleanedBlocks = blocks.filter(b => b.type !== 'text' || b.content.trim() !== '');

    const newBlocks = [...cleanedBlocks, newTableBlock];
    updateBlocksAndSave(newBlocks);
    setEditorMode('visual');
  };

  const handleAddTextBlock = () => {
    const newTextBlock: EditableTextBlock = {
      id: `b-text-${Date.now()}`,
      type: 'text',
      content: ''
    };
    const newBlocks = [...blocks, newTextBlock];
    updateBlocksAndSave(newBlocks);
  };

  const hasTables = blocks.some(b => b.type === 'table');

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
            Clinical Significance
          </h3>
          {hasTables && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              Table Included
            </span>
          )}
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 bg-secondary p-0.5 rounded-md border border-border">
          <button
            type="button"
            onClick={() => setEditorMode('visual')}
            className={`px-2.5 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
              editorMode === 'visual'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Visual Editor
          </button>
          <button
            type="button"
            onClick={() => setEditorMode('raw')}
            className={`px-2.5 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
              editorMode === 'raw'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Raw Markdown
          </button>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground">
        This default text will be displayed in patient reports for this test. Users can edit it per test report.
      </p>

      {/* Editor Content */}
      {editorMode === 'raw' ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={6}
          className="w-full text-xs p-2.5 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground resize-y leading-relaxed font-mono"
          placeholder="Enter clinical significance or interpretation notes..."
        />
      ) : (
        <div className="space-y-3">
          {blocks.map((block) => {
            if (block.type === 'text') {
              return (
                <div key={block.id} className="relative group space-y-1">
                  {blocks.length > 1 && (
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span className="font-semibold uppercase tracking-wider">Text Section</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteTextBlock(block.id)}
                        className="p-0.5 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                        title="Delete Text Section"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  <textarea
                    value={block.content}
                    onChange={(e) => handleTextChange(block.id, e.target.value)}
                    rows={Math.max(2, block.content.split('\n').length)}
                    className="w-full text-xs p-2.5 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground resize-y leading-relaxed"
                    placeholder="Enter notes, bullet points, or interpretation..."
                  />
                </div>
              );
            }

            if (block.type === 'table') {
              return (
                <div key={block.id} className="border-2 border-primary/20 bg-primary/5 dark:bg-primary/10 rounded-xl p-3 space-y-2.5">
                  {/* Table Block Header Bar */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                      <Table className="w-3.5 h-3.5" />
                      <span>Table Editor</span>
                      <span className="text-[10px] text-muted-foreground font-normal">
                        ({block.headers.length} cols × {block.rows.length} rows)
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleAddColumn(block.id)}
                        className="px-2 py-0.5 text-[10px] font-semibold bg-background border border-border rounded hover:bg-secondary text-foreground flex items-center gap-1 transition-colors cursor-pointer"
                        title="Add Column"
                      >
                        <Plus className="w-2.5 h-2.5" />
                        <span>Add Col</span>
                      </button>
                      {block.headers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteColumn(block.id, block.headers.length - 1)}
                          className="px-2 py-0.5 text-[10px] font-semibold bg-background border border-border rounded hover:bg-secondary text-destructive flex items-center gap-1 transition-colors cursor-pointer"
                          title="Remove Last Column"
                        >
                          <Minus className="w-2.5 h-2.5" />
                          <span>Del Col</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteTable(block.id)}
                        className="px-2 py-0.5 text-[10px] font-semibold bg-destructive/10 border border-destructive/20 text-destructive rounded hover:bg-destructive/20 flex items-center gap-1 transition-colors cursor-pointer"
                        title="Delete Entire Table"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Interactive Editable Table */}
                  <div className="overflow-x-auto border border-border rounded-lg bg-background shadow-2xs">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-secondary/70 border-b border-border">
                          {block.headers.map((header, cIdx) => (
                            <th key={cIdx} className="p-1.5 border-r border-border last:border-r-0 min-w-[100px]">
                              <input
                                type="text"
                                value={header}
                                onChange={(e) => handleHeaderChange(block.id, cIdx, e.target.value)}
                                className="w-full text-xs font-bold px-1.5 py-1 bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground text-center"
                                placeholder={`Header ${cIdx + 1}`}
                              />
                            </th>
                          ))}
                          <th className="w-8 p-1 text-center" />
                        </tr>
                      </thead>
                      <tbody>
                        {block.rows.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-secondary/40 border-b border-border last:border-b-0">
                            {block.headers.map((_, cIdx) => (
                              <td key={cIdx} className="p-1.5 border-r border-border last:border-r-0 min-w-[100px]">
                                <input
                                  type="text"
                                  value={row[cIdx] != null ? row[cIdx] : ''}
                                  onChange={(e) => handleCellChange(block.id, rIdx, cIdx, e.target.value)}
                                  className="w-full text-xs px-1.5 py-1 bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
                                  placeholder="..."
                                />
                              </td>
                            ))}
                            <td className="w-8 p-1 text-center">
                              {block.rows.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRow(block.id, rIdx)}
                                  className="p-1 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                                  title="Delete Row"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Add Row Button */}
                  <button
                    type="button"
                    onClick={() => handleAddRow(block.id)}
                    className="w-full h-7 rounded border border-dashed border-primary/30 bg-background hover:bg-primary/10 text-[11px] font-bold text-primary flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    Add Table Row
                  </button>
                </div>
              );
            }

            return null;
          })}

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleAddTextBlock}
              className="text-[11px] font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-1 rounded hover:bg-secondary transition-colors cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Add Text Section</span>
            </button>
          </div>
        </div>
      )}

      {/* Clinical Significance Styling Controls */}
      <div className="flex items-center gap-3 pt-2 border-t border-border">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase">Size:</span>
          <select
            value={fontSize || ''}
            onChange={(e) => {
              const val = e.target.value;
              onFontSizeChange(val ? parseInt(val, 10) : undefined);
            }}
            className="text-[11px] h-7 px-2 rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-medium"
          >
            <option value="">Default (9.5px)</option>
            <option value="9">9px</option>
            <option value="10">10px</option>
            <option value="11">11px</option>
            <option value="12">12px</option>
            <option value="13">13px</option>
            <option value="14">14px</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase">Style:</span>
          <button
            type="button"
            onClick={onBoldToggle}
            className={`h-7 px-2 rounded border text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
              bold
                ? 'bg-primary/10 border-primary text-primary'
                : 'bg-background border-border text-foreground hover:bg-secondary'
            }`}
          >
            <Bold className="w-3 h-3" />
            Bold
          </button>
        </div>

        <button
          type="button"
          onClick={handleInsertTableBlock}
          className="ml-auto h-7 px-2.5 rounded border border-primary/30 bg-primary/10 text-[11px] font-bold text-primary hover:bg-primary/20 flex items-center gap-1 transition-colors cursor-pointer"
          title="Add a table block"
        >
          <Table className="w-3 h-3" />
          <span>Insert Table</span>
        </button>
      </div>
    </div>
  );
}

// ============================================
// Main TemplateEditor Component
// ============================================
export function TemplateEditor() {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const { currentBranchId } = useBranchStore();

  const [parameterSettings, setParameterSettings] = useState<ParameterSetting[]>([]);
  const [fields, setFields] = useState<TestField[]>([]);
  const [testName, setTestName] = useState<string>('');
  const [clinicalSignificance, setClinicalSignificance] = useState<string>('');
  const [clinicalSigFontSize, setClinicalSigFontSize] = useState<number | undefined>(undefined);
  const [clinicalSigBold, setClinicalSigBold] = useState<boolean>(false);

  // Table builder modal state
  const [showTableBuilder, setShowTableBuilder] = useState(false);
  const [tableHeaders, setTableHeaders] = useState<string[]>(['Column 1', 'Column 2', 'Column 3']);
  const [tableRows, setTableRows] = useState<string[][]>([['', '', '']]);

  const [dbUpdatedAt, setDbUpdatedAt] = useState<string>('');
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, _setError] = useState<string | null>(null);
  const setError = (msg: string | null) => {
    _setError(msg);
    if (msg) toast.error(msg);
  };
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, _setSaveSuccess] = useState<boolean>(false);
  const setSaveSuccess = (val: boolean) => {
    _setSaveSuccess(val);
    if (val) toast.success("Layout saved successfully");
  };
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

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

  // Setup sensors for dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    })
  );

  // Fetch test layout config
  useEffect(() => {
    async function loadLayout() {
      if (!testId) return;
      if (!currentBranchId) return; // Don't fetch if branch ID isn't set yet

      setIsLoading(true);
      setError(null);
      try {
        const response = await layoutApi.getTestLayout(testId, currentBranchId);
        const data = response.data as TestLayoutResponse;

        setTestName(data.testName);
        setFields(data.fields || []);
        setClinicalSignificance(data.clinical_significance || '');
        setDbUpdatedAt(data.updated_at);

        if (data.layoutConfig && Array.isArray(data.layoutConfig.parameterSettings)) {
          // Normalize groups on load to be safe
          setParameterSettings(normalizeContiguousGroups(data.layoutConfig.parameterSettings));
          if (data.layoutConfig.clinicalSignificanceLayout) {
            setClinicalSigFontSize(data.layoutConfig.clinicalSignificanceLayout.fontSize);
            setClinicalSigBold(!!data.layoutConfig.clinicalSignificanceLayout.bold);
          } else {
            setClinicalSigFontSize(undefined);
            setClinicalSigBold(false);
          }
        } else {
          const defaultSettings = (data.fields || []).map((field, idx) => ({
            fieldId: field.id,
            fieldName: field.field_name,
            position: idx + 1,
            visible: true,
            group: field.section_group || ''
          }));
          setParameterSettings(defaultSettings);
          setClinicalSigFontSize(undefined);
          setClinicalSigBold(false);
        }
        setIsDirty(false);
      } catch (err: any) {
        console.error('Fetch test layout failed:', err);
        setError(err.response?.data?.error || err.message || 'Failed to fetch test layout');
      } finally {
        setIsLoading(false);
      }
    }

    loadLayout();
  }, [testId, currentBranchId]);

  // Helper function to reorder and normalize group positions
  const reorderAndNormalize = (updatedList: ParameterSetting[]) => {
    const grouped = normalizeContiguousGroups(updatedList);
    return grouped.map((item, idx) => ({
      ...item,
      position: idx + 1
    }));
  };

  // Build editor items: groups as single cards, ungrouped as individual rows
  const getEditorItems = () => {
    const items: {
      id: string;
      type: 'group-card' | 'parameter';
      groupName?: string;
      groupFields?: ParameterSetting[];
      setting?: ParameterSetting;
    }[] = [];

    let currentGroup = '';
    let currentGroupFields: ParameterSetting[] = [];

    const pushGroupCard = (groupName: string, fieldsInGroup: ParameterSetting[]) => {
      if (fieldsInGroup.length === 0) return;
      const firstId = fieldsInGroup[0].fieldId;
      items.push({
        id: `group-card:${groupName}:${firstId}`,
        type: 'group-card',
        groupName,
        groupFields: fieldsInGroup
      });
    };

    parameterSettings.forEach((setting) => {
      if (setting.group && setting.group.trim()) {
        const normGroup = setting.group.trim();
        if (normGroup === currentGroup) {
          currentGroupFields.push(setting);
        } else {
          pushGroupCard(currentGroup, currentGroupFields);
          currentGroup = normGroup;
          currentGroupFields = [setting];
        }
      } else {
        pushGroupCard(currentGroup, currentGroupFields);
        currentGroup = '';
        currentGroupFields = [];
        
        items.push({
          id: setting.fieldId,
          type: 'parameter',
          setting
        });
      }
    });

    // Push last group if any
    pushGroupCard(currentGroup, currentGroupFields);

    return items;
  };

  const editorItems = getEditorItems();

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
  };

  // Handle reorder end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);
    if (!over || active.id === over.id) return;

    setParameterSettings((items) => {
      const activeIdStr = String(active.id);
      const overIdStr = String(over.id);

      if (activeIdStr.startsWith('group-card:')) {
        // Moving a whole group card
        const parts = activeIdStr.split(':');
        const groupName = parts[1];

        // Filter out all fields in this group
        const groupFields = items.filter((item) => item.group === groupName);
        const remainingItems = items.filter((item) => item.group !== groupName);

        let insertIdx = remainingItems.length; // default to end
        if (overIdStr.startsWith('group-card:')) {
          const overGroupName = overIdStr.split(':')[1];
          insertIdx = remainingItems.findIndex((item) => item.group === overGroupName);
          if (insertIdx === -1) insertIdx = remainingItems.length;
        } else {
          insertIdx = remainingItems.findIndex((item) => item.fieldId === overIdStr);
          if (insertIdx === -1) insertIdx = remainingItems.length;
        }

        const updated = [...remainingItems];
        updated.splice(insertIdx, 0, ...groupFields);

        const reordered = updated.map((item, idx) => ({
          ...item,
          position: idx + 1
        }));
        setIsDirty(true);
        return reordered;
      } else {
        // Moving a single parameter (whether inside a group or ungrouped)
        const oldIndex = items.findIndex((item) => item.fieldId === active.id);
        if (oldIndex === -1) return items;

        const activeItem = items[oldIndex];
        let targetGroup = '';
        let insertIdx = -1;

        if (overIdStr.startsWith('group-card:')) {
          const parts = overIdStr.split(':');
          targetGroup = parts[1];
          const firstFieldId = parts[2];
          insertIdx = items.findIndex((item) => item.fieldId === firstFieldId);
        } else {
          const overIdx = items.findIndex((item) => item.fieldId === over.id);
          if (overIdx !== -1) {
            targetGroup = items[overIdx].group || '';
            insertIdx = overIdx;
          }
        }

        if (insertIdx === -1) return items;

        const updatedList = [...items];
        updatedList.splice(oldIndex, 1);

        // Update the dragged parameter's group name
        const updatedItem = {
          ...activeItem,
          group: targetGroup
        };

        updatedList.splice(insertIdx, 0, updatedItem);

        const normalized = reorderAndNormalize(updatedList);
        setIsDirty(true);
        return normalized;
      }
    });
  };

  // Toggle Group Visibility
  const handleToggleGroupVisibility = (groupName: string, firstFieldId: string) => {
    setParameterSettings((items) => {
      const startIdx = items.findIndex((item) => item.fieldId === firstFieldId);
      if (startIdx === -1) return items;

      let blockFieldsCount = 0;
      let visibleCount = 0;
      for (let i = startIdx; i < items.length; i++) {
        if (items[i].group === groupName) {
          blockFieldsCount++;
          if (items[i].visible) visibleCount++;
        } else {
          break;
        }
      }

      const targetVisibility = visibleCount !== blockFieldsCount;

      const updated = items.map((item, idx) => {
        if (idx >= startIdx && idx < startIdx + blockFieldsCount && item.group === groupName) {
          return { ...item, visible: targetVisibility };
        }
        return item;
      });
      setIsDirty(true);
      return updated;
    });
  };

  // Toggle Bold
  const handleToggleBold = (fieldId: string) => {
    setParameterSettings((items) => {
      const updated = items.map((item) => {
        if (item.fieldId === fieldId) {
          return { ...item, bold: !item.bold };
        }
        return item;
      });
      setIsDirty(true);
      return updated;
    });
  };

  // Change Font Size
  const handleFontSizeChange = (fieldId: string, fontSize: number | undefined) => {
    setParameterSettings((items) => {
      const updated = items.map((item) => {
        if (item.fieldId === fieldId) {
          return { ...item, fontSize };
        }
        return item;
      });
      setIsDirty(true);
      return updated;
    });
  };

  // Toggle Visibility
  const handleToggleVisibility = (fieldId: string) => {
    setParameterSettings((items) => {
      const updated = items.map((item) => {
        if (item.fieldId === fieldId) {
          return { ...item, visible: !item.visible };
        }
        return item;
      });
      setIsDirty(true);
      return updated;
    });
  };

  // Change Group Name
  const handleChangeGroup = (fieldId: string, group: string) => {
    setParameterSettings((items) => {
      const updated = items.map((item) => {
        if (item.fieldId === fieldId) {
          return { ...item, group: group.trim() };
        }
        return item;
      });
      const normalized = reorderAndNormalize(updated);
      setIsDirty(true);
      return normalized;
    });
  };

  // Reset Layout back to default fields order
  const handleResetLayout = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Reset Layout',
      message: 'Are you sure you want to reset the layout config to default field definitions?',
      type: 'warning',
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        const defaultSettings = fields.map((field, idx) => ({
          fieldId: field.id,
          fieldName: field.field_name,
          position: idx + 1,
          visible: true,
          group: field.section_group || ''
        }));
        setParameterSettings(reorderAndNormalize(defaultSettings));
        setClinicalSigFontSize(undefined);
        setClinicalSigBold(false);
        setIsDirty(true);
      }
    });
  };

  // Save Layout
  const handleSave = async () => {
    if (!testId) return;

    const hasVisible = parameterSettings.some((s) => s.visible);
    if (!hasVisible) {
      setConfirmModal({
        isOpen: true,
        title: 'Validation Error',
        message: 'Error: At least one parameter must be visible in the layout configuration.',
        type: 'alert',
        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }

    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    const payload = {
      layoutConfig: {
        parameterSettings,
        clinicalSignificanceLayout: {
          fontSize: clinicalSigFontSize,
          bold: clinicalSigBold,
        },
        version: 1
      },
      clinical_significance: clinicalSignificance,
      updated_at: dbUpdatedAt
    };

    try {
      const response = await layoutApi.updateTestLayout(testId, payload, currentBranchId || undefined);
      const data = response.data.data;
      setDbUpdatedAt(data.updated_at);
      setIsDirty(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error('Save test layout failed:', err);
      setError(
        err.response?.data?.error ||
        err.message ||
        'Failed to save layout config. Please check for concurrent edits.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Helper map for field info lookups
  const fieldsMap = new Map(fields.map((f) => [f.id, f]));

  // Mock values generator
  const getMockValue = (fieldName: string, unit?: string, inputType?: string) => {
    const name = fieldName.toLowerCase();
    if (name.includes('hemoglobin') || name.includes('hb')) return '14.2';
    if (name.includes('rbc')) return '4.8';
    if (name.includes('wbc')) return '7,800';
    if (name.includes('platelet')) return '2.5';
    if (name.includes('pcv') || name.includes('packed cell')) return '42.5';
    if (name.includes('mcv')) return '88.0';
    if (name.includes('mchc')) return '33.5';
    if (name.includes('mch')) return '29.5';
    if (name.includes('cholesterol')) return '185';
    if (name.includes('glucose') || name.includes('sugar')) return '94';
    if (name.includes('urea')) return '24';
    if (name.includes('creatinine')) return '0.9';
    if (inputType === 'select') return 'Negative';
    return '1.0';
  };

  const visibleSettings = parameterSettings.filter((s) => s.visible);

  // Live A4 pagination computation
  const paginationResult = useMemo(() => {
    const safeZones = { top: 52, bottom: 56 };
    const orderedSections: TestSection[] = [
      {
        id: testId || 'test-1',
        testId: testId || 'test-1',
        testName: testName || 'TEST REPORT',
        parameters: visibleSettings.map((setting) => {
          const field = fieldsMap.get(setting.fieldId);
          const mockVal = getMockValue(setting.fieldName, field?.unit, field?.input_type);
          const refRange = field?.min_value != null && field?.max_value != null
            ? `${field.min_value} - ${field.max_value}`
            : field?.min_value != null
            ? `>= ${field.min_value}`
            : field?.max_value != null
            ? `<= ${field.max_value}`
            : 'Normal';

          return {
            name: setting.fieldName,
            result: mockVal,
            unit: field?.unit || '-',
            refRange: refRange,
            isAbnormal: false,
            group: setting.group,
            fontSize: setting.fontSize,
            bold: setting.bold,
          };
        }),
      },
    ];

    const layoutSnapshots = {
      [testId || 'test-1']: {
        clinical_significance: clinicalSignificance,
        clinicalSignificanceLayout: {
          fontSize: clinicalSigFontSize,
          bold: clinicalSigBold,
        },
      },
    };

    return computeReportPages({
      orderedSections,
      safeZones,
      hasDoctorSignature: true,
      density: 'dense',
      layoutSnapshots,
      testData: {
        tests: [{ id: testId || 'test-1', testId: testId || 'test-1' }]
      },
      clinicalNotes: null,
      isSelfReport: false,
      attachMarketingPages: false,
      marketingPages: [],
    });
  }, [testId, testName, visibleSettings, fieldsMap, clinicalSignificance, clinicalSigFontSize, clinicalSigBold]);

  return (
    <div className="flex flex-col lg:flex-row h-screen max-w-full overflow-hidden bg-background">
      {/* Toast notifications */}
      {saveSuccess && (
        <div className="fixed top-6 right-6 z-50 p-4 bg-emerald-50 border border-emerald-200 rounded-lg shadow-lg flex items-center gap-3 text-emerald-700 animate-in slide-in-from-top-2 text-sm font-medium">
          <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>Layout saved successfully</span>
        </div>
      )}

      {/* Left Panel: Settings List */}
      <div className="w-full lg:w-[45%] flex flex-col border-b lg:border-b-0 lg:border-r border-border h-[60vh] lg:h-full overflow-hidden">
        {/* Panel Header */}
        <div className="p-4 border-b border-border bg-card flex-shrink-0 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 hover:bg-secondary rounded-md text-muted-foreground transition-colors cursor-pointer"
              title="Go Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-base font-bold text-foreground truncate max-w-xs sm:max-w-md">
                Configure Layout
              </h1>
              <p className="text-xs text-muted-foreground truncate">{testName}</p>
            </div>
            {isDirty && (
              <span className="ml-auto text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
                Unsaved Changes
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving || isLoading}
              className="flex-1 inline-flex items-center justify-center gap-2 h-9 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              Save Layout
            </button>
            <button
              onClick={handleResetLayout}
              disabled={isSaving || isLoading}
              className="inline-flex items-center justify-center gap-2 h-9 px-3 rounded-md bg-secondary text-foreground hover:bg-secondary/80 border border-border transition-colors text-xs font-semibold disabled:opacity-50 cursor-pointer"
              title="Reset to fields default order"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Order
            </button>
          </div>
        </div>

        {/* Error notice */}
        {error && (
          <div className="p-3 m-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2.5 text-destructive flex-shrink-0 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="font-medium leading-relaxed">{error}</span>
          </div>
        )}

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* 1. Parameters list shown FIRST */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Loading parameters...</p>
            </div>
          ) : parameterSettings.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <p className="text-sm">No parameters defined for this test.</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={editorItems.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
              >
                {(() => {
                  const availableGroups = Array.from(
                    new Set(
                      parameterSettings
                        .map((s) => s.group?.trim())
                        .filter((g): g is string => !!g)
                    )
                  );
                  return (
                    <div className="space-y-2">
                      {editorItems.map((item) => {
                        if (item.type === 'group-card') {
                          return (
                            <SortableGroupCard
                              key={item.id}
                              id={item.id}
                              groupName={item.groupName!}
                              groupFields={item.groupFields!}
                              fieldsMap={fieldsMap}
                              onToggleVisibility={handleToggleVisibility}
                              onChangeGroup={handleChangeGroup}
                              onToggleGroupVisibility={handleToggleGroupVisibility}
                              parameterSettings={parameterSettings}
                              availableGroups={availableGroups}
                              onToggleBold={handleToggleBold}
                              onFontSizeChange={handleFontSizeChange}
                            />
                          );
                        }
                        return (
                          <SortableFieldRow
                            key={item.id}
                            id={item.id}
                            setting={item.setting!}
                            fieldInfo={fieldsMap.get(item.id)}
                            onToggleVisibility={handleToggleVisibility}
                            onChangeGroup={handleChangeGroup}
                            index={parameterSettings.findIndex(s => s.fieldId === item.id)}
                            availableGroups={availableGroups}
                            onToggleBold={handleToggleBold}
                            onFontSizeChange={handleFontSizeChange}
                          />
                        );
                      })}
                    </div>
                  );
                })()}
              </SortableContext>
              <DragOverlay dropAnimation={null}>
                {activeDragId ? (() => {
                  const availableGroups = Array.from(
                    new Set(
                      parameterSettings
                        .map((s) => s.group?.trim())
                        .filter((g): g is string => !!g)
                    )
                  );
                  if (activeDragId.startsWith('group-card:')) {
                    const parts = activeDragId.split(':');
                    const groupName = parts[1];
                    const groupFields = parameterSettings.filter(s => s.group === groupName);
                    return (
                      <div className="opacity-90 shadow-2xl scale-[1.02] rotate-1">
                        <SortableGroupCard
                          id={activeDragId}
                          groupName={groupName}
                          groupFields={groupFields}
                          fieldsMap={fieldsMap}
                          onToggleVisibility={() => {}}
                          onChangeGroup={() => {}}
                          onToggleGroupVisibility={() => {}}
                          parameterSettings={parameterSettings}
                          availableGroups={availableGroups}
                          onToggleBold={() => {}}
                          onFontSizeChange={() => {}}
                        />
                      </div>
                    );
                  } else {
                    const setting = parameterSettings.find(s => s.fieldId === activeDragId);
                    if (!setting) return null;
                    return (
                      <div className="opacity-95 shadow-xl scale-[1.02] rotate-1">
                        <SortableFieldRow
                          id={activeDragId}
                          setting={setting}
                          fieldInfo={fieldsMap.get(activeDragId)}
                          onToggleVisibility={() => {}}
                          onChangeGroup={() => {}}
                          index={parameterSettings.findIndex(s => s.fieldId === activeDragId)}
                          availableGroups={availableGroups}
                          onToggleBold={() => {}}
                          onFontSizeChange={() => {}}
                        />
                      </div>
                    );
                  }
                })() : null}
              </DragOverlay>
            </DndContext>
          )}

          {/* 2. Clinical Significance shown AFTER parameters */}
          {!isLoading && (
            <ClinicalSignificanceEditor
              value={clinicalSignificance}
              onChange={(val) => {
                setClinicalSignificance(val);
                setIsDirty(true);
              }}
              fontSize={clinicalSigFontSize}
              onFontSizeChange={(size) => {
                setClinicalSigFontSize(size);
                setIsDirty(true);
              }}
              bold={clinicalSigBold}
              onBoldToggle={() => {
                setClinicalSigBold((prev) => !prev);
                setIsDirty(true);
              }}
            />
          )}
        </div>
      </div>

      {/* Right Panel: Live A4 Preview */}
      <div className="flex-1 bg-secondary/15 flex flex-col overflow-hidden h-[40vh] lg:h-full">
        {/* Preview Titlebar */}
        <div className="p-3 bg-card border-b border-border flex items-center justify-between flex-shrink-0">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Live Report Preview
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-secondary px-2.5 py-1 rounded-md text-muted-foreground font-mono">
              {paginationResult.pages.length} Page{paginationResult.pages.length > 1 ? 's' : ''}
            </span>
            <span className="text-[10px] bg-secondary px-2.5 py-1 rounded-md text-muted-foreground font-mono">
              {visibleSettings.length} of {parameterSettings.length} visible
            </span>
          </div>
        </div>

        {/* Preview Scroll Container - Multi-page A4 sheets */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center gap-6">
          {paginationResult.pages.map((page, pageIndex) => (
            <div
              key={`preview-page-${pageIndex}`}
              className="w-[794px] h-[1123px] bg-white shadow-lg border border-gray-200 rounded-xs flex flex-col relative text-[#212121] flex-shrink-0"
              style={{
                fontFamily: '"Inter", "Segoe UI", Arial, sans-serif',
                boxSizing: 'border-box',
                padding: '52px 24px 56px 24px',
              }}
            >
              {/* Page Number Badge */}
              <div className="absolute top-3 right-4 text-[10px] font-bold text-gray-400 select-none uppercase tracking-wider">
                Page {pageIndex + 1} of {paginationResult.pages.length}
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {page.map((item: PageItem, idx: number) => {
                    if (item.type === 'patient') {
                      return (
                        <div key={`p-${idx}`} style={{ marginBottom: '6px' }}>
                          <ImprovedPatientBox
                            patientName="Jane Doe"
                            age={32}
                            gender="Female"
                            patientId="PID-982741"
                            sampleId="REG-82749"
                            referringDoctor="Dr. A. K. Sharma, MD"
                            reportDate="12 Jun 2026"
                            reportTime="09:30 AM"
                            collectionDate="12 Jun 2026, 09:15 AM"
                            reportedDate="12 Jun 2026, 02:30 PM"
                            collectionAddress="Medical District"
                            qrCode={
                              <div style={{
                                width: 68,
                                height: 68,
                                background: '#f0f0f0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '8px',
                                color: '#999',
                                border: '1px solid #e0e0e0',
                                borderRadius: 3
                              }}>
                                QR
                              </div>
                            }
                            barcode={
                              <div style={{
                                width: 120,
                                height: 30,
                                background: '#f0f0f0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '8px',
                                color: '#999',
                                border: '1px solid #e0e0e0',
                                borderRadius: 2
                              }}>
                                BARCODE
                              </div>
                            }
                            colorTokens={colorTokens}
                          />
                        </div>
                      );
                    }

                    if (item.type === 'test') {
                      return (
                        <TestSectionBlock
                          key={`t-${idx}`}
                          testName={item.chunk.continuation ? `${item.chunk.title} (cont.)` : item.chunk.title}
                          isFirstSection={true}
                          colorTokens={colorTokens}
                        >
                          <table style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            tableLayout: 'fixed',
                            marginTop: '2px'
                          }}>
                            <InvestigationTableHeader colorTokens={colorTokens} />
                            <tbody>
                              {item.chunk.parameters.length === 0 ? (
                                <tr>
                                  <td colSpan={5} style={{ padding: '32px 0', textAlign: 'center', color: '#999', fontSize: '11px', fontStyle: 'italic' }}>
                                    No parameters visible. Toggle visibility to add parameters.
                                  </td>
                                </tr>
                              ) : (
                                item.chunk.parameters.map((param: any, rowIdx: number) => {
                                  const isGroupHeader = rowIdx === 0 || item.chunk.parameters[rowIdx - 1].group !== param.group;

                                  return (
                                    <React.Fragment key={`${param.name}-${rowIdx}`}>
                                      {param.group && isGroupHeader && (
                                        <SectionGroupHeader
                                          title={param.group}
                                          colorTokens={colorTokens}
                                          compact={false}
                                        />
                                      )}
                                      <InvestigationTableRow
                                        investigation={param.name}
                                        result={param.result}
                                        refRange={param.refRange}
                                        unit={param.unit}
                                        isAbnormal={false}
                                        statusColor={colorTokens.text}
                                        rowIndex={rowIdx}
                                        indented={!!param.group}
                                        colorTokens={colorTokens}
                                        compact={false}
                                        customFontSize={param.fontSize}
                                        customBold={param.bold}
                                      />
                                    </React.Fragment>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </TestSectionBlock>
                      );
                    }

                    if (item.type === 'interpretation') {
                      return (
                        <div key={`i-${idx}`} style={{ marginTop: '8px', color: '#222', textAlign: 'left' }}>
                          <div style={{ fontWeight: clinicalSigBold ? 800 : 700, color: '#111', textTransform: 'uppercase', marginBottom: '2px', fontSize: clinicalSigFontSize ? `${clinicalSigFontSize}px` : '9.5px' }}>
                            Clinical Significance
                          </div>
                          <FormattedClinicalSignificance
                            text={item.text}
                            fontSize={clinicalSigFontSize || 9.5}
                            bold={clinicalSigBold}
                          />
                        </div>
                      );
                    }

                    return null;
                  })}
                </div>

                {/* Mock Signatures on last page */}
                {pageIndex === paginationResult.pages.length - 1 && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'space-between',
                    borderTop: `1px solid ${colorTokens.borderLight}`,
                    paddingTop: '16px',
                    marginTop: '16px',
                    flexShrink: 0,
                  }}>
                    <div style={{ textAlign: 'center', width: '140px' }}>
                      <div style={{ height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontStyle: 'italic', fontSize: '12px', color: '#bbb' }}>
                        *technician*
                      </div>
                      <p style={{ fontWeight: 700, color: '#37474F', fontSize: '9px', marginTop: '4px', borderTop: `1px solid ${colorTokens.borderLight}`, paddingTop: '4px' }}>
                        Technician Sign
                      </p>
                    </div>
                    <div style={{ textAlign: 'center', width: '140px' }}>
                      <div style={{ height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontStyle: 'italic', fontSize: '12px', color: '#bbb' }}>
                        *doctor*
                      </div>
                      <p style={{ fontWeight: 700, color: '#37474F', fontSize: '9px', marginTop: '4px', borderTop: `1px solid ${colorTokens.borderLight}`, paddingTop: '4px' }}>
                        Pathologist MD Sign
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
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

      {/* Table Builder Modal */}
      {showTableBuilder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs transition-opacity">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg p-5 relative animate-in zoom-in-95 duration-150 max-h-[85vh] flex flex-col">
            <button
              type="button"
              onClick={() => setShowTableBuilder(false)}
              className="absolute top-3 right-3 p-1 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <Table className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm text-foreground">Insert Table</h3>
            </div>

            <p className="text-[11px] text-muted-foreground mb-3">
              Define your custom table headers and rows. Click "Insert" to add the table into Clinical Significance.
            </p>

            {/* Column count controls */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase">Columns:</span>
              <button
                type="button"
                disabled={tableHeaders.length <= 2}
                onClick={() => {
                  setTableHeaders(prev => prev.slice(0, -1));
                  setTableRows(prev => prev.map(row => row.slice(0, -1)));
                }}
                className="w-6 h-6 rounded border border-border bg-background hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-colors"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="text-xs font-bold text-foreground min-w-[20px] text-center">{tableHeaders.length}</span>
              <button
                type="button"
                disabled={tableHeaders.length >= 8}
                onClick={() => {
                  setTableHeaders(prev => [...prev, `Column ${prev.length + 1}`]);
                  setTableRows(prev => prev.map(row => [...row, '']));
                }}
                className="w-6 h-6 rounded border border-border bg-background hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            {/* Table editor */}
            <div className="flex-1 overflow-auto border border-border rounded-lg">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-secondary/50">
                    {tableHeaders.map((header, cIdx) => (
                      <th key={cIdx} className="p-1.5 border-b border-r border-border last:border-r-0">
                        <input
                          type="text"
                          value={header}
                          onChange={(e) => {
                            const newHeaders = [...tableHeaders];
                            newHeaders[cIdx] = e.target.value;
                            setTableHeaders(newHeaders);
                          }}
                          className="w-full text-xs font-bold px-1.5 py-1 bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
                          placeholder={`Header ${cIdx + 1}`}
                        />
                      </th>
                    ))}
                    <th className="w-8 p-1 border-b border-border" />
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-secondary/30">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="p-1.5 border-b border-r border-border last:border-r-0">
                          <input
                            type="text"
                            value={cell}
                            onChange={(e) => {
                              const newRows = tableRows.map(r => [...r]);
                              newRows[rIdx][cIdx] = e.target.value;
                              setTableRows(newRows);
                            }}
                            className="w-full text-xs px-1.5 py-1 bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
                            placeholder="..."
                          />
                        </td>
                      ))}
                      <td className="w-8 p-1 border-b border-border text-center">
                        {tableRows.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setTableRows(prev => prev.filter((_, i) => i !== rIdx))}
                            className="p-0.5 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                            title="Remove row"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add row */}
            <button
              type="button"
              onClick={() => setTableRows(prev => [...prev, Array(tableHeaders.length).fill('')])}
              className="mt-2 w-full h-7 rounded border border-dashed border-border bg-secondary/30 hover:bg-secondary text-[11px] font-medium text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              Add Row
            </button>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2.5 mt-4 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setShowTableBuilder(false)}
                className="px-3.5 py-1.5 border border-border rounded-lg hover:bg-muted text-xs font-semibold text-foreground transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  // Build markdown table from headers & rows
                  const headerLine = '| ' + tableHeaders.map(h => h || ' ').join(' | ') + ' |';
                  const separatorLine = '| ' + tableHeaders.map(() => '---').join(' | ') + ' |';
                  const dataLines = tableRows.map(row =>
                    '| ' + row.map((cell, i) => cell || (i === 0 ? ' ' : ' ')).join(' | ') + ' |'
                  );
                  const tableMarkdown = [headerLine, separatorLine, ...dataLines].join('\n');
                  const prefix = clinicalSignificance ? '\n' : '';
                  setClinicalSignificance(prev => prev + prefix + tableMarkdown);
                  setIsDirty(true);
                  setShowTableBuilder(false);
                }}
                className="px-3.5 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/95 text-xs font-semibold transition-colors cursor-pointer"
              >
                Insert Table
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
