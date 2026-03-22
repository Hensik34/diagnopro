import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { 
  ArrowLeft,
  Edit,
  Save,
  Phone,
  Mail,
  Building2,
  DollarSign,
  Percent,
  Stethoscope,
  TrendingUp,
  FileText,
  Check,
  X
} from 'lucide-react';

interface TestPricing {
  testId: string;
  testName: string;
  category: string;
  defaultPrice: number;
  doctorPrice: number;
  discount: number; // calculated
  useCustomPricing: boolean;
}

const MOCK_DOCTOR = {
  id: 'DOC-001',
  name: 'Dr. Michael Thompson',
  phone: '+1 (555) 201-3001',
  email: 'michael.thompson@clinic.com',
  specialization: 'General Physician',
  commission: 15,
  totalRevenue: 125400,
  branch: 'Central Lab - Downtown',
  totalReports: 342,
};

const MOCK_TEST_PRICING: TestPricing[] = [
  { testId: 'CBC', testName: 'Complete Blood Count (CBC)', category: 'Hematology', defaultPrice: 25, doctorPrice: 22, discount: 12, useCustomPricing: true },
  { testId: 'LIPID', testName: 'Lipid Profile', category: 'Biochemistry', defaultPrice: 35, doctorPrice: 35, discount: 0, useCustomPricing: false },
  { testId: 'THYROID', testName: 'Thyroid Profile (T3, T4, TSH)', category: 'Hormone', defaultPrice: 45, doctorPrice: 40, discount: 11.1, useCustomPricing: true },
  { testId: 'LFT', testName: 'Liver Function Test (LFT)', category: 'Biochemistry', defaultPrice: 40, doctorPrice: 36, discount: 10, useCustomPricing: true },
  { testId: 'KFT', testName: 'Kidney Function Test (KFT)', category: 'Biochemistry', defaultPrice: 38, doctorPrice: 38, discount: 0, useCustomPricing: false },
  { testId: 'GLUCOSE', testName: 'Fasting Blood Glucose', category: 'Biochemistry', defaultPrice: 15, doctorPrice: 15, discount: 0, useCustomPricing: false },
  { testId: 'HBA1C', testName: 'HbA1c (Glycated Hemoglobin)', category: 'Diabetes', defaultPrice: 30, doctorPrice: 27, discount: 10, useCustomPricing: true },
  { testId: 'URINE', testName: 'Complete Urine Analysis', category: 'Clinical Pathology', defaultPrice: 20, doctorPrice: 18, discount: 10, useCustomPricing: true },
];

