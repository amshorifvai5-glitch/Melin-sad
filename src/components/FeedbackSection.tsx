import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Inbox,
  Lock,
  MessageSquarePlus,
  Send,
  Trash2,
} from 'lucide-react';
import { FeedbackCategory, FeedbackEntry, FeedbackStatus } from '../types/report';
import {
  FEEDBACK_CATEGORIES,
  FEEDBACK_STATUSES,
  MAX_FEEDBACK_ADMIN_NOTE_LEN,
  MAX_FEEDBACK_MESSAGE_LEN,
  MAX_FEEDBACK_SENDER_LEN,
} from '../data/portalData';
import { ConfirmModal } from './ConfirmModal';

interface FeedbackSectionProps {
  canEdit: boolean;
  inboxItems: FeedbackEntry[];
  onSubmitFeedback: (payload: {
    category: FeedbackCategory;
    senderName: string;
    message: string;
  }) => Promise<void>;
  onUpdateFeedback: (
    feedbackId: string,
    updates: { status: FeedbackStatus; adminNote: string }
  ) => Promise<void>;
  onDeleteFeedback: (feedbackId: string) => Promise<void>;
  onBack: () => void;
}

const CATEGORY_STYLE: Record<FeedbackCategory, string> = {
  মতামত: 'bg-sky-50 text-sky-700 border-sky-200',
  পরামর্শ: 'bg-indigo-50 text-[#0A2E6D] border-indigo-200',
  অভিযোগ: 'bg-rose-50 text-rose-700 border-rose-200',
};

