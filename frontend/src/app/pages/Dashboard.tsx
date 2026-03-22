import { SummaryCards } from '../components/dashboard/SummaryCards';
import { BranchTable } from '../components/dashboard/BranchTable';
import { RecentActivity } from '../components/dashboard/RecentActivity';
import { Filter, Download, RefreshCw } from 'lucide-react';

export function Dashboard() {
  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-foreground text-lg mb-0.5">Dashboard</h1>
          <p className="text-muted-foreground text-xs">
            Monitor and manage laboratory operations across all branches
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="h-8 px-2.5 flex items-center gap-1.5 bg-card border border-border rounded hover:bg-accent transition-colors text-xs">
            <Filter className="w-3.5 h-3.5" />
            Filter
          </button>
          <button className="h-8 px-2.5 flex items-center gap-1.5 bg-card border border-border rounded hover:bg-accent transition-colors text-xs">
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
          <button className="h-8 px-2.5 flex items-center gap-1.5 bg-primary text-white rounded hover:opacity-90 transition-opacity text-xs">
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <SummaryCards />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Branch Table - Takes up 2 columns on xl screens */}
        <div className="xl:col-span-2">
          <BranchTable />
        </div>

        {/* Recent Activity - Takes up 1 column */}
        <div className="xl:col-span-1">
          <RecentActivity />
        </div>
      </div>
    </div>
  );
}