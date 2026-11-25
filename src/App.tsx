import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Armchair,
  Bus,
  Camera,
  CheckSquare,
  Clock,
  Coffee,
  Eye,
  FileText,
  Home,
  IdCard,
  Lock,
  LogIn,
  LogOut,
  MapPin,
  Menu,
  MessageSquarePlus,
  Package,
  Receipt,
  Sparkles,
  X,
} from 'lucide-react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import {
  DayReportData,
  DutyStatus,
  FeedbackCategory,
  FeedbackEntry,
  FeedbackStatus,
  MenuItemConfig,
  OfficeExpenseEntry,
  PageId,
  WorkProofEntry,
} from './types/report';
import {
  MENU_ITEMS,
  PROFILE_INFO,
  TOTAL_DESKS,
  compressImageToDataUrl,
  countBasicWorkProgress,
  countDeskProgress,
  createEmptyDayData,
  formatBanglaDate,
  getDayData as getLocalDayData,
  getSupplyUsageStatuses,
  getTodayIsoDate,
  getTotalBreakMinutes,
  getTotalExpenseAmount,
} from './data/portalData';
import { auth, googleProvider, isOwnerAdmin } from './firebase';
import {
  CloudExpenseRecord,
  CloudProofRecord,
  addOfficeExpenseToCloud,
  addWorkProofToCloud,
  deleteFeedbackFromCloud,
  deleteOfficeExpenseFromCloud,
  deleteWorkProofFromCloud,
  saveDailyReportToCloud,
  saveProfilePhotoToCloud,
  submitFeedbackToCloud,
  subscribeToDailyReport,
  subscribeToFeedbackInbox,
  subscribeToProfilePhoto,
  updateFeedbackInCloud,
} from './services/reportSync';
import { Avatar } from './components/Avatar';
import { BasicWorkSection } from './components/BasicWorkSection';
import { DeskFloorMapSection } from './components/DeskFloorMapSection';
import { FeedbackSection } from './components/FeedbackSection';
import { HomeDashboard } from './components/HomeDashboard';
import { OfficeExpensesSection } from './components/OfficeExpensesSection';
import { OfflineIndicator, PWAInstallButton } from './components/PWAInstallControls';
import {
  AttendanceTimeSection,
  BreakTimeSection,
  ClosingReportSection,
  DutyLocationSection,
  EmergencyContactSection,
  ExtraWorkSection,
  NotesIssuesSection,
  OfficeCommuteSection,
  PersonalInfoSection,
  SuppliesRefillSection,
  WorkProofSection,
} from './components/WorkLogSections';

const SECTION_ICONS: Record<MenuItemConfig['id'], React.ReactNode> = {
  'personal-info': <IdCard className="w-4 h-4" />,
  'basic-work': <CheckSquare className="w-4 h-4" />,
  'duty-location': <MapPin className="w-4 h-4" />,
  'desk-chair': <Armchair className="w-4 h-4" />,
  'break-time': <Coffee className="w-4 h-4" />,
  'attendance-time': <Clock className="w-4 h-4" />,
  'office-commute': <Bus className="w-4 h-4" />,
  'extra-work': <Sparkles className="w-4 h-4" />,
  'supplies-refill': <Package className="w-4 h-4" />,
  'closing-report': <FileText className="w-4 h-4" />,
  'notes-issues': <AlertTriangle className="w-4 h-4" />,
  'work-proof': <Camera className="w-4 h-4" />,
  'office-expenses': <Receipt className="w-4 h-4" />,
  feedback: <MessageSquarePlus className="w-4 h-4" />,
};

