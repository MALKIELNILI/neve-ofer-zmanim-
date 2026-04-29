'use client';

import { useState, useEffect } from 'react';
import type { Synagogue, PrayerSlot, WeekdayPrayers, ShabbatPrayers, Shiur, UpdatePayload } from '@/lib/synagogues';
import { ZMANIM_ANCHORS, resolveSlotTime, formatTime, calcRelativeDate, calculateDayZmanim, type DayZmanim, type ZmanimAnchorKey } from '@/lib/zmanim';

// ── constants ──────────────────────────────────────────────────────────────
const WK_PRAYERS: { key: keyof WeekdayPrayers; label: string; icon: string; color: string }[] = [
  { key: 'shacharit', label: 'שחרית', icon: '🌅', color: 'text-amber-300'  },
  { key: 'mincha',    label: 'מנחה',  icon: '🌇', color: 'text-orange-300' },
  { key: 'maariv',    label: 'ערבית', icon: '🌙', color: 'text-indigo-300' },
];
const SH_PRAYERS: { key: keyof ShabbatPrayers; label: string; icon: string; color: string }[] = [
  { key: 'minchaErevShabbat', label: 'מנחה ערב שבת', icon: '🕯️', color: 'text-orange-300' },
  { key: 'kabbalatShabbat',   label: 'קבלת שבת',     icon: '✨',  color: 'text-gold-300'   },
  { key: 'shacharit',         label: 'שחרית שבת',    icon: '🌅',  color: 'text-amber-300'  },
  { key: 'mincha',            label: 'מנחה',          icon: '🌇',  color: 'text-orange-300' },
  { key: 'maariv',            label: 'מוצ\'\'ש',      icon: '✡️',  color: 'text-indigo-300' },
];
const MINYAN_LETTERS = ['א', 'ב', 'ג', 'ד', 'ה'];

// ── helpers ────────────────────────────────────────────────────────────────
const Tel = ({ phone }: { phone: string }) =>
  phone
    ? <a href={`tel:${phone}`} className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs bg-blue-900/20 border border-blue-700/30 rounded-lg px-2 py-0.5 transition-colors">
        📞 {phone}
      </a>
    : null;

// מוסיף שליט"א בלבד (כשה-label "הרב" מוצג בנפרד)
function addShlitta(name: string): string {
  if (!name) return '';
  const n = name.trim();
  if (n.includes('שליט') || n.includes('זצ') || n.includes('זכ')) return n;
  return n + ' שליט"א';
}

// מוסיף "הרב" + שליט"א (לשיעורים ומקומות ללא label)
function fmtRav(name: string): string {
  if (!name) return '';
  let n = name.trim();
  if (!n.startsWith('הרב') && !n.startsWith('הרבנית') && !n.startsWith('רב ')) n = 'הרב ' + n;
  if (!n.includes('שליט') && !n.includes('זצ') && !n.includes('זכ')) n += ' שליט"א';
  return n;
}

function fmtLecturer(name: string): string {
  if (!name) return '';
  const skip = ['אברכי', 'ממתחלף', 'תלמידי', 'כולל', 'רב מתחלף'];
  if (skip.some(w => name.includes(w))) return name;
  return fmtRav(name);
}

const Badge = ({ text }: { text: string }) =>
  text
    ? <span className="text-[10px] bg-gold-700/30 text-gold-400 border border-gold-600/30 rounded px-1.5 py-0.5 leading-none">{text}</span>
    : null;

const EMPTY_SLOT = [{ time: '', desc: '' }];

function withShlitta(name: string): string {
  if (!name.trim()) return name;
  const n = name.trim();
  if (n.includes('שליט') || n.includes('זצ') || n.includes('זכ')) return n;
  return n + ' שליט"א';
}

function buildForm(syn: Synagogue): UpdatePayload {
  const sh = syn.shabbat;
  return {
    weekday: JSON.parse(JSON.stringify(syn.weekday)),
    shabbat: JSON.parse(JSON.stringify({
      minchaErevShabbat: sh.minchaErevShabbat ?? EMPTY_SLOT,
      kabbalatShabbat:   sh.kabbalatShabbat   ?? EMPTY_SLOT,
      shacharit:         sh.shacharit         ?? EMPTY_SLOT,
      mincha:            sh.mincha            ?? EMPTY_SLOT,
      maariv:            sh.maariv            ?? EMPTY_SLOT,
    })),
    shiurim:    JSON.parse(JSON.stringify(syn.shiurim)),
    rabbiName:  withShlitta(syn.rabbiName),  rabbiPhone:  syn.rabbiPhone,
    gabbaiName: syn.gabbaiName,              gabbaiPhone: syn.gabbaiPhone,
    address:    syn.address,
  };
}

