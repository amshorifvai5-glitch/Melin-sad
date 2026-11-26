import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { OperationType, db, handleFirestoreError } from '../firebase';
import {
  DayReportData,
  ExpenseCategory,
  FeedbackCategory,
  FeedbackEntry,
  FeedbackStatus,
  InventoryItem,
  InventoryUnit,
  OfficeExpenseEntry,
  WorkProofEntry,
} from '../types/report';
import {
  EXPENSE_CATEGORIES,
  FEEDBACK_CATEGORIES,
  FEEDBACK_STATUSES,
  INVENTORY_UNITS,
  MAX_EXPENSE_AMOUNT,
  MAX_EXPENSE_NOTE_LEN,
  MAX_EXPENSE_RECEIPT_LEN,
  MAX_EXPENSE_TITLE_LEN,
  MAX_FEEDBACK_ADMIN_NOTE_LEN,
  MAX_FEEDBACK_MESSAGE_LEN,
  MAX_FEEDBACK_SENDER_LEN,
  MAX_INVENTORY_NAME_LEN,
  MAX_INVENTORY_NOTE_LEN,
  MAX_INVENTORY_QTY,
  createEmptyDayData,
} from '../data/portalData';

export interface CloudProofRecord extends WorkProofEntry {
  id: string;
}

export interface CloudExpenseRecord extends OfficeExpenseEntry {
  id: string;
}

function sanitizeDailyReportPayload(data: DayReportData) {
  return {
    inTime: String(data.inTime || '').slice(0, 10),
    outTime: String(data.outTime || '').slice(0, 10),
    dutyStatus: (['', 'HQ', 'TS', 'HQ/TS'].includes(data.dutyStatus)
      ? data.dutyStatus
      : '') as DayReportData['dutyStatus'],
    basicTasks: data.basicTasks || {},
    extraBasicTasks: (data.extraBasicTasks || []).slice(0, 100).map((t) => ({
      text: String(t.text || '').slice(0, 300),
      time: String(t.time || '').slice(0, 10),
      done: Boolean(t.done),
    })),
    desks: data.desks || {},
    breaks: (data.breaks || []).slice(0, 50).map((b) => ({
      reason: String(b.reason || '').slice(0, 200),
      start: String(b.start || '').slice(0, 10),
      end: String(b.end || '').slice(0, 10),
    })),
    commutes: (data.commutes || []).slice(0, 50).map((c) => ({
      from: String(c.from || '').slice(0, 100),
      to: String(c.to || '').slice(0, 100),
      mode: String(c.mode || '').slice(0, 100),
      time: String(c.time || '').slice(0, 10),
    })),
    supplies: Object.fromEntries(
      Object.entries(data.supplies || {})
        .slice(0, 30)
        .map(([k, v]) => [String(k).slice(0, 64), Boolean(v)])
    ),
    notes: String(data.notes || '').slice(0, 5000),
  };
}

export function subscribeToDailyReport(
  dateId: string,
  onReportData: (data: DayReportData, docExists: boolean) => void,
  onProofsData: (proofs: CloudProofRecord[]) => void,
  onExpensesData: (expenses: CloudExpenseRecord[]) => void,
  onError: (err: unknown) => void
): () => void {
  const reportPath = `daily_reports/${dateId}`;
  const reportRef = doc(db, 'daily_reports', dateId);

  const unsubReport = onSnapshot(
    reportRef,
    (snap) => {
      if (!snap.exists()) {
        onReportData(createEmptyDayData(), false);
        return;
      }
      const raw = snap.data();
      onReportData(
        {
          inTime: raw.inTime || '',
          outTime: raw.outTime || '',
          dutyStatus: raw.dutyStatus || '',
          basicTasks: raw.basicTasks || {},
          extraBasicTasks: Array.isArray(raw.extraBasicTasks) ? raw.extraBasicTasks : [],
          desks: raw.desks || {},
          breaks: Array.isArray(raw.breaks) ? raw.breaks : [],
          commutes: Array.isArray(raw.commutes) ? raw.commutes : [],
          supplies: raw.supplies || {},
          notes: raw.notes || '',
          proofs: [],
          expenses: [],
        },
        true
      );
    },
    (error) => {
      onError(error);
      handleFirestoreError(error, OperationType.GET, reportPath);
    }
  );

  const proofsPath = `daily_reports/${dateId}/proofs`;
  const proofsQuery = query(
    collection(db, 'daily_reports', dateId, 'proofs'),
    where('isPublic', '==', true)
  );

  const unsubProofs = onSnapshot(
    proofsQuery,
    (snapshot) => {
      const items: CloudProofRecord[] = snapshot.docs.map((d) => {
        const raw = d.data();
        return {
          id: d.id,
          photo: raw.photo || '',
          description: raw.description || '',
          time: raw.time || '',
        };
      });
      items.sort((a, b) => b.id.localeCompare(a.id));
      onProofsData(items);
    },
    (error) => {
      onError(error);
      handleFirestoreError(error, OperationType.LIST, proofsPath);
    }
  );

  const expensesPath = `daily_reports/${dateId}/expenses`;
  const expensesQuery = query(
    collection(db, 'daily_reports', dateId, 'expenses'),
    where('isPublic', '==', true)
  );

  const unsubExpenses = onSnapshot(
    expensesQuery,
    (snapshot) => {
      const items: CloudExpenseRecord[] = snapshot.docs.map((d) => {
        const raw = d.data();
        const cat = EXPENSE_CATEGORIES.includes(raw.category)
          ? (raw.category as ExpenseCategory)
          : 'অন্যান্য';
        return {
          id: d.id,
          title: String(raw.title || ''),
          category: cat,
          amount: typeof raw.amount === 'number' && Number.isFinite(raw.amount) ? raw.amount : 0,
          time: String(raw.time || ''),
          note: String(raw.note || ''),
          receiptPhoto: typeof raw.receiptPhoto === 'string' ? raw.receiptPhoto : '',
        };
      });
      items.sort((a, b) => b.id.localeCompare(a.id));
      onExpensesData(items);
    },
    (error) => {
      onError(error);
      handleFirestoreError(error, OperationType.LIST, expensesPath);
    }
  );

  return () => {
    unsubReport();
    unsubProofs();
    unsubExpenses();
  };
}

