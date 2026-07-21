import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Building2, MapPin, ArrowRight, LogOut, CheckCircle2 } from 'lucide-react';
import { useAuthStore, useBranchStore } from '../../stores';

export function SelectBranch() {
  const navigate = useNavigate();
  const { user, logout, loginBranches } = useAuthStore();
  const { branches, currentBranchId, fetchBranches, isLoading } = useBranchStore();

  useEffect(() => {
    if (branches.length === 0) {
      fetchBranches().catch(console.error);
    }
  }, [branches.length, fetchBranches]);

  const availableBranches = branches.length > 0 ? branches : loginBranches;

  const handleSelectBranch = (branchId: string) => {
    localStorage.setItem('diagnopro_active_branch', branchId);
    useBranchStore.getState().setCurrentBranchId(branchId);
    navigate('/app', { replace: true });
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mx-auto mb-3 border border-primary/20">
            <Building2 className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Select Workspace
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome back, <span className="font-semibold text-foreground">{user?.firstname} {user?.lastname}</span>. Please choose the branch you want to work in today.
          </p>
        </div>

        {/* Branch List / Cards */}
        <div className="space-y-3 mb-6">
          {availableBranches.length === 0 && isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground bg-card border border-border rounded-xl">
              Loading available branches...
            </div>
          ) : availableBranches.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground bg-card border border-border rounded-xl">
              No branches assigned to your account. Please contact your system administrator.
            </div>
          ) : (
            availableBranches.map((branch) => {
              const isSelected = currentBranchId === branch.id;
              return (
                <button
                  key={branch.id}
                  onClick={() => handleSelectBranch(branch.id)}
                  className={`w-full p-4 text-left bg-card border rounded-xl transition-all duration-200 flex items-center justify-between group cursor-pointer ${
                    isSelected
                      ? 'border-primary ring-2 ring-primary/20 shadow-sm'
                      : 'border-border hover:border-primary/50 hover:bg-accent/30'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                      isSelected ? 'bg-primary text-white' : 'bg-secondary text-foreground group-hover:bg-primary/10 group-hover:text-primary'
                    }`}>
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors">
                          {branch.name}
                        </h3>
                        {isSelected && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            Active
                          </span>
                        )}
                      </div>
                      {(branch.location || branch.city) && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                          {[branch.location, branch.city].filter(Boolean).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-border pt-4 text-xs">
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
          <span className="text-muted-foreground">
            DiagnoPro Workspace Session
          </span>
        </div>
      </div>
    </div>
  );
}
