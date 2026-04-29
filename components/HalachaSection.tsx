'use client';

import { useEffect, useState } from 'react';

interface HalachaData { text: string | null; date: string | null; error?: string; }

function renderLine(line: string, i: number) {
  const isOmer = /עומר|ספירה|לעומר|לספירה/.test(line);
  if (isOmer) {
    return (
      <span key={i} className="block bg-amber-200/60 border border-amber-400/40 rounded-lg px-2 py-1 my-1 text-amber-900 font-semibold text-sm">
        ✨ {line}
      </span>
    );
  }
  return <span key={i} className="block">{line}</span>;
}

export function HalachaSection() {
  const [data, setData]       = useState<HalachaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetch('/api/halacha')
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => setData({ text: null, date: null, error: 'שגיאת רשת' }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="mx-4 mb-4">
        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 animate-pulse">
          <div className="h-4 bg-amber-200/60 rounded w-1/3 mb-2" />
          <div className="h-3 bg-amber-100 rounded w-full mb-1" />
          <div className="h-3 bg-amber-100 rounded w-4/5" />
        </div>
      </section>
    );
  }

  if (!data?.text) return null;

  const lines    = data.text.split('\n').filter(Boolean);
  const preview  = lines.slice(0, 3);
  const hasMore  = lines.length > 3;
  const shown    = expanded ? lines : preview;

  return (
    <section id="halacha-section" className="mx-4 mb-4" dir="rtl">
      <div className="rounded-2xl border border-amber-300 bg-gradient-to-b from-amber-50 to-yellow-50 shadow-sm px-4 py-3">
        <div className="text-sm text-gray-800 leading-relaxed">
          {shown.map((line, i) => renderLine(line, i))}
        </div>
        {hasMore && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="mt-2 text-xs text-amber-700 font-medium hover:text-amber-900"
          >
            {expanded ? '▲ פחות' : '▼ קרא עוד'}
          </button>
        )}
      </div>
    </section>
  );
}
