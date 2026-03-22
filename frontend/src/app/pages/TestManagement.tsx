import { useState } from 'react';
import { 
  Plus, 
  Search, 
  Edit,
  Eye,
  MoreVertical,
  X,
  DollarSign,
  Clock,
  Activity,
  CheckCircle,
  AlertCircle,
  Beaker,
  Trash2,
  Copy
} from 'lucide-react';

interface TestParameter {
  id: string;
  name: string;
  unit: string;
  refRangeMale: string;
  refRangeFemale: string;
  criticalLow: string;
  criticalHigh: string;
  autoFlag: boolean;
}

interface Test {
  id: string;
  name: string;
  category: 'CBC' | 'Biochemistry' | 'Hormone' | 'Immunology' | 'Microbiology' | 'Serology';
  parametersCount: number;
  price: number;
  turnaroundTime: string;
  status: 'active' | 'inactive';
  parameters: TestParameter[];
}

const MOCK_TESTS: Test[] = [
  {
    id: 'TEST-001',
    name: 'Complete Blood Count (CBC)',
    category: 'CBC',
    parametersCount: 9,
    price: 150,
    turnaroundTime: '2-4 hours',
    status: 'active',
    parameters: [
      { id: 'P1', name: 'Hemoglobin', unit: 'g/dL', refRangeMale: '13.5-17.5', refRangeFemale: '12.0-15.5', criticalLow: '7.0', criticalHigh: '20.0', autoFlag: true },
      { id: 'P2', name: 'RBC Count', unit: 'mil/µL', refRangeMale: '4.5-5.9', refRangeFemale: '4.1-5.1', criticalLow: '2.0', criticalHigh: '7.0', autoFlag: true },
      { id: 'P3', name: 'WBC Count', unit: 'thou/µL', refRangeMale: '4.5-11.0', refRangeFemale: '4.5-11.0', criticalLow: '2.0', criticalHigh: '30.0', autoFlag: true },
    ],
  },
  {
    id: 'TEST-002',
    name: 'Lipid Profile',
    category: 'Biochemistry',
    parametersCount: 5,
    price: 200,
    turnaroundTime: '4-6 hours',
    status: 'active',
    parameters: [
      { id: 'P4', name: 'Total Cholesterol', unit: 'mg/dL', refRangeMale: '<200', refRangeFemale: '<200', criticalLow: '', criticalHigh: '400', autoFlag: true },
      { id: 'P5', name: 'HDL Cholesterol', unit: 'mg/dL', refRangeMale: '>40', refRangeFemale: '>50', criticalLow: '20', criticalHigh: '', autoFlag: true },
    ],
  },
  {
    id: 'TEST-003',
    name: 'Thyroid Profile (T3, T4, TSH)',
    category: 'Hormone',
    parametersCount: 3,
    price: 350,
    turnaroundTime: '6-8 hours',
    status: 'active',
    parameters: [
      { id: 'P6', name: 'TSH', unit: 'µIU/mL', refRangeMale: '0.4-4.0', refRangeFemale: '0.4-4.0', criticalLow: '0.1', criticalHigh: '10.0', autoFlag: true },
      { id: 'P7', name: 'Free T4', unit: 'ng/dL', refRangeMale: '0.8-1.8', refRangeFemale: '0.8-1.8', criticalLow: '0.3', criticalHigh: '4.0', autoFlag: true },
    ],
  },
  {
    id: 'TEST-004',
    name: 'Liver Function Test (LFT)',
    category: 'Biochemistry',
    parametersCount: 8,
    price: 280,
    turnaroundTime: '3-5 hours',
    status: 'active',
    parameters: [],
  },
  {
    id: 'TEST-005',
    name: 'Kidney Function Test (KFT)',
    category: 'Biochemistry',
    parametersCount: 6,
    price: 250,
    turnaroundTime: '3-5 hours',
    status: 'active',
    parameters: [],
  },
  {
    id: 'TEST-006',
    name: 'HbA1c (Glycated Hemoglobin)',
    category: 'Biochemistry',
    parametersCount: 1,
    price: 180,
    turnaroundTime: '2-4 hours',
    status: 'active',
    parameters: [],
  },
  {
    id: 'TEST-007',
    name: 'Vitamin D (25-OH)',
    category: 'Hormone',
    parametersCount: 1,
    price: 420,
    turnaroundTime: '24 hours',
    status: 'active',
    parameters: [],
  },
  {
    id: 'TEST-008',
    name: 'COVID-19 RT-PCR',
    category: 'Microbiology',
    parametersCount: 1,
    price: 500,
    turnaroundTime: '6-12 hours',
    status: 'inactive',
    parameters: [],
  },
];

