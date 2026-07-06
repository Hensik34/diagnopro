import React, { useState, useEffect } from 'react';
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
  BookOpen
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
} from '../../app/components/ImprovedReportLayout';

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
    <div className="w-28 sm:w-36 flex-shrink-0">
      <label className="text-[9px] font-medium text-muted-foreground block mb-0.5 uppercase tracking-wide">
        Group
      </label>
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
}

function SortableFieldRow({
  id,
  setting,
  fieldInfo,
  onToggleVisibility,
  onChangeGroup,
  index,
  availableGroups
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
}

function SortableGroupFieldRow({
  id,
  setting,
  fieldInfo,
  onToggleVisibility,
  onChangeGroup,
  globalIdx,
  availableGroups
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
        {setting.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
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
  availableGroups
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
  const [dbUpdatedAt, setDbUpdatedAt] = useState<string>('');
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
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
        } else {
          const defaultSettings = (data.fields || []).map((field, idx) => ({
            fieldId: field.id,
            fieldName: field.field_name,
            position: idx + 1,
            visible: true,
            group: field.section_group || ''
          }));
          setParameterSettings(defaultSettings);
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
          {!isLoading && (
            <div className="bg-card border border-border rounded-xl p-4 space-y-3 shadow-xs">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Clinical Significance
                </h3>
              </div>
              <p className="text-[11px] text-muted-foreground">
                This default text will be displayed in patient reports for this test. Users can edit it per test report.
              </p>
              <textarea
                value={clinicalSignificance}
                onChange={(e) => {
                  setClinicalSignificance(e.target.value);
                  setIsDirty(true);
                }}
                rows={4}
                className="w-full text-xs p-2.5 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground resize-y leading-relaxed"
                placeholder="Enter clinical significance or interpretation notes..."
              />
            </div>
          )}

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
                        />
                      </div>
                    );
                  }
                })() : null}
              </DragOverlay>
            </DndContext>
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
          <span className="text-[10px] bg-secondary px-2.5 py-1 rounded-md text-muted-foreground font-mono">
            {visibleSettings.length} of {parameterSettings.length} visible
          </span>
        </div>

        {/* Preview Scroll Container */}
        <div className="flex-1 overflow-y-auto p-6 flex justify-center items-start">
          <div
            className="w-[794px] min-h-[500px] bg-white shadow-lg border border-gray-200 rounded-xs flex flex-col relative text-[#212121]"
            style={{
              fontFamily: '"Inter", "Segoe UI", Arial, sans-serif',
              boxSizing: 'border-box',
              padding: '52px 24px 56px 24px'
            }}
          >
            {/* Patient Info Box - Using ImprovedPatientBox */}
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

            {/* Test Section - Using TestSectionBlock with actual ImprovedReportLayout components */}
            <TestSectionBlock
              testName={testName || 'TEST REPORT'}
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
                  {visibleSettings.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '32px 0', textAlign: 'center', color: '#999', fontSize: '11px', fontStyle: 'italic' }}>
                        No parameters visible. Toggle visibility to add parameters.
                      </td>
                    </tr>
                  ) : (
                    visibleSettings.map((setting, idx) => {
                      const field = fieldsMap.get(setting.fieldId);
                      const mockVal = getMockValue(setting.fieldName, field?.unit, field?.input_type);
                      const refRange = field?.min_value != null && field?.max_value != null
                        ? `${field.min_value} - ${field.max_value}`
                        : field?.min_value != null
                        ? `>= ${field.min_value}`
                        : field?.max_value != null
                        ? `<= ${field.max_value}`
                        : 'Normal';

                      const isGroupHeader = idx === 0 || visibleSettings[idx - 1].group !== setting.group;

                      return (
                        <React.Fragment key={setting.fieldId}>
                          {setting.group && isGroupHeader && (
                            <SectionGroupHeader
                              title={setting.group}
                              colorTokens={colorTokens}
                              compact={false}
                            />
                          )}
                          <InvestigationTableRow
                            investigation={setting.fieldName}
                            result={mockVal}
                            refRange={refRange}
                            unit={field?.unit || '-'}
                            isAbnormal={false}
                            statusColor={colorTokens.text}
                            rowIndex={idx}
                            indented={!!setting.group}
                            colorTokens={colorTokens}
                            compact={false}
                          />
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </TestSectionBlock>

            {/* Clinical Significance Preview */}
            {clinicalSignificance && (
              <div style={{
                marginTop: '8px',
                fontSize: '9.5px',
                color: '#222',
                lineHeight: 1.45,
                textAlign: 'left'
              }}>
                <div style={{ fontWeight: 800, color: '#111', textTransform: 'uppercase' as const, marginBottom: '2px' }}>
                  Clinical Significance
                </div>
                <p style={{ margin: 0, whiteSpace: 'pre-line' }}>
                  {clinicalSignificance}
                </p>
              </div>
            )}

            {/* Spacer */}
            <div style={{ flex: 1, minHeight: '40px' }} />

            {/* Mock Signatures */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              borderTop: `1px solid ${colorTokens.borderLight}`,
              paddingTop: '20px',
              marginTop: '24px'
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
          </div>
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
