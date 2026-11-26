import React, { useState } from 'react';
import {
  ArrowLeft,
  Boxes,
  Check,
  Minus,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { InventoryItem, InventoryUnit } from '../types/report';
import {
  INVENTORY_QUICK_SUGGESTIONS,
  INVENTORY_UNITS,
  MAX_INVENTORY_NAME_LEN,
  MAX_INVENTORY_NOTE_LEN,
  MAX_INVENTORY_QTY,
  formatStockQty,
} from '../data/portalData';
import { ConfirmModal } from './ConfirmModal';

interface StockInventorySectionProps {
  items: InventoryItem[];
  canEdit: boolean;
  onAddItem: (payload: {
    name: string;
    quantity: number;
    unit: InventoryUnit;
    note: string;
  }) => Promise<void>;
  onUpdateItem: (
    itemId: string,
    updates: {
      name: string;
      quantity: number;
      unit: InventoryUnit;
      note: string;
    }
  ) => Promise<void>;
  onDeleteItem: (itemId: string) => Promise<void>;
  onBack: () => void;
}

export const StockInventorySection: React.FC<StockInventorySectionProps> = ({
  items,
  canEdit,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onBack,
}) => {
  const [name, setName] = useState('');
  const [qtyInput, setQtyInput] = useState('');
  const [unit, setUnit] = useState<InventoryUnit>('পিস');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [unitFilter, setUnitFilter] = useState<'সবগুলো' | InventoryUnit>('সবগুলো');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editQty, setEditQty] = useState('');
  const [editUnit, setEditUnit] = useState<InventoryUnit>('পিস');
  const [editNote, setEditNote] = useState('');

  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InventoryItem | null>(null);

  const filteredItems = items.filter((item) => {
    if (unitFilter !== 'সবগুলো' && item.unit !== unitFilter) return false;
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    return (
      item.name.toLowerCase().includes(q) ||
      item.note.toLowerCase().includes(q) ||
      item.unit.toLowerCase().includes(q)
    );
  });

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    const cleanName = name.trim().slice(0, MAX_INVENTORY_NAME_LEN);
    const parsedQty = Number(qtyInput);

    if (!cleanName) {
      setFormError('অনুগ্রহ করে জিনিসের নাম লিখুন।');
      return;
    }
    if (
      qtyInput === '' ||
      Number.isNaN(parsedQty) ||
      parsedQty < 0 ||
      parsedQty > MAX_INVENTORY_QTY
    ) {
      setFormError(`সঠিক পরিমাণ লিখুন (০ থেকে ${MAX_INVENTORY_QTY} পর্যন্ত)।`);
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      await onAddItem({
        name: cleanName,
        quantity: Math.round(parsedQty * 100) / 100,
        unit,
        note: note.trim().slice(0, MAX_INVENTORY_NOTE_LEN),
      });
      setName('');
      setQtyInput('');
      setNote('');
    } catch {
      setFormError('স্টক তথ্য সংরক্ষণ করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdjustQty = async (item: InventoryItem, delta: number) => {
    if (!canEdit) return;
    const nextQty = Math.min(
      MAX_INVENTORY_QTY,
      Math.max(0, Math.round((item.quantity + delta) * 100) / 100)
    );
    if (nextQty === item.quantity) return;
    setBusyId(item.id);
    try {
      await onUpdateItem(item.id, {
        name: item.name,
        quantity: nextQty,
        unit: item.unit,
        note: item.note,
      });
    } finally {
      setBusyId(null);
    }
  };

  const startEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditQty(String(item.quantity));
    setEditUnit(item.unit);
    setEditNote(item.note);
  };

  const handleSaveEdit = async (item: InventoryItem) => {
    if (!canEdit) return;
    const cleanName = editName.trim().slice(0, MAX_INVENTORY_NAME_LEN);
    const parsedQty = Number(editQty);
    if (!cleanName || editQty === '' || Number.isNaN(parsedQty) || parsedQty < 0) return;

    setBusyId(item.id);
    try {
      await onUpdateItem(item.id, {
        name: cleanName,
        quantity: Math.min(MAX_INVENTORY_QTY, Math.round(parsedQty * 100) / 100),
        unit: editUnit,
        note: editNote.trim().slice(0, MAX_INVENTORY_NOTE_LEN),
      });
      setEditingId(null);
    } finally {
      setBusyId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setDeleteTarget(null);
    setBusyId(id);
    try {
      await onDeleteItem(id);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* হেডার */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm font-semibold text-neutral-700 hover:bg-neutral-50 shadow-xs transition-colors whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            হোম
          </button>
          <div>
            <h2 className="text-xl font-bold text-neutral-900">মালামাল স্টক ও মজুত</h2>
            <p className="text-xs text-neutral-500">
              {canEdit
                ? 'আপনার কাছে কোন জিনিস কত পিস বা কত লিটার আছে তা যুক্ত ও আপডেট করুন'
                : 'শুধুমাত্র দেখার মোড · বর্তমান মজুত তালিকা (পিস / লিটার)'}
            </p>
          </div>
        </div>

        <div className="bg-[#0B0B0D] border border-neutral-800 rounded-xl px-4 py-2.5 flex items-center gap-3 shrink-0 shadow-xs">
          <Boxes className="w-4 h-4 text-[#F26522] shrink-0" />
          <div>
            <div className="text-[11px] text-neutral-400">মোট সংরক্ষিত আইটেম</div>
            <div className="text-base font-bold font-mono-num text-white">
              {items.length}টি জিনিস
            </div>
          </div>
        </div>
      </div>

      {/* নতুন স্টক যুক্ত করার ফর্ম (শুধুমাত্র অ্যাডমিন) */}
      {canEdit && (
        <form
          onSubmit={(e) => void handleAddSubmit(e)}
          className="bg-white border border-neutral-200 rounded-xl p-4 sm:p-5 space-y-4 shadow-xs"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm font-bold text-neutral-900">নতুন স্টক আইটেম যুক্ত করুন</div>
            <div className="flex flex-wrap items-center gap-1.5">
              {INVENTORY_QUICK_SUGGESTIONS.map((s) => (
                <button
                  key={s.name}
                  type="button"
                  onClick={() => {
                    setName(s.name);
                    setUnit(s.unit);
                    if (formError) setFormError(null);
                  }}
                  className="px-2.5 py-1 rounded-md bg-[#F9FAFB] border border-neutral-200 hover:border-[#F26522] text-[11px] font-medium text-neutral-700 hover:text-[#F26522] transition-colors whitespace-nowrap"
                >
                  + {s.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1.5">
              <label htmlFor="invName" className="block text-xs font-semibold text-neutral-700">
                জিনিসের নাম <span className="text-rose-500">*</span>
              </label>
              <input
                id="invName"
                type="text"
                maxLength={MAX_INVENTORY_NAME_LEN}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (formError) setFormError(null);
                }}
                placeholder="যেমন: হ্যান্ডওয়াশ, টিস্যু রোল, ডিশওয়াশ লিকুইড..."
                className="w-full bg-[#F9FAFB] border border-neutral-200 rounded-lg px-3.5 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:border-[#F26522]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="invQty" className="block text-xs font-semibold text-neutral-700">
                বর্তমান পরিমাণ <span className="text-rose-500">*</span>
              </label>
              <input
                id="invQty"
                type="number"
                min={0}
                max={MAX_INVENTORY_QTY}
                step="any"
                value={qtyInput}
                onChange={(e) => {
                  setQtyInput(e.target.value);
                  if (formError) setFormError(null);
                }}
                placeholder="যেমন: ৫ বা ২.৫"
                className="w-full bg-[#F9FAFB] border border-neutral-200 rounded-lg px-3.5 py-2 text-sm font-mono-num font-bold text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:border-[#F26522]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="block text-xs font-semibold text-neutral-700">একক (Unit)</span>
            <div className="flex flex-wrap items-center gap-2">
              {INVENTORY_UNITS.map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUnit(u)}
                  className={`px-3.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    unit === u
                      ? 'bg-[#F26522] border-[#F26522] text-white'
                      : 'bg-[#F9FAFB] border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
            <div className="flex-1 space-y-1.5">
              <label htmlFor="invNote" className="block text-xs font-semibold text-neutral-700">
                বিবরণ / সংরক্ষণ স্থান <span className="font-normal text-neutral-400">(ঐচ্ছিক)</span>
              </label>
              <input
                id="invNote"
                type="text"
                maxLength={MAX_INVENTORY_NOTE_LEN}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="যেমন: স্টোর রুমের তাক ২ বা প্রতি বোতল ৫০০ মি.লি."
                className="w-full bg-[#F9FAFB] border border-neutral-200 rounded-lg px-3.5 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:border-[#F26522]"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg bg-[#F26522] hover:bg-[#DC5214] disabled:opacity-60 text-white text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              {submitting ? 'যুক্ত হচ্ছে...' : 'তালিকায় যুক্ত করুন'}
            </button>
          </div>

          {formError && (
            <div className="text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
              {formError}
            </div>
          )}
        </form>
      )}

      {/* সার্চ ও একক ফিল্টার */}
      <div className="bg-white border border-neutral-200 rounded-xl p-3.5 space-y-3 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="জিনিসের নাম বা একক দিয়ে খুঁজুন..."
            className="w-full bg-[#F9FAFB] border border-neutral-200 rounded-lg pl-9 pr-3.5 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:border-[#F26522]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {(['সবগুলো', ...INVENTORY_UNITS] as const).map((u) => {
            const active = unitFilter === u;
            return (
              <button
                key={u}
                type="button"
                onClick={() => setUnitFilter(u)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-[#F26522] border-[#F26522] text-white'
                    : 'bg-[#F9FAFB] border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                {u}
              </button>
            );
          })}
        </div>
      </div>

      {/* স্টক তালিকা */}
      {filteredItems.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-xl p-8 text-center text-sm text-neutral-500 shadow-xs">
          {items.length === 0
            ? 'এখনো কোনো স্টক বা মজুত আইটেম যুক্ত করা হয়নি'
            : 'নির্বাচিত ফিল্টারে কোনো জিনিস পাওয়া যায়নি'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredItems.map((item) => {
            const isEditing = editingId === item.id;
            const isBusy = busyId === item.id;
            const stepSize = item.unit === 'লিটার' || item.unit === 'কেজি' ? 0.5 : 1;
            const isOutOfStock = item.quantity <= 0;

            return (
              <div
                key={item.id}
                className={`bg-white border rounded-xl p-4 flex flex-col justify-between gap-3 shadow-xs transition-colors ${
                  isOutOfStock ? 'border-rose-300' : 'border-neutral-200'
                }`}
              >
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        maxLength={MAX_INVENTORY_NAME_LEN}
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="bg-[#F9FAFB] border border-neutral-200 rounded-lg px-3 py-1.5 text-sm text-neutral-900 focus:bg-white focus:outline-none focus:border-[#F26522]"
                        placeholder="জিনিসের নাম"
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          max={MAX_INVENTORY_QTY}
                          step="any"
                          value={editQty}
                          onChange={(e) => setEditQty(e.target.value)}
                          className="w-24 bg-[#F9FAFB] border border-neutral-200 rounded-lg px-2.5 py-1.5 text-sm font-mono-num font-bold text-neutral-900 focus:bg-white focus:outline-none focus:border-[#F26522]"
                        />
                        <select
                          value={editUnit}
                          onChange={(e) => setEditUnit(e.target.value as InventoryUnit)}
                          className="flex-1 bg-[#F9FAFB] border border-neutral-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-neutral-900 focus:bg-white focus:outline-none focus:border-[#F26522]"
                        >
                          {INVENTORY_UNITS.map((u) => (
                            <option key={u} value={u}>
                              {u}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <input
                      type="text"
                      maxLength={MAX_INVENTORY_NOTE_LEN}
                      value={editNote}
                      onChange={(e) => setEditNote(e.target.value)}
                      placeholder="নোট (ঐচ্ছিক)"
                      className="w-full bg-[#F9FAFB] border border-neutral-200 rounded-lg px-3 py-1.5 text-xs text-neutral-800 focus:bg-white focus:outline-none focus:border-[#F26522]"
                    />

                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-neutral-200 text-xs font-semibold text-neutral-700 hover:bg-neutral-100"
                      >
                        <X className="w-3.5 h-3.5" />
                        বাতিল
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => void handleSaveEdit(item)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white"
                      >
                        <Check className="w-3.5 h-3.5" />
                        সংরক্ষণ
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <div className="text-base font-bold text-neutral-900 break-words">
                          {item.name}
                        </div>
                        {item.note && (
                          <div className="text-xs text-neutral-500 break-words">{item.note}</div>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <div
                          className={`text-xl font-bold font-mono-num ${
                            isOutOfStock ? 'text-rose-600' : 'text-emerald-600'
                          }`}
                        >
                          {formatStockQty(item.quantity)}{' '}
                          <span className="text-sm font-semibold">{item.unit}</span>
                        </div>
                        <div className="text-[11px] text-neutral-500">
                          {isOutOfStock ? 'স্টক শেষ' : 'মজুত আছে'}
                        </div>
                      </div>
                    </div>

                    {canEdit && (
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-neutral-100">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={isBusy || item.quantity <= 0}
                            onClick={() => void handleAdjustQty(item, -stepSize)}
                            aria-label="পরিমাণ কমান"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#F9FAFB] border border-neutral-200 hover:border-amber-500 text-neutral-700 disabled:opacity-40 text-xs font-mono-num font-semibold transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5" />
                            {stepSize}
                          </button>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => void handleAdjustQty(item, stepSize)}
                            aria-label="পরিমাণ বাড়ান"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#F9FAFB] border border-neutral-200 hover:border-emerald-500 text-neutral-700 disabled:opacity-40 text-xs font-mono-num font-semibold transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            {stepSize}
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => startEdit(item)}
                            aria-label="তথ্য পরিবর্তন করুন"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#F9FAFB] border border-neutral-200 hover:bg-neutral-100 text-neutral-700 text-xs font-semibold transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            এডিট
                          </button>
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => setDeleteTarget(item)}
                            aria-label="আইটেম মুছুন"
                            className="p-1.5 rounded-lg bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-600 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="স্টক আইটেম মুছবেন?"
        message="এই জিনিসটি স্থায়ীভাবে মজুত তালিকা থেকে মুছে ফেলা হবে।"
        confirmLabel="হ্যাঁ, মুছে ফেলুন"
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
