import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Save,
  CheckCircle,
  AlertCircle,
  Clock,
  ChevronLeft,
  FileText,
  User,
  Calendar,
  Microscope,
  Info,
  History,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";

// Mock Data for the selected patient/test
const MOCK_PATIENT_DETAILS = {
  id: "PT-8901",
  name: "Sarah Jenkins",
  age: 34,
  gender: "Female",
  dob: "1989-05-12",
  mobile: "+1 (555) 012-3456",
  referringDr: "Dr. Emily Chen",
  collectionDate: new Date().toISOString(),
};

const TEST_PARAMETERS = [
  {
    id: 1,
    name: "Hemoglobin",
    unit: "g/dL",
    min: 12.0,
    max: 15.5,
    step: 0.1,
  },
  {
    id: 2,
    name: "RBC Count",
    unit: "mil/µL",
    min: 3.5,
    max: 5.5,
    step: 0.01,
  },
  {
    id: 3,
    name: "HCT",
    unit: "%",
    min: 37.0,
    max: 47.0,
    step: 0.1,
  },
  {
    id: 4,
    name: "MCV",
    unit: "fL",
    min: 80.0,
    max: 100.0,
    step: 0.1,
  },
  {
    id: 5,
    name: "MCH",
    unit: "pg",
    min: 27.0,
    max: 31.0,
    step: 0.1,
  },
  {
    id: 6,
    name: "MCHC",
    unit: "g/dL",
    min: 32.0,
    max: 36.0,
    step: 0.1,
  },
  {
    id: 7,
    name: "RDW",
    unit: "%",
    min: 11.5,
    max: 14.5,
    step: 0.1,
  },
  {
    id: 8,
    name: "Platelet Count",
    unit: "thou/µL",
    min: 150,
    max: 450,
    step: 1,
  },
  {
    id: 9,
    name: "WBC Count",
    unit: "thou/µL",
    min: 4.5,
    max: 11.0,
    step: 0.1,
  },
];

const MOCK_VERSION_HISTORY = [
  {
    id: 1,
    timestamp: "2024-02-26 14:23",
    user: "Dr. Sarah Mitchell",
    action: "Created draft",
    changes: 5,
  },
  {
    id: 2,
    timestamp: "2024-02-26 14:45",
    user: "Tech. John Doe",
    action: "Updated values",
    changes: 3,
  },
  {
    id: 3,
    timestamp: "2024-02-26 15:02",
    user: "Dr. Sarah Mitchell",
    action: "Reviewed",
    changes: 0,
  },
];



