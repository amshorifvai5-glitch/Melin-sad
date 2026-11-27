import React, { useState } from 'react';
import {
  ArrowLeft,
  ChevronRight,
  Copy,
  Download,
  ExternalLink,
  ImagePlus,
  Phone,
  Plus,
  Trash2,
} from 'lucide-react';
import { DayReportData, DutyStatus, PageId, WorkProofEntry } from '../types/report';
import {
  EMERGENCY_CONTACTS,
  PROFILE_INFO,
  SUPPLY_ITEMS,
  buildClosingReportHtml,
  buildClosingReportText,
  compressImageToDataUrl,
  downloadTextFile,
  formatMinutesToHM,
  getNowTimeHHMM,
  getTotalBreakMinutes,
  timeToMinutes,
} from '../data/portalData';
import { Avatar } from './Avatar';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  backLabel?: string;
  onBack: () => void;
  rightSlot?: React.ReactNode;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  backLabel = 'হোম',
  onBack,
  rightSlot,
}) => (
  <div className="flex flex-wrap items-center justify-between gap-3">
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm font-semibold text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 shadow-xs transition-colors whitespace-nowrap shrink-0"
      >
        <ArrowLeft className="w-4 h-4" />
        {backLabel}
      </button>
      <div>
        <h2 className="text-xl font-bold text-neutral-900">{title}</h2>
        {subtitle && <p className="text-xs text-neutral-500">{subtitle}</p>}
      </div>
    </div>
    {rightSlot}
  </div>
);

