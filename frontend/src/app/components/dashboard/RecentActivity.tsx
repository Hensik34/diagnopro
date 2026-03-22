import {
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  UserPlus,
  FlaskConical,
} from 'lucide-react';

interface Activity {
  id: string;
  type: 'report' | 'approval' | 'alert' | 'test' | 'registration';
  title: string;
  description: string;
  time: string;
  branch?: string;
  critical?: boolean;
}

const activities: Activity[] = [
  {
    id: '1',
    type: 'approval',
    title: 'Blood Test Report Approved',
    description: 'PT-8765 - Complete Blood Count',
    time: '2m ago',
    branch: 'Central Lab',
  },
  {
    id: '2',
    type: 'alert',
    title: 'Critical Value Alert',
    description: 'PT-9012 - Glucose requires immediate attention',
    time: '8m ago',
    branch: 'North Branch',
    critical: true,
  },
  {
    id: '3',
    type: 'test',
    title: 'New Test Order',
    description: 'PT-7654 - Lipid Profile',
    time: '15m ago',
    branch: 'West Side Lab',
  },
  {
    id: '4',
    type: 'registration',
    title: 'New Patient Registered',
    description: 'John Anderson - PT-9123',
    time: '23m ago',
    branch: 'Central Lab',
  },
  {
    id: '5',
    type: 'report',
    title: 'Report Generated',
    description: 'PT-8543 - Thyroid Function Test',
    time: '34m ago',
    branch: 'East Medical',
  },
  {
    id: '6',
    type: 'approval',
    title: 'X-Ray Report Approved',
    description: 'PT-7821 - Chest X-Ray',
    time: '45m ago',
    branch: 'Central Lab',
  },
  {
    id: '7',
    type: 'alert',
    title: 'Equipment Alert',
    description: 'Centrifuge maintenance required',
    time: '52m ago',
    branch: 'North Branch',
    critical: true,
  },
];

const getActivityIcon = (type: Activity['type']) => {
  switch (type) {
    case 'report':
      return FileText;
    case 'approval':
      return CheckCircle2;
    case 'alert':
      return AlertCircle;
    case 'test':
      return FlaskConical;
    case 'registration':
      return UserPlus;
    default:
      return Clock;
  }
};

const getActivityColor = (type: Activity['type']) => {
  switch (type) {
    case 'approval':
      return 'var(--success)';
    case 'alert':
      return 'var(--destructive)';
    case 'test':
      return 'var(--primary)';
    case 'registration':
      return 'var(--info)';
    default:
      return 'var(--muted-foreground)';
  }
};

export function RecentActivity() {
  const criticalCount = activities.filter(a => a.critical).length;

  return (
    <div className="bg-card border border-border rounded">
      <div className="px-4 py-2.5 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-foreground text-sm">Recent Activity</h3>
            <p className="text-muted-foreground text-xs mt-0.5">
              Latest updates from all branches
            </p>
          </div>
          {criticalCount > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-destructive/10 rounded">
              <AlertCircle className="w-3 h-3" style={{ color: 'var(--destructive)' }} />
              <span className="text-xs" style={{ color: 'var(--destructive)' }}>
                {criticalCount} Critical
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
        {activities.map((activity) => {
          const Icon = getActivityIcon(activity.type);
          const color = getActivityColor(activity.type);

          return (
            <div
              key={activity.id}
              className={`px-4 py-2.5 hover:bg-accent/30 transition-colors relative ${
                activity.critical ? 'border-l-2' : ''
              }`}
              style={activity.critical ? { borderLeftColor: 'var(--destructive)' } : undefined}
            >
              <div className="flex gap-2.5">
                <div
                  className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${color}15` }}
                >
                  <Icon className="w-3.5 h-3.5" style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="text-foreground text-xs leading-tight">
                        {activity.title}
                      </h4>
                      <p className="text-muted-foreground text-[11px] mt-0.5 leading-tight">
                        {activity.description}
                      </p>
                      {activity.branch && (
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-[10px] text-muted-foreground">
                            {activity.branch}
                          </span>
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {activity.time}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="px-4 py-2 border-t border-border">
        <button className="text-xs text-primary hover:underline">
          View all activity
        </button>
      </div>
    </div>
  );
}