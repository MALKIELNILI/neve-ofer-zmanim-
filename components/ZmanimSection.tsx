'use client';

import { useEffect, useState, useMemo } from 'react';
import { zmanimFromJson, formatTime, type DayZmanim } from '@/lib/zmanim';
import { CountdownTimer } from './CountdownTimer';

interface ZRow { label: string; sub?: string; time: Date; highlight?: boolean; timer?: boolean; past?: boolean; candle?: boolean }

function buildRows(z: DayZmanim, now: number): ZRow[] {
  const isPast = (t: Date) => t.getTime() < now - 90_000;
  return [
    { label: 'עלות השחר',   time: z.alotHashachar },
    { label: 'זריחה',        time: z.sunrise },
    { label: 'סוף ק"ש מג"א', time: z.sofZmanShmaMGA, highlight: true, timer: true, sub: 'לחומרא' },
    { label: 'סוף ק"ש גר"א', time: z.sofZmanShmaGRA, highlight: true, timer: true },
    { label: 'חצות היום',   time: z.chatzot },
    { label: 'מנחה גדולה',  time: z.minchaGedola },
    { label: 'מנחה קטנה',   time: z.minchaKetana },
    { label: 'פלג המנחה',   time: z.plagHaMincha },
    { label: 'שקיעה',        time: z.sunset },
    ...(z.candleLighting ? [{ label: 'הדלקת נרות שבת', time: z.candleLighting, candle: true, sub: '20 דקות לפני שקיעה' }] : []),
    { label: z.isShabbat ? 'צאת שבת'     : 'צאת הכוכבים', time: z.tzait,       sub: '18 דקות' },
    { label: z.isShabbat ? 'צאת שבת ר"ת' : 'צאת ר"ת',     time: z.tzaitRT,     sub: '72 דקות' },
    { label: 'חצות הלילה',  time: z.chatzotLayla, sub: 'אמצע הלילה' },
  ].map(r => ({ ...r, past: isPast(r.time) }));
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d); r.setDate(r.getDate() + n); return r;
}
function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}
function dayLabel(d: Date): string {
  const today = new Date();
  if (isSameDay(d, today)) return 'היום';
  if (isSameDay(d, addDays(today, 1))) return 'מחר';
  if (isSameDay(d, addDays(today, -1))) return 'אתמול';
  return d.toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'numeric', timeZone: 'Asia/Jerusalem' });
}

