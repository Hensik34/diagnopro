import { ArrowUp, ArrowDown } from 'lucide-react';

interface SummaryCard {
  title: string;
  value: string | number;
  change: number;
  changeLabel: string;
  type: 'default' | 'success' | 'warning' | 'danger';
}

const cards: SummaryCard[] = [
  {
    title: 'Today Cases',
    value: 248,
    change: 12.5,
    changeLabel: 'vs yesterday',
    type: 'default',
  },
  {
    title: 'Revenue',
    value: '$18,420',
    change: 8.2,
    changeLabel: 'vs yesterday',
    type: 'success',
  },
  {
    title: 'Pending Reports',
    value: 34,
    change: -15.3,
    changeLabel: 'vs yesterday',
    type: 'warning',
  },
  {
    title: 'Approved Reports',
    value: 214,
    change: 18.7,
    changeLabel: 'vs yesterday',
    type: 'success',
  },
];

const getTypeColor = (type: SummaryCard['type']) => {
  switch (type) {
    case 'success':
      return 'var(--success)';
    case 'warning':
      return 'var(--warning)';
    case 'danger':
      return 'var(--destructive)';
    default:
      return 'var(--primary)';
  }
};

export function SummaryCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => (
        <div
          key={card.title}
          className="bg-card border border-border rounded p-3"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground text-[11px] uppercase tracking-wide">
              {card.title}
            </span>
          </div>
          <div className="mb-1.5">
            <span className="text-foreground text-2xl tracking-tight">
              {card.value}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            {card.change >= 0 ? (
              <ArrowUp className="w-3 h-3" style={{ color: 'var(--success)' }} />
            ) : (
              <ArrowDown className="w-3 h-3" style={{ color: 'var(--destructive)' }} />
            )}
            <span
              style={{
                color: card.change >= 0 ? 'var(--success)' : 'var(--destructive)',
              }}
            >
              {Math.abs(card.change)}%
            </span>
            <span className="text-muted-foreground text-[10px] ml-0.5">
              {card.changeLabel}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}