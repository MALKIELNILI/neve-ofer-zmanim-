'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import type { Synagogue, UpdatePayload } from '@/lib/synagogues';
import type { DayZmanim } from '@/lib/zmanim';
import { SynagogueCard } from './SynagogueCard';
import { type FilterKey } from './PrayerFilter';

interface Props {
  synagogues: Synagogue[];
  onUpdate: (id: number, payload: UpdatePayload) => void;
  onAdd: (name: string) => void;
  onRemove: (id: number) => void;
  loaded: boolean;
  isAdmin: boolean;
  gabbaiOf: number | null;
  zmanim: DayZmanim | null;
  activeFilter: FilterKey;
}

const FILTER_MAP: Record<string, { weekday?: string; shabbat?: string }> = {
  'שחרית':       { weekday: 'shacharit' },
  'מנחה':        { weekday: 'mincha' },
  'ערבית':       { weekday: 'maariv' },
  'שבת':         { shabbat: 'shacharit' },
  'שיעורי תורה': {},
};

function hasFilter(syn: Synagogue, filter: FilterKey): boolean {
  if (!filter) return true;
  if (filter === 'שיעורי תורה') return syn.shiurim.length > 0;
  const m = FILTER_MAP[filter];
  if (!m) return true;
  const slots = (arr?: { time: string }[]) => (arr ?? []).some(s => s.time);
  if (m.weekday) return slots((syn.weekday as unknown as Record<string, { time: string }[]>)[m.weekday]);
  if (m.shabbat) return slots((syn.shabbat as unknown as Record<string, { time: string }[]>)[m.shabbat]);
  return true;
}

export function SynagoguesSection({ synagogues, onUpdate, onAdd, onRemove, loaded, isAdmin, gabbaiOf, zmanim, activeFilter }: Props) {
  const [searchQ, setSearchQ]       = useState('');
  const [showSuggest, setShowSuggest] = useState(false);
  const [openId, setOpenId]         = useState<number | null>(null);
  const [newName, setNewName]       = useState('');
  const [showAdd, setShowAdd]       = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAdd = useCallback(() => {
    const n = newName.trim();
    if (!n) return;
    onAdd(n);
    setNewName('');
    setShowAdd(false);
  }, [newName, onAdd]);

  const confirmed = synagogues.filter(s => s.timesConfirmed).length;

  const filtered = useMemo(
    () => synagogues.filter(s => hasFilter(s, activeFilter)),
    [synagogues, activeFilter]
  );

  const suggestions = useMemo(() => {
    const q = searchQ.trim();
    if (!q) return [];
    return filtered.filter(s => s.name.includes(q) || s.address.includes(q)).slice(0, 6);
  }, [searchQ, filtered]);

  const displayList = useMemo(() => {
    if (!searchQ.trim()) return filtered;
    return filtered.filter(s => s.name.includes(searchQ.trim()) || s.address.includes(searchQ.trim()));
  }, [searchQ, filtered]);

  const pickSuggestion = (syn: Synagogue) => {
    setSearchQ(syn.name);
    setShowSuggest(false);
    setOpenId(syn.id);
    inputRef.current?.blur();
  };

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3 mx-4">
        <h2 className="text-gold-400 font-bold text-lg">🕍 בתי כנסת בשכונה</h2>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button onClick={() => setShowAdd(s => !s)}
              className="text-xs text-emerald-400 border border-emerald-600/40 rounded-full px-2.5 py-1 hover:bg-emerald-900/20 transition-colors">
              + הוסף
            </button>
          )}
          <span className="text-xs text-slate-500 bg-navy-700 border border-gold-600/10 px-2.5 py-1 rounded-full">
            {confirmed}/{synagogues.length} מעודכנים
          </span>
        </div>
      </div>

      {/* טופס הוספה */}
      {isAdmin && showAdd && (
        <div className="mx-4 mb-3 flex gap-2">
          <input
            type="text" value={newName} dir="rtl" autoFocus
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="שם בית הכנסת החדש..."
            className="flex-1 bg-navy-700 border border-emerald-600/40 focus:border-emerald-400 rounded-xl px-3 py-2 text-white text-sm outline-none"
          />
          <button onClick={handleAdd} className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl px-4 py-2 text-sm font-bold">הוסף</button>
          <button onClick={() => { setShowAdd(false); setNewName(''); }} className="text-slate-400 hover:text-white px-2">✕</button>
        </div>
      )}

      {/* שורת חיפוש */}
      <div className="mx-4 mb-3 relative">
        <div className="relative flex items-center">
          <span className="absolute right-3 text-slate-500 pointer-events-none text-sm">🔍</span>
          <input
            ref={inputRef}
            type="search"
            value={searchQ}
            dir="rtl"
            placeholder="חפש בית כנסת לפי שם..."
            onChange={e => { setSearchQ(e.target.value); setShowSuggest(true); }}
            onFocus={() => setShowSuggest(true)}
            onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
            className="w-full bg-navy-700 border border-gold-600/20 focus:border-gold-400 rounded-xl px-4 py-2.5 pr-10 text-white placeholder:text-slate-600 outline-none text-sm transition-colors"
          />
          {searchQ && (
            <button onClick={() => { setSearchQ(''); setOpenId(null); }} className="absolute left-3 text-slate-500 hover:text-white text-lg leading-none">×</button>
          )}
        </div>

        {/* הצעות אוטומטיות */}
        {showSuggest && suggestions.length > 0 && (
          <div className="absolute top-full right-0 left-0 z-20 mt-1 bg-navy-700 border border-gold-600/30 rounded-xl overflow-hidden shadow-xl">
            {suggestions.map(syn => (
              <button
                key={syn.id}
                onMouseDown={() => pickSuggestion(syn)}
                className="w-full text-right px-4 py-2.5 hover:bg-navy-600 transition-colors flex items-center justify-between"
              >
                <span className="text-white text-sm">{syn.name}</span>
                {syn.address && <span className="text-slate-500 text-xs">{syn.address}</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mx-4">
        {!loaded && (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 bg-navy-700 rounded-xl animate-pulse border border-gold-600/10" />
            ))}
          </div>
        )}

        {loaded && displayList.length === 0 && (
          <p className="text-center text-slate-500 text-sm py-6">
            {searchQ ? `לא נמצא "${searchQ}"` : 'אין בתי כנסת לסוג תפילה זה'}
          </p>
        )}

        {loaded && (
          <div className="space-y-2">
            {displayList.map(syn => (
              <SynagogueCard
                key={syn.id}
                synagogue={syn}
                isAdmin={isAdmin}
                gabbaiOf={gabbaiOf}
                zmanim={zmanim}
                onUpdate={onUpdate}
                onRemove={isAdmin ? onRemove : undefined}
                forceOpen={openId === syn.id || gabbaiOf === syn.id}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