export function ReportEntry() {
  const [values, setValues] = useState<Record<number, string>>(
    {},
  );
  const [statuses, setStatuses] = useState<
    Record<number, "low" | "high" | "normal" | "empty">
  >({});
  const [showHistory, setShowHistory] = useState(false);
  const navigate = useNavigate();

  const handleValueChange = (id: number, value: string) => {
    setValues((prev) => ({ ...prev, [id]: value }));
  };

  useEffect(() => {
    const newStatuses: Record<
      number,
      "low" | "high" | "normal" | "empty"
    > = {};

    TEST_PARAMETERS.forEach((param) => {
      const valStr = values[param.id];
      if (!valStr || valStr === "") {
        newStatuses[param.id] = "empty";
        return;
      }

      const val = parseFloat(valStr);
      if (isNaN(val)) {
        newStatuses[param.id] = "empty";
      } else if (val < param.min) {
        newStatuses[param.id] = "low";
      } else if (val > param.max) {
        newStatuses[param.id] = "high";
      } else {
        newStatuses[param.id] = "normal";
      }
    });

    setStatuses(newStatuses);
  }, [values]);

  const getStatusBadge = (
    status: "low" | "high" | "normal" | "empty",
  ) => {
    const styles = {
      low: {
        bg: "var(--info)",
        text: "var(--info-foreground)",
      },
      high: {
        bg: "var(--destructive)",
        text: "var(--destructive-foreground)",
      },
      normal: {
        bg: "var(--success)",
        text: "var(--success-foreground)",
      },
    };

    if (status === "empty") {
      return (
        <span className="text-muted-foreground text-xs">-</span>
      );
    }

    const style = styles[status];
    return (
      <span
        className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide"
        style={{ backgroundColor: style.bg, color: style.text }}
      >
        {status}
      </span>
    );
  };

  const getInputClass = (
    status: "low" | "high" | "normal" | "empty",
  ) => {
    const base =
      "w-full px-2 py-1.5 text-xs border rounded focus:outline-none focus:ring-1 transition-colors text-right tabular-nums";

    if (status === "low") {
      return `${base} border-info bg-info/5 text-foreground focus:border-info focus:ring-info`;
    } else if (status === "high") {
      return `${base} border-destructive bg-destructive/5 text-foreground focus:border-destructive focus:ring-destructive`;
    } else if (status === "normal") {
      return `${base} border-success bg-success/5 text-foreground focus:border-success focus:ring-success`;
    } else {
      return `${base} border-border focus:border-primary focus:ring-primary`;
    }
  };

  const abnormalCount = Object.values(statuses).filter(
    (s) => s === "low" || s === "high",
  ).length;


const handleApprove = () => {

  if (Object.keys(values).length === 0) {
    alert("Please enter test values before approving.");
    return;
  }

  const parameters = TEST_PARAMETERS.map(p => ({
    name: p.name,
    result: values[p.id] || '',
    unit: p.unit,
    refRange: `${p.min} - ${p.max}`,
    isAbnormal: statuses[p.id] === 'low' || statuses[p.id] === 'high',
    status: statuses[p.id] || 'empty'
  }));

  const reportData = {
    patient: MOCK_PATIENT_DETAILS,
    test: {
      name: "Complete Blood Count (CBC)",
      category: "Hematology"
    },
    parameters
  };

  navigate(`/reports/preview/1`, {
    state: { reportData }
  });
};
  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header / Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-accent transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-foreground text-lg mb-0.5">
              Report Entry
            </h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="tabular-nums">
                #REP-2024-892
              </span>
              <span className="w-1 h-1 bg-border rounded-full"></span>
              <span
                className="flex items-center gap-1"
                style={{ color: "var(--warning)" }}
              >
                <Clock className="w-3 h-3" /> Pending Entry
              </span>
              {abnormalCount > 0 && (
                <>
                  <span className="w-1 h-1 bg-border rounded-full"></span>
                  <span
                    className="flex items-center gap-1"
                    style={{ color: "var(--destructive)" }}
                  >
                    <AlertCircle className="w-3 h-3" />{" "}
                    {abnormalCount} Abnormal
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="h-8 px-2.5 flex items-center gap-1.5 bg-card border border-border rounded hover:bg-accent transition-colors text-xs"
          >
            <History className="w-3.5 h-3.5" />
            History
          </button>
          <button className="h-8 px-2.5 flex items-center gap-1.5 bg-card border border-border rounded hover:bg-accent transition-colors text-xs">
            <Save className="w-3.5 h-3.5" />
            Save Draft
            <span className="text-muted-foreground ml-1">
              Ctrl+S
            </span>
          </button>
          <button
            onClick={handleApprove}
            className="h-8 px-2.5 flex items-center gap-1.5 bg-success text-white rounded hover:opacity-90 transition-opacity text-xs"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Approve & Print
          </button>
        </div>
      </div>

      <div className="flex gap-4">
        {/* Main Content */}
        <div className="flex-1 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {/* Left Col: Patient & Test Info */}
            <div className="col-span-1 space-y-4">
              {/* Patient Card */}
              <div className="bg-card border border-border rounded">
                <div className="px-3 py-2.5 border-b border-border flex items-center justify-between">
                  <h3 className="text-foreground text-sm flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                    Patient Details
                  </h3>
                  <span className="text-[10px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded tabular-nums">
                    {MOCK_PATIENT_DETAILS.id}
                  </span>
                </div>
                <div className="p-3 space-y-2.5 text-xs">
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-0.5">
                      Full Name
                    </label>
                    <div className="text-foreground text-sm">
                      {MOCK_PATIENT_DETAILS.name}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-0.5">
                        Age / Gender
                      </label>
                      <div className="text-foreground">
                        {MOCK_PATIENT_DETAILS.age} /{" "}
                        {MOCK_PATIENT_DETAILS.gender.charAt(0)}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-0.5">
                        DOB
                      </label>
                      <div className="text-foreground tabular-nums">
                        {MOCK_PATIENT_DETAILS.dob}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-0.5">
                      Contact
                    </label>
                    <div className="text-foreground tabular-nums">
                      {MOCK_PATIENT_DETAILS.mobile}
                    </div>
                  </div>
                </div>
              </div>

              {/* Test Info Card */}
              <div className="bg-card border border-border rounded">
                <div className="px-3 py-2.5 border-b border-border">
                  <h3 className="text-foreground text-sm flex items-center gap-2">
                    <Microscope className="w-3.5 h-3.5 text-muted-foreground" />
                    Test Information
                  </h3>
                </div>
                <div className="p-3 space-y-2.5 text-xs">
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-0.5">
                      Test Name
                    </label>
                    <div className="text-foreground text-sm">
                      Complete Blood Count (CBC)
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-0.5">
                      Referring Doctor
                    </label>
                    <div className="text-foreground">
                      {MOCK_PATIENT_DETAILS.referringDr}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-0.5">
                      Collection Date
                    </label>
                    <div className="text-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-muted-foreground" />
                      {format(new Date(), "MMM dd, yyyy HH:mm")}
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="bg-info/10 border border-info/20 rounded p-2.5 text-xs flex items-start gap-2"
                style={{ color: "var(--info)" }}
              >
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-tight">
                  Ensure all critical values are double-checked
                  before approval. System flags abnormal
                  results.
                </p>
              </div>

              {/* Keyboard Shortcuts */}
              <div className="bg-secondary/50 border border-border rounded p-2.5">
                <h4 className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
                  Shortcuts
                </h4>
                <div className="space-y-1 text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Save Draft
                    </span>
                    <kbd className="px-1.5 py-0.5 bg-card border border-border rounded text-foreground">
                      Ctrl+S
                    </kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Next Field
                    </span>
                    <kbd className="px-1.5 py-0.5 bg-card border border-border rounded text-foreground">
                      Tab
                    </kbd>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Approve
                    </span>
                    <kbd className="px-1.5 py-0.5 bg-card border border-border rounded text-foreground">
                      Ctrl+Enter
                    </kbd>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Col: Parameter Entry */}
            <div className="col-span-2">
              <div className="bg-card border border-border rounded">
                <div className="px-4 py-2.5 border-b border-border flex justify-between items-center">
                  <h3 className="text-foreground text-sm">
                    Test Parameters
                  </h3>
                  <span className="text-[10px] text-muted-foreground">
                    Last auto-saved: 2 mins ago
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-secondary/30">
                      <tr className="border-b border-border">
                        <th className="px-4 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">
                          Parameter
                        </th>
                        <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider">
                          Unit
                        </th>
                        <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider">
                          Ref. Range
                        </th>
                        <th className="px-4 py-2 text-right text-muted-foreground text-[10px] uppercase tracking-wider">
                          Result
                        </th>
                        <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {TEST_PARAMETERS.map((param) => (
                        <tr
                          key={param.id}
                          className="hover:bg-accent/30 transition-colors"
                        >
                          <td className="px-4 py-2 text-foreground text-xs">
                            {param.name}
                          </td>
                          <td className="px-3 py-2 text-center text-muted-foreground text-[10px]">
                            {param.unit}
                          </td>
                          <td className="px-3 py-2 text-center text-muted-foreground tabular-nums text-[10px] whitespace-nowrap">
                            {param.min} - {param.max}
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              step={param.step}
                              className={getInputClass(
                                statuses[param.id],
                              )}
                              placeholder="0.0"
                              value={values[param.id] || ""}
                              onChange={(e) =>
                                handleValueChange(
                                  param.id,
                                  e.target.value,
                                )
                              }
                              tabIndex={param.id}
                            />
                          </td>
                          <td className="px-3 py-2 text-center">
                            {getStatusBadge(statuses[param.id])}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="px-3 py-2 bg-secondary/30 border-t border-border">
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground justify-end">
                    <div className="flex items-center gap-1">
                      <span
                        className="w-2 h-2 rounded-full border border-info"
                        style={{
                          backgroundColor: "var(--info)",
                        }}
                      ></span>{" "}
                      Low
                    </div>
                    <div className="flex items-center gap-1">
                      <span
                        className="w-2 h-2 rounded-full border border-success"
                        style={{
                          backgroundColor: "var(--success)",
                        }}
                      ></span>{" "}
                      Normal
                    </div>
                    <div className="flex items-center gap-1">
                      <span
                        className="w-2 h-2 rounded-full border border-destructive"
                        style={{
                          backgroundColor: "var(--destructive)",
                        }}
                      ></span>{" "}
                      High
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 bg-card border border-border rounded p-3">
                <h4 className="text-xs text-foreground mb-2">
                  Technician Notes
                </h4>
                <textarea
                  className="w-full border border-border rounded p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary min-h-[80px] bg-background"
                  placeholder="Add internal notes regarding sample quality, verification methods, etc..."
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        {/* Version History Sidebar */}
        {showHistory && (
          <div className="w-72 bg-card border border-border rounded space-y-0 overflow-hidden">
            <div className="px-3 py-2.5 border-b border-border flex items-center justify-between bg-secondary/30">
              <h3 className="text-foreground text-sm flex items-center gap-2">
                <History className="w-3.5 h-3.5" />
                Version History
              </h3>
              <button
                onClick={() => setShowHistory(false)}
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-accent transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="p-3 space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
              {MOCK_VERSION_HISTORY.map((version) => (
                <div
                  key={version.id}
                  className="p-2.5 bg-secondary/30 border border-border rounded hover:bg-accent/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-xs text-foreground">
                      {version.action}
                    </span>
                    {version.changes > 0 && (
                      <span className="text-[10px] bg-primary text-white px-1.5 py-0.5 rounded">
                        {version.changes} changes
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {version.user}
                  </div>
                  <div className="text-[10px] text-muted-foreground tabular-nums mt-1">
                    {version.timestamp}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}