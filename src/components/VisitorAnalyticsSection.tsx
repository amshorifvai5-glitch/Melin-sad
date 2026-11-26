import React, { useEffect, useState } from 'react';
import {
  Activity,
  ArrowLeft,
  Eye,
  Lock,
  LogIn,
  Monitor,
  Smartphone,
  Trash2,
  Users,
} from 'lucide-react';
import { MENU_ITEMS, formatBanglaDate, getTodayIsoDate } from '../data/portalData';
import { SiteVisitEntry } from '../types/report';
import { ConfirmModal } from './ConfirmModal';

interface VisitorAnalyticsSectionProps {
  visits: SiteVisitEntry[];
  canEdit: boolean;
  authLoading: boolean;
  onAdminSignIn: () => void;
  onDeleteVisit: (visitId: string) => Promise<void>;
  onBack: () => void;
}

const LIVE_WINDOW_MS = 2 * 60 * 1000;

function getPageLabelBn(pageId: string): string {
  if (pageId === 'home') return 'হোম / ড্যাশবোর্ড';
  if (pageId === 'emergency-contact') return 'জরুরি যোগাযোগ';
  const match = MENU_ITEMS.find((m) => m.id === pageId);
  return match ? match.title : pageId;
}

function formatRelativeSeenBn(lastSeenAtMs: number, nowMs: number): { label: string; isLive: boolean } {
  if (!lastSeenAtMs) return { label: 'এইমাত্র', isLive: true };
  const diffMs = Math.max(0, nowMs - lastSeenAtMs);
  if (diffMs <= LIVE_WINDOW_MS) {
    const secs = Math.floor(diffMs / 1000);
    if (secs < 20) return { label: 'এইমাত্র (লাইভ)', isLive: true };
    const mins = Math.floor(diffMs / 60000);
    return { label: mins < 1 ? `${secs} সেকেন্ড আগে (লাইভ)` : `${mins} মিনিট আগে (লাইভ)`, isLive: true };
  }
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return { label: `${mins} মিনিট আগে`, isLive: false };
  const hours = Math.floor(mins / 60);
  if (hours < 24) return { label: `${hours} ঘণ্টা আগে`, isLive: false };
  const days = Math.floor(hours / 24);
  return { label: `${days} দিন আগে`, isLive: false };
}

