'use client';

import { useState } from 'react';
import { useAnnouncements, type Announcement } from '@/hooks/useAnnouncements';

const ICONS: Record<string, string> = {
  shiur: '📚', simcha: '🎉', general: '📢', minyan: '🕍',
};
const BORDERS: Record<string, string> = {
  shiur: 'border-blue-500/25 bg-blue-500/5',
  simcha: 'border-gold-500/25 bg-gold-500/5',
  general: 'border-slate-500/20 bg-slate-500/5',
  minyan: 'border-emerald-500/25 bg-emerald-500/5',
};

const BLANK = { title: '', body: '', eventDate: '', category: 'general' as Announcement['category'] };

export function AnnouncementsSection({ isAdmin }: { isAdmin: boolean }) {
  const { list, addAnnouncement, deleteAnnouncement } = useAnnouncements();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(BLANK);

  const submit = async () => {
    if (!form.title.trim()) return;
    await addAnnouncement({ category: form.category, title: form.title, body: form.body, eventDate: form.eventDate });
    setForm(BLANK);
    setShowForm(false);
  };

  return (
    <section className="mx-4 mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-gold-400 font-bold text-lg">📢 הודעות שכונתיות</h2>
        {isAdmin && (
          <button
            onClick={() => setShowForm(s => !s)}
            className="text-xs text-gold-400 border border-gold-600/35 hover:border-gold-400/70 rounded-full px-3 py-1 transition-colors"
          >
            {showForm ? '✕ סגור' : '+ הוסף'}
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-navy-700 rounded-xl border border-gold-600/20 p-4 mb-3 space-y-2.5">
          <select
            value={form.category}
            onChange={e => setForm(f => ({ ...f, category: e.target.value as Announcement['category'] }))}
            className="w-full bg-navy-800 border border-gold-600/25 rounded-lg px-3 py-2 text-white text-sm"
          >
            <option value="general">📢 הודעה כללית</option>
            <option value="shiur">📚 שיעור</option>
            <option value="simcha">🎉 שמחה</option>
            <option value="minyan">🕍 מניין מיוחד</option>
          </select>
          <input type="text" placeholder="כותרת *" value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className="w-full bg-navy-800 border border-gold-600/25 rounded-lg px-3 py-2 text-white text-sm placeholder:text-slate-500" />
          <textarea placeholder="פרטים (אופציונלי)" value={form.body}
            onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
            className="w-full bg-navy-800 border border-gold-600/25 rounded-lg px-3 py-2 text-white text-sm placeholder:text-slate-500 resize-none h-16" />
          <input type="text" placeholder="תאריך / שעה — למשל: שבת פרשת בהר | 21:00" value={form.eventDate}
            onChange={e => setForm(f => ({ ...f, eventDate: e.target.value }))}
            className="w-full bg-navy-800 border border-gold-600/25 rounded-lg px-3 py-2 text-white text-sm placeholder:text-slate-500" />
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 bg-gold-500 hover:bg-gold-400 text-navy-900 font-bold rounded-xl py-2.5 text-sm transition-colors">
              פרסם הודעה
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 bg-navy-600 text-slate-300 rounded-xl py-2.5 text-sm">
              ביטול
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2.5">
        {list.length === 0 && (
          <div className="text-center py-8 text-slate-600 text-sm">
            <p className="text-2xl mb-2">📢</p>
            אין הודעות כרגע
          </div>
        )}
        {list.map(ann => (
          <div key={ann.id} className={`rounded-xl border p-3.5 ${BORDERS[ann.category]}`}>
            <div className="flex items-start gap-3">
              <span className="text-xl mt-0.5">{ICONS[ann.category]}</span>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm">{ann.title}</p>
                {ann.body && <p className="text-slate-400 text-xs mt-1 leading-relaxed">{ann.body}</p>}
                {ann.eventDate && <p className="text-gold-500 text-xs mt-1.5">🕐 {ann.eventDate}</p>}
              </div>
              {isAdmin && <button onClick={() => deleteAnnouncement(ann.id)} className="text-slate-600 hover:text-red-400 text-sm transition-colors mt-0.5">✕</button>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
