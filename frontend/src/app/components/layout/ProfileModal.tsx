import { LogOut, User, Mail, Phone, Building2, Shield, Calendar, Zap } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAuthStore, useBranchStore } from '../../../stores';
import type { User as UserType } from '../../../types';

interface ProfileModalProps {
  user: UserType | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileModal({ user, isOpen, onClose }: ProfileModalProps) {
  const navigate = useNavigate();
  const { logout, getBranchRole } = useAuthStore();
  const { branches, currentBranchId } = useBranchStore();

  if (!isOpen || !user) return null;

  const currentBranch = branches.find(b => b.id === currentBranchId);
  const userRole = getBranchRole();
  const roleDisplay = userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1).replace('_', ' ') : 'Staff';
  const isDoctor = userRole === 'doctor';

  // Plan display - currently showing 'basic' as placeholder
  const planName = 'Basic';
  const planColor = 'text-blue-600 dark:text-blue-400';

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleViewProfile = () => {
    navigate('/profile');
    onClose();
  };

  return (
    <div className="absolute top-full right-0 mt-2 w-80 bg-card border border-border rounded-lg shadow-xl z-50">
      {/* Header with avatar */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 border-b border-border">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-lg bg-primary text-white flex items-center justify-center text-lg font-semibold">
            {user.firstname?.charAt(0) || 'U'}{user.lastname?.charAt(0) || 'S'}
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-foreground">
              {user.firstname} {user.lastname}
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              <Shield className="w-3 h-3 text-primary" />
              <span className="text-xs text-primary font-medium">{roleDisplay}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile details */}
      <div className="p-4 space-y-3 border-b border-border">
        {/* Email */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center flex-shrink-0">
            <Mail className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="text-sm text-foreground truncate">{user.email}</p>
          </div>
        </div>

        {/* Branch */}
        {currentBranch && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center flex-shrink-0">
              <Building2 className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Branch</p>
              <p className="text-sm text-foreground truncate">{currentBranch.name}</p>
            </div>
          </div>
        )}

        {/* Plan - only for non-doctor roles */}
        {!isDoctor && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Plan</p>
              <p className={`text-sm font-medium ${planColor}`}>{planName}</p>
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="p-3 space-y-2">
        {isDoctor && (
          <button
            onClick={handleViewProfile}
            className="w-full h-8 flex items-center justify-center gap-2 rounded text-sm font-medium bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
          >
            <User className="w-4 h-4" />
            View Profile
          </button>
        )}
        <button
          onClick={handleLogout}
          className="w-full h-8 flex items-center justify-center gap-2 rounded text-sm font-medium bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
