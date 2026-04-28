'use client';

import { useState, useEffect } from 'react';

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="חזור למעלה"
      className="fixed bottom-20 left-4 z-50 w-11 h-11 flex items-center justify-center rounded-full bg-navy-700 border border-gold-600/40 text-gold-400 shadow-lg hover:bg-navy-600 hover:border-gold-400/70 transition-all"
    >
      ↑
    </button>
  );
}
