import { useState, useEffect } from 'react';
import { 
  User, Loader2, AlertCircle, Check, Mail, Phone, Calendar, Percent
} from 'lucide-react';
import { useAuthStore } from '../../stores';
import { authApi } from '../../api/auth';
import { doctorPortalApi } from '../../api/doctorPortal';
import { getRoleLabel } from '../../utils/permissions';

export function DoctorProfile() {
  const { user, fetchProfile } = useAuthStore();
  const [formFirstname, setFormFirstname] = useState('');
  const [formLastname, setFormLastname] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Doctor detail state
  const [commissionPercentage, setCommissionPercentage] = useState<number | null>(null);
  const [doctorName, setDoctorName] = useState(user ? `${user.firstname} ${user.lastname}` : 'Doctor');
  const [specialization, setSpecialization] = useState('');
  const [isLoadingDoctor, setIsLoadingDoctor] = useState(false);

  useEffect(() => {
    if (user) {
      setFormFirstname(user.firstname || '');
      setFormLastname(user.lastname || '');
      setFormPhone(user.phone || '');
    }
  }, [user]);

  useEffect(() => {
    const loadDoctorDetail = async () => {
      setIsLoadingDoctor(true);
      try {
        const res = await doctorPortalApi.getMyProfile();
        if (res?.data) {
          setCommissionPercentage(res.data.commission_percentage);
          if (res.data.name) {
            setDoctorName(res.data.name);
          }
          setSpecialization(res.data.specialization || '');
        }
      } catch (err) {
        console.error('Failed to load doctor profile details:', err);
      } finally {
        setIsLoadingDoctor(false);
      }
    };

    loadDoctorDetail();
  }, []);

  const userInitials = user 
    ? `${user.firstname?.charAt(0) || ''}${user.lastname?.charAt(0) || ''}`.toUpperCase()
    : 'DR';

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
    <div className="space-y-6 max-w-2xl pb-10">
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

      {/* Premium Profile Header Card */}
      <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4 shadow-sm">
        <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center text-lg font-bold shadow-md">
          {userInitials}
        </div>
        <div>
          <h2 className="text-base font-bold text-foreground leading-snug">{doctorName}</h2>
          {specialization ? (
            <p className="text-xs text-muted-foreground font-medium">{specialization}</p>
          ) : (
            <p className="text-xs text-muted-foreground font-medium">Practitioner</p>
          )}
          <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
            Active Doctor
          </span>
        </div>
      </div>

      {/* Profile Info Cards (Responsive layout) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Email - Read Only */}
        <div className="bg-card border border-border rounded-xl p-4 flex items-start gap-3 shadow-sm">
          <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400">
            <Mail className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold">Email Address</label>
            <p className="text-foreground text-sm font-semibold truncate mt-0.5" title={user?.email}>{user?.email || 'N/A'}</p>
            <p className="text-[10px] text-muted-foreground">Cannot be changed</p>
          </div>
        </div>

        {/* Member Since - Read Only */}
        <div className="bg-card border border-border rounded-xl p-4 flex items-start gap-3 shadow-sm">
          <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold">Member Since</label>
            <p className="text-foreground text-sm font-semibold mt-0.5">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
            </p>
            <p className="text-[10px] text-muted-foreground">Account creation date</p>
          </div>
        </div>

        {/* Sharing Percentage - Read Only */}
        <div className="bg-card border border-border rounded-xl p-4 flex items-start gap-3 shadow-sm">
          <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400">
            <Percent className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold">Revenue Share</label>
            <p className="text-foreground text-sm font-semibold mt-0.5">
              {isLoadingDoctor ? 'Loading...' : `${commissionPercentage ?? 0}%`}
            </p>
            <p className="text-[10px] text-muted-foreground">Referred test share</p>
          </div>
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
