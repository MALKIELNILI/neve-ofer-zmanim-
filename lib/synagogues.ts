export interface PrayerSlot {
  time: string;
  desc: string;
  isRelative?: boolean;
  anchor?: string;
  offsetMin?: number;
  offsetDir?: 'before' | 'after' | 'exact';
}
export interface WeekdayPrayers { shacharit: PrayerSlot[]; mincha: PrayerSlot[]; maariv: PrayerSlot[]; }
export interface ShabbatPrayers { minchaErevShabbat: PrayerSlot[]; kabbalatShabbat: PrayerSlot[]; shacharit: PrayerSlot[]; mincha: PrayerSlot[]; maariv: PrayerSlot[]; }
export interface Shiur { id: string; name: string; lecturer: string; schedule: string; time: string; desc: string; }
export interface Synagogue {
  id: number; name: string; address: string;
  rabbiName: string; rabbiPhone: string; gabbaiName: string; gabbaiPhone: string;
  weekday: WeekdayPrayers; shabbat: ShabbatPrayers;
  shiurim: Shiur[]; timesConfirmed: boolean; timesUpdatedAt: string | null;
  editPin?: string;
  imageUrl?: string;
}
export interface UpdatePayload {
  name?: string;
  weekday: WeekdayPrayers; shabbat: ShabbatPrayers; shiurim: Shiur[];
  rabbiName: string; rabbiPhone: string; gabbaiName: string; gabbaiPhone: string;
  address: string; editPin?: string; imageUrl?: string;
}

// helpers
const s   = (time: string, desc = ''): PrayerSlot => ({ time, desc });
const rel = (anchor: string, offsetMin: number, offsetDir: 'before'|'after'|'exact', desc: string): PrayerSlot =>
  ({ time: '', desc, isRelative: true, anchor, offsetMin, offsetDir });
const netz  = (desc = 'קורבנות') => rel('sunrise',        0,  'exact',  `בנץ - ${desc}`);
const plag  = (desc = 'פלג')     => rel('plagHaMincha',   0,  'exact',  desc);
const tzait = (min: number)       => rel('tzait',          min,'before', `${min} דק לפני צאת שבת`);
const knisa = (min: number)       => rel('candleLighting', min,'before', `${min} דק לפני כניסת שבת`);
const empty = (): PrayerSlot => ({ time: '', desc: '' });

const sh = (id: string, name: string, lecturer: string, schedule: string, time: string, desc = ''): Shiur =>
  ({ id, name, lecturer, schedule, time, desc });

function mk(id: number, name: string, address = ''): Synagogue {
  return {
    id, name, address,
    rabbiName: '', rabbiPhone: '', gabbaiName: '', gabbaiPhone: '',
    weekday:  { shacharit: [empty()], mincha: [empty()], maariv: [empty()] },
    shabbat:  { minchaErevShabbat: [empty()], kabbalatShabbat: [empty()], shacharit: [empty()], mincha: [empty()], maariv: [empty()] },
    shiurim: [], timesConfirmed: false, timesUpdatedAt: null,
  };
}

export const DATA_VERSION = 5;

