'use client';

import { useState, useEffect } from 'react';
import SunCalc from 'suncalc';

const LAT = 32.047;
const LNG  = 34.773;

const OMER_TEXTS: string[] = [
  'היום יום אחד לעומר',
  'היום שני ימים לעומר',
  'היום שלשה ימים לעומר',
  'היום ארבעה ימים לעומר',
  'היום חמשה ימים לעומר',
  'היום ששה ימים לעומר',
  'היום שבעה ימים שהם שבוע אחד לעומר',
  'היום שמונה ימים שהם שבוע אחד ויום אחד לעומר',
  'היום תשעה ימים שהם שבוע אחד ושני ימים לעומר',
  'היום עשרה ימים שהם שבוע אחד ושלשה ימים לעומר',
  'היום אחד עשר יום שהם שבוע אחד וארבעה ימים לעומר',
  'היום שנים עשר יום שהם שבוע אחד וחמשה ימים לעומר',
  'היום שלשה עשר יום שהם שבוע אחד וששה ימים לעומר',
  'היום ארבעה עשר יום שהם שני שבועות לעומר',
  'היום חמשה עשר יום שהם שני שבועות ויום אחד לעומר',
  'היום ששה עשר יום שהם שני שבועות ושני ימים לעומר',
  'היום שבעה עשר יום שהם שני שבועות ושלשה ימים לעומר',
  'היום שמונה עשר יום שהם שני שבועות וארבעה ימים לעומר',
  'היום תשעה עשר יום שהם שני שבועות וחמשה ימים לעומר',
  'היום עשרים יום שהם שני שבועות וששה ימים לעומר',
  'היום אחד ועשרים יום שהם שלשה שבועות לעומר',
  'היום שנים ועשרים יום שהם שלשה שבועות ויום אחד לעומר',
  'היום שלשה ועשרים יום שהם שלשה שבועות ושני ימים לעומר',
  'היום ארבעה ועשרים יום שהם שלשה שבועות ושלשה ימים לעומר',
  'היום חמשה ועשרים יום שהם שלשה שבועות וארבעה ימים לעומר',
  'היום ששה ועשרים יום שהם שלשה שבועות וחמשה ימים לעומר',
  'היום שבעה ועשרים יום שהם שלשה שבועות וששה ימים לעומר',
  'היום שמונה ועשרים יום שהם ארבעה שבועות לעומר',
  'היום תשעה ועשרים יום שהם ארבעה שבועות ויום אחד לעומר',
  'היום שלשים יום שהם ארבעה שבועות ושני ימים לעומר',
  'היום אחד ושלשים יום שהם ארבעה שבועות ושלשה ימים לעומר',
  'היום שנים ושלשים יום שהם ארבעה שבועות וארבעה ימים לעומר',
  'היום שלשה ושלשים יום שהם ארבעה שבועות וחמשה ימים לעומר',
  'היום ארבעה ושלשים יום שהם ארבעה שבועות וששה ימים לעומר',
  'היום חמשה ושלשים יום שהם חמשה שבועות לעומר',
  'היום ששה ושלשים יום שהם חמשה שבועות ויום אחד לעומר',
  'היום שבעה ושלשים יום שהם חמשה שבועות ושני ימים לעומר',
  'היום שמונה ושלשים יום שהם חמשה שבועות ושלשה ימים לעומר',
  'היום תשעה ושלשים יום שהם חמשה שבועות וארבעה ימים לעומר',
  'היום ארבעים יום שהם חמשה שבועות וחמשה ימים לעומר',
  'היום אחד וארבעים יום שהם חמשה שבועות וששה ימים לעומר',
  'היום שנים וארבעים יום שהם ששה שבועות לעומר',
  'היום שלשה וארבעים יום שהם ששה שבועות ויום אחד לעומר',
  'היום ארבעה וארבעים יום שהם ששה שבועות ושני ימים לעומר',
  'היום חמשה וארבעים יום שהם ששה שבועות ושלשה ימים לעומר',
  'היום ששה וארבעים יום שהם ששה שבועות וארבעה ימים לעומר',
  'היום שבעה וארבעים יום שהם ששה שבועות וחמשה ימים לעומר',
  'היום שמונה וארבעים יום שהם ששה שבועות וששה ימים לעומר',
  'היום תשעה וארבעים יום שהם שבעה שבועות לעומר',
];