const STATUS_STYLE: Record<FeedbackStatus, string> = {
  নতুন: 'bg-amber-50 text-amber-800 border-amber-200',
  'দেখা হয়েছে': 'bg-neutral-100 text-neutral-700 border-neutral-200',
  'সমাধান হয়েছে': 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

function formatSubmissionDateTime(ms: number): string {
  if (!ms) return 'এইমাত্র';
  return new Date(ms).toLocaleString('bn-BD', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const FeedbackSection: React.FC<FeedbackSectionProps> = ({
  canEdit,
  inboxItems,
  onSubmitFeedback,
  onUpdateFeedback,
  onDeleteFeedback,
  onBack,
}) => {
  const [adminTab, setAdminTab] = useState<'inbox' | 'form'>('inbox');
  const [categoryFilter, setCategoryFilter] = useState<'সবগুলো' | FeedbackCategory>('সবগুলো');

  const [category, setCategory] = useState<FeedbackCategory>('মতামত');
  const [senderName, setSenderName] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedCategory, setSubmittedCategory] = useState<FeedbackCategory | null>(null);

  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FeedbackEntry | null>(null);

  const activeTab = canEdit ? adminTab : 'form';

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMessage = message.trim();
    if (!cleanMessage) {
      setSubmitError('অনুগ্রহ করে আপনার মতামত, পরামর্শ বা অভিযোগ লিখুন।');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmitFeedback({
        category,
        senderName: senderName.trim(),
        message: cleanMessage,
      });
      setSenderName('');
      setMessage('');
      setSubmittedCategory(category);
    } catch {
      setSubmitError('বার্তা পাঠানো যায়নি। অনুগ্রহ করে একটু পর আবার চেষ্টা করুন।');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredItems =
    categoryFilter === 'সবগুলো'
      ? inboxItems
      : inboxItems.filter((item) => item.category === categoryFilter);

  const unreadCount = inboxItems.filter((item) => item.status === 'নতুন').length;

  const handleStatusChange = async (item: FeedbackEntry, nextStatus: FeedbackStatus) => {
    setSavingId(item.id);
    try {
      const noteValue =
        noteDrafts[item.id] !== undefined ? noteDrafts[item.id] : item.adminNote;
      await onUpdateFeedback(item.id, { status: nextStatus, adminNote: noteValue });
    } finally {
      setSavingId(null);
    }
  };

  const handleSaveAdminNote = async (item: FeedbackEntry) => {
    setSavingId(item.id);
    try {
      const noteValue =
        noteDrafts[item.id] !== undefined ? noteDrafts[item.id] : item.adminNote;
      await onUpdateFeedback(item.id, { status: item.status, adminNote: noteValue });
    } finally {
      setSavingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setDeleteTarget(null);
    setSavingId(id);
    try {
      await onDeleteFeedback(id);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* হেডার */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm font-semibold text-neutral-700 hover:bg-neutral-50 shadow-xs transition-colors whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            হোম
          </button>
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-neutral-900">
              আপনার মতামত, পরামর্শ কিংবা আপনার অভিযোগ জানান
            </h2>
            <p className="text-xs text-neutral-500">
              সরাসরি মতামত, কাজের পরামর্শ বা অভিযোগ পাঠানোর গোপনীয় বক্স
            </p>
          </div>
        </div>

        {canEdit && (
          <div className="flex items-center gap-1.5 bg-white border border-neutral-200 rounded-lg p-1 shrink-0 shadow-xs">
            <button
              type="button"
              onClick={() => setAdminTab('inbox')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'inbox'
                  ? 'bg-[#F26522] text-white'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              <Inbox className="w-3.5 h-3.5" />
              অ্যাডমিন ইনবক্স (<span className="font-mono-num">{inboxItems.length}</span>)
            </button>
            <button
              type="button"
              onClick={() => setAdminTab('form')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'form'
                  ? 'bg-[#F26522] text-white'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              <MessageSquarePlus className="w-3.5 h-3.5" />
              নতুন ফর্ম
            </button>
          </div>
        )}
      </div>

      {/* ভিজিটর / নতুন বার্তা জমা দেওয়ার ফর্ম */}
      {activeTab === 'form' && (
        <div className="bg-white border border-neutral-200 rounded-xl p-5 sm:p-6 space-y-5 shadow-xs">
          <div className="flex items-start gap-3 bg-[#F9FAFB] border border-neutral-200 rounded-lg px-4 py-3 text-xs sm:text-sm text-neutral-600">
            <Lock className="w-4 h-4 text-[#F26522] shrink-0 mt-0.5" />
            <div>
              আপনার পাঠানো মতামত, পরামর্শ বা অভিযোগ সরাসরি অ্যাডমিনের কাছে গোপনীয়ভাবে পৌঁছাবে। অন্য কোনো ভিজিটর আপনার বার্তা দেখতে পারবেন না।
            </div>
          </div>

          {submittedCategory ? (
            (() => {
              const responseMap: Record<
                FeedbackCategory,
                {
                  title: string;
                  body: string;
                  boxClass: string;
                  iconClass: string;
                  titleClass: string;
                  bodyClass: string;
                  btnClass: string;
                }
              > = {
                অভিযোগ: {
                  title: 'আমি আন্তরিকভাবে দুঃখিত',
                  body: 'আপনার এই অসুবিধার জন্য আমি আন্তরিকভাবে দুঃখিত। আপনার অভিযোগটি গুরুত্বসহকারে গ্রহণ করা হয়েছে এবং দ্রুত সমাধানের ব্যবস্থা নেওয়া হবে।',
                  boxClass: 'bg-amber-50 border-amber-200',
                  iconClass: 'bg-amber-100 text-amber-700',
                  titleClass: 'text-amber-900',
                  bodyClass: 'text-amber-800',
                  btnClass: 'bg-amber-600 hover:bg-amber-700',
                },
                মতামত: {
                  title: 'আপনার মূল্যবান মতামতের জন্য আন্তরিক ধন্যবাদ',
                  body: 'আপনার মতামতটি সফলভাবে অ্যাডমিনের কাছে পৌঁছেছে। কাজের মান আরও উন্নত করতে আপনার এই মূল্যবান ভাবনা আমরা সাদরে বিবেচনা করব।',
                  boxClass: 'bg-orange-50 border-orange-200',
                  iconClass: 'bg-orange-100 text-[#F26522]',
                  titleClass: 'text-neutral-900',
                  bodyClass: 'text-neutral-700',
                  btnClass: 'bg-[#F26522] hover:bg-[#DC5214]',
                },
                পরামর্শ: {
                  title: 'আপনার সুন্দর পরামর্শের জন্য আন্তরিক ধন্যবাদ',
                  body: 'আপনার গঠনমূলক পরামর্শটি গুরুত্বসহকারে গ্রহণ করা হয়েছে। কাজ আরও সুন্দর ও সহজ করতে আপনার এই পরামর্শ আমাদের সাহায্য করবে।',
                  boxClass: 'bg-emerald-50 border-emerald-200',
                  iconClass: 'bg-emerald-100 text-emerald-700',
                  titleClass: 'text-emerald-900',
                  bodyClass: 'text-emerald-800',
                  btnClass: 'bg-emerald-600 hover:bg-emerald-700',
                },
              };
              const cfg = responseMap[submittedCategory];
              return (
                <div className={`${cfg.boxClass} border rounded-xl p-6 text-center space-y-3`}>
                  <div
                    className={`w-11 h-11 rounded-full ${cfg.iconClass} flex items-center justify-center mx-auto`}
                  >
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div className="space-y-1.5 max-w-lg mx-auto">
                    <h3 className={`text-base sm:text-lg font-bold ${cfg.titleClass}`}>
                      {cfg.title}
                    </h3>
                    <p className={`text-xs sm:text-sm leading-relaxed ${cfg.bodyClass}`}>
                      {cfg.body}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSubmittedCategory(null)}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg ${cfg.btnClass} text-white text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0`}
                  >
                    <MessageSquarePlus className="w-4 h-4" />
                    আরেকটি বার্তা পাঠান
                  </button>
                </div>
              );
            })()
          ) : (
            <form onSubmit={(e) => void handleFormSubmit(e)} className="space-y-4">
              {/* ধরন নির্বাচন */}
              <div className="space-y-2">
                <label className="block text-xs sm:text-sm font-bold text-neutral-800">
                  বিষয়ের ধরন নির্বাচন করুন
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {FEEDBACK_CATEGORIES.map((cat) => {
                    const selected = category === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`px-3 py-2.5 rounded-lg border text-xs sm:text-sm font-bold transition-colors whitespace-nowrap ${
                          selected
                            ? 'bg-[#F26522] border-[#F26522] text-white'
                            : 'bg-[#F9FAFB] border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* নাম বা ডেস্ক নং (ঐচ্ছিক) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor="feedbackSenderName"
                    className="block text-xs sm:text-sm font-bold text-neutral-800"
                  >
                    আপনার নাম বা ডেস্ক নং <span className="font-normal text-neutral-400">(ঐচ্ছিক)</span>
                  </label>
                  <span className="text-[11px] font-mono-num text-neutral-400">
                    {senderName.length}/{MAX_FEEDBACK_SENDER_LEN}
                  </span>
                </div>
                <input
                  id="feedbackSenderName"
                  type="text"
                  maxLength={MAX_FEEDBACK_SENDER_LEN}
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="যেমন: ডেস্ক ১২ বা আপনার নাম (গোপন রাখতে চাইলে খালি রাখুন)"
                  className="w-full px-3.5 py-2.5 bg-[#F9FAFB] border border-neutral-200 rounded-lg text-sm text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:border-[#F26522]"
                />
              </div>

              {/* বিস্তারিত বার্তা */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor="feedbackMessage"
                    className="block text-xs sm:text-sm font-bold text-neutral-800"
                  >
                    বিস্তারিত {category} লিখুন <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] font-mono-num text-neutral-400">
                    {message.length}/{MAX_FEEDBACK_MESSAGE_LEN}
                  </span>
                </div>
                <textarea
                  id="feedbackMessage"
                  rows={5}
                  maxLength={MAX_FEEDBACK_MESSAGE_LEN}
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    if (submitError) setSubmitError(null);
                  }}
                  placeholder={`এখানে আপনার ${category} বিস্তারিত লিখুন...`}
                  className="w-full px-3.5 py-2.5 bg-[#F9FAFB] border border-neutral-200 rounded-lg text-sm text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:border-[#F26522] resize-y"
                />
              </div>

              {submitError && (
                <div className="text-xs sm:text-sm font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3.5 py-2.5">
                  {submitError}
                </div>
              )}

              <div className="flex items-center justify-end pt-1">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#F26522] hover:bg-[#DC5214] disabled:opacity-60 text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? 'পাঠানো হচ্ছে...' : 'বার্তা পাঠান'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* শুধুমাত্র অ্যাডমিনের জন্য ইনবক্স */}
      {canEdit && activeTab === 'inbox' && (
        <div className="space-y-4">
          {/* ফিল্টার ও স্ট্যাটাস */}
          <div className="bg-white border border-neutral-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              {(['সবগুলো', ...FEEDBACK_CATEGORIES] as const).map((cat) => {
                const active = categoryFilter === cat;
                const count =
                  cat === 'সবগুলো'
                    ? inboxItems.length
                    : inboxItems.filter((i) => i.category === cat).length;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-[#F26522] border-[#F26522] text-white'
                        : 'bg-[#F9FAFB] border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    {cat} (<span className="font-mono-num">{count}</span>)
                  </button>
                );
              })}
            </div>

            <div className="text-xs font-semibold text-neutral-500 font-mono-num">
              নতুন অপঠিত: <span className="text-[#F26522] font-bold">{unreadCount}টি</span>
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <div className="bg-white border border-neutral-200 rounded-xl p-8 text-center text-sm text-neutral-500 shadow-xs">
              এই বিভাগে এখনো কোনো মতামত, পরামর্শ বা অভিযোগ জমা পড়েনি।
            </div>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((item) => {
                const noteVal =
                  noteDrafts[item.id] !== undefined ? noteDrafts[item.id] : item.adminNote;
                const isBusy = savingId === item.id;
                return (
                  <div
                    key={item.id}
                    className="bg-white border border-neutral-200 rounded-xl p-4 sm:p-5 space-y-3 shadow-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2.5 py-1 rounded-md border text-xs font-bold ${
                            CATEGORY_STYLE[item.category]
                          }`}
                        >
                          {item.category}
                        </span>
                        <span
                          className={`px-2.5 py-1 rounded-md border text-xs font-bold ${
                            STATUS_STYLE[item.status]
                          }`}
                        >
                          {item.status}
                        </span>
                        <span className="text-xs font-semibold text-neutral-700">
                          {item.senderName ? item.senderName : 'নাম প্রকাশে অনিচ্ছুক'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono-num text-neutral-400">
                          {formatSubmissionDateTime(item.createdAtMs)}
                        </span>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => setDeleteTarget(item)}
                          aria-label="বার্তা মুছুন"
                          className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 disabled:opacity-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-sm text-neutral-800 whitespace-pre-wrap leading-relaxed bg-[#F9FAFB] border border-neutral-200 rounded-lg p-3">
                      {item.message}
                    </p>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {FEEDBACK_STATUSES.map((st) => (
                          <button
                            key={st}
                            type="button"
                            disabled={isBusy}
                            onClick={() => void handleStatusChange(item, st)}
                            className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                              item.status === st
                                ? 'bg-[#F26522] border-[#F26522] text-white'
                                : 'bg-[#F9FAFB] border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 flex-1 sm:max-w-md">
                        <input
                          type="text"
                          maxLength={MAX_FEEDBACK_ADMIN_NOTE_LEN}
                          value={noteVal}
                          onChange={(e) =>
                            setNoteDrafts((prev) => ({
                              ...prev,
                              [item.id]: e.target.value,
                            }))
                          }
                          placeholder="অ্যাডমিন নোট (ঐচ্ছিক)..."
                          className="flex-1 min-w-0 px-3 py-1.5 bg-[#F9FAFB] border border-neutral-200 rounded-lg text-xs text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:border-[#F26522]"
                        />
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => void handleSaveAdminNote(item)}
                          className="px-3 py-1.5 rounded-lg bg-[#F26522] hover:bg-[#DC5214] disabled:opacity-60 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
                        >
                          নোট সেভ
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="বার্তা মুছে ফেলবেন?"
        message="এই মতামত বা অভিযোগটি স্থায়ীভাবে মুছে ফেলা হবে।"
        confirmLabel="হ্যাঁ, মুছে ফেলুন"
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
