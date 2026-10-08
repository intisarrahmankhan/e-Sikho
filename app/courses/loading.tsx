import React from 'react';
import { Loader } from '@/components/ui/Loader';

export default function CoursesLoading() {
  return (
    <div className="min-h-[55vh] w-full flex items-center justify-center p-6 animate-in fade-in duration-150">
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 border border-slate-200/80 shadow-sm flex flex-col items-center">
        <Loader
          text="কোর্সসমূহ লোড হচ্ছে..."
          subtext="কোর্স ক্যাটালগ প্রস্তুত করা হচ্ছে"
          size="lg"
        />
      </div>
    </div>
  );
}
