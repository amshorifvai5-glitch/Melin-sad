import React, { useState } from 'react';
import { ArrowLeft, Check, Monitor, Armchair, RotateCcw, Search, X } from 'lucide-react';
import { DayReportData, DeskCleanState } from '../types/report';
import { TOTAL_DESKS, countDeskProgress } from '../data/portalData';
import { ConfirmModal } from './ConfirmModal';

interface DeskFloorMapSectionProps {
  data: DayReportData;
  canEdit: boolean;
  onUpdate: (updater: (prev: DayReportData) => DayReportData) => void;
  onBack: () => void;
}

const BLOCK_70_72 = [70, 71, 72];
const BLOCK_64_69 = [67, 64, 68, 65, 69, 66];
const BLOCK_61_63 = [63, 62, 61];
const BLOCK_52_60 = [60, 59, 58, 57, 56, 55, 54, 53, 52];
const BLOCK_1_10 = [1, 6, 2, 7, 3, 8, 4, 9, 5, 10];
const BLOCK_11_20 = [11, 16, 12, 17, 13, 18, 14, 19, 15, 20];
const BLOCK_21_26 = [21, 24, 22, 25, 23, 26];
const BLOCK_27_31 = [27, 28, 29, 30, 31];
const BLOCK_32_41 = [32, 37, 33, 38, 34, 39, 35, 40, 36, 41];
const BLOCK_42_51 = [42, 47, 43, 48, 44, 49, 45, 50, 46, 51];

function getDeskCellStyle(st: DeskCleanState): string {
  if (st.desk && st.chair) {
    return 'bg-emerald-600 text-white border-emerald-600 shadow-xs';
  }
  if (st.desk) {
    return 'bg-[#F26522]/15 text-[#C2410C] border-[#F26522]';
  }
  if (st.chair) {
    return 'bg-amber-100 text-amber-800 border-amber-400';
  }
  return 'bg-white text-neutral-700 border-neutral-300 hover:border-[#F26522]';
}

