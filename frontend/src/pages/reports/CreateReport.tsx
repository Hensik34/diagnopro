import { useState, useRef, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router";
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
  MessageSquare,
  Info,
  Stethoscope,
} from "lucide-react";
import { toast } from "sonner";
import { usePatientStore } from "../../stores/patientStore";
import { useTestStore } from "../../stores/testStore";
import { useDoctorStore } from "../../stores/doctorStore";
import { useBranchStore } from "../../stores/branchStore";
import { useReportStore } from "../../stores/reportStore";
import { useAuthStore } from "../../stores/authStore";
import { useB2BStore } from "../../stores/b2bStore";
import { sampleApi } from "../../api/samples";
import { testApi } from "../../api/tests";
import { priceListApi, pricingEngineApi } from "../../api/priceLists";
import { doctorApi } from "../../api/doctors";
import type { AgeUnit, Patient, Test, Doctor, PriceList, ReportTestPriceSnapshot, DoctorPriceAssignment, DoctorTestPriceOverride } from "../../types";
import { DEFAULT_AGE_UNIT, formatAge, getAgeMax, normalizeAgeUnit } from "../../utils/age";
import { smartSearchFilter } from "../../utils";

/**
 * CreateReport Page - Create new diagnostic reports
 * Connected to backend via stores
 */