export function DoctorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [testPricing, setTestPricing] = useState(MOCK_TEST_PRICING);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTestId, setEditingTestId] = useState<string | null>(null);

  const handleToggleCustomPricing = (testId: string) => {
    setTestPricing(prev => prev.map(test => {
      if (test.testId === testId) {
        const useCustom = !test.useCustomPricing;
        return {
          ...test,
          useCustomPricing: useCustom,
          doctorPrice: useCustom ? test.doctorPrice : test.defaultPrice,
          discount: useCustom ? test.discount : 0,
        };
      }
      return test;
    }));
  };

  const handlePriceChange = (testId: string, newPrice: number) => {
    setTestPricing(prev => prev.map(test => {
      if (test.testId === testId) {
        const discount = ((test.defaultPrice - newPrice) / test.defaultPrice) * 100;
        return {
          ...test,
          doctorPrice: newPrice,
          discount: Math.max(0, discount),
        };
      }
      return test;
    }));
  };

  const handleDiscountChange = (testId: string, newDiscount: number) => {
    setTestPricing(prev => prev.map(test => {
      if (test.testId === testId) {
        const doctorPrice = test.defaultPrice * (1 - newDiscount / 100);
        return {
          ...test,
          doctorPrice: Math.max(0, doctorPrice),
          discount: newDiscount,
        };
      }
      return test;
    }));
  };

  const handleSave = () => {
    // In a real app, save to backend
    console.log('Saving pricing:', testPricing);
    setIsEditing(false);
    setEditingTestId(null);
  };

  const customPricingCount = testPricing.filter(t => t.useCustomPricing).length;

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/doctors')}
            className="h-8 w-8 flex items-center justify-center bg-secondary border border-border rounded hover:bg-accent transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-foreground text-lg mb-0.5">{MOCK_DOCTOR.name}</h1>
            <p className="text-muted-foreground text-xs">
              {MOCK_DOCTOR.specialization} • {MOCK_DOCTOR.id}
            </p>
          </div>
        </div>
        <button 
          onClick={() => setIsEditing(!isEditing)}
          className="h-8 px-2.5 flex items-center gap-1.5 bg-primary text-white rounded hover:opacity-90 transition-opacity text-xs"
        >
          {isEditing ? (
            <>
              <Save className="w-3.5 h-3.5" />
              Save Changes
            </>
          ) : (
            <>
              <Edit className="w-3.5 h-3.5" />
              Edit Pricing
            </>
          )}
        </button>
      </div>

      {/* Doctor Info Cards */}
      <div className="grid grid-cols-5 gap-3">
        <div className="bg-card border border-border rounded p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Commission</span>
            <Percent className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="text-foreground text-xl tabular-nums">{MOCK_DOCTOR.commission}%</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Per report</div>
        </div>

        <div className="bg-card border border-border rounded p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Total Revenue</span>
            <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="text-foreground text-xl tabular-nums">${(MOCK_DOCTOR.totalRevenue / 1000).toFixed(0)}K</div>
          <div className="text-[10px] text-success mt-0.5">Generated</div>
        </div>

        <div className="bg-card border border-border rounded p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Total Reports</span>
            <FileText className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="text-foreground text-xl tabular-nums">{MOCK_DOCTOR.totalReports}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Referrals</div>
        </div>

        <div className="bg-card border border-border rounded p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Custom Pricing</span>
            <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="text-foreground text-xl tabular-nums">{customPricingCount}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Tests</div>
        </div>

        <div className="bg-card border border-border rounded p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Branch</span>
            <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="text-foreground text-xs mt-1">{MOCK_DOCTOR.branch}</div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-card border border-border rounded">
        <div className="px-4 py-2.5 border-b border-border bg-secondary/30">
          <h2 className="text-sm text-foreground">Contact Information</h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <div>
                <div className="text-[10px] text-muted-foreground uppercase">Phone</div>
                <div className="text-xs text-foreground">{MOCK_DOCTOR.phone}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <div>
                <div className="text-[10px] text-muted-foreground uppercase">Email</div>
                <div className="text-xs text-foreground">{MOCK_DOCTOR.email}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-muted-foreground" />
              <div>
                <div className="text-[10px] text-muted-foreground uppercase">Specialization</div>
                <div className="text-xs text-foreground">{MOCK_DOCTOR.specialization}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Pricing Table */}
      <div className="bg-card border border-border rounded">
        <div className="px-4 py-2.5 border-b border-border bg-secondary/30">
          <h2 className="text-sm text-foreground">Doctor-wise Test Pricing</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary/30 sticky top-0 z-10">
              <tr className="border-b border-border">
                <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">Test Name</th>
                <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">Category</th>
                <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider">Default Price</th>
                <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider">Doctor Price</th>
                <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider">Discount %</th>
                <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider w-40">Custom Pricing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {testPricing.map((test) => (
                <tr 
                  key={test.testId} 
                  className={`hover:bg-accent/30 transition-colors ${!test.useCustomPricing ? 'opacity-60' : ''}`}
                >
                  <td className="px-3 py-2">
                    <div className="text-xs text-foreground font-medium">{test.testName}</div>
                  </td>
                  <td className="px-3 py-2">
                    <span className="text-xs text-muted-foreground">{test.category}</span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className="text-xs text-foreground font-medium tabular-nums">${test.defaultPrice}</span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    {isEditing && test.useCustomPricing ? (
                      <input
                        type="number"
                        className="w-20 h-7 px-2 bg-background border border-border rounded text-xs text-center tabular-nums focus:outline-none focus:ring-1 focus:ring-primary"
                        value={test.doctorPrice}
                        onChange={(e) => handlePriceChange(test.testId, parseFloat(e.target.value) || 0)}
                        step="0.5"
                        min="0"
                      />
                    ) : (
                      <span 
                        className={`text-xs font-medium tabular-nums ${test.useCustomPricing ? 'text-primary' : 'text-foreground'}`}
                      >
                        ${test.doctorPrice}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {isEditing && test.useCustomPricing ? (
                      <input
                        type="number"
                        className="w-20 h-7 px-2 bg-background border border-border rounded text-xs text-center tabular-nums focus:outline-none focus:ring-1 focus:ring-primary"
                        value={test.discount.toFixed(1)}
                        onChange={(e) => handleDiscountChange(test.testId, parseFloat(e.target.value) || 0)}
                        step="0.5"
                        min="0"
                        max="100"
                      />
                    ) : (
                      <span 
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                          test.discount > 0 
                            ? 'bg-success/10 text-success' 
                            : 'bg-secondary text-muted-foreground'
                        }`}
                      >
                        {test.discount > 0 ? `-${test.discount.toFixed(1)}%` : '0%'}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => handleToggleCustomPricing(test.testId)}
                      disabled={!isEditing}
                      className={`h-7 px-3 flex items-center justify-center gap-1.5 rounded text-xs transition-colors mx-auto ${
                        test.useCustomPricing
                          ? 'bg-success text-white hover:opacity-90'
                          : 'bg-secondary border border-border hover:bg-accent'
                      } ${!isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {test.useCustomPricing ? (
                        <>
                          <Check className="w-3 h-3" />
                          Enabled
                        </>
                      ) : (
                        <>
                          <X className="w-3 h-3" />
                          Disabled
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="border-t border-border bg-secondary/30 px-3 py-2 flex justify-between items-center">
          <div className="text-xs text-muted-foreground">
            {customPricingCount} tests with custom pricing enabled
          </div>
          {isEditing && (
            <button 
              onClick={handleSave}
              className="h-7 px-3 bg-primary text-white rounded text-xs hover:opacity-90 transition-opacity"
            >
              Save All Changes
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
