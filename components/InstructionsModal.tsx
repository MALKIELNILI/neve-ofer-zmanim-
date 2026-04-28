'use client';

import { useState } from 'react';

export function InstructionsButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-4 z-50 flex items-center gap-1.5 bg-navy-700/90 border border-gold-600/40 text-gold-400 text-xs rounded-full px-3 py-1.5 shadow-lg backdrop-blur-sm hover:bg-navy-600 transition-colors"
      >
        ❓ הנחיות
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="bg-navy-800 border border-gold-600/30 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl" dir="rtl" onClick={e => e.stopPropagation()}>

            {/* כותרת */}
            <div className="sticky top-0 bg-navy-800 border-b border-gold-600/20 px-5 py-4 flex items-center justify-between rounded-t-2xl">
              <div>
                <h2 className="text-gold-300 font-bold text-lg">🕍 נווה עופר — מדריך שימוש</h2>
                <p className="text-slate-500 text-xs">שכונת נווה עופר · תל כביר · תל אביב</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white text-2xl leading-none">×</button>
            </div>

            <div className="px-5 py-4 space-y-5">

              {/* הקדשה */}
              <div className="bg-gold-700/10 border border-gold-600/20 rounded-xl p-4 text-center">
                <p className="text-gold-400 text-xs font-semibold mb-1">לעילוי נשמת</p>
                <p className="text-gold-300 text-sm leading-relaxed">
                  מישאל בן זילפה · ר׳ אפרים בן ציונה · וירון בן צבי
                </p>
              </div>

              {/* מה כוללת האפליקציה */}
              <div>
                <h3 className="text-white font-bold text-sm mb-3">📱 מה כוללת האפליקציה</h3>
                <div className="space-y-2">
                  {[
                    { icon: '🌅', title: 'זמני תפילה', desc: 'שחרית, מנחה, ערבית, שבת — לכל 14 בתי הכנסת בשכונה' },
                    { icon: '⏰', title: 'זמני היום', desc: 'נץ, שקיעה, הדלקת נרות, צאת שבת ועוד — לפי לוח הלכתי מדויק' },
                    { icon: '📚', title: 'שיעורי תורה', desc: 'שיעורים יומיים ושבתיים — מסוננים לפי הזמן הנוכחי' },
                    { icon: '📜', title: 'הלכה יומית', desc: 'הלכה מעניינת מדי יום' },
                    { icon: '🕯️', title: 'יום זיכרון', desc: 'הנצחת נפטרים — שמם מוזכר ביום היארצייט' },
                    { icon: '📢', title: 'הודעות שכונה', desc: 'אירועים ועדכונים מהנהלת השכונה' },
                  ].map(item => (
                    <div key={item.title} className="flex gap-3 bg-navy-700/50 rounded-xl px-3 py-2.5">
                      <span className="text-lg shrink-0">{item.icon}</span>
                      <div>
                        <p className="text-white text-sm font-medium">{item.title}</p>
                        <p className="text-slate-400 text-xs">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* דרכי שימוש */}
              <div>
                <h3 className="text-white font-bold text-sm mb-3">🔍 דרכי שימוש</h3>
                <div className="space-y-2 text-sm text-slate-300">
                  {[
                    '🔎 חפש בית כנסת לפי שם, שם הרב, שעה מדויקת (19:30) או סוג תפילה',
                    '🌅 לחץ "שחרית" לראות מניינים מהשעה הנוכחית והלאה',
                    '📚 לחץ "שיעורי תורה" לראות שיעורים שמתחילים היום עכשיו',
                    '⚡ זמנים עם סימן ⚡ מתעדכנים אוטומטית כל יום לפי השמש',
                    '📅 ניתן לנווט לזמני מחר ואתמול בלוח הזמנים',
                    '↑ לחץ על חץ בפינה שמאל-תחתית לחזרה לראש העמוד',
                  ].map((tip, i) => (
                    <div key={i} className="flex gap-2 bg-navy-700/30 rounded-lg px-3 py-2">
                      <span className="text-xs text-slate-300 leading-relaxed">{tip}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* התקנה */}
              <div className="bg-blue-900/30 border border-blue-600/20 rounded-xl p-4">
                <h3 className="text-blue-300 font-bold text-sm mb-2">📲 הוספה לשולחן הבית</h3>
                <div className="text-slate-300 text-xs space-y-1">
                  <p><strong className="text-white">אייפון:</strong> לחץ ⎙ Share ← "הוסף למסך הבית"</p>
                  <p><strong className="text-white">אנדרואיד:</strong> לחץ ⋮ ← "הוסף למסך הבית"</p>
                </div>
              </div>

              {/* יצירת קשר */}
              <div className="text-center space-y-2">
                <p className="text-slate-500 text-xs">לשאלות ועדכונים</p>
                <a
                  href="https://wa.me/972509766686?text=%D7%A9%D7%9C%D7%95%D7%9D%2C%20%D7%90%D7%A9%D7%9E%D7%97%20%D7%9C%D7%A7%D7%91%D7%9C%20%D7%A4%D7%A8%D7%98%D7%99%D7%9D%20%D7%9C%D7%92%D7%91%D7%99%20%D7%90%D7%A4%D7%9C%D7%99%D7%A7%D7%A6%D7%99%D7%99%D7%AA%20%D7%A0%D7%95%D7%95%D7%94%20%D7%A2%D7%95%D7%A4%D7%A8"
                  className="inline-flex items-center gap-2 bg-green-700/20 border border-green-600/30 text-green-400 rounded-xl px-4 py-2 text-sm hover:bg-green-700/30 transition-colors"
                >
                  💬 יצירת קשר בווטאפ
                </a>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
}