// ── main ───────────────────────────────────────────────────────────────────
interface Props {
  synagogue: Synagogue;
  isAdmin: boolean;
  gabbaiOf?: number | null;
  zmanim: DayZmanim | null;
  onUpdate: (id: number, payload: UpdatePayload) => void;
  onRemove?: (id: number) => void;
  forceOpen?: boolean;
}

export function SynagogueCard({ synagogue: syn, isAdmin, gabbaiOf, zmanim, onUpdate, onRemove, forceOpen }: Props) {
  const canEdit = isAdmin || gabbaiOf === syn.id;
  const [open,    setOpen]    = useState(false);
  const [editing, setEditing] = useState(false);
  const [form,    setForm]    = useState<UpdatePayload>(buildForm(syn));

  useEffect(() => { if (forceOpen) setOpen(true); }, [forceOpen]);

  const reset    = () => { setForm(buildForm(syn)); setEditing(false); };
  const save     = () => { onUpdate(syn.id, form); setEditing(false); };
  const handleRemove = () => {
    if (window.confirm(`למחוק את "${syn.name}"? פעולה זו אינה הפיכה.`)) {
      onRemove?.(syn.id);
    }
  };

  const updStr = syn.timesUpdatedAt
    ? new Date(syn.timesUpdatedAt).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' })
    : null;

  return (
    <div className="bg-navy-700 rounded-xl border border-gold-600/20 overflow-hidden">

      {/* ── Header ── */}
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-navy-600/40 transition-colors">
        <div className="flex items-center gap-3">
          <span className="text-xl">🕍</span>
          <div className="text-right">
            <p className="text-white font-semibold">{syn.name}</p>
            {syn.address && <p className="text-slate-500 text-xs">{syn.address}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {syn.timesConfirmed
            ? <span className="text-xs text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-full px-2 py-0.5">✓ {updStr}</span>
            : <span className="text-xs text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded-full px-2 py-0.5">לא מאושר</span>}
          <span className="text-slate-500 text-xs">{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {/* ── Expanded body ── */}
      {open && (
        <div className="border-t border-gold-600/10 px-4 pb-4 pt-3 space-y-4">

          {/* שם בית הכנסת — עריכה למנהל */}
          {editing && isAdmin && (
            <input
              type="text" value={form.name ?? syn.name} dir="rtl"
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="שם בית הכנסת"
              className="w-full bg-navy-800 border border-gold-600/30 rounded-xl px-3 py-2 text-gold-200 font-bold text-base outline-none focus:border-gold-400 mb-2"
            />
          )}

          {/* Contact */}
          {editing
            ? <EditContact form={form} setForm={setForm} showPin={isAdmin} />
            : <DisplayContact syn={syn} />}

          {/* Weekday */}
          <div>
            <p className="text-gold-500 text-xs font-semibold mb-2">🗓 ימי חול</p>
            {editing
              ? WK_PRAYERS.map(p => (
                  <SlotEditor key={p.key} label={p.label} icon={p.icon} color={p.color}
                    slots={form.weekday[p.key]}
                    zmanim={zmanim}
                    onChange={slots => setForm(f => ({ ...f, weekday: { ...f.weekday, [p.key]: slots } }))} />
                ))
              : <PrayerDisplay prayers={WK_PRAYERS} data={syn.weekday} zmanim={zmanim} />}
          </div>

          {/* Shabbat */}
          <div>
            <p className="text-gold-500 text-xs font-semibold mb-2">✡️ שבת קודש</p>
            {editing
              ? SH_PRAYERS.map(p => (
                  <SlotEditor key={p.key} label={p.label} icon={p.icon} color={p.color}
                    slots={form.shabbat[p.key]}
                    zmanim={zmanim}
                    onChange={slots => setForm(f => ({ ...f, shabbat: { ...f.shabbat, [p.key]: slots } }))} />
                ))
              : <PrayerDisplay prayers={SH_PRAYERS} data={syn.shabbat} zmanim={zmanim} />}
          </div>

          {/* Shiurim */}
          {(syn.shiurim.length > 0 || editing) && (
            <div>
              <p className="text-gold-500 text-xs font-semibold mb-2">📚 שיעורים</p>
              {editing
                ? <ShiurEditor shiurim={form.shiurim} onChange={s => setForm(f => ({ ...f, shiurim: s }))} />
                : <ShiurDisplay shiurim={syn.shiurim} />}
            </div>
          )}

          {/* Admin actions */}
          {canEdit && (
            <div className="flex gap-2 pt-1">
              {editing ? (
                <>
                  <button onClick={save}  className="flex-1 bg-gold-500 hover:bg-gold-400 text-navy-900 font-bold rounded-xl py-2.5 text-sm">✓ שמור</button>
                  <button onClick={reset} className="px-4 bg-navy-600 text-slate-300 rounded-xl py-2.5 text-sm">ביטול</button>
                  {onRemove && <button onClick={handleRemove} className="px-3 bg-red-900/60 hover:bg-red-800 text-red-300 rounded-xl py-2.5 text-sm">🗑</button>}
                </>
              ) : (
                <button onClick={() => setEditing(true)}
                  className="flex-1 border border-gold-600/30 hover:border-gold-400/60 text-gold-400 rounded-xl py-2.5 text-sm">
                  ✏️ עדכן זמנים ופרטים
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Display sub-components ─────────────────────────────────────────────────

function DisplayContact({ syn }: { syn: Synagogue }) {
  if (!syn.rabbiName && !syn.gabbaiName) return null;
  return (
    <div className="space-y-2 pb-1">
      {syn.rabbiName && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-gold-500 text-xs font-semibold shrink-0">הרב</span>
          <span className="text-slate-200 text-sm">{addShlitta(syn.rabbiName)}</span>
          <Tel phone={syn.rabbiPhone} />
        </div>
      )}
      {syn.gabbaiName && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-gold-500 text-xs font-semibold shrink-0">גבאי</span>
          <span className="text-slate-200 text-sm">{syn.gabbaiName}</span>
          <Tel phone={syn.gabbaiPhone} />
        </div>
      )}
    </div>
  );
}

function PrayerDisplay({ prayers, data, zmanim }: {
  prayers: { key: string; label: string; icon: string; color: string }[];
  data: WeekdayPrayers | ShabbatPrayers;
  zmanim: DayZmanim | null;
}) {
  const rows = prayers.map(({ key, label, icon, color }) => {
    const slots = ((data as unknown as Record<string, PrayerSlot[]>)[key] ?? []).filter(s => s.time || s.isRelative);
    return { key, label, icon, color, slots };
  }).filter(r => r.slots.length > 0);

  if (!rows.length) return null;

  return (
    <div className="rounded-xl overflow-hidden border border-navy-600/30">
      {rows.map(({ key, label, icon, color, slots }, ri) => {
        const multi = slots.length > 1;
        return (
          <div key={key} className={`flex items-center justify-between px-3 py-2.5 ${ri > 0 ? 'border-t border-navy-600/30' : ''}`}>
            {/* תווית התפילה */}
            <span className={`text-xs font-semibold shrink-0 w-28 ${color}`}>
              {icon} {label}
            </span>

            {/* שעות — ממורכזות */}
            <div className="flex flex-wrap justify-center gap-2 flex-1">
              {slots.map((s, i) => {
                const displayTime = resolveSlotTime(s, zmanim);
                const anchor = s.isRelative ? ZMANIM_ANCHORS.find(a => a.key === s.anchor) : null;
                const tooltip = anchor
                  ? `${s.offsetMin ? `${s.offsetMin} דק' ${s.offsetDir === 'before' ? 'לפני' : 'אחרי'}` : 'בדיוק'} ${anchor.label}`
                  : undefined;
                return (
                  <div key={i} className="flex flex-col items-center gap-0.5 bg-navy-800/80 rounded-lg px-3 py-1.5 min-w-[56px] border border-navy-600/40" title={tooltip}>
                    {multi && <span className="text-slate-500 text-[10px]">מניין {MINYAN_LETTERS[i] ?? i + 1}׳</span>}
                    <span className="text-white font-bold text-base tabular-nums leading-tight">
                      {displayTime || '--:--'}
                      {s.isRelative && <span className="text-slate-500 text-[10px] mr-0.5">⚡</span>}
                    </span>
                    {s.desc && <span className="text-gold-500 text-[10px] leading-tight text-center">{s.desc}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ShiurDisplay({ shiurim }: { shiurim: Shiur[] }) {
  return (
    <div className="rounded-xl overflow-hidden border border-navy-600/30">
      {shiurim.map((sh, i) => (
        <div key={sh.id} className={`flex items-center justify-between px-3 py-2.5 ${i > 0 ? 'border-t border-navy-600/30' : ''}`}>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium">{sh.name}</p>
            {sh.lecturer && <p className="text-gold-500 text-xs truncate">{fmtLecturer(sh.lecturer)}</p>}
            {sh.desc && <p className="text-slate-500 text-xs">{sh.desc}</p>}
          </div>
          <div className="text-center shrink-0 mr-2 bg-navy-800/80 rounded-lg px-3 py-1.5 min-w-[60px] border border-navy-600/40">
            <p className="text-white font-bold text-base tabular-nums">{sh.time}</p>
            <p className="text-slate-400 text-[10px]">{sh.schedule}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Edit sub-components ────────────────────────────────────────────────────

function EditContact({ form, setForm, showPin }: { form: UpdatePayload; setForm: React.Dispatch<React.SetStateAction<UpdatePayload>>; showPin?: boolean }) {
  return (
    <div className="space-y-2">
      <input type="text" value={form.address} placeholder="כתובת בית הכנסת"
        onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
        className="w-full bg-navy-800 border border-gold-600/25 rounded-lg px-3 py-2 text-white text-sm" />

      {/* Rabbi row */}
      <div className="flex items-center border border-gold-600/25 rounded-lg overflow-hidden bg-navy-800">
        <span className="bg-navy-900 text-gold-500 text-xs font-bold px-3 py-2.5 border-l border-gold-600/20 shrink-0 select-none">הרב</span>
        <input type="text" value={form.rabbiName} placeholder='שם הרב שליט"א'
          onChange={e => setForm(f => ({ ...f, rabbiName: e.target.value }))}
          className="flex-1 bg-transparent px-3 py-2 text-white text-sm outline-none min-w-0" />
        <input type="tel" value={form.rabbiPhone} placeholder="טלפון" dir="ltr"
          onChange={e => setForm(f => ({ ...f, rabbiPhone: e.target.value }))}
          className="w-32 bg-navy-900/50 border-r border-gold-600/15 px-2 py-2 text-white text-sm outline-none" />
      </div>

      {/* Gabbai row */}
      <div className="flex items-center border border-gold-600/25 rounded-lg overflow-hidden bg-navy-800">
        <span className="bg-navy-900 text-gold-500 text-xs font-bold px-3 py-2.5 border-l border-gold-600/20 shrink-0 select-none">גבאי</span>
        <input type="text" value={form.gabbaiName} placeholder="שם הגבאי"
          onChange={e => setForm(f => ({ ...f, gabbaiName: e.target.value }))}
          className="flex-1 bg-transparent px-3 py-2 text-white text-sm outline-none min-w-0" />
        <input type="tel" value={form.gabbaiPhone} placeholder="טלפון" dir="ltr"
          onChange={e => setForm(f => ({ ...f, gabbaiPhone: e.target.value }))}
          className="w-32 bg-navy-900/50 border-r border-gold-600/15 px-2 py-2 text-white text-sm outline-none" />
      </div>

      {/* קוד גבאי — רק למנהל ראשי */}
      {showPin && (
        <div className="flex items-center border border-amber-600/30 rounded-lg overflow-hidden bg-navy-800">
          <span className="bg-navy-900 text-amber-500 text-xs font-bold px-3 py-2.5 border-l border-amber-600/20 shrink-0 select-none">🔑 קוד גבאי</span>
          <input type="text" value={form.editPin ?? ''} placeholder="קוד כניסה לגבאי (ריק = ללא גישה)"
            onChange={e => setForm(f => ({ ...f, editPin: e.target.value }))}
            className="flex-1 bg-transparent px-3 py-2 text-white text-sm outline-none min-w-0 tracking-widest" />
        </div>
      )}
    </div>
  );
}

// ── SlotEditor with relative time ──────────────────────────────────────────

function SlotEditor({ label, icon = '', color = 'text-slate-400', slots, onChange, zmanim }: {
  label: string;
  icon?: string;
  color?: string;
  slots: PrayerSlot[];
  onChange: (s: PrayerSlot[]) => void;
  zmanim: DayZmanim | null;
}) {
  const update = (idx: number, patch: Partial<PrayerSlot>) =>
    onChange(slots.map((s, i) => i === idx ? { ...s, ...patch } : s));

  const add = () => onChange([...slots, { time: '', desc: '', isRelative: false }]);

  const remove = (idx: number) =>
    onChange(slots.length > 1 ? slots.filter((_, i) => i !== idx) : [{ time: '', desc: '', isRelative: false }]);

  return (
    <div className="mb-4">
      <p className={`text-xs mb-2 font-semibold ${color}`}>{icon} {label}</p>
      <div className="space-y-3">
        {slots.map((slot, i) => (
          <div key={i} className="bg-navy-800/50 rounded-xl p-3 border border-gold-600/10 space-y-2">

            {/* Toggle: fixed / relative */}
            <div className="flex gap-2">
              <button type="button"
                onClick={() => update(i, { isRelative: false })}
                className={`flex-1 text-xs rounded-lg py-1.5 border transition-colors ${!slot.isRelative ? 'bg-gold-500/20 border-gold-400/50 text-gold-300' : 'border-slate-700 text-slate-500 hover:border-slate-600'}`}>
                🕐 שעה קבועה
              </button>
              <button type="button"
                onClick={() => update(i, { isRelative: true, anchor: slot.anchor ?? 'sunrise', offsetMin: slot.offsetMin ?? 0, offsetDir: slot.offsetDir ?? 'exact' })}
                className={`flex-1 text-xs rounded-lg py-1.5 border transition-colors ${slot.isRelative ? 'bg-gold-500/20 border-gold-400/50 text-gold-300' : 'border-slate-700 text-slate-500 hover:border-slate-600'}`}>
                ⚡ ביחס לזמן
              </button>
              <button onClick={() => remove(i)} className="text-slate-600 hover:text-red-400 px-2 text-lg leading-none">×</button>
            </div>

            {/* Fixed time */}
            {!slot.isRelative && (
              <div className="flex gap-2">
                <input type="time" value={slot.time}
                  onChange={e => update(i, { time: e.target.value })}
                  className="w-28 bg-navy-900 border border-gold-600/20 rounded-lg px-2 py-1.5 text-white text-sm" />
                <input type="text" value={slot.desc}
                  onChange={e => update(i, { desc: e.target.value })}
                  placeholder="תיאור: נץ, פועלים, ר&quot;ת..."
                  className="flex-1 bg-navy-900 border border-gold-600/20 rounded-lg px-2.5 py-1.5 text-white text-sm placeholder:text-slate-700" />
              </div>
            )}

            {/* Relative time */}
            {slot.isRelative && (
              <div className="space-y-2">
                {/* Anchor + dir + offset */}
                <div className="flex gap-2 flex-wrap">
                  <select value={slot.anchor ?? 'sunrise'}
                    onChange={e => update(i, { anchor: e.target.value })}
                    className="flex-1 bg-navy-900 border border-gold-600/20 rounded-lg px-2 py-1.5 text-white text-sm min-w-0">
                    {ZMANIM_ANCHORS.map(a => <option key={a.label} value={a.key}>{a.label}</option>)}
                  </select>

                  <select value={slot.offsetDir ?? 'exact'}
                    onChange={e => update(i, { offsetDir: e.target.value as 'before' | 'after' | 'exact' })}
                    className="bg-navy-900 border border-gold-600/20 rounded-lg px-2 py-1.5 text-white text-sm">
                    <option value="exact">בדיוק</option>
                    <option value="before">לפני</option>
                    <option value="after">אחרי</option>
                  </select>

                  {slot.offsetDir !== 'exact' && (
                    <div className="flex items-center gap-1">
                      <input type="number" min={0} max={120} value={slot.offsetMin ?? 0}
                        onChange={e => update(i, { offsetMin: Number(e.target.value) })}
                        className="w-16 bg-navy-900 border border-gold-600/20 rounded-lg px-2 py-1.5 text-white text-sm text-center" />
                      <span className="text-slate-500 text-xs">דק'</span>
                    </div>
                  )}
                </div>

                {/* Preview */}
                <div className="flex items-center gap-3">
                  {(() => {
                    // הדלקת נרות — חשב לשישי הקרוב
                    let previewZmanim = zmanim;
                    let label = 'היום';
                    if (slot.anchor === 'candleLighting' && zmanim && !zmanim.candleLighting) {
                      const today = new Date();
                      const daysToFri = (5 - today.getDay() + 7) % 7 || 7;
                      const nextFri = new Date(today);
                      nextFri.setDate(today.getDate() + daysToFri);
                      previewZmanim = calculateDayZmanim(nextFri);
                      label = 'שישי הקרוב';
                    }
                    const d = previewZmanim && slot.anchor
                      ? calcRelativeDate(slot.anchor as ZmanimAnchorKey, slot.offsetMin ?? 0, (slot.offsetDir ?? 'exact') as 'before'|'after'|'exact', previewZmanim)
                      : null;
                    return (
                      <div className="bg-navy-900 border border-gold-500/30 rounded-lg px-3 py-1.5 flex items-center gap-2">
                        <span className="text-slate-400 text-xs">{label}:</span>
                        <span className="text-gold-300 font-bold text-base tabular-nums">{d ? formatTime(d) : '--:--'}</span>
                      </div>
                    );
                  })()}
                  <span className="text-slate-600 text-xs">מתעדכן אוטומטית</span>
                </div>

                {/* Desc */}
                <input type="text" value={slot.desc}
                  onChange={e => update(i, { desc: e.target.value })}
                  placeholder="תיאור (אופציונלי): נץ, פלג..."
                  className="w-full bg-navy-900 border border-gold-600/20 rounded-lg px-2.5 py-1.5 text-white text-sm placeholder:text-slate-700" />
              </div>
            )}
          </div>
        ))}
      </div>
      <button onClick={add} className="text-xs text-gold-600 hover:text-gold-400 mt-2 transition-colors">+ הוסף מניין</button>
    </div>
  );
}

function ShiurEditor({ shiurim, onChange }: { shiurim: Shiur[]; onChange: (s: Shiur[]) => void }) {
  const add    = () => onChange([...shiurim, { id: String(Date.now()), name: '', lecturer: '', schedule: '', time: '', desc: '' }]);
  const remove = (id: string) => onChange(shiurim.filter(s => s.id !== id));
  const upd    = (id: string, f: keyof Shiur, v: string) =>
    onChange(shiurim.map(s => s.id === id ? { ...s, [f]: v } : s));

  return (
    <div className="space-y-2">
      {shiurim.map(sh => (
        <div key={sh.id} className="bg-navy-800/60 rounded-xl p-3 space-y-2 border border-gold-600/10">
          <div className="flex gap-2">
            <input value={sh.name} onChange={e => upd(sh.id, 'name', e.target.value)}
              placeholder="שם השיעור"
              className="flex-1 bg-navy-900 border border-gold-600/15 rounded-lg px-2.5 py-1.5 text-white text-sm" />
            <button onClick={() => remove(sh.id)} className="text-slate-600 hover:text-red-400 px-2 text-lg">×</button>
          </div>
          <input value={sh.lecturer ?? ''} onChange={e => upd(sh.id, 'lecturer', e.target.value)}
            onBlur={e => { const v = e.target.value.trim(); if (v) upd(sh.id, 'lecturer', withShlitta(v)); }}
            placeholder='שם הרב שליט"א'
            className="w-full bg-navy-900 border border-gold-600/15 rounded-lg px-2.5 py-1.5 text-white text-sm" />
          <div className="flex gap-2">
            <input value={sh.schedule} onChange={e => upd(sh.id, 'schedule', e.target.value)}
              placeholder="מתי: כל ד', שבת בוקר..."
              className="flex-1 bg-navy-900 border border-gold-600/15 rounded-lg px-2.5 py-1.5 text-white text-sm" />
            <input type="time" value={sh.time} onChange={e => upd(sh.id, 'time', e.target.value)}
              className="w-28 bg-navy-900 border border-gold-600/15 rounded-lg px-2 py-1.5 text-white text-sm" />
          </div>
          <input value={sh.desc} onChange={e => upd(sh.id, 'desc', e.target.value)}
            placeholder="תיאור נוסף"
            className="w-full bg-navy-900 border border-gold-600/15 rounded-lg px-2.5 py-1.5 text-white text-sm" />
        </div>
      ))}
      <button onClick={add} className="text-xs text-gold-600 hover:text-gold-400 transition-colors">+ הוסף שיעור</button>
    </div>
  );
}
