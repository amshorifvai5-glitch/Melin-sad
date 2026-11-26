import React, { useState } from 'react';
import { Smartphone, WifiOff, X } from 'lucide-react';
import { useOnlineStatus } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'header' | 'sidebar';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'sidebar' }) => {
  const [showNoticeModal, setShowNoticeModal] = useState(false);

  if (variant === 'header') {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowNoticeModal(true)}
        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold transition-colors whitespace-nowrap"
      >
        <Smartphone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        আপডেট কাজ চলমান আছে
      </button>

      {showNoticeModal && (
        <div
          onClick={() => setShowNoticeModal(false)}
          className="fixed inset-0 bg-slate-950/50 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#101829] border border-slate-800 rounded-xl max-w-sm w-full p-5 shadow-2xl space-y-4 text-slate-100"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  আপডেট কাজ চলমান আছে
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
                  মোবাইল অ্যাপের আপডেট কাজ চলমান আছে। খুব শীঘ্রই এটি ব্যবহার করা যাবে।
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowNoticeModal(false)}
                aria-label="বন্ধ করুন"
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowNoticeModal(false)}
              className="w-full py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs sm:text-sm font-semibold transition-colors"
            >
              বুঝেছি
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg border border-amber-500">
      <WifiOff className="w-3.5 h-3.5 shrink-0" />
      <span>অফলাইন মোড — সংরক্ষিত তথ্য দেখানো হচ্ছে</span>
    </div>
  );
};
