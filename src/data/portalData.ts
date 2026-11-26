import { DayReportData, MenuItemConfig } from '../types/report';

export const TOTAL_DESKS = 73;
export const PROFILE_PHOTO_KEY = 'sorif_profile_photo';
export const REPORT_KEY_PREFIX = 'sorif_report_';

export const PROFILE_INFO = {
  displayNameEn: 'Sorif Ahmmed',
  displayNameBn: 'শরিফ আহম্মেদ',
  employeeId: '855',
  roleTitle: 'Junior Associate',
  roleTitleBn: 'Junior Associate',
  department: 'HR & Admin',
  workplace: 'HQ / TS',
  joiningDate: '05-10-2026',
  shiftLabel: 'সকাল ৯টা – রাত ৭টা',
};

export const EMERGENCY_CONTACTS = [
  {
    id: 'phone',
    label: 'Contact Number',
    value: '01858115480',
    href: 'tel:01858115480',
    actionLabel: 'কল দিন',
    external: false,
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    value: '01858115490',
    href: 'https://wa.me/8801858115490',
    actionLabel: 'WhatsApp',
    external: true,
  },
  {
    id: 'facebook',
    label: 'Facebook',
    value: 'https://www.facebook.com/amshorif.bhai',
    href: 'https://www.facebook.com/amshorif.bhai',
    actionLabel: 'ওপেন',
    external: true,
  },
  {
    id: 'instagram',
    label: 'Instagram',
    value: 'amshorif.vai',
    href: 'https://www.instagram.com/amshorif.vai/',
    actionLabel: 'ওপেন',
    external: true,
  },
];

export const MENU_ITEMS: MenuItemConfig[] = [
  { id: 'personal-info', title: 'ব্যক্তিগত তথ্য', subtitle: 'পরিচিতি ও জরুরি যোগাযোগ' },
  { id: 'basic-work', title: 'দৈনিক বেসিক কাজ', subtitle: '২১টি রুটিন কাজ ও সময়' },
  { id: 'duty-location', title: 'ডিউটি অবস্থান', subtitle: 'HQ / TS লোকেশন' },
  { id: 'desk-chair', title: 'ডেস্ক ও চেয়ার ক্লিন', subtitle: '৭৩টি ডেস্কের ফ্লোর ম্যাপ' },
  { id: 'break-time', title: 'বিরতি সময়', subtitle: 'লাঞ্চ ও চা বিরতি লগ' },
  { id: 'attendance-time', title: 'হাজিরা ও সময়ের হিসাব', subtitle: 'মোট ও কার্যকর ডিউটি ঘণ্টা' },
  { id: 'office-commute', title: 'অফিস যাতায়াত', subtitle: 'অফিস চলাচলের হিসাব' },
  { id: 'extra-work', title: 'অতিরিক্ত কাজ', subtitle: 'বিশেষ বা অতিরিক্ত দায়িত্ব' },
  { id: 'supplies-refill', title: 'মালামাল ও রিফিল', subtitle: 'স্টক ও সরঞ্জাম চেকলিস্ট' },
  { id: 'closing-report', title: 'কাজের সমাপ্তি রিপোর্ট', subtitle: 'অটো-জেনারেটেড সারসংক্ষেপ' },
  { id: 'notes-issues', title: 'বিশেষ নোট ও সমস্যা', subtitle: 'পর্যবেক্ষণ ও ঘাটতি নোট' },
  { id: 'work-proof', title: 'কাজের প্রমাণ', subtitle: 'কাজের ছবি ও বিবরণ' },
  {
    id: 'office-expenses',
    title: 'অফিসের জন্য খরচ',
    subtitle: 'দৈনিক অফিস খরচের হিসাব',
  },
  {
    id: 'stock-inventory',
    title: 'মালামাল স্টক ও মজুত',
    subtitle: 'কোন জিনিস কত পিস বা কত লিটার আছে',
  },
  {
    id: 'feedback',
    title: 'আপনার মতামত, পরামর্শ কিংবা আপনার অভিযোগ জানান',
    subtitle: 'মতামত, পরামর্শ বা অভিযোগ সরাসরি পাঠান',
  },
];

export const INVENTORY_UNITS = [
  'পিস',
  'লিটার',
  'বোতল',
  'বক্স',
  'রোল',
  'প্যাকেট',
  'কেজি',
] as const;
export const INVENTORY_QUICK_SUGGESTIONS: Array<{
  name: string;
  unit: (typeof INVENTORY_UNITS)[number];
}> = [
  { name: 'হ্যান্ডওয়াশ', unit: 'লিটার' },
  { name: 'টিস্যু রোল', unit: 'পিস' },
  { name: 'বক্স টিস্যু', unit: 'বক্স' },
  { name: 'ডিশওয়াশ লিকুইড', unit: 'লিটার' },
  { name: 'ডাস্টবিন ব্যাগ', unit: 'পিস' },
  { name: 'গ্লাস ও ফ্লোর ক্লিনার', unit: 'লিটার' },
];
export const MAX_INVENTORY_NAME_LEN = 120;
export const MAX_INVENTORY_NOTE_LEN = 300;
export const MAX_INVENTORY_QTY = 100000;

export const EXPENSE_CATEGORIES = ['চা-নাস্তা', 'যাতায়াত', 'মালামাল ক্রয়', 'অন্যান্য'] as const;
export const MAX_EXPENSE_TITLE_LEN = 200;
export const MAX_EXPENSE_NOTE_LEN = 500;
export const MAX_EXPENSE_AMOUNT = 1000000;
export const MAX_EXPENSE_RECEIPT_LEN = 350000;

export const FEEDBACK_CATEGORIES = ['মতামত', 'পরামর্শ', 'অভিযোগ'] as const;
export const FEEDBACK_STATUSES = ['নতুন', 'দেখা হয়েছে', 'সমাধান হয়েছে'] as const;
export const MAX_FEEDBACK_SENDER_LEN = 100;
export const MAX_FEEDBACK_MESSAGE_LEN = 2000;
export const MAX_FEEDBACK_ADMIN_NOTE_LEN = 1000;

export const BASIC_TASKS: Array<{ id: string; text: string }> = [
  { id: 'glass_door', text: 'গ্লাস ডোর পরিষ্কার করা হয়েছে' },
  { id: 'water_bottles', text: 'পানির বোতলগুলোতে পানি ভরা হয়েছে' },
  { id: 'floor_sweep', text: 'ফ্লোর ঝাড়ু দেওয়া হয়েছে' },
  { id: 'floor_mop', text: 'ফ্লোর মোছা হয়েছে' },
  { id: 'manager_room', text: 'ম্যানেজার ভাইয়ের রুম পরিষ্কার করা হয়েছে' },
  { id: 'water_plants', text: 'গাছে পানি দেওয়া হয়েছে' },
  { id: 'dustbins_clean', text: 'সকল ডাস্টবিনের ময়লা পরিষ্কার করা হয়েছে' },
  { id: 'washroom_clean', text: 'ওয়াশরুম পরিষ্কার করা হয়েছে' },
  { id: 'washroom_basin', text: 'ওয়াশরুমের বেসিন পরিষ্কার করা হয়েছে' },
  { id: 'washroom_mirror', text: 'ওয়াশরুমের আয়না পরিষ্কার করা হয়েছে' },
  { id: 'handwash_tissue', text: 'হ্যান্ডওয়াশ ও টিস্যু রিফিল করা হয়েছে' },
  { id: 'monitor_cpu', text: 'মনিটর ও সিপিইউ পরিষ্কার করা হয়েছে' },
  { id: 'office_desks', text: 'অফিসের ডেস্কগুলো পরিষ্কার করা হয়েছে' },
  { id: 'chairs_clean', text: 'চেয়ারগুলো পরিষ্কার করা হয়েছে' },
  { id: 'meeting_sweep', text: 'মিটিং রুম ঝাড়ু দেওয়া হয়েছে' },
  { id: 'meeting_mop', text: 'মিটিং রুমের ফ্লোর মোছা হয়েছে' },
  { id: 'microwave_clean', text: 'মাইক্রোওয়েভ পরিষ্কার করা হয়েছে' },
  { id: 'kitchen_desk', text: 'কিচেনের ডেস্ক পরিষ্কার করা হয়েছে' },
  { id: 'kitchen_basin', text: 'কিচেনের বেসিন পরিষ্কার করা হয়েছে' },
  { id: 'cobwebs_clean', text: 'মাকড়সার জাল পরিষ্কার করা হয়েছে' },
  { id: 'tea_cups_clean', text: 'ব্যবহৃত চায়ের কাপগুলো পরিষ্কার করা হয়েছে' },
];

export const SUPPLY_ITEMS: Array<{ id: string; label: string }> = [
  { id: 'handwash', label: 'হ্যান্ডওয়াশ রিফিল' },
  { id: 'tissue_roll', label: 'টিস্যু রোল / বক্স টিস্যু' },
  { id: 'dishwash_liquid', label: 'ডিশওয়াশ লিকুইড' },
  { id: 'trash_bag', label: 'ডাস্টবিন ব্যাগ' },
  { id: 'glass_cleaner', label: 'গ্লাস ও ফ্লোর ক্লিনার' },
];

export function createEmptyDayData(): DayReportData {
  return {
    inTime: '',
    outTime: '',
    dutyStatus: '',
    basicTasks: {},
    extraBasicTasks: [],
    desks: {},
    breaks: [],
    commutes: [],
    supplies: {},
    notes: '',
    proofs: [],
    expenses: [],
  };
}

export function getDayData(dateStr: string): DayReportData {
  try {
    const raw = localStorage.getItem(REPORT_KEY_PREFIX + dateStr);
    if (!raw) return createEmptyDayData();
    const parsed = JSON.parse(raw);
    return {
      inTime: parsed.inTime || '',
      outTime: parsed.outTime || '',
      dutyStatus: parsed.dutyStatus || '',
      basicTasks: parsed.basicTasks || {},
      extraBasicTasks: Array.isArray(parsed.extraBasicTasks) ? parsed.extraBasicTasks : [],
      desks: parsed.desks || {},
      breaks: Array.isArray(parsed.breaks) ? parsed.breaks : [],
      commutes: Array.isArray(parsed.commutes) ? parsed.commutes : [],
      supplies: parsed.supplies || {},
      notes: parsed.notes || '',
      proofs: Array.isArray(parsed.proofs) ? parsed.proofs : [],
      expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
    };
  } catch {
    return createEmptyDayData();
  }
}

export function saveDayData(dateStr: string, data: DayReportData): boolean {
  try {
    localStorage.setItem(REPORT_KEY_PREFIX + dateStr, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function getTodayIsoDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatBanglaDate(dateStr: string): string {
  const dateObj = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(dateObj.getTime())) return dateStr;
  return dateObj.toLocaleDateString('bn-BD', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function getNowTimeHHMM(): string {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function timeToMinutes(hhmm: string): number | null {
  if (!hhmm || !hhmm.includes(':')) return null;
  const [h, m] = hhmm.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

export function formatMinutesToHM(totalMins: number): string {
  const absMins = Math.max(0, Math.round(totalMins));
  const h = Math.floor(absMins / 60);
  const m = absMins % 60;
  if (h > 0 && m > 0) return `${h} ঘণ্টা ${m} মিনিট`;
  if (h > 0) return `${h} ঘণ্টা`;
  return `${m} মিনিট`;
}

export function getTotalBreakMinutes(data: DayReportData): number {
  let total = 0;
  data.breaks.forEach((b) => {
    const s = timeToMinutes(b.start);
    const e = timeToMinutes(b.end);
    if (s !== null && e !== null && e > s) {
      total += e - s;
    }
  });
  return total;
}

export function countBasicWorkProgress(data: DayReportData): { done: number; total: number } {
  let done = 0;
  BASIC_TASKS.forEach((t) => {
    if (data.basicTasks[t.id]?.done) done++;
  });
  data.extraBasicTasks.forEach((item) => {
    if (item.done) done++;
  });
  return {
    done,
    total: BASIC_TASKS.length + data.extraBasicTasks.length,
  };
}

export function countDeskProgress(data: DayReportData): {
  deskDone: number;
  chairDone: number;
  bothDone: number;
} {
  let deskDone = 0;
  let chairDone = 0;
  let bothDone = 0;
  for (let i = 1; i <= TOTAL_DESKS; i++) {
    const st = data.desks[i];
    if (st?.desk) deskDone++;
    if (st?.chair) chairDone++;
    if (st?.desk && st?.chair) bothDone++;
  }
  return { deskDone, chairDone, bothDone };
}

export function formatStockQty(qty: number): string {
  if (!Number.isFinite(qty)) return '0';
  const rounded = Math.round(qty * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

export function getTotalExpenseAmount(data: DayReportData): number {
  return (data.expenses || []).reduce(
    (sum, exp) => sum + (Number.isFinite(exp.amount) ? Math.max(0, exp.amount) : 0),
    0
  );
}

export function buildClosingReportText(dateStr: string, data: DayReportData): string {
  let doneBasic = 0;
  const completedLines: string[] = [];

  BASIC_TASKS.forEach((task, idx) => {
    const entry = data.basicTasks[task.id];
    if (entry && entry.done) {
      doneBasic++;
      completedLines.push(`${idx + 1}. ${task.text}${entry.time ? ` (${entry.time})` : ''}`);
    }
  });

  data.extraBasicTasks.forEach((item, idx) => {
    if (item.done) {
      completedLines.push(`অতিরিক্ত ${idx + 1}. ${item.text}${item.time ? ` (${item.time})` : ''}`);
    }
  });

  const { bothDone } = countDeskProgress(data);
  const breakMins = getTotalBreakMinutes(data);
  const suppliesDoneCount = SUPPLY_ITEMS.filter((s) => Boolean(data.supplies[s.id])).length;
  const totalExpense = getTotalExpenseAmount(data);

  const lines = [
    `কর্মী: ${PROFILE_INFO.displayNameEn} (ID: ${PROFILE_INFO.employeeId})`,
    `তারিখ: ${formatBanglaDate(dateStr)}`,
    `ডিউটি অবস্থান: ${data.dutyStatus || 'উল্লেখ নেই'}`,
    `In: ${data.inTime || '--:--'} | Out: ${data.outTime || '--:--'}`,
    `মোট বিরতি: ${formatMinutesToHM(breakMins)}`,
    `ডেস্ক ও চেয়ার ক্লিন: ${bothDone}/${TOTAL_DESKS} সম্পন্ন`,
    `বেসিক কাজ: ${doneBasic}/${BASIC_TASKS.length} সম্পন্ন`,
    `মালামাল রিফিল: ${suppliesDoneCount}/${SUPPLY_ITEMS.length} সম্পন্ন`,
    `অফিসের খরচ: ৳${totalExpense} (${data.expenses.length}টি আইটেম)`,
    `কাজের প্রমাণ ফটো: ${data.proofs.length}টি`,
    '',
    'আজকের সম্পন্ন কাজের বিবরণ:',
    completedLines.length ? completedLines.join('\n') : 'কোনো কাজ সম্পন্ন মার্ক করা হয়নি',
  ];

  if (data.expenses.length > 0) {
    lines.push(
      '',
      'অফিসের জন্য খরচের বিবরণ:',
      ...data.expenses.map(
        (exp, idx) =>
          `${idx + 1}. ${exp.title} (${exp.category}) — ৳${exp.amount}${
            exp.time ? ` [${exp.time}]` : ''
          }`
      )
    );
  }

  if (data.notes.trim()) {
    lines.push('', `বিশেষ নোট: ${data.notes.trim()}`);
  }

  return lines.join('\n');
}

function escapeHtml(raw: string): string {
  return String(raw)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildClosingReportHtml(dateStr: string, data: DayReportData): string {
  const { deskDone, chairDone, bothDone } = countDeskProgress(data);
  const { done: basicDone, total: basicTotal } = countBasicWorkProgress(data);
  const breakMins = getTotalBreakMinutes(data);

  const taskRows = BASIC_TASKS.map((task, idx) => {
    const entry = data.basicTasks[task.id];
    const isDone = Boolean(entry?.done);
    return `<tr>
      <td>${idx + 1}</td>
      <td>${escapeHtml(task.text)}</td>
      <td>${isDone ? 'সম্পন্ন' : 'বাকি'}</td>
      <td>${escapeHtml(entry?.time || '—')}</td>
    </tr>`;
  }).join('');

  const extraRows = data.extraBasicTasks
    .map(
      (item, idx) => `<tr>
      <td>অতিরিক্ত ${idx + 1}</td>
      <td>${escapeHtml(item.text)}</td>
      <td>${item.done ? 'সম্পন্ন' : 'বাকি'}</td>
      <td>${escapeHtml(item.time || '—')}</td>
    </tr>`
    )
    .join('');

  const breakRows = data.breaks.length
    ? data.breaks
        .map(
          (b) =>
            `<li><strong>${escapeHtml(b.reason || 'বিরতি')}</strong>: ${escapeHtml(
              b.start || '--:--'
            )} – ${escapeHtml(b.end || '--:--')}</li>`
        )
        .join('')
    : '<li>কোনো বিরতি যুক্ত করা হয়নি</li>';

  const supplyRows = SUPPLY_ITEMS.map((s) => {
    const statusHtml = data.supplies[s.id]
      ? '<strong style="color:#047857;">রিফিল সম্পন্ন</strong>'
      : '<strong>বাকি</strong>';
    return `<li>${escapeHtml(s.label)}: ${statusHtml}</li>`;
  }).join('');

  const proofCards = data.proofs.length
    ? data.proofs
        .map((p) => {
          const safeImg = p.photo && p.photo.startsWith('data:image/') ? p.photo : '';
          return `<div class="proof-card">
            ${safeImg ? `<img src="${safeImg}" alt="কাজের প্রমাণ" />` : ''}
            <div class="proof-meta">
              <div class="proof-time">${escapeHtml(p.time || '')}</div>
              <div>${escapeHtml(p.description)}</div>
            </div>
          </div>`;
        })
        .join('')
    : '<p class="muted">কোনো কাজের প্রমাণ ফটো যুক্ত করা হয়নি।</p>';

  return `<!doctype html>
<html lang="bn">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>কাজের রিপোর্ট — ${escapeHtml(dateStr)}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 24px; line-height: 1.5; }
    .container { max-width: 900px; margin: 0 auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; }
    h1 { font-size: 20px; margin: 0 0 4px; }
    h2 { font-size: 15px; margin: 24px 0 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
    .muted { color: #64748b; font-size: 13px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 10px; margin-top: 16px; }
    .stat { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; }
    .stat-label { font-size: 11px; color: #64748b; }
    .stat-val { font-size: 15px; font-weight: 700; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { border: 1px solid #e2e8f0; padding: 8px 10px; text-align: left; }
    th { background: #f1f5f9; }
    ul { padding-left: 18px; font-size: 13px; }
    .notes { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; white-space: pre-wrap; font-size: 13px; }
    .proof-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px; }
    .proof-card { border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
    .proof-card img { width: 100%; height: 180px; object-fit: cover; display: block; }
    .proof-meta { padding: 10px; font-size: 13px; }
    .proof-time { font-weight: 700; color: #047857; font-size: 12px; margin-bottom: 4px; }
    @media print { body { background: #fff; padding: 0; } .container { border: none; } }
  </style>
</head>
<body>
  <div class="container">
    <h1>${escapeHtml(PROFILE_INFO.displayNameEn)} (ID: ${escapeHtml(PROFILE_INFO.employeeId)}) — দৈনিক কাজের রিপোর্ট</h1>
    <div class="muted">${escapeHtml(formatBanglaDate(dateStr))} · ${escapeHtml(PROFILE_INFO.department)} (${escapeHtml(PROFILE_INFO.workplace)})</div>

    <div class="grid">
      <div class="stat"><div class="stat-label">ডিউটি অবস্থান</div><div class="stat-val">${escapeHtml(data.dutyStatus || 'উল্লেখ নেই')}</div></div>
      <div class="stat"><div class="stat-label">In / Out সময়</div><div class="stat-val">${escapeHtml(data.inTime || '--:--')} – ${escapeHtml(data.outTime || '--:--')}</div></div>
      <div class="stat"><div class="stat-label">বেসিক কাজ</div><div class="stat-val">${basicDone}/${basicTotal} সম্পন্ন</div></div>
      <div class="stat"><div class="stat-label">ডেস্ক ও চেয়ার</div><div class="stat-val">ডেস্ক ${deskDone}/${TOTAL_DESKS} · চেয়ার ${chairDone}/${TOTAL_DESKS} (উভয় ${bothDone})</div></div>
      <div class="stat"><div class="stat-label">মোট বিরতি</div><div class="stat-val">${escapeHtml(formatMinutesToHM(breakMins))}</div></div>
    </div>

    <h2>দৈনিক বেসিক ও অতিরিক্ত কাজ</h2>
    <table>
      <thead><tr><th>নং</th><th>কাজের বিবরণ</th><th>অবস্থা</th><th>সময়</th></tr></thead>
      <tbody>${taskRows}${extraRows}</tbody>
    </table>

    <h2>বিরতি সময়</h2>
    <ul>${breakRows}</ul>

    <h2>মালামাল ও রিফিল</h2>
    <ul>${supplyRows}</ul>

    <h2>অফিসের জন্য খরচ (মোট: ৳${getTotalExpenseAmount(data)})</h2>
    ${
      data.expenses.length > 0
        ? `<table><thead><tr><th>নং</th><th>খরচের বিবরণ</th><th>ধরন</th><th>পরিমাণ</th><th>রসিদ</th></tr></thead><tbody>${data.expenses
            .map((exp, idx) => {
              const safeReceipt =
                exp.receiptPhoto && exp.receiptPhoto.startsWith('data:image/')
                  ? `<img src="${exp.receiptPhoto}" alt="রসিদ" style="width:48px;height:48px;object-fit:cover;border-radius:4px;" />`
                  : '—';
              return `<tr><td>${idx + 1}</td><td>${escapeHtml(exp.title)}</td><td>${escapeHtml(
                exp.category
              )}</td><td>৳${exp.amount}</td><td>${safeReceipt}</td></tr>`;
            })
            .join('')}</tbody></table>`
        : '<p class="muted">আজ কোনো অফিস খরচ যুক্ত করা হয়নি।</p>'
    }

    <h2>বিশেষ নোট ও সমস্যা</h2>
    <div class="notes">${escapeHtml(data.notes.trim() || 'কোনো বিশেষ নোট যুক্ত করা হয়নি।')}</div>

    <h2>কাজের প্রমাণ</h2>
    <div class="proof-grid">${proofCards}</div>
  </div>
</body>
</html>`;
}

export function downloadTextFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function compressImageToDataUrl(
  file: File,
  maxDimension = 760,
  initialQuality = 0.72,
  maxChars = 320000
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => resolve(String(reader.result));
      img.onload = () => {
        let dim = maxDimension;
        let quality = initialQuality;
        let dataUrl = '';

        for (let attempt = 0; attempt < 5; attempt++) {
          const scale = Math.min(1, dim / Math.max(img.width, img.height));
          const targetW = Math.max(1, Math.round(img.width * scale));
          const targetH = Math.max(1, Math.round(img.height * scale));
          const canvas = document.createElement('canvas');
          canvas.width = targetW;
          canvas.height = targetH;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(String(reader.result));
            return;
          }
          ctx.drawImage(img, 0, 0, targetW, targetH);
          dataUrl = canvas.toDataURL('image/jpeg', quality);
          if (dataUrl.length <= maxChars) break;
          dim = Math.round(dim * 0.78);
          quality = Math.max(0.42, quality - 0.1);
        }

        resolve(dataUrl);
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
