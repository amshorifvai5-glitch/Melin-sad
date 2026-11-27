export type PageId =
  | 'home'
  | 'personal-info'
  | 'emergency-contact'
  | 'basic-work'
  | 'duty-location'
  | 'desk-chair'
  | 'break-time'
  | 'attendance-time'
  | 'office-commute'
  | 'extra-work'
  | 'supplies-refill'
  | 'closing-report'
  | 'notes-issues'
  | 'work-proof'
  | 'office-expenses'
  | 'stock-inventory'
  | 'feedback'
  | 'visitor-analytics';

export type DutyStatus = '' | 'HQ' | 'TS' | 'HQ/TS' | 'OFFDAY';

export type FeedbackCategory = 'মতামত' | 'পরামর্শ' | 'অভিযোগ';
export type FeedbackStatus = 'নতুন' | 'দেখা হয়েছে' | 'সমাধান হয়েছে';

export interface FeedbackEntry {
  id: string;
  category: FeedbackCategory;
  senderName: string;
  message: string;
  status: FeedbackStatus;
  adminNote: string;
  createdAtMs: number;
}

export type ExpenseCategory = 'চা-নাস্তা' | 'যাতায়াত' | 'মালামাল ক্রয়' | 'অন্যান্য';

export interface OfficeExpenseEntry {
  id?: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  time: string;
  note: string;
  receiptPhoto?: string;
}

export type InventoryUnit =
  | 'পিস'
  | 'লিটার'
  | 'বোতল'
  | 'বক্স'
  | 'রোল'
  | 'প্যাকেট'
  | 'কেজি';

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: InventoryUnit;
  note: string;
  updatedAtMs: number;
}

export interface LiveLocationStatus {
  locationLabel: string;
  note: string;
  isActive: boolean;
  updatedAtMs: number;
}

export interface SiteVisitEntry {
  id: string;
  dateId: string;
  visitorToken: string;
  deviceType: 'মোবাইল' | 'ডেস্কটপ';
  osName: string;
  browserName: string;
  screenSize: string;
  timezone: string;
  referrerHost: string;
  activePage: string;
  viewsCount: number;
  createdAtMs: number;
  lastSeenAtMs: number;
}

export interface BasicTaskProgress {
  done: boolean;
  time: string;
}

export interface ExtraTaskItem {
  text: string;
  time: string;
  done: boolean;
}

export interface DeskCleanState {
  desk: boolean;
  chair: boolean;
}

export interface BreakEntry {
  reason: string;
  start: string;
  end: string;
}

export interface CommuteEntry {
  from: string;
  to: string;
  mode: string;
  time: string;
}

export interface WorkProofEntry {
  id?: string;
  photo: string;
  description: string;
  time: string;
}

export interface DayReportData {
  inTime: string;
  outTime: string;
  dutyStatus: DutyStatus;
  basicTasks: Record<string, BasicTaskProgress>;
  extraBasicTasks: ExtraTaskItem[];
  desks: Record<number, DeskCleanState>;
  breaks: BreakEntry[];
  commutes: CommuteEntry[];
  supplies: Record<string, boolean>;
  notes: string;
  proofs: WorkProofEntry[];
  expenses: OfficeExpenseEntry[];
}

export interface MenuItemConfig {
  id: Exclude<PageId, 'home' | 'emergency-contact'>;
  title: string;
  subtitle: string;
}
