import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Search,
  User,
  FileText,
  X,
  Calendar,
  Beaker,
  Plus,
  UserPlus,
  Check,
  Loader2,
  AlertCircle,
  Hash,
  ArrowLeft,
  Building2,
} from "lucide-react";
import { usePatientStore } from "../../stores/patientStore";
import { useTestStore } from "../../stores/testStore";
import { useDoctorStore } from "../../stores/doctorStore";
import { useBranchStore } from "../../stores/branchStore";
import { useReportStore } from "../../stores/reportStore";
import { useAuthStore } from "../../stores/authStore";
import { useB2BStore } from "../../stores/b2bStore";
import { sampleApi } from "../../api/samples";
import type { Patient, Test, Doctor } from "../../types";

/**
 * CreateReport Page - Create new diagnostic reports
 * Connected to backend via stores
 */
export function CreateReport() {
  const navigate = useNavigate();

  // Stores
  const { patients, fetchPatients, createPatient, isLoading: patientsLoading } = usePatientStore();
  const { tests, fetchTests, isLoading: testsLoading } = useTestStore();
  const { doctors, fetchDoctors } = useDoctorStore();
  const { currentBranchId } = useBranchStore();
  const { createReport, isLoading: reportLoading, error: reportError } = useReportStore();
  const { user } = useAuthStore();
  const { labs: b2bLabs, fetchLabs: fetchB2BLabs } = useB2BStore();

  // Patient search and selection
  const [patientSearch, setPatientSearch] = useState("");
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isNewPatient, setIsNewPatient] = useState(false);

  // Patient form fields (for new patients)
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState<string>("");
  const [patientGender, setPatientGender] = useState<"Male" | "Female">("Male");
  const [patientPhone, setPatientPhone] = useState("");
  const [patientAddress, setPatientAddress] = useState("");

  // Doctor selection
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  // Test selection
  const [selectedTests, setSelectedTests] = useState<Test[]>([]);
  const [testSearch, setTestSearch] = useState("");
  const [showTestDropdown, setShowTestDropdown] = useState(false);

  // Sample/Report information
  const [collectionDate, setCollectionDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [sampleIdCode, setSampleIdCode] = useState<string>("");

  // B2B partner lab
  const [isB2B, setIsB2B] = useState(false);
  const [selectedB2BLabId, setSelectedB2BLabId] = useState("");
  const [b2bCharge, setB2bCharge] = useState<string>("");


  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Patient email (saved to patient record)
  const [patientEmail, setPatientEmail] = useState("");

  const patientSearchRef = useRef<HTMLDivElement>(null);
  const testSearchRef = useRef<HTMLDivElement>(null);

  // Fetch initial data
  useEffect(() => {
    fetchPatients();
    if (currentBranchId) {
      fetchTests(currentBranchId);
    }
    fetchDoctors();
    fetchB2BLabs();
    // Peek at next sample ID (does NOT increment counter)
    sampleApi.getNextId().then((res) => {
      setSampleIdCode(res.data.sample_id_code);
    }).catch(() => {
      // Show format preview if peek fails
      const now = new Date();
      const yy = String(now.getFullYear()).slice(2);
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      setSampleIdCode(`SM-${yy}${mm}-XXXX`);
    });
  }, [fetchPatients, fetchTests, fetchDoctors, fetchB2BLabs, currentBranchId]);



  // Filter patients based on search
  const filteredPatients = useMemo(() => {
    if (!patientSearch) return [];
    const searchLower = patientSearch.toLowerCase();
    return patients.filter((p) => {
      const name = (p.name || '').toLowerCase();
      return (
        name.includes(searchLower) ||
        p.id.toLowerCase().includes(searchLower) ||
        (p.phone || '').toLowerCase().includes(searchLower)
      );
    }).slice(0, 10);
  }, [patients, patientSearch]);

  // Filter tests based on search
  const filteredTests = useMemo(() => {
    return tests.filter(
      (t) =>
        !selectedTests.find((st) => st.id === t.id) &&
        ((t.test_name || '').toLowerCase().includes(testSearch.toLowerCase()) ||
          (t.category || '').toLowerCase().includes(testSearch.toLowerCase()))
    ).slice(0, 15);
  }, [tests, selectedTests, testSearch]);

  // Calculate total price
  const totalPrice = useMemo(() => {
    return selectedTests.reduce((sum, test) => sum + (Number(test.price) || 0), 0);
  }, [selectedTests]);

  // Handle patient selection
  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setPatientSearch(patient.name || '');
    setPatientName(patient.name || '');
    setPatientAge(patient.age != null ? String(patient.age) : '');
    setPatientGender(patient.gender as "Male" | "Female" || 'Male');
    setPatientPhone(patient.phone || '');
    setPatientAddress(patient.address || '');
    setShowPatientDropdown(false);
    setIsNewPatient(false);
  };

  // Handle create new patient mode
  const handleCreateNewPatient = () => {
    setIsNewPatient(true);
    setSelectedPatient(null);
    setPatientName(patientSearch.trim());
    setPatientAge('');
    setPatientGender('Male');
    setPatientPhone('');
    setPatientAddress('');
    setShowPatientDropdown(false);
  };

  // Handle test selection
  const handleSelectTest = (test: Test) => {
    setSelectedTests([...selectedTests, test]);
    setTestSearch("");
    setShowTestDropdown(false);
  };

  // Handle test removal
  const handleRemoveTest = (testId: string) => {
    setSelectedTests(selectedTests.filter((t) => t.id !== testId));
  };

  // Handle form submission
  const handleCreateReport = async () => {
    setFormError(null);

    // Validation
    if (!patientName.trim()) {
      setFormError("Please enter patient name");
      return;
    }
    if (!patientPhone.trim()) {
      setFormError("Please enter patient phone number");
      return;
    }
    if (selectedTests.length === 0) {
      setFormError("Please select at least one test");
      return;
    }
    if (!currentBranchId) {
      setFormError("Please select a branch from the top navigation");
      return;
    }

    setIsSubmitting(true);

    try {
      let patientId = selectedPatient?.id;

      // Create new patient if needed
      if (isNewPatient || !patientId) {
        const newPatient = await createPatient({
          name: patientName,
          email: patientEmail || undefined,
          phone: patientPhone,
          gender: patientGender,
          age: patientAge ? parseInt(patientAge) : undefined,
          address: patientAddress || undefined,
          branch_id: currentBranchId,
        });

        if (!newPatient) {
          setFormError("Failed to create patient");
          setIsSubmitting(false);
          return;
        }
        patientId = newPatient.id;
      }

      // Create report (in draft status) — sample with auto-ID created server-side
      const report = await createReport({
        patient_id: patientId,
        doctor_id: selectedDoctor?.id,
        report_type: selectedTests.map(t => t.test_name).join(', '),
        report_amount: totalPrice,
        is_self_report: !selectedDoctor,
        branch_id: currentBranchId,
        test_data: {
          testType: selectedTests.map(t => t.category || 'General').join(', '),
          testName: selectedTests.map(t => t.test_name).join(', '),
          testIds: selectedTests.map(t => t.id),
          parameters: [],
          remarks: '',
        },
        b2b_lab_id: isB2B && selectedB2BLabId ? selectedB2BLabId : undefined,
        b2b_charge: isB2B && b2bCharge ? parseFloat(b2bCharge) : undefined,
      });

      if (!report) {
        setFormError(reportError || "Failed to create report");
        setIsSubmitting(false);
        return;
      }

      // Navigate to report entry page
      navigate(`/reports/${report.id}/entry`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "An error occurred");
      setIsSubmitting(false);
    }
  };

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        patientSearchRef.current &&
        !patientSearchRef.current.contains(event.target as Node)
      ) {
        setShowPatientDropdown(false);
      }
      if (
        testSearchRef.current &&
        !testSearchRef.current.contains(event.target as Node)
      ) {
        setShowTestDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="space-y-2 md:space-y-3">
      {/* Error Banner */}
      {formError && (
        <div className="bg-destructive/10 border border-destructive/20 rounded p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-destructive" />
            <span className="text-sm text-destructive">{formError}</span>
          </div>
          <button
            onClick={() => setFormError(null)}
            className="text-xs text-destructive hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/reports")}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
          title="Back to Reports"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-foreground text-lg mb-0.5">Create New Report</h1>
          <p className="text-muted-foreground text-xs">
            Search existing patient or register new patient and create diagnostic report
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {/* Report Information Section - Moved to Top */}
        <div className="bg-card border border-border rounded">
          <div className="px-3 py-1.5 border-b border-border bg-secondary/30">
            <h2 className="text-sm text-foreground flex items-center gap-2">
              <FileText className="w-3.5 h-3.5" />
              Report Information
            </h2>
          </div>
          <div className="p-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              <div>
                <label className="text-xs text-muted-foreground block mb-0.5">
                  Date <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground w-3.5 h-3.5" />
                  <input
                    type="date"
                    className="w-full h-9 pl-8 pr-2.5 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    value={collectionDate}
                    onChange={(e) => setCollectionDate(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-0.5">
                  Sample ID <span className="text-[10px] text-muted-foreground">(auto)</span>
                </label>
                <div className="relative">
                  <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground w-3.5 h-3.5" />
                  <input
                    type="text"
                    className="w-full h-9 pl-8 pr-2.5 bg-muted border border-border rounded text-sm cursor-not-allowed text-xs"
                    value={sampleIdCode}
                    readOnly
                    disabled
                    placeholder="Auto-generated"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Patient Information Section */}
        <div className="bg-card border border-border rounded">
          <div className="px-3 py-1.5 border-b border-border bg-secondary/30">
            <h2 className="text-sm text-foreground flex items-center gap-2">
              <User className="w-3.5 h-3.5" />
              Patient Information
            </h2>
          </div>
          <div className="p-2 space-y-1">
            {/* Patient Search */}
            <div className="relative" ref={patientSearchRef}>
              <label className="text-xs text-muted-foreground block mb-0.5">
                Search Patient <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground w-3.5 h-3.5" />
                <input
                  type="text"
                  placeholder="Search by name, mobile, or patient ID..."
                  className="w-full h-9 pl-8 pr-3 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={patientSearch}
                  onChange={(e) => {
                    setPatientSearch(e.target.value);
                    setShowPatientDropdown(true);
                    if (e.target.value.length >= 2) {
                      fetchPatients({ search: e.target.value });
                    }
                  }}
                  onFocus={() => setShowPatientDropdown(true)}
                />
                {patientsLoading && (
                  <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-muted-foreground" />
                )}
              </div>

              {/* Patient Dropdown */}
              {showPatientDropdown && patientSearch && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded shadow-lg max-h-64 overflow-auto z-10">
                  {filteredPatients.length > 0 ? (
                    <>
                      {filteredPatients.map((patient) => (
                        <button
                          key={patient.id}
                          onClick={() => handleSelectPatient(patient)}
                          className="w-full px-3 py-2.5 text-left hover:bg-accent transition-colors border-b border-border last:border-0"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="text-sm text-foreground font-medium">
                                {patient.name}
                              </div>
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {patient.id.slice(0, 8)} • {patient.age != null ? `${patient.age}Y` : ''} {patient.gender?.charAt(0) || ''} • {patient.phone}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                      <button
                        onClick={handleCreateNewPatient}
                        className="w-full px-3 py-2.5 text-left hover:bg-accent transition-colors border-t-2 border-primary/20 flex items-center gap-2 text-primary"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          Create New Patient: {patientSearch}
                        </span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleCreateNewPatient}
                      className="w-full px-3 py-4 text-center hover:bg-accent transition-colors flex flex-col items-center gap-2 text-primary"
                    >
                      <UserPlus className="w-5 h-5" />
                      <div>
                        <div className="text-sm font-medium">No patient found</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Click to create new patient: {patientSearch}
                        </div>
                      </div>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Patient Details Form */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-0.5">
              {/* Row 1: Name */}
              <div className="sm:col-span-2">
                <label className="text-xs text-muted-foreground block mb-0.5">
                  Patient Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  className="w-full h-8 px-2.5 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Full name"
                  disabled={!isNewPatient && !!selectedPatient}
                />
              </div>

              {/* Row 2: Age + Gender */}
              <div>
                <label className="text-xs text-muted-foreground block mb-0.5">
                  Age
                </label>
                <input
                  type="number"
                  min="0"
                  max="150"
                  className="w-full h-8 px-2.5 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                  placeholder="Age"
                  disabled={!isNewPatient && !!selectedPatient}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-0.5">
                  Gender <span className="text-destructive">*</span>
                </label>
                <select
                  className="w-full h-8 px-2.5 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={patientGender}
                  onChange={(e) => setPatientGender(e.target.value as "Male" | "Female")}
                  disabled={!isNewPatient && !!selectedPatient}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              {/* Row 3: Mobile + Email + Send Options */}
              <div>
                <label className="text-xs text-muted-foreground block mb-0.5">
                  Mobile Number <span className="text-destructive">*</span>
                </label>
                <input
                  type="tel"
                  className="w-full h-8 px-2.5 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  placeholder="+1 555-0000"
                  disabled={!isNewPatient && !!selectedPatient}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-0.5">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full h-8 px-2.5 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={patientEmail}
                  onChange={(e) => setPatientEmail(e.target.value)}
                  placeholder="patient@email.com"
                />
              </div>

              {/* Row 4: Address */}
              <div className="sm:col-span-2">
                <label className="text-xs text-muted-foreground block mb-0.5">
                  Address
                </label>
                <input
                  type="text"
                  className="w-full h-8 px-2.5 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={patientAddress}
                  onChange={(e) => setPatientAddress(e.target.value)}
                  placeholder="Street address, city"
                  disabled={!isNewPatient && !!selectedPatient}
                />
              </div>

              {/* Row 5: Referring Doctor */}
              <div className="sm:col-span-2">
                <label className="text-xs text-muted-foreground block mb-0.5">
                  Referring Doctor
                </label>
                <select
                  className="w-full h-8 px-2.5 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={selectedDoctor?.id || ''}
                  onChange={(e) => {
                    const doctor = doctors.find(d => d.id === e.target.value);
                    setSelectedDoctor(doctor || null);
                  }}
                >
                  <option value="">Self (No Doctor)</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.title || 'Dr'}. {doctor.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Patient Status Indicator */}
            {isNewPatient && (
              <div className="flex items-center gap-2 text-xs px-2.5 py-1.5 bg-primary/10 border border-primary/20 rounded">
                <UserPlus className="w-3.5 h-3.5 text-primary" />
                <span className="text-primary font-medium">
                  New patient will be created with this report
                </span>
              </div>
            )}
            {selectedPatient && !isNewPatient && (
              <div className="flex items-center gap-2 text-xs px-2.5 py-1.5 bg-success/10 border border-success/20 rounded">
                <Check className="w-3.5 h-3.5 text-success" />
                <span className="text-success font-medium">
                  Existing patient: {selectedPatient.id.slice(0, 8)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Test Selection Section */}
        <div className="bg-card border border-border rounded">
          <div className="px-3 py-1.5 border-b border-border bg-secondary/30">
            <h2 className="text-sm text-foreground flex items-center gap-2">
              <Beaker className="w-3.5 h-3.5" />
              Test Selection
            </h2>
          </div>
          <div className="p-2 space-y-1">
            {/* Test Search */}
            <div className="relative" ref={testSearchRef}>
              <label className="text-xs text-muted-foreground block mb-0.5">
                Search and Add Tests <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground w-3.5 h-3.5" />
                <input
                  type="text"
                  placeholder="Search tests by name or category..."
                  className="w-full h-9 pl-8 pr-3 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={testSearch}
                  onChange={(e) => {
                    setTestSearch(e.target.value);
                    setShowTestDropdown(true);
                  }}
                  onFocus={() => setShowTestDropdown(true)}
                />
                {testsLoading && (
                  <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-muted-foreground" />
                )}
              </div>

              {/* Test Dropdown */}
              {showTestDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded shadow-lg max-h-64 overflow-auto z-10">
                  {filteredTests.length > 0 ? (
                    filteredTests.map((test) => (
                      <button
                        key={test.id}
                        onClick={() => handleSelectTest(test)}
                        className="w-full px-3 py-2.5 text-left hover:bg-accent transition-colors border-b border-border last:border-0"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="text-sm text-foreground font-medium">
                              {test.test_name}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {test.category || 'General'} • {test.test_code}
                            </div>
                          </div>
                          <div className="text-xs text-foreground font-medium">
                            ₹{Number(test.price) || 0}
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                      {testSearch ? "No tests found" : "Type to search tests"}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Selected Tests */}
            {selectedTests.length > 0 && (
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground block mb-0.5">
                  Selected Tests ({selectedTests.length})
                </label>
                <div className="space-y-1">
                  {selectedTests.map((test) => (
                    <div
                      key={test.id}
                      className="flex items-center justify-between px-3 py-2 bg-secondary/50 border border-border rounded"
                    >
                      <div className="flex-1">
                        <div className="text-sm text-foreground font-medium">
                          {test.test_name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {test.category || 'General'}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-foreground font-medium">
                          ₹{Number(test.price) || 0}
                        </span>
                        <button
                          onClick={() => handleRemoveTest(test.id)}
                          className="w-6 h-6 flex items-center justify-center rounded hover:bg-destructive/10 transition-colors text-destructive"
                          title="Remove test"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between px-3 py-2 bg-primary/5 border border-primary/20 rounded">
                  <span className="text-sm text-foreground font-medium">
                    Total Amount
                  </span>
                  <span className="text-sm text-foreground font-bold">
                    ₹{totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* B2B Partner Lab Section */}
        <div className="bg-card border border-border rounded">
          <div className="px-3 py-1.5 border-b border-border bg-secondary/30 flex items-center justify-between">
            <h2 className="text-sm text-foreground flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5" />
              B2B Partner Lab
            </h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-xs text-muted-foreground">
                {isB2B ? 'Active' : 'Off'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsB2B(!isB2B);
                  if (isB2B) {
                    setSelectedB2BLabId('');
                    setB2bCharge('');
                  }
                }}
                className={`relative w-9 h-5 rounded-full transition-colors ${
                  isB2B ? 'bg-primary' : 'bg-border'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    isB2B ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </label>
          </div>
          {isB2B && (
            <div className="p-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                <div>
                  <label className="text-xs text-muted-foreground block mb-0.5">
                    Select Partner Lab <span className="text-destructive">*</span>
                  </label>
                  <select
                    className="w-full h-9 px-2.5 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    value={selectedB2BLabId}
                    onChange={(e) => setSelectedB2BLabId(e.target.value)}
                  >
                    <option value="">Select a lab...</option>
                    {b2bLabs.filter(l => l.status === 'active').map((lab) => (
                      <option key={lab.id} value={lab.id}>
                        {lab.lab_name} {lab.contact_person ? `(${lab.contact_person})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-0.5">
                    B2B Charge (₹) <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full h-9 px-2.5 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    value={b2bCharge}
                    onChange={(e) => setB2bCharge(e.target.value)}
                    placeholder="Amount payable to partner lab"
                  />
                </div>
              </div>
              {selectedB2BLabId && b2bCharge && totalPrice > 0 && (
                <div className="mt-1.5 px-3 py-2 bg-primary/5 border border-primary/20 rounded">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Report Total</span>
                    <span className="text-foreground tabular-nums">₹{totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-0.5">
                    <span className="text-muted-foreground">B2B Charge</span>
                    <span className="text-destructive tabular-nums">−₹{parseFloat(b2bCharge).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-0.5 pt-1 border-t border-border">
                    <span className="text-foreground font-medium">Net Lab Income</span>
                    <span className="text-foreground font-medium tabular-nums">
                      ₹{Math.max(0, totalPrice - parseFloat(b2bCharge)).toFixed(2)}
                    </span>
                  </div>
                  {selectedDoctor && (
                    <div className="flex items-center justify-between text-xs mt-0.5">
                      <span className="text-muted-foreground">
                        Commission ({selectedDoctor.commission_percentage || 0}% on net)
                      </span>
                      <span className="text-warning tabular-nums">
                        ₹{(Math.max(0, totalPrice - parseFloat(b2bCharge)) * (selectedDoctor.commission_percentage || 0) / 100).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2">
          <button
            onClick={() => navigate("/reports")}
            className="h-9 px-4 flex items-center justify-center gap-2 bg-secondary border border-border rounded hover:bg-accent transition-colors text-sm w-full sm:w-auto"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleCreateReport}
            disabled={isSubmitting || selectedTests.length === 0}
            className="h-9 px-4 flex items-center justify-center gap-2 rounded text-sm text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            style={{ backgroundColor: "var(--primary)" }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Create Report & Continue to Entry
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}