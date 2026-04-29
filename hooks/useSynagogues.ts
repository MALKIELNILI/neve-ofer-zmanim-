'use client';

import { useState, useEffect, useCallback } from 'react';
import { SYNAGOGUES_INITIAL, DATA_VERSION, migrateOldData, type Synagogue, type UpdatePayload } from '@/lib/synagogues';
import { supabase } from '@/lib/supabase';

const LS_KEY     = 'neve-ofer-synagogues';
const LS_VERSION = 'neve-ofer-synagogues-version';
const LS_KEYS_OLD = ['neve-ofer-synagogues-v2', 'neve-ofer-synagogues-v1'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromDB(row: any): Synagogue {
  const empty = (def: object) => def;
  return {
    id:           Number(row.id),
    name:         String(row.name ?? ''),
    address:      String(row.address ?? ''),
    rabbiName:    String(row.rabbi_name ?? ''),
    rabbiPhone:   String(row.rabbi_phone ?? ''),
    gabbaiName:   String(row.gabbai_name ?? ''),
    gabbaiPhone:  String(row.gabbai_phone ?? ''),
    weekday:      row.weekday_prayers  ?? empty({ shacharit:[{time:'',desc:''}], mincha:[{time:'',desc:''}], maariv:[{time:'',desc:''}] }),
    shabbat:      row.shabbat_prayers  ?? empty({ minchaErevShabbat:[{time:'',desc:''}], kabbalatShabbat:[{time:'',desc:''}], shacharit:[{time:'',desc:''}], mincha:[{time:'',desc:''}], maariv:[{time:'',desc:''}] }),
    shiurim:      row.shiurim         ?? [],
    timesConfirmed:  Boolean(row.times_confirmed),
    timesUpdatedAt:  row.times_updated_at ? String(row.times_updated_at) : null,
    editPin:         row.edit_pin ? String(row.edit_pin) : undefined,
  };
}

// ממיר Synagogue → שורת Supabase
function toDB(syn: Synagogue) {
  return {
    id:              syn.id,
    name:            syn.name,
    address:         syn.address,
    rabbi_name:      syn.rabbiName,
    rabbi_phone:     syn.rabbiPhone,
    gabbai_name:     syn.gabbaiName,
    gabbai_phone:    syn.gabbaiPhone,
    weekday_prayers: syn.weekday,
    shabbat_prayers: syn.shabbat,
    shiurim:         syn.shiurim,
    times_confirmed: syn.timesConfirmed,
    times_updated_at: syn.timesUpdatedAt,
  };
}

export function useSynagogues() {
  const [synagogues, setSynagogues] = useState<Synagogue[]>(SYNAGOGUES_INITIAL);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (supabase) {
      // ── Supabase mode (ענן, מסונכרן) ──────────────
      supabase.from('synagogues').select('*').order('id').then(async ({ data, error }) => {
        if (error) { setLoaded(true); return; }

        if (!data || data.length === 0) {
          // טבלה ריקה לחלוטין — העלה הכל מ-SYNAGOGUES_INITIAL
          await supabase!.from('synagogues').upsert(SYNAGOGUES_INITIAL.map(toDB));
          setSynagogues(SYNAGOGUES_INITIAL);
        } else {
          // בנה את הרשימה: מי שלא אושר → קח מ-SYNAGOGUES_INITIAL (נתונים מלאים)
          //                  מי שאושר     → קח מ-Supabase (עריכות מנהל)
          const initialMap = new Map(SYNAGOGUES_INITIAL.map(s => [s.id, s]));
          const toUpsert: Synagogue[] = [];

          const hasData = (syn: Synagogue) =>
            [...syn.weekday.shacharit, ...syn.weekday.mincha, ...syn.weekday.maariv]
              .some(s => s.time || s.isRelative);

          const merged = data.map((row: Record<string, unknown>) => {
            const dbSyn = fromDB(row);
            // החלף מ-SYNAGOGUES_INITIAL רק אם הנתונים ב-Supabase ריקים לחלוטין
            if (!hasData(dbSyn)) {
              const init = initialMap.get(dbSyn.id);
              if (init) {
                const synToUse = { ...init, editPin: dbSyn.editPin };
                toUpsert.push(synToUse);
                return synToUse;
              }
            }
            return dbSyn;
          });

          // הוסף בתי כנסת חדשים שחסרים
          const dbIds = new Set(data.map((r: { id: number }) => Number(r.id)));
          const missing = SYNAGOGUES_INITIAL.filter(s => !dbIds.has(s.id));
          toUpsert.push(...missing);

          if (toUpsert.length > 0) {
            await supabase!.from('synagogues').upsert(toUpsert.map(toDB));
          }

          setSynagogues([...merged, ...missing].sort((a, b) => a.id - b.id));
        }
        setLoaded(true);
      });

      // Real-time עדכונים
      const ch = supabase.channel('syn-realtime')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'synagogues' },
          ({ new: row }) => setSynagogues(prev =>
            prev.map(s => s.id === Number(row.id) ? fromDB(row) : s)))
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'synagogues' },
          ({ new: row }) => setSynagogues(prev => {
            if (prev.some(s => s.id === Number(row.id))) return prev;
            return [...prev, fromDB(row)].sort((a,b) => a.id - b.id);
          }))
        .subscribe();
      return () => { supabase?.removeChannel(ch); };

    } else {
      // ── localStorage mode (מקומי) ──────────────────
      try {
        const storedVersion = parseInt(localStorage.getItem(LS_VERSION) ?? '1');
        if (storedVersion < DATA_VERSION) {
          localStorage.setItem(LS_KEY, JSON.stringify(SYNAGOGUES_INITIAL));
          localStorage.setItem(LS_VERSION, String(DATA_VERSION));
          setSynagogues(SYNAGOGUES_INITIAL);
          setLoaded(true);
          return;
        }

        let raw = localStorage.getItem(LS_KEY);
        if (!raw) {
          for (const old of LS_KEYS_OLD) {
            raw = localStorage.getItem(old);
            if (raw) { localStorage.setItem(LS_KEY, raw); localStorage.removeItem(old); break; }
          }
        }
        if (raw) {
          const parsed = migrateOldData(JSON.parse(raw));
          const ids = new Set(parsed.map(s => s.id));
          setSynagogues([...parsed, ...SYNAGOGUES_INITIAL.filter(s => !ids.has(s.id))]);
        }
      } catch { /* ignore */ }
      setLoaded(true);
    }
  }, []);

  const updateSynagogue = useCallback(async (id: number, p: UpdatePayload) => {
    const now = new Date().toISOString();
    if (supabase) {
      // עדכון ראשי — ללא edit_pin (שדה שאולי לא קיים עדיין)
      const { error } = await supabase.from('synagogues').update({
        address:          p.address,
        rabbi_name:       p.rabbiName,
        rabbi_phone:      p.rabbiPhone,
        gabbai_name:      p.gabbaiName,
        gabbai_phone:     p.gabbaiPhone,
        weekday_prayers:  p.weekday,
        shabbat_prayers:  p.shabbat,
        shiurim:          p.shiurim,
        times_confirmed:  true,
        times_updated_at: now,
      }).eq('id', id);

      if (error) {
        console.error('שגיאת שמירה ב-Supabase:', error.message);
        alert('שגיאה בשמירה — פרטים בקונסול');
        return;
      }

      // עדכון edit_pin בנפרד — אם העמודה קיימת
      if (p.editPin !== undefined) {
        await supabase.from('synagogues').update({ edit_pin: p.editPin }).eq('id', id);
      }
    }
    setSynagogues(prev => {
      const next = prev.map(s => s.id === id ? { ...s, ...p, timesConfirmed: true, timesUpdatedAt: now } : s);
      if (!supabase) {
        try {
          localStorage.setItem(LS_KEY, JSON.stringify(next));
          localStorage.setItem(LS_VERSION, String(DATA_VERSION));
        } catch { /* ignore */ }
      }
      return next;
    });
  }, []);

  return { synagogues, updateSynagogue, loaded };
}
