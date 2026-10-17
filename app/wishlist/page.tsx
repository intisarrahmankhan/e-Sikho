import React from 'react';
import { auth } from '@/auth';
import { getWishlistCoursesAction } from '@/actions/wishlist';
import { WishlistClient } from '@/components/wishlist/WishlistClient';

export const dynamic = 'force-dynamic';

export default async function WishlistPage() {
  const session = await auth();
  const isLoggedIn = Boolean(session && session.user);

  let initialCourses: any[] = [];
  if (isLoggedIn) {
    const res = await getWishlistCoursesAction();
    if (res.success && res.courses) {
      initialCourses = res.courses;
    }
  }

  return (
    <WishlistClient
      initialCourses={initialCourses}
      isLoggedIn={isLoggedIn}
    />
  );
}
