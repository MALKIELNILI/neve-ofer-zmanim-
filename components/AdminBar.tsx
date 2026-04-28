'use client';

import { useState } from 'react';
import { useAdmin } from '@/hooks/useAdmin';

export function AdminBar() {
  const { isAdmin, login, logout } = useAdmin();
  const [open, setOpen] = useState(false);
  const [pin, setPin]   = useState('');
  const [err, setErr]   = useState('');

  const tryLogin = () => {
    if (login(pin)) { setOpen(false); setPin(''); setErr(''); }
    else { setErr('קוד שגוי — נסה שוב'); setPin(''); }
  };

  return (
    <div className="fixed bottom-5 left-4 z-50">

      {/* Trigger button */}
      {isAdmin ? (
        <button onClick={logout}
          className="flex items-center gap-1.5 bg-emerald-900/90 border border-emerald-500/40 text-emerald-400 text-xs rounded-full px-3 py-1.5 shadow-lg backdrop-blur-sm hover:bg-emerald-800 transition-colors">
          🔓 מנהל — יציאה
        </button>
      ) : (
        <button onClick={() => setOpen(s => !s)}
          className="text-slate-700 hover:text-slate-500 text-base bg-navy-800/70 border border-slate-700/60 rounded-full px-2.5 py-1.5 shadow-lg backdrop-blur-sm transition-colors"
          title="כניסת מנהל">
          🔒
        </button>
      )}

      {/* PIN modal */}
      {open && !isAdmin && (
        <div className="absolute bottom-12 left-0 bg-navy-700 border border-gold-600/25 rounded-2xl p-5 w-72 shadow-2xl">
          <p className="text-gold-400 font-bold text-sm mb-1">כניסת מנהל</p>
          <p className="text-slate-500 text-xs mb-4">רק מנהל האפליקציה יכול לערוך</p>

          {/* PIN dots */}
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
            <button onClick={() => { setOpen(false); setPin(''); setErr(''); }}
              className="px-4 bg-navy-600 text-slate-300 rounded-xl py-2.5 text-sm">
              ביטול
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
