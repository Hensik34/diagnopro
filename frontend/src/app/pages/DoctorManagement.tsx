import { useState } from 'react';
import { useNavigate } from 'react-router';
import { 
  Plus, 
  Search, 
  Stethoscope,
  Phone,
  Edit,
  Eye,
  X,
  DollarSign,
  TrendingUp,
  Building2
} from 'lucide-react';

interface Doctor {
  id: string;
  name: string;
  phone: string;
  commission: number; // percentage
  totalRevenue: number;
  branch: string;
  specialization?: string;
  email?: string;
}

const MOCK_DOCTORS: Doctor[] = [
  {
    id: 'DOC-001',
    name: 'Dr. Michael Thompson',
    phone: '+1 (555) 201-3001',
    commission: 15,
    totalRevenue: 125400,
    branch: 'Central Lab - Downtown',
    specialization: 'General Physician',
    email: 'michael.thompson@clinic.com',
  },
  {
    id: 'DOC-002',
    name: 'Dr. Sarah Wilson',
    phone: '+1 (555) 201-3002',
    commission: 20,
    totalRevenue: 198750,
    branch: 'North Branch',
    specialization: 'Cardiologist',
    email: 'sarah.wilson@heartclinic.com',
  },
  {
    id: 'DOC-003',
    name: 'Dr. James Anderson',
    phone: '+1 (555) 201-3003',
    commission: 18,
    totalRevenue: 167200,
    branch: 'All Branches',
    specialization: 'Internist',
    email: 'james.anderson@medcenter.com',
  },
  {
    id: 'DOC-004',
    name: 'Dr. Emily Chen',
    phone: '+1 (555) 201-3004',
    commission: 15,
    totalRevenue: 89300,
    branch: 'West Side Laboratory',
    specialization: 'Endocrinologist',
    email: 'emily.chen@hospital.com',
  },
  {
    id: 'DOC-005',
    name: 'Dr. Robert Martinez',
    phone: '+1 (555) 201-3005',
    commission: 22,
    totalRevenue: 234500,
    branch: 'Central Lab - Downtown',
    specialization: 'Oncologist',
    email: 'robert.martinez@cancercenter.com',
  },
];

const BRANCHES = ['All Branches', 'Central Lab - Downtown', 'North Branch', 'West Side Laboratory', 'East Medical Center'];

