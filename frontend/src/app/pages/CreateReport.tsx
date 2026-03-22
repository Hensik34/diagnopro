import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Search,
  User,
  FileText,
  X,
  Calendar,
  Building2,
  Beaker,
  ChevronDown,
  Plus,
  UserPlus,
  Check,
  Stethoscope,
  DollarSign,
  TrendingDown,
  Percent,
} from "lucide-react";

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: "M" | "F";
  phone: string;
  address: string;
  dob?: string;
}

interface TestType {
  id: string;
  name: string;
  category: string;
  price?: number;
  doctorPrice?: number; // Price when doctor is selected
}

interface Doctor {
  id: string;
  name: string;
  commission: number;
  customPricing: { [testId: string]: number };
}

const MOCK_DOCTORS: Doctor[] = [
  {
    id: "DOC-001",
    name: "Dr. Michael Thompson",
    commission: 15,
    customPricing: {
      CBC: 22,
      THYROID: 40,
      LFT: 36,
      HBA1C: 27,
      URINE: 18,
    },
  },
  {
    id: "DOC-002",
    name: "Dr. Sarah Wilson",
    commission: 20,
    customPricing: {
      CBC: 23,
      LIPID: 32,
      THYROID: 42,
    },
  },
  {
    id: "DOC-003",
    name: "Dr. James Anderson",
    commission: 18,
    customPricing: {
      GLUCOSE: 13,
      HBA1C: 28,
    },
  },
];

const MOCK_PATIENTS: Patient[] = [
  {
    id: "PT-8901",
    name: "Sarah Jenkins",
    age: 58,
    gender: "F",
    phone: "+1 555-0123",
    address: "123 Oak St, Downtown",
    dob: "1965-08-15",
  },
  {
    id: "PT-7823",
    name: "Michael Chen",
    age: 45,
    gender: "M",
    phone: "+1 555-0456",
    address: "456 Maple Ave",
    dob: "1978-03-22",
  },
  {
    id: "PT-6745",
    name: "Robert Williams",
    age: 62,
    gender: "M",
    phone: "+1 555-0789",
    address: "789 Pine Rd",
    dob: "1961-11-05",
  },
  {
    id: "PT-5667",
    name: "Emma Davis",
    age: 34,
    gender: "F",
    phone: "+1 555-0321",
    address: "321 Cedar Ln",
    dob: "1989-06-18",
  },
];

const TEST_TYPES: TestType[] = [
  { id: "CBC", name: "Complete Blood Count (CBC)", category: "Hematology", price: 25 },
  { id: "LIPID", name: "Lipid Profile", category: "Biochemistry", price: 35 },
  { id: "THYROID", name: "Thyroid Profile (T3, T4, TSH)", category: "Hormone", price: 45 },
  { id: "LFT", name: "Liver Function Test (LFT)", category: "Biochemistry", price: 40 },
  { id: "KFT", name: "Kidney Function Test (KFT)", category: "Biochemistry", price: 38 },
  { id: "GLUCOSE", name: "Fasting Blood Glucose", category: "Biochemistry", price: 15 },
  { id: "HBA1C", name: "HbA1c (Glycated Hemoglobin)", category: "Diabetes", price: 30 },
  { id: "URINE", name: "Complete Urine Analysis", category: "Clinical Pathology", price: 20 },
  { id: "ESR", name: "ESR (Erythrocyte Sedimentation Rate)", category: "Hematology", price: 12 },
  { id: "VITAMIN_D", name: "Vitamin D (25-OH)", category: "Vitamins", price: 50 },
];

const BRANCHES = ["Main Branch", "Downtown Center", "West Side Lab", "East Medical Plaza"];
const TECHNICIANS = ["Lisa Johnson", "Robert Miller", "Amanda Chen", "David Martinez"];

