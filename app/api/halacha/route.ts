import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const CHANNEL = 'Halacha2';

const JUNK = /שיתוף|העברה לחברים|מצווה גדולה|מעשה קטן|👌|🔗|🫱|💎|\d+\s*views/;

export async function GET() {
  try {
    const res = await fetch(`https://t.me/s/${CHANNEL}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch channel' }, { status: 502 });
    }

    const html = await res.text();

    const messageRegex = /<div class="tgme_widget_message_text[^"]*" dir="auto"[^>]*>([\s\S]*?)<\/div>/g;
    const dateRegex = /<time[^>]+datetime="([^"]+)"[^>]*>/g;

    const messages: string[] = [];
    const dates: string[] = [];
    let m: RegExpExecArray | null;

    while ((m = messageRegex.exec(html)) !== null) {
      const text = m[1]
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();
      if (text) messages.push(text);
    }

    while ((m = dateRegex.exec(html)) !== null) {
      dates.push(m[1]);
    }

    if (messages.length === 0) {
      return NextResponse.json({ text: null, error: 'No messages found' });
    }

    const cleaned = messages.map(msg =>
      msg.split('\n')
        .filter(line => !JUNK.test(line))
        .join('\n')
        .trim()
    ).filter(Boolean);

    const latest = cleaned[cleaned.length - 1] ?? null;
    const latestDate = dates[dates.length - 1];

    const dateStr = latestDate
      ? new Date(latestDate).toLocaleDateString('he-IL', {
          timeZone: 'Asia/Jerusalem',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : null;

    return NextResponse.json({ text: latest, date: dateStr });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
