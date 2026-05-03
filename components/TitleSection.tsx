'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useTitleStyle, FONT_VARS, FONT_LABELS, type TitleStyle } from '@/hooks/useTitleStyle';
const FONTS: TitleStyle['font'][] = ['Suez', 'NotoSerif', 'Frank', 'Heebo', 'Rubik', 'Alef', 'Secular', 'Assistant'];
const ALIGNS: { val: TitleStyle['align']; label: string; icon: string }[] = [
  { val: 'right',  label: 'ימין',  icon: '⇤' },
  { val: 'center', label: 'מרכז', icon: '↔' },
  { val: 'left',   label: 'שמאל', icon: '⇥' },
];

interface TitleProps { isAdmin?: boolean; }

export function TitleSection({ isAdmin }: TitleProps) {
  const { style, update } = useTitleStyle();
  const [showPicker, setShowPicker] = useState(false);
  const [lightbox, setLightbox] = useState(false);

  // Close lightbox with Escape
  useEffect(() => {
    if (!lightbox) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightbox(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightbox]);
  const fontFamily = FONT_VARS[style.font];
  const alignClass = { right: 'text-right', center: 'text-center', left: 'text-left' }[style.align];

  return (
    <div className="relative w-full">
      {/* Aron Kodesh image — click to enlarge */}
      <div
        className="relative h-60 w-full overflow-hidden cursor-zoom-in"
        onClick={() => setLightbox(true)}
      >
        <Image src="/aron-kodesh.png" alt="ארון קודש" fill className="object-contain object-center pt-2" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-navy-900/20 via-transparent to-navy-900" />
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-slate-500/60 select-none pointer-events-none">
          לחץ להגדלה
        </div>
      </div>

      {/* כפתור סודי על הכתר — גישת מנהל */}
      <button
        onClick={(e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent('open-admin')); }}
        className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-16 opacity-0 cursor-default z-10"
        aria-hidden="true"
      />

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(false)}
        >
          <div className="relative max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <Image
              src="/aron-kodesh.png"
              alt="ארון קודש"
              width={500}
              height={700}
              className="object-contain rounded-2xl w-full h-auto max-h-[85vh]"
            />
            <button
              onClick={() => setLightbox(false)}
              className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-black/60 text-white text-lg hover:bg-black/80 transition-colors"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Settings button — רק למנהל ראשי */}
      {isAdmin && (
        <button onClick={() => setShowPicker(s => !s)}
          className="absolute top-3 left-3 text-slate-500 hover:text-slate-300 text-lg bg-navy-900/60 rounded-lg p-1.5 transition-colors"
          title="שינוי פונט ויישור">
          ⚙️
        </button>
      )}

      {/* Title */}
      <div className={`relative z-10 -mt-4 pb-2 px-6 ${alignClass}`}>
        <h1 style={{ fontFamily }} className="text-4xl font-black text-gold-300 drop-shadow-lg tracking-wide leading-tight">
          {style.line1 || 'אלי בעזרי'}
        </h1>
        <div className={`flex items-center gap-3 mt-0.5 ${style.align === 'center' ? 'justify-center' : style.align === 'left' ? 'flex-row-reverse' : ''}`}>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-gold-600/40" />
          <p style={{ fontFamily }} className="text-gold-500 text-base font-semibold tracking-[0.2em]">{style.line2 || 'הליכות עולם'}</p>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-gold-600/40" />
        </div>
        <p className="text-slate-500 text-xs mt-1">שכונת נווה עופר · תל אביב</p>
        <p className="text-gold-700 text-xs mt-1 leading-relaxed">
          לעילוי נשמת מישאל בן זילפה · ר&#39; אפרים בן ציונה · וירון בן צבי
        </p>
      </div>

      {/* Font picker panel */}
      {showPicker && (
        <div className="mx-4 mb-4 bg-navy-700 border border-gold-600/25 rounded-2xl p-4 space-y-4">

          {/* עריכת טקסט */}
          <div>
            <p className="text-slate-400 text-xs font-semibold mb-2 tracking-wider">טקסט כותרת</p>
            <div className="space-y-2">
              <input
                value={style.line1}
                onChange={e => update({ ...style, line1: e.target.value })}
                placeholder="שורה ראשונה"
                style={{ fontFamily }}
                className="w-full bg-navy-800 border border-gold-600/25 rounded-xl px-3 py-2 text-gold-300 text-lg font-bold text-center outline-none"
              />
              <input
                value={style.line2}
                onChange={e => update({ ...style, line2: e.target.value })}
                placeholder="שורה שנייה"
                style={{ fontFamily }}
                className="w-full bg-navy-800 border border-gold-600/25 rounded-xl px-3 py-2 text-gold-500 text-sm text-center outline-none"
              />
            </div>
          </div>

          {/* בחירת פונט */}
          <div>
            <p className="text-slate-400 text-xs font-semibold mb-2 tracking-wider">פונט</p>
            <div className="grid grid-cols-2 gap-2">
              {FONTS.map(f => (
                <button key={f} onClick={() => update({ ...style, font: f })}
                  style={{ fontFamily: FONT_VARS[f] }}
                  className={`text-right px-3 py-2.5 rounded-xl border text-sm transition-all ${style.font === f ? 'bg-gold-500/15 border-gold-400/60 text-gold-300' : 'border-slate-700 text-slate-300 hover:border-gold-600/40'}`}>
                  <span className="text-base font-bold block">{style.line1 || 'אלי בעזרי'}</span>
                  <span className="text-xs text-slate-500">{FONT_LABELS[f]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* יישור */}
          <div>
            <p className="text-slate-400 text-xs font-semibold mb-2 tracking-wider">יישור</p>
            <div className="flex gap-2">
              {ALIGNS.map(a => (
                <button key={a.val} onClick={() => update({ ...style, align: a.val })}
                  className={`flex-1 py-2 rounded-xl border text-sm transition-all ${style.align === a.val ? 'bg-gold-500/15 border-gold-400/60 text-gold-300' : 'border-slate-700 text-slate-400 hover:border-gold-600/40'}`}>
                  {a.icon} {a.label}
                </button>
              ))}
            </div>
          </div>

          <button onClick={() => setShowPicker(false)}
            className="w-full py-2 bg-navy-600 hover:bg-navy-500 text-slate-300 rounded-xl text-sm">סגור</button>
        </div>
      )}
    </div>
  );
}
