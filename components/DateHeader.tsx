'use client';

import { useEffect, useState } from 'react';

export function DateHeader() {
  const [dates, setDates] = useState({ hebrew: '', gregorian: '', day: '', time: '' });

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const tz = 'Asia/Jerusalem';

      const hebrewFormatter = new Intl.DateTimeFormat('he-u-ca-hebrew', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: tz,
      });

      const timeFormatter = new Intl.DateTimeFormat('he-IL', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: tz,
        hour12: false,
      });

      const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
      const dayName = `יום ${days[now.getDay()]}`;

      setDates({
        hebrew: hebrewFormatter.format(now),
        gregorian: now.toLocaleDateString('he-IL', { timeZone: tz }),
        day: dayName,
        time: timeFormatter.format(now),
      });
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mx-4 mb-5">
      <div className="bg-navy-700 rounded-xl border border-gold-600/20 px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-white font-semibold text-sm">{dates.day}</p>
          <p className="text-gold-400 text-base font-bold">{dates.hebrew}</p>
          <p className="text-slate-500 text-xs mt-0.5">{dates.gregorian}</p>
        </div>
        <div className="text-right">
          <p className="text-white font-mono text-2xl font-bold tracking-wider">{dates.time}</p>
        </div>
      </div>
    </div>
  );
}
