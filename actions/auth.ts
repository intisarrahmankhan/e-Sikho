'use server';

import { signIn } from '@/auth';

export async function loginWithGoogle(callbackUrl: string) {
  await signIn('google', { redirectTo: callbackUrl });
}
