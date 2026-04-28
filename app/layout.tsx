import type { Metadata, Viewport } from 'next';
import { Heebo, Frank_Ruhl_Libre, Rubik, Alef, Secular_One, Suez_One, Assistant, Noto_Serif_Hebrew } from 'next/font/google';
import './globals.css';

const heebo      = Heebo({ subsets: ['hebrew', 'latin'], variable: '--font-heebo', display: 'swap' });
const frank      = Frank_Ruhl_Libre({ subsets: ['hebrew'], weight: ['400', '700', '900'], variable: '--font-frank', display: 'swap' });
const rubik      = Rubik({ subsets: ['hebrew', 'latin'], variable: '--font-rubik', display: 'swap' });
const alef       = Alef({ subsets: ['hebrew'], weight: ['400', '700'], variable: '--font-alef', display: 'swap' });
const secular    = Secular_One({ subsets: ['hebrew', 'latin'], weight: '400', variable: '--font-secular', display: 'swap' });
const suez       = Suez_One({ subsets: ['hebrew', 'latin'], weight: '400', variable: '--font-suez', display: 'swap' });
const assistant  = Assistant({ subsets: ['hebrew', 'latin'], variable: '--font-assistant', display: 'swap' });
const notoSerif  = Noto_Serif_Hebrew({ subsets: ['hebrew'], weight: ['400', '700', '900'], variable: '--font-noto-serif', display: 'swap' });

export const viewport: Viewport = { width: 'device-width', initialScale: 1, maximumScale: 1, themeColor: '#0f172a' };

export const metadata: Metadata = {
  title: 'נווה עופר — זמני תפילה',
  description: 'זמני תפילה, שיעורי תורה והלכה יומית — שכונת נווה עופר תל אביב',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'נווה עופר' },
  icons: {
    apple: '/icons/apple-touch-icon.png',
    icon: '/icons/icon-192.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={`${heebo.variable} ${frank.variable} ${rubik.variable} ${alef.variable} ${secular.variable} ${suez.variable} ${assistant.variable} ${notoSerif.variable}`}>
      <body className="min-h-screen bg-navy-900">{children}</body>
    </html>
  );
}
