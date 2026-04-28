import { NextResponse } from 'next/server';
import { getZmanimJson } from 'kosher-zmanim';

export const dynamic = 'force-dynamic';

const LAT = 32.047;
const LNG = 34.773;
const TZ  = 'Asia/Jerusalem';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get('date');
  const date = dateParam ? new Date(dateParam) : new Date();

  const z = getZmanimJson({ date, latitude: LAT, longitude: LNG, timeZoneId: TZ, elevation: 0 }).BasicZmanim as Record<string, unknown>;

  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);
  const nextZ = getZmanimJson({ date: nextDay, latitude: LAT, longitude: LNG, timeZoneId: TZ, elevation: 0 }).BasicZmanim as Record<string, unknown>;

  const sunsetMs    = new Date(z['Sunset'] as string).getTime();
  const nextRiseMs  = new Date(nextZ['Sunrise'] as string).getTime();
  const chatzotLayla = new Date((sunsetMs + nextRiseMs) / 2).toISOString();

  const hebrewFormatter = new Intl.DateTimeFormat('he-u-ca-hebrew', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: TZ,
  });
  const days = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];

  return NextResponse.json({
    alotHashachar:  z['AlosHashachar'],
    sunrise:        z['Sunrise'],
    sofZmanShmaGRA: z['SofZmanShmaGRA'],
    sofZmanShmaMGA: z['SofZmanShmaMGA'],
    chatzot:        z['Chatzos'],
    minchaGedola:   z['MinchaGedola'],
    minchaKetana:   z['MinchaKetana'],
    plagHaMincha:   z['PlagHamincha'],
    sunset:         z['Sunset'],
    candleLighting: date.getDay() === 5 ? z['CandleLighting'] : null,
    chatzotLayla,
    tzait:          z['Tzais'],
    tzaitRT:        z['Tzais72'],
    hebrewDate:     hebrewFormatter.format(date),
    dayName:        `יום ${days[date.getDay()]}`,
    gregorianDate:  date.toLocaleDateString('he-IL', { timeZone: TZ }),
    isShabbat:      date.getDay() === 6,
    isFriday:       date.getDay() === 5,
  });
}