function getTzaitMs(date: Date): number {
  const times = SunCalc.getTimes(date, LAT, LNG);
  return times.sunset.getTime() + 18 * 60 * 1000;
}

function getHalachicDate(now: Date): Date {
  if (now.getTime() >= getTzaitMs(now)) {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    return d;
  }
  return now;
}

function calcOmerDay(date: Date): number {
  try {
    const parts = new Intl.DateTimeFormat('en-u-ca-hebrew', {
      month: 'long', day: 'numeric', timeZone: 'Asia/Jerusalem',
    }).formatToParts(date);
    const month = parts.find(p => p.type === 'month')?.value ?? '';
    const day   = parseInt(parts.find(p => p.type === 'day')?.value ?? '0', 10);
    if (month === 'Nisan' && day >= 16)                   return day - 15;
    if (month === 'Iyyar' || month === 'Iyar')            return 15 + day;
    if (month === 'Sivan' && day <= 5)                    return 44 + day;
  } catch { /* no-op */ }
  return 0;
}

function fmtTime(ms: number): string {
  return new Date(ms).toLocaleTimeString('he-IL', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jerusalem', hour12: false,
  });
}

export function OmerSection() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  // Precise re-render at tzait so the count flips immediately
  useEffect(() => {
    if (!now) return;
    const msLeft = getTzaitMs(now) - now.getTime();
    if (msLeft > 0 && msLeft < 24 * 3600_000) {
      const t = setTimeout(() => setNow(new Date()), msLeft + 800);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now?.toDateString()]);

  if (!now) return null;

  const tzaitMs      = getTzaitMs(now);
  const isAfterTzait = now.getTime() >= tzaitMs;
  const omerDay      = calcOmerDay(getHalachicDate(now));

  if (omerDay === 0) return null;

  const omerText    = OMER_TEXTS[omerDay - 1];
  const isTimeToCnt = isAfterTzait && now.getTime() - tzaitMs < 2 * 3600_000;
  const weeks       = Math.floor((omerDay - 1) / 7);

  return (
    <section className="mx-4 mb-4">
      <div className={`relative bg-navy-700 rounded-2xl border overflow-hidden transition-shadow ${
        isTimeToCnt ? 'border-gold-400/60 shadow-lg shadow-gold-500/10' : 'border-gold-600/20'
      }`}>
        <div className="h-0.5 bg-gradient-to-l from-gold-600/0 via-gold-500/50 to-gold-600/0" />

        <div className="px-4 py-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-gold-400 font-bold text-base">🌾 ספירת העומר</h2>
            {isTimeToCnt && (
              <span className="text-[11px] text-gold-300 font-semibold animate-pulse bg-gold-400/10 border border-gold-400/30 rounded-full px-2.5 py-0.5">
                ✨ זמן ספירה!
              </span>
            )}
          </div>

          {/* Day number + text */}
          <div className="flex items-center gap-3">
            <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center border ${
              isTimeToCnt ? 'border-gold-400/70 bg-gold-400/10' : 'border-gold-600/30 bg-navy-800'
            }`}>
              <span className={`text-2xl font-black tabular-nums ${isTimeToCnt ? 'text-gold-200' : 'text-gold-400'}`}>
                {omerDay}
              </span>
            </div>
            <p className={`text-sm font-semibold leading-snug flex-1 ${isTimeToCnt ? 'text-gold-200' : 'text-slate-200'}`}>
              {omerText}
            </p>
          </div>

          {/* Progress bar */}
          <div className="mt-3">
            <div className="h-1.5 bg-navy-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-l from-gold-400 to-gold-600 transition-all duration-500"
                style={{ width: `${(omerDay / 49) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-600 mt-0.5 px-0.5">
              <span>{omerDay} / 49</span>
              {weeks > 0 && <span>{weeks} שבועות מלאים</span>}
            </div>
          </div>

          {/* Footer: count reminder or done */}
          {!isAfterTzait && (
            <p className="text-center text-slate-500 text-xs mt-2">
              ספירה הלילה בשעה {fmtTime(tzaitMs)}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