export function TestManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showTestModal, setShowTestModal] = useState(false);
  const [showParametersModal, setShowParametersModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);

  const filteredTests = MOCK_TESTS.filter(test => {
    const matchesSearch = 
      test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || test.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || test.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getCategoryBadge = (category: Test['category']) => {
    const styles = {
      'CBC': { bg: '#ef4444', text: '#ffffff' },
      'Biochemistry': { bg: '#3b82f6', text: '#ffffff' },
      'Hormone': { bg: '#8b5cf6', text: '#ffffff' },
      'Immunology': { bg: '#10b981', text: '#ffffff' },
      'Microbiology': { bg: '#f59e0b', text: '#ffffff' },
      'Serology': { bg: '#ec4899', text: '#ffffff' },
    };

    const style = styles[category];
    return (
      <span
        className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide"
        style={{ backgroundColor: style.bg, color: style.text }}
      >
        {category}
      </span>
    );
  };

  const getStatusBadge = (status: Test['status']) => {
    if (status === 'active') {
      return (
        <span
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide"
          style={{ backgroundColor: 'var(--success)', color: 'var(--success-foreground)' }}
        >
          <CheckCircle className="w-2.5 h-2.5" />
          Active
        </span>
      );
    } else {
      return (
        <span
          className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide"
          style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }}
        >
          Inactive
        </span>
      );
    }
  };

  const categoryCount = {
    CBC: filteredTests.filter(t => t.category === 'CBC').length,
    Biochemistry: filteredTests.filter(t => t.category === 'Biochemistry').length,
    Hormone: filteredTests.filter(t => t.category === 'Hormone').length,
    Immunology: filteredTests.filter(t => t.category === 'Immunology').length,
    Microbiology: filteredTests.filter(t => t.category === 'Microbiology').length,
    Serology: filteredTests.filter(t => t.category === 'Serology').length,
  };

  const activeCount = filteredTests.filter(t => t.status === 'active').length;
  const totalParameters = filteredTests.reduce((sum, t) => sum + t.parametersCount, 0);
  const avgPrice = Math.round(filteredTests.reduce((sum, t) => sum + t.price, 0) / filteredTests.length);

  const handleEdit = (test: Test) => {
    setSelectedTest(test);
    setShowTestModal(true);
  };

  const handleViewParameters = (test: Test) => {
    setSelectedTest(test);
    setShowParametersModal(true);
  };

  const handleAdd = () => {
    setSelectedTest(null);
    setShowTestModal(true);
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-foreground text-lg mb-0.5">Test Management</h1>
          <p className="text-muted-foreground text-xs">
            Configure laboratory tests, parameters, and pricing
          </p>
        </div>
        <button 
          onClick={handleAdd}
          className="h-8 px-2.5 flex items-center gap-1.5 bg-primary text-white rounded hover:opacity-90 transition-opacity text-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Test
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Total Tests</span>
            <Beaker className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="text-foreground text-xl tabular-nums">{filteredTests.length}</div>
          <div className="text-[10px] text-success mt-0.5">{activeCount} active</div>
        </div>

        <div className="bg-card border border-border rounded p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Parameters</span>
            <Activity className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="text-foreground text-xl tabular-nums">{totalParameters}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Total configured</div>
        </div>

        <div className="bg-card border border-border rounded p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Avg Price</span>
            <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="text-foreground text-xl tabular-nums">${avgPrice}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Per test</div>
        </div>

        <div className="bg-card border border-border rounded p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Categories</span>
            <Beaker className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="text-foreground text-xl tabular-nums">6</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Test types</div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex items-center gap-3 bg-card border border-border rounded p-2.5">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground w-3.5 h-3.5" />
          <input 
            type="text"
            placeholder="Search by test name or ID..."
            className="w-full h-8 pl-8 pr-3 bg-secondary border-0 rounded text-[13px] placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="h-6 w-px bg-border"></div>

        <select 
          className="h-8 text-xs bg-secondary border-0 rounded px-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="all">All Categories</option>
          <option value="CBC">CBC</option>
          <option value="Biochemistry">Biochemistry</option>
          <option value="Hormone">Hormone</option>
          <option value="Immunology">Immunology</option>
          <option value="Microbiology">Microbiology</option>
          <option value="Serology">Serology</option>
        </select>

        <select 
          className="h-8 text-xs bg-secondary border-0 rounded px-2.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Test Table */}
      <div className="bg-card border border-border rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary/30 sticky top-0 z-10">
              <tr className="border-b border-border">
                <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">Test Name</th>
                <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider">Category</th>
                <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider">Parameters</th>
                <th className="px-3 py-2 text-right text-muted-foreground text-[10px] uppercase tracking-wider">Price</th>
                <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider">TAT</th>
                <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider">Status</th>
                <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider w-28">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredTests.map((test) => (
                <tr 
                  key={test.id} 
                  className="hover:bg-accent/30 transition-colors"
                >
                  <td className="px-3 py-2">
                    <div className="flex flex-col">
                      <span className="text-xs text-foreground">{test.name}</span>
                      <span className="text-[10px] text-muted-foreground tabular-nums">{test.id}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-center">
                    {getCategoryBadge(test.category)}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className="text-xs text-foreground tabular-nums">{test.parametersCount}</span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <span className="text-xs text-foreground tabular-nums">${test.price}</span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      <Clock className="w-3 h-3" />
                      {test.turnaroundTime}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    {getStatusBadge(test.status)}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-center gap-1">
                      <button 
                        onClick={() => handleViewParameters(test)}
                        className="h-6 px-1.5 flex items-center gap-1 rounded hover:bg-accent transition-colors text-muted-foreground text-[10px]"
                        title="View Parameters"
                      >
                        <Eye className="w-3 h-3" />
                        Params
                      </button>
                      <button 
                        onClick={() => handleEdit(test)}
                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-accent transition-colors text-muted-foreground"
                        title="Edit"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-accent transition-colors text-muted-foreground"
                        title="More"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="border-t border-border bg-secondary/30 px-3 py-2 flex justify-between items-center">
          <div className="text-xs text-muted-foreground">
            Showing <span className="text-foreground">{filteredTests.length}</span> of <span className="text-foreground">{MOCK_TESTS.length}</span> tests
          </div>
        </div>
      </div>

      {/* Add/Edit Test Modal */}
      {showTestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
              <h2 className="text-foreground text-sm">
                {selectedTest ? 'Edit Test' : 'Add New Test'}
              </h2>
              <button 
                onClick={() => setShowTestModal(false)}
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-accent transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Basic Information</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs text-foreground block mb-1">Test Name *</label>
                    <input 
                      type="text"
                      className="w-full h-8 px-2.5 bg-secondary border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      defaultValue={selectedTest?.name}
                      placeholder="e.g., Complete Blood Count (CBC)"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-foreground block mb-1">Category *</label>
                    <select 
                      className="w-full h-8 px-2.5 bg-secondary border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      defaultValue={selectedTest?.category}
                    >
                      <option value="">Select category...</option>
                      <option value="CBC">CBC</option>
                      <option value="Biochemistry">Biochemistry</option>
                      <option value="Hormone">Hormone</option>
                      <option value="Immunology">Immunology</option>
                      <option value="Microbiology">Microbiology</option>
                      <option value="Serology">Serology</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-foreground block mb-1">Test ID</label>
                    <input 
                      type="text"
                      className="w-full h-8 px-2.5 bg-secondary border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      defaultValue={selectedTest?.id}
                      placeholder="Auto-generated"
                      disabled
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Pricing & Turnaround</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-foreground block mb-1">Price (USD) *</label>
                    <input 
                      type="number"
                      className="w-full h-8 px-2.5 bg-secondary border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      defaultValue={selectedTest?.price}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-foreground block mb-1">Turnaround Time *</label>
                    <input 
                      type="text"
                      className="w-full h-8 px-2.5 bg-secondary border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      defaultValue={selectedTest?.turnaroundTime}
                      placeholder="e.g., 2-4 hours"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-foreground block mb-1">Status *</label>
                    <select 
                      className="w-full h-8 px-2.5 bg-secondary border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      defaultValue={selectedTest?.status || 'active'}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-card border-t border-border px-4 py-3 flex items-center justify-end gap-2">
              <button 
                onClick={() => setShowTestModal(false)}
                className="h-8 px-3 bg-secondary border border-border rounded text-xs hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button 
                className="h-8 px-3 bg-primary text-white rounded text-xs hover:opacity-90 transition-opacity"
              >
                {selectedTest ? 'Save Changes' : 'Create Test'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Parameters Modal */}
      {showParametersModal && selectedTest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg w-full max-w-5xl max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
              <div>
                <h2 className="text-foreground text-sm">{selectedTest.name} - Parameters</h2>
                <p className="text-[10px] text-muted-foreground mt-0.5">{selectedTest.parametersCount} parameters configured</p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  className="h-7 px-2 flex items-center gap-1 bg-primary text-white rounded hover:opacity-90 transition-opacity text-[11px]"
                >
                  <Plus className="w-3 h-3" />
                  Add Parameter
                </button>
                <button 
                  onClick={() => setShowParametersModal(false)}
                  className="w-6 h-6 flex items-center justify-center rounded hover:bg-accent transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-4">
              {selectedTest.parameters.length > 0 ? (
                <div className="bg-card border border-border rounded overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-secondary/30">
                      <tr className="border-b border-border">
                        <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">Parameter</th>
                        <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider">Unit</th>
                        <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider">Ref Range (M)</th>
                        <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider">Ref Range (F)</th>
                        <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider">Critical Low</th>
                        <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider">Critical High</th>
                        <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider">Auto-Flag</th>
                        <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider w-20">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {selectedTest.parameters.map((param) => (
                        <tr key={param.id} className="hover:bg-accent/30 transition-colors">
                          <td className="px-3 py-2 text-xs text-foreground">{param.name}</td>
                          <td className="px-3 py-2 text-center text-[10px] text-muted-foreground">{param.unit}</td>
                          <td className="px-3 py-2 text-center text-[10px] text-foreground tabular-nums">{param.refRangeMale}</td>
                          <td className="px-3 py-2 text-center text-[10px] text-foreground tabular-nums">{param.refRangeFemale}</td>
                          <td className="px-3 py-2 text-center text-[10px] text-foreground tabular-nums">{param.criticalLow || '-'}</td>
                          <td className="px-3 py-2 text-center text-[10px] text-foreground tabular-nums">{param.criticalHigh || '-'}</td>
                          <td className="px-3 py-2 text-center">
                            {param.autoFlag ? (
                              <CheckCircle className="w-3.5 h-3.5 text-success mx-auto" />
                            ) : (
                              <span className="text-muted-foreground text-[10px]">-</span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center justify-center gap-1">
                              <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-accent transition-colors text-muted-foreground" title="Edit">
                                <Edit className="w-3 h-3" />
                              </button>
                              <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-accent transition-colors text-muted-foreground" title="Delete">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-secondary/30 border border-border rounded p-8 text-center">
                  <Beaker className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">No parameters configured yet</p>
                  <button className="h-7 px-3 flex items-center gap-1.5 bg-primary text-white rounded hover:opacity-90 transition-opacity text-xs mx-auto">
                    <Plus className="w-3 h-3" />
                    Add First Parameter
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
