import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Building2, MapPin, Phone, Mail, CheckCircle, Loader2, FlaskConical, Users, Stethoscope, FileText, ClipboardList, Package, ArrowRight } from 'lucide-react';
import { useBranchStore, useAuthStore } from '../../stores';

const FEATURES = [
  { icon: FlaskConical, label: 'Tests', description: 'Configure lab tests and parameters', path: '/tests' },
  { icon: Stethoscope, label: 'Doctors', description: 'Add referring doctors', path: '/doctors' },
  { icon: Users, label: 'Patients', description: 'Manage patient records', path: '/patients' },
  { icon: FileText, label: 'Reports', description: 'Create and manage reports', path: '/reports' },
  { icon: ClipboardList, label: 'Sample Collection', description: 'Track sample collections', path: '/sample-collection' },
  { icon: Package, label: 'Inventory', description: 'Manage lab inventory', path: '/inventory' },
];

export function Onboarding() {
  const navigate = useNavigate();
  const { createBranch, setCurrentBranchId, isLoading, error } = useBranchStore();
  const { user } = useAuthStore();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    phone: '',
    email: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const newBranch = await createBranch(formData);
      if (newBranch) {
        setCurrentBranchId(newBranch.id);
        localStorage.setItem('onboarding_complete', 'true');
        setStep(2); // Go to feature overview
      }
    } catch {
      // Error is handled by the store
    }
  };

  const handleFinish = () => {
    navigate('/', { replace: true });
  };

  const isFormValid = formData.name.trim().length >= 2 && formData.location.trim().length >= 5;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Welcome to DiagnoPro</h1>
          <p className="text-muted-foreground mt-2">
            {user ? `Hi ${user.firstname}, let's` : "Let's"} set up your lab to get started
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8 gap-2">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  step === s
                    ? 'bg-primary text-white'
                    : step > s
                    ? 'bg-primary/20 text-primary'
                    : 'bg-secondary text-muted-foreground'
                }`}
              >
                {step > s ? <CheckCircle className="w-4 h-4" /> : s}
              </div>
              {s < 2 && (
                <div
                  className={`w-12 h-0.5 mx-1 transition-colors ${
                    step > s ? 'bg-primary' : 'bg-secondary'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Content Card */}
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
          {step === 1 && (
            // Step 1: Lab Setup (all fields in one form)
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Set up your lab</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Enter your lab details to start managing reports
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium text-foreground">
                    Lab / Branch Name *
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g., Central Diagnostics Lab"
                      className="w-full h-10 pl-10 pr-4 bg-secondary border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="location" className="text-sm font-medium text-foreground">
                    Address *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <textarea
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="Full address including city and postal code"
                      rows={2}
                      className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="phone" className="text-sm font-medium text-foreground">
                      Phone <span className="text-xs text-muted-foreground">(optional)</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+91 98765 43210"
                        className="w-full h-10 pl-10 pr-4 bg-secondary border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-foreground">
                      Email <span className="text-xs text-muted-foreground">(optional)</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="lab@example.com"
                        className="w-full h-10 pl-10 pr-4 bg-secondary border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !isFormValid}
                className="w-full mt-6 h-10 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Lab & Continue'
                )}
              </button>
            </form>
          )}

          {step === 2 && (
            // Step 2: Feature Overview
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">You're all set!</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Your lab is ready. Here's what you can do next — explore now or set up later.
                </p>
              </div>

              <div className="grid gap-2">
                {FEATURES.map(({ icon: Icon, label, description, path }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => navigate(path)}
                    className="flex items-center gap-3 p-3 rounded-md border border-border hover:bg-accent/50 transition-colors text-left group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{label}</p>
                      <p className="text-xs text-muted-foreground">{description}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleFinish}
                className="w-full h-10 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                Go to Dashboard
              </button>
            </div>
          )}
        </div>

        {/* Helper text */}
        {step === 1 && (
          <p className="text-center text-xs text-muted-foreground mt-4">
            You can add more branches later from Settings
          </p>
        )}
      </div>
    </div>
  );
}

export default Onboarding;
