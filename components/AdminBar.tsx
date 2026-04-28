'use client';

import { useState, useEffect } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import type { Synagogue } from '@/lib/synagogues';

interface Props { synagogues: Synagogue[] }

export function AdminBar({ synagogues }: Props) {
  const { isAdmin, gabbaiOf, loginAsMaster, loginAsGabbai, logout } = useAdmin();
  const [open, setOpen] = useState(false);
  const [pin,  setPin]  = useState('');
  const [err,  setErr]  = useState('');

  useEffect(() => {
    const handler = () => { if (!isAdmin && !gabbaiOf) setOpen(true); };
    window.addEventListener('open-admin', handler);
    return () => window.removeEventListener('open-admin', handler);
  }, [isAdmin, gabbaiOf]);

  const tryLogin = () => {
    // נסה מנהל ראשי
    if (loginAsMaster(pin)) { close(); return; }

    // נסה קוד גבאי
    const syn = synagogues.find(s => s.editPin && s.editPin === pin);
    if (syn) { loginAsGabbai(syn.id); close(); return; }

    setErr('קוד שגוי — נסה שוב');
    setPin('');
  };

  const close = () => { setOpen(false); setPin(''); setErr(''); };

  const gabbaiSyn = gabbaiOf ? synagogues.find(s => s.id === gabbaiOf) : null;

  return (
    <div className="fixed bottom-5 left-4 z-50">

      {/* כפתור יציאה */}
      {(isAdmin || gabbaiOf) && (
        <button onClick={logout}
          className="flex items-center gap-1.5 bg-emerald-900/90 border border-emerald-500/40 text-emerald-400 text-xs rounded-full px-3 py-1.5 shadow-lg backdrop-blur-sm hover:bg-emerald-800 transition-colors">
          🔓 {isAdmin ? 'מנהל ראשי' : `גבאי — ${gabbaiSyn?.name ?? ''}`} · יציאה
        </button>
      )}

      {/* חלון PIN */}
      {open && (
        <div className="absolute bottom-2 left-0 bg-navy-700 border border-gold-600/25 rounded-2xl p-5 w-72 shadow-2xl">
          <p className="text-gold-400 font-bold text-sm mb-1">כניסה לעריכה</p>
          <p className="text-slate-500 text-xs mb-4">הזן קוד מנהל או קוד גבאי</p>

          <input
            type="password"
            inputMode="numeric"
            maxLength={8}
            value={pin}
            onChange={e => { setPin(e.target.value); setErr(''); }}
            onKeyDown={e => e.key === 'Enter' && tryLogin()}
            placeholder="••••"
            autoFocus
            className="w-full bg-navy-800 border border-gold-600/25 rounded-xl px-4 py-3 text-white text-center text-2xl tracking-[0.4em] outline-none focus:border-gold-400 transition-colors"
          />
          {err && <p className="text-red-400 text-xs text-center mt-2">{err}</p>}

          <div className="flex gap-2 mt-4">
            <button onClick={tryLogin}
              className="flex-1 bg-gold-500 hover:bg-gold-400 text-navy-900 font-bold rounded-xl py-2.5 text-sm transition-colors">
              כניסה
            </button>
            <button onClick={close}
              className="px-4 bg-navy-600 text-slate-300 rounded-xl py-2.5 text-sm">
              ביטול
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
