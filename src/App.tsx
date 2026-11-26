import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Armchair,
  Boxes,
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
  InventoryItem,
  InventoryUnit,
  LiveLocationStatus,
  MenuItemConfig,
  OfficeExpenseEntry,
  PageId,
  WorkProofEntry,
} from './types/report';
import {
  MENU_ITEMS,
  PROFILE_INFO,
  SUPPLY_ITEMS,
  TOTAL_DESKS,
  compressImageToDataUrl,
  countBasicWorkProgress,
  countDeskProgress,
  createEmptyDayData,
  formatBanglaDate,
  getDayData as getLocalDayData,
  getTodayIsoDate,
  getTotalBreakMinutes,
  getTotalExpenseAmount,
} from './data/portalData';
import { auth, googleProvider, isOwnerAdmin } from './firebase';
import {
  CloudExpenseRecord,
  CloudProofRecord,
  addInventoryItemToCloud,
  addOfficeExpenseToCloud,
  addWorkProofToCloud,
  deleteFeedbackFromCloud,
  deleteInventoryItemFromCloud,
  deleteOfficeExpenseFromCloud,
  deleteWorkProofFromCloud,
  saveDailyReportToCloud,
  saveProfilePhotoToCloud,
  submitFeedbackToCloud,
  subscribeToDailyReport,
  subscribeToFeedbackInbox,
  subscribeToInventoryItems,
  subscribeToLiveLocation,
  subscribeToProfilePhoto,
  updateFeedbackInCloud,
  updateInventoryItemInCloud,
  saveLiveLocationToCloud,
} from './services/reportSync';
import { Avatar } from './components/Avatar';
import { BasicWorkSection } from './components/BasicWorkSection';
import { DeskFloorMapSection } from './components/DeskFloorMapSection';
import { FeedbackSection } from './components/FeedbackSection';
import { HomeDashboard } from './components/HomeDashboard';
import { LiveLocationCorner } from './components/LiveLocationCorner';
import { OfficeExpensesSection } from './components/OfficeExpensesSection';
import { OpeningIntro } from './components/OpeningIntro';
import { OfflineIndicator, PWAInstallButton } from './components/PWAInstallControls';
import { StockInventorySection } from './components/StockInventorySection';
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
  'stock-inventory': <Boxes className="w-4 h-4" />,
  feedback: <MessageSquarePlus className="w-4 h-4" />,
};

const VALID_PAGE_IDS = new Set<string>([
  'home',
  'emergency-contact',
  ...MENU_ITEMS.map((item) => item.id),
]);

function isValidPageId(value: string): value is PageId {
  return VALID_PAGE_IDS.has(value);
}

