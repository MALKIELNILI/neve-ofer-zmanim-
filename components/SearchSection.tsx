'use client';

import { useState, useMemo, useEffect } from 'react';
import { calculateDayZmanim, formatTime, type DayZmanim } from '@/lib/zmanim';
import { PrayerFilter, type FilterKey } from './PrayerFilter';
import type { Synagogue, PrayerSlot, Shiur } from '@/lib/synagogues';

function fmtRav(name: string): string {
  if (!name) return '';
  let n = name.trim();
  if (!n.startsWith('הרב') && !n.startsWith('הרבנית') && !n.startsWith('רב ')) n = 'הרב ' + n;
  if (!n.includes('שליט') && !n.includes('זצ') && !n.includes('זכ')) n += ' שליט"א';
  return n;
}

// ── shiur helpers ─────────────────────────────────────────────────────────
const DAY_LETTERS: Record<string, number> = { 'א': 0, 'ב': 1, 'ג': 2, 'ד': 3, 'ה': 4, 'ו': 5 };
const DAY_NAMES_HE = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];

function parseDays(schedule: string): number[] {
  const days = new Set<number>();
  if (schedule.includes('שבת')) days.add(6);
  const range = schedule.match(/([א-ה])[''׳]?\s*[-–—]\s*([א-ה])[''׳]?/);
  if (range) {
    const s = DAY_LETTERS[range[1]] ?? -1;
    const e = DAY_LETTERS[range[2]] ?? -1;
    if (s >= 0 && e >= 0) for (let d = s; d <= e; d++) days.add(d);
  }
  for (const [k, v] of Object.entries(DAY_LETTERS)) {
    if (new RegExp(`${k}[''׳]`).test(schedule)) days.add(v);
  }
  return Array.from(days);
}

const toMins = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

interface ShiurEntry { synagogue: Synagogue; shiur: Shiur; minsFromNow: number; }

function buildTodayShiurim(synagogues: Synagogue[], nowMins: number, dow: number): ShiurEntry[] {
  const result: ShiurEntry[] = [];
  for (const syn of synagogues) {
    for (const sh of syn.shiurim) {
      const days = parseDays(sh.schedule);
      if (!days.includes(dow)) continue;
      if (!sh.time) continue;
      const shiurMins = toMins(sh.time);
      if (shiurMins < nowMins - 10) continue; // עברו יותר מ-10 דק
      result.push({ synagogue: syn, shiur: sh, minsFromNow: shiurMins - nowMins });
    }
  }
  return result.sort((a, b) => a.minsFromNow - b.minsFromNow);
}

const PRAYER_HE: Record<string, string> = {
  shacharit: 'שחרית', mincha: 'מנחה', maariv: 'ערבית',
  kabbalatShabbat: 'קבלת שבת', shacharitShabbat: 'שחרית שבת',
  minchaErevShabbat: 'מנחה ערב שבת',
};

const ZMANIM_KEYS: Record<string, keyof DayZmanim> = {
  'עלות השחר': 'alotHashachar', 'עלות': 'alotHashachar',
  'זריחה': 'sunrise', 'נץ': 'sunrise',
  'מנחה גדולה': 'minchaGedola', 'מנחה קטנה': 'minchaKetana',
  'פלג המנחה': 'plagHaMincha', 'פלג': 'plagHaMincha',
  'חצות': 'chatzot', 'חצות היום': 'chatzot',
  'שקיעה': 'sunset',
  'צאת הכוכבים': 'tzait', 'צאת': 'tzait',
  'גרא': 'sofZmanShmaGRA', 'מגא': 'sofZmanShmaMGA',
};

const PRAYER_MATCH: Record<string, string[]> = {
  'שחרית': ['shacharit'], 'מנחה': ['mincha'],
  'ערבית': ['maariv'], 'מעריב': ['maariv'],
  'קבלת שבת': ['kabbalatShabbat'],
};

interface PrayerEntry {
  synagogue: Synagogue;
  prayerKey: string;
  prayerName: string;
  time: string;
  desc: string;
  mins: number;
  isShabbat: boolean;
}

function parseMs(t: string): number {
  const [h, m] = t.split(':').map(Number);
  const d = new Date(); d.setHours(h, m, 0, 0); return d.getTime();
}
const minsFromNow = (t: string) => (parseMs(t) - Date.now()) / 60000;

function fmtMins(m: number) {
  if (Math.abs(m) < 1) return 'עכשיו';
  if (m < 0 && m > -120) return `לפני ${Math.round(-m)} דק'`;
  if (m < 0) return 'עבר';
  if (m < 60) return `בעוד ${Math.round(m)} דק'`;
  return `בעוד ${Math.floor(m / 60)}:${String(Math.round(m % 60)).padStart(2, '0')}`;
}
function minsColor(m: number) {
  if (Math.abs(m) < 5) return 'text-emerald-400 font-bold';
  if (m < 0) return 'text-slate-500';
  if (m < 30) return 'text-yellow-400';
  return 'text-slate-400';
}

function buildAllPrayers(synagogues: Synagogue[], shabbat: boolean): PrayerEntry[] {
  const out: PrayerEntry[] = [];
  for (const syn of synagogues) {
    const sides = [
      { isShabbat: false, prayers: [
        { key: 'shacharit', slots: syn.weekday.shacharit },
        { key: 'mincha',    slots: syn.weekday.mincha },
        { key: 'maariv',    slots: syn.weekday.maariv },
      ]},
      { isShabbat: true, prayers: [
        { key: 'minchaErevShabbat', slots: syn.shabbat.minchaErevShabbat ?? [] },
        { key: 'kabbalatShabbat',   slots: syn.shabbat.kabbalatShabbat },
        { key: 'shacharit',         slots: syn.shabbat.shacharit },
        { key: 'mincha',            slots: syn.shabbat.mincha },
        { key: 'maariv',            slots: syn.shabbat.maariv },
      ]},
    ];
    for (const { isShabbat, prayers } of sides) {
      for (const { key, slots } of prayers) {
        for (const slot of (slots ?? [])) {
          if (slot.time) out.push({ synagogue: syn, prayerKey: key, prayerName: PRAYER_HE[key] ?? key, time: slot.time, desc: slot.desc, mins: minsFromNow(slot.time), isShabbat });
        }
      }
    }
    for (const sh of syn.shiurim) {
      if (sh.time) out.push({ synagogue: syn, prayerKey: 'shiur', prayerName: sh.name || 'שיעור', time: sh.time, desc: sh.schedule, mins: minsFromNow(sh.time), isShabbat: false });
    }
  }
  return out;
}

function Row({ label, sub, desc, time, mins, confirmed, selected, onClick }: {
  label: string; sub?: string; desc?: string; time: string; mins: number;
  confirmed?: boolean; selected?: boolean; onClick?: () => void;
}) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-2.5 border-t border-gold-600/10 first:border-0 text-right transition-colors ${onClick ? 'hover:bg-navy-600/40 cursor-pointer' : ''} ${selected ? 'bg-navy-600/30' : ''}`}
    >
      <div>
        <span className="text-white text-sm font-medium">{label}</span>
        {sub && <span className="text-slate-500 text-xs mr-1.5">{sub}</span>}
        {desc && <span className="text-xs text-gold-500 bg-gold-700/20 border border-gold-600/20 rounded px-1.5 mr-1">{desc}</span>}
        {confirmed && <span className="text-emerald-400 text-xs">✓</span>}
        {onClick && <span className="text-slate-600 text-xs mr-1">{selected ? ' ▲' : ' ▼'}</span>}
      </div>
      <div className="text-left ltr">
        <span className="text-white font-bold text-sm tabular-nums">{time}</span>
        <span className={`text-xs block ${minsColor(mins)}`}>{fmtMins(mins)}</span>
      </div>
    </Tag>
  );
}

const PRAYER_KEY_TO_LABEL: Record<string, { weekday?: keyof typeof dummyWeekday; shabbat?: keyof typeof dummyShabbat; heLabel: string }> = {
  shacharit:       { weekday: 'shacharit', shabbat: 'shacharit',       heLabel: 'שחרית'     },
  mincha:          { weekday: 'mincha',    shabbat: 'mincha',           heLabel: 'מנחה'      },
  maariv:          { weekday: 'maariv',    shabbat: 'maariv',           heLabel: 'ערבית'     },
  kabbalatShabbat: {                       shabbat: 'kabbalatShabbat',  heLabel: 'קבלת שבת' },
};
const dummyWeekday = { shacharit: [], mincha: [], maariv: [] };
const dummyShabbat = { kabbalatShabbat: [], shacharit: [], mincha: [], maariv: [] };

function SlotChip({ label, time, desc, highlight }: { label: string; time: string; desc?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg px-2.5 py-1.5 text-center min-w-[64px] ${highlight ? 'bg-gold-700/20 border border-gold-600/30' : 'bg-navy-700'}`}>
      <p className="text-slate-400 text-xs">{label}</p>
      <p className={`font-bold text-sm ${highlight ? 'text-gold-300' : 'text-white'}`}>{time}</p>
      {desc && <p className="text-gold-500 text-xs">{desc}</p>}
    </div>
  );
}

// prayerKey: מציג רק את התפילה הרלוונטית. undefined = הכל
function SynDetail({ syn, onClose, prayerKey, matchTime }: {
  syn: Synagogue; onClose: () => void; prayerKey?: string; matchTime?: string;
}) {
  const showAll = !prayerKey && !matchTime;

  // בנה רשימת slots לפי קונטקסט
  const relevantSlots: { label: string; time: string; desc?: string; highlight: boolean }[] = [];

  if (showAll || prayerKey === 'shacharit') {
    syn.weekday.shacharit.filter(s => s.time).forEach(s =>
      relevantSlots.push({ label: 'שחרית (חול)', time: s.time, desc: s.desc, highlight: matchTime === s.time }));
    syn.shabbat.shacharit.filter(s => s.time).forEach(s =>
      relevantSlots.push({ label: 'שחרית (שבת)', time: s.time, desc: s.desc, highlight: matchTime === s.time }));
  }
  if (showAll || prayerKey === 'mincha') {
    syn.weekday.mincha.filter(s => s.time).forEach(s =>
      relevantSlots.push({ label: 'מנחה (חול)', time: s.time, desc: s.desc, highlight: matchTime === s.time }));
    syn.shabbat.mincha.filter(s => s.time).forEach(s =>
      relevantSlots.push({ label: 'מנחה (שבת)', time: s.time, desc: s.desc, highlight: matchTime === s.time }));
  }
  if (showAll || prayerKey === 'maariv') {
    syn.weekday.maariv.filter(s => s.time).forEach(s =>
      relevantSlots.push({ label: 'ערבית (חול)', time: s.time, desc: s.desc, highlight: matchTime === s.time }));
    syn.shabbat.maariv.filter(s => s.time).forEach(s =>
      relevantSlots.push({ label: 'ערבית (שבת)', time: s.time, desc: s.desc, highlight: matchTime === s.time }));
  }
  if (showAll || prayerKey === 'kabbalatShabbat') {
    syn.shabbat.kabbalatShabbat.filter(s => s.time).forEach(s =>
      relevantSlots.push({ label: 'קבלת שבת', time: s.time, desc: s.desc, highlight: matchTime === s.time }));
  }
  // חיפוש לפי שעה — הצג כל slot שמתאים
  if (matchTime && !prayerKey) {
    const allSlots = [
      ...syn.weekday.shacharit.map(s => ({ label: 'שחרית (חול)', ...s })),
      ...syn.weekday.mincha.map(s =>    ({ label: 'מנחה (חול)',  ...s })),
      ...syn.weekday.maariv.map(s =>    ({ label: 'ערבית (חול)', ...s })),
      ...syn.shabbat.kabbalatShabbat.map(s => ({ label: 'קבלת שבת', ...s })),
      ...syn.shabbat.shacharit.map(s => ({ label: 'שחרית (שבת)', ...s })),
      ...syn.shabbat.mincha.map(s =>    ({ label: 'מנחה (שבת)',  ...s })),
      ...syn.shabbat.maariv.map(s =>    ({ label: 'ערבית (שבת)', ...s })),
    ].filter(s => s.time === matchTime);
    allSlots.forEach(s => relevantSlots.push({ label: s.label, time: s.time, desc: s.desc, highlight: true }));
  }

  return (
    <div className="border-t border-gold-600/20 bg-navy-800/80 p-3" dir="rtl">
      <div className="flex items-center justify-between mb-2">
        <p className="text-gold-300 font-bold text-sm">{syn.name}</p>
        <button onClick={onClose} className="text-slate-500 hover:text-white text-xl leading-none">×</button>
      </div>

      {syn.address && <p className="text-slate-400 text-xs mb-2">📍 {syn.address}</p>}

      <div className="flex gap-3 flex-wrap mb-3">
        {syn.rabbiName && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-400 text-xs">{fmtRav(syn.rabbiName)}</span>
            {syn.rabbiPhone && <a href={`tel:${syn.rabbiPhone}`} className="flex items-center gap-1 text-blue-400 text-xs bg-blue-900/20 border border-blue-700/30 rounded-lg px-2 py-0.5">📞 {syn.rabbiPhone}</a>}
          </div>
        )}
        {syn.gabbaiName && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-400 text-xs">גבאי {syn.gabbaiName}</span>
            {syn.gabbaiPhone && <a href={`tel:${syn.gabbaiPhone}`} className="flex items-center gap-1 text-blue-400 text-xs bg-blue-900/20 border border-blue-700/30 rounded-lg px-2 py-0.5">📞 {syn.gabbaiPhone}</a>}
          </div>
        )}
      </div>

      {relevantSlots.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {relevantSlots.map((s, i) => <SlotChip key={i} label={s.label} time={s.time} desc={s.desc} highlight={s.highlight} />)}
        </div>
      )}

      {showAll && syn.shiurim.length > 0 && (
        <>
          <p className="text-slate-500 text-xs font-semibold mb-1.5 mt-1">שיעורים</p>
          <div className="space-y-1">
            {syn.shiurim.map(sh => (
              <div key={sh.id} className="bg-navy-700 rounded-lg px-2.5 py-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-white text-xs font-medium">{sh.name}</span>
                  {sh.time && <span className="text-gold-400 text-xs font-bold">{sh.time}</span>}
                </div>
                {sh.schedule && <p className="text-slate-500 text-xs">{sh.schedule}</p>}
              </div>
            ))}
          </div>
        </>
      )}

      {syn.timesConfirmed && syn.timesUpdatedAt && (
        <p className="text-emerald-400 text-xs mt-2">✓ זמנים אושרו {new Date(syn.timesUpdatedAt).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' })}</p>
      )}
    </div>
  );
}


interface SearchProps {
  synagogues: Synagogue[];
  zmanim: DayZmanim | null;
  activeFilter: string;
  onFilterChange: (k: string) => void;
}

export function SearchSection({ synagogues, zmanim: zmanimProp, activeFilter, onFilterChange }: SearchProps) {
  const [query, setQuery] = useState('');
  const [zmanim, setZmanim] = useState<DayZmanim | null>(null);
  const [selectedSynId, setSelectedSynId] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const isShabbat = new Date().getDay() === 6;

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (activeFilter) setQuery(activeFilter);
    else if (!query || ['שחרית','מנחה','ערבית','שבת','שיעורי תורה'].includes(query)) setQuery('');
  }, [activeFilter]);

  useEffect(() => { setZmanim(zmanimProp ?? calculateDayZmanim(new Date())); }, [zmanimProp]);

  const allPrayers = useMemo(() => buildAllPrayers(synagogues, isShabbat), [synagogues, isShabbat]);

  const upcoming = useMemo(() =>
    allPrayers.filter(p => p.isShabbat === isShabbat && p.mins >= -10 && p.mins <= 120)
      .sort((a, b) => a.mins - b.mins).slice(0, 7),
    [allPrayers, isShabbat]);

  const results = useMemo(() => {
    const q = query.trim();
    if (!q) return null;

    if (/^\d{1,2}:\d{2}$/.test(q)) {
      const matches = allPrayers.filter(p => p.time === q.padStart(5, '0') || p.time === q);
      return { type: 'time', query: q, matches };
    }

    if (q === 'עכשיו' || q === 'קרוב') return { type: 'upcoming', matches: upcoming };

    if (q === 'שבת') {
      const matches = allPrayers.filter(p => p.isShabbat).sort((a, b) => a.time.localeCompare(b.time));
      return { type: 'prayer', label: 'תפילות שבת', matches };
    }

    const zmKey = Object.keys(ZMANIM_KEYS).sort((a, b) => b.length - a.length).find(k => q.includes(k));
    if (zmKey && zmanim) {
      const zmTime = zmanim[ZMANIM_KEYS[zmKey]] as Date;
      const zmMs   = zmTime.getTime();
      const nearby = allPrayers
        .filter(p => p.isShabbat === isShabbat && Math.abs(parseMs(p.time) - zmMs) < 75 * 60000)
        .sort((a, b) => Math.abs(parseMs(a.time) - zmMs) - Math.abs(parseMs(b.time) - zmMs))
        .slice(0, 8);
      return { type: 'zman', label: zmKey, zmTime, nearby };
    }

    // שיעורי תורה — מסונן לפי יום ושעה נוכחיים
    if (q === 'שיעורי תורה') {
      const now = new Date();
      const nowMins = now.getHours() * 60 + now.getMinutes();
      const dow = now.getDay();
      const entries = buildTodayShiurim(synagogues, nowMins, dow);
      return { type: 'shiurim', entries, dow, nowMins };
    }

    const pEntry = Object.entries(PRAYER_MATCH).sort((a, b) => b[0].length - a[0].length).find(([k]) => q === k);
    if (pEntry) {
      const [label, keys] = pEntry;
      const all = allPrayers.filter(p => p.isShabbat === isShabbat && keys.includes(p.prayerKey)).sort((a, b) => a.time.localeCompare(b.time));
      // מסנן לפי זמן — מהשעה הנוכחית ומעלה (סובלנות 10 דק')
      const upcoming = all.filter(p => p.mins >= -10);
      const matches = upcoming.length > 0 ? upcoming : all; // אם אין תפילות קרובות — הצג הכל
      return { type: 'prayer', label, matches, timeFiltered: upcoming.length > 0 };
    }

    const synMatches = synagogues.filter(s =>
      s.name.includes(q) ||
      (s.rabbiName && s.rabbiName.includes(q)) ||
      (s.gabbaiName && s.gabbaiName.includes(q)) ||
      (s.address && s.address.includes(q)) ||
      s.shiurim.some(sh => sh.name.includes(q) || sh.desc.includes(q) || sh.schedule.includes(q)) ||
      [...s.weekday.shacharit, ...s.weekday.mincha, ...s.weekday.maariv,
       ...s.shabbat.shacharit, ...s.shabbat.mincha, ...s.shabbat.maariv, ...s.shabbat.kabbalatShabbat]
        .some((sl: PrayerSlot) => sl.desc && sl.desc.includes(q))
    );
    if (synMatches.length > 0) return { type: 'synagogue', matches: synMatches };

    return { type: 'empty' };
  }, [query, allPrayers, synagogues, zmanim, upcoming, isShabbat]);

  const clearAll = () => { setQuery(''); onFilterChange(''); setSelectedSynId(null); };

  return (
    <section className="mx-4 mb-5">
      {/* Input */}
      <div className="relative flex items-center">
        <span className="absolute right-3 text-slate-400 pointer-events-none text-base">🔍</span>
        <input type="search" value={query} onChange={e => setQuery(e.target.value)} dir="rtl"
          placeholder="שם בכ&quot;נ, שם הרב, שחרית, מנחה גדולה, פלג, 19:30..."
          className="w-full bg-navy-700 border border-gold-600/25 focus:border-gold-400 rounded-xl px-4 py-3 pr-10 text-white placeholder:text-slate-500 outline-none text-sm transition-colors" />
        {query && <button onClick={clearAll} className="absolute left-3 text-slate-400 hover:text-white text-xl leading-none">×</button>}
      </div>

      {/* כפתורי סינון — צמודים לשדה החיפוש */}
      <div className="mt-2">
        <PrayerFilter value={activeFilter as FilterKey} onChange={k => { onFilterChange(k); setSelectedSynId(null); }} />
      </div>

      {/* Default upcoming — רק בצד לקוח כדי למנוע hydration mismatch */}
      {mounted && !query && upcoming.length > 0 && (
        <div className="bg-navy-700/70 rounded-xl border border-gold-600/15 overflow-hidden">
          <p className="text-gold-500 text-xs font-semibold px-3 pt-3 pb-1">⏰ עכשיו ובקרוב</p>
          {upcoming.map((p, i) => <Row key={i} label={p.synagogue.name} sub={p.prayerName} desc={p.desc || undefined} time={p.time} mins={p.mins} confirmed={p.synagogue.timesConfirmed} />)}
        </div>
      )}

      {/* Results */}
      {results && results.type !== 'empty' && (
        <div className="bg-navy-700/70 rounded-xl border border-gold-600/15 overflow-hidden">

          {results.type === 'zman' && <>
            <div className="px-3 py-2.5 bg-gold-700/10 border-b border-gold-600/20">
              <p className="text-gold-400 text-xs font-bold">{results.label as string}</p>
              <p className="text-white text-2xl font-extrabold tabular-nums">{zmanim ? formatTime(results.zmTime as Date) : '...'}</p>
            </div>
            {(results.nearby as PrayerEntry[]).length > 0 && <>
              <p className="text-slate-500 text-xs px-3 pt-2">מניינים קרובים לזמן זה:</p>
              {(() => { const seen = new Set<number>(); return (results.nearby as PrayerEntry[]).map((p, i) => { const first = !seen.has(p.synagogue.id); seen.add(p.synagogue.id); return (
                <div key={i}>
                  <Row label={p.synagogue.name} sub={p.prayerName} desc={p.desc || undefined} time={p.time} mins={p.mins} confirmed={p.synagogue.timesConfirmed}
                    selected={selectedSynId === p.synagogue.id} onClick={() => setSelectedSynId(prev => prev === p.synagogue.id ? null : p.synagogue.id)} />
                  {selectedSynId === p.synagogue.id && first && <SynDetail syn={p.synagogue} prayerKey={p.prayerKey} matchTime={p.time} onClose={() => setSelectedSynId(null)} />}
                </div>
              ); }); })()}
            </>}
          </>}

          {results.type === 'prayer' && <>
            <div className="px-3 pt-3 pb-1.5 border-b border-gold-600/10">
              <p className="text-gold-400 text-sm font-bold">{results.label as string}</p>
              {results.timeFiltered && <p className="text-slate-500 text-xs">מהשעה הנוכחית והלאה</p>}
            </div>
            {(results.matches as PrayerEntry[]).length === 0
              ? <p className="text-slate-500 text-sm px-3 py-3">אין מניינים קרובים היום</p>
              : (() => { const seen = new Set<number>(); return (results.matches as PrayerEntry[]).map((p, i) => { const first = !seen.has(p.synagogue.id); seen.add(p.synagogue.id); return (
              <div key={i}>
                <Row label={p.synagogue.name} desc={p.desc || undefined} time={p.time} mins={p.mins} confirmed={p.synagogue.timesConfirmed}
                  selected={selectedSynId === p.synagogue.id} onClick={() => setSelectedSynId(prev => prev === p.synagogue.id ? null : p.synagogue.id)} />
                {selectedSynId === p.synagogue.id && first && <SynDetail syn={p.synagogue} prayerKey={p.prayerKey} onClose={() => setSelectedSynId(null)} />}
              </div>
            ); }); })()}
          </>}

          {results.type === 'time' && <>
            <p className="text-gold-400 text-sm font-bold px-3 pt-3 pb-1">שעה {results.query as string}</p>
            {(results.matches as PrayerEntry[]).length === 0
              ? <p className="text-slate-400 text-sm px-3 pb-3">אין מניינים בשעה זו</p>
              : (() => { const seen = new Set<number>(); return (results.matches as PrayerEntry[]).map((p, i) => { const first = !seen.has(p.synagogue.id); seen.add(p.synagogue.id); return (
                <div key={i}>
                  <Row label={p.synagogue.name} sub={p.prayerName} desc={p.desc || undefined} time={p.time} mins={p.mins}
                    selected={selectedSynId === p.synagogue.id} onClick={() => setSelectedSynId(prev => prev === p.synagogue.id ? null : p.synagogue.id)} />
                  {selectedSynId === p.synagogue.id && first && <SynDetail syn={p.synagogue} matchTime={results.query as string} onClose={() => setSelectedSynId(null)} />}
                </div>
              ); }); })()}
          </>}

          {results.type === 'upcoming' && <>
            <p className="text-gold-400 text-sm font-bold px-3 pt-3 pb-1">⏰ עכשיו ובקרוב</p>
            {(() => { const seen = new Set<number>(); return (results.matches as PrayerEntry[]).map((p, i) => { const first = !seen.has(p.synagogue.id); seen.add(p.synagogue.id); return (
              <div key={i}>
                <Row label={p.synagogue.name} sub={p.prayerName} desc={p.desc || undefined} time={p.time} mins={p.mins} confirmed={p.synagogue.timesConfirmed}
                  selected={selectedSynId === p.synagogue.id} onClick={() => setSelectedSynId(prev => prev === p.synagogue.id ? null : p.synagogue.id)} />
                {selectedSynId === p.synagogue.id && first && <SynDetail syn={p.synagogue} prayerKey={p.prayerKey} matchTime={p.time} onClose={() => setSelectedSynId(null)} />}
              </div>
            ); }); })()}
          </>}

          {results.type === 'shiurim' && (() => {
            const entries = results.entries as ShiurEntry[];
            const dow = results.dow as number;
            const nowMins = results.nowMins as number;
            const nowStr = `${String(Math.floor(nowMins / 60)).padStart(2,'0')}:${String(nowMins % 60).padStart(2,'0')}`;
            return <>
              <div className="px-3 pt-3 pb-2 border-b border-gold-600/10">
                <p className="text-gold-400 text-sm font-bold">📚 שיעורי תורה</p>
                <p className="text-slate-500 text-xs">יום {DAY_NAMES_HE[dow]} · משעה {nowStr} והלאה</p>
              </div>
              {entries.length === 0 && (
                <p className="text-slate-500 text-sm px-3 py-4 text-center">אין שיעורים יותר היום</p>
              )}
              {entries.map(({ synagogue: syn, shiur: sh, minsFromNow }, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2.5 border-t border-gold-600/10 first:border-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-white text-sm font-medium">{sh.name}</span>
                      <span className="text-xs text-navy-400 bg-navy-800 rounded px-1.5">{syn.name}</span>
                    </div>
                    {sh.lecturer && <p className="text-gold-500 text-xs truncate">{sh.lecturer}</p>}
                  </div>
                  <div className="text-left shrink-0 mr-3">
                    <p className="text-white font-bold text-sm tabular-nums">{sh.time}</p>
                    <p className={`text-xs ${minsFromNow < 0 ? 'text-slate-500' : minsFromNow < 30 ? 'text-yellow-400' : 'text-slate-400'}`}>
                      {minsFromNow < 0 ? `לפני ${Math.abs(Math.round(minsFromNow))} דק'`
                        : minsFromNow === 0 ? 'עכשיו'
                        : minsFromNow < 60 ? `בעוד ${Math.round(minsFromNow)} דק'`
                        : `בעוד ${Math.floor(minsFromNow/60)}:${String(Math.round(minsFromNow%60)).padStart(2,'0')}`}
                    </p>
                  </div>
                </div>
              ))}
            </>;
          })()}

          {results.type === 'synagogue' && (results.matches as Synagogue[]).map((syn) => (
            <div key={syn.id} className="border-t border-gold-600/10 first:border-0">
              {/* שורת בית כנסת — לחיצה לפתיחת פרטים */}
              <button
                onClick={() => setSelectedSynId(prev => prev === syn.id ? null : syn.id)}
                className="w-full text-right p-3 hover:bg-navy-600/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 text-xs">{selectedSynId === syn.id ? '▲' : '▼'}</span>
                    <p className="text-white font-bold text-sm">{syn.name}</p>
                    {syn.timesConfirmed && <span className="text-emerald-400 text-xs">✓</span>}
                  </div>
                  <div className="flex gap-1.5">
                    {syn.weekday.shacharit.filter(s => s.time).slice(0,1).map((s, i) => (
                      <span key={i} className="text-xs text-slate-300 bg-navy-800 rounded px-1.5 py-0.5">{s.time}</span>
                    ))}
                  </div>
                </div>
                {syn.rabbiName && <p className="text-slate-500 text-xs mt-0.5 mr-5">הרב {syn.rabbiName}</p>}
              </button>

              {/* פרטים מורחבים */}
              {selectedSynId === syn.id && (
                <SynDetail syn={syn} onClose={() => setSelectedSynId(null)} />
              )}
            </div>
          ))}

        </div>
      )}

      {results?.type === 'empty' && (
        <div className="bg-navy-700/40 rounded-xl border border-gold-600/10 px-4 py-3">
          <p className="text-slate-400 text-sm">לא נמצאו תוצאות עבור &quot;{query}&quot;</p>
          <p className="text-slate-600 text-xs mt-1">נסה: שם בית כנסת · שם הרב · שחרית · מנחה גדולה · פלג · 19:30</p>
        </div>
      )}
    </section>
  );
}
