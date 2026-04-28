'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

const LS_KEY = 'neve-ofer-announcements-v1';

export interface Announcement {
  id: string;
  category: 'shiur' | 'simcha' | 'general' | 'minyan';
  title: string;
  body: string;
  eventDate: string;
  createdAt: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromDB(row: any): Announcement {
  return {
    id: String(row.id),
    category: row.category ?? 'general',
    title: String(row.title ?? ''),
    body: String(row.body ?? ''),
    eventDate: String(row.event_date ?? ''),
    createdAt: String(row.created_at ?? ''),
  };
}

export function useAnnouncements() {
  const [list, setList] = useState<Announcement[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (supabase) {
      supabase.from('announcements').select('*').order('created_at', { ascending: false }).then(({ data, error }) => {
        if (data && !error) setList(data.map(fromDB));
        setLoaded(true);
      });

      const ch = supabase.channel('ann-changes')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'announcements' },
          ({ new: row }) => setList(prev => [fromDB(row), ...prev]))
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'announcements' },
          ({ old: row }) => setList(prev => prev.filter(a => a.id !== String(row.id))))
        .subscribe();

      return () => { supabase?.removeChannel(ch); };
    } else {
      try {
        const raw = localStorage.getItem(LS_KEY);
        if (raw) setList(JSON.parse(raw));
      } catch { /* ignore */ }
      setLoaded(true);
    }
  }, []);

  const save = (next: Announcement[]) => {
    setList(next);
    if (!supabase) {
      try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
    }
  };

  const addAnnouncement = useCallback(async (ann: Omit<Announcement, 'id' | 'createdAt'>) => {
    if (supabase) {
      await supabase.from('announcements').insert({
        category: ann.category,
        title: ann.title,
        body: ann.body,
        event_date: ann.eventDate,
      });
    } else {
      const newAnn: Announcement = {
        ...ann,
        id: String(Date.now()),
        createdAt: new Date().toISOString(),
      };
      save([newAnn, ...list]);
    }
  }, [list]);

  const deleteAnnouncement = useCallback(async (id: string) => {
    if (supabase) {
      await supabase.from('announcements').delete().eq('id', id);
    } else {
      save(list.filter(a => a.id !== id));
    }
  }, [list]);

  return { list, addAnnouncement, deleteAnnouncement, loaded };
}
