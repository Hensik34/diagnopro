import { useMemo } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { FileText, IndianRupee } from 'lucide-react';
import type { Report } from '../../../types';

interface SummaryCardsProps {
  selectedMonth: Date;
  reports: Report[];
}

export function SummaryCards({ selectedMonth, reports }: SummaryCardsProps) {
  const monthStats = useMemo(() => {
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    
    let totalReports = 0;
    let totalRevenue = 0;

    for (const report of reports) {
      const reportDate = new Date(report.created_at);
      if (reportDate >= monthStart && reportDate <= monthEnd) {
        totalReports += 1;
        totalRevenue += Number(report.report_amount) || 0;
      }
    }

    return { totalReports, totalRevenue };
  }, [selectedMonth, reports]);

  const cards = [
    {
      title: 'Total Reports',
      value: monthStats.totalReports,
      subtitle: `in ${format(selectedMonth, 'MMMM yyyy')}`,
      icon: FileText,
    },
    {
      title: 'Total Revenue',
      value: `₹${monthStats.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      subtitle: `in ${format(selectedMonth, 'MMMM yyyy')}`,
      icon: IndianRupee,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className="bg-card border border-border rounded p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground text-[11px] uppercase tracking-wide">
                {card.title}
              </span>
              <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </div>
            <div className="mb-2">
              <span className="text-foreground text-3xl tracking-tight tabular-nums font-semibold">
                {card.value}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <span className="text-muted-foreground">{card.subtitle}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
