'use server';

import { signIn } from '@/auth';

export async function loginWithGoogle(callbackUrl: string) {
  await signIn('google', { redirectTo: callbackUrl });
}

export async function loginAsDeveloper(role: string, callbackUrl: string) {
  await signIn('credentials', { role, redirectTo: callbackUrl });
}
