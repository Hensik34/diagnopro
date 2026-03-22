import { MoreVertical } from 'lucide-react';

interface Branch {
  id: string;
  name: string;
  location: string;
  todayCases: number;
  pendingReports: number;
  revenue: number;
  status: 'operational' | 'busy' | 'critical';
  occupancy: number;
}

const branches: Branch[] = [
  {
    id: 'BR-001',
    name: 'Central Lab - Downtown',
    location: 'New York, NY',
    todayCases: 89,
    pendingReports: 12,
    revenue: 6420,
    status: 'operational',
    occupancy: 72,
  },
  {
    id: 'BR-002',
    name: 'North Branch',
    location: 'Brooklyn, NY',
    todayCases: 67,
    pendingReports: 8,
    revenue: 4890,
    status: 'operational',
    occupancy: 58,
  },
  {
    id: 'BR-003',
    name: 'West Side Laboratory',
    location: 'Manhattan, NY',
    todayCases: 52,
    pendingReports: 9,
    revenue: 3780,
    status: 'busy',
    occupancy: 85,
  },
  {
    id: 'BR-004',
    name: 'East Medical Center',
    location: 'Queens, NY',
    todayCases: 40,
    pendingReports: 5,
    revenue: 2330,
    status: 'operational',
    occupancy: 45,
  },
];

const getStatusBadge = (status: Branch['status']) => {
  const styles = {
    operational: {
      bg: 'var(--success)',
      text: 'var(--success-foreground)',
    },
    busy: {
      bg: 'var(--warning)',
      text: 'var(--warning-foreground)',
    },
    critical: {
      bg: 'var(--destructive)',
      text: 'var(--destructive-foreground)',
    },
  };

  const style = styles[status];

  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide"
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      {status}
    </span>
  );
};

export function BranchTable() {
  return (
    <div className="bg-card border border-border rounded">
      <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="text-foreground text-sm">Branch Overview</h3>
          <p className="text-muted-foreground text-xs mt-0.5">
            Real-time status across all diagnostic centers
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-success"></div>
            <span className="text-muted-foreground">3 Operational</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-warning"></div>
            <span className="text-muted-foreground">1 Busy</span>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">
                Branch ID
              </th>
              <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">
                Branch Name
              </th>
              <th className="px-3 py-2 text-left text-muted-foreground text-[10px] uppercase tracking-wider">
                Location
              </th>
              <th className="px-3 py-2 text-right text-muted-foreground text-[10px] uppercase tracking-wider">
                Cases
              </th>
              <th className="px-3 py-2 text-right text-muted-foreground text-[10px] uppercase tracking-wider">
                Pending
              </th>
              <th className="px-3 py-2 text-right text-muted-foreground text-[10px] uppercase tracking-wider">
                Revenue
              </th>
              <th className="px-3 py-2 text-right text-muted-foreground text-[10px] uppercase tracking-wider">
                Occupancy
              </th>
              <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider">
                Status
              </th>
              <th className="px-3 py-2 text-center text-muted-foreground text-[10px] uppercase tracking-wider w-12">
                
              </th>
            </tr>
          </thead>
          <tbody>
            {branches.map((branch) => (
              <tr
                key={branch.id}
                className="border-b border-border last:border-b-0 hover:bg-accent/30 transition-colors"
              >
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  {branch.id}
                </td>
                <td className="px-3 py-2 text-xs text-foreground">
                  {branch.name}
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  {branch.location}
                </td>
                <td className="px-3 py-2 text-xs text-foreground text-right tabular-nums">
                  {branch.todayCases}
                </td>
                <td className="px-3 py-2 text-xs text-foreground text-right tabular-nums">
                  {branch.pendingReports}
                </td>
                <td className="px-3 py-2 text-xs text-foreground text-right tabular-nums">
                  ${branch.revenue.toLocaleString()}
                </td>
                <td className="px-3 py-2 text-xs text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <div className="w-12 h-1 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${branch.occupancy}%`,
                          backgroundColor:
                            branch.occupancy > 80
                              ? 'var(--destructive)'
                              : branch.occupancy > 60
                              ? 'var(--warning)'
                              : 'var(--success)',
                        }}
                      />
                    </div>
                    <span className="text-muted-foreground text-[10px] w-7 tabular-nums">
                      {branch.occupancy}%
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2 text-center">
                  {getStatusBadge(branch.status)}
                </td>
                <td className="px-3 py-2 text-center">
                  <button
                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-accent transition-colors"
                    aria-label="More actions"
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}