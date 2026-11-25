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
  | 'work-proof';

export type DutyStatus = '' | 'HQ' | 'TS' | 'HQ/TS';

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
}

export interface MenuItemConfig {
  id: Exclude<PageId, 'home' | 'emergency-contact'>;
  title: string;
  subtitle: string;
}
