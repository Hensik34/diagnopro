import { useNavigate } from 'react-router';
import { ShieldX, ArrowLeft, Home } from 'lucide-react';
import { useAuthStore } from '../../stores';
import { getRoleLabel } from '../../utils/permissions';

/**
 * Unauthorized Page
 * 
 * Shown when a user tries to access a resource they don't have permission for.
 * Provides helpful information and navigation options.
 */
export default function Unauthorized() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full mx-auto p-8 text-center">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-destructive/10 rounded-full">
            <ShieldX className="w-16 h-16 text-destructive" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Access Denied
        </h1>

        {/* Description */}
        <p className="text-muted-foreground mb-6">
          You don't have permission to access this page.
          {user && (
            <span className="block mt-2 text-sm">
              Your current role: <strong>{getRoleLabel(user.role)}</strong>
            </span>
          )}
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-medium transition-colors"
          >
            <Home className="w-4 h-4" />
            Go to Dashboard
          </button>
        </div>

        {/* Help text */}
        <p className="mt-8 text-xs text-muted-foreground">
          If you believe this is an error, please contact your administrator.
        </p>
      </div>
    </div>
  );
}
