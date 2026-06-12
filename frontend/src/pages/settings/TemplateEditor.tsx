import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  GripVertical,
  Eye,
  EyeOff,
  Save,
  RotateCcw,
  ArrowLeft,
  Check,
  AlertCircle,
  Loader2
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
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
import type { ParameterSetting, LayoutConfig, TestLayoutResponse } from '../../types/reportLayout';
import type { TestField } from '../../types';
import { useBranchStore } from '../../stores/branchStore';

// Color tokens for mock report preview (matching pathology lab style)
const colorTokens = {
  brand: '#006064',
  text: '#212121',
  secondary: '#546E7A',
  borderLight: '#CFD8DC',
  white: '#ffffff',
  bgGray: '#FAFAFA'
};

// Sortable item wrapper for each field parameter row
interface SortableFieldRowProps {
  id: string;
  setting: ParameterSetting;
  fieldInfo?: TestField;
  onToggleVisibility: (fieldId: string) => void;
  onChangeGroup: (fieldId: string, group: string) => void;
  index: number;
}

function SortableFieldRow({
  id,
  setting,
  fieldInfo,
  onToggleVisibility,
  onChangeGroup,
  index
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
      className={`flex items-center gap-3 p-3 bg-card border border-border rounded-lg shadow-xs hover:shadow-md transition-all ${
        isDragging ? 'ring-2 ring-primary/40 border-primary bg-secondary/5' : ''
      } ${!setting.visible ? 'bg-secondary/10 opacity-60' : ''}`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1.5 hover:bg-secondary rounded text-muted-foreground transition-colors"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Position */}
      <span className="text-xs text-muted-foreground font-mono w-5 text-center">
        {index + 1}
      </span>

      {/* Field info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-foreground truncate">
          {setting.fieldName}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {fieldInfo?.field_type || 'input'} {fieldInfo?.unit ? `(${fieldInfo.unit})` : ''}
        </p>
      </div>

      {/* Group input */}
      <div className="w-36 sm:w-48">
        <label className="text-[10px] font-medium text-muted-foreground block mb-0.5 uppercase tracking-wide">
          Section Group
        </label>
        <input
          type="text"
          placeholder="No group"
          value={setting.group || ''}
          onChange={(e) => onChangeGroup(setting.fieldId, e.target.value)}
          className="w-full text-xs h-8 px-2 rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all font-medium"
        />
      </div>

      {/* Visibility Button */}
      <div className="flex flex-col items-center">
        <label className="text-[10px] font-medium text-muted-foreground block mb-0.5 uppercase tracking-wide">
          Visible
        </label>
        <button
          type="button"
          onClick={() => onToggleVisibility(setting.fieldId)}
          className={`p-1.5 rounded-md border transition-colors cursor-pointer ${
            setting.visible
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/20'
              : 'bg-secondary border-border text-muted-foreground hover:bg-secondary/80'
          }`}
        >
          {setting.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

// Main component
export function TemplateEditor() {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const { currentBranchId } = useBranchStore();

  const [parameterSettings, setParameterSettings] = useState<ParameterSetting[]>([]);
  const [fields, setFields] = useState<TestField[]>([]);
  const [testName, setTestName] = useState<string>('');
  const [dbUpdatedAt, setDbUpdatedAt] = useState<string>('');
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Setup sensors for dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8 // Requires 8px drag to start, so clicks on toggles/inputs are unaffected
      }
    })
  );

  // Fetch test layout config
  useEffect(() => {
    async function loadLayout() {
      if (!testId) return;
      setIsLoading(true);
      setError(null);
      try {
        const response = await layoutApi.getTestLayout(testId, currentBranchId || undefined);
        const data = response.data as TestLayoutResponse;

        setTestName(data.testName);
        setFields(data.fields || []);
        setDbUpdatedAt(data.updated_at);

        if (data.layoutConfig && Array.isArray(data.layoutConfig.parameterSettings)) {
          setParameterSettings(data.layoutConfig.parameterSettings);
        } else {
          // Generate default layout settings based on fields
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

  // Handle reorder end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setParameterSettings((items) => {
      const oldIndex = items.findIndex((item) => item.fieldId === active.id);
      const newIndex = items.findIndex((item) => item.fieldId === over.id);

      const reordered = arrayMove(items, oldIndex, newIndex);
      // Recalculate positions
      const updated = reordered.map((item, idx) => ({
        ...item,
        position: idx + 1
      }));
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
          return { ...item, group };
        }
        return item;
      });
      setIsDirty(true);
      return updated;
    });
  };

  // Reset Layout back to default fields order
  const handleResetLayout = () => {
    if (!window.confirm('Are you sure you want to reset the layout config to default field definitions?')) return;
    const defaultSettings = fields.map((field, idx) => ({
      fieldId: field.id,
      fieldName: field.field_name,
      position: idx + 1,
      visible: true,
      group: field.section_group || ''
    }));
    setParameterSettings(defaultSettings);
    setIsDirty(true);
  };

  // Save Layout
  const handleSave = async () => {
    if (!testId) return;

    // Check if at least one parameter is visible
    const hasVisible = parameterSettings.some((s) => s.visible);
    if (!hasVisible) {
      alert('Error: At least one parameter must be visible in the layout configuration.');
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

  // Mock values generator based on field name or type
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

  // Build ordered list of parameters grouped by group name for the A4 preview
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

      {/* Left Panel: Settings Lists */}
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
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
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
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext
                items={parameterSettings.map((s) => s.fieldId)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2.5">
                  {parameterSettings.map((setting, idx) => (
                    <SortableFieldRow
                      key={setting.fieldId}
                      id={setting.fieldId}
                      setting={setting}
                      fieldInfo={fieldsMap.get(setting.fieldId)}
                      onToggleVisibility={handleToggleVisibility}
                      onChangeGroup={handleChangeGroup}
                      index={idx}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>

      {/* Right Panel: A4 Live Preview */}
      <div className="flex-1 bg-secondary/15 flex flex-col overflow-hidden h-[40vh] lg:h-full">
        {/* Preview Titlebar */}
        <div className="p-3 bg-card border-b border-border flex items-center justify-between flex-shrink-0">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Live Preview (A4 Page)
          </span>
          <span className="text-[10px] text-muted-foreground font-mono">
            {visibleSettings.length} of {parameterSettings.length} params visible
          </span>
        </div>

        {/* Preview Scroll Container */}
        <div className="flex-1 overflow-y-auto p-6 flex justify-center items-start">
          <div
            className="w-[794px] min-h-[500px] bg-white shadow-lg border border-border p-8 rounded-xs flex flex-col relative text-[#212121]"
            style={{
              fontFamily: '"Outfit", "Inter", sans-serif',
              boxSizing: 'border-box'
            }}
          >
            {/* Mock Header Brand info */}
            <div className="flex items-start justify-between border-b-2 border-slate-200 pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-cyan-800 flex items-center justify-center text-white font-bold text-sm">
                  VL
                </div>
                <div>
                  <h3 className="font-extrabold text-sm tracking-wide text-cyan-800">
                    VISION LABS PATHOLOGY
                  </h3>
                  <p className="text-[9px] text-slate-500 font-semibold uppercase">
                    Advanced Diagnostic Center
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-700">ISO 9001:2015 Certified</p>
                <p className="text-[9px] text-slate-500 mt-0.5">info@visionlab.com | +91 98765 43210</p>
              </div>
            </div>

            {/* Mock Patient Box */}
            <div className="border border-slate-200 rounded-sm mb-6 flex text-[9.5px] leading-relaxed">
              <div className="flex-1 p-2 border-r border-slate-200 bg-slate-50/50">
                <p className="font-extrabold text-slate-800 text-xs mb-1">Jane Doe</p>
                <p className="text-slate-600">Age: 32 Years &nbsp;|&nbsp; Sex: Female</p>
                <p className="text-slate-600">Patient ID: PID-982741</p>
              </div>
              <div className="flex-1 p-2 border-r border-slate-200 bg-slate-50/50">
                <p className="text-slate-500 font-semibold">Registration ID:</p>
                <p className="font-extrabold text-slate-800 text-xs">REG-82749</p>
                <p className="text-slate-600 mt-1">Ref By: Dr. A. K. Sharma, MD</p>
              </div>
              <div className="p-2 flex flex-col justify-center text-center w-28">
                <p className="text-[8px] font-bold text-slate-600">Registered Date:</p>
                <p className="font-semibold text-slate-800">12-Jun-2026, 09:30 AM</p>
              </div>
            </div>

            {/* Test Heading */}
            <div className="flex justify-center mb-4">
              <h2 className="text-xs font-extrabold uppercase tracking-widest text-[#212121] pb-1 border-b-2 border-[#212121]">
                {testName || 'TEST REPORT'}
              </h2>
            </div>

            {/* Layout Parameters Table */}
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-cyan-800 text-white font-bold uppercase text-[9px] tracking-wider text-left border border-cyan-800">
                  <th className="p-1 px-2.5 w-[36%]">Investigation</th>
                  <th className="p-1 px-2 w-[17%]">Result</th>
                  <th className="p-1 px-2 w-[30%]">Reference Value</th>
                  <th className="p-1 px-2 text-center w-[17%]">Unit</th>
                </tr>
              </thead>
              <tbody>
                {visibleSettings.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-muted-foreground italic">
                      No parameters visible. Drag and toggle eye icon to make parameters visible.
                    </td>
                  </tr>
                ) : (
                  visibleSettings.map((setting, idx) => {
                    const field = fieldsMap.get(setting.fieldId);
                    const mockVal = getMockValue(setting.fieldName, field?.unit, field?.input_type);
                    const isGroupHeader = idx === 0 || visibleSettings[idx - 1].group !== setting.group;

                    return (
                      <React.Fragment key={setting.fieldId}>
                        {/* Group Header Row */}
                        {setting.group && isGroupHeader && (
                          <tr className="bg-slate-50 border-t border-slate-200">
                            <td colSpan={4} className="p-1 px-2.5 font-extrabold text-slate-700 text-[10px] tracking-wide bg-slate-50/80">
                              {setting.group.toUpperCase()}
                            </td>
                          </tr>
                        )}
                        <tr className="border-b border-slate-100 hover:bg-slate-50/30">
                          <td className="p-1 px-2.5 font-medium text-slate-800 whitespace-nowrap overflow-hidden text-ellipsis">
                            {setting.fieldName}
                          </td>
                          <td className="p-1 px-2 font-bold text-slate-900">
                            {mockVal}
                          </td>
                          <td className="p-1 px-2 text-slate-500 whitespace-nowrap">
                            {field?.min_value != null && field?.max_value != null
                              ? `${field.min_value} - ${field.max_value}`
                              : field?.min_value != null
                              ? `>= ${field.min_value}`
                              : field?.max_value != null
                              ? `<= ${field.max_value}`
                              : 'Normal'}
                          </td>
                          <td className="p-1 px-2 text-center text-slate-500">
                            {field?.unit || '-'}
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>

            {/* Mock Interpretation / Notes (if CBC or similar) */}
            <div className="mt-8 border border-slate-200 rounded p-2.5 bg-yellow-50/20 text-[9px] text-slate-600 leading-normal">
              <span className="font-extrabold text-slate-700 uppercase">Interpretation Notes:</span>
              <p className="mt-1">
                This is a mock live preview generated to verify A4 report design styles. Reference ranges are evaluated
                based on patient demographics (32 years Female). Clinical correlation is advised.
              </p>
            </div>

            {/* Spacer */}
            <div className="flex-1 min-h-[40px]" />

            {/* Mock Signatures */}
            <div className="flex items-end justify-between border-t border-slate-200 pt-6 mt-6">
              <div className="text-center w-36">
                <div className="h-6 flex items-center justify-center italic text-xs text-slate-400 font-serif">
                  *technician-sig*
                </div>
                <p className="font-bold text-slate-800 text-[9px] mt-1 border-t border-slate-200 pt-1">
                  Technician Sign
                </p>
              </div>
              <div className="text-center w-36">
                <div className="h-6 flex items-center justify-center italic text-xs text-slate-400 font-serif">
                  *doctor-sig*
                </div>
                <p className="font-bold text-slate-800 text-[9px] mt-1 border-t border-slate-200 pt-1">
                  Pathologist MD Sign
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
