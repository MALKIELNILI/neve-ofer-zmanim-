-- ═══════════════════════════════════════════════
--  לוח נווה עופר — הגדרת מסד נתונים Supabase
--  הרץ את כל הקוד הזה ב-SQL Editor של Supabase
-- ═══════════════════════════════════════════════

-- מחיקת טבלאות ישנות (אם קיימות מגרסה ישנה)
DROP TABLE IF EXISTS synagogues CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;

-- ── טבלת בתי כנסת ──────────────────────────────
CREATE TABLE synagogues (
  id                INTEGER PRIMARY KEY,
  name              TEXT    NOT NULL DEFAULT '',
  address           TEXT             DEFAULT '',
  rabbi_name        TEXT             DEFAULT '',
  rabbi_phone       TEXT             DEFAULT '',
  gabbai_name       TEXT             DEFAULT '',
  gabbai_phone      TEXT             DEFAULT '',
  weekday_prayers   JSONB            DEFAULT '{"shacharit":[{"time":"","desc":""}],"mincha":[{"time":"","desc":""}],"maariv":[{"time":"","desc":""}]}'::jsonb,
  shabbat_prayers   JSONB            DEFAULT '{"minchaErevShabbat":[{"time":"","desc":""}],"kabbalatShabbat":[{"time":"","desc":""}],"shacharit":[{"time":"","desc":""}],"mincha":[{"time":"","desc":""}],"maariv":[{"time":"","desc":""}]}'::jsonb,
  shiurim           JSONB            DEFAULT '[]'::jsonb,
  edit_pin          TEXT             DEFAULT NULL,
  times_confirmed   BOOLEAN          DEFAULT false,
  times_updated_at  TIMESTAMPTZ,
  created_at        TIMESTAMPTZ      DEFAULT NOW()
);

-- ── טבלת הודעות שכונתיות ───────────────────────
CREATE TABLE announcements (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  category    TEXT        DEFAULT 'general',
  title       TEXT        NOT NULL DEFAULT '',
  body        TEXT        DEFAULT '',
  event_date  TEXT        DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── הכנסת 14 בתי הכנסת (שורות ריקות) ───────────
INSERT INTO synagogues (id, name) VALUES
  (1,  'אלי בעזרי'),
  (2,  'רש"י'),
  (3,  'אלי כהן'),
  (4,  'מרכזי בוכרים'),
  (5,  'היכל דוד'),
  (6,  'היכל אהרון'),
  (7,  'עזרת אחים'),
  (8,  'בית אל צעירי בוכרה'),
  (9,  'פירוב'),
  (10, 'משה אלעזרוב'),
  (11, 'חפיזוב'),
  (12, 'ארמונות מזל'),
  (13, 'חב"ד'),
  (14, 'פינחסוב')
ON CONFLICT (id) DO NOTHING;

-- ── Real-Time ──────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE synagogues;
ALTER PUBLICATION supabase_realtime ADD TABLE announcements;

-- ── הרשאות (Row Level Security) ────────────────
ALTER TABLE synagogues    ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_read_synagogues"
  ON synagogues FOR SELECT USING (true);
CREATE POLICY "allow_update_synagogues"
  ON synagogues FOR UPDATE USING (true);
CREATE POLICY "allow_insert_synagogues"
  ON synagogues FOR INSERT WITH CHECK (true);

CREATE POLICY "allow_read_announcements"
  ON announcements FOR SELECT USING (true);
CREATE POLICY "allow_insert_announcements"
  ON announcements FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_delete_announcements"
  ON announcements FOR DELETE USING (true);