export const SYNAGOGUES_INITIAL: Synagogue[] = [

  // 1 — אלי בעזרי (רש"י למעלה — קומה ב', צוני 11)
  {
    ...mk(1, 'אלי בעזרי', 'צוני 11'),
    weekday: {
      shacharit: [netz('קורבנות'), s('07:15','קורבנות')],
      mincha:    [empty()],
      maariv:    [empty()],
    },
    shabbat: {
      minchaErevShabbat: [empty()],
      kabbalatShabbat:   [empty()],
      shacharit:         [empty()],
      mincha:            [empty()],
      maariv:            [empty()],
    },
    shiurim: [
      sh('alib-1', 'עונג שבת',   'הרב מנשה עובדיה שליט"א',  'שבת',  '22:00', 'קומה ב\''),
      sh('alib-2', 'שיעור שבת',  'הרב מאור עובדיה שליט"א',  'שבת',  '16:30', 'עד 17:30'),
      sh('alib-3', 'שיעור שבת',  'רב מתחלף',                 'שבת',  '14:00', 'עד 15:00'),
    ],
  },

  // 2 — רש"י (צוני 11)
  {
    ...mk(2, 'רש"י', 'צוני 11'),
    weekday: {
      shacharit: [netz(), s('06:50','קורבנות'), s('07:15','קורבנות'), s('08:35','הודו')],
      mincha:    [s('13:10','מנחה גדולה'), s('16:40','מנחה מוקדמת')],
      maariv:    [s('20:45'), s('22:00')],
    },
    shabbat: {
      minchaErevShabbat: [knisa(60)],
      kabbalatShabbat:   [empty()],
      shacharit:         [s('07:00'), s('08:00','מניין א\'')],
      mincha:            [s('13:10'), s('16:30','מניין ב\'')],
      maariv:            [empty()],
    },
    shiurim: [
      sh('rashi-1', 'שיעור ערב',       'הרב מרדכי ג\'ורג\'י שליט"א',     'א\'–ג\'',    '19:45', 'ערבית בסיום'),
      sh('rashi-2', 'שיעור ערב',       'הרב מאור עובדיה שליט"א',         'ד\'–ה\'',    '19:45', 'ערבית בסיום'),
      sh('rashi-3', 'הלכה שבת',        'הרב מלכיאל יצחקוב שליט"א',      'יום ד\'',    '21:00', 'ערבית בסיום'),
      sh('rashi-4', 'שיעור לאחר ערבית','הרב ברוך ביביב שליט"א',          'יום ה\'',    '',      'צאת הכוכבים'),
      sh('rashi-5', 'עונג שבת',        'הרב מנשה עובדיה שליט"א',         'שבת',        '22:00', 'קומה ב\''),
      sh('rashi-6', 'שיעור שבת',       'הרב מאור עובדיה שליט"א',         'שבת',        '16:30', 'עד 17:30'),
    ],
  },

  // 3 — אלי כהן (מאיר גרוסמן 14)
  {
    ...mk(3, 'אלי כהן', 'מאיר גרוסמן 14'),
    weekday: {
      shacharit: [netz(), s('07:00','מניין ב\'')],
      mincha:    [empty()],
      maariv:    [empty()],
    },
    shiurim: [
      sh('kohn-1', 'שיעור בוקר',       'הרב גבריאל קולדנוב שליט"א',   'א\'–ד\'',  '08:30', 'עד 10:00'),
      sh('kohn-2', 'שיעור לנשים',      'הרבנית',                        'יום ב\'',  '21:00', 'עד 22:00'),
      sh('kohn-3', 'שיעור הלכה',       'הרב יהודה יוסיפוב שליט"א',    'א\' וה\'', '21:00', ''),
      sh('kohn-4', 'שיעור שבת',        'הרב יוסף מלכא שליט"א',         'שבת',      '16:00', ''),
      sh('kohn-5', 'הלכה לפני שבת',   'הרב יהודה יוסיפוב שליט"א',    'שבת',      '',      'כשעה לפני צאת שבת'),
    ],
  },

  // 4 — מרכזי בוכרים (מנחם ארבר 8)
  {
    ...mk(4, 'מרכזי בוכרים', 'מנחם ארבר 8'),
    weekday: {
      shacharit: [s('05:45','קורבנות')],
      mincha:    [empty()],
      maariv:    [empty()],
    },
    shiurim: [
      sh('arbr-1', 'שיעור הלכה',  'הרב חן דיודוב שליט"א', 'א\', ד\', ה\'', '20:00', ''),
      sh('arbr-2', 'שיעור שבת',   'הרב חן דיודוב שליט"א', 'שבת',           '14:00', ''),
    ],
  },

  // 5 — היכל דוד (זלמן שז"ר 42)
  {
    ...mk(5, 'היכל דוד', 'זלמן שז"ר 42'),
    weekday: {
      shacharit: [s('06:30','קורבנות')],
      mincha:    [s('16:40','מנחה מוקדמת')],
      maariv:    [s('20:25')],
    },
    shabbat: {
      minchaErevShabbat: [empty()],
      kabbalatShabbat:   [empty()],
      shacharit:         [empty()],
      mincha:            [s('14:00'), s('17:00','מניין ב\'')],
      maariv:            [empty()],
    },
    shiurim: [
      sh('hd-1', 'דף היומי',     'הרב נתנאל חניה שליט"א',   'א\'–ה\'',   '19:45', ''),
      sh('hd-2', 'שיעור שבועי',  'הרב משה זבולון שליט"א',    'ב\' וד\'',  '18:45', ''),
      sh('hd-3', 'שיעור שבת',    'הרב משה זבולון שליט"א',    'שבת',       '15:00', 'עד 16:00'),
    ],
  },

  // 6 — היכל אהרון (זלמן שז"ר 42)
  {
    ...mk(6, 'היכל אהרון', 'זלמן שז"ר 42'),
    weekday: {
      shacharit: [netz()],
      mincha:    [empty()],
      maariv:    [empty()],
    },
    shabbat: {
      minchaErevShabbat: [s('17:15','פתח אליה')],
      kabbalatShabbat:   [empty()],
      shacharit:         [s('08:15','פתח אליה')],
      mincha:            [s('14:00'), s('17:00','מניין ב\'')],
      maariv:            [empty()],
    },
    shiurim: [
      sh('ha-1', 'שיעור שבת', 'הרב אליהו/חנניה שליט"א', 'שבת', '', '45 דק לפני צאת שבת'),
    ],
  },

  // 7 — עזרת אחים (זלמן שז"ר 42)
  {
    ...mk(7, 'עזרת אחים', 'זלמן שז"ר 42'),
    weekday: {
      shacharit: [s('05:20','מניין פועלים'), s('07:30','קורבנות')],
      mincha:    [s('16:40','מנחה מוקדמת')],
      maariv:    [empty()],
    },
    shiurim: [
      sh('ea-1', 'שיעור הלכה', 'הרב פנחס צברי שליט"א', 'ב\' וה\'', '21:00', 'עד 22:30'),
      sh('ea-2', 'שיעור שבת',  'הרב פנחס צברי שליט"א', 'שבת',      '16:30', ''),
    ],
  },

  // 8 — בית אל צעירי בוכרה (זלמן שז"ר 42)
  {
    ...mk(8, 'בית אל צעירי בוכרה', 'זלמן שז"ר 42'),
    weekday: {
      shacharit: [s('05:30','הודו'), s('08:15','הודו')],
      mincha:    [plag('פלג - מנחה מוקדמת')],
      maariv:    [plag('פלג - ערבית מוקדמת'), s('21:10','ערבית מאוחרת')],
    },
    shabbat: {
      minchaErevShabbat: [plag('פלג'), knisa(10)],
      kabbalatShabbat:   [empty()],
      shacharit:         [empty()],
      mincha:            [empty()],
      maariv:            [empty()],
    },
    shiurim: [
      sh('ba-1', 'חברותות כולל', 'אברכי כולל ישכבר באהליך',     'א\'–ה\'', '19:45', 'עד 21:10, ערבית בסיום'),
      sh('ba-2', 'שיעור שבת',    'הרב נתנאל ניסימוב שליט"א',    'שבת',     '',      'כשעה לפני צאת שבת'),
    ],
  },

  // 9 — פירוב (זלמן שז"ר 33)
  {
    ...mk(9, 'פירוב', 'זלמן שז"ר 33'),
    weekday: {
      shacharit: [s('06:20','קורבנות'), s('08:00','הודו'), s('09:00','הודו (ללא שישי)')],
      mincha:    [empty()],
      maariv:    [s('23:00')],
    },
    shabbat: {
      minchaErevShabbat: [knisa(30)],
      kabbalatShabbat:   [empty()],
      shacharit:         [s('07:30','קורבנות')],
      mincha:          [s('13:00','מניין א\''), s('17:00')],
      maariv:          [tzait(10)],
    },
    shiurim: [
      sh('pirv-1', 'חברותות כולל',    'אברכי הכולל',                  'א\'–ה\'', '17:15', 'עד 18:45'),
      sh('pirv-2', 'שיעור ממתחלף',    'רב ממתחלף',                    'א\'–ה\'', '22:15', 'ערבית בסיום 23:00'),
      sh('pirv-3', 'שיעור שבת',       'הרב משה אלנתנוב שליט"א',      'שבת',     '13:30', ''),
      sh('pirv-4', 'שיעור שבת',       'הרב מלכיאל יצחקוב שליט"א',   'שבת',     '14:00', ''),
    ],
  },

  // 10 — משה אלעזרוב (זלמן שז"ר 25)
  {
    ...mk(10, 'משה אלעזרוב', 'זלמן שז"ר 25'),
    shiurim: [
      sh('alex-1', 'שיעור ג\'', 'הרב גרי יעקבוב שליט"א', 'יום ג\'', '21:00', 'עד 22:30'),
    ],
  },

  // 11 — חפיזוב (זלמן שז"ר 27)
  {
    ...mk(11, 'חפיזוב', 'זלמן שז"ר 27'),
    weekday: {
      shacharit: [s('06:30','קורבנות')],
      mincha:    [empty()],
      maariv:    [empty()],
    },
    shiurim: [
      sh('haf-1', 'שיעור א\'',       'הרב יצחק חפיזוב שליט"א',   'יום א\'', '21:00', 'עד 22:30, מנחה בסיום'),
      sh('haf-2', 'מלכות הגניגה',    '',                           'יום ב\'', '21:00', 'עד 22:00'),
      sh('haf-3', 'כולל חברותות',    'תלמידי חכמים',              'יום ה\'', '21:00', 'עד 23:00'),
      sh('haf-4', 'שיעור שבת',       'הרב יעקב ישראלוב שליט"א',  'שבת',     '13:30', 'פרשת השבוע ומסכת ברכות'),
    ],
  },

  // 12 — ארמונות מזל (גרינבוים 41)
  {
    ...mk(12, 'ארמונות מזל', 'גרינבוים 41'),
    weekday: {
      shacharit: [s('06:30','קורבנות')],
      mincha:    [s('13:30','מנחה גדולה'), plag('פלג - מנחה מוקדמת')],
      maariv:    [plag('פלג - ערבית מוקדמת')],
    },
  },

  // 13 — חב"ד (זלמן שז"ר 42)
  {
    ...mk(13, 'חב"ד', 'זלמן שז"ר 42'),
    weekday: {
      shacharit: [netz()],
      mincha:    [empty()],
      maariv:    [empty()],
    },
    shabbat: {
      minchaErevShabbat: [plag('פלג'), s('17:40','מלא')],
      kabbalatShabbat:   [empty()],
      shacharit:         [s('08:00'), s('09:15')],
      mincha:          [s('13:15')],
      maariv:          [tzait(10)],
    },
    shiurim: [
      sh('chbd-1', 'שיעור שבת', '', 'שבת', '16:55', 'הלכה/קבלה חסידות, ניגוני נשמה'),
    ],
  },

  // 14 — פינחסוב
  mk(14, 'פינחסוב'),
];

function toSlots(v: unknown): PrayerSlot[] {
  if (!v) return [{ time: '', desc: '' }];
  if (Array.isArray(v)) return v as PrayerSlot[];
  return [{ time: String(v), desc: '' }];
}

export function migrateOldData(data: unknown[]): Synagogue[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((s: any) => {
    const isOld = s.weekday && !Array.isArray(s.weekday.shacharit);
    if (!isOld) return s as Synagogue;
    return {
      ...s,
      weekday: { shacharit: toSlots(s.weekday?.shacharit), mincha: toSlots(s.weekday?.mincha), maariv: toSlots(s.weekday?.maariv) },
      shabbat: { minchaErevShabbat: toSlots(s.shabbat?.minchaErevShabbat), kabbalatShabbat: toSlots(s.shabbat?.kabbalatShabbat), shacharit: toSlots(s.shabbat?.shacharitShabbat ?? s.shabbat?.shacharit), mincha: toSlots(s.shabbat?.mincha), maariv: toSlots(s.shabbat?.maariv) },
      shiurim: s.shiurim ?? [],
    } as Synagogue;
  });
}
