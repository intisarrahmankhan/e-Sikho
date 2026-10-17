'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { Heart, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toggleWishlistAction, getUserWishlistIdsAction } from '@/actions/wishlist';
import { useLanguage } from '@/context/LanguageContext';

interface WishlistButtonProps {
  courseId: string;
  initialWishlisted?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  onToggle?: (isWishlisted: boolean) => void;
}

export function WishlistButton({
  courseId,
  initialWishlisted,
  className = '',
  size = 'md',
  showLabel = false,
  onToggle,
}: WishlistButtonProps) {
  const [isWishlisted, setIsWishlisted] = useState(Boolean(initialWishlisted));
  const [isPending, startTransition] = useTransition();
  const [animate, setAnimate] = useState(false);
  const router = useRouter();
  const { language } = useLanguage();

  useEffect(() => {
    if (initialWishlisted !== undefined) {
      setIsWishlisted(initialWishlisted);
      return;
    }

    let isMounted = true;
    getUserWishlistIdsAction().then((res) => {
      if (isMounted && res.success && res.wishlistIds) {
        setIsWishlisted(res.wishlistIds.includes(courseId));
      }
    });

    return () => {
      isMounted = false;
    };
  }, [courseId, initialWishlisted]);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Optimistic toggle
    const nextState = !isWishlisted;
    setIsWishlisted(nextState);
    setAnimate(true);
    setTimeout(() => setAnimate(false), 400);

    startTransition(async () => {
      const res = await toggleWishlistAction(courseId);
      if (res.error === 'NOT_AUTHENTICATED') {
        // Revert and redirect to login
        setIsWishlisted(isWishlisted);
        router.push(`/login?callbackUrl=/courses/${courseId}`);
        return;
      }

      if (res.error) {
        // Revert on error
        setIsWishlisted(isWishlisted);
      } else if (res.success && res.isWishlisted !== undefined) {
        setIsWishlisted(res.isWishlisted);
        if (onToggle) onToggle(res.isWishlisted);
      }
    });
  };

  const iconSizes = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const buttonPaddings = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5',
  };

  const labelText = isWishlisted
    ? language === 'en' ? 'Wishlisted' : 'উইশলিস্টে আছে'
    : language === 'en' ? 'Add to Wishlist' : 'উইশলিস্টে রাখুন';

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      title={labelText}
      aria-label={labelText}
      className={`relative inline-flex items-center justify-center gap-1.5 rounded-full transition-all duration-200 focus:outline-none select-none ${
        showLabel
          ? `px-3.5 py-2 rounded-xl text-xs font-bold border ${
              isWishlisted
                ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100 shadow-xs'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
            }`
          : `${buttonPaddings[size]} backdrop-blur-md shadow-xs ${
              isWishlisted
                ? 'bg-rose-50/95 text-rose-500 hover:bg-rose-100 border border-rose-200/80 shadow-rose-200/50'
                : 'bg-white/90 text-slate-500 hover:text-rose-500 hover:bg-white border border-white/60 hover:border-rose-100'
            }`
      } ${className}`}
    >
      <Heart
        className={`${iconSizes[size]} transition-transform duration-300 ${
          animate ? 'scale-125' : 'scale-100'
        } ${
          isWishlisted
            ? 'fill-rose-500 text-rose-500'
            : 'text-current hover:scale-110'
        }`}
      />
      {showLabel && <span>{labelText}</span>}
    </button>
  );
}

export default WishlistButton;
