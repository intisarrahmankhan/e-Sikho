import React from 'react';
import { Loader } from '@/components/ui/Loader';

export default function RootLoading() {
  return (
    <div className="min-h-[60vh] w-full flex items-center justify-center p-6 animate-in fade-in duration-150">
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-slate-200/80 shadow-sm flex flex-col items-center">
        <Loader
          text="লোড হচ্ছে..."
          subtext="পৃষ্ঠাটি প্রস্তুত করা হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন"
          size="lg"
        />
      </div>
    </div>
  );
}