export function DoctorManagement() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  
  // Form states
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formCommission, setFormCommission] = useState('');
  const [formBranch, setFormBranch] = useState(BRANCHES[0]);
  const [formEmail, setFormEmail] = useState('');
  const [formSpecialization, setFormSpecialization] = useState('');

  const filteredDoctors = MOCK_DOCTORS.filter(doctor => 
    doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.phone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    setSelectedDoctor(null);
    setFormName('');
    setFormPhone('');
    setFormCommission('');
    setFormBranch(BRANCHES[0]);
    setFormEmail('');
    setFormSpecialization('');
    setShowModal(true);
  };

  const handleEdit = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setFormName(doctor.name);
    setFormPhone(doctor.phone);
    setFormCommission(doctor.commission.toString());
    setFormBranch(doctor.branch);
    setFormEmail(doctor.email || '');
    setFormSpecialization(doctor.specialization || '');
    setShowModal(true);
  };

  const handleView = (doctorId: string) => {
    navigate(`/doctors/${doctorId}`);
  };

  const handleSubmit = () => {
    // In a real app, submit to backend
    console.log('Submitting doctor:', {
      name: formName,
      phone: formPhone,
      commission: formCommission,
      branch: formBranch,
    });
    setShowModal(false);
  };

  const totalRevenue = filteredDoctors.reduce((sum, doc) => sum + doc.totalRevenue, 0);
  const avgCommission = filteredDoctors.length > 0 
    ? filteredDoctors.reduce((sum, doc) => sum + doc.commission, 0) / filteredDoctors.length 
    : 0;

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-foreground text-lg mb-0.5">Doctor Management</h1>
          <p className="text-muted-foreground text-xs">
            Manage referring doctors, commission rates, and custom pricing
          </p>
        </div>
        <button 
          onClick={handleAdd}
          className="h-8 px-2.5 flex items-center gap-1.5 bg-primary text-white rounded hover:opacity-90 transition-opacity text-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Doctor
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Total Doctors</span>
            <Stethoscope className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="text-foreground text-xl tabular-nums">{filteredDoctors.length}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Active referrals</div>
        </div>

        <div className="bg-card border border-border rounded p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Total Revenue</span>
            <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="text-foreground text-xl tabular-nums">${(totalRevenue / 1000).toFixed(1)}K</div>
          <div className="text-[10px] text-success mt-0.5">Generated</div>
        </div>

        <div className="bg-card border border-border rounded p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Avg Commission</span>
            <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="text-foreground text-xl tabular-nums">{avgCommission.toFixed(1)}%</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Per referral</div>
        </div>

        <div className="bg-card border border-border rounded p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">Branches</span>
            <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="text-foreground text-xl tabular-nums">{BRANCHES.length}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Locations</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 bg-card border border-border rounded p-2.5">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground w-3.5 h-3.5" />
          <input 
            type="text"
            placeholder="Search by name, phone, or doctor ID..."
            className="w-full h-8 pl-8 pr-3 bg-secondary border-0 rounded text-[13px] placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Doctor Table */}
      <div className="bg-card border border-border rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary/30 sticky top-0 z-10">
              <tr className="border-b border-border">
                <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">Doctor Name</th>
                <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">Phone</th>
                <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider">Commission %</th>
                <th className="px-3 py-2 text-right text-muted-foreground text-[10px] uppercase tracking-wider">Total Revenue</th>
                <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">Branch</th>
                <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredDoctors.map((doctor) => (
                <tr 
                  key={doctor.id} 
                  className="hover:bg-accent/30 transition-colors"
                >
                  <td className="px-3 py-2">
                    <div className="flex flex-col">
                      <span className="text-xs text-foreground font-medium">{doctor.name}</span>
                      <span className="text-[10px] text-muted-foreground">{doctor.id}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <span className="text-xs text-foreground flex items-center gap-1">
                      <Phone className="w-3 h-3 text-muted-foreground" />
                      {doctor.phone}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span 
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                      style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
                    >
                      {doctor.commission}%
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <span className="text-xs text-foreground font-medium tabular-nums">
                      ${doctor.totalRevenue.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className="text-xs text-foreground">{doctor.branch}</span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-center gap-1">
                      <button 
                        onClick={() => handleView(doctor.id)}
                        className="h-7 px-2 flex items-center gap-1 bg-secondary border border-border rounded hover:bg-accent transition-colors text-xs"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </button>
                      <button 
                        onClick={() => handleEdit(doctor)}
                        className="w-7 h-7 flex items-center justify-center rounded hover:bg-accent transition-colors text-muted-foreground"
                        title="Edit"
                      >
                        <Edit className="w-3.5 h-3.5" />
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
            Showing <span className="text-foreground">{filteredDoctors.length}</span> of <span className="text-foreground">{MOCK_DOCTORS.length}</span> doctors
          </div>
        </div>
      </div>

      {/* Add/Edit Doctor Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
              <h2 className="text-foreground text-sm">
                {selectedDoctor ? 'Edit Doctor' : 'Add New Doctor'}
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-accent transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-4">
              {/* Doctor Information */}
              <div>
                <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Doctor Information</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs text-foreground block mb-1">Full Name *</label>
                    <input 
                      type="text"
                      className="w-full h-9 px-2.5 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Dr. Full Name"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-foreground block mb-1">Phone Number *</label>
                    <input 
                      type="tel"
                      className="w-full h-9 px-2.5 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-foreground block mb-1">Email Address</label>
                    <input 
                      type="email"
                      className="w-full h-9 px-2.5 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="doctor@clinic.com"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-foreground block mb-1">Specialization</label>
                    <input 
                      type="text"
                      className="w-full h-9 px-2.5 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      value={formSpecialization}
                      onChange={(e) => setFormSpecialization(e.target.value)}
                      placeholder="e.g., Cardiologist"
                    />
                  </div>
                </div>
              </div>

              {/* Commission & Branch */}
              <div>
                <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Commission & Branch</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-foreground block mb-1">Commission % *</label>
                    <input 
                      type="number"
                      className="w-full h-9 px-2.5 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      value={formCommission}
                      onChange={(e) => setFormCommission(e.target.value)}
                      placeholder="15"
                      min="0"
                      max="100"
                      step="0.5"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-foreground block mb-1">Branch Selection *</label>
                    <select 
                      className="w-full h-9 px-2.5 bg-background border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      value={formBranch}
                      onChange={(e) => setFormBranch(e.target.value)}
                    >
                      {BRANCHES.map((branch) => (
                        <option key={branch} value={branch}>{branch}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-card border-t border-border px-4 py-3 flex items-center justify-end gap-2">
              <button 
                onClick={() => setShowModal(false)}
                className="h-8 px-3 bg-secondary border border-border rounded text-xs hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSubmit}
                className="h-8 px-3 bg-primary text-white rounded text-xs hover:opacity-90 transition-opacity"
              >
                {selectedDoctor ? 'Save Changes' : 'Add Doctor'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