export default function App() {
  const [currentDate, setCurrentDate] = useState<string>(() => getTodayIsoDate());
  const [reportDocData, setReportDocData] = useState<DayReportData>(() => createEmptyDayData());
  const [cloudProofs, setCloudProofs] = useState<CloudProofRecord[]>([]);
  const [cloudExpenses, setCloudExpenses] = useState<CloudExpenseRecord[]>([]);
  const [reportDocExists, setReportDocExists] = useState(false);
  const [loadingReport, setLoadingReport] = useState(true);

  const [activePage, setActivePage] = useState<PageId>('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [profileDocExists, setProfileDocExists] = useState(false);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [feedbackItems, setFeedbackItems] = useState<FeedbackEntry[]>([]);

  const reportDocExistsRef = useRef(false);
  reportDocExistsRef.current = reportDocExists;

  const latestReportRef = useRef<DayReportData>(reportDocData);
  latestReportRef.current = reportDocData;

  const notesDebounceRef = useRef<number | null>(null);

  const canEdit = authReady && isOwnerAdmin(currentUser);

  const dayData: DayReportData = {
    ...reportDocData,
    proofs: cloudProofs,
    expenses: cloudExpenses,
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToProfilePhoto((photo, exists) => {
      setProfilePhoto(photo);
      setProfileDocExists(exists);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setLoadingReport(true);
    const unsubscribe = subscribeToDailyReport(
      currentDate,
      (data, exists) => {
        setReportDocData(data);
        setReportDocExists(exists);
        setLoadingReport(false);
      },
      (proofs) => {
        setCloudProofs(proofs);
      },
      (expenses) => {
        setCloudExpenses(expenses);
      },
      () => {
        setLoadingReport(false);
      }
    );

    return () => {
      if (notesDebounceRef.current) {
        window.clearTimeout(notesDebounceRef.current);
      }
      unsubscribe();
    };
  }, [currentDate]);

  useEffect(() => {
    if (!canEdit) {
      setFeedbackItems([]);
      return;
    }
    const unsubscribe = subscribeToFeedbackInbox((items) => {
      setFeedbackItems(items);
    });
    return () => unsubscribe();
  }, [canEdit]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 2400);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  const handleAdminSignIn = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (isOwnerAdmin(result.user)) {
        showToast('অ্যাডমিন এডিট মোড চালু হয়েছে');
      } else {
        setAuthError(
          `আপনি ${result.user.email} দিয়ে লগইন করেছেন। এডিট করতে amshorif.vai5@gmail.com দিয়ে লগইন করুন।`
        );
        showToast('শুধুমাত্র amshorif.vai5@gmail.com এডিট করতে পারবেন');
      }
    } catch (error: unknown) {
      const code =
        typeof error === 'object' && error !== null && 'code' in error
          ? String((error as { code?: unknown }).code)
          : '';
      if (code === 'auth/unauthorized-domain') {
        setAuthError(
          `এই ডোমেইনটি (${window.location.hostname}) Firebase Authorized domains-এ যোগ করা নেই।`
        );
      } else if (code === 'auth/popup-blocked') {
        setAuthError('ব্রাউজার লগইন পপআপ ব্লক করেছে—পপআপ Allow করে আবার চেষ্টা করুন।');
      } else if (code === 'auth/popup-closed-by-user') {
        setAuthError('লগইন পপআপটি বন্ধ করা হয়েছে—পুনরায় চেষ্টা করুন।');
      } else {
        setAuthError('লগইন সম্পন্ন হয়নি। অনুগ্রহ করে আবার চেষ্টা করুন।');
      }
      showToast('লগইন সম্পন্ন হয়নি');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setAuthError(null);
    showToast('লগআউট সম্পন্ন হয়েছে');
  };

  const updateDayData = (
    updater: (prev: DayReportData) => DayReportData,
    options?: { debounce?: boolean }
  ) => {
    if (!canEdit || !currentUser) return;

    const next = updater(latestReportRef.current);
    latestReportRef.current = next;
    setReportDocData(next);

    const persist = () => {
      void saveDailyReportToCloud(
        currentDate,
        currentUser.uid,
        next,
        reportDocExistsRef.current
      ).then(() => {
        reportDocExistsRef.current = true;
        setReportDocExists(true);
      });
    };

    if (options?.debounce) {
      if (notesDebounceRef.current) {
        window.clearTimeout(notesDebounceRef.current);
      }
      notesDebounceRef.current = window.setTimeout(persist, 350);
    } else {
      persist();
    }
  };

  const handleCopy = (text: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    showToast('কপি করা হয়েছে');
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canEdit || !currentUser) return;
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageToDataUrl(file, 480, 0.8, 300000);
      setProfilePhoto(compressed);
      await saveProfilePhotoToCloud(currentUser.uid, compressed, profileDocExists);
      setProfileDocExists(true);
      showToast('প্রোফাইল ছবি আপডেট হয়েছে');
    } catch {
      showToast('ছবি আপলোড করা যায়নি');
    }
  };

  const handleApplyDefaultShift = () => {
    if (!canEdit) return;
    updateDayData((prev) => ({
      ...prev,
      inTime: '09:00',
      outTime: '19:00',
    }));
    showToast('09:00 – 19:00 সেট হয়েছে');
  };

  const handleSelectDutyStatus = (status: Exclude<DutyStatus, ''>) => {
    if (!canEdit) return;
    updateDayData((prev) => ({
      ...prev,
      dutyStatus: prev.dutyStatus === status ? '' : status,
    }));
  };

  const handleAddProof = async (proof: WorkProofEntry) => {
    if (!canEdit || !currentUser) return;
    await addWorkProofToCloud(
      currentDate,
      currentUser.uid,
      reportDocExistsRef.current,
      latestReportRef.current,
      proof
    );
    reportDocExistsRef.current = true;
    setReportDocExists(true);
    showToast('কাজের প্রমাণ যুক্ত হয়েছে');
  };

  const handleDeleteProof = async (proofId: string) => {
    if (!canEdit) return;
    await deleteWorkProofFromCloud(currentDate, proofId);
    showToast('কাজের প্রমাণ মুছে ফেলা হয়েছে');
  };

  const handleAddExpense = async (expense: OfficeExpenseEntry) => {
    if (!canEdit || !currentUser) return;
    await addOfficeExpenseToCloud(
      currentDate,
      currentUser.uid,
      reportDocExistsRef.current,
      latestReportRef.current,
      expense
    );
    reportDocExistsRef.current = true;
    setReportDocExists(true);
    showToast('অফিসের খরচ যুক্ত হয়েছে');
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!canEdit) return;
    await deleteOfficeExpenseFromCloud(currentDate, expenseId);
    showToast('খরচের এন্ট্রি মুছে ফেলা হয়েছে');
  };

  const handleSyncLocalDraft = () => {
    if (!canEdit || !currentUser) return;
    const localDraft = getLocalDayData(currentDate);
    updateDayData(() => localDraft);
    showToast('আগের সংরক্ষিত তথ্য ক্লাউডে আপলোড হয়েছে');
  };

  const handleSubmitFeedback = async (payload: {
    category: FeedbackCategory;
    senderName: string;
    message: string;
  }) => {
    await submitFeedbackToCloud(payload);
    showToast(
      payload.category === 'অভিযোগ'
        ? 'আমি আন্তরিকভাবে দুঃখিত — আপনার অভিযোগটি গ্রহণ করা হয়েছে'
        : payload.category === 'পরামর্শ'
        ? 'আপনার পরামর্শের জন্য আন্তরিক ধন্যবাদ'
        : 'আপনার মতামতের জন্য আন্তরিক ধন্যবাদ'
    );
  };

  const handleUpdateFeedback = async (
    feedbackId: string,
    updates: { status: FeedbackStatus; adminNote: string }
  ) => {
    if (!canEdit) return;
    await updateFeedbackInCloud(feedbackId, updates);
    showToast('স্ট্যাটাস ও নোট আপডেট হয়েছে');
  };

  const handleDeleteFeedback = async (feedbackId: string) => {
    if (!canEdit) return;
    await deleteFeedbackFromCloud(feedbackId);
    showToast('বার্তাটি মুছে ফেলা হয়েছে');
  };

  const hasLocalDraft = (() => {
    if (!canEdit || reportDocExists) return false;
    const local = getLocalDayData(currentDate);
    return Boolean(
      local.inTime ||
        local.outTime ||
        local.dutyStatus ||
        Object.keys(local.basicTasks).length > 0 ||
        Object.keys(local.desks).length > 0 ||
        local.notes
    );
  })();

  const navigateTo = (page: PageId) => {
    setActivePage(page);
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const basicProgress = countBasicWorkProgress(dayData);
  const deskProgress = countDeskProgress(dayData);
  const breakMinutes = getTotalBreakMinutes(dayData);

  const unreadFeedbackCount = feedbackItems.filter((item) => item.status === 'নতুন').length;
  const usedSupplyItems = getSupplyUsageStatuses(dayData).filter(
    (s) => !s.isRefilled && s.usedPercent > 0
  );
  const maxSupplyUsed =
    usedSupplyItems.length > 0
      ? Math.max(...usedSupplyItems.map((s) => s.usedPercent))
      : 0;
  const totalExpenses = getTotalExpenseAmount(dayData);

  const getSectionBadgeText = (id: MenuItemConfig['id']): string | null => {
    switch (id) {
      case 'personal-info':
        return `ID ${PROFILE_INFO.employeeId}`;
      case 'basic-work':
        return `${basicProgress.done}/${basicProgress.total}`;
      case 'duty-location':
        return dayData.dutyStatus || null;
      case 'desk-chair':
        return `${deskProgress.bothDone}/${TOTAL_DESKS}`;
      case 'break-time':
        return breakMinutes > 0 ? `${breakMinutes} মি.` : null;
      case 'extra-work':
        return dayData.extraBasicTasks.length > 0
          ? `${dayData.extraBasicTasks.length}টি`
          : null;
      case 'supplies-refill':
        return maxSupplyUsed > 0 ? `${maxSupplyUsed}% শেষ` : null;
      case 'work-proof':
        return dayData.proofs.length > 0 ? `${dayData.proofs.length} ফটো` : null;
      case 'office-expenses':
        return totalExpenses > 0 ? `৳${totalExpenses}` : null;
      case 'feedback':
        return canEdit && unreadFeedbackCount > 0 ? `${unreadFeedbackCount} নতুন` : null;
      default:
        return null;
    }
  };

  const activeTitle =
    activePage === 'home'
      ? 'হোম ড্যাশবোর্ড'
      : activePage === 'emergency-contact'
      ? 'জরুরি যোগাযোগ'
      : MENU_ITEMS.find((m) => m.id === activePage)?.title || 'ড্যাশবোর্ড';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* মোবাইল সাইডবার ওভারলে */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-950/50 z-40 lg:hidden"
        />
      )}

      {/* বাম পাশের সাইডবার নেভিগেশন */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-slate-900 text-slate-100 z-50 border-r border-slate-800 flex flex-col shrink-0 transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            {canEdit ? (
              <>
                <label
                  htmlFor="sidebarPhotoUpload"
                  className="relative cursor-pointer shrink-0 group"
                  title="ছবি পরিবর্তন করুন"
                >
                  <Avatar
                    src={profilePhoto}
                    alt={PROFILE_INFO.displayNameEn}
                    sizeClass="w-10 h-10"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center border border-slate-900">
                    <Camera className="w-2.5 h-2.5" />
                  </span>
                </label>
                <input
                  id="sidebarPhotoUpload"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </>
            ) : (
              <Avatar
                src={profilePhoto}
                alt={PROFILE_INFO.displayNameEn}
                sizeClass="w-10 h-10"
              />
            )}

            <div className="min-w-0">
              <div className="font-bold text-sm text-white truncate">
                {PROFILE_INFO.displayNameEn}
              </div>
              <div className="text-xs text-slate-400 truncate font-mono-num">
                {PROFILE_INFO.roleTitle} · ID {PROFILE_INFO.employeeId}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="মেনু বন্ধ করুন"
            className="lg:hidden text-slate-400 hover:text-white p-1.5 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          <button
            type="button"
            onClick={() => navigateTo('home')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm font-semibold transition-colors ${
              activePage === 'home'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Home className="w-4 h-4 shrink-0" />
            <span className="truncate">হোম ড্যাশবোর্ড</span>
          </button>

          <div className="border-t border-slate-800 my-2.5" />

          {MENU_ITEMS.map((item, idx) => {
            const isActive =
              activePage === item.id ||
              (activePage === 'emergency-contact' && item.id === 'personal-info');
            const badge = getSectionBadgeText(item.id);
            return (
              <button
                key={item.id}
                type="button"
                title={item.title}
                onClick={() => navigateTo(item.id)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white font-medium'
                }`}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <span className="text-slate-400 shrink-0">{SECTION_ICONS[item.id]}</span>
                  <span className="truncate">
                    <span className="font-mono-num text-xs text-slate-500 mr-1">
                      {idx + 1}.
                    </span>
                    {item.title}
                  </span>
                </span>
                {badge && (
                  <span className="text-[11px] font-mono-num text-slate-400 shrink-0">
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* সাইডবার ফুটার: অ্যাপ ইনস্টল ও অ্যাডমিন লগইন */}
        <div className="p-3 border-t border-slate-800 space-y-2">
          <PWAInstallButton variant="sidebar" />
          {currentUser ? (
            <div className="space-y-2">
              <div className="px-2.5 py-2 rounded-lg bg-slate-800/70 text-xs">
                <div className="font-semibold text-white truncate">
                  {canEdit ? 'অ্যাডমিন (এডিট চালু)' : 'শুধুমাত্র দেখার মোড'}
                </div>
                <div className="text-[11px] text-slate-400 truncate mt-0.5">
                  {currentUser.email}
                </div>
              </div>
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                লগআউট
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={authLoading || !authReady}
              onClick={() => void handleAdminSignIn()}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-semibold transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              {authLoading ? 'লগইন হচ্ছে...' : 'অ্যাডমিন লগইন (এডিট)'}
            </button>
          )}
        </div>
      </aside>

      {/* ডান পাশের মূল কন্টেন্ট এলাকা */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* টপ বার */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 py-3">
          <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                aria-label="মেনু খুলুন"
                className="lg:hidden p-2 -ml-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <div className="text-sm font-bold text-slate-900 truncate whitespace-nowrap">
                  দৈনিক কাজের রিপোর্ট · {activeTitle}
                </div>
                <div className="text-xs text-slate-500 truncate">
                  {formatBanglaDate(currentDate)} ·{' '}
                  {canEdit ? 'অ্যাডমিন এডিট মোড' : 'শুধুমাত্র দেখার মোড'}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                <span className="text-xs font-semibold text-emerald-700">In</span>
                {canEdit ? (
                  <input
                    type="time"
                    value={dayData.inTime}
                    onChange={(e) =>
                      updateDayData((prev) => ({ ...prev, inTime: e.target.value }))
                    }
                    aria-label="In Time"
                    className="bg-transparent text-xs font-mono-num font-bold text-slate-900 focus:outline-none"
                  />
                ) : (
                  <span className="text-xs font-mono-num font-bold text-slate-900">
                    {dayData.inTime || '--:--'}
                  </span>
                )}
                <span className="text-slate-300">|</span>
                <span className="text-xs font-semibold text-amber-700">Out</span>
                {canEdit ? (
                  <input
                    type="time"
                    value={dayData.outTime}
                    onChange={(e) =>
                      updateDayData((prev) => ({ ...prev, outTime: e.target.value }))
                    }
                    aria-label="Out Time"
                    className="bg-transparent text-xs font-mono-num font-bold text-slate-900 focus:outline-none"
                  />
                ) : (
                  <span className="text-xs font-mono-num font-bold text-slate-900">
                    {dayData.outTime || '--:--'}
                  </span>
                )}
              </div>

              <input
                type="date"
                value={currentDate}
                onChange={(e) => {
                  if (e.target.value) setCurrentDate(e.target.value);
                }}
                aria-label="তারিখ নির্বাচন"
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono-num font-semibold text-slate-800 focus:outline-none focus:border-indigo-600"
              />

              <PWAInstallButton variant="header" />

              <button
                type="button"
                onClick={() => navigateTo('closing-report')}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                রিপোর্ট দেখুন
              </button>
            </div>
          </div>
        </header>

        {/* মূল ভিউপোর্ট */}
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 space-y-4">
          {!canEdit && (
            <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-700">
                  {currentUser ? (
                    <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                  ) : (
                    <Eye className="w-4 h-4 text-indigo-600 shrink-0" />
                  )}
                  <span>
                    {currentUser
                      ? `শুধুমাত্র দেখার মোড — আপনি (${currentUser.email}) এডিট করতে পারবেন না।`
                      : 'আপনি দেখার মোডে আছেন · শুধুমাত্র অ্যাডমিন তথ্য এডিট করতে পারবেন।'}
                  </span>
                </div>
                <button
                  type="button"
                  disabled={authLoading || !authReady}
                  onClick={() => void handleAdminSignIn()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  {currentUser ? 'অন্য অ্যাকাউন্টে লগইন' : 'অ্যাডমিন লগইন'}
                </button>
              </div>
              {authError && (
                <div className="text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                  {authError}
                </div>
              )}
            </div>
          )}

          {hasLocalDraft && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs sm:text-sm font-medium text-indigo-900">
                এই তারিখের জন্য ব্রাউজারে আগে সেভ করা তথ্য পাওয়া গেছে। ক্লাউডে আপলোড করতে চান?
              </span>
              <button
                type="button"
                onClick={handleSyncLocalDraft}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                ক্লাউডে সিঙ্ক করুন
              </button>
            </div>
          )}

          {loadingReport ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-500">
              রিপোর্ট লোড হচ্ছে...
            </div>
          ) : (
            <>
              {activePage === 'home' && (
                <HomeDashboard
                  currentDate={currentDate}
                  dayData={dayData}
                  profilePhoto={profilePhoto}
                  canEdit={canEdit}
                  unreadFeedbackCount={unreadFeedbackCount}
                  sectionIcons={SECTION_ICONS}
                  onNavigate={navigateTo}
                />
              )}

              {activePage === 'personal-info' && (
                <PersonalInfoSection
                  profilePhoto={profilePhoto}
                  canEdit={canEdit}
                  onBack={() => navigateTo('home')}
                  onNavigate={navigateTo}
                  onApplyDefaultShift={handleApplyDefaultShift}
                />
              )}

              {activePage === 'emergency-contact' && (
                <EmergencyContactSection
                  onBack={() => navigateTo('personal-info')}
                  onCopy={handleCopy}
                />
              )}

              {activePage === 'basic-work' && (
                <BasicWorkSection
                  data={dayData}
                  canEdit={canEdit}
                  onUpdate={updateDayData}
                  onBack={() => navigateTo('home')}
                />
              )}

              {activePage === 'duty-location' && (
                <DutyLocationSection
                  dutyStatus={dayData.dutyStatus}
                  canEdit={canEdit}
                  onSelect={handleSelectDutyStatus}
                  onBack={() => navigateTo('home')}
                />
              )}

              {activePage === 'desk-chair' && (
                <DeskFloorMapSection
                  data={dayData}
                  canEdit={canEdit}
                  onUpdate={updateDayData}
                  onBack={() => navigateTo('home')}
                />
              )}

              {activePage === 'break-time' && (
                <BreakTimeSection
                  data={dayData}
                  canEdit={canEdit}
                  onUpdate={updateDayData}
                  onBack={() => navigateTo('home')}
                />
              )}

              {activePage === 'attendance-time' && (
                <AttendanceTimeSection
                  data={dayData}
                  canEdit={canEdit}
                  onApplyDefaultShift={handleApplyDefaultShift}
                  onBack={() => navigateTo('home')}
                />
              )}

              {activePage === 'office-commute' && (
                <OfficeCommuteSection
                  data={dayData}
                  canEdit={canEdit}
                  onUpdate={updateDayData}
                  onBack={() => navigateTo('home')}
                />
              )}

              {activePage === 'extra-work' && (
                <ExtraWorkSection
                  data={dayData}
                  canEdit={canEdit}
                  onUpdate={updateDayData}
                  onBack={() => navigateTo('home')}
                />
              )}

              {activePage === 'supplies-refill' && (
                <SuppliesRefillSection
                  data={dayData}
                  canEdit={canEdit}
                  onUpdate={updateDayData}
                  onBack={() => navigateTo('home')}
                />
              )}

              {activePage === 'closing-report' && (
                <ClosingReportSection
                  dateStr={currentDate}
                  data={dayData}
                  onCopy={handleCopy}
                  onBack={() => navigateTo('home')}
                />
              )}

              {activePage === 'notes-issues' && (
                <NotesIssuesSection
                  notes={dayData.notes}
                  canEdit={canEdit}
                  onChange={(notes) =>
                    updateDayData((prev) => ({ ...prev, notes }), { debounce: true })
                  }
                  onBack={() => navigateTo('home')}
                />
              )}

              {activePage === 'work-proof' && (
                <WorkProofSection
                  data={dayData}
                  canEdit={canEdit}
                  onAddProof={handleAddProof}
                  onDeleteProof={handleDeleteProof}
                  onBack={() => navigateTo('home')}
                />
              )}

              {activePage === 'office-expenses' && (
                <OfficeExpensesSection
                  data={dayData}
                  canEdit={canEdit}
                  onAddExpense={handleAddExpense}
                  onDeleteExpense={handleDeleteExpense}
                  onBack={() => navigateTo('home')}
                />
              )}

              {activePage === 'feedback' && (
                <FeedbackSection
                  canEdit={canEdit}
                  inboxItems={feedbackItems}
                  onSubmitFeedback={handleSubmitFeedback}
                  onUpdateFeedback={handleUpdateFeedback}
                  onDeleteFeedback={handleDeleteFeedback}
                  onBack={() => navigateTo('home')}
                />
              )}
            </>
          )}
        </main>

        {/* ফুটার */}
        <footer className="max-w-5xl w-full mx-auto px-4 sm:px-6 py-5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} {PROFILE_INFO.displayNameEn} (ID:{' '}
            {PROFILE_INFO.employeeId}) · HR & Admin Daily Work Portal
          </div>
          <div>কর্মস্থল: {PROFILE_INFO.workplace}</div>
        </footer>
      </div>

      {/* অফলাইন ইন্ডিকেটর */}
      <OfflineIndicator />

      {/* টোস্ট নোটিফিকেশন */}
      {toastMessage && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-lg z-50 border border-slate-700">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
