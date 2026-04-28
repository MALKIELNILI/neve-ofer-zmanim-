import SunCalc from 'suncalc';

const LAT = 32.047;
const LNG = 34.773;
const TZ  = 'Asia/Jerusalem';
const MIN = (m: number) => m * 60 * 1000;

export interface DayZmanim {
  alotHashachar:  Date;
  sunrise:        Date;
  sofZmanShmaGRA: Date;
  sofZmanShmaMGA: Date;
  chatzot:        Date;
  minchaGedola:   Date;
  minchaKetana:   Date;
  plagHaMincha:   Date;
  sunset:         Date;
  candleLighting: Date | null;
  chatzotLayla:   Date;
  tzait:          Date;
  tzaitRT:        Date;
  hebrewDate:     string;
  dayName:        string;
  gregorianDate:  string;
  isShabbat:      boolean;
  isFriday:       boolean;
}

// ממיר תשובת JSON מה-API ל-DayZmanim עם אוביקטי Date
export function zmanimFromJson(j: Record<string, unknown>): DayZmanim {
  const d = (k: string) => new Date(j[k] as string);
  return {
    alotHashachar:  d('alotHashachar'),
    sunrise:        d('sunrise'),
    sofZmanShmaGRA: d('sofZmanShmaGRA'),
    sofZmanShmaMGA: d('sofZmanShmaMGA'),
    chatzot:        d('chatzot'),
    minchaGedola:   d('minchaGedola'),
    minchaKetana:   d('minchaKetana'),
    plagHaMincha:   d('plagHaMincha'),
    sunset:         d('sunset'),
    candleLighting: j['candleLighting'] ? d('candleLighting') : null,
    chatzotLayla:   d('chatzotLayla'),
    tzait:          d('tzait'),
    tzaitRT:        d('tzaitRT'),
    hebrewDate:     j['hebrewDate']   as string,
    dayName:        j['dayName']      as string,
    gregorianDate:  j['gregorianDate'] as string,
    isShabbat:      j['isShabbat']    as boolean,
    isFriday:       j['isFriday']     as boolean,
  };
}

// גיבוי בצד-לקוח עם suncalc (browser-compatible)
export function calculateDayZmanim(date: Date = new Date()): DayZmanim {
  const times = SunCalc.getTimes(date, LAT, LNG);
  const rise  = times.sunrise.getTime();
  const set   = times.sunsetStart.getTime();
  const dayLen = set - rise;
  const sha    = dayLen / 12;
  const alot   = new Date(rise - MIN(72));
  const tzaitRT = new Date(set + MIN(72));
  const shaMGA  = (tzaitRT.getTime() - alot.getTime()) / 12;

  const nextDay = new Date(date); nextDay.setDate(nextDay.getDate() + 1);
  const nextRise = SunCalc.getTimes(nextDay, LAT, LNG).sunrise.getTime();
  const chatzotLayla = new Date((set + nextRise) / 2);

  const hebrewFormatter = new Intl.DateTimeFormat('he-u-ca-hebrew', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: TZ,
  });
  const days = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];

  return {
    alotHashachar:  alot,
    sunrise:        times.sunrise,
    sofZmanShmaGRA: new Date(rise + 3 * sha),
    sofZmanShmaMGA: new Date(alot.getTime() + 3 * shaMGA),
    chatzot:        new Date(rise + 6 * sha),
    minchaGedola:   new Date(rise + 6.5 * sha),
    minchaKetana:   new Date(rise + 9.5 * sha),
    plagHaMincha:   new Date(rise + 10.75 * sha),
    sunset:         times.sunsetStart,
    candleLighting: date.getDay() === 5 ? new Date(set - MIN(20)) : null,
    chatzotLayla,
    tzait:          new Date(set + MIN(18)),
    tzaitRT,
    hebrewDate:     hebrewFormatter.format(date),
    dayName:        `יום ${days[date.getDay()]}`,
    gregorianDate:  date.toLocaleDateString('he-IL', { timeZone: TZ }),
    isShabbat:      date.getDay() === 6,
    isFriday:       date.getDay() === 5,
  };
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('he-IL', {
    hour: '2-digit', minute: '2-digit', timeZone: TZ, hour12: false,
  });
}

export type ZmanimAnchorKey = keyof Omit<DayZmanim,
  'hebrewDate' | 'dayName' | 'gregorianDate' | 'isShabbat' | 'isFriday'>;

export const ZMANIM_ANCHORS: { key: ZmanimAnchorKey; label: string }[] = [
  { key: 'alotHashachar',  label: 'עלות השחר'   },
  { key: 'sunrise',        label: 'נץ החמה'      },
  { key: 'sofZmanShmaMGA', label: 'סוף ק"ש מג"א' },
  { key: 'sofZmanShmaGRA', label: 'סוף ק"ש גר"א' },
  { key: 'chatzot',        label: 'חצות היום'    },
  { key: 'minchaGedola',   label: 'מנחה גדולה'   },
  { key: 'minchaKetana',   label: 'מנחה קטנה'    },
  { key: 'plagHaMincha',   label: 'פלג המנחה'    },
  { key: 'sunset',         label: 'שקיעה'         },
  { key: 'candleLighting', label: 'הדלקת נרות'    },
  { key: 'tzait',          label: 'צאת הכוכבים'   },
  { key: 'tzaitRT',        label: 'צאת שבת ר"ת'   },
  { key: 'chatzotLayla',   label: 'חצות הלילה'    },
];

export function calcRelativeDate(
  anchor: ZmanimAnchorKey,
  offsetMin: number,
  dir: 'before' | 'after' | 'exact',
  zmanim: DayZmanim,
): Date | null {
  const base = zmanim[anchor] as Date;
  if (!(base instanceof Date) || isNaN(base.getTime())) return null;
  let ms = base.getTime();
  if (dir === 'before') ms -= offsetMin * 60_000;
  else if (dir === 'after') ms  += offsetMin * 60_000;
  return new Date(ms);
}

export function resolveSlotTime(
  slot: { time: string; isRelative?: boolean; anchor?: string; offsetMin?: number; offsetDir?: string },
  zmanim: DayZmanim | null,
): string {
  if (slot.isRelative && slot.anchor && zmanim) {
    const d = calcRelativeDate(
      slot.anchor as ZmanimAnchorKey,
      slot.offsetMin ?? 0,
      (slot.offsetDir as 'before' | 'after' | 'exact') ?? 'exact',
      zmanim,
    );
    if (d) return formatTime(d);
  }
  return slot.time;
}
