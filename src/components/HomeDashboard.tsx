import React from 'react';
import { Boxes, ChevronRight, FileText, MessageSquarePlus, Receipt, Users } from 'lucide-react';
import { DayReportData, InventoryItem, MenuItemConfig, PageId } from '../types/report';
import {
  BASIC_TASKS,
  MENU_ITEMS,
  PROFILE_INFO,
  SUPPLY_ITEMS,
  TOTAL_DESKS,
  countBasicWorkProgress,
  countDeskProgress,
  formatBanglaDate,
  getTotalBreakMinutes,
  getTotalExpenseAmount,
} from '../data/portalData';
import { Avatar } from './Avatar';

interface HomeDashboardProps {
  currentDate: string;
  dayData: DayReportData;
  inventoryItems: InventoryItem[];
  profilePhoto: string | null;
  canEdit: boolean;
  unreadFeedbackCount: number;
  liveViewerCount: number;
  todayVisitorCount: number;
  sectionIcons: Record<MenuItemConfig['id'], React.ReactNode>;
  onNavigate: (page: PageId) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  currentDate,
  dayData,
  inventoryItems,
  profilePhoto,
  canEdit,
  unreadFeedbackCount,
  liveViewerCount,
  todayVisitorCount,
  sectionIcons,
  onNavigate,
}) => {
  const basicProgress = countBasicWorkProgress(dayData);
  const deskProgress = countDeskProgress(dayData);
  const breakMinutes = getTotalBreakMinutes(dayData);
  const suppliesDone = SUPPLY_ITEMS.filter((s) => Boolean(dayData.supplies[s.id])).length;
  const totalExpenses = getTotalExpenseAmount(dayData);

  const basicPercent =
    basicProgress.total > 0
      ? Math.round((basicProgress.done / basicProgress.total) * 100)
      : 0;
  const deskPercent =
    TOTAL_DESKS > 0 ? Math.round((deskProgress.bothDone / TOTAL_DESKS) * 100) : 0;

  const overallTotalUnits = BASIC_TASKS.length + TOTAL_DESKS + SUPPLY_ITEMS.length;
  const basicDefaultDone = BASIC_TASKS.filter((t) => Boolean(dayData.basicTasks[t.id]?.done)).length;
  const overallDoneUnits = basicDefaultDone + deskProgress.bothDone + suppliesDone;
  const overallPercent =
    overallTotalUnits > 0 ? Math.round((overallDoneUnits / overallTotalUnits) * 100) : 0;

  const getMetricValue = (id: MenuItemConfig['id']): string => {
    switch (id) {
      case 'personal-info':
        return `ID ${PROFILE_INFO.employeeId}`;
      case 'basic-work':
        return `${basicProgress.done}/${basicProgress.total} সম্পন্ন`;
      case 'duty-location':
        return dayData.dutyStatus || 'নির্ধারিত নয়';
      case 'desk-chair':
        return `${deskProgress.bothDone}/${TOTAL_DESKS}টি সম্পন্ন`;
      case 'break-time':
        return breakMinutes > 0 ? `মোট ${breakMinutes} মিনিট` : 'কোনো বিরতি নেই';
      case 'attendance-time':
        return dayData.inTime || dayData.outTime
          ? `${dayData.inTime || '--:--'} – ${dayData.outTime || '--:--'}`
          : 'সময় সেট করা হয়নি';
      case 'office-commute':
        return dayData.commutes.length > 0 ? `${dayData.commutes.length}টি যাতায়াত` : 'রেকর্ড নেই';
      case 'extra-work':
        return dayData.extraBasicTasks.length > 0
          ? `${dayData.extraBasicTasks.length}টি কাজ`
          : 'অতিরিক্ত কাজ নেই';
      case 'supplies-refill':
        return `${suppliesDone}/${SUPPLY_ITEMS.length}টি রিফিল`;
      case 'closing-report':
        return 'রিপোর্ট ও ডাউনলোড';
      case 'notes-issues':
        return dayData.notes.trim() ? 'নোট যুক্ত আছে' : 'কোনো নোট নেই';
      case 'work-proof':
        return dayData.proofs.length > 0 ? `${dayData.proofs.length}টি ছবি` : 'ছবি যুক্ত নেই';
      case 'office-expenses':
        return dayData.expenses.length > 0
          ? `৳${totalExpenses} (${dayData.expenses.length}টি)`
          : 'কোনো খরচ নেই';
      case 'stock-inventory':
        return inventoryItems.length > 0 ? `${inventoryItems.length}টি জিনিস মজুত` : 'তালিকা খালি';
      case 'feedback':
        return canEdit && unreadFeedbackCount > 0
          ? `${unreadFeedbackCount}টি নতুন বার্তা`
          : 'গোপনীয় বার্তা পাঠান';
      case 'visitor-analytics':
        return canEdit
          ? `লাইভ ${liveViewerCount} জন · আজ ${todayVisitorCount} জন`
          : 'অ্যাডমিন ভিউ';
    }
  };

  const getProgressRatio = (id: MenuItemConfig['id']): number | null => {
    if (id === 'basic-work') return basicPercent;
    if (id === 'desk-chair') return deskPercent;
    if (id === 'supplies-refill') {
      return SUPPLY_ITEMS.length > 0
        ? Math.round((suppliesDone / SUPPLY_ITEMS.length) * 100)
        : 0;
    }
    return null;
  };

  const primaryGroup = MENU_ITEMS.slice(0, 6);
  const secondaryGroup = MENU_ITEMS.slice(6, 12);
  const expenseItem = MENU_ITEMS[12];
  const inventoryItem = MENU_ITEMS[13];
  const feedbackItem = MENU_ITEMS[14];
  const visitorAnalyticsItem = MENU_ITEMS[15];

  const renderMenuCard = (item: MenuItemConfig, indexNumber: number) => {
    const ratio = getProgressRatio(item.id);
    const metricText = getMetricValue(item.id);

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => onNavigate(item.id)}
        className="bg-white border border-neutral-200 hover:border-[#F26522] shadow-xs hover:shadow-md rounded-xl p-4 flex flex-col justify-between gap-3.5 text-left transition-all group"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <span className="w-9 h-9 rounded-lg bg-neutral-100 border border-neutral-200 group-hover:bg-orange-50 group-hover:border-[#F26522]/40 text-neutral-700 group-hover:text-[#F26522] flex items-center justify-center shrink-0 transition-colors mt-0.5">
              {sectionIcons[item.id]}
            </span>
            <div className="min-w-0">
              <div className="text-xs font-mono-num font-semibold text-neutral-400">
                {String(indexNumber).padStart(2, '0')}.
              </div>
              <div className="font-bold text-neutral-900 text-sm sm:text-base group-hover:text-[#F26522] transition-colors leading-snug">
                {item.title}
              </div>
              <div className="text-xs text-neutral-500 mt-0.5 line-clamp-1">{item.subtitle}</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-[#F26522] shrink-0 mt-1 transition-colors" />
        </div>

        <div className="space-y-1.5 pt-2 border-t border-neutral-100">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-semibold font-mono-num text-[#F26522] truncate">
              {metricText}
            </span>
            {ratio !== null && (
              <span className="font-mono-num text-neutral-500 font-semibold shrink-0">
                {ratio}%
              </span>
            )}
          </div>
          {ratio !== null && (
            <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#F26522] transition-all duration-300"
                style={{ width: `${ratio}%` }}
              />
            </div>
          )}
        </div>
      </button>
    );
  };

  return (
    <div className="space-y-7">
      {/* হিরো ওভারভিউ প্যানেল */}
      <section className="bg-gradient-to-r from-[#0B0B0D] via-[#14151B] to-[#0A2558] text-white rounded-2xl overflow-hidden border border-[#F26522]/30 shadow-lg">
        <div className="p-5 sm:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4 min-w-0">
            <button
              type="button"
              onClick={() => onNavigate('personal-info')}
              className="shrink-0 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F26522]"
              title="ব্যক্তিগত তথ্য দেখুন"
            >
              <Avatar
                src={profilePhoto}
                alt={PROFILE_INFO.displayNameEn}
                sizeClass="w-16 h-16 sm:w-18 sm:h-18"
                roundedClass="rounded-xl"
              />
            </button>
            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-300">
                <span className="font-semibold text-[#F26522]">{PROFILE_INFO.department}</span>
                <span aria-hidden="true">·</span>
                <span>দৈনিক অপারেশনস পোর্টাল</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono-num text-neutral-300">
                  {formatBanglaDate(currentDate)}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight text-balance">
                দৈনিক কাজের রিপোর্ট ও কার্যক্রম
              </h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-neutral-300">
                <span className="font-semibold text-white">{PROFILE_INFO.displayNameBn}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono-num">ID: {PROFILE_INFO.employeeId}</span>
                <span aria-hidden="true">·</span>
                <span>কর্মস্থল: {PROFILE_INFO.workplace}</span>
                <span aria-hidden="true">·</span>
                <span>ডিউটি: {PROFILE_INFO.shiftLabel}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 shrink-0">
            <div className="text-left sm:text-right">
              <div className="text-xs text-neutral-400">আজকের সার্বিক অগ্রগতি</div>
              <div className="text-2xl font-bold font-mono-num text-white">
                {overallPercent}%
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('closing-report')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#F26522] hover:bg-[#DC5214] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              <FileText className="w-4 h-4" />
              সমাপ্তি রিপোর্ট
            </button>
          </div>
        </div>

        {/* ৪-কলাম লাইভ মেট্রিক বার */}
        <div className="border-t border-white/10 bg-black/45 grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-white/10">
          <button
            type="button"
            onClick={() => onNavigate('duty-location')}
            className="px-5 py-4 text-left hover:bg-white/5 transition-colors"
          >
            <div className="text-xs text-neutral-400">ডিউটি লোকেশন</div>
            <div className="text-base sm:text-lg font-bold text-white mt-0.5">
              {dayData.dutyStatus || 'নির্ধারিত নয়'}
            </div>
            <div className="text-[11px] text-neutral-400 mt-1">পরিবর্তন করতে ক্লিক করুন</div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('basic-work')}
            className="px-5 py-4 text-left hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center justify-between gap-2 text-xs text-neutral-400">
              <span>বেসিক কাজ</span>
              <span className="font-mono-num text-emerald-400 font-semibold">{basicPercent}%</span>
            </div>
            <div className="text-base sm:text-lg font-bold font-mono-num text-white mt-0.5">
              {basicProgress.done}/{basicProgress.total}
            </div>
            <div className="w-full h-1 bg-white/15 rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-emerald-400 transition-all duration-300"
                style={{ width: `${basicPercent}%` }}
              />
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('desk-chair')}
            className="px-5 py-4 text-left hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center justify-between gap-2 text-xs text-neutral-400">
              <span>ডেস্ক ও চেয়ার</span>
              <span className="font-mono-num text-[#F26522] font-semibold">{deskPercent}%</span>
            </div>
            <div className="text-base sm:text-lg font-bold font-mono-num text-white mt-0.5">
              {deskProgress.bothDone}/{TOTAL_DESKS}
            </div>
            <div className="w-full h-1 bg-white/15 rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-[#F26522] transition-all duration-300"
                style={{ width: `${deskPercent}%` }}
              />
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('attendance-time')}
            className="px-5 py-4 text-left hover:bg-white/5 transition-colors"
          >
            <div className="text-xs text-neutral-400">হাজিরা ও বিরতি</div>
            <div className="text-base sm:text-lg font-bold font-mono-num text-white mt-0.5">
              {dayData.inTime || '--:--'} – {dayData.outTime || '--:--'}
            </div>
            <div className="text-[11px] font-mono-num text-neutral-400 mt-1">
              মোট বিরতি: {breakMinutes} মিনিট · প্রমাণ: {dayData.proofs.length}টি
            </div>
          </button>
        </div>
      </section>

      {/* বিভাগ ১: প্রতিদিনের মূল কার্যক্রম (১–৬) */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-neutral-900">প্রতিদিনের মূল কার্যক্রম</h2>
            <p className="text-xs text-neutral-500">
              পরিচিতি, বেসিক কাজ, ডিউটি অবস্থান, ডেস্ক ম্যাপ ও সময় হিসাব
            </p>
          </div>
          <span className="text-xs font-mono-num font-semibold text-neutral-500">সেকশন ০১ – ০৬</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {primaryGroup.map((item, idx) => renderMenuCard(item, idx + 1))}
        </div>
      </section>

      {/* বিভাগ ২: যাতায়াত, মালামাল ও রিপোর্ট (৭–১২) */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-neutral-900">যাতায়াত, মালামাল ও রিপোর্ট</h2>
            <p className="text-xs text-neutral-500">
              অফিস যাতায়াত, অতিরিক্ত দায়িত্ব, রিফিল চেকলিস্ট, নোট ও কাজের প্রমাণ
            </p>
          </div>
          <span className="text-xs font-mono-num font-semibold text-neutral-500">সেকশন ০৭ – ১২</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {secondaryGroup.map((item, idx) => renderMenuCard(item, idx + 7))}
        </div>
      </section>

      {/* বিভাগ ৩: অফিসের খরচ ও মালামাল স্টক (১৩ ও ১৪) */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-neutral-900">অফিস খরচ ও স্টক মজুত</h2>
            <p className="text-xs text-neutral-500">
              দৈনিক খরচের হিসাব এবং কোন জিনিস কত পিস বা কত লিটার মজুত আছে তার তালিকা
            </p>
          </div>
          <span className="text-xs font-mono-num font-semibold text-neutral-500">সেকশন ১৩ – ১৪</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {expenseItem && (
            <button
              type="button"
              onClick={() => onNavigate(expenseItem.id)}
              className="bg-white border border-neutral-200 hover:border-emerald-500 shadow-xs hover:shadow-md rounded-xl p-5 flex items-center justify-between gap-4 text-left transition-all group"
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <span className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                  <Receipt className="w-5 h-5" />
                </span>
                <div className="min-w-0 space-y-0.5">
                  <div className="text-xs font-mono-num font-semibold text-emerald-600">
                    ১৩. {getMetricValue(expenseItem.id)}
                  </div>
                  <div className="text-base font-bold text-neutral-900 group-hover:text-emerald-700 transition-colors">
                    {expenseItem.title}
                  </div>
                  <div className="text-xs text-neutral-500">
                    চা-নাস্তা, যাতায়াত বা অফিস সরঞ্জাম ক্রয়ের হিসাব
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-emerald-600 shrink-0 transition-colors" />
            </button>
          )}

          {inventoryItem && (
            <button
              type="button"
              onClick={() => onNavigate(inventoryItem.id)}
              className="bg-white border border-neutral-200 hover:border-[#F26522] shadow-xs hover:shadow-md rounded-xl p-5 flex items-center justify-between gap-4 text-left transition-all group"
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <span className="w-11 h-11 rounded-xl bg-orange-50 border border-orange-200 text-[#F26522] group-hover:bg-[#F26522] group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                  <Boxes className="w-5 h-5" />
                </span>
                <div className="min-w-0 space-y-0.5">
                  <div className="text-xs font-mono-num font-semibold text-[#F26522]">
                    ১৪. {getMetricValue(inventoryItem.id)}
                  </div>
                  <div className="text-base font-bold text-neutral-900 group-hover:text-[#F26522] transition-colors">
                    {inventoryItem.title}
                  </div>
                  <div className="text-xs text-neutral-500">{inventoryItem.subtitle}</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-[#F26522] shrink-0 transition-colors" />
            </button>
          )}
        </div>
      </section>

      {/* বিভাগ ৪: মতামত, পরামর্শ ও (অ্যাডমিনের জন্য) ভিজিটর হিসাব */}
      {(feedbackItem || (canEdit && visitorAnalyticsItem)) && (
        <section
          className={`grid grid-cols-1 gap-3.5 ${
            canEdit && visitorAnalyticsItem ? 'md:grid-cols-2' : ''
          }`}
        >
          {feedbackItem && (
            <button
              type="button"
              onClick={() => onNavigate(feedbackItem.id)}
              className="bg-white border border-neutral-200 hover:border-[#0A2E6D] shadow-xs hover:shadow-md rounded-xl p-5 flex items-center justify-between gap-4 text-left transition-all group"
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <span className="w-11 h-11 rounded-xl bg-[#0A2E6D]/10 border border-[#0A2E6D]/20 text-[#0A2E6D] group-hover:bg-[#0A2E6D] group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                  <MessageSquarePlus className="w-5 h-5" />
                </span>
                <div className="min-w-0 space-y-0.5">
                  <div className="text-xs font-mono-num font-semibold text-[#0A2E6D]">
                    ১৫. গোপনীয় ফিডব্যাক বক্স
                    {canEdit && unreadFeedbackCount > 0 ? ` · ${unreadFeedbackCount}টি নতুন বার্তা` : ''}
                  </div>
                  <div className="text-base font-bold text-neutral-900 group-hover:text-[#0A2E6D] transition-colors leading-snug">
                    {feedbackItem.title}
                  </div>
                  <div className="text-xs text-neutral-500">
                    আপনার মতামত, কাজের পরামর্শ বা অভিযোগ সরাসরি অ্যাডমিনকে পাঠান
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-[#0A2E6D] shrink-0 transition-colors" />
            </button>
          )}

          {canEdit && visitorAnalyticsItem && (
            <button
              type="button"
              onClick={() => onNavigate(visitorAnalyticsItem.id)}
              className="bg-[#0B0B0D] text-white border border-neutral-800 hover:border-[#F26522] shadow-xs hover:shadow-md rounded-xl p-5 flex items-center justify-between gap-4 text-left transition-all group"
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <span className="w-11 h-11 rounded-xl bg-[#F26522]/15 border border-[#F26522]/40 text-[#F26522] group-hover:bg-[#F26522] group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                  <Users className="w-5 h-5" />
                </span>
                <div className="min-w-0 space-y-0.5">
                  <div className="text-xs font-mono-num font-semibold text-[#F26522]">
                    ১৬. {getMetricValue(visitorAnalyticsItem.id)}
                  </div>
                  <div className="text-base font-bold text-white group-hover:text-[#F26522] transition-colors leading-snug">
                    {visitorAnalyticsItem.title}
                  </div>
                  <div className="text-xs text-neutral-400">
                    {visitorAnalyticsItem.subtitle}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-[#F26522] shrink-0 transition-colors" />
            </button>
          )}
        </section>
      )}
    </div>
  );
};
