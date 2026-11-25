import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { OperationType, db, handleFirestoreError } from '../firebase';
import { DayReportData, WorkProofEntry } from '../types/report';
import { createEmptyDayData } from '../data/portalData';

export interface CloudProofRecord extends WorkProofEntry {
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
    supplies: data.supplies || {},
    notes: String(data.notes || '').slice(0, 5000),
  };
}

export function subscribeToDailyReport(
  dateId: string,
  onReportData: (data: DayReportData, docExists: boolean) => void,
  onProofsData: (proofs: CloudProofRecord[]) => void,
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

  return () => {
    unsubReport();
    unsubProofs();
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
