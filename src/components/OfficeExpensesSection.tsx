import React, { useState } from 'react';
import { ArrowLeft, Download, ImagePlus, Plus, Receipt, Trash2, X } from 'lucide-react';
import { DayReportData, ExpenseCategory, OfficeExpenseEntry } from '../types/report';
import {
  EXPENSE_CATEGORIES,
  MAX_EXPENSE_AMOUNT,
  MAX_EXPENSE_NOTE_LEN,
  MAX_EXPENSE_RECEIPT_LEN,
  MAX_EXPENSE_TITLE_LEN,
  compressImageToDataUrl,
  getNowTimeHHMM,
  getTotalExpenseAmount,
} from '../data/portalData';
import { ConfirmModal } from './ConfirmModal';

interface OfficeExpensesSectionProps {
  data: DayReportData;
  canEdit: boolean;
  onAddExpense: (expense: OfficeExpenseEntry) => Promise<void>;
  onDeleteExpense: (expenseId: string) => Promise<void>;
  onBack: () => void;
}

export const OfficeExpensesSection: React.FC<OfficeExpensesSectionProps> = ({
  data,
  canEdit,
  onAddExpense,
  onDeleteExpense,
  onBack,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('চা-নাস্তা');
  const [amountInput, setAmountInput] = useState('');
  const [time, setTime] = useState(() => getNowTimeHHMM());
  const [note, setNote] = useState('');
  const [receiptPhoto, setReceiptPhoto] = useState('');
  const [fileInputKey, setFileInputKey] = useState(0);
  const [compressing, setCompressing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<'সবগুলো' | ExpenseCategory>('সবগুলো');
  const [deleteTarget, setDeleteTarget] = useState<OfficeExpenseEntry | null>(null);
  const [previewExpense, setPreviewExpense] = useState<OfficeExpenseEntry | null>(null);

  const totalAmount = getTotalExpenseAmount(data);
  const filteredExpenses =
    filterCategory === 'সবগুলো'
      ? data.expenses
      : data.expenses.filter((exp) => exp.category === filterCategory);

  const handleReceiptSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCompressing(true);
    setFormError(null);
    try {
      const compressed = await compressImageToDataUrl(
        file,
        760,
        0.72,
        MAX_EXPENSE_RECEIPT_LEN - 30000
      );
      setReceiptPhoto(compressed);
    } catch {
      setFormError('রসিদের ছবি প্রক্রিয়া করা যায়নি। অন্য একটি ছবি দিন।');
    } finally {
      setCompressing(false);
    }
  };

  const handleClearReceipt = () => {
    setReceiptPhoto('');
    setFileInputKey((prev) => prev + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    const cleanTitle = title.trim().slice(0, MAX_EXPENSE_TITLE_LEN);
    const parsedAmount = Number(amountInput);

    if (!cleanTitle) {
      setFormError('অনুগ্রহ করে খরচের বিবরণ লিখুন।');
      return;
    }
    if (
      !amountInput ||
      Number.isNaN(parsedAmount) ||
      parsedAmount < 0 ||
      parsedAmount > MAX_EXPENSE_AMOUNT
    ) {
      setFormError(`সঠিক টাকার পরিমাণ লিখুন (০ থেকে ${MAX_EXPENSE_AMOUNT} পর্যন্ত)।`);
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      await onAddExpense({
        title: cleanTitle,
        category,
        amount: Math.round(parsedAmount * 100) / 100,
        time: time || getNowTimeHHMM(),
        note: note.trim().slice(0, MAX_EXPENSE_NOTE_LEN),
        receiptPhoto,
      });
      setTitle('');
      setAmountInput('');
      setNote('');
      setReceiptPhoto('');
      setFileInputKey((prev) => prev + 1);
      setTime(getNowTimeHHMM());
    } catch {
      setFormError('খরচ সংরক্ষণ করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget?.id) return;
    const id = deleteTarget.id;
    setDeleteTarget(null);
    await onDeleteExpense(id);
  };

  const handleDownloadReceipt = (exp: OfficeExpenseEntry) => {
    if (!exp.receiptPhoto || !exp.receiptPhoto.startsWith('data:image/')) return;
    const link = document.createElement('a');
    link.href = exp.receiptPhoto;
    link.download = `voucher-${exp.id || 'receipt'}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#101829] border border-slate-700/80 rounded-lg text-sm font-semibold text-slate-200 hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            হোম
          </button>
          <div>
            <h2 className="text-xl font-bold text-white">অফিসের জন্য খরচ</h2>
            <p className="text-xs text-slate-400">
              {canEdit
                ? 'অফিসের খরচ, রসিদ বা ক্যাশমেমোর ছবিসহ হিসাব লিপিবদ্ধ করুন'
                : 'শুধুমাত্র দেখার মোড · আজকের অফিস খরচ ও রসিদ'}
            </p>
          </div>
        </div>

        <div className="bg-[#101829] border border-emerald-500/30 rounded-xl px-4 py-2.5 flex items-center gap-3 shrink-0">
          <Receipt className="w-4 h-4 text-emerald-400 shrink-0" />
          <div>
            <div className="text-[11px] text-slate-400">আজকের মোট খরচ</div>
            <div className="text-base font-bold font-mono-num text-white">৳{totalAmount}</div>
          </div>
        </div>
      </div>

      {canEdit && (
        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="bg-[#101829] border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4"
        >
          <div className="text-sm font-bold text-white">নতুন খরচ যুক্ত করুন</div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="expenseTitle" className="block text-xs font-semibold text-slate-300">
                খরচের বিবরণ <span className="text-rose-400">*</span>
              </label>
              <input
                id="expenseTitle"
                type="text"
                maxLength={MAX_EXPENSE_TITLE_LEN}
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (formError) setFormError(null);
                }}
                placeholder="যেমন: অফিসের চা-নাস্তা, টিস্যু বা রিকশা ভাড়া"
                className="w-full bg-[#090E1A] border border-slate-700/80 rounded-lg px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="expenseAmount" className="block text-xs font-semibold text-slate-300">
                টাকার পরিমাণ (৳) <span className="text-rose-400">*</span>
              </label>
              <input
                id="expenseAmount"
                type="number"
                min={0}
                max={MAX_EXPENSE_AMOUNT}
                step="any"
                value={amountInput}
                onChange={(e) => {
                  setAmountInput(e.target.value);
                  if (formError) setFormError(null);
                }}
                placeholder="যেমন: ১৫০"
                className="w-full bg-[#090E1A] border border-slate-700/80 rounded-lg px-3.5 py-2 text-sm font-mono-num font-bold text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="block text-xs font-semibold text-slate-300">খরচের ধরন</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {EXPENSE_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-2 rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap ${
                    category === cat
                      ? 'bg-sky-600 border-sky-500 text-white'
                      : 'bg-[#090E1A] border-slate-700/80 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="expenseTime" className="block text-xs font-semibold text-slate-300">
                সময়
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="expenseTime"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="flex-1 bg-[#090E1A] border border-slate-700/80 rounded-lg px-3 py-2 text-xs font-mono-num font-bold text-slate-100 [color-scheme:dark] focus:outline-none focus:border-sky-500"
                />
                <button
                  type="button"
                  onClick={() => setTime(getNowTimeHHMM())}
                  className="px-3 py-2 rounded-lg bg-[#090E1A] border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-200 whitespace-nowrap shrink-0"
                >
                  এখন
                </button>
              </div>
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label htmlFor="expenseNote" className="block text-xs font-semibold text-slate-300">
                মন্তব্য / ভাউচার নোট <span className="font-normal text-slate-500">(ঐচ্ছিক)</span>
              </label>
              <input
                id="expenseNote"
                type="text"
                maxLength={MAX_EXPENSE_NOTE_LEN}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="যেমন: কার অনুমোদনে বা কোথা থেকে কেনা হয়েছে"
                className="w-full bg-[#090E1A] border border-slate-700/80 rounded-lg px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* রসিদ / ভাউচার ছবি আপলোড ও সাবমিট */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-3">
              <label
                htmlFor="expenseReceiptInput"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-700 bg-[#090E1A] hover:bg-slate-800 text-xs font-semibold text-slate-200 cursor-pointer transition-colors whitespace-nowrap"
              >
                <ImagePlus className="w-4 h-4 text-sky-400" />
                {compressing
                  ? 'ছবি প্রস্তুত হচ্ছে...'
                  : receiptPhoto
                  ? 'অন্য রসিদ দিন'
                  : 'রসিদ / ভাউচারের ছবি (ঐচ্ছিক)'}
              </label>
              <input
                key={fileInputKey}
                id="expenseReceiptInput"
                type="file"
                accept="image/*"
                onChange={(e) => void handleReceiptSelect(e)}
                className="hidden"
              />

              {receiptPhoto && (
                <div className="flex items-center gap-2">
                  <img
                    src={receiptPhoto}
                    alt="সংযুক্ত রসিদ"
                    className="w-10 h-10 object-cover rounded-lg border border-slate-700"
                  />
                  <button
                    type="button"
                    onClick={handleClearReceipt}
                    className="text-xs font-semibold text-rose-400 hover:text-rose-300"
                  >
                    ছবি সরান
                  </button>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting || compressing}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-60 text-white text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              {submitting ? 'যুক্ত হচ্ছে...' : 'খরচ যুক্ত করুন'}
            </button>
          </div>

          {formError && (
            <div className="text-xs font-medium text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">
              {formError}
            </div>
          )}
        </form>
      )}

      {/* ধরন অনুযায়ী ফিল্টার */}
      <div className="bg-[#101829] border border-slate-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {(['সবগুলো', ...EXPENSE_CATEGORIES] as const).map((cat) => {
            const active = filterCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-sky-600 border-sky-500 text-white'
                    : 'bg-[#090E1A] border-slate-700/80 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
        <div className="text-xs font-mono-num text-slate-400">
          মোট এন্ট্রি: <strong className="text-white">{filteredExpenses.length}টি</strong>
        </div>
      </div>

      {/* খরচের তালিকা */}
      <div className="bg-[#101829] border border-slate-800 rounded-xl divide-y divide-slate-800">
        {filteredExpenses.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">
            এই তারিখে এখনো কোনো অফিস খরচ যুক্ত করা হয়নি
          </div>
        ) : (
          filteredExpenses.map((exp, idx) => {
            const hasReceipt = Boolean(exp.receiptPhoto && exp.receiptPhoto.startsWith('data:image/'));
            return (
              <div
                key={exp.id || idx}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  {hasReceipt && (
                    <button
                      type="button"
                      onClick={() => setPreviewExpense(exp)}
                      className="shrink-0 rounded-lg overflow-hidden border border-slate-700 hover:border-sky-500 transition-colors"
                      title="রসিদ বড় করে দেখুন"
                    >
                      <img
                        src={exp.receiptPhoto}
                        alt={`${exp.title} রসিদ`}
                        className="w-14 h-14 object-cover block"
                      />
                    </button>
                  )}

                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <span className="font-semibold text-sky-400">{exp.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-num">{exp.time || '--:--'}</span>
                      {hasReceipt && (
                        <>
                          <span aria-hidden="true">·</span>
                          <button
                            type="button"
                            onClick={() => setPreviewExpense(exp)}
                            className="font-semibold text-emerald-400 hover:underline"
                          >
                            রসিদ দেখুন
                          </button>
                        </>
                      )}
                    </div>
                    <div className="text-sm sm:text-base font-bold text-white break-words">
                      {exp.title}
                    </div>
                    {exp.note && <p className="text-xs text-slate-400 break-words">{exp.note}</p>}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <span className="text-base font-bold font-mono-num text-emerald-400">
                    ৳{exp.amount}
                  </span>
                  {canEdit && exp.id && (
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(exp)}
                      aria-label="খরচ মুছুন"
                      className="p-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* রসিদ প্রিভিউ মডাল */}
      {previewExpense && previewExpense.receiptPhoto && (
        <div
          onClick={() => setPreviewExpense(null)}
          className="fixed inset-0 bg-black/80 backdrop-blur-[2px] z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#101829] border border-slate-800 rounded-xl max-w-lg w-full overflow-hidden shadow-2xl"
          >
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-bold text-white truncate">
                  {previewExpense.title}
                </div>
                <div className="text-xs text-slate-400 font-mono-num">
                  {previewExpense.category} · ৳{previewExpense.amount} · {previewExpense.time}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewExpense(null)}
                aria-label="বন্ধ করুন"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-[#090E1A] p-3 flex items-center justify-center max-h-[65vh] overflow-auto">
              <img
                src={previewExpense.receiptPhoto}
                alt={previewExpense.title}
                className="max-w-full max-h-[58vh] object-contain rounded-lg"
              />
            </div>

            <div className="px-4 py-3 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => handleDownloadReceipt(previewExpense)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-700 bg-[#090E1A] hover:bg-slate-800 text-xs font-semibold text-slate-200"
              >
                <Download className="w-3.5 h-3.5" />
                ছবি ডাউনলোড
              </button>
              <button
                type="button"
                onClick={() => setPreviewExpense(null)}
                className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-xs font-semibold text-white"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="খরচের এন্ট্রি মুছবেন?"
        message="এই খরচের হিসাবটি স্থায়ীভাবে মুছে ফেলা হবে।"
        confirmLabel="হ্যাঁ, মুছে ফেলুন"
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