export function subscribeToProfilePhoto(
  onPhoto: (photoDataUrl: string | null, exists: boolean) => void
): () => void {
  const path = 'portal_settings/profile';
  return onSnapshot(
    doc(db, 'portal_settings', 'profile'),
    (snap) => {
      if (!snap.exists()) {
        onPhoto(null, false);
        return;
      }
      const raw = snap.data();
      onPhoto(raw.photoDataUrl || null, true);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function saveDailyReportToCloud(
  dateId: string,
  ownerUid: string,
  data: DayReportData,
  docExists: boolean
): Promise<void> {
  const path = `daily_reports/${dateId}`;
  const docRef = doc(db, 'daily_reports', dateId);
  const sanitized = sanitizeDailyReportPayload(data);

  try {
    if (!docExists) {
      await setDoc(docRef, {
        dateId,
        ownerUid,
        ...sanitized,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(docRef, {
        ...sanitized,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, docExists ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

export async function addWorkProofToCloud(
  dateId: string,
  ownerUid: string,
  parentDocExists: boolean,
  currentReportData: DayReportData,
  proof: WorkProofEntry
): Promise<void> {
  if (!parentDocExists) {
    await saveDailyReportToCloud(dateId, ownerUid, currentReportData, false);
  }

  const proofId = `proof_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const path = `daily_reports/${dateId}/proofs/${proofId}`;

  try {
    await setDoc(doc(db, 'daily_reports', dateId, 'proofs', proofId), {
      dateId,
      ownerUid,
      isPublic: true,
      photo: String(proof.photo || '').slice(0, 400000),
      description: String(proof.description || 'কাজ সম্পন্ন হয়েছে').slice(0, 1000),
      time: String(proof.time || '').slice(0, 20),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteWorkProofFromCloud(
  dateId: string,
  proofId: string
): Promise<void> {
  const path = `daily_reports/${dateId}/proofs/${proofId}`;
  try {
    await deleteDoc(doc(db, 'daily_reports', dateId, 'proofs', proofId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function addOfficeExpenseToCloud(
  dateId: string,
  ownerUid: string,
  parentDocExists: boolean,
  currentReportData: DayReportData,
  expense: OfficeExpenseEntry
): Promise<void> {
  if (!parentDocExists) {
    await saveDailyReportToCloud(dateId, ownerUid, currentReportData, false);
  }

  const expenseId = `exp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const path = `daily_reports/${dateId}/expenses/${expenseId}`;
  const cleanCategory: ExpenseCategory = EXPENSE_CATEGORIES.includes(expense.category)
    ? expense.category
    : 'অন্যান্য';
  const cleanTitle = String(expense.title || '')
    .trim()
    .slice(0, MAX_EXPENSE_TITLE_LEN);
  const cleanAmount = Math.min(
    MAX_EXPENSE_AMOUNT,
    Math.max(0, Number.isFinite(expense.amount) ? Number(expense.amount) : 0)
  );

  try {
    await setDoc(doc(db, 'daily_reports', dateId, 'expenses', expenseId), {
      dateId,
      ownerUid,
      isPublic: true,
      title: cleanTitle,
      category: cleanCategory,
      amount: cleanAmount,
      time: String(expense.time || '').slice(0, 20),
      note: String(expense.note || '').trim().slice(0, MAX_EXPENSE_NOTE_LEN),
      receiptPhoto: String(expense.receiptPhoto || '').slice(0, MAX_EXPENSE_RECEIPT_LEN),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteOfficeExpenseFromCloud(
  dateId: string,
  expenseId: string
): Promise<void> {
  const path = `daily_reports/${dateId}/expenses/${expenseId}`;
  try {
    await deleteDoc(doc(db, 'daily_reports', dateId, 'expenses', expenseId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveProfilePhotoToCloud(
  ownerUid: string,
  photoDataUrl: string,
  profileDocExists: boolean
): Promise<void> {
  const path = 'portal_settings/profile';
  const docRef = doc(db, 'portal_settings', 'profile');

  try {
    if (!profileDocExists) {
      await setDoc(docRef, {
        ownerUid,
        photoDataUrl: String(photoDataUrl).slice(0, 350000),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(docRef, {
        photoDataUrl: String(photoDataUrl).slice(0, 350000),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(
      error,
      profileDocExists ? OperationType.UPDATE : OperationType.CREATE,
      path
    );
  }
}

export async function submitFeedbackToCloud(payload: {
  category: FeedbackCategory;
  senderName: string;
  message: string;
}): Promise<void> {
  const feedbackId = `fb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const path = `feedback/${feedbackId}`;
  const cleanCategory: FeedbackCategory = FEEDBACK_CATEGORIES.includes(payload.category)
    ? payload.category
    : 'মতামত';
  const cleanSender = String(payload.senderName || '')
    .trim()
    .slice(0, MAX_FEEDBACK_SENDER_LEN);
  const cleanMessage = String(payload.message || '')
    .trim()
    .slice(0, MAX_FEEDBACK_MESSAGE_LEN);

  if (!cleanMessage) {
    throw new Error('বার্তা খালি রাখা যাবে না');
  }

  try {
    await setDoc(doc(db, 'feedback', feedbackId), {
      feedbackId,
      category: cleanCategory,
      senderName: cleanSender,
      message: cleanMessage,
      status: 'নতুন',
      adminNote: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeToFeedbackInbox(
  onItems: (items: FeedbackEntry[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const path = 'feedback';
  const q = query(collection(db, 'feedback'), orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: FeedbackEntry[] = snapshot.docs.map((d) => {
        const raw = d.data();
        const cat = FEEDBACK_CATEGORIES.includes(raw.category)
          ? (raw.category as FeedbackCategory)
          : 'মতামত';
        const st = FEEDBACK_STATUSES.includes(raw.status)
          ? (raw.status as FeedbackStatus)
          : 'নতুন';
        const createdAtTs = raw.createdAt instanceof Timestamp ? raw.createdAt.toMillis() : 0;
        return {
          id: d.id,
          category: cat,
          senderName: String(raw.senderName || ''),
          message: String(raw.message || ''),
          status: st,
          adminNote: String(raw.adminNote || ''),
          createdAtMs: createdAtTs,
        };
      });
      onItems(items);
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function updateFeedbackInCloud(
  feedbackId: string,
  updates: { status: FeedbackStatus; adminNote: string }
): Promise<void> {
  const path = `feedback/${feedbackId}`;
  const cleanStatus: FeedbackStatus = FEEDBACK_STATUSES.includes(updates.status)
    ? updates.status
    : 'নতুন';
  const cleanNote = String(updates.adminNote || '')
    .trim()
    .slice(0, MAX_FEEDBACK_ADMIN_NOTE_LEN);

  try {
    await updateDoc(doc(db, 'feedback', feedbackId), {
      status: cleanStatus,
      adminNote: cleanNote,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteFeedbackFromCloud(feedbackId: string): Promise<void> {
  const path = `feedback/${feedbackId}`;
  try {
    await deleteDoc(doc(db, 'feedback', feedbackId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeToInventoryItems(
  onItems: (items: InventoryItem[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const path = 'inventory_items';
  const q = query(collection(db, 'inventory_items'), where('isPublic', '==', true));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: InventoryItem[] = snapshot.docs.map((d) => {
        const raw = d.data();
        const unit = INVENTORY_UNITS.includes(raw.unit)
          ? (raw.unit as InventoryUnit)
          : 'পিস';
        const updatedAtMs = raw.updatedAt instanceof Timestamp ? raw.updatedAt.toMillis() : 0;
        const qty =
          typeof raw.quantity === 'number' && Number.isFinite(raw.quantity)
            ? Math.max(0, raw.quantity)
            : 0;
        return {
          id: d.id,
          name: String(raw.name || ''),
          quantity: qty,
          unit,
          note: String(raw.note || ''),
          updatedAtMs,
        };
      });
      items.sort((a, b) => a.name.localeCompare(b.name, 'bn'));
      onItems(items);
    },
    (error) => {
      onError?.(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function addInventoryItemToCloud(
  ownerUid: string,
  payload: { name: string; quantity: number; unit: InventoryUnit; note: string }
): Promise<void> {
  const itemId = `inv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const path = `inventory_items/${itemId}`;
  const cleanName = String(payload.name || '')
    .trim()
    .slice(0, MAX_INVENTORY_NAME_LEN);
  const cleanUnit: InventoryUnit = INVENTORY_UNITS.includes(payload.unit)
    ? payload.unit
    : 'পিস';
  const cleanQty = Math.min(
    MAX_INVENTORY_QTY,
    Math.max(0, Number.isFinite(payload.quantity) ? Math.round(payload.quantity * 100) / 100 : 0)
  );
  const cleanNote = String(payload.note || '')
    .trim()
    .slice(0, MAX_INVENTORY_NOTE_LEN);

  if (!cleanName) {
    throw new Error('জিনিসের নাম খালি রাখা যাবে না');
  }

  try {
    await setDoc(doc(db, 'inventory_items', itemId), {
      itemId,
      ownerUid,
      isPublic: true,
      name: cleanName,
      quantity: cleanQty,
      unit: cleanUnit,
      note: cleanNote,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateInventoryItemInCloud(
  itemId: string,
  updates: { name: string; quantity: number; unit: InventoryUnit; note: string }
): Promise<void> {
  const path = `inventory_items/${itemId}`;
  const cleanName = String(updates.name || '')
    .trim()
    .slice(0, MAX_INVENTORY_NAME_LEN);
  const cleanUnit: InventoryUnit = INVENTORY_UNITS.includes(updates.unit)
    ? updates.unit
    : 'পিস';
  const cleanQty = Math.min(
    MAX_INVENTORY_QTY,
    Math.max(0, Number.isFinite(updates.quantity) ? Math.round(updates.quantity * 100) / 100 : 0)
  );
  const cleanNote = String(updates.note || '')
    .trim()
    .slice(0, MAX_INVENTORY_NOTE_LEN);

  if (!cleanName) {
    throw new Error('জিনিসের নাম খালি রাখা যাবে না');
  }

  try {
    await updateDoc(doc(db, 'inventory_items', itemId), {
      name: cleanName,
      quantity: cleanQty,
      unit: cleanUnit,
      note: cleanNote,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteInventoryItemFromCloud(itemId: string): Promise<void> {
  const path = `inventory_items/${itemId}`;
  try {
    await deleteDoc(doc(db, 'inventory_items', itemId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