/* ==================== ১. ব্যক্তিগত তথ্য ==================== */
export const PersonalInfoSection: React.FC<{
  profilePhoto: string | null;
  canEdit: boolean;
  onBack: () => void;
  onNavigate: (page: PageId) => void;
  onApplyDefaultShift: () => void;
}> = ({ profilePhoto, canEdit, onBack, onNavigate, onApplyDefaultShift }) => {
  const rows = [
    { label: 'কর্মীর নাম', value: PROFILE_INFO.displayNameBn },
    { label: 'Employee ID', value: PROFILE_INFO.employeeId, mono: true },
    { label: 'পদবি', value: PROFILE_INFO.roleTitleBn },
    { label: 'বিভাগ', value: PROFILE_INFO.department },
    { label: 'কর্মস্থল', value: PROFILE_INFO.workplace },
    { label: 'যোগদানের তারিখ', value: PROFILE_INFO.joiningDate, mono: true },
    { label: 'ডিউটির সময়', value: PROFILE_INFO.shiftLabel },
  ];

  return (
    <div className="space-y-4">
      <SectionHeader title="ব্যক্তিগত তথ্য" onBack={onBack} />

      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-xs">
        <div className="bg-gradient-to-r from-[#0B0B0D] via-[#14151B] to-[#0A2558] border-b border-neutral-800 p-5 text-white flex items-center gap-4">
          <Avatar
            src={profilePhoto}
            alt={PROFILE_INFO.displayNameBn}
            sizeClass="w-16 h-16"
            roundedClass="rounded-xl"
          />
          <div>
            <h3 className="text-lg font-bold leading-snug text-white">
              {PROFILE_INFO.displayNameBn}
            </h3>
            <p className="text-xs text-neutral-300 mt-0.5">
              {PROFILE_INFO.roleTitleBn} · ID:{' '}
              <span className="font-mono-num text-[#F26522] font-semibold">
                {PROFILE_INFO.employeeId}
              </span>{' '}
              · {PROFILE_INFO.department}
            </p>
          </div>
        </div>

        <div className="divide-y divide-neutral-100 px-5">
          {rows.map((r) => (
            <div key={r.label} className="py-3.5 flex items-center justify-between gap-4">
              <span className="text-xs font-semibold text-neutral-500">{r.label}</span>
              <span
                className={`text-sm font-bold text-neutral-900 text-right ${
                  r.mono ? 'font-mono-num' : ''
                }`}
              >
                {r.value}
              </span>
            </div>
          ))}

          <div className="py-4">
            <button
              type="button"
              onClick={() => onNavigate('emergency-contact')}
              className="w-full py-3 px-4 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm flex items-center justify-between transition-colors"
            >
              <span>জরুরি যোগাযোগ</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {canEdit && (
          <div className="p-4 bg-neutral-50 border-t border-neutral-200">
            <button
              type="button"
              onClick={onApplyDefaultShift}
              className="w-full py-2.5 px-4 rounded-lg bg-[#F26522] hover:bg-[#DC5214] text-white text-sm font-semibold transition-colors"
            >
              আজকের In (০৯:০০) ও Out (১৯:০০) সময় সেট করুন
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/* ==================== জরুরি যোগাযোগ ==================== */
export const EmergencyContactSection: React.FC<{
  onBack: () => void;
  onCopy: (text: string) => void;
}> = ({ onBack, onCopy }) => (
  <div className="space-y-4">
    <SectionHeader title="জরুরি যোগাযোগ" backLabel="ব্যক্তিগত তথ্য" onBack={onBack} />

    <div className="bg-white border border-neutral-200 rounded-xl divide-y divide-neutral-100 shadow-xs">
      {EMERGENCY_CONTACTS.map((c) => (
        <div key={c.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-semibold text-neutral-500">{c.label}</div>
            <div className="text-sm font-bold text-neutral-900 mt-0.5 break-all font-mono-num">
              {c.value}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onCopy(c.value)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 text-xs font-semibold transition-colors whitespace-nowrap"
            >
              <Copy className="w-3.5 h-3.5" />
              কপি
            </button>
            <a
              href={c.href}
              target={c.external ? '_blank' : undefined}
              rel={c.external ? 'noopener noreferrer' : undefined}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#F26522] hover:bg-[#DC5214] text-white text-xs font-semibold transition-colors whitespace-nowrap"
            >
              {c.id === 'phone' ? (
                <Phone className="w-3.5 h-3.5" />
              ) : (
                <ExternalLink className="w-3.5 h-3.5" />
              )}
              {c.actionLabel}
            </a>
          </div>
        </div>
      ))}
    </div>
  </div>
);

/* ==================== ৩. ডিউটি অবস্থান ==================== */
export const DutyLocationSection: React.FC<{
  dutyStatus: DutyStatus;
  canEdit: boolean;
  onSelect: (status: Exclude<DutyStatus, ''>) => void;
  onBack: () => void;
}> = ({ dutyStatus, canEdit, onSelect, onBack }) => {
  const options: Array<{ value: Exclude<DutyStatus, ''>; label: string; hint: string }> = [
    { value: 'HQ', label: 'HQ', hint: 'হেড অফিস ডিউটি' },
    { value: 'TS', label: 'TS', hint: 'টেকনিক্যাল সাপোর্ট / সাইট' },
    { value: 'HQ/TS', label: 'HQ/TS', hint: 'উভয় স্থানে ডিউটি' },
    { value: 'OFFDAY', label: 'অফডে (Off-Day)', hint: 'সাপ্তাহিক বা ব্যক্তিগত ছুটি' },
  ];

  return (
    <div className="space-y-4">
      <SectionHeader title="ডিউটি অবস্থান" onBack={onBack} />

      <div className="bg-white border border-neutral-200 rounded-xl p-5 space-y-3.5 shadow-xs">
        <p className="text-sm font-medium text-neutral-700">
          {canEdit
            ? 'আজকের ডিউটি অবস্থান বা ছুটির দিন (অফডে) নির্বাচন করুন:'
            : 'আজকের নির্ধারিত ডিউটি অবস্থান:'}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {options.map((opt) => {
            const active = dutyStatus === opt.value;
            const isOff = opt.value === 'OFFDAY';
            return (
              <button
                key={opt.value}
                type="button"
                disabled={!canEdit}
                onClick={() => onSelect(opt.value)}
                className={`p-3.5 rounded-xl border-2 text-center transition-colors disabled:cursor-default ${
                  active
                    ? isOff
                      ? 'border-[#0A2558] bg-[#0A2558] text-white shadow-sm'
                      : 'border-[#F26522] bg-[#F26522] text-white shadow-sm'
                    : 'border-neutral-200 bg-[#F9FAFB] text-neutral-800 hover:border-[#F26522]/60 disabled:hover:border-neutral-200'
                }`}
              >
                <div className="font-bold text-sm sm:text-base">{opt.label}</div>
                <div
                  className={`text-[11px] mt-1 ${
                    active ? 'text-white/85' : 'text-neutral-500'
                  }`}
                >
                  {opt.hint}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ==================== ৫. বিরতি সময় ==================== */
export const BreakTimeSection: React.FC<{
  data: DayReportData;
  canEdit: boolean;
  onUpdate: (updater: (prev: DayReportData) => DayReportData) => void;
  onBack: () => void;
}> = ({ data, canEdit, onUpdate, onBack }) => {
  const [reason, setReason] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  const totalMins = getTotalBreakMinutes(data);

  const handleAdd = () => {
    if (!canEdit) return;
    if (!reason.trim() && !start && !end) return;
    onUpdate((prev) => ({
      ...prev,
      breaks: [...prev.breaks, { reason: reason.trim(), start, end }],
    }));
    setReason('');
    setStart('');
    setEnd('');
  };

  const handleDelete = (idx: number) => {
    if (!canEdit) return;
    onUpdate((prev) => ({
      ...prev,
      breaks: prev.breaks.filter((_, i) => i !== idx),
    }));
  };

  return (
    <div className="space-y-4">
      <SectionHeader title="বিরতি সময়" onBack={onBack} />

      <div className="bg-amber-50 border border-amber-200 text-amber-950 rounded-xl p-4 flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-amber-700">আজকের মোট বিরতি</div>
          <div className="text-2xl font-bold font-mono-num text-neutral-900 mt-0.5">
            {formatMinutesToHM(totalMins)}
          </div>
        </div>
        <div className="text-xs font-mono-num text-amber-800 font-semibold">
          {data.breaks.length}টি এন্ট্রি
        </div>
      </div>

      {canEdit && (
        <div className="bg-white border border-neutral-200 rounded-xl p-4 space-y-3 shadow-xs">
          <div className="text-sm font-bold text-neutral-900">নতুন বিরতি যুক্ত করুন</div>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="বিরতির কারণ (যেমন: লাঞ্চ ব্রেক, চা বিরতি)"
            className="w-full bg-[#F9FAFB] border border-neutral-200 rounded-lg px-3.5 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:border-[#F26522]"
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-neutral-600 block mb-1">
                শুরু (From)
              </label>
              <input
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="w-full bg-[#F9FAFB] border border-neutral-200 rounded-lg px-3 py-2 text-xs font-mono-num font-bold text-neutral-900 [color-scheme:light] focus:bg-white focus:outline-none focus:border-[#F26522]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-600 block mb-1">শেষ (To)</label>
              <input
                type="time"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="w-full bg-[#F9FAFB] border border-neutral-200 rounded-lg px-3 py-2 text-xs font-mono-num font-bold text-neutral-900 [color-scheme:light] focus:bg-white focus:outline-none focus:border-[#F26522]"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            className="w-full py-2.5 rounded-lg bg-[#F26522] hover:bg-[#DC5214] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            বিরতি যুক্ত করুন
          </button>
        </div>
      )}

      <div className="bg-white border border-neutral-200 rounded-xl divide-y divide-neutral-100 shadow-xs">
        {data.breaks.length === 0 ? (
          <div className="p-6 text-center text-sm text-neutral-500">
            আজ কোনো বিরতি যুক্ত করা হয়নি
          </div>
        ) : (
          data.breaks.map((b, idx) => {
            const s = timeToMinutes(b.start);
            const e = timeToMinutes(b.end);
            const diff = s !== null && e !== null && e > s ? `${e - s} মিনিট` : '';
            return (
              <div key={idx} className="p-3.5 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-neutral-900">{b.reason || 'বিরতি'}</div>
                  <div className="text-xs text-neutral-500 font-mono-num mt-0.5">
                    {b.start || '--:--'} – {b.end || '--:--'}
                    {diff && <span className="text-[#F26522] font-bold ml-2">({diff})</span>}
                  </div>
                </div>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => handleDelete(idx)}
                    aria-label="বিরতি মুছুন"
                    className="p-2 rounded-lg bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

/* ==================== ৬. হাজিরা ও সময়ের হিসাব ==================== */
export const AttendanceTimeSection: React.FC<{
  data: DayReportData;
  canEdit: boolean;
  onApplyDefaultShift: () => void;
  onBack: () => void;
}> = ({ data, canEdit, onApplyDefaultShift, onBack }) => {
  const inMins = timeToMinutes(data.inTime);
  const outMins = timeToMinutes(data.outTime);
  const breakMins = getTotalBreakMinutes(data);

  let grossText = '—';
  let netText = '—';
  let shiftDiffText = '—';

  if (inMins !== null && outMins !== null && outMins > inMins) {
    const gross = outMins - inMins;
    const net = Math.max(0, gross - breakMins);
    const standardShift = 10 * 60;
    const diff = net - standardShift;

    grossText = formatMinutesToHM(gross);
    netText = `${formatMinutesToHM(net)} (বিরতি ${breakMins} মি. বাদ)`;
    shiftDiffText =
      diff >= 0
        ? `+${formatMinutesToHM(diff)} অতিরিক্ত`
        : `${formatMinutesToHM(Math.abs(diff))} বাকি`;
  }

  return (
    <div className="space-y-4">
      <SectionHeader title="হাজিরা ও সময়ের হিসাব" onBack={onBack} />

      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-xl bg-white border border-neutral-200 shadow-xs">
          <div className="text-xs font-semibold text-neutral-500">In Time</div>
          <div className="text-xl font-bold text-emerald-600 font-mono-num mt-1">
            {data.inTime || 'সেট হয়নি'}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-white border border-neutral-200 shadow-xs">
          <div className="text-xs font-semibold text-neutral-500">Out Time</div>
          <div className="text-xl font-bold text-[#F26522] font-mono-num mt-1">
            {data.outTime || 'সেট হয়নি'}
          </div>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl divide-y divide-neutral-100 shadow-xs">
        <div className="p-4 flex items-center justify-between text-sm">
          <span className="font-medium text-neutral-600">মোট উপস্থিতি সময়</span>
          <span className="font-bold text-neutral-900 font-mono-num">{grossText}</span>
        </div>
        <div className="p-4 flex items-center justify-between text-sm">
          <span className="font-medium text-neutral-600">বিরতি বাদে কার্যকর সময়</span>
          <span className="font-bold text-[#0A2E6D] font-mono-num">{netText}</span>
        </div>
        <div className="p-4 flex items-center justify-between text-sm">
          <span className="font-medium text-neutral-600">নির্ধারিত ডিউটি (১০ ঘণ্টা)</span>
          <span className="font-bold text-emerald-600 font-mono-num">{shiftDiffText}</span>
        </div>
      </div>

      {canEdit && (
        <button
          type="button"
          onClick={onApplyDefaultShift}
          className="w-full py-2.5 px-4 rounded-lg bg-[#F26522] hover:bg-[#DC5214] text-white text-sm font-semibold transition-colors"
        >
          ডিফল্ট শিফট (০৯:০০ – ১৯:০০) সেট করুন
        </button>
      )}
    </div>
  );
};

/* ==================== ৭. অফিস যাতায়াত ==================== */
export const OfficeCommuteSection: React.FC<{
  data: DayReportData;
  canEdit: boolean;
  onUpdate: (updater: (prev: DayReportData) => DayReportData) => void;
  onBack: () => void;
}> = ({ data, canEdit, onUpdate, onBack }) => {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [mode, setMode] = useState('');
  const [time, setTime] = useState('');

  const handleAdd = () => {
    if (!canEdit) return;
    if (!from.trim() && !to.trim() && !mode.trim()) return;
    onUpdate((prev) => ({
      ...prev,
      commutes: [
        ...prev.commutes,
        { from: from.trim(), to: to.trim(), mode: mode.trim(), time },
      ],
    }));
    setFrom('');
    setTo('');
    setMode('');
    setTime('');
  };

  const handleDelete = (idx: number) => {
    if (!canEdit) return;
    onUpdate((prev) => ({
      ...prev,
      commutes: prev.commutes.filter((_, i) => i !== idx),
    }));
  };

  return (
    <div className="space-y-4">
      <SectionHeader title="অফিস যাতায়াত" onBack={onBack} />

      {canEdit && (
        <div className="bg-white border border-neutral-200 rounded-xl p-4 space-y-3 shadow-xs">
          <div className="text-sm font-bold text-neutral-900">যাতায়াতের তথ্য যুক্ত করুন</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <input
              type="text"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              placeholder="কোথা থেকে (যেমন: HQ)"
              className="bg-[#F9FAFB] border border-neutral-200 rounded-lg px-3 py-2 text-sm font-medium text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:border-[#F26522]"
            />
            <input
              type="text"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="কোথায় (যেমন: TS)"
              className="bg-[#F9FAFB] border border-neutral-200 rounded-lg px-3 py-2 text-sm font-medium text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:border-[#F26522]"
            />
            <input
              type="text"
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              placeholder="মাধ্যম (যেমন: হাঁটা, রিকশা)"
              className="bg-[#F9FAFB] border border-neutral-200 rounded-lg px-3 py-2 text-sm font-medium text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:border-[#F26522]"
            />
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="bg-[#F9FAFB] border border-neutral-200 rounded-lg px-3 py-2 text-xs font-mono-num font-bold text-neutral-900 [color-scheme:light] focus:bg-white focus:outline-none focus:border-[#F26522]"
            />
          </div>
          <button
            type="button"
            onClick={handleAdd}
            className="w-full py-2.5 rounded-lg bg-[#F26522] hover:bg-[#DC5214] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            যাতায়াত লগ যুক্ত করুন
          </button>
        </div>
      )}

      <div className="bg-white border border-neutral-200 rounded-xl divide-y divide-neutral-100 shadow-xs">
        {data.commutes.length === 0 ? (
          <div className="p-6 text-center text-sm text-neutral-500">
            আজকের যাতায়াতের কোনো লগ নেই
          </div>
        ) : (
          data.commutes.map((c, idx) => (
            <div key={idx} className="p-3.5 flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-bold text-neutral-900">
                  {c.from || '—'} → {c.to || '—'}
                </div>
                <div className="text-xs text-neutral-500 mt-0.5">
                  {c.mode || 'মাধ্যম উল্লেখ নেই'} ·{' '}
                  <span className="font-mono-num">{c.time || 'সময় নেই'}</span>
                </div>
              </div>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => handleDelete(idx)}
                  aria-label="যাতায়াত লগ মুছুন"
                  className="p-2 rounded-lg bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

/* ==================== ৮. অতিরিক্ত কাজ ==================== */
export const ExtraWorkSection: React.FC<{
  data: DayReportData;
  canEdit: boolean;
  onUpdate: (updater: (prev: DayReportData) => DayReportData) => void;
  onBack: () => void;
}> = ({ data, canEdit, onUpdate, onBack }) => {
  const [text, setText] = useState('');
  const [time, setTime] = useState('');

  const handleAdd = () => {
    if (!canEdit) return;
    const trimmed = text.trim();
    if (!trimmed) return;
    onUpdate((prev) => ({
      ...prev,
      extraBasicTasks: [
        ...prev.extraBasicTasks,
        { text: trimmed, time: time || getNowTimeHHMM(), done: true },
      ],
    }));
    setText('');
    setTime('');
  };

  const handleToggle = (idx: number, checked: boolean) => {
    if (!canEdit) return;
    onUpdate((prev) => {
      const next = [...prev.extraBasicTasks];
      if (!next[idx]) return prev;
      next[idx] = { ...next[idx], done: checked };
      return { ...prev, extraBasicTasks: next };
    });
  };

  const handleDelete = (idx: number) => {
    if (!canEdit) return;
    onUpdate((prev) => ({
      ...prev,
      extraBasicTasks: prev.extraBasicTasks.filter((_, i) => i !== idx),
    }));
  };

  return (
    <div className="space-y-4">
      <SectionHeader title="অতিরিক্ত কাজ" onBack={onBack} />

      {canEdit && (
        <div className="bg-white border border-neutral-200 rounded-xl p-4 space-y-3 shadow-xs">
          <div className="text-sm font-bold text-neutral-900">নতুন অতিরিক্ত কাজ যুক্ত করুন</div>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd();
            }}
            placeholder="কাজের বিবরণ লিখুন..."
            className="w-full bg-[#F9FAFB] border border-neutral-200 rounded-lg px-3.5 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:border-[#F26522]"
          />
          <div className="flex items-center gap-2">
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="bg-[#F9FAFB] border border-neutral-200 rounded-lg px-3 py-2 text-xs font-mono-num font-bold text-neutral-900 [color-scheme:light] focus:bg-white focus:outline-none focus:border-[#F26522]"
            />
            <button
              type="button"
              onClick={() => setTime(getNowTimeHHMM())}
              className="px-3 py-2 rounded-lg bg-neutral-100 border border-neutral-200 hover:bg-neutral-200 text-xs font-semibold text-neutral-700 whitespace-nowrap"
            >
              এখন
            </button>
            <button
              type="button"
              onClick={handleAdd}
              className="flex-1 py-2 rounded-lg bg-[#F26522] hover:bg-[#DC5214] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              যুক্ত করুন
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-neutral-200 rounded-xl divide-y divide-neutral-100 shadow-xs">
        {data.extraBasicTasks.length === 0 ? (
          <div className="p-6 text-center text-sm text-neutral-500">
            আজ কোনো অতিরিক্ত কাজ যুক্ত করা হয়নি
          </div>
        ) : (
          data.extraBasicTasks.map((item, idx) => (
            <div key={idx} className="p-3.5 flex items-center justify-between gap-3">
              <label
                className={`flex items-center gap-3 flex-1 min-w-0 ${
                  canEdit ? 'cursor-pointer' : 'cursor-default'
                }`}
              >
                <input
                  type="checkbox"
                  disabled={!canEdit}
                  checked={item.done}
                  onChange={(e) => handleToggle(idx, e.target.checked)}
                  className="w-4 h-4 accent-[#F26522] rounded shrink-0"
                />
                <span className="text-sm font-semibold text-neutral-900 break-words">
                  {item.text}
                </span>
              </label>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-mono-num font-semibold text-[#F26522]">
                  {item.time || '--:--'}
                </span>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => handleDelete(idx)}
                    aria-label="অতিরিক্ত কাজ মুছুন"
                    className="p-1.5 rounded-lg bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

/* ==================== ৯. মালামাল ও রিফিল ==================== */
export const SuppliesRefillSection: React.FC<{
  data: DayReportData;
  canEdit: boolean;
  onUpdate: (updater: (prev: DayReportData) => DayReportData) => void;
  onBack: () => void;
}> = ({ data, canEdit, onUpdate, onBack }) => {
  const toggleSupply = (id: string, checked: boolean) => {
    if (!canEdit) return;
    onUpdate((prev) => ({
      ...prev,
      supplies: {
        ...prev.supplies,
        [id]: checked,
      },
    }));
  };

  const doneCount = SUPPLY_ITEMS.filter((s) => Boolean(data.supplies[s.id])).length;

  return (
    <div className="space-y-4">
      <SectionHeader
        title="মালামাল ও রিফিল"
        subtitle={
          canEdit
            ? 'প্রতিদিনের রিফিল করা হয়েছে এমন মালামালগুলোতে টিক দিন'
            : 'শুধুমাত্র দেখার মোড · আজকের রিফিল অবস্থা'
        }
        onBack={onBack}
        rightSlot={
          <div className="bg-[#0B0B0D] border border-neutral-800 rounded-lg px-3.5 py-2 text-xs font-mono-num font-semibold text-emerald-400">
            {doneCount}/{SUPPLY_ITEMS.length}টি রিফিল সম্পন্ন
          </div>
        }
      />

      <div className="bg-white border border-neutral-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-3 shadow-xs">
        {SUPPLY_ITEMS.map((item) => {
          const checked = Boolean(data.supplies[item.id]);
          return (
            <label
              key={item.id}
              className={`p-4 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                canEdit ? 'cursor-pointer' : 'cursor-default'
              } ${
                checked
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-[#F9FAFB] border-neutral-200 hover:border-neutral-300'
              }`}
            >
              <span className="flex items-center gap-3 min-w-0">
                <input
                  type="checkbox"
                  disabled={!canEdit}
                  checked={checked}
                  onChange={(e) => toggleSupply(item.id, e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 rounded shrink-0"
                />
                <span className="text-sm font-bold text-neutral-900 truncate">{item.label}</span>
              </span>

              <span
                className={`text-xs font-bold shrink-0 ${
                  checked ? 'text-emerald-700' : 'text-neutral-500'
                }`}
              >
                {checked ? 'রিফিল সম্পন্ন' : 'বাকি'}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
};

/* ==================== ১০. কাজের সমাপ্তি রিপোর্ট ==================== */
export const ClosingReportSection: React.FC<{
  dateStr: string;
  data: DayReportData;
  onCopy: (text: string) => void;
  onBack: () => void;
}> = ({ dateStr, data, onCopy, onBack }) => {
  const reportText = buildClosingReportText(dateStr, data);

  const handleDownloadHtml = () => {
    const html = buildClosingReportHtml(dateStr, data);
    downloadTextFile(`sorif-work-report-${dateStr}.html`, html, 'text/html');
  };

  const handleDownloadTxt = () => {
    downloadTextFile(`sorif-work-report-${dateStr}.txt`, reportText, 'text/plain');
  };

  return (
    <div className="space-y-4">
      <SectionHeader
        title="কাজের সমাপ্তি রিপোর্ট"
        onBack={onBack}
        rightSlot={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadHtml}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              রিপোর্ট ফাইল (.html)
            </button>
            <button
              type="button"
              onClick={handleDownloadTxt}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              টেক্সট (.txt)
            </button>
            <button
              type="button"
              onClick={() => onCopy(reportText)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#F26522] hover:bg-[#DC5214] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              <Copy className="w-3.5 h-3.5" />
              রিপোর্ট কপি
            </button>
          </div>
        }
      />

      <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-xs">
        <pre className="whitespace-pre-wrap text-xs sm:text-sm font-medium text-neutral-800 bg-[#F9FAFB] border border-neutral-200 rounded-lg p-4 leading-relaxed font-sans">
          {reportText}
        </pre>
      </div>
    </div>
  );
};

/* ==================== ১১. বিশেষ নোট ও সমস্যা ==================== */
export const NotesIssuesSection: React.FC<{
  notes: string;
  canEdit: boolean;
  onChange: (notes: string) => void;
  onBack: () => void;
}> = ({ notes, canEdit, onChange, onBack }) => (
  <div className="space-y-4">
    <SectionHeader title="বিশেষ নোট ও সমস্যা" onBack={onBack} />

    <div className="bg-white border border-neutral-200 rounded-xl p-4 space-y-2.5 shadow-xs">
      <label className="text-sm font-bold text-neutral-900 block">
        {canEdit ? 'আজকের বিশেষ নোট, ঘাটতি বা সমস্যা লিখুন:' : 'আজকের বিশেষ নোট ও সমস্যা:'}
      </label>
      {canEdit ? (
        <>
          <textarea
            rows={6}
            value={notes}
            onChange={(e) => onChange(e.target.value)}
            placeholder="যেমন: ওয়াশরুমে হ্যান্ডওয়াশ স্টক কম, ৩ নম্বর রুমের এসি চেক করা দরকার..."
            className="w-full bg-[#F9FAFB] border border-neutral-200 rounded-lg p-3.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:border-[#F26522]"
          />
          <div className="text-xs text-emerald-600 font-semibold">
            স্বয়ংক্রিয়ভাবে ক্লাউডে সংরক্ষিত হচ্ছে
          </div>
        </>
      ) : (
        <div className="w-full bg-[#F9FAFB] border border-neutral-200 rounded-lg p-4 text-sm text-neutral-800 whitespace-pre-wrap min-h-[120px]">
          {notes.trim() || 'আজ কোনো বিশেষ নোট যুক্ত করা হয়নি।'}
        </div>
      )}
    </div>
  </div>
);

/* ==================== ১২. কাজের প্রমাণ ==================== */
export const WorkProofSection: React.FC<{
  data: DayReportData;
  canEdit: boolean;
  onAddProof: (proof: WorkProofEntry) => Promise<void>;
  onDeleteProof: (proofId: string) => Promise<void>;
  onBack: () => void;
}> = ({ data, canEdit, onAddProof, onDeleteProof, onBack }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [description, setDescription] = useState('');
  const [time, setTime] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleAdd = async () => {
    if (!canEdit) return;
    const trimmedDesc = description.trim();
    if (!selectedFile && !trimmedDesc) return;

    setUploading(true);
    try {
      let photoData = '';
      if (selectedFile) {
        photoData = await compressImageToDataUrl(selectedFile, 760, 0.72, 340000);
      }

      await onAddProof({
        photo: photoData,
        description: trimmedDesc || 'কাজ সম্পন্ন হয়েছে',
        time: time || getNowTimeHHMM(),
      });

      setSelectedFile(null);
      setFileInputKey((k) => k + 1);
      setDescription('');
      setTime('');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <SectionHeader title="কাজের প্রমাণ" onBack={onBack} />

      {canEdit && (
        <div className="bg-white border border-neutral-200 rounded-xl p-4 space-y-3 shadow-xs">
          <div className="text-sm font-bold text-neutral-900">নতুন কাজের ফটো ও বিবরণ যুক্ত করুন</div>

          <div>
            <label className="text-xs font-semibold text-neutral-600 block mb-1">
              কাজের ছবি নির্বাচন করুন
            </label>
            <input
              key={fileInputKey}
              type="file"
              accept="image/*"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-neutral-700 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-[#F26522] hover:file:bg-orange-100 bg-[#F9FAFB] border border-neutral-200 rounded-lg p-1.5"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-600 block mb-1">
              কী কাজ করেছেন তা লিখুন
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="যেমন: ওয়াশরুম ও বেসিন পরিষ্কার করা হয়েছে..."
              className="w-full bg-[#F9FAFB] border border-neutral-200 rounded-lg px-3.5 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:border-[#F26522]"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-neutral-600">সময়:</span>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="bg-[#F9FAFB] border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs font-mono-num font-bold text-neutral-900 [color-scheme:light]"
              />
              <button
                type="button"
                onClick={() => setTime(getNowTimeHHMM())}
                className="px-3 py-1.5 rounded-lg bg-neutral-100 border border-neutral-200 hover:bg-neutral-200 text-xs font-semibold text-neutral-700"
              >
                এখন
              </button>
            </div>

            <button
              type="button"
              disabled={uploading}
              onClick={handleAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#F26522] hover:bg-[#DC5214] disabled:opacity-60 text-white text-xs font-semibold transition-colors"
            >
              <ImagePlus className="w-4 h-4" />
              {uploading ? 'সংরক্ষণ হচ্ছে...' : 'যুক্ত করুন'}
            </button>
          </div>
        </div>
      )}

      {data.proofs.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-xl p-8 text-center text-sm text-neutral-500 shadow-xs">
          আজকের কাজের কোনো প্রমাণ ফটো যুক্ত করা হয়নি
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {data.proofs.map((p, idx) => (
            <div
              key={p.id || idx}
              className="rounded-xl bg-white border border-neutral-200 overflow-hidden shadow-xs"
            >
              {p.photo ? (
                <img
                  src={p.photo}
                  alt="কাজের প্রমাণ"
                  referrerPolicy="no-referrer"
                  className="w-full h-52 object-cover bg-neutral-100"
                />
              ) : (
                <div className="w-full h-36 bg-orange-50 flex items-center justify-center text-[#F26522] text-xs font-semibold">
                  ফটো সংযুক্ত নেই
                </div>
              )}
              <div className="p-3.5 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-xs font-mono-num font-bold text-[#F26522]">
                    {p.time || getNowTimeHHMM()}
                  </div>
                  <p className="text-sm font-semibold text-neutral-900 mt-1 break-words">
                    {p.description}
                  </p>
                </div>
                {canEdit && p.id && (
                  <button
                    type="button"
                    onClick={() => void onDeleteProof(p.id!)}
                    aria-label="প্রমাণ মুছুন"
                    className="p-1.5 rounded-lg bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-600 shrink-0 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
