'use client';

import { useState, useEffect } from 'react';
import { loadYahrzeits, saveYahrzeits, getTodayHebrewMonthDay, HEBREW_MONTHS, type Yahrzeit } from '@/lib/yahrzeits';

export function YahreitBanner({ isAdmin }: { isAdmin: boolean }) {
  const [all, setAll]         = useState<Yahrzeit[]>([]);
  const [today, setToday]     = useState<{ monthName: string; day: number } | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [newName, setNewName]   = useState('');
  const [newMonth, setNewMonth] = useState('');
  const [newDay, setNewDay]     = useState('');

  useEffect(() => {
    setAll(loadYahrzeits());
    setToday(getTodayHebrewMonthDay());
  }, []);

  const todayList = today
    ? all.filter(y => y.monthName && y.day > 0 && y.monthName === today.monthName && y.day === today.day)
    : [];

  const addYahrzeit = () => {
    if (!newName.trim() || !newMonth || !newDay) return;
    const next = [...all, { id: String(Date.now()), name: newName.trim(), monthName: newMonth, day: Number(newDay) }];
    setAll(next); saveYahrzeits(next);
    setNewName(''); setNewMonth(''); setNewDay('');
  };

  const remove = (id: string) => {
    const next = all.filter(y => y.id !== id);
    setAll(next); saveYahrzeits(next);
  };

  const update = (id: string, field: keyof Yahrzeit, val: string) => {
    const next = all.map(y => y.id === id ? { ...y, [field]: field === 'day' ? Number(val) : val } : y);
    setAll(next); saveYahrzeits(next);
  };

  return (
    <section className="mx-4 mb-5">

      {/* ── Banner row ── */}
      <div className={`rounded-xl border px-4 py-3 transition-all ${
        todayList.length > 0
          ? 'bg-gradient-to-l from-navy-800 to-navy-700/80 border-gold-500/40'
          : 'bg-navy-700/40 border-gold-600/15'
      }`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">🕯️</span>
              <p className="text-gold-400 text-xs font-bold tracking-wide">
                יום זיכרון היום
                {today?.day && today?.monthName
                  ? ` — ${today.day} ${today.monthName}`
                  : ''}
              </p>
            </div>

            {todayList.length > 0 ? (
              <div className="space-y-0.5 pr-7">
                {todayList.map((y, i) => (
                  <p key={i} className="text-white font-semibold text-sm leading-relaxed">
                    לעילוי נשמת <span className="text-gold-300">{y.name}</span>
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-slate-600 text-xs pr-7">אין יארצייטים היום</p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => document.getElementById('halacha-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-amber-500 hover:text-amber-300 text-xs border border-amber-700/40 hover:border-amber-500/60 rounded-lg px-2.5 py-1 transition-colors"
              title="עבור להלכה היומית">
              📜 הלכה
            </button>
            {isAdmin && (
              <button onClick={() => setShowAdmin(s => !s)}
                className="text-slate-600 hover:text-gold-500 text-xs border border-slate-700 hover:border-gold-600/40 rounded-lg px-2.5 py-1 transition-colors">
                {showAdmin ? '✕' : '✏️'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── הזמנה להקדשה ── */}
      <div className="mt-3 pt-3 border-t border-gold-600/10 text-center space-y-2">
        <p className="text-slate-300 text-sm leading-relaxed">
          ✨ ברצונך להקדיש יום לעילוי נשמת אחד מיקיריך?
        </p>
        <p className="text-slate-500 text-xs">
          שמו יוזכר בתפילה ובלוח השכונה — נשמח לתאם עמך
        </p>
        <a href="tel:0509766686"
          className="inline-flex items-center gap-2 bg-gold-500/15 border border-gold-500/35 text-gold-300 rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-gold-500/25 transition-colors">
          📞 לפרטים ויצירת קשר
        </a>
      </div>

      {/* ── Admin panel ── */}
      {showAdmin && (
        <div className="mt-2 bg-navy-700 border border-gold-600/20 rounded-xl p-4 space-y-3">
          <p className="text-gold-400 text-sm font-bold">ניהול ימי זיכרון</p>

          {/* List */}
          <div className="space-y-2 max-h-52 overflow-y-auto">
            {all.length === 0 && (
              <p className="text-slate-600 text-xs text-center py-2">אין רשומות — הוסף למטה</p>
            )}
            {all.map(y => (
              <div key={y.id} className="flex gap-2 items-center bg-navy-800/60 rounded-lg p-2.5">
                <input
                  value={y.name}
                  onChange={e => update(y.id, 'name', e.target.value)}
                  placeholder="שם הנפטר/ת"
                  className="flex-1 bg-transparent text-white text-sm outline-none min-w-0"
                />
                <select
                  value={y.monthName}
                  onChange={e => update(y.id, 'monthName', e.target.value)}
                  className="bg-navy-900 border border-gold-600/20 rounded-lg px-1.5 py-1 text-white text-xs shrink-0"
                >
                  <option value="">חודש</option>
                  {HEBREW_MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <input
                  type="number" min={1} max={30}
                  value={y.day || ''}
                  onChange={e => update(y.id, 'day', e.target.value)}
                  placeholder="יום"
                  className="w-12 bg-navy-900 border border-gold-600/20 rounded-lg px-1 py-1 text-white text-xs text-center"
                />
                <button onClick={() => remove(y.id)} className="text-slate-600 hover:text-red-400 px-1 text-base leading-none">×</button>
              </div>
            ))}
          </div>

          {/* Add row */}
          <div className="border-t border-gold-600/10 pt-3">
            <p className="text-slate-500 text-xs mb-2">הוספה חדשה</p>
            <div className="flex gap-2">
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addYahrzeit()}
                placeholder="שם הנפטר/ת"
                className="flex-1 bg-navy-800 border border-gold-600/25 rounded-lg px-3 py-2 text-white text-sm placeholder:text-slate-600"
              />
              <select
                value={newMonth}
                onChange={e => setNewMonth(e.target.value)}
                className="bg-navy-800 border border-gold-600/25 rounded-lg px-2 py-2 text-white text-sm shrink-0"
              >
                <option value="">חודש</option>
                {HEBREW_MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <input
                type="number" min={1} max={30}
                value={newDay}
                onChange={e => setNewDay(e.target.value)}
                placeholder="יום"
                className="w-14 bg-navy-800 border border-gold-600/25 rounded-lg px-2 py-2 text-white text-sm text-center"
              />
              <button
                onClick={addYahrzeit}
                className="bg-gold-500 hover:bg-gold-400 text-navy-900 font-bold rounded-lg px-3 py-2 text-sm transition-colors"
              >
                +
              </button>
            </div>
          </div>

          <p className="text-slate-700 text-xs leading-relaxed">
            הזן תאריך פטירה בלוח העברי. הבאנר יופיע אוטומטית ביום היארצייט.
          </p>
        </div>
      )}
    </section>
  );
}
