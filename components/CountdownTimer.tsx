'use client';

import { useEffect, useState } from 'react';

interface Props {
  targetTime: Date;
  label: string;
}

export function CountdownTimer({ targetTime, label }: Props) {
  const [remaining, setRemaining] = useState(targetTime.getTime() - Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(targetTime.getTime() - Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [targetTime]);

  const past = remaining <= 0;
  const urgent = !past && remaining < 4 * 60 * 1000;
  const warning = !past && remaining < 30 * 60 * 1000;

  const format = (ms: number) => {
    if (ms <= 0) return 'עבר הזמן';
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const colorClass = past
    ? 'text-gray-500'
    : urgent
    ? 'text-red-400 animate-pulse-red'
    : warning
    ? 'text-yellow-400'
    : 'text-emerald-400';

  return (
    <div className="flex items-center gap-2 mt-1">
      {urgent && !past && (
        <span className="text-red-400 text-xs font-bold animate-pulse-red">⚠️</span>
      )}
      <span className={`text-xs font-mono tracking-wider ${colorClass}`}>
        {past ? 'עבר הזמן' : `עוד ${format(remaining)}`}
      </span>
    </div>
  );
}
