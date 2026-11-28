import React, { useEffect, useState } from 'react';
import { Check, ChevronUp, MapPin, Pencil, Radio, X } from 'lucide-react';
import { DutyStatus, LiveLocationStatus } from '../types/report';
import {
  DHAKA_TIMEZONE,
  LIVE_LOCATION_PRESETS,
  MAX_LIVE_LOCATION_LABEL_LEN,
  MAX_LIVE_LOCATION_NOTE_LEN,
  formatDhakaClock,
} from '../data/portalData';

interface LiveLocationCornerProps {
  status: LiveLocationStatus | null;
  fallbackDutyStatus: DutyStatus;
  canEdit: boolean;
  onSave: (payload: { locationLabel: string; note: string; isActive: boolean }) => Promise<void>;
}

function formatUpdatedDateTime(ms: number): string {
  if (!ms) return 'এখনো আপডেট করা হয়নি';
  return new Date(ms).toLocaleString('bn-BD', {
    timeZone: DHAKA_TIMEZONE,
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export const LiveLocationCorner: React.FC<LiveLocationCornerProps> = ({
  status,
  fallbackDutyStatus,
  canEdit,
  onSave,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [labelInput, setLabelInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [isActiveInput, setIsActiveInput] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const effectiveLabel =
    status?.locationLabel ||
    (fallbackDutyStatus ? `${fallbackDutyStatus} অফিস` : 'অবস্থান সেট করা হয়নি');
  const effectiveNote = status?.note || '';
  const effectiveActive = status ? status.isActive : Boolean(fallbackDutyStatus);
  const liveClockText = formatDhakaClock(nowMs, true);

  useEffect(() => {
    if (!expanded) return;
    setLabelInput(status?.locationLabel || (fallbackDutyStatus ? `${fallbackDutyStatus} অফিস` : ''));
    setNoteInput(status?.note || '');
    setIsActiveInput(status ? status.isActive : true);
    setErrorMsg(null);
  }, [expanded, status, fallbackDutyStatus]);

  const handleQuickPreset = async (preset: { label: string; isActive: boolean }) => {
    if (!canEdit || saving) return;
    setSaving(true);
    setErrorMsg(null);
    try {
      await onSave({
        locationLabel: preset.label,
        note: '',
        isActive: preset.isActive,
      });
      setLabelInput(preset.label);
      setNoteInput('');
      setIsActiveInput(preset.isActive);
      setExpanded(false);
    } catch {
      setErrorMsg('অবস্থান আপডেট করা যায়নি।');
    } finally {
      setSaving(false);
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || saving) return;
    const cleanLabel = labelInput.trim().slice(0, MAX_LIVE_LOCATION_LABEL_LEN);
    if (!cleanLabel) {
      setErrorMsg('অবস্থানের নাম লিখুন।');
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    try {
      await onSave({
        locationLabel: cleanLabel,
        note: noteInput.trim().slice(0, MAX_LIVE_LOCATION_NOTE_LEN),
        isActive: isActiveInput,
      });
      setExpanded(false);
    } catch {
      setErrorMsg('অবস্থান আপডেট করা যায়নি।');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2 max-w-[calc(100vw-2rem)]">
      {/* বিস্তৃত লাইভ লোকেশন কার্ড / আপডেট প্যানেল */}
      {expanded && (
        <div className="w-[320px] sm:w-[350px] max-w-full bg-[#0B0B0D]/95 backdrop-blur-md border border-neutral-800 rounded-2xl shadow-2xl p-4 space-y-3.5 text-neutral-100">
          <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-neutral-800">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  effectiveActive
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                    : 'bg-neutral-900 border border-neutral-800 text-neutral-400'
                }`}
              >
                <Radio className="w-4 h-4" />
              </span>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white">আমি এখন কোথায় আছি (লাইভ)</div>
                <div className="text-[11px] text-neutral-400 font-mono-num truncate">
                  এখন: {liveClockText}
                  {status?.updatedAtMs ? ` · আপডেট: ${formatUpdatedDateTime(status.updatedAtMs)}` : ''}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              aria-label="বন্ধ করুন"
              className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* বর্তমান অবস্থা */}
          <div className="bg-[#16161A] border border-neutral-800 rounded-xl p-3 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-neutral-400">বর্তমান অবস্থান</span>
              <span
                className={`text-[11px] font-semibold ${
                  effectiveActive ? 'text-emerald-400' : 'text-neutral-400'
                }`}
              >
                {effectiveActive ? 'সরাসরি চালু' : 'অফ-ডিউটি'}
              </span>
            </div>
            <div className="text-sm font-bold text-white flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#F26522] shrink-0" />
              <span className="break-words">{effectiveLabel}</span>
            </div>
            {effectiveNote && (
              <p className="text-xs text-neutral-300 pl-5 break-words">{effectiveNote}</p>
            )}
          </div>

          {canEdit && (
            <div className="space-y-3 pt-1">
              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold text-neutral-400">
                  ১ ক্লিকে দ্রুত অবস্থান পরিবর্তন করুন:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {LIVE_LOCATION_PRESETS.map((preset) => {
                    const selected = status?.locationLabel === preset.label;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        disabled={saving}
                        onClick={() => void handleQuickPreset(preset)}
                        className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-colors whitespace-nowrap ${
                          selected
                            ? 'bg-[#F26522] border-[#F26522] text-white'
                            : 'bg-[#16161A] border-neutral-800 text-neutral-300 hover:border-[#F26522]/70 hover:text-white'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <form onSubmit={(e) => void handleCustomSubmit(e)} className="space-y-2.5 pt-2 border-t border-neutral-800">
                <div className="space-y-1">
                  <label htmlFor="liveLocLabel" className="text-[11px] font-semibold text-neutral-300 block">
                    নিজের মতো অবস্থান লিখুন
                  </label>
                  <input
                    id="liveLocLabel"
                    type="text"
                    maxLength={MAX_LIVE_LOCATION_LABEL_LEN}
                    value={labelInput}
                    onChange={(e) => {
                      setLabelInput(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    placeholder="যেমন: ৩য় তলা স্টোর রুম বা মার্কেট"
                    className="w-full bg-[#16161A] border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-[#F26522]"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="liveLocNote" className="text-[11px] font-semibold text-neutral-300 block">
                    ছোট নোট (ঐচ্ছিক)
                  </label>
                  <input
                    id="liveLocNote"
                    type="text"
                    maxLength={MAX_LIVE_LOCATION_NOTE_LEN}
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    placeholder="যেমন: ১৫ মিনিট পর ফিরছি"
                    className="w-full bg-[#16161A] border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-[#F26522]"
                  />
                </div>

                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setIsActiveInput((prev) => !prev)}
                    className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-colors ${
                      isActiveInput
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                        : 'bg-[#16161A] border-neutral-800 text-neutral-400'
                    }`}
                  >
                    {isActiveInput ? 'স্ট্যাটাস: সক্রিয়' : 'স্ট্যাটাস: অফ-ডিউটি'}
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-[#F26522] hover:bg-[#DC5214] disabled:opacity-60 text-white text-xs font-semibold transition-colors whitespace-nowrap"
                  >
                    <Check className="w-3.5 h-3.5" />
                    {saving ? 'সেভ হচ্ছে...' : 'লাইভ সেভ করুন'}
                  </button>
                </div>

                {errorMsg && (
                  <div className="text-[11px] text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg px-2.5 py-1.5">
                    {errorMsg}
                  </div>
                )}
              </form>
            </div>
          )}
        </div>
      )}

      {/* কোণার কমপ্যাক্ট লাইভ অবস্থান বাটন/কার্ড */}
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="bg-[#0B0B0D]/95 backdrop-blur-md border border-[#F26522]/45 hover:border-[#F26522] rounded-xl px-3.5 py-2 shadow-xl flex items-center gap-2.5 text-left transition-all max-w-[260px] sm:max-w-[300px] group"
        title={canEdit ? 'এখন কোথায় আছেন আপডেট করুন' : 'লাইভ অবস্থান দেখুন'}
      >
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          {effectiveActive && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          )}
          <span
            className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
              effectiveActive ? 'bg-emerald-500' : 'bg-neutral-500'
            }`}
          />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-neutral-400">
            <span className={effectiveActive ? 'text-emerald-400' : 'text-neutral-400'}>
              লাইভ অবস্থান
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-num tabular-nums text-neutral-200">{liveClockText}</span>
          </div>
          <div className="text-xs font-bold text-white truncate flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 text-[#F26522] shrink-0" />
            <span className="truncate">{effectiveLabel}</span>
          </div>
        </div>

        <span className="text-neutral-400 group-hover:text-[#F26522] shrink-0 transition-colors">
          {canEdit ? <Pencil className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </span>
      </button>
    </div>
  );
};
