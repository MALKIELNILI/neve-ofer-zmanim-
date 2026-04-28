// TitleSection is now rendered inside AppClient with shared filter state
import { AppClient } from '@/components/AppClient';

export default function Home() {
  return (
    <main className="max-w-lg mx-auto min-h-screen pb-12">
      <AppClient />
      <footer className="text-center text-slate-700 text-xs pb-4 px-4">
        <div className="w-24 h-px bg-gradient-to-r from-transparent via-gold-700/40 to-transparent mx-auto mb-2" />
        זמנים לפי לוח אור החיים · נווה עופר
      </footer>
    </main>
  );
}