export function CreateReport() {
  const navigate = useNavigate();
  const location = useLocation();

  // Stores
  const { patients, fetchPatients, createPatient, isLoading: patientsLoading } = usePatientStore();
  const { tests, fetchTests, isLoading: testsLoading } = useTestStore();
  const { doctors, fetchDoctors } = useDoctorStore();
  const { currentBranchId } = useBranchStore();
  const { createReport, isLoading: reportLoading, error: reportError } = useReportStore();
  const { user, staffList, fetchStaffList } = useAuthStore();
  const { labs: b2bLabs, fetchLabs: fetchB2BLabs } = useB2BStore();

  // Patient search and selection
  const [patientSearch, setPatientSearch] = useState("");
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isNewPatient, setIsNewPatient] = useState(false);
  const [activePatientIndex, setActivePatientIndex] = useState(0);

  // Patient form fields (for new patients)
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState<string>("");
  const [patientAgeUnit, setPatientAgeUnit] = useState<AgeUnit>(DEFAULT_AGE_UNIT);
  const [patientGender, setPatientGender] = useState<"Male" | "Female">("Male");
  const [patientPhone, setPatientPhone] = useState("");
  const [patientAddress, setPatientAddress] = useState("");

  // Doctor selection
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [referringDoctorName, setReferringDoctorName] = useState("");
  const [doctorSearch, setDoctorSearch] = useState("");
  const [showDoctorDropdown, setShowDoctorDropdown] = useState(false);
  const [activeDoctorIndex, setActiveDoctorIndex] = useState(0);

  // Test selection
  const [selectedTests, setSelectedTests] = useState<Test[]>([]);
  const [testSearch, setTestSearch] = useState("");
  const [showTestDropdown, setShowTestDropdown] = useState(false);
  const [activeTestIndex, setActiveTestIndex] = useState(0);

  // Package selection states
  const [packages, setPackages] = useState<any[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [selectedPackages, setSelectedPackages] = useState<any[]>([]);
  const [individuallySelectedTestIds, setIndividuallySelectedTestIds] = useState<Set<string>>(new Set());

  // Sample/Report information
  const [collectionDate, setCollectionDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [sampleIdCode, setSampleIdCode] = useState<string>("");

  // B2B partner lab
  const [isB2B, setIsB2B] = useState(false);
  const [selectedB2BLabId, setSelectedB2BLabId] = useState("");
  const [b2bCharge, setB2bCharge] = useState<string>("");

  // Multi-tier pricing states
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [priceListId, setPriceListId] = useState<string | null>(null);
  const [manualOverrides, setManualOverrides] = useState<Record<string, number>>({});
  const [resolvedPricesFromEngine, setResolvedPricesFromEngine] = useState<Record<string, ReportTestPriceSnapshot>>({});
  const [selectedPriceListDetails, setSelectedPriceListDetails] = useState<PriceList | null>(null);
  const [doctorPricing, setDoctorPricing] = useState<{
    assignment: DoctorPriceAssignment | null;
    overrides: DoctorTestPriceOverride[];
    priceListDetails: PriceList | null;
  } | null>(null);

  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Patient email (saved to patient record)
  const [patientEmail, setPatientEmail] = useState("");
  const [selectedStaffId, setSelectedStaffId] = useState("");

  // WhatsApp Delivery Preferences
  const [sendWhatsAppPatient, setSendWhatsAppPatient] = useState(true);
  const [sendWhatsAppDoctor, setSendWhatsAppDoctor] = useState(false);

  useEffect(() => {
    if (patientPhone) {
      setSendWhatsAppPatient(true);
    } else {
      setSendWhatsAppPatient(false);
    }
  }, [patientPhone]);

  useEffect(() => {
    if (selectedDoctor) {
      setSendWhatsAppDoctor(!!selectedDoctor.phone);
    } else {
      setSendWhatsAppDoctor(false);
    }
  }, [selectedDoctor]);

  useEffect(() => {
    if (!user) return;
    if (selectedStaffId) return;

    if (user.role === "staff" || user.role === "lab_technician") {
      setSelectedStaffId(user.id);
    }
  }, [user, selectedStaffId]);

  const patientSearchRef = useRef<HTMLDivElement>(null);
  const patientSearchInputRef = useRef<HTMLInputElement>(null);
  const patientNameInputRef = useRef<HTMLInputElement>(null);
  const testSearchRef = useRef<HTMLDivElement>(null);
  const testSearchInputRef = useRef<HTMLInputElement>(null);
  const doctorSearchRef = useRef<HTMLDivElement>(null);
  const doctorSearchInputRef = useRef<HTMLInputElement>(null);
  const isClearingDoctorRef = useRef(false);

  // Fetch initial data
  useEffect(() => {
    fetchPatients();
    if (currentBranchId) {
      fetchTests(currentBranchId);
      // Fetch packages
      setPackagesLoading(true);
      testApi.getPackages(currentBranchId)
        .then(res => {
          setPackages(res.data || []);
        })
        .catch(err => {
          console.error("Failed to fetch packages:", err);
        })
        .finally(() => {
          setPackagesLoading(false);
        });

      // Fetch active price lists
      priceListApi.getAll({ branch_id: currentBranchId, is_active: true })
        .then(res => {
          const lists = res.data || [];
          setPriceLists(lists);
          const defaultList = lists.find(l => l.is_default);
          setPriceListId(defaultList ? defaultList.id : null);
        })
        .catch(err => {
          console.error("Failed to fetch price lists:", err);
        });
    }
    fetchDoctors();
    fetchStaffList();
    fetchB2BLabs();
    // Peek at next sample ID (does NOT increment counter)
    sampleApi.getNextId(currentBranchId || undefined).then((res) => {
      setSampleIdCode(res.data.sample_id_code);
    }).catch(() => {
      // Show format preview if peek fails
      setSampleIdCode('1001');
    });
  }, [fetchPatients, fetchTests, fetchDoctors, fetchStaffList, fetchB2BLabs, currentBranchId]);

  useEffect(() => {
    if (!selectedPatient || isNewPatient) {
      patientNameInputRef.current?.focus();
    }
  }, [isNewPatient, selectedPatient]);



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

  // Filter doctors based on search
  const filteredDoctors = useMemo(() => {
    if (!doctorSearch) return doctors.slice(0, 10);
    const searchLower = doctorSearch.toLowerCase();
    return doctors.filter((d) => {
      const fullName = `${d.title || 'Dr'}. ${d.name}`.toLowerCase();
      return (
        fullName.includes(searchLower) ||
        (d.phone || '').toLowerCase().includes(searchLower) ||
        (d.specialization || '').toLowerCase().includes(searchLower)
      );
    }).slice(0, 10);
  }, [doctors, doctorSearch]);

  const doctorDropdownOptions = useMemo(() => {
    const options: ({ type: 'self' } | { type: 'doctor'; data: Doctor })[] = [];
    const isSelfVisible = !doctorSearch || 'self'.includes(doctorSearch.toLowerCase());
    if (isSelfVisible) {
      options.push({ type: 'self' as const });
    }
    filteredDoctors.forEach(doc => {
      options.push({ type: 'doctor' as const, data: doc });
    });
    return options;
  }, [doctorSearch, filteredDoctors]);

  useEffect(() => {
    if (!showDoctorDropdown || doctorDropdownOptions.length === 0) {
      setActiveDoctorIndex(0);
      return;
    }

    setActiveDoctorIndex((currentIndex) => Math.min(currentIndex, doctorDropdownOptions.length - 1));
  }, [doctorDropdownOptions, showDoctorDropdown]);

  useEffect(() => {
    if (!showPatientDropdown || filteredPatients.length === 0) {
      setActivePatientIndex(0);
      return;
    }

    setActivePatientIndex((currentIndex) => Math.min(currentIndex, filteredPatients.length - 1));
  }, [filteredPatients, showPatientDropdown]);

  // Filter packages based on search
  const filteredPackages = useMemo(() => {
    if (!testSearch.trim()) {
      return []; // Search by need only
    }
    const unselected = packages.filter(p => !selectedPackages.find((sp) => sp.id === p.id));
    return smartSearchFilter(unselected, testSearch, [
      { field: p => p.package_name, weight: 1.0 },
      { field: p => p.package_code, weight: 0.8 },
      { field: p => p.category, weight: 0.6 }
    ]).slice(0, 10);
  }, [packages, selectedPackages, testSearch]);

  // Filter tests based on search
  const filteredTests = useMemo(() => {
    const unselected = tests.filter(t => !selectedTests.find((st) => st.id === t.id));
    if (!testSearch.trim()) {
      return unselected.slice(0, 15);
    }
    return smartSearchFilter(unselected, testSearch, [
      { field: t => t.test_name, weight: 1.0 },
      { field: t => t.category, weight: 0.6 }
    ]).slice(0, 15);
  }, [tests, selectedTests, testSearch]);

  // Combined search results for navigation: tests at the top, packages at the bottom
  const searchResults = useMemo(() => {
    const results: ({ type: 'test'; data: Test } | { type: 'package'; data: any })[] = [];
    filteredTests.forEach(t => results.push({ type: 'test', data: t }));
    filteredPackages.forEach(p => results.push({ type: 'package', data: p }));
    return results;
  }, [filteredPackages, filteredTests]);

  useEffect(() => {
    if (!showTestDropdown || searchResults.length === 0) {
      setActiveTestIndex(0);
      return;
    }

    setActiveTestIndex((currentIndex) => Math.min(currentIndex, searchResults.length - 1));
  }, [searchResults, showTestDropdown]);

  // Fetch detailed list items of the selected report price list for search-dropdown resolution
  useEffect(() => {
    if (!priceListId) {
      setSelectedPriceListDetails(null);
      return;
    }
    priceListApi.getById(priceListId)
      .then(res => {
        setSelectedPriceListDetails(res.data);
      })
      .catch(err => {
        console.error("Failed to fetch selected price list details:", err);
      });
  }, [priceListId]);

  // Fetch doctor pricing rules for search-dropdown resolution
  useEffect(() => {
    if (!selectedDoctor?.id || !currentBranchId) {
      setDoctorPricing(null);
      // Revert to default branch price list
      const defaultList = priceLists.find(l => l.is_default);
      setPriceListId(defaultList ? defaultList.id : null);
      return;
    }
    
    (async () => {
      try {
        const prRes = await doctorApi.getPricing(selectedDoctor.id, currentBranchId);
        let priceListDetails: PriceList | null = null;
        if (prRes.assignment?.price_list_id) {
          const plRes = await priceListApi.getById(prRes.assignment.price_list_id);
          priceListDetails = plRes.data || null;
          // Auto switch to doctor's custom price list
          setPriceListId(prRes.assignment.price_list_id);
        } else {
          // Revert to default branch price list
          const defaultList = priceLists.find(l => l.is_default);
          setPriceListId(defaultList ? defaultList.id : null);
        }
        setDoctorPricing({
          assignment: prRes.assignment,
          overrides: prRes.overrides || [],
          priceListDetails,
        });
      } catch (err) {
        console.error("Failed to load doctor pricing for search resolution:", err);
        setDoctorPricing(null);
        // Fallback to branch default
        const defaultList = priceLists.find(l => l.is_default);
        setPriceListId(defaultList ? defaultList.id : null);
      }
    })();
  }, [selectedDoctor?.id, currentBranchId, priceLists]);

  // Fetch pricing resolution from backend engine when selections or modifiers change
  useEffect(() => {
    if (!currentBranchId) {
      setResolvedPricesFromEngine({});
      return;
    }

    const individualTestIds = selectedTests
      .filter(t => !selectedPackages.some(pkg => pkg.test_ids && Array.isArray(pkg.test_ids) && pkg.test_ids.includes(t.id)))
      .map(t => t.id);

    if (individualTestIds.length === 0) {
      setResolvedPricesFromEngine({});
      return;
    }

    pricingEngineApi.resolve({
      testIds: individualTestIds,
      branchId: currentBranchId,
      doctorId: selectedDoctor?.id || null,
      reportPriceListId: priceListId || null,
    })
    .then(res => {
      setResolvedPricesFromEngine(res);
    })
    .catch(err => {
      console.error("Failed to resolve prices:", err);
    });
  }, [selectedTests, selectedPackages, selectedDoctor?.id, priceListId, currentBranchId]);

  // Map final pricing snapshot items for the report payload and UI display
  const resolvedPricingItems = useMemo(() => {
    const items: Record<string, ReportTestPriceSnapshot> = {};

    // Process individual tests
    selectedTests.forEach(test => {
      const isPartOfePackage = selectedPackages.some(pkg => 
        pkg.test_ids && Array.isArray(pkg.test_ids) && pkg.test_ids.includes(test.id)
      );
      if (isPartOfePackage) return; // Handled by package price

      const testId = test.id;
      const enginePrice = resolvedPricesFromEngine[testId];
      const hasOverride = manualOverrides[testId] !== undefined;
      const overrideVal = manualOverrides[testId];

      if (hasOverride) {
        items[testId] = {
          test_id: testId,
          package_id: null,
          default_price: Number(enginePrice ? enginePrice.default_price : (test.price || 0)),
          applied_price: Number(overrideVal!),
          source: 'manual',
          source_id: null,
          price_list_version: enginePrice ? enginePrice.price_list_version : null,
          is_manual_override: true,
          test_name: test.test_name,
          test_code: test.test_code,
          test_category: test.category,
          calculation: enginePrice ? [...(enginePrice.calculation || []), `Manual Override: ₹${overrideVal}`] : [`Manual Override: ₹${overrideVal}`],
        };
      } else if (enginePrice) {
        items[testId] = {
          ...enginePrice,
          test_id: testId,
          package_id: null,
          default_price: Number(enginePrice.default_price),
          applied_price: Number(enginePrice.applied_price),
          test_name: test.test_name,
          test_code: test.test_code,
          test_category: test.category,
        };
      } else {
        // Fallback default
        items[testId] = {
          test_id: testId,
          package_id: null,
          default_price: Number(test.price || 0),
          applied_price: Number(test.price || 0),
          source: 'default',
          source_id: testId,
          price_list_version: null,
          is_manual_override: false,
          test_name: test.test_name,
          test_code: test.test_code,
          test_category: test.category,
          calculation: [`Default Price: ₹${test.price || 0}`],
        };
      }
    });

    // Process packages
    selectedPackages.forEach(pkg => {
      const pkgId = pkg.id;
      const hasOverride = manualOverrides[pkgId] !== undefined;
      const overrideVal = manualOverrides[pkgId];

      if (hasOverride) {
        items[pkgId] = {
          test_id: null,
          package_id: pkgId,
          default_price: Number(pkg.price || 0),
          applied_price: Number(overrideVal!),
          source: 'manual',
          source_id: pkgId,
          price_list_version: null,
          is_manual_override: true,
          package_name: pkg.package_name,
          package_code: pkg.package_code,
          calculation: [`Package Price: ₹${pkg.price || 0}`, `Manual Override: ₹${overrideVal}`],
        };
      } else {
        items[pkgId] = {
          test_id: null,
          package_id: pkgId,
          default_price: Number(pkg.price || 0),
          applied_price: Number(pkg.price || 0),
          source: 'package',
          source_id: pkgId,
          price_list_version: null,
          is_manual_override: false,
          package_name: pkg.package_name,
          package_code: pkg.package_code,
          calculation: [`Package Price: ₹${pkg.price || 0}`],
        };
      }
    });

    return items;
  }, [selectedTests, selectedPackages, resolvedPricesFromEngine, manualOverrides]);

  // Calculate total price
  const totalPrice = useMemo(() => {
    const sum = Object.values(resolvedPricingItems).reduce((sum, item) => sum + (Number(item.applied_price) || 0), 0);
    return Number(sum) || 0;
  }, [resolvedPricingItems]);

  // Dynamically resolve search result test prices based on selected price list or doctor overrides locally
  const getSearchedTestPrice = (test: Test) => {
    const basePrice = Number(test.price || 0);

    // Step 1: Report-level complete replacement list
    if (priceListId && selectedPriceListDetails) {
      const itemOverride = selectedPriceListDetails.items?.find(it => it.test_id === test.id);
      if (itemOverride) {
        let resolved = basePrice;
        if (itemOverride.price !== null && itemOverride.price !== undefined) {
          resolved = Number(itemOverride.price);
        } else if (itemOverride.discount_type === 'percent') {
          resolved = basePrice * (1 - Number(itemOverride.discount_value || 0) / 100);
        } else if (itemOverride.discount_type === 'amount') {
          resolved = basePrice - Number(itemOverride.discount_value || 0);
        }
        return Math.max(0, Math.round(resolved * 100) / 100);
      }
      return basePrice;
    }

    // Step 2: Doctor pricing
    if (selectedDoctor && doctorPricing) {
      // 2a. Check doctor individual override first (takes priority)
      const docOverride = doctorPricing.overrides.find(o => o.test_id === test.id);
      if (docOverride) {
        return Number(docOverride.price);
      }

      // 2b. Check doctor assigned price list
      if (doctorPricing.priceListDetails) {
        const itemOverride = doctorPricing.priceListDetails.items?.find(it => it.test_id === test.id);
        if (itemOverride) {
          let resolved = basePrice;
          if (itemOverride.price !== null && itemOverride.price !== undefined) {
            resolved = Number(itemOverride.price);
          } else if (itemOverride.discount_type === 'percent') {
            resolved = basePrice * (1 - Number(itemOverride.discount_value || 0) / 100);
          } else if (itemOverride.discount_type === 'amount') {
            resolved = basePrice - Number(itemOverride.discount_value || 0);
          }
          return Math.max(0, Math.round(resolved * 100) / 100);
        }
      }
    }

    return basePrice;
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'default':
        return { label: 'Default', classes: 'bg-muted text-muted-foreground border-border' };
      case 'branch':
        return { label: 'Branch', classes: 'bg-blue-500/10 text-blue-500 border-blue-500/20' };
      case 'doctor_list':
        return { label: 'Doctor List', classes: 'bg-purple-500/10 text-purple-500 border-purple-500/20' };
      case 'doctor_override':
        return { label: 'Doc Override', classes: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' };
      case 'price_list':
        return { label: 'Price List', classes: 'bg-teal-500/10 text-teal-500 border-teal-500/20' };
      case 'manual':
        return { label: 'Manual', classes: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
      case 'package':
        return { label: 'Package', classes: 'bg-green-500/10 text-green-500 border-green-500/20' };
      default:
        return { label: source, classes: 'bg-muted text-muted-foreground border-border' };
    }
  };

  const handlePriceOverride = (id: string, value: string) => {
    const numericValue = value === '' ? undefined : Number(value);
    setManualOverrides(prev => {
      const next = { ...prev };
      if (numericValue === undefined || isNaN(numericValue)) {
        delete next[id];
      } else {
        next[id] = Math.max(0, numericValue);
      }
      return next;
    });
  };
  const shouldScrollSelectedTests = selectedTests.length > 3;

  const patientAgeMax = getAgeMax(patientAgeUnit);

  // Handle patient selection
  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setPatientSearch(patient.name || '');
    setPatientName(patient.name || '');
    setPatientAge(patient.age != null ? String(patient.age) : '');
    setPatientAgeUnit(normalizeAgeUnit(patient.age_unit));
    setPatientGender(patient.gender as "Male" | "Female" || 'Male');
    setPatientPhone(patient.phone || '');
    setPatientAddress(patient.address || '');
    setShowPatientDropdown(false);
    setActivePatientIndex(0);
    setIsNewPatient(false);
    window.requestAnimationFrame(() => {
      patientSearchInputRef.current?.focus();
    });
  };

  useEffect(() => {
    const routeState = location.state as { patient?: Patient } | null;
    if (!routeState?.patient) return;
    handleSelectPatient(routeState.patient);
  }, [location.state]);

  // Handle create new patient mode
  const handleCreateNewPatient = () => {
    setIsNewPatient(true);
    setSelectedPatient(null);
    const capitalizedName = patientSearch.trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    setPatientName(capitalizedName);
    setPatientAge('');
    setPatientAgeUnit(DEFAULT_AGE_UNIT);
    setPatientGender('Male');
    setPatientPhone('');
    setPatientAddress('');
    setShowPatientDropdown(false);
    setActivePatientIndex(0);
  };

  const handlePatientSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!showPatientDropdown) {
        setShowPatientDropdown(true);
        return;
      }

      if (filteredPatients.length > 0) {
        setActivePatientIndex((currentIndex) => (currentIndex + 1) % filteredPatients.length);
      }
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!showPatientDropdown) {
        setShowPatientDropdown(true);
        return;
      }

      if (filteredPatients.length > 0) {
        setActivePatientIndex((currentIndex) =>
          currentIndex === 0 ? filteredPatients.length - 1 : currentIndex - 1
        );
      }
      return;
    }

    if (event.key === 'Enter') {
      if (filteredPatients.length > 0) {
        event.preventDefault();
        const patientToSelect = filteredPatients[activePatientIndex] ?? filteredPatients[0];
        if (patientToSelect) {
          handleSelectPatient(patientToSelect);
        }
        return;
      }

      if (patientSearch.trim()) {
        event.preventDefault();
        handleCreateNewPatient();
      }
      return;
    }

    if (event.key === 'Escape') {
      setShowPatientDropdown(false);
    }
  };

  const handleSelectDoctor = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setReferringDoctorName("");
    setDoctorSearch(`${doctor.title || 'Dr'}. ${doctor.name}`);
    setShowDoctorDropdown(false);
    setActiveDoctorIndex(0);
  };

  const handleClearDoctor = () => {
    isClearingDoctorRef.current = true;
    setSelectedDoctor(null);
    setReferringDoctorName("");
    setDoctorSearch("");
    setShowDoctorDropdown(true);
    setActiveDoctorIndex(0);
    setTimeout(() => {
      doctorSearchInputRef.current?.focus();
      isClearingDoctorRef.current = false;
    }, 50);
  };

  const handleSelectSelf = () => {
    setSelectedDoctor(null);
    setReferringDoctorName("");
    setDoctorSearch("Self (No Doctor)");
    setShowDoctorDropdown(false);
    setActiveDoctorIndex(0);
  };

  // Handle blur on doctor search — if text was typed but no doctor selected, use as referring_doctor_name
  const handleDoctorBlur = () => {
    setTimeout(() => {
      if (isClearingDoctorRef.current) return;
      const trimmed = doctorSearch.trim();
      const isSelf = trimmed.toLowerCase() === 'self' || trimmed === 'Self (No Doctor)';
      if (!selectedDoctor && trimmed && !isSelf) {
        const capitalizedName = trimmed
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        setReferringDoctorName(capitalizedName);
        setDoctorSearch(capitalizedName);
      } else if (!selectedDoctor && (isSelf || !trimmed)) {
        setReferringDoctorName("");
        setDoctorSearch("Self (No Doctor)");
      }
      setShowDoctorDropdown(false);
    }, 200);
  };

  const handleDoctorSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      event.stopPropagation();
      if (!showDoctorDropdown) {
        setShowDoctorDropdown(true);
        return;
      }
      if (doctorDropdownOptions.length > 0) {
        setActiveDoctorIndex((currentIndex) => (currentIndex + 1) % doctorDropdownOptions.length);
      }
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      event.stopPropagation();
      if (!showDoctorDropdown) {
        setShowDoctorDropdown(true);
        return;
      }
      if (doctorDropdownOptions.length > 0) {
        setActiveDoctorIndex((currentIndex) =>
          currentIndex === 0 ? doctorDropdownOptions.length - 1 : currentIndex - 1
        );
      }
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();
      if (doctorDropdownOptions.length > 0 && showDoctorDropdown) {
        const opt = doctorDropdownOptions[activeDoctorIndex] ?? doctorDropdownOptions[0];
        if (opt) {
          if (opt.type === 'self') {
            handleSelectSelf();
          } else {
            handleSelectDoctor(opt.data);
          }
        }
        return;
      }

      // Typed text becomes referring_doctor_name
      if (doctorSearch.trim()) {
        const capitalizedName = doctorSearch.trim()
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        setReferringDoctorName(capitalizedName);
        setDoctorSearch(capitalizedName);
        setShowDoctorDropdown(false);
      }
      return;
    }

    if (event.key === 'Escape') {
      setShowDoctorDropdown(false);
    }
  };

  // Handle package selection
  const handleSelectPackage = (pkg: any) => {
    setSelectedPackages([...selectedPackages, pkg]);
    
    // Add all tests in the package's test_ids array to selectedTests (avoiding duplicates)
    const newTests = [...selectedTests];
    const updatedIndividual = new Set(individuallySelectedTestIds);
    
    if (pkg.test_ids && Array.isArray(pkg.test_ids)) {
      pkg.test_ids.forEach((testId: string) => {
        const testObj = tests.find(t => t.id === testId);
        if (testObj) {
          if (!newTests.some(t => t.id === testId)) {
            newTests.push(testObj);
          }
          if (updatedIndividual.has(testId)) {
            updatedIndividual.delete(testId);
            toast.warning(`${testObj.test_name} moved to ${pkg.package_name}`);
            setManualOverrides(prev => {
              const next = { ...prev };
              delete next[testId];
              return next;
            });
          }
        }
      });
    }
    setSelectedTests(newTests);
    setIndividuallySelectedTestIds(updatedIndividual);
    
    setTestSearch("");
    setShowTestDropdown(false);
    setActiveTestIndex(0);
    window.requestAnimationFrame(() => {
      testSearchInputRef.current?.focus();
    });
  };

  // Handle package removal
  const handleRemovePackage = (pkgId: string) => {
    const updatedPackages = selectedPackages.filter(p => p.id !== pkgId);
    setSelectedPackages(updatedPackages);
    setManualOverrides(prev => {
      const next = { ...prev };
      delete next[pkgId];
      return next;
    });

    // Filter out tests that belong to the package being removed,
    // unless they are individually selected, or belong to another selected package.
    const testsToKeep = selectedTests.filter(test => {
      // Keep if individually selected
      if (individuallySelectedTestIds.has(test.id)) return true;
      // Keep if belongs to any of the remaining selected packages
      const belongsToOtherPackage = updatedPackages.some(p => 
        p.test_ids && Array.isArray(p.test_ids) && p.test_ids.includes(test.id)
      );
      return belongsToOtherPackage;
    });
    setSelectedTests(testsToKeep);
  };

  // Handle test selection
  const handleSelectTest = (test: Test) => {
    // Check if test is already inside any selected package
    const containingPackage = selectedPackages.find(pkg => 
      pkg.test_ids && Array.isArray(pkg.test_ids) && pkg.test_ids.includes(test.id)
    );
    if (containingPackage) {
      toast.warning(`${test.test_name} is already included in ${containingPackage.package_name}`);
      return;
    }

    if (!selectedTests.some(t => t.id === test.id)) {
      setSelectedTests([...selectedTests, test]);
    }
    const updatedIndividual = new Set(individuallySelectedTestIds);
    updatedIndividual.add(test.id);
    setIndividuallySelectedTestIds(updatedIndividual);

    setTestSearch("");
    setShowTestDropdown(false);
    setActiveTestIndex(0);
    window.requestAnimationFrame(() => {
      testSearchInputRef.current?.focus();
    });
  };

  const handleTestSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!showTestDropdown) {
        setShowTestDropdown(true);
        return;
      }
      if (searchResults.length > 0) {
        setActiveTestIndex((currentIndex) => (currentIndex + 1) % searchResults.length);
      }
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!showTestDropdown) {
        setShowTestDropdown(true);
        return;
      }
      if (searchResults.length > 0) {
        setActiveTestIndex((currentIndex) =>
          currentIndex === 0 ? searchResults.length - 1 : currentIndex - 1
        );
      }
      return;
    }

    if (event.key === 'Enter') {
      if (searchResults.length === 0) {
        return;
      }
      event.preventDefault();
      const itemToSelect = searchResults[activeTestIndex] ?? searchResults[0];
      if (itemToSelect) {
        if (itemToSelect.type === 'package') {
          handleSelectPackage(itemToSelect.data);
        } else {
          handleSelectTest(itemToSelect.data);
        }
      }
      return;
    }

    if (event.key === 'Escape') {
      setShowTestDropdown(false);
    }
  };

  // Handle test removal
  const handleRemoveTest = (testId: string) => {
    setSelectedTests(selectedTests.filter((t) => t.id !== testId));
    // Also remove from individuallySelectedTestIds if it was there
    const updatedIndividual = new Set(individuallySelectedTestIds);
    updatedIndividual.delete(testId);
    setIndividuallySelectedTestIds(updatedIndividual);

    // Clear manual override
    setManualOverrides(prev => {
      const next = { ...prev };
      delete next[testId];
      return next;
    });
  };

  // Handle form submission
  const handleCreateReport = async () => {
    setFormError(null);

    // Validation
    if (!patientName.trim()) {
      setFormError("Please enter patient name");
      return;
    }
    if (!patientAge.trim()) {
      setFormError("Please enter patient age");
      return;
    }
    if (!patientGender) {
      setFormError("Please select patient gender");
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
          phone: patientPhone || "",
          gender: patientGender,
          age: patientAge ? parseInt(patientAge, 10) : undefined,
          age_unit: patientAge ? patientAgeUnit : undefined,
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
      const reportTypeString = [
        ...selectedPackages.map(p => p.package_name),
        ...selectedTests
          .filter(t => !selectedPackages.some(p => p.test_ids && Array.isArray(p.test_ids) && p.test_ids.includes(t.id)))
          .map(t => t.test_name)
      ].join(', ');

      const report = await createReport({
        patient_id: patientId,
        doctor_id: selectedDoctor?.id || undefined,
        staff_id: selectedStaffId || undefined,
        referring_doctor_name: !selectedDoctor && referringDoctorName ? referringDoctorName : undefined,
        report_type: reportTypeString || selectedTests.map(t => t.test_name).join(', '),
        report_amount: totalPrice,
        is_self_report: !selectedDoctor && !referringDoctorName,
        branch_id: currentBranchId,
        base_amount: Object.values(resolvedPricingItems).reduce((sum, item) => sum + (Number(item.default_price) || 0), 0),
        final_amount: totalPrice,
        test_data: {
          testType: selectedTests.map(t => t.category || 'General').join(', '),
          testName: selectedTests.map(t => t.test_name).join(', '),
          testIds: selectedTests.map(t => t.id),
          parameters: [],
          remarks: '',
        },
        b2b_lab_id: isB2B && selectedB2BLabId ? selectedB2BLabId : undefined,
        b2b_charge: isB2B && b2bCharge ? parseFloat(b2bCharge) : undefined,
        delivery_preferences: {
          patient_whatsapp: sendWhatsAppPatient && !!patientPhone,
          doctor_whatsapp: sendWhatsAppDoctor && !!selectedDoctor?.phone,
        },
        price_list_id: priceListId || undefined,
        pricing_items: Object.values(resolvedPricingItems),
      });

      if (!report) {
        setFormError(reportError || "Failed to create report");
        setIsSubmitting(false);
        return;
      }

      // Reset the reports page date filter to today/current date
      sessionStorage.removeItem('diagnopro_reports_date_filter');

      // Navigate to report entry page
      if (report.id) {
        navigate(`/reports/${report.id}/entry`);
      } else {
        // Defensive fallback if API response is malformed
        navigate('/reports/entry', {
          state: {
            patient: selectedPatient || undefined,
            testName: reportTypeString || selectedTests.map(t => t.test_name).join(', '),
            reportAmount: totalPrice,
          },
        });
      }
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
      if (
        doctorSearchRef.current &&
        !doctorSearchRef.current.contains(event.target as Node)
      ) {
        setShowDoctorDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Listen for F10 keypress globally to trigger report creation
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F10') {
        e.preventDefault();
        if (!isSubmitting && selectedTests.length > 0) {
          handleCreateReport();
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isSubmitting, selectedTests, handleCreateReport]);

  const handleFormNavigation = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
      const target = e.target as HTMLElement;
      if (
        target === patientSearchInputRef.current ||
        target === testSearchInputRef.current ||
        target === doctorSearchInputRef.current
      ) return;
      if (target.tagName === 'SELECT' && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) return;

      const focusable = Array.from(document.querySelectorAll(
        'input:not([disabled]):not([readonly]), select:not([disabled]):not([readonly]), button:not([disabled]):not([readonly])'
      )) as HTMLElement[];

      const index = focusable.indexOf(target);
      if (index > -1) {
        let nextIndex = index;
        if (e.key === 'ArrowDown' || e.key === 'Enter') nextIndex++;
        if (e.key === 'ArrowUp') nextIndex--;

        if (nextIndex >= 0 && nextIndex < focusable.length) {
          e.preventDefault();
          focusable[nextIndex].focus();
        }
      }
    }
  };

  return (
    <div className="space-y-2 md:space-y-3" onKeyDown={handleFormNavigation}>
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
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

              <div>
                <label className="text-xs text-muted-foreground block mb-0.5">
                  Report Price List <span className="text-[10px] text-muted-foreground">(Optional - overrides doctor)</span>
                </label>
                <select
                  className="w-full h-9 px-2.5 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary text-xs"
                  value={priceListId || ""}
                  onChange={(e) => setPriceListId(e.target.value || null)}
                >
                  <option value="">No Price List (Use Doctor/Branch/Global)</option>
                  {priceLists.map((list) => (
                    <option key={list.id} value={list.id}>
                      {list.name} (v{list.version})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-2 items-stretch">
          {/* Patient Information Section */}
          <div className="bg-card border border-border rounded h-full flex flex-col">
            <div className="px-3 py-1.5 border-b border-border bg-secondary/30">
              <h2 className="text-sm text-foreground flex items-center gap-2">
                <User className="w-3.5 h-3.5" />
                Patient Information
              </h2>
            </div>
            <div className="p-2 space-y-2 flex-1">
              {/* Patient Search */}
              <div className="relative" ref={patientSearchRef}>
                <label className="text-xs text-muted-foreground block mb-0.5">
                  Search Patient
                </label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground w-3.5 h-3.5" />
                  <input
                    ref={patientSearchInputRef}
                    type="text"
                    placeholder="Search by name, mobile, or patient ID..."
                    className="w-full h-9 pl-8 pr-3 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    value={patientSearch}
                    onChange={(e) => {
                      setPatientSearch(e.target.value);
                      setShowPatientDropdown(true);
                      setActivePatientIndex(0);
                      if (e.target.value.length >= 2) {
                        fetchPatients({ search: e.target.value });
                      }
                    }}
                    onFocus={() => setShowPatientDropdown(true)}
                    onKeyDown={handlePatientSearchKeyDown}
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
                        {filteredPatients.map((patient, index) => (
                          <button
                            key={patient.id}
                            onClick={() => handleSelectPatient(patient)}
                            onMouseEnter={() => setActivePatientIndex(index)}
                            className={`w-full px-3 py-2.5 text-left transition-colors border-b border-border last:border-0 ${index === activePatientIndex ? 'bg-accent' : 'hover:bg-accent'
                              }`}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="text-sm text-foreground font-medium">
                                  {patient.name}
                                </div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  {patient.id.slice(0, 8)} • {formatAge(patient.age, patient.age_unit)} {patient.gender?.charAt(0) || ''} • {patient.phone || '-'}
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

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                <div className="border border-border rounded p-2 space-y-1.5">
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Required Details</div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-0.5">
                      Patient Name <span className="text-destructive">*</span>
                    </label>
                    <input
                      ref={patientNameInputRef}
                      type="text"
                      className="w-full h-8 px-2.5 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      value={patientName}
                      onChange={(e) => {
                        const val = e.target.value;
                        const capitalized = val
                          .split(' ')
                          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(' ');
                        setPatientName(capitalized);
                        const lower = val.toLowerCase().trim();
                        const femaleRegex = /\b\w*(ben|kumari|baa|ba|devi|kaur|wati|bai)\b/i;
                        const maleRegex = /\b\w*(bhai|kumar|singh|ram|ji|lal|prasad|rao|sing|sinh)\b/i;
                        if (femaleRegex.test(lower)) {
                          setPatientGender('Female');
                        } else if (maleRegex.test(lower)) {
                          setPatientGender('Male');
                        }
                      }}
                      placeholder="Full name"
                      disabled={!isNewPatient && !!selectedPatient}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-0.5">
                      Age <span className="text-destructive">*</span>
                    </label>
                    <div className="grid grid-cols-[minmax(0,1fr)_110px] gap-1.5">
                      <input
                        type="number"
                        min="0"
                        max={patientAgeMax}
                        className="w-full h-8 px-2.5 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        value={patientAge}
                        onChange={(e) => setPatientAge(e.target.value)}
                        onKeyDown={(e) => {
                          const key = e.key.toLowerCase();
                          if (key === 'y') {
                            e.preventDefault();
                            setPatientAgeUnit('years');
                          } else if (key === 'm') {
                            e.preventDefault();
                            setPatientAgeUnit('months');
                          } else if (key === 'd') {
                            e.preventDefault();
                            setPatientAgeUnit('days');
                          }
                        }}
                        placeholder="Age"
                        disabled={!isNewPatient && !!selectedPatient}
                      />
                      <select
                        className="w-full h-8 px-2.5 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        value={patientAgeUnit}
                        onChange={(e) => setPatientAgeUnit(e.target.value as AgeUnit)}
                        disabled={!isNewPatient && !!selectedPatient}
                      >
                        <option value="years">Years</option>
                        <option value="months">Months</option>
                        <option value="days">Days</option>
                      </select>
                    </div>
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
                  <div className="relative" ref={doctorSearchRef}>
                    <label className="text-xs text-muted-foreground block mb-0.5">
                      Referring Doctor
                    </label>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground w-3 h-3" />
                      <input
                        ref={doctorSearchInputRef}
                        type="text"
                        placeholder="Search or type doctor name..."
                        className="w-full h-8 pl-7 pr-8 bg-background border border-border rounded text-[11px] focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
                        value={doctorSearch}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDoctorSearch(val);
                          if (selectedDoctor) {
                            setSelectedDoctor(null);
                            setReferringDoctorName("");
                          }
                          setShowDoctorDropdown(true);
                          setActiveDoctorIndex(0);
                        }}
                        onFocus={() => setShowDoctorDropdown(true)}
                        onBlur={handleDoctorBlur}
                        onKeyDown={handleDoctorSearchKeyDown}
                      />
                      {doctorSearch && (
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={handleClearDoctor}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors focus:outline-none"
                          title="Clear doctor"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Doctor Dropdown */}
                    {showDoctorDropdown && doctorDropdownOptions.length > 0 && (
                      <div
                        onMouseDown={(e) => e.preventDefault()}
                        className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded shadow-lg max-h-56 overflow-y-auto z-50"
                      >
                        {doctorDropdownOptions.map((opt, index) => {
                          const isActive = index === activeDoctorIndex;
                          if (opt.type === 'self') {
                            return (
                              <button
                                key="self-option"
                                type="button"
                                onClick={handleSelectSelf}
                                onMouseEnter={() => setActiveDoctorIndex(index)}
                                className={`w-full px-3 py-2 text-left transition-colors border-b border-border text-[11px] ${
                                  isActive ? 'bg-accent text-accent-foreground font-medium' : 'hover:bg-accent text-muted-foreground'
                                }`}
                              >
                                Self (No Doctor)
                              </button>
                            );
                          } else {
                            const doc = opt.data;
                            return (
                              <button
                                key={doc.id}
                                type="button"
                                onClick={() => handleSelectDoctor(doc)}
                                onMouseEnter={() => setActiveDoctorIndex(index)}
                                className={`w-full px-3 py-2 text-left transition-colors border-b border-border last:border-0 text-[11px] ${
                                  isActive ? 'bg-accent text-accent-foreground' : 'hover:bg-accent'
                                }`}
                              >
                                <div className="font-medium text-foreground">
                                  {doc.title || 'Dr'}. {doc.name}
                                </div>
                                {doc.specialization || doc.phone ? (
                                  <div className="text-[9px] text-muted-foreground mt-0.5">
                                    {doc.specialization} {doc.specialization && doc.phone ? '•' : ''} {doc.phone}
                                  </div>
                                ) : null}
                              </button>
                            );
                          }
                        })}
                      </div>
                    )}
                    {/* Indicator showing what will be saved */}
                    {!selectedDoctor && referringDoctorName && (
                      <div className="text-[9px] text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Stethoscope className="w-2.5 h-2.5" />
                        Ref. Doctor: {referringDoctorName}
                      </div>
                    )}
                  </div>
                </div>

                <div className="border border-border rounded p-2 space-y-1.5">
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Optional Details</div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-0.5">
                      Mobile Number
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
                  <div>
                    <label className="text-xs text-muted-foreground block mb-0.5">
                      Sample Collected By (Staff)
                    </label>
                    <select
                      className="w-full h-8 px-2.5 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      value={selectedStaffId}
                      onChange={(e) => setSelectedStaffId(e.target.value)}
                    >
                      <option value="">Select staff (optional)</option>
                      {staffList.map((staff) => (
                        <option key={staff.id} value={staff.id}>
                          {staff.firstname} {staff.lastname} ({staff.role})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
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
                </div>
              </div>

              {/* WhatsApp Auto-Send Preferences */}
              <div className="border border-border rounded p-2.5 space-y-2 bg-secondary/10">
                <div className="text-[11px] uppercase tracking-wide font-medium text-foreground flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-primary" />
                  <span>WhatsApp Delivery Preferences</span>
                </div>
                
                <div className="space-y-2">
                  <label className={`flex items-start gap-2.5 text-xs ${!patientPhone ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                    <input
                      type="checkbox"
                      checked={sendWhatsAppPatient && !!patientPhone}
                      onChange={(e) => setSendWhatsAppPatient(e.target.checked)}
                      disabled={!patientPhone}
                      className="mt-0.5 rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                    />
                    <div>
                      <span className="font-medium text-foreground">Send to Patient via WhatsApp on Approval</span>
                      <span className="block text-[10px] text-muted-foreground">
                        {patientPhone ? `Sends PDF to ${patientPhone}` : 'Please enter a mobile number to enable'}
                      </span>
                    </div>
                  </label>

                  {selectedDoctor && (
                    <label className={`flex items-start gap-2.5 text-xs ${!selectedDoctor.phone ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                      <input
                        type="checkbox"
                        checked={sendWhatsAppDoctor && !!selectedDoctor.phone}
                        onChange={(e) => setSendWhatsAppDoctor(e.target.checked)}
                        disabled={!selectedDoctor.phone}
                        className="mt-0.5 rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                      />
                      <div>
                        <span className="font-medium text-foreground">Send to Referring Doctor via WhatsApp on Approval</span>
                        <span className="block text-[10px] text-muted-foreground">
                          {selectedDoctor.phone ? `Sends PDF to Dr. ${selectedDoctor.name} (${selectedDoctor.phone})` : 'Doctor does not have a phone number registered'}
                        </span>
                      </div>
                    </label>
                  )}
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

          {/* Test + B2B Combined Section */}
          <div className="bg-card border border-border rounded h-full flex flex-col">
            <div className="px-3 py-1.5 border-b border-border bg-secondary/30">
              <h2 className="text-sm text-foreground flex items-center gap-2">
                <Beaker className="w-3.5 h-3.5" />
                Test & B2B Management
              </h2>
            </div>

            <div className="p-2 space-y-2 flex-1">
              {/* Test Search */}
              <div className="relative" ref={testSearchRef}>
                <label className="text-xs text-muted-foreground block mb-0.5">
                  Search and Add Tests <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground w-3.5 h-3.5" />
                  <input
                    ref={testSearchInputRef}
                    type="text"
                    placeholder="Search tests by name or category..."
                    className="w-full h-9 pl-8 pr-3 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    value={testSearch}
                    onChange={(e) => {
                      setTestSearch(e.target.value);
                      setShowTestDropdown(true);
                      setActiveTestIndex(0);
                    }}
                    onFocus={() => setShowTestDropdown(true)}
                      onKeyDown={handleTestSearchKeyDown}
                  />
                  {testsLoading && (
                    <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-muted-foreground" />
                  )}
                </div>

                {/* Test & Package Dropdown */}
                {showTestDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded shadow-lg max-h-64 overflow-auto z-10">
                    {packagesLoading && (
                      <div className="px-3 py-2 text-xs text-muted-foreground flex items-center gap-2 border-b border-border">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Loading packages...
                      </div>
                    )}
                    {searchResults.length > 0 ? (
                      searchResults.map((item, index) => {
                        const showHeader = index === 0 || searchResults[index].type !== searchResults[index - 1].type;
                        return (
                          <div key={`${item.type}-${item.data.id}`}>
                            {showHeader && (
                              <div className="px-3 py-1 bg-secondary text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border/50">
                                {item.type === 'package' ? 'Packages' : 'Individual Tests'}
                              </div>
                            )}
                            <button
                              onClick={() => item.type === 'package' ? handleSelectPackage(item.data) : handleSelectTest(item.data)}
                              onMouseEnter={() => setActiveTestIndex(index)}
                              className={`w-full px-3 py-2.5 text-left transition-colors border-b border-border last:border-0 ${
                                index === activeTestIndex ? 'bg-accent font-medium' : 'hover:bg-accent'
                              }`}
                            >
                              {item.type === 'package' ? (
                                <div className="flex items-start justify-between">
                                  <div>
                                    <div className="text-sm text-foreground font-semibold flex items-center gap-1.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                      {item.data.package_name}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-0.5 pl-3">
                                      {item.data.category || 'General'} • {item.data.package_code} • {item.data.test_ids?.length || 0} tests included
                                    </div>
                                  </div>
                                  <div className="text-xs text-foreground font-semibold">
                                    ₹{Number(item.data.price) || 0}
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-start justify-between">
                                  <div>
                                    <div className="text-sm text-foreground">
                                      {item.data.test_name}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-0.5">
                                      {item.data.category || 'General'} • {item.data.test_code}
                                    </div>
                                  </div>
                                  <div className="text-xs text-foreground font-semibold">
                                    ₹{getSearchedTestPrice(item.data)}
                                  </div>
                                </div>
                              )}
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                        {testSearch ? "No tests or packages found" : "Type to search tests or packages. Use arrow keys and Enter to add."}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Selected Packages */}
              {selectedPackages.length > 0 && (
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground block mb-0.5">
                    Selected Packages ({selectedPackages.length})
                  </label>
                  <div className="space-y-1">
                    {selectedPackages.map((pkg) => {
                      const itemSnapshot = resolvedPricingItems[pkg.id];
                      const resolvedPriceVal = itemSnapshot ? itemSnapshot.applied_price : (pkg.price || 0);
                      const isOverridden = manualOverrides[pkg.id] !== undefined;
                      const badgeInfo = getSourceBadge(itemSnapshot?.source || 'package');
                      const trace = itemSnapshot?.calculation || [];

                      return (
                        <div
                          key={pkg.id}
                          className="flex items-center justify-between px-3 py-2 bg-primary/5 border border-primary/20 rounded gap-2"
                        >
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-primary">
                              {pkg.package_name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {pkg.package_code} • {pkg.test_ids?.length || 0} tests included
                            </div>
                          </div>
                          
                          {/* Pricing Details */}
                          <div className="flex items-center gap-2">
                            {/* Source Badge with trace tooltip */}
                            <div className="relative group flex items-center">
                              <span className={`text-[10px] font-medium border px-1.5 py-0.5 rounded cursor-help flex items-center gap-1 ${badgeInfo.classes}`}>
                                {badgeInfo.label}
                                <Info className="w-3 h-3" />
                              </span>
                              
                              {/* Hover Tooltip */}
                              {trace.length > 0 && (
                                <div className="absolute right-0 bottom-full mb-1.5 hidden group-hover:block z-50 bg-popover text-popover-foreground text-[10px] p-2 rounded shadow-md border border-border min-w-[200px] pointer-events-none">
                                  <div className="font-semibold mb-1 border-b border-border/50 pb-0.5">Price Trace:</div>
                                  <div className="space-y-0.5">
                                    {trace.map((step, idx) => (
                                      <div key={idx} className="flex items-center gap-1">
                                        <span className="text-muted-foreground">{idx + 1}.</span>
                                        <span>{step}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Applied price override input */}
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-muted-foreground">₹</span>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={isOverridden ? manualOverrides[pkg.id] : ""}
                                placeholder={String(resolvedPriceVal)}
                                onChange={(e) => handlePriceOverride(pkg.id, e.target.value)}
                                className="w-16 h-7 px-1.5 text-right bg-background border border-primary/20 rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-medium text-primary"
                                title="Enter custom price to override (clear to revert)"
                              />
                            </div>

                            <button
                              onClick={() => handleRemovePackage(pkg.id)}
                              className="w-6 h-6 flex items-center justify-center rounded hover:bg-destructive/10 transition-colors text-destructive"
                              title="Remove package"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Selected Tests */}
              {selectedTests.length > 0 && (
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground block mb-0.5">
                    Selected Tests ({selectedTests.length})
                  </label>
                  <div className={shouldScrollSelectedTests ? "space-y-1 max-h-56 overflow-y-auto pr-1" : "space-y-1"}>
                    {selectedTests.map((test) => {
                      const isTestInPackage = (testId: string) => {
                        return selectedPackages.some(pkg => 
                          pkg.test_ids && Array.isArray(pkg.test_ids) && pkg.test_ids.includes(testId)
                        );
                      };
                      const inPackage = isTestInPackage(test.id);
                      
                      const itemSnapshot = resolvedPricingItems[test.id];
                      const resolvedPriceVal = itemSnapshot ? itemSnapshot.applied_price : (test.price || 0);
                      const isOverridden = manualOverrides[test.id] !== undefined;
                      const badgeInfo = getSourceBadge(itemSnapshot?.source || 'default');
                      const trace = itemSnapshot?.calculation || [];

                      return (
                        <div
                          key={test.id}
                          className="flex items-center justify-between px-3 py-2 bg-secondary/50 border border-border rounded gap-2"
                        >
                          <div className="flex-1">
                            <div className="text-sm text-foreground font-medium">
                              {test.test_name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {test.category || 'General'}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {inPackage ? (
                              <>
                                <span className="text-xs text-muted-foreground line-through">
                                  ₹{Number(test.price) || 0}
                                </span>
                                <span className="text-[10px] text-primary font-medium bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded">
                                  Package
                                </span>
                              </>
                            ) : (
                              <>
                                {/* Source Badge with trace tooltip */}
                                <div className="relative group flex items-center">
                                  <span className={`text-[10px] font-medium border px-1.5 py-0.5 rounded cursor-help flex items-center gap-1 ${badgeInfo.classes}`}>
                                    {badgeInfo.label}
                                    <Info className="w-3 h-3" />
                                  </span>
                                  
                                  {/* Hover Tooltip */}
                                  {trace.length > 0 && (
                                    <div className="absolute right-0 bottom-full mb-1.5 hidden group-hover:block z-50 bg-popover text-popover-foreground text-[10px] p-2 rounded shadow-md border border-border min-w-[200px] pointer-events-none">
                                      <div className="font-semibold mb-1 border-b border-border/50 pb-0.5">Price Trace:</div>
                                      <div className="space-y-0.5">
                                        {trace.map((step, idx) => (
                                          <div key={idx} className="flex items-center gap-1">
                                            <span className="text-muted-foreground">{idx + 1}.</span>
                                            <span>{step}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Applied price override input */}
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-muted-foreground">₹</span>
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={isOverridden ? manualOverrides[test.id] : ""}
                                    placeholder={String(resolvedPriceVal)}
                                    onChange={(e) => handlePriceOverride(test.id, e.target.value)}
                                    className="w-16 h-7 px-1.5 text-right bg-background border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-medium text-foreground"
                                    title="Enter custom price to override (clear to revert)"
                                  />
                                </div>
                              </>
                            )}

                            <button
                              onClick={() => handleRemoveTest(test.id)}
                              className="w-6 h-6 flex items-center justify-center rounded hover:bg-destructive/10 transition-colors text-destructive"
                              title="Remove test"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {shouldScrollSelectedTests && (
                    <div className="text-[11px] text-muted-foreground">4 or more tests selected. Scroll to view all.</div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between px-3 py-2 bg-primary/5 border border-primary/20 rounded">
                <span className="text-sm text-foreground font-medium">
                  Total Amount
                </span>
                <span className="text-sm text-foreground font-bold">
                  ₹{Number(totalPrice).toFixed(2)}
                </span>
              </div>

              <div className="border-t border-border pt-2 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    B2B Partner Lab
                  </h3>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-xs text-muted-foreground">
                      B2B {isB2B ? 'On' : 'Off'}
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
                      className={`relative w-9 h-5 rounded-full transition-colors ${isB2B ? 'bg-primary' : 'bg-border'
                        }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${isB2B ? 'translate-x-4' : 'translate-x-0'
                          }`}
                      />
                    </button>
                  </label>
                </div>
                {isB2B ? (
                  <>
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
                    {selectedB2BLabId && b2bCharge && Number(totalPrice) > 0 && (
                      <div className="mt-1.5 px-3 py-2 bg-primary/5 border border-primary/20 rounded">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Report Total</span>
                          <span className="text-foreground tabular-nums">₹{Number(totalPrice).toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs mt-0.5">
                          <span className="text-muted-foreground">B2B Charge</span>
                          <span className="text-destructive tabular-nums">-₹{parseFloat(b2bCharge).toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs mt-0.5 pt-1 border-t border-border">
                          <span className="text-foreground font-medium">Net Lab Income</span>
                          <span className="text-foreground font-medium tabular-nums">
                            ₹{Math.max(0, Number(totalPrice) - parseFloat(b2bCharge)).toFixed(2)}
                          </span>
                        </div>
                        {selectedDoctor && (
                          <div className="flex items-center justify-between text-xs mt-0.5">
                            <span className="text-muted-foreground">
                              Commission ({selectedDoctor.commission_percentage || 0}% on net)
                            </span>
                            <span className="text-warning tabular-nums">
                              ₹{(Math.max(0, Number(totalPrice) - parseFloat(b2bCharge)) * (selectedDoctor.commission_percentage || 0) / 100).toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-xs text-muted-foreground px-2.5 py-2 bg-secondary/40 border border-border rounded">
                    Enable B2B from the toggle above to assign partner lab and charge.
                  </div>
                )}
              </div>
            </div>
          </div>
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
                Create Report & Continue to Entry [F10]
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}