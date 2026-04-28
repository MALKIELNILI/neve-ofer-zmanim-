'use client';

export type FilterKey = '' | 'שחרית' | 'מנחה' | 'ערבית' | 'שבת' | 'שיעורי תורה';

const TABS: { key: FilterKey; icon: string }[] = [
  { key: '',              icon: '🕍'  },
  { key: 'שחרית',        icon: '🌅'  },
  { key: 'מנחה',         icon: '🌇'  },
  { key: 'ערבית',        icon: '🌙'  },
  { key: 'שבת',          icon: '✡️'  },
  { key: 'שיעורי תורה', icon: '📚'  },
];

interface Props { value: FilterKey; onChange: (k: FilterKey) => void }

export function PrayerFilter({ value, onChange }: Props) {
  return (
    <div className="flex justify-center gap-2 flex-wrap px-4 pb-4">
      {TABS.map(t => (
        <button
          key={t.key || 'all'}
          onClick={() => onChange(t.key)}
          className={`flex flex-col items-center gap-1 px-4 py-2.5 rounded-2xl border transition-all text-xs font-medium ${
            value === t.key
              ? 'bg-gold-500/25 border-gold-400/70 text-gold-200 shadow-lg shadow-gold-900/20 scale-105'
              : 'border-navy-600/60 text-slate-400 hover:border-gold-600/40 hover:text-slate-200 bg-navy-800/40'
          }`}
        >
          <span className="text-xl">{t.icon}</span>
          <span>{t.key || 'הכל'}</span>
        </button>
      ))}
    </div>
  );
}
