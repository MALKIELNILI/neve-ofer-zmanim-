'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { SYNAGOGUES_INITIAL, DATA_VERSION, migrateOldData, type Synagogue, type UpdatePayload } from '@/lib/synagogues';
import { supabase } from '@/lib/supabase';

const LS_KEY      = 'neve-ofer-synagogues';
const LS_VERSION  = 'neve-ofer-synagogues-version';
const LS_KEYS_OLD = ['neve-ofer-synagogues-v2', 'neve-ofer-synagogues-v1'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromDB(row: any): Synagogue {
  return {
    id:           Number(row.id),
    name:         String(row.name ?? ''),
    address:      String(row.address ?? ''),
    rabbiName:    String(row.rabbi_name ?? ''),
    rabbiPhone:   String(row.rabbi_phone ?? ''),
    gabbaiName:   String(row.gabbai_name ?? ''),
    gabbaiPhone:  String(row.gabbai_phone ?? ''),
    weekday:      row.weekday_prayers  || { shacharit:[{time:'',desc:''}], mincha:[{time:'',desc:''}], maariv:[{time:'',desc:''}] },
    shabbat:      row.shabbat_prayers  || { minchaErevShabbat:[{time:'',desc:''}], kabbalatShabbat:[{time:'',desc:''}], shacharit:[{time:'',desc:''}], mincha:[{time:'',desc:''}], maariv:[{time:'',desc:''}] },
    shiurim:      row.shiurim         || [],
    timesConfirmed:  Boolean(row.times_confirmed),
    timesUpdatedAt:  row.times_updated_at ? String(row.times_updated_at) : null,
    editPin:         row.edit_pin ? String(row.edit_pin) : undefined,
  };
}

function toDB(syn: Synagogue) {
  return {
    id: syn.id, name: syn.name, address: syn.address,
    rabbi_name: syn.rabbiName, rabbi_phone: syn.rabbiPhone,
    gabbai_name: syn.gabbaiName, gabbai_phone: syn.gabbaiPhone,
    weekday_prayers: syn.weekday, shabbat_prayers: syn.shabbat,
    shiurim: syn.shiurim, times_confirmed: syn.timesConfirmed,
    times_updated_at: syn.timesUpdatedAt,
  };
}

function saveLS(next: Synagogue[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(next));
    localStorage.setItem(LS_VERSION, String(DATA_VERSION));
  } catch { /* ignore */ }
}

