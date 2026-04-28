export interface Yahrzeit {
  id: string;
  name: string;
  monthName: string; // שם החודש בעברית: ניסן, אייר, סיון, תמוז, אב, אלול, תשרי, חשון, כסלו, טבת, שבט, אדר
  day: number;       // יום בחודש (1–30)
}

export const HEBREW_MONTHS = [
  'תשרי', 'חשון', 'כסלו', 'טבת', 'שבט', 'אדר',
  'ניסן', 'אייר', 'סיון', 'תמוז', 'אב', 'אלול',
];

// ⚠️ יש לעדכן את תאריכי הפטירה:
export const DEFAULT_YAHRZEITS: Yahrzeit[] = [
  { id: '1', name: 'מישאל בן זילפה',   monthName: '', day: 0 },
  { id: '2', name: "ר' אפרים בן ציונה", monthName: '', day: 0 },
  { id: '3', name: 'וירון בן צבי',      monthName: '', day: 0 },
];

const LS_KEY = 'neve-ofer-yahrzeits-v1';

export function loadYahrzeits(): Yahrzeit[] {
  if (typeof window === 'undefined') return DEFAULT_YAHRZEITS;
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_YAHRZEITS;
  } catch { return DEFAULT_YAHRZEITS; }
}

export function saveYahrzeits(list: Yahrzeit[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(list)); } catch { /* ignore */ }
}

export function getTodayHebrewMonthDay(): { monthName: string; day: number } {
  const now = new Date();
  const tz = 'Asia/Jerusalem';
  const monthName = new Intl.DateTimeFormat('he-u-ca-hebrew', { month: 'long', timeZone: tz }).format(now);
  // nu-latn forces western numerals so we can parseInt safely
  const dayStr = new Intl.DateTimeFormat('he-u-ca-hebrew-nu-latn', { day: 'numeric', timeZone: tz }).format(now);
  const day = parseInt(dayStr.replace(/\D/g, '')) || 0;
  return { monthName, day };
}