export const VisitorAnalyticsSection: React.FC<VisitorAnalyticsSectionProps> = ({
  visits,
  canEdit,
  authLoading,
  onAdminSignIn,
  onDeleteVisit,
  onBack,
}) => {
  const [filterMode, setFilterMode] = useState<'live' | 'today' | 'all'>('today');
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 15000);
    return () => window.clearInterval(timer);
  }, []);

  const todayId = getTodayIsoDate();
  const liveVisits = visits.filter(
    (v) => v.lastSeenAtMs > 0 && nowMs - v.lastSeenAtMs <= LIVE_WINDOW_MS
  );
  const todayVisits = visits.filter((v) => v.dateId === todayId);

  const todayViewsTotal = todayVisits.reduce((sum, v) => sum + v.viewsCount, 0);
  const allTimeViewsTotal = visits.reduce((sum, v) => sum + v.viewsCount, 0);

  const mobileCount = visits.filter((v) => v.deviceType === 'মোবাইল').length;
  const desktopCount = visits.filter((v) => v.deviceType === 'ডেস্কটপ').length;
  const totalDeviceEntries = mobileCount + desktopCount;
  const mobilePercent =
    totalDeviceEntries > 0 ? Math.round((mobileCount / totalDeviceEntries) * 100) : 0;

  const liveByPage = liveVisits.reduce<Record<string, number>>((acc, v) => {
    const label = getPageLabelBn(v.activePage);
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});
  const livePageRows = Object.entries(liveByPage).sort((a, b) => b[1] - a[1]);

  const displayedVisits =
    filterMode === 'live' ? liveVisits : filterMode === 'today' ? todayVisits : visits;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-neutral-700 hover:text-[#F26522] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          হোমে ফিরুন
        </button>

        <div className="text-xs font-mono-num text-neutral-500">
          আজকের তারিখ: {formatBanglaDate(todayId)}
        </div>
      </div>

      {/* হেডার কার্ড */}
      <section className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#0B0B0D] text-[#F26522] flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-neutral-900">ভিজিটর ও লাইভ ভিউ অ্যানালিটিক্স</h2>
            <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
              এই মুহূর্তে কতজন পোর্টালটি দেখছেন, আজকের ভিজিটর এবং সর্বমোট ভিউয়ের রিয়েল-টাইম হিসাব
            </p>
          </div>
        </div>

        {canEdit && (
          <div className="bg-[#0B0B0D] text-white rounded-xl px-4 py-2.5 flex items-center gap-3 shrink-0 border border-[#F26522]/40">
            <Activity className="w-4 h-4 text-[#F26522]" />
            <div>
              <div className="text-[11px] text-neutral-400">এখন লাইভে দেখছেন</div>
              <div className="text-lg font-bold font-mono-num text-white leading-tight">
                {liveVisits.length} জন
              </div>
            </div>
          </div>
        )}
      </section>

      {!canEdit ? (
        <section className="bg-white border border-neutral-200 rounded-xl p-7 text-center shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200 text-[#F26522] flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-base font-bold text-neutral-900">
              ভিজিটর হিসাব শুধুমাত্র অ্যাডমিনের জন্য সংরক্ষিত
            </h3>
            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
              প্রতিটি ভিজিটর পোর্টাল ওপেন করলেই অটোমেটিক সিস্টেমে হিসাব যুক্ত হয়। এখন কতজন দেখছেন ও
              মোট ভিজিটর তালিকা দেখতে অ্যাডমিন হিসেবে লগইন করুন।
            </p>
          </div>
          <button
            type="button"
            disabled={authLoading}
            onClick={onAdminSignIn}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#F26522] hover:bg-[#DC5214] disabled:opacity-60 text-white text-sm font-semibold transition-colors"
          >
            <LogIn className="w-4 h-4" />
            {authLoading ? 'লগইন হচ্ছে...' : 'অ্যাডমিন লগইন করুন'}
          </button>
        </section>
      ) : (
        <>
          {/* ৪-কলাম সারসংক্ষেপ */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-[#0B0B0D] text-white border border-[#F26522]/40 rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs text-neutral-400">
                <span>এখন লাইভে</span>
                <Activity className="w-4 h-4 text-[#F26522]" />
              </div>
              <div className="text-2xl font-bold font-mono-num text-white mt-1.5">
                {liveVisits.length} জন
              </div>
              <div className="text-[11px] text-neutral-400 mt-1">গত ২ মিনিটে সক্রিয়</div>
            </div>

            <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs text-neutral-500">
                <span>আজকের ভিজিটর</span>
                <Users className="w-4 h-4 text-[#F26522]" />
              </div>
              <div className="text-2xl font-bold font-mono-num text-neutral-900 mt-1.5">
                {todayVisits.length} জন
              </div>
              <div className="text-[11px] text-neutral-500 mt-1">ইউনিক ব্রাউজার/ডিভাইস</div>
            </div>

            <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs text-neutral-500">
                <span>আজকের মোট ভিউ</span>
                <Eye className="w-4 h-4 text-[#0A2E6D]" />
              </div>
              <div className="text-2xl font-bold font-mono-num text-neutral-900 mt-1.5">
                {todayViewsTotal} বার
              </div>
              <div className="text-[11px] text-neutral-500 mt-1">ওপেন ও রিলোডসহ</div>
            </div>

            <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs text-neutral-500">
                <span>সর্বমোট রেকর্ড</span>
                <Eye className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold font-mono-num text-neutral-900 mt-1.5">
                {allTimeViewsTotal} ভিউ
              </div>
              <div className="text-[11px] font-mono-num text-neutral-500 mt-1">
                {visits.length}টি দৈনিক ভিজিট
              </div>
            </div>
          </section>

          {/* লাইভ সেকশন ও ডিভাইস বিশ্লেষণ */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-neutral-900">এখন কে কোন সেকশনে আছেন</h3>
                <span className="text-xs font-mono-num text-neutral-500">
                  মোট {liveVisits.length} জন
                </span>
              </div>

              {livePageRows.length === 0 ? (
                <p className="text-xs text-neutral-500 py-4 text-center">
                  এই মুহূর্তে অন্য কোনো লাইভ ভিজিটর শনাক্ত হয়নি
                </p>
              ) : (
                <div className="space-y-2">
                  {livePageRows.map(([pageTitle, count]) => (
                    <div
                      key={pageTitle}
                      className="flex items-center justify-between text-xs py-2 border-b border-neutral-100 last:border-b-0"
                    >
                      <span className="font-semibold text-neutral-800 truncate pr-3">
                        {pageTitle}
                      </span>
                      <span className="font-mono-num font-bold text-[#F26522] shrink-0">
                        {count} জন
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-neutral-900">ডিভাইস অনুযায়ী ব্যবহার</h3>
                <span className="text-xs font-mono-num text-neutral-500">
                  মোট {totalDeviceEntries}টি রেকর্ড
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-neutral-800">
                      <Smartphone className="w-3.5 h-3.5 text-[#F26522]" />
                      মোবাইল ফোন
                    </span>
                    <span className="font-mono-num font-bold text-neutral-900">
                      {mobileCount} ({mobilePercent}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#F26522] transition-all duration-300"
                      style={{ width: `${mobilePercent}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-neutral-800">
                      <Monitor className="w-3.5 h-3.5 text-[#0A2E6D]" />
                      ডেস্কটপ / ল্যাপটপ
                    </span>
                    <span className="font-mono-num font-bold text-neutral-900">
                      {desktopCount} ({totalDeviceEntries > 0 ? 100 - mobilePercent : 0}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0A2E6D] transition-all duration-300"
                      style={{
                        width: `${totalDeviceEntries > 0 ? 100 - mobilePercent : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ভিজিটর তালিকা */}
          <section className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-neutral-900">
                  সাম্প্রতিক ভিজিটর তালিকা
                </h3>
                <p className="text-xs text-neutral-500">
                  পরিচয় গোপন রেখে প্রতিটি ডিভাইসের ভিজিট সময় ও বর্তমান মেনু দেখানো হচ্ছে
                </p>
              </div>

              <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-lg border border-neutral-200">
                <button
                  type="button"
                  onClick={() => setFilterMode('live')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    filterMode === 'live'
                      ? 'bg-[#F26522] text-white'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  লাইভ ({liveVisits.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('today')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    filterMode === 'today'
                      ? 'bg-[#0B0B0D] text-white'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  আজকের ({todayVisits.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('all')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    filterMode === 'all'
                      ? 'bg-[#0B0B0D] text-white'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  সব ({visits.length})
                </button>
              </div>
            </div>

            {displayedVisits.length === 0 ? (
              <div className="py-10 text-center text-xs sm:text-sm text-neutral-500 border border-dashed border-neutral-200 rounded-xl">
                এই ফিল্টারে এখনো কোনো ভিজিটর রেকর্ড নেই
              </div>
            ) : (
              <div className="divide-y divide-neutral-100 border border-neutral-200 rounded-xl overflow-hidden">
                {displayedVisits.map((visit) => {
                  const status = formatRelativeSeenBn(visit.lastSeenAtMs, nowMs);
                  const shortCode = visit.visitorToken.slice(-6).toUpperCase();
                  return (
                    <div
                      key={visit.id}
                      className="px-4 py-3 flex flex-wrap items-center justify-between gap-3 hover:bg-neutral-50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                            status.isLive
                              ? 'bg-orange-50 border border-orange-200 text-[#F26522]'
                              : 'bg-neutral-100 border border-neutral-200 text-neutral-600'
                          }`}
                        >
                          {visit.deviceType === 'মোবাইল' ? (
                            <Smartphone className="w-4 h-4" />
                          ) : (
                            <Monitor className="w-4 h-4" />
                          )}
                        </span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-bold text-neutral-900">
                            <span className="font-mono-num">ভিজিটর #{shortCode}</span>
                            <span aria-hidden="true" className="text-neutral-300">
                              ·
                            </span>
                            <span
                              className={
                                status.isLive ? 'text-[#F26522] font-semibold' : 'text-neutral-500 font-medium'
                              }
                            >
                              {status.label}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 mt-0.5">
                            <span>দেখছেন: {getPageLabelBn(visit.activePage)}</span>
                            <span aria-hidden="true">·</span>
                            <span>{visit.deviceType}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono-num">{visit.dateId}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-mono-num font-bold text-neutral-800">
                          {visit.viewsCount} বার দেখা
                        </span>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(visit.id)}
                          aria-label="ভিজিট রেকর্ড মুছুন"
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}

      <ConfirmModal
        open={confirmDeleteId !== null}
        title="ভিজিট রেকর্ড মুছে ফেলবেন?"
        message="এই ভিজিটরের সেশন রেকর্ডটি স্থায়ীভাবে মুছে যাবে।"
        confirmLabel="হ্যাঁ, মুছে ফেলুন"
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={() => {
          if (confirmDeleteId) {
            void onDeleteVisit(confirmDeleteId);
          }
          setConfirmDeleteId(null);
        }}
      />
    </div>
  );
};