export function ZmanimSection() {
  const [selDate, setSelDate] = useState(new Date());
  const [zmanim,  setZmanim]  = useState<DayZmanim | null>(null);
  const [now, setNow]         = useState(Date.now());
  const [showAll, setShowAll] = useState(false);

  const isToday = isSameDay(selDate, new Date());

  useEffect(() => {
    setZmanim(null);
    const dateStr = selDate.toISOString().split('T')[0];
    fetch(`/api/zmanim?date=${dateStr}`)
      .then(r => r.json())
      .then(data => setZmanim(zmanimFromJson(data)))
      .catch(() => setZmanim(null));
  }, [selDate.toDateString()]);

  useEffect(() => {
    const id = setInterval(() => {
      setNow(Date.now());
      // Reset to today at midnight
      if (!isSameDay(selDate, new Date())) return;
    }, 30_000);
    return () => clearInterval(id);
  }, []);

  const allRows  = useMemo(() => zmanim ? buildRows(zmanim, isToday ? now : 0) : [], [zmanim, now, isToday]);
  const visible  = useMemo(() => showAll || !isToday ? allRows : allRows.filter(r => !r.past), [allRows, showAll, isToday]);
  const pastCount = allRows.filter(r => r.past).length;
  const allPast  = isToday && !!zmanim && visible.length === 0;

  return (
    <section className="mx-4 mb-6">
      <div className="bg-navy-700 rounded-2xl border border-gold-600/20 overflow-hidden">

        {/* Header with date navigation */}
        <div className="px-4 pt-3 pb-2 border-b border-gold-600/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-gold-400 font-bold text-lg">⏰ זמני היום</h2>
              <a
                href="https://maor.orhachaim.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-500 text-xs hover:text-gold-400 transition-colors"
              >
                לוח אור החיים · נווה עופר ↗
              </a>
            </div>
            {isToday && pastCount > 0 && (
              <button onClick={() => setShowAll(s => !s)}
                className={`text-xs border rounded-full px-3 py-1.5 transition-colors ${showAll ? 'border-gold-400/50 text-gold-400 bg-gold-400/10' : 'border-slate-700 text-slate-500 hover:border-slate-500'}`}>
                {showAll ? '🙈 הסתר שעברו' : `👁 הצג הכל (${pastCount})`}
              </button>
            )}
          </div>

          {/* Date navigation */}
          <div className="flex items-center justify-center gap-2 mt-2">
            <button onClick={() => setSelDate(d => addDays(d, -1))}
              className="text-slate-500 hover:text-white w-7 h-7 flex items-center justify-center rounded-lg hover:bg-navy-600 transition-colors text-lg">
              ←
            </button>
            <span className={`text-sm font-semibold px-3 py-1 rounded-lg ${isToday ? 'text-gold-400 bg-gold-400/10' : 'text-slate-300 bg-navy-800'}`}>
              {dayLabel(selDate)}
              {zmanim && <span className="text-slate-500 text-xs mr-2">{zmanim.hebrewDate.split(' ').slice(0,2).join(' ')}</span>}
            </span>
            <button onClick={() => setSelDate(d => addDays(d, 1))}
              className="text-slate-500 hover:text-white w-7 h-7 flex items-center justify-center rounded-lg hover:bg-navy-600 transition-colors text-lg">
              →
            </button>
            {!isToday && (
              <button onClick={() => setSelDate(new Date())}
                className="text-xs text-gold-500 hover:text-gold-300 border border-gold-600/30 rounded-lg px-2 py-1 transition-colors">
                היום
              </button>
            )}
          </div>
        </div>

        <div className="p-3">
          {!zmanim && (
            <div className="space-y-2">{[...Array(6)].map((_, i) => <div key={i} className="h-10 bg-navy-600 rounded animate-pulse" />)}</div>
          )}

          {allPast && (
            <div className="text-center py-4">
              <p className="text-slate-500 text-sm">✡️ כל זמני היום עברו — לילה טוב</p>
              <button onClick={() => setShowAll(true)} className="text-xs text-slate-600 hover:text-slate-400 mt-2">הצג את כל הזמנים</button>
            </div>
          )}

          {/* Group by section */}
          {zmanim && visible.length > 0 && (() => {
            const groups = [
              visible.filter(r => ['עלות השחר','זריחה'].includes(r.label)),
              visible.filter(r => r.label.includes('ק"ש')),
              visible.filter(r => ['חצות היום','מנחה גדולה','מנחה קטנה','פלג המנחה'].includes(r.label)),
              visible.filter(r => ['שקיעה','הדלקת נרות שבת'].includes(r.label)),
              visible.filter(r => r.label.includes('צאת') || r.label === 'חצות הלילה'),
            ].filter(g => g.length > 0);

            return groups.map((group, gi) => (
              <div key={gi}>
                {gi > 0 && <div className="my-1.5 border-t border-gold-600/10" />}
                {/* Special box for sof zman shema */}
                {group[0]?.label.includes('ק"ש') ? (
                  <div className="bg-navy-800/60 rounded-xl border border-gold-600/20 p-2">
                    <p className="text-gold-500 text-xs font-semibold px-1 mb-1">סוף זמן קריאת שמע</p>
                    {group.map((row, ri) => <ZRowItem key={ri} row={row} />)}
                  </div>
                ) : (
                  group.map((row, ri) => <ZRowItem key={ri} row={row} />)
                )}
              </div>
            ));
          })()}
        </div>
      </div>
    </section>
  );
}

function ZRowItem({ row }: { row: ZRow }) {
  return (
    <div className={`flex items-start justify-between py-2 px-3 rounded-lg transition-opacity ${row.past ? 'opacity-30' : ''} ${
      row.candle ? 'bg-amber-500/10 border border-amber-500/20 my-1' :
      row.label === 'חצות הלילה' ? 'bg-indigo-900/30 border border-indigo-500/20 my-1' :
      row.highlight ? 'hover:bg-gold-700/10' : 'hover:bg-navy-700/40'
    }`}>
      <div>
        <span className={`text-sm font-medium ${
          row.candle ? 'text-amber-300' :
          row.label === 'חצות הלילה' ? 'text-indigo-300' :
          row.highlight ? 'text-gold-300' :
          row.past ? 'text-slate-600' : 'text-slate-200'
        }`}>
          {row.candle && '🕯️ '}
          {row.label === 'חצות הלילה' && '🌙 '}
          {row.label}
          {row.past && <span className="text-slate-700 text-xs mr-1">עבר</span>}
        </span>
        {row.sub && <span className="text-xs text-slate-500 block">{row.sub}</span>}
        {row.timer && !row.past && <CountdownTimer targetTime={row.time} label={row.label} />}
      </div>
      <span className={`text-lg font-bold tabular-nums ${
        row.candle ? 'text-amber-300' :
        row.label === 'חצות הלילה' ? 'text-indigo-300' :
        row.highlight ? 'text-gold-300' :
        row.past ? 'text-slate-700' : 'text-white'
      }`}>
        {formatTime(row.time)}
      </span>
    </div>
  );
}
