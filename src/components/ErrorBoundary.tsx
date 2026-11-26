import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'একটি অপ্রত্যাশিত ত্রুটি ঘটেছে।',
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen portal-canvas flex items-center justify-center p-4">
          <div className="bg-[#101829] border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 text-center shadow-2xl">
            <h2 className="text-lg font-bold text-white">তথ্য লোড বা সংরক্ষণে সমস্যা হয়েছে</h2>
            <p className="text-sm text-slate-400">
              দয়া করে পেজটি রিফ্রেশ করুন। সমস্যা থাকলে অ্যাডমিন অ্যাকাউন্ট দিয়ে পুনরায় সাইন ইন করুন।
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold transition-colors"
            >
              পেজ রিফ্রেশ করুন
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
