import { useState, useEffect } from 'react';
import { 
  User, Loader2, AlertCircle, Check, Mail, Phone, Calendar
} from 'lucide-react';
import { useAuthStore } from '../../stores';
import { authApi } from '../../api/auth';
import { getRoleLabel } from '../../utils/permissions';

export function DoctorProfile() {
  const { user, fetchProfile } = useAuthStore();
  const [formFirstname, setFormFirstname] = useState('');
  const [formLastname, setFormLastname] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFormFirstname(user.firstname || '');
      setFormLastname(user.lastname || '');
      setFormPhone(user.phone || '');
    }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!formFirstname.trim() || !formLastname.trim()) {
      setProfileError('First name and last name are required');
      return;
    }

    setProfileError(null);
    setSuccessMessage(null);
    setIsSaving(true);

    try {
      await authApi.updateProfile({
        firstname: formFirstname,
        lastname: formLastname,
        phone: formPhone || undefined,
      });
      await fetchProfile();
      setSuccessMessage('Profile updated successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const isModified = 
    formFirstname !== user?.firstname ||
    formLastname !== user?.lastname ||
    formPhone !== user?.phone;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Page Header */}
      <div>
        <h1 className="text-foreground text-2xl font-bold mb-1">My Profile</h1>
        <p className="text-muted-foreground text-sm">
          Manage your personal information
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-success/10 border border-success/20 rounded-lg p-4 flex items-center gap-3">
          <Check className="w-5 h-5 text-success flex-shrink-0" />
          <span className="text-sm text-success font-medium">{successMessage}</span>
        </div>
      )}

      {/* Error Message */}
      {profileError && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
          <span className="text-sm text-destructive font-medium">{profileError}</span>
        </div>
      )}

      {/* Profile Info Cards */}
      <div className="grid grid-cols-2 gap-4">
        {/* Email - Read Only */}
        <div className="bg-card border border-border rounded-lg p-4">
          <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-2">Email Address</label>
          <div className="flex items-center gap-3 mb-1">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <p className="text-foreground font-medium">{user?.email || 'N/A'}</p>
          </div>
          <p className="text-xs text-muted-foreground ml-7">Cannot be changed</p>
        </div>

        {/* Role - Read Only */}
        <div className="bg-card border border-border rounded-lg p-4">
          <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-2">Role</label>
          <p className="text-foreground font-medium capitalize">{getRoleLabel(user?.role || '')}</p>
          <p className="text-xs text-muted-foreground mt-1">Your account role</p>
        </div>

        {/* Member Since - Read Only */}
        <div className="bg-card border border-border rounded-lg p-4">
          <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-2">Member Since</label>
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <p className="text-foreground font-medium">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>

        {/* User ID - Read Only */}
        <div className="bg-card border border-border rounded-lg p-4">
          <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-2">User ID</label>
          <p className="text-foreground font-mono text-sm">{user?.id?.slice(0, 12)}...</p>
          <p className="text-xs text-muted-foreground mt-1">Your unique identifier</p>
        </div>
      </div>

      {/* Editable Profile Section */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-foreground font-semibold mb-4 flex items-center gap-2">
          <User className="w-5 h-5" />
          Personal Information
        </h2>

        <div className="space-y-4">
          {/* First Name */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">First Name *</label>
            <input
              type="text"
              value={formFirstname}
              onChange={(e) => setFormFirstname(e.target.value)}
              className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter your first name"
            />
          </div>

          {/* Last Name */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Last Name *</label>
            <input
              type="text"
              value={formLastname}
              onChange={(e) => setFormLastname(e.target.value)}
              className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter your last name"
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-2 flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Phone Number
            </label>
            <input
              type="tel"
              value={formPhone}
              onChange={(e) => setFormPhone(e.target.value)}
              className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter your phone number"
            />
          </div>
        </div>

        {/* Info Text */}
        <p className="text-xs text-muted-foreground mt-4 p-3 bg-muted/50 rounded">
          ℹ️ You can edit your name and phone number. Email address and password cannot be changed from this page.
          For security changes, please contact system administrator.
        </p>

        {/* Save Button */}
        <div className="flex items-center gap-3 mt-6 pt-4 border-t border-border">
          <button
            onClick={handleSaveProfile}
            disabled={isSaving || !isModified}
            className="h-10 px-4 bg-primary text-white rounded-lg font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
          {!isModified && (
            <p className="text-xs text-muted-foreground">No changes to save</p>
          )}
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4">
        <p className="text-sm text-blue-600">
          <span className="font-semibold">Security Tip:</span> Keep your phone number up to date so we can reach you if needed. Your email address is securely managed and cannot be changed from your profile.
        </p>
      </div>
    </div>
  );
}