export const DeskFloorMapSection: React.FC<DeskFloorMapSectionProps> = ({
  data,
  canEdit,
  onUpdate,
  onBack,
}) => {
  const [view, setView] = useState<'map' | 'list'>('map');
  const [searchVal, setSearchVal] = useState('');
  const [filterVal, setFilterVal] = useState<'all' | 'pending' | 'done'>('all');
  const [activeModalDesk, setActiveModalDesk] = useState<number | null>(null);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  const { deskDone, chairDone, bothDone } = countDeskProgress(data);

  const getDeskState = (num: number): DeskCleanState =>
    data.desks[num] || { desk: false, chair: false };

  const toggleDeskField = (deskNum: number, field: 'desk' | 'chair') => {
    if (!canEdit) return;
    onUpdate((prev) => {
      const current = prev.desks[deskNum] || { desk: false, chair: false };
      return {
        ...prev,
        desks: {
          ...prev.desks,
          [deskNum]: {
            ...current,
            [field]: !current[field],
          },
        },
      };
    });
  };

  const markBothDone = (deskNum: number) => {
    if (!canEdit) return;
    onUpdate((prev) => ({
      ...prev,
      desks: {
        ...prev.desks,
        [deskNum]: { desk: true, chair: true },
      },
    }));
    setActiveModalDesk(null);
  };

  const handleConfirmReset = () => {
    if (!canEdit) return;
    onUpdate((prev) => ({ ...prev, desks: {} }));
    setConfirmResetOpen(false);
  };

  const renderMapDeskButton = (num: number) => {
    const st = getDeskState(num);
    return (
      <button
        key={num}
        type="button"
        onClick={() => setActiveModalDesk(num)}
        className={`w-8 h-8 rounded border text-xs font-mono-num font-bold flex items-center justify-center transition-transform active:scale-95 ${getDeskCellStyle(
          st
        )}`}
        title={`ডেস্ক #${num}`}
      >
        {num}
      </button>
    );
  };

  const filteredDesks: number[] = [];
  for (let i = 1; i <= TOTAL_DESKS; i++) {
    if (searchVal.trim() && String(i) !== searchVal.trim()) continue;
    const st = getDeskState(i);
    const isDone = st.desk && st.chair;
    if (filterVal === 'pending' && isDone) continue;
    if (filterVal === 'done' && !isDone) continue;
    filteredDesks.push(i);
  }

  const activeState = activeModalDesk ? getDeskState(activeModalDesk) : { desk: false, chair: false };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm font-semibold text-neutral-700 hover:bg-neutral-50 shadow-xs transition-colors whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            হোম
          </button>
          <div>
            <h2 className="text-xl font-bold text-neutral-900">ডেস্ক ও চেয়ার ম্যাপ</h2>
            <p className="text-xs text-neutral-500">
              {canEdit
                ? '৭৩টি ডেস্কের ক্লিন স্ট্যাটাস ট্র্যাকার'
                : 'শুধুমাত্র দেখার মোড · ৭৩টি ডেস্কের ক্লিন স্ট্যাটাস'}
            </p>
          </div>
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={() => setConfirmResetOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            রিসেট
          </button>
        )}
      </div>

      {/* স্ট্যাটিস্টিকস স্ট্রিপ */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-neutral-200 rounded-xl p-3.5 shadow-xs">
          <div className="text-xs font-medium text-neutral-500">ডেস্ক ক্লিন</div>
          <div className="text-xl font-bold text-[#F26522] font-mono-num mt-0.5">
            {deskDone}
            <span className="text-xs font-normal text-neutral-400"> / {TOTAL_DESKS}</span>
          </div>
        </div>
        <div className="bg-white border border-neutral-200 rounded-xl p-3.5 shadow-xs">
          <div className="text-xs font-medium text-neutral-500">চেয়ার ক্লিন</div>
          <div className="text-xl font-bold text-amber-600 font-mono-num mt-0.5">
            {chairDone}
            <span className="text-xs font-normal text-neutral-400"> / {TOTAL_DESKS}</span>
          </div>
        </div>
        <div className="bg-white border border-neutral-200 rounded-xl p-3.5 shadow-xs">
          <div className="text-xs font-medium text-neutral-500">উভয় সম্পন্ন</div>
          <div className="text-xl font-bold text-emerald-600 font-mono-num mt-0.5">
            {bothDone}
            <span className="text-xs font-normal text-neutral-400"> / {TOTAL_DESKS}</span>
          </div>
        </div>
      </div>

      {/* ভিউ সুইচার */}
      <div className="bg-white border border-neutral-200 p-1 rounded-lg grid grid-cols-2 gap-1 max-w-md shadow-xs">
        <button
          type="button"
          onClick={() => setView('map')}
          className={`py-2 px-3 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
            view === 'map'
              ? 'bg-[#F26522] text-white'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
          }`}
        >
          অফিস ফ্লোর ম্যাপ
        </button>
        <button
          type="button"
          onClick={() => setView('list')}
          className={`py-2 px-3 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
            view === 'list'
              ? 'bg-[#F26522] text-white'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
          }`}
        >
          তালিকা ভিউ (১-৭৩)
        </button>
      </div>

      {view === 'map' ? (
        <div className="space-y-3">
          {/* লিজেন্ড */}
          <div className="bg-white px-4 py-2.5 rounded-xl border border-neutral-200 flex flex-wrap items-center gap-4 text-xs font-semibold text-neutral-700 shadow-xs">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-white border border-neutral-300 inline-block" />
              বাকি
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-[#F26522]/15 border-2 border-[#F26522] inline-block" />
              শুধু ডেস্ক
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-amber-100 border-2 border-amber-400 inline-block" />
              শুধু চেয়ার
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-emerald-600 inline-block" />
              উভয় সম্পন্ন
            </span>
          </div>

          {/* ফ্লোর ম্যাপ গ্রিড */}
          <div className="bg-white rounded-xl border border-neutral-200 p-4 overflow-x-auto shadow-xs">
            <div className="min-w-[680px]">
              {/* উপরের অংশ */}
              <div className="flex items-stretch justify-between gap-3">
                <div className="flex-1 flex flex-col justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col gap-1.5 bg-neutral-100 p-1.5 rounded-lg border border-neutral-200">
                      {BLOCK_70_72.map(renderMapDeskButton)}
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 bg-neutral-100 p-1.5 rounded-lg border border-neutral-200">
                      {BLOCK_64_69.map(renderMapDeskButton)}
                    </div>
                    <div className="flex flex-col gap-1.5 bg-neutral-100 p-1.5 rounded-lg border border-neutral-200 ml-2">
                      {BLOCK_61_63.map(renderMapDeskButton)}
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-1.5 bg-neutral-100 p-1.5 rounded-lg border border-neutral-200 self-end">
                    {BLOCK_52_60.map(renderMapDeskButton)}
                  </div>
                </div>

                <div className="w-16 bg-[#0A2E6D]/10 border border-[#0A2E6D]/25 rounded-lg flex items-center justify-center p-1 shrink-0">
                  <span className="vertical-text font-bold text-xs text-[#0A2E6D] tracking-wider">
                    Room-1
                  </span>
                </div>
              </div>

              {/* মাঝখানের করিডোর */}
              <div className="my-3 py-2 bg-neutral-100 border-y border-dashed border-neutral-300 rounded-md text-center">
                <span className="text-xs font-bold text-neutral-500 tracking-[0.2em]">
                  করিডোর (CORRIDOR)
                </span>
              </div>

              {/* নিচের অংশ */}
              <div className="flex items-stretch justify-between gap-3">
                <div className="flex-1 flex items-start justify-between gap-2">
                  <div className="grid grid-cols-2 gap-1.5 bg-neutral-100 p-1.5 rounded-lg border border-neutral-200">
                    {BLOCK_1_10.map(renderMapDeskButton)}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 bg-neutral-100 p-1.5 rounded-lg border border-neutral-200">
                    {BLOCK_11_20.map(renderMapDeskButton)}
                  </div>

                  <div className="flex flex-col justify-between gap-2.5 self-stretch">
                    <div className="grid grid-cols-2 gap-1.5 bg-neutral-100 p-1.5 rounded-lg border border-neutral-200">
                      {BLOCK_21_26.map(renderMapDeskButton)}
                    </div>
                    <div className="bg-rose-50 border border-rose-200 rounded-lg py-3 px-2 text-center">
                      <span className="text-xs font-bold text-rose-700">Washroom</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 bg-neutral-100 p-1.5 rounded-lg border border-neutral-200">
                    {BLOCK_27_31.map(renderMapDeskButton)}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 bg-neutral-100 p-1.5 rounded-lg border border-neutral-200">
                    {BLOCK_32_41.map(renderMapDeskButton)}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 bg-neutral-100 p-1.5 rounded-lg border border-neutral-200">
                    {BLOCK_42_51.map(renderMapDeskButton)}
                  </div>
                </div>

                <div className="w-16 flex flex-col gap-2 shrink-0">
                  <div className="flex-1 bg-orange-50 border border-orange-200 rounded-lg flex items-center justify-center p-1">
                    <span className="vertical-text font-bold text-xs text-[#C2410C]">Room-2</span>
                  </div>
                  <div className="flex-[1.3] bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-center p-1">
                    <span className="vertical-text font-bold text-xs text-emerald-700">
                      Room-3
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-neutral-200 flex items-center justify-between">
                <span className="text-xs text-neutral-500">
                  {canEdit
                    ? 'যেকোনো ডেস্ক নম্বরে ক্লিক করে ক্লিন স্ট্যাটাস নির্বাচন করুন'
                    : 'যেকোনো ডেস্ক নম্বরে ক্লিক করে স্ট্যাটাস দেখুন'}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-neutral-700">অতিরিক্ত ডেস্ক:</span>
                  {renderMapDeskButton(73)}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="number"
                min={1}
                max={TOTAL_DESKS}
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder="ডেস্ক নং খুঁজুন (১-৭৩)..."
                className="w-full bg-white border border-neutral-200 rounded-lg pl-9 pr-3.5 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-[#F26522]"
              />
            </div>
            <select
              value={filterVal}
              onChange={(e) => setFilterVal(e.target.value as 'all' | 'pending' | 'done')}
              className="bg-white border border-neutral-200 rounded-lg px-3.5 py-2 text-sm font-semibold text-neutral-700 focus:outline-none focus:border-[#F26522]"
            >
              <option value="all">সবগুলো (৭৩)</option>
              <option value="pending">বাকি আছে</option>
              <option value="done">সম্পন্ন হয়েছে</option>
            </select>
          </div>

          {filteredDesks.length === 0 ? (
            <div className="bg-white border border-neutral-200 rounded-xl p-8 text-center text-sm text-neutral-500 shadow-xs">
              নির্বাচিত ফিল্টারে কোনো ডেস্ক পাওয়া যায়নি
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {filteredDesks.map((num) => {
                const st = getDeskState(num);
                const isDone = st.desk && st.chair;
                return (
                  <div
                    key={num}
                    className={`rounded-xl p-3 border transition-colors shadow-xs ${
                      isDone
                        ? 'bg-emerald-50 border-emerald-200'
                        : 'bg-white border-neutral-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="font-bold text-sm text-neutral-900 font-mono-num">
                        ডেস্ক #{num}
                      </span>
                      <span
                        className={`text-xs font-semibold ${
                          isDone ? 'text-emerald-700' : 'text-neutral-500'
                        }`}
                      >
                        {isDone ? 'সম্পন্ন' : 'বাকি'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        disabled={!canEdit}
                        onClick={() => toggleDeskField(num, 'desk')}
                        className={`py-1.5 px-2 rounded-md text-xs font-semibold border transition-colors inline-flex items-center justify-center gap-1 disabled:cursor-default ${
                          st.desk
                            ? 'bg-[#F26522] text-white border-[#F26522]'
                            : 'bg-[#F9FAFB] text-neutral-700 border-neutral-200 hover:border-[#F26522] disabled:hover:border-neutral-200'
                        }`}
                      >
                        <Monitor className="w-3.5 h-3.5" />
                        ডেস্ক
                      </button>
                      <button
                        type="button"
                        disabled={!canEdit}
                        onClick={() => toggleDeskField(num, 'chair')}
                        className={`py-1.5 px-2 rounded-md text-xs font-semibold border transition-colors inline-flex items-center justify-center gap-1 disabled:cursor-default ${
                          st.chair
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'bg-[#F9FAFB] text-neutral-700 border-neutral-200 hover:border-amber-500 disabled:hover:border-neutral-200'
                        }`}
                      >
                        <Armchair className="w-3.5 h-3.5" />
                        চেয়ার
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ডেস্ক মোডাল */}
      {activeModalDesk !== null && (
        <div
          onClick={() => setActiveModalDesk(null)}
          className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl max-w-xs w-full p-5 shadow-2xl border border-neutral-200"
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-lg bg-[#F26522] text-white font-mono-num font-bold flex items-center justify-center text-sm">
                  #{activeModalDesk}
                </span>
                <div>
                  <h3 className="font-bold text-neutral-900 text-base">
                    ডেস্ক নম্বর <span className="font-mono-num">{activeModalDesk}</span>
                  </h3>
                  <p className="text-xs text-neutral-500">
                    {canEdit ? 'ক্লিন স্ট্যাটাস নির্বাচন করুন' : 'বর্তমান ক্লিন স্ট্যাটাস'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalDesk(null)}
                aria-label="বন্ধ করুন"
                className="text-neutral-400 hover:text-neutral-800 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 my-4">
              <button
                type="button"
                disabled={!canEdit}
                onClick={() => toggleDeskField(activeModalDesk, 'desk')}
                className={`w-full py-2.5 px-3.5 rounded-lg border text-sm font-semibold flex items-center justify-between transition-colors disabled:cursor-default ${
                  activeState.desk
                    ? 'border-[#F26522] bg-orange-50 text-[#C2410C]'
                    : 'border-neutral-200 bg-[#F9FAFB] text-neutral-700 hover:bg-neutral-100 disabled:hover:bg-[#F9FAFB]'
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <Monitor className="w-4 h-4" />
                  ডেস্ক ক্লিন
                </span>
                <span>{activeState.desk ? 'সম্পন্ন' : 'বাকি'}</span>
              </button>

              <button
                type="button"
                disabled={!canEdit}
                onClick={() => toggleDeskField(activeModalDesk, 'chair')}
                className={`w-full py-2.5 px-3.5 rounded-lg border text-sm font-semibold flex items-center justify-between transition-colors disabled:cursor-default ${
                  activeState.chair
                    ? 'border-amber-500 bg-amber-50 text-amber-800'
                    : 'border-neutral-200 bg-[#F9FAFB] text-neutral-700 hover:bg-neutral-100 disabled:hover:bg-[#F9FAFB]'
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <Armchair className="w-4 h-4" />
                  চেয়ার ক্লিন
                </span>
                <span>{activeState.chair ? 'সম্পন্ন' : 'বাকি'}</span>
              </button>
            </div>

            {canEdit ? (
              <button
                type="button"
                onClick={() => markBothDone(activeModalDesk)}
                className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm inline-flex items-center justify-center gap-1.5 transition-colors"
              >
                <Check className="w-4 h-4" />
                ডেস্ক ও চেয়ার উভয়ই সম্পন্ন
              </button>
            ) : (
              <p className="text-xs text-center text-neutral-500 pt-1">
                শুধুমাত্র অ্যাডমিন স্ট্যাটাস পরিবর্তন করতে পারবেন
              </p>
            )}
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirmResetOpen}
        title="ডেস্ক ও চেয়ার স্ট্যাটাস রিসেট"
        message="আজকের তারিখের সব ৭৩টি ডেস্ক ও চেয়ার ক্লিন স্ট্যাটাস রিসেট করতে চান?"
        onConfirm={handleConfirmReset}
        onCancel={() => setConfirmResetOpen(false)}
      />
    </div>
  );
};