export function useSynagogues() {
  const [synagogues, setSynagogues] = useState<Synagogue[]>(SYNAGOGUES_INITIAL);
  const [loaded, setLoaded] = useState(false);
  // ref תמיד עדכני לשימוש ב-callbacks
  const synRef = useRef<Synagogue[]>(SYNAGOGUES_INITIAL);
  useEffect(() => { synRef.current = synagogues; }, [synagogues]);

  useEffect(() => {
    if (supabase) {
      supabase.from('synagogues').select('*').order('id').then(async ({ data, error }) => {
        if (error) { setLoaded(true); return; }

        const initialMap = new Map(SYNAGOGUES_INITIAL.map(s => [s.id, s]));
        const toUpsert: Synagogue[] = [];

        if (!data || data.length === 0) {
          await supabase!.from('synagogues').upsert(SYNAGOGUES_INITIAL.map(toDB));
          setSynagogues(SYNAGOGUES_INITIAL);
          synRef.current = SYNAGOGUES_INITIAL;
        } else {
          const hasRealData = (syn: Synagogue) =>
            [...syn.weekday.shacharit, ...syn.weekday.mincha, ...syn.weekday.maariv]
              .some(function(s) { return s.time || s.isRelative; });

          const merged = data.map(function(row: Record<string, unknown>) {
            const dbSyn = fromDB(row);
            if (!dbSyn.timesConfirmed && !hasRealData(dbSyn)) {
              const init = initialMap.get(dbSyn.id);
              if (init) {
                const synToUse = Object.assign({}, init, { editPin: dbSyn.editPin });
                toUpsert.push(synToUse);
                return synToUse;
              }
            }
            return dbSyn;
          });

          const dbIds = new Set(data.map(function(r: { id: number }) { return Number(r.id); }));
          const missing = SYNAGOGUES_INITIAL.filter(function(s) { return !dbIds.has(s.id); });
          toUpsert.push(...missing);

          if (toUpsert.length > 0) {
            supabase!.from('synagogues').upsert(toUpsert.map(toDB));
          }

          const result = [...merged, ...missing].sort(function(a, b) { return a.id - b.id; });
          setSynagogues(result);
          synRef.current = result;
        }
        setLoaded(true);
      });

      const ch = supabase.channel('syn-realtime')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'synagogues' },
          function({ new: row }) {
            setSynagogues(function(prev) {
              return prev.map(function(s) { return s.id === Number(row.id) ? fromDB(row) : s; });
            });
          })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'synagogues' },
          function({ new: row }) {
            setSynagogues(function(prev) {
              if (prev.some(function(s) { return s.id === Number(row.id); })) return prev;
              return [...prev, fromDB(row)].sort(function(a, b) { return a.id - b.id; });
            });
          })
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'synagogues' },
          function({ old: row }) {
            setSynagogues(function(prev) {
              return prev.filter(function(s) { return s.id !== Number(row.id); });
            });
          })
        .subscribe();
      return function() { supabase!.removeChannel(ch); };

    } else {
      try {
        const storedVersion = parseInt(localStorage.getItem(LS_VERSION) || '1');
        if (storedVersion < DATA_VERSION) {
          saveLS(SYNAGOGUES_INITIAL);
          setSynagogues(SYNAGOGUES_INITIAL);
          synRef.current = SYNAGOGUES_INITIAL;
          setLoaded(true);
          return;
        }
        let raw = localStorage.getItem(LS_KEY);
        if (!raw) {
          for (let i = 0; i < LS_KEYS_OLD.length; i++) {
            raw = localStorage.getItem(LS_KEYS_OLD[i]);
            if (raw) { localStorage.setItem(LS_KEY, raw); localStorage.removeItem(LS_KEYS_OLD[i]); break; }
          }
        }
        if (raw) {
          const parsed = migrateOldData(JSON.parse(raw));
          const ids = new Set(parsed.map(function(s) { return s.id; }));
          const result = [...parsed, ...SYNAGOGUES_INITIAL.filter(function(s) { return !ids.has(s.id); })];
          setSynagogues(result);
          synRef.current = result;
        }
      } catch (e) { /* ignore */ }
      setLoaded(true);
    }
  }, []);

  const updateSynagogue = useCallback(async function(id: number, p: UpdatePayload) {
    const now = new Date().toISOString();
    if (supabase) {
      const { error } = await supabase.from('synagogues').update({
        name: p.name, address: p.address,
        rabbi_name: p.rabbiName, rabbi_phone: p.rabbiPhone,
        gabbai_name: p.gabbaiName, gabbai_phone: p.gabbaiPhone,
        weekday_prayers: p.weekday, shabbat_prayers: p.shabbat,
        shiurim: p.shiurim, times_confirmed: true, times_updated_at: now,
      }).eq('id', id);
      if (error) { alert('שגיאה בשמירה — נסה שוב'); return; }
      if (p.editPin !== undefined) {
        await supabase.from('synagogues').update({ edit_pin: p.editPin }).eq('id', id);
      }
    }
    setSynagogues(function(prev) {
      const next = prev.map(function(s) {
        return s.id === id ? Object.assign({}, s, p, { name: p.name || s.name, timesConfirmed: true, timesUpdatedAt: now }) : s;
      });
      if (!supabase) saveLS(next);
      return next;
    });
  }, []);

  const addSynagogue = useCallback(async function(name: string) {
    const current = synRef.current;
    const newId = Math.max.apply(null, [0, ...current.map(function(s) { return s.id; })]) + 1;
    const base = SYNAGOGUES_INITIAL[0] || { weekday: { shacharit:[{time:'',desc:''}], mincha:[{time:'',desc:''}], maariv:[{time:'',desc:''}] }, shabbat: { minchaErevShabbat:[{time:'',desc:''}], kabbalatShabbat:[{time:'',desc:''}], shacharit:[{time:'',desc:''}], mincha:[{time:'',desc:''}], maariv:[{time:'',desc:''}] }, shiurim:[] };
    const newSyn: Synagogue = {
      id: newId, name: name, address: '', rabbiName: '', rabbiPhone: '', gabbaiName: '', gabbaiPhone: '',
      weekday: base.weekday, shabbat: base.shabbat, shiurim: [], timesConfirmed: false, timesUpdatedAt: null,
    };
    if (supabase) {
      const { error } = await supabase.from('synagogues').insert(toDB(newSyn));
      if (error) { alert('שגיאה בהוספה — ' + error.message); return; }
    }
    setSynagogues(function(prev) {
      const next = [...prev, newSyn].sort(function(a, b) { return a.id - b.id; });
      if (!supabase) saveLS(next);
      return next;
    });
  }, []);

  const removeSynagogue = useCallback(async function(id: number) {
    if (supabase) {
      const { error } = await supabase.from('synagogues').delete().eq('id', id);
      if (error) { alert('שגיאה במחיקה — ' + error.message); return; }
    }
    setSynagogues(function(prev) {
      const next = prev.filter(function(s) { return s.id !== id; });
      if (!supabase) saveLS(next);
      return next;
    });
  }, []);

  return { synagogues, updateSynagogue, addSynagogue, removeSynagogue, loaded };
}
