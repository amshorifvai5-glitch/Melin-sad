import React, { useEffect, useRef, useState } from 'react';
import { PROFILE_INFO } from '../data/portalData';
import { Avatar } from './Avatar';

interface OpeningIntroProps {
  profilePhoto: string | null;
  onFinish: () => void;
}

export const OpeningIntro: React.FC<OpeningIntroProps> = ({ profilePhoto, onFinish }) => {
  const [exiting, setExiting] = useState(false);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;
  const skipTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      onFinishRef.current();
      return;
    }

    const exitTimer = window.setTimeout(() => {
      setExiting(true);
    }, 1450);

    const doneTimer = window.setTimeout(() => {
      onFinishRef.current();
    }, 1850);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(doneTimer);
      if (skipTimerRef.current !== null) {
        window.clearTimeout(skipTimerRef.current);
      }
    };
  }, []);

  const handleSkip = () => {
    if (exiting) return;
    setExiting(true);
    skipTimerRef.current = window.setTimeout(() => {
      onFinishRef.current();
    }, 220);
  };

  return (
    <div
      role="status"
      aria-label="পোর্টাল চালু হচ্ছে"
      className={`fixed inset-0 z-[80] flex flex-col items-center justify-center px-6 bg-[#0B0B0D] text-white overflow-hidden transition-all duration-400 ease-out ${
        exiting ? 'opacity-0 -translate-y-4 pointer-events-none' : 'opacity-100 translate-y-0'
      }`}
    >
      {/* জেট ব্ল্যাক, কমলা ও ডিপ নেভি ব্যাকগ্রাউন্ড গ্লো */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 65% 45% at 22% 18%, rgba(242, 101, 34, 0.22), transparent 62%), radial-gradient(ellipse 65% 45% at 82% 82%, rgba(10, 46, 109, 0.35), transparent 65%)',
        }}
      />

      {/* ডান উপরের স্কিপ বাটন */}
      <button
        type="button"
        onClick={handleSkip}
        className="absolute top-5 right-5 z-10 px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/15 border border-white/15 text-xs font-semibold text-neutral-300 hover:text-white transition-colors"
      >
        এড়িয়ে যান
      </button>

      <div className="relative z-10 flex flex-col items-center text-center max-w-md w-full">
        {/* প্রোফাইল অ্যাভাটার ও কমলা অরবিটাল রিং */}
        <div className="relative flex items-center justify-center animate-opening-logo">
          <svg
            aria-hidden="true"
            viewBox="0 0 112 112"
            className="w-28 h-28 animate-opening-ring"
          >
            <circle
              cx="56"
              cy="56"
              r="52"
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="2.5"
            />
            <circle
              cx="56"
              cy="56"
              r="52"
              fill="none"
              stroke="#F26522"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="110 220"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <Avatar
              src={profilePhoto}
              alt={PROFILE_INFO.displayNameEn}
              sizeClass="w-20 h-20"
              roundedClass="rounded-2xl"
            />
          </div>
        </div>

        {/* শিরোনাম ও পরিচিতি */}
        <div className="mt-6 space-y-2">
          <div className="animate-opening-title text-xs font-semibold tracking-wide text-[#F26522]">
            স্বাগতম · {PROFILE_INFO.department}
          </div>
          <h1 className="animate-opening-title text-2xl sm:text-3xl font-bold text-white tracking-tight text-balance">
            দৈনিক কাজের রিপোর্ট পোর্টাল
          </h1>
          <div className="animate-opening-subtitle flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm text-neutral-400">
            <span className="font-semibold text-neutral-200">{PROFILE_INFO.displayNameEn}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-num">ID {PROFILE_INFO.employeeId}</span>
            <span aria-hidden="true">·</span>
            <span>{PROFILE_INFO.workplace}</span>
          </div>
        </div>

        {/* প্রগ্রেস বার */}
        <div className="mt-7 w-52 sm:w-60 h-1 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full w-full bg-gradient-to-r from-[#F26522] to-[#FF8A4C] rounded-full animate-opening-bar" />
        </div>
      </div>
    </div>
  );
};