export function CreateReport() {
  const navigate = useNavigate();
  
  // Patient search and selection
  const [patientSearch, setPatientSearch] = useState("");
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isNewPatient, setIsNewPatient] = useState(false);
  
  // Patient form fields
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientGender, setPatientGender] = useState<"M" | "F">("M");
  const [patientPhone, setPatientPhone] = useState("");
  const [patientAddress, setPatientAddress] = useState("");
  const [referringDoctor, setReferringDoctor] = useState("");
  
  // Doctor selection for billing
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  
  // Test selection
  const [selectedTests, setSelectedTests] = useState<TestType[]>([]);
  const [testSearch, setTestSearch] = useState("");
  const [showTestDropdown, setShowTestDropdown] = useState(false);
  
  // Sample information
  const [collectionDate, setCollectionDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [collectionTime, setCollectionTime] = useState(
    new Date().toTimeString().split(" ")[0].substring(0, 5)
  );
  const [selectedBranch, setSelectedBranch] = useState(BRANCHES[0]);
  const [selectedTechnician, setSelectedTechnician] = useState(TECHNICIANS[0]);
  const [sampleNotes, setSampleNotes] = useState("");
  
  const patientSearchRef = useRef<HTMLDivElement>(null);
  const testSearchRef = useRef<HTMLDivElement>(null);

  // Filter patients based on search
  const filteredPatients = MOCK_PATIENTS.filter((p) => {
    const searchLower = patientSearch.toLowerCase();
    return (
      p.name.toLowerCase().includes(searchLower) ||
      p.id.toLowerCase().includes(searchLower) ||
      p.phone.toLowerCase().includes(searchLower)
    );
  });

  // Filter tests based on search
  const filteredTests = TEST_TYPES.filter(
    (t) =>
      !selectedTests.find((st) => st.id === t.id) &&
      (t.name.toLowerCase().includes(testSearch.toLowerCase()) ||
        t.category.toLowerCase().includes(testSearch.toLowerCase()))
  );

  // Handle patient selection
  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setPatientSearch(patient.name);
    setPatientName(patient.name);
    setPatientAge(patient.age.toString());
    setPatientGender(patient.gender);
    setPatientPhone(patient.phone);
    setPatientAddress(patient.address);
    setShowPatientDropdown(false);
    setIsNewPatient(false);
  };

  // Handle create new patient
  const handleCreateNewPatient = () => {
    setIsNewPatient(true);
    setSelectedPatient(null);
    setPatientName(patientSearch);
    setPatientAge("");
    setPatientGender("M");
    setPatientPhone("");
    setPatientAddress("");
    setShowPatientDropdown(false);
  };

  // Handle test selection
  const handleSelectTest = (test: TestType) => {
    setSelectedTests([...selectedTests, test]);
    setTestSearch("");
    setShowTestDropdown(false);
  };

  // Handle test removal
  const handleRemoveTest = (testId: string) => {
    setSelectedTests(selectedTests.filter((t) => t.id !== testId));
  };

  // Handle form submission
  const handleCreateReport = () => {
    // Validation
    if (!patientName.trim()) {
      alert("Please enter patient name");
      return;
    }
    if (!patientAge || parseInt(patientAge) <= 0) {
      alert("Please enter valid patient age");
      return;
    }
    if (!patientPhone.trim()) {
      alert("Please enter patient phone number");
      return;
    }
    if (selectedTests.length === 0) {
      alert("Please select at least one test");
      return;
    }

    // Generate IDs
    const reportId = `REP-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const patientId = selectedPatient?.id || `PT-${Math.floor(1000 + Math.random() * 9000)}`;
    const sampleId = `SMP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Navigate to report entry page
    // In a real app, you would save the report to backend first
    navigate(`/reports/${reportId}/entry`, {
      state: {
        reportId,
        patientId,
        sampleId,
        patient: {
          name: patientName,
          age: parseInt(patientAge),
          gender: patientGender,
          phone: patientPhone,
          address: patientAddress,
        },
        tests: selectedTests,
        sample: {
          collectionDate,
          collectionTime,
          branch: selectedBranch,
          technician: selectedTechnician,
          notes: sampleNotes,
        },
        referringDoctor,
        selectedDoctor,
      },
    });
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

  const totalPrice = selectedTests.reduce((sum, test) => sum + (test.price || 0), 0);

  return (
    <div className="space-y-4 max-w-5xl">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-foreground text-lg mb-0.5">Create New Report</h1>
          <p className="text-muted-foreground text-xs">
            Search existing patient or register new patient and create diagnostic report
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Patient Information Section */}
        <div className="bg-card border border-border rounded">
          <div className="px-4 py-2.5 border-b border-border bg-secondary/30">
            <h2 className="text-sm text-foreground flex items-center gap-2">
              <User className="w-4 h-4" />
              Patient Information
            </h2>
          </div>
          <div className="p-4 space-y-3">
            {/* Patient Search */}
            <div className="relative" ref={patientSearchRef}>
              <label className="text-xs text-muted-foreground block mb-1">
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
                  }}
                  onFocus={() => setShowPatientDropdown(true)}
                />
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
                                {patient.id} • {patient.age}Y {patient.gender} • {patient.phone}
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
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">
                  Full Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  className="w-full h-9 px-2.5 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Enter patient name"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">
                    Age <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="number"
                    className="w-full h-9 px-2.5 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    value={patientAge}
                    onChange={(e) => setPatientAge(e.target.value)}
                    placeholder="Age"
                    min="0"
                    max="150"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">
                    Gender <span className="text-destructive">*</span>
                  </label>
                  <select
                    className="w-full h-9 px-2.5 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    value={patientGender}
                    onChange={(e) => setPatientGender(e.target.value as "M" | "F")}
                  >
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">
                  Mobile Number <span className="text-destructive">*</span>
                </label>
                <input
                  type="tel"
                  className="w-full h-9 px-2.5 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  placeholder="+1 555-0000"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">
                  Referring Doctor
                </label>
                <input
                  type="text"
                  className="w-full h-9 px-2.5 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={referringDoctor}
                  onChange={(e) => setReferringDoctor(e.target.value)}
                  placeholder="Dr. Name"
                />
              </div>

              <div className="col-span-2">
                <label className="text-xs text-muted-foreground block mb-1">
                  Address
                </label>
                <input
                  type="text"
                  className="w-full h-9 px-2.5 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={patientAddress}
                  onChange={(e) => setPatientAddress(e.target.value)}
                  placeholder="Street address, city"
                />
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
                  Existing patient: {selectedPatient.id}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Test Selection Section */}
        <div className="bg-card border border-border rounded">
          <div className="px-4 py-2.5 border-b border-border bg-secondary/30">
            <h2 className="text-sm text-foreground flex items-center gap-2">
              <Beaker className="w-4 h-4" />
              Test Selection
            </h2>
          </div>
          <div className="p-4 space-y-3">
            {/* Test Search */}
            <div className="relative" ref={testSearchRef}>
              <label className="text-xs text-muted-foreground block mb-1">
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
                              {test.name}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {test.category}
                            </div>
                          </div>
                          <div className="text-xs text-foreground font-medium">
                            ${test.price}
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
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground block">
                  Selected Tests ({selectedTests.length})
                </label>
                <div className="space-y-1.5">
                  {selectedTests.map((test) => (
                    <div
                      key={test.id}
                      className="flex items-center justify-between px-3 py-2 bg-secondary/50 border border-border rounded"
                    >
                      <div className="flex-1">
                        <div className="text-sm text-foreground font-medium">
                          {test.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {test.category}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-foreground font-medium">
                          ${test.price}
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
                    ${totalPrice}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sample Information Section */}
        <div className="bg-card border border-border rounded">
          <div className="px-4 py-2.5 border-b border-border bg-secondary/30">
            <h2 className="text-sm text-foreground flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Sample Information
            </h2>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">
                  Collection Date <span className="text-destructive">*</span>
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
                <label className="text-xs text-muted-foreground block mb-1">
                  Collection Time <span className="text-destructive">*</span>
                </label>
                <input
                  type="time"
                  className="w-full h-9 px-2.5 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={collectionTime}
                  onChange={(e) => setCollectionTime(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">
                  Branch Location <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground w-3.5 h-3.5" />
                  <select
                    className="w-full h-9 pl-8 pr-2.5 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                  >
                    {BRANCHES.map((branch) => (
                      <option key={branch} value={branch}>
                        {branch}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1">
                  Technician <span className="text-destructive">*</span>
                </label>
                <select
                  className="w-full h-9 px-2.5 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={selectedTechnician}
                  onChange={(e) => setSelectedTechnician(e.target.value)}
                >
                  {TECHNICIANS.map((tech) => (
                    <option key={tech} value={tech}>
                      {tech}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <label className="text-xs text-muted-foreground block mb-1">
                  Sample Notes (Optional)
                </label>
                <textarea
                  className="w-full px-2.5 py-2 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  rows={2}
                  value={sampleNotes}
                  onChange={(e) => setSampleNotes(e.target.value)}
                  placeholder="Add any special notes about sample collection or handling..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/reports")}
            className="h-9 px-4 flex items-center gap-2 bg-secondary border border-border rounded hover:bg-accent transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateReport}
            className="h-9 px-4 flex items-center gap-2 rounded text-sm text-white hover:opacity-90 transition-opacity"
            style={{ backgroundColor: "var(--primary)" }}
          >
            <Plus className="w-4 h-4" />
            Create Report & Continue to Entry
          </button>
        </div>
      </div>
    </div>
  );
}