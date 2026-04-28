'use client';

import { useState, useEffect } from 'react';
import { useSynagogues } from '@/hooks/useSynagogues';
import { useAdmin } from '@/hooks/useAdmin';
import { zmanimFromJson, type DayZmanim } from '@/lib/zmanim';
import { type FilterKey } from './PrayerFilter';
import { TitleSection } from './TitleSection';
import { DateHeader } from './DateHeader';
import { SearchSection } from './SearchSection';
import { ZmanimSection } from './ZmanimSection';
import { SynagoguesSection } from './SynagoguesSection';
import { AnnouncementsSection } from './AnnouncementsSection';
import { YahreitBanner } from './YahreitBanner';
import { AdminBar } from './AdminBar';
import { HalachaSection } from './HalachaSection';
import { ScrollToTop } from './ScrollToTop';
import { InstructionsButton } from './InstructionsModal';

export function AppClient() {
  const { synagogues, updateSynagogue, loaded } = useSynagogues();
  const { isAdmin, gabbaiOf } = useAdmin();
  const [zmanim, setZmanim]             = useState<DayZmanim | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('');

  useEffect(() => {
    const fetchToday = () =>
      fetch('/api/zmanim')
        .then(r => r.json())
        .then(data => setZmanim(zmanimFromJson(data)))
        .catch(() => setZmanim(null));

    fetchToday();
    const now = new Date();
    const msToMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();
    const t = setTimeout(fetchToday, msToMidnight);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <TitleSection />
      <DateHeader />
      <YahreitBanner isAdmin={isAdmin} />
      <SearchSection synagogues={synagogues} zmanim={zmanim} activeFilter={activeFilter} onFilterChange={(k) => setActiveFilter(k as FilterKey)} />
      <ZmanimSection />
      <SynagoguesSection
        synagogues={synagogues} onUpdate={updateSynagogue} loaded={loaded}
        isAdmin={isAdmin} gabbaiOf={gabbaiOf}
        zmanim={zmanim} activeFilter={activeFilter}
      />
      <HalachaSection />
      <AnnouncementsSection isAdmin={isAdmin} />
      <AdminBar synagogues={synagogues} />
      <ScrollToTop />
      <InstructionsButton />
    </>
  );
}