function readPageFromHash(): PageId {
  const hash = window.location.hash.replace(/^#\/?/, '').trim();
  return isValidPageId(hash) ? hash : 'home';
}

function buildHashUrl(page: PageId): string {
  const base = `${window.location.pathname}${window.location.search}`;
  return page === 'home' ? base : `${base}#${page}`;
}

export default function App() {
  const [currentDate, setCurrentDate] = useState<string>(() => getTodayIsoDate());
  const [reportDocData, setReportDocData] = useState<DayReportData>(() => createEmptyDayData());
  const [cloudProofs, setCloudProofs] = useState<CloudProofRecord[]>([]);
  const [cloudExpenses, setCloudExpenses] = useState<CloudExpenseRecord[]>([]);
  const [reportDocExists, setReportDocExists] = useState(false);
  const [loadingReport, setLoadingReport] = useState(true);

  const [activePage, setActivePage] = useState<PageId>(() => readPageFromHash());
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [profileDocExists, setProfileDocExists] = useState(false);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [feedbackItems, setFeedbackItems] = useState<FeedbackEntry[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [liveLocation, setLiveLocation] = useState<LiveLocationStatus | null>(null);
  const [liveLocationExists, setLiveLocationExists] = useState(false);
  const [showOpening, setShowOpening] = useState(true);

  const reportDocExistsRef = useRef(false);
  reportDocExistsRef.current = reportDocExists;

  const latestReportRef = useRef<DayReportData>(reportDocData);
  latestReportRef.current = reportDocData;

  const notesDebounceRef = useRef<number | null>(null);
  const navDepthRef = useRef<number>(0);

  const canEdit = authReady && isOwnerAdmin(currentUser);

  const dayData: DayReportData = {
    ...reportDocData,
    proofs: cloudProofs,
    expenses: cloudExpenses,
  };

  /* মোবাইল ফোনের ব্যাক বাটন ও ব্রাউজার হিস্ট্রি সিঙ্ক */
  useEffect(() => {
    const initialPage = readPageFromHash();
    if (initialPage !== 'home') {
      window.history.replaceState({ page: 'home', depth: 0 }, '', buildHashUrl('home'));
      window.history.pushState({ page: initialPage, depth: 1 }, '', buildHashUrl(initialPage));
      navDepthRef.current = 1;
    } else {
      window.history.replaceState({ page: 'home', depth: 0 }, '', buildHashUrl('home'));
      navDepthRef.current = 0;
    }

    const handlePopState = (event: PopStateEvent) => {
      const stateObj =
        event.state && typeof event.state === 'object'
          ? (event.state as { page?: unknown; depth?: unknown })
          : null;
      const statePage = stateObj && typeof stateObj.page === 'string' ? stateObj.page : '';
      const targetPage: PageId = isValidPageId(statePage) ? statePage : readPageFromHash();
      const targetDepth =
        stateObj && typeof stateObj.depth === 'number' ? Math.max(0, stateObj.depth) : 0;

      navDepthRef.current = targetDepth;
      setActivePage(targetPage);
      setSidebarOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

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
    const unsubscribe = subscribeToInventoryItems((items) => {
      setInventoryItems(items);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToLiveLocation((status, exists) => {
      setLiveLocation(status);
      setLiveLocationExists(exists);
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

  const handleAddInventoryItem = async (payload: {
    name: string;
    quantity: number;
    unit: InventoryUnit;
    note: string;
  }) => {
    if (!canEdit || !currentUser) return;
    await addInventoryItemToCloud(currentUser.uid, payload);
    showToast('নতুন স্টক আইটেম যুক্ত হয়েছে');
  };

  const handleUpdateInventoryItem = async (
    itemId: string,
    updates: {
      name: string;
      quantity: number;
      unit: InventoryUnit;
      note: string;
    }
  ) => {
    if (!canEdit) return;
    await updateInventoryItemInCloud(itemId, updates);
    showToast('স্টক পরিমাণ আপডেট হয়েছে');
  };

  const handleDeleteInventoryItem = async (itemId: string) => {
    if (!canEdit) return;
    await deleteInventoryItemFromCloud(itemId);
    showToast('স্টক আইটেম মুছে ফেলা হয়েছে');
  };

  const handleSaveLiveLocation = async (payload: {
    locationLabel: string;
    note: string;
    isActive: boolean;
  }) => {
    if (!canEdit || !currentUser) return;
    await saveLiveLocationToCloud(currentUser.uid, payload, liveLocationExists);
    setLiveLocationExists(true);
    showToast(`লাইভ অবস্থান আপডেট হয়েছে: ${payload.locationLabel}`);
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
    setSidebarOpen(false);
    if (page !== activePage) {
      const nextDepth = navDepthRef.current + 1;
      navDepthRef.current = nextDepth;
      window.history.pushState({ page, depth: nextDepth }, '', buildHashUrl(page));
      setActivePage(page);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoBack = (fallback: PageId = 'home') => {
    if (navDepthRef.current > 0) {
      window.history.back();
    } else {
      navigateTo(fallback);
    }
  };

  const basicProgress = countBasicWorkProgress(dayData);
  const deskProgress = countDeskProgress(dayData);
  const breakMinutes = getTotalBreakMinutes(dayData);
  const suppliesDone = SUPPLY_ITEMS.filter((s) => Boolean(dayData.supplies[s.id])).length;

  const unreadFeedbackCount = feedbackItems.filter((item) => item.status === 'নতুন').length;
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
        return suppliesDone > 0 ? `${suppliesDone}/${SUPPLY_ITEMS.length}` : null;
      case 'work-proof':
        return dayData.proofs.length > 0 ? `${dayData.proofs.length} ফটো` : null;
      case 'office-expenses':
        return totalExpenses > 0 ? `৳${totalExpenses}` : null;
      case 'stock-inventory':
        return inventoryItems.length > 0 ? `${inventoryItems.length}টি` : null;
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
    <div className="min-h-screen portal-canvas text-neutral-900 flex">
      {/* মোবাইল সাইডবার ওভারলে */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-40 lg:hidden"
        />
      )}

      {/* বাম পাশের সাইডবার নেভিগেশন */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-[#0B0B0D] text-neutral-100 z-50 border-r border-neutral-800 flex flex-col shrink-0 transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between gap-2">
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
                  <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#F26522] text-white flex items-center justify-center border border-[#0B0B0D]">
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
              <div className="text-xs text-neutral-400 truncate font-mono-num">
                {PROFILE_INFO.roleTitle} · ID {PROFILE_INFO.employeeId}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="মেনু বন্ধ করুন"
            className="lg:hidden text-neutral-400 hover:text-white p-1.5 rounded-lg"
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
                ? 'bg-[#F26522] text-white shadow-sm shadow-orange-950/50'
                : 'text-neutral-300 hover:bg-neutral-900 hover:text-white'
            }`}
          >
            <Home className="w-4 h-4 shrink-0" />
            <span className="truncate">হোম ড্যাশবোর্ড</span>
          </button>

          <div className="border-t border-neutral-800 my-2.5" />

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
                    ? 'bg-neutral-900 text-white font-semibold border border-[#F26522]/45'
                    : 'text-neutral-300 hover:bg-neutral-900/70 hover:text-white font-medium'
                }`}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`shrink-0 ${isActive ? 'text-[#F26522]' : 'text-neutral-400'}`}
                  >
                    {SECTION_ICONS[item.id]}
                  </span>
                  <span className="truncate">
                    <span className="font-mono-num text-xs text-neutral-500 mr-1">
                      {idx + 1}.
                    </span>
                    {item.title}
                  </span>
                </span>
                {badge && (
                  <span className="text-[11px] font-mono-num text-neutral-400 shrink-0">
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* সাইডবার ফুটার: অ্যাপ ইনস্টল ও অ্যাডমিন লগইন */}
        <div className="p-3 border-t border-neutral-800 space-y-2">
          <PWAInstallButton variant="sidebar" />
          {currentUser ? (
            <div className="space-y-2">
              <div className="px-2.5 py-2 rounded-lg bg-[#16161A] border border-neutral-800 text-xs">
                <div className="font-semibold text-white truncate">
                  {canEdit ? 'অ্যাডমিন (এডিট চালু)' : 'শুধুমাত্র দেখার মোড'}
                </div>
                <div className="text-[11px] text-neutral-400 truncate mt-0.5">
                  {currentUser.email}
                </div>
              </div>
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-100 text-xs font-semibold transition-colors"
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
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-[#F26522] hover:bg-[#DC5214] disabled:opacity-60 text-white text-xs font-semibold transition-colors"
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
        <header className="sticky top-0 z-30 bg-[#0B0B0D]/95 backdrop-blur-md border-b border-neutral-800 px-4 sm:px-6 py-3">
          <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                aria-label="মেনু খুলুন"
                className="lg:hidden p-2 -ml-2 rounded-lg text-neutral-200 hover:bg-neutral-800 transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <div className="text-sm font-bold text-white truncate whitespace-nowrap">
                  দৈনিক কাজের রিপোর্ট · {activeTitle}
                </div>
                <div className="text-xs text-neutral-400 truncate">
                  {formatBanglaDate(currentDate)} ·{' '}
                  {canEdit ? 'অ্যাডমিন এডিট মোড' : 'শুধুমাত্র দেখার মোড'}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2 bg-[#16161A] border border-neutral-800 rounded-lg px-2.5 py-1.5">
                <span className="text-xs font-semibold text-emerald-400">In</span>
                {canEdit ? (
                  <input
                    type="time"
                    value={dayData.inTime}
                    onChange={(e) =>
                      updateDayData((prev) => ({ ...prev, inTime: e.target.value }))
                    }
                    aria-label="In Time"
                    className="bg-transparent text-xs font-mono-num font-bold text-white [color-scheme:dark] focus:outline-none"
                  />
                ) : (
                  <span className="text-xs font-mono-num font-bold text-white">
                    {dayData.inTime || '--:--'}
                  </span>
                )}
                <span className="text-neutral-600">|</span>
                <span className="text-xs font-semibold text-[#F26522]">Out</span>
                {canEdit ? (
                  <input
                    type="time"
                    value={dayData.outTime}
                    onChange={(e) =>
                      updateDayData((prev) => ({ ...prev, outTime: e.target.value }))
                    }
                    aria-label="Out Time"
                    className="bg-transparent text-xs font-mono-num font-bold text-white [color-scheme:dark] focus:outline-none"
                  />
                ) : (
                  <span className="text-xs font-mono-num font-bold text-white">
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
                className="bg-[#16161A] border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs font-mono-num font-semibold text-white [color-scheme:dark] focus:outline-none focus:border-[#F26522]"
              />

              <PWAInstallButton variant="header" />

              <button
                type="button"
                onClick={() => navigateTo('closing-report')}
                className="px-3.5 py-1.5 rounded-lg bg-[#F26522] hover:bg-[#DC5214] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                রিপোর্ট দেখুন
              </button>
            </div>
          </div>
        </header>

        {/* মূল ভিউপোর্ট */}
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 space-y-4">
          {!canEdit && (
            <div className="bg-white border border-neutral-200 rounded-xl px-4 py-3 shadow-xs space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 text-xs sm:text-sm text-neutral-700">
                  {currentUser ? (
                    <Lock className="w-4 h-4 text-[#F26522] shrink-0" />
                  ) : (
                    <Eye className="w-4 h-4 text-[#F26522] shrink-0" />
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
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F26522] hover:bg-[#DC5214] disabled:opacity-60 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
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
            <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs sm:text-sm font-medium text-orange-950">
                এই তারিখের জন্য ব্রাউজারে আগে সেভ করা তথ্য পাওয়া গেছে। ক্লাউডে আপলোড করতে চান?
              </span>
              <button
                type="button"
                onClick={handleSyncLocalDraft}
                className="px-3.5 py-1.5 rounded-lg bg-[#F26522] hover:bg-[#DC5214] text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                ক্লাউডে সিঙ্ক করুন
              </button>
            </div>
          )}

          {loadingReport ? (
            <div className="bg-white border border-neutral-200 rounded-xl p-8 text-center text-sm text-neutral-500 shadow-xs">
              রিপোর্ট লোড হচ্ছে...
            </div>
          ) : (
            <div key={activePage} className="animate-page-enter">
              {activePage === 'home' && (
                <HomeDashboard
                  currentDate={currentDate}
                  dayData={dayData}
                  inventoryItems={inventoryItems}
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
                  onBack={() => handleGoBack('home')}
                  onNavigate={navigateTo}
                  onApplyDefaultShift={handleApplyDefaultShift}
                />
              )}

              {activePage === 'emergency-contact' && (
                <EmergencyContactSection
                  onBack={() => handleGoBack('personal-info')}
                  onCopy={handleCopy}
                />
              )}

              {activePage === 'basic-work' && (
                <BasicWorkSection
                  data={dayData}
                  canEdit={canEdit}
                  onUpdate={updateDayData}
                  onBack={() => handleGoBack('home')}
                />
              )}

              {activePage === 'duty-location' && (
                <DutyLocationSection
                  dutyStatus={dayData.dutyStatus}
                  canEdit={canEdit}
                  onSelect={handleSelectDutyStatus}
                  onBack={() => handleGoBack('home')}
                />
              )}

              {activePage === 'desk-chair' && (
                <DeskFloorMapSection
                  data={dayData}
                  canEdit={canEdit}
                  onUpdate={updateDayData}
                  onBack={() => handleGoBack('home')}
                />
              )}

              {activePage === 'break-time' && (
                <BreakTimeSection
                  data={dayData}
                  canEdit={canEdit}
                  onUpdate={updateDayData}
                  onBack={() => handleGoBack('home')}
                />
              )}

              {activePage === 'attendance-time' && (
                <AttendanceTimeSection
                  data={dayData}
                  canEdit={canEdit}
                  onApplyDefaultShift={handleApplyDefaultShift}
                  onBack={() => handleGoBack('home')}
                />
              )}

              {activePage === 'office-commute' && (
                <OfficeCommuteSection
                  data={dayData}
                  canEdit={canEdit}
                  onUpdate={updateDayData}
                  onBack={() => handleGoBack('home')}
                />
              )}

              {activePage === 'extra-work' && (
                <ExtraWorkSection
                  data={dayData}
                  canEdit={canEdit}
                  onUpdate={updateDayData}
                  onBack={() => handleGoBack('home')}
                />
              )}

              {activePage === 'supplies-refill' && (
                <SuppliesRefillSection
                  data={dayData}
                  canEdit={canEdit}
                  onUpdate={updateDayData}
                  onBack={() => handleGoBack('home')}
                />
              )}

              {activePage === 'closing-report' && (
                <ClosingReportSection
                  dateStr={currentDate}
                  data={dayData}
                  onCopy={handleCopy}
                  onBack={() => handleGoBack('home')}
                />
              )}

              {activePage === 'notes-issues' && (
                <NotesIssuesSection
                  notes={dayData.notes}
                  canEdit={canEdit}
                  onChange={(notes) =>
                    updateDayData((prev) => ({ ...prev, notes }), { debounce: true })
                  }
                  onBack={() => handleGoBack('home')}
                />
              )}

              {activePage === 'work-proof' && (
                <WorkProofSection
                  data={dayData}
                  canEdit={canEdit}
                  onAddProof={handleAddProof}
                  onDeleteProof={handleDeleteProof}
                  onBack={() => handleGoBack('home')}
                />
              )}

              {activePage === 'office-expenses' && (
                <OfficeExpensesSection
                  data={dayData}
                  canEdit={canEdit}
                  onAddExpense={handleAddExpense}
                  onDeleteExpense={handleDeleteExpense}
                  onBack={() => handleGoBack('home')}
                />
              )}

              {activePage === 'stock-inventory' && (
                <StockInventorySection
                  items={inventoryItems}
                  canEdit={canEdit}
                  onAddItem={handleAddInventoryItem}
                  onUpdateItem={handleUpdateInventoryItem}
                  onDeleteItem={handleDeleteInventoryItem}
                  onBack={() => handleGoBack('home')}
                />
              )}

              {activePage === 'feedback' && (
                <FeedbackSection
                  canEdit={canEdit}
                  inboxItems={feedbackItems}
                  onSubmitFeedback={handleSubmitFeedback}
                  onUpdateFeedback={handleUpdateFeedback}
                  onDeleteFeedback={handleDeleteFeedback}
                  onBack={() => handleGoBack('home')}
                />
              )}
            </div>
          )}
        </main>

        {/* ফুটার */}
        <footer className="max-w-5xl w-full mx-auto px-4 sm:px-6 pt-5 pb-20 sm:pb-6 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-neutral-500">
          <div>
            © {new Date().getFullYear()} {PROFILE_INFO.displayNameEn} (ID:{' '}
            {PROFILE_INFO.employeeId}) · HR & Admin Daily Work Portal
          </div>
          <div>কর্মস্থল: {PROFILE_INFO.workplace}</div>
        </footer>
      </div>

      {/* অফলাইন ইন্ডিকেটর */}
      <OfflineIndicator />

      {/* কোণায় লাইভ অবস্থান ব্যাজ */}
      <LiveLocationCorner
        status={liveLocation}
        fallbackDutyStatus={dayData.dutyStatus}
        canEdit={canEdit}
        onSave={handleSaveLiveLocation}
      />

      {/* ওপেনিং অ্যানিমেশন */}
      {showOpening && (
        <OpeningIntro profilePhoto={profilePhoto} onFinish={() => setShowOpening(false)} />
      )}

      {/* টোস্ট নোটিফিকেশন */}
      {toastMessage && (
        <div className="fixed bottom-20 sm:bottom-5 left-1/2 -translate-x-1/2 bg-[#0B0B0D] text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-2xl z-50 border border-[#F26522]/60 whitespace-nowrap">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
