import React, { useState } from 'react';
import { ArrowLeft, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { DayReportData } from '../types/report';
import { BASIC_TASKS, countBasicWorkProgress, getNowTimeHHMM } from '../data/portalData';
import { ConfirmModal } from './ConfirmModal';

interface BasicWorkSectionProps {
  data: DayReportData;
  canEdit: boolean;
  onUpdate: (updater: (prev: DayReportData) => DayReportData) => void;
  onBack: () => void;
}

export const BasicWorkSection: React.FC<BasicWorkSectionProps> = ({
  data,
  canEdit,
  onUpdate,
  onBack,
}) => {
  const [extraText, setExtraText] = useState('');
  const [extraTime, setExtraTime] = useState('');
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  const { done, total } = countBasicWorkProgress(data);

  const handleToggleBasic = (taskId: string, checked: boolean) => {
    if (!canEdit) return;
    onUpdate((prev) => {
      const current = prev.basicTasks[taskId] || { done: false, time: '' };
      return {
        ...prev,
        basicTasks: {
          ...prev.basicTasks,
          [taskId]: {
            done: checked,
            time: checked && !current.time ? getNowTimeHHMM() : current.time,
          },
        },
      };
    });
  };

  const handleSetBasicTime = (taskId: string, timeVal: string) => {
    if (!canEdit) return;
    onUpdate((prev) => {
      const current = prev.basicTasks[taskId] || { done: false, time: '' };
      return {
        ...prev,
        basicTasks: {
          ...prev.basicTasks,
          [taskId]: {
            done: timeVal ? true : current.done,
            time: timeVal,
          },
        },
      };
    });
  };

  const handleSetBasicNow = (taskId: string) => {
    if (!canEdit) return;
    const now = getNowTimeHHMM();
    onUpdate((prev) => ({
      ...prev,
      basicTasks: {
        ...prev.basicTasks,
        [taskId]: { done: true, time: now },
      },
    }));
  };

  const handleAddExtra = () => {
    if (!canEdit) return;
    const trimmed = extraText.trim();
    if (!trimmed) return;
    const timeVal = extraTime || getNowTimeHHMM();
    onUpdate((prev) => ({
      ...prev,
      extraBasicTasks: [...prev.extraBasicTasks, { text: trimmed, time: timeVal, done: true }],
    }));
    setExtraText('');
    setExtraTime('');
  };

  const handleToggleExtra = (index: number, checked: boolean) => {
    if (!canEdit) return;
    onUpdate((prev) => {
      const next = [...prev.extraBasicTasks];
      const item = next[index];
      if (!item) return prev;
      next[index] = {
        ...item,
        done: checked,
        time: checked && !item.time ? getNowTimeHHMM() : item.time,
      };
      return { ...prev, extraBasicTasks: next };
    });
  };

  const handleSetExtraTime = (index: number, timeVal: string) => {
    if (!canEdit) return;
    onUpdate((prev) => {
      const next = [...prev.extraBasicTasks];
      const item = next[index];
      if (!item) return prev;
      next[index] = {
        ...item,
        time: timeVal,
        done: timeVal ? true : item.done,
      };
      return { ...prev, extraBasicTasks: next };
    });
  };

  const handleDeleteExtra = (index: number) => {
    if (!canEdit) return;
    onUpdate((prev) => ({
      ...prev,
      extraBasicTasks: prev.extraBasicTasks.filter((_, idx) => idx !== index),
    }));
  };

  const handleConfirmReset = () => {
    if (!canEdit) return;
    onUpdate((prev) => ({
      ...prev,
      basicTasks: {},
      extraBasicTasks: [],
    }));
    setConfirmResetOpen(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            হোম
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-900">দৈনিক বেসিক কাজ</h2>
            <p className="text-xs text-slate-500">
              {canEdit
                ? 'কাজে টিক দিন এবং পাশের ঘরে শেষ করার সময় সংরক্ষণ করুন'
                : 'শুধুমাত্র দেখার মোড · সম্পন্ন কাজের তালিকা ও সময়'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`text-sm font-semibold font-mono-num ${
              total > 0 && done === total ? 'text-emerald-700' : 'text-indigo-700'
            }`}
          >
            {done}/{total} সম্পন্ন
          </span>
          {canEdit && (
            <button
              type="button"
              onClick={() => setConfirmResetOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              রিসেট
            </button>
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">আজকের সম্পন্ন কাজের বিবরণ</h3>
          <span className="text-xs text-slate-500 font-mono-num">মোট ২১টি রুটিন কাজ</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {BASIC_TASKS.map((task, idx) => {
            const entry = data.basicTasks[task.id] || { done: false, time: '' };
            return (
              <div
                key={task.id}
                className={`p-3 rounded-lg border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                  entry.done
                    ? 'bg-emerald-50/60 border-emerald-200'
                    : 'bg-white border-slate-200'
                }`}
              >
                <label
                  className={`flex items-start sm:items-center gap-2.5 flex-1 min-w-0 ${
                    canEdit ? 'cursor-pointer' : 'cursor-default'
                  }`}
                >
                  <input
                    type="checkbox"
                    disabled={!canEdit}
                    checked={entry.done}
                    onChange={(e) => handleToggleBasic(task.id, e.target.checked)}
                    className="w-4 h-4 mt-0.5 sm:mt-0 accent-emerald-600 rounded shrink-0 disabled:opacity-80"
                  />
                  <span className="text-sm font-semibold leading-snug text-slate-800">
                    <span className="text-indigo-700 font-mono-num mr-1.5">{idx + 1}.</span>
                    {task.text}
                  </span>
                </label>

                <div className="flex items-center gap-1.5 pl-6 sm:pl-0 shrink-0">
                  {canEdit ? (
                    <>
                      <input
                        type="time"
                        value={entry.time}
                        onChange={(e) => handleSetBasicTime(task.id, e.target.value)}
                        aria-label={`${task.text} সময়`}
                        className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs font-mono-num font-semibold text-slate-800 focus:outline-none focus:border-indigo-600"
                      />
                      <button
                        type="button"
                        onClick={() => handleSetBasicNow(task.id)}
                        className="px-2.5 py-1 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200 transition-colors whitespace-nowrap shrink-0"
                      >
                        এখন
                      </button>
                    </>
                  ) : (
                    <span className="text-xs font-mono-num font-semibold text-slate-500">
                      {entry.time || (entry.done ? 'সম্পন্ন' : 'বাকি')}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {(canEdit || data.extraBasicTasks.length > 0) && (
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <h4 className="text-sm font-bold text-slate-900">অতিরিক্ত কাজ</h4>

            {canEdit && (
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={extraText}
                  onChange={(e) => setExtraText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddExtra();
                  }}
                  placeholder="অতিরিক্ত কাজের বিবরণ লিখুন..."
                  className="flex-1 bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-600"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={extraTime}
                    onChange={(e) => setExtraTime(e.target.value)}
                    aria-label="অতিরিক্ত কাজের সময়"
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-mono-num font-semibold text-slate-800 focus:outline-none focus:border-indigo-600"
                  />
                  <button
                    type="button"
                    onClick={() => setExtraTime(getNowTimeHHMM())}
                    className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors whitespace-nowrap shrink-0"
                  >
                    এখন
                  </button>
                  <button
                    type="button"
                    onClick={handleAddExtra}
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    যুক্ত করুন
                  </button>
                </div>
              </div>
            )}

            {data.extraBasicTasks.length > 0 && (
              <div className="space-y-2 pt-1">
                {data.extraBasicTasks.map((item, idx) => (
                  <div
                    key={`${item.text}-${idx}`}
                    className={`p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                      item.done ? 'bg-indigo-50/60 border-indigo-200' : 'bg-white border-slate-200'
                    }`}
                  >
                    <label
                      className={`flex items-start sm:items-center gap-2.5 flex-1 min-w-0 ${
                        canEdit ? 'cursor-pointer' : 'cursor-default'
                      }`}
                    >
                      <input
                        type="checkbox"
                        disabled={!canEdit}
                        checked={item.done}
                        onChange={(e) => handleToggleExtra(idx, e.target.checked)}
                        className="w-4 h-4 mt-0.5 sm:mt-0 accent-indigo-600 rounded shrink-0"
                      />
                      <span className="text-sm font-semibold text-slate-800 break-words">
                        <span className="text-indigo-700 font-mono-num mr-1.5">
                          অতিরিক্ত {idx + 1}.
                        </span>
                        {item.text}
                      </span>
                    </label>
                    <div className="flex items-center gap-1.5 pl-6 sm:pl-0 shrink-0">
                      {canEdit ? (
                        <>
                          <input
                            type="time"
                            value={item.time}
                            onChange={(e) => handleSetExtraTime(idx, e.target.value)}
                            className="bg-white border border-slate-200 rounded-md px-2 py-1 text-xs font-mono-num font-semibold text-slate-800 focus:outline-none focus:border-indigo-600"
                          />
                          <button
                            type="button"
                            onClick={() => handleDeleteExtra(idx)}
                            aria-label="অতিরিক্ত কাজ মুছুন"
                            className="p-1.5 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <span className="text-xs font-mono-num font-semibold text-slate-500">
                          {item.time || '--:--'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmModal
        open={confirmResetOpen}
        title="বেসিক কাজ রিসেট করুন"
        message="আজকের দৈনিক বেসিক কাজের সব টিক, সময় ও অতিরিক্ত কাজ মুছে ফেলতে চান?"
        onConfirm={handleConfirmReset}
        onCancel={() => setConfirmResetOpen(false)}
      />
    </div>
  );
};
