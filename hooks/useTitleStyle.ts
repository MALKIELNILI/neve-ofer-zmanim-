'use client';

import { useState, useEffect } from 'react';

export interface TitleStyle {
  font:  'Heebo' | 'Frank' | 'Rubik' | 'Alef' | 'Secular' | 'Suez' | 'Assistant' | 'NotoSerif';
  align: 'center' | 'right' | 'left';
  line1: string;
  line2: string;
}

const DEFAULT: TitleStyle = { font: 'Frank', align: 'center', line1: 'אלי בעזרי', line2: 'הליכות עולם' };
const LS_KEY = 'neve-ofer-title-style';

export const FONT_VARS: Record<TitleStyle['font'], string> = {
  Heebo:     'var(--font-heebo)',
  Frank:     'var(--font-frank)',
  Rubik:     'var(--font-rubik)',
  Alef:      'var(--font-alef)',
  Secular:   'var(--font-secular)',
  Suez:      'var(--font-suez)',
  Assistant: 'var(--font-assistant)',
  NotoSerif: 'var(--font-noto-serif)',
};

export const FONT_LABELS: Record<TitleStyle['font'], string> = {
  Heebo:     'הבו',
  Frank:     'פרנק',
  Rubik:     'רוביק',
  Alef:      'אלף',
  Secular:   'סקולר',
  Suez:      'סואז',
  Assistant: 'אסיסטנט',
  NotoSerif: 'נוטו סריף',
};

export function useTitleStyle() {
  const [style, setStyle] = useState<TitleStyle>(DEFAULT);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setStyle({ ...DEFAULT, ...parsed });
      }
    } catch { /* ignore */ }
  }, []);

  const update = (next: TitleStyle) => {
    setStyle(next);
    try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  return { style, update };
}
