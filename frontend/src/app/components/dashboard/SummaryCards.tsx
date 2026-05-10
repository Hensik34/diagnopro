import { useMemo } from 'react';
import { format, startOfMonth, endOfMonth, isSameMonth } from 'date-fns';
import type { Report } from '../../../types';

interface SummaryCard {
  title: string;
  value: string | number;
  subtitle: string;
  type: 'default' | 'success' | 'warning' | 'danger';
}

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

  const cards: SummaryCard[] = [
    {
      title: 'Total Reports',
      value: monthStats.totalReports,
      subtitle: `in ${format(selectedMonth, 'MMMM yyyy')}`,
      type: 'default',
    },
    {
      title: 'Total Revenue',
      value: `₹${monthStats.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      subtitle: `in ${format(selectedMonth, 'MMMM yyyy')}`,
      type: 'success',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {cards.map((card) => (
        <div
          key={card.title}
          className="bg-card border border-border rounded p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground text-[11px] uppercase tracking-wide">
              {card.title}
            </span>
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
      ))}
    </div>
  );
}
