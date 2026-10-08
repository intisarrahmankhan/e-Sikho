'use server';

import { signIn } from '@/auth';

import { AuthError } from 'next-auth';
import { redirect } from 'next/navigation';

export async function loginWithGoogle(callbackUrl: string) {
  await signIn('google', { redirectTo: callbackUrl });
}

export async function loginWithCredentials(formData: FormData, callbackUrl: string) {
  try {
    await signIn('credentials', {
      ...Object.fromEntries(formData),
      redirectTo: callbackUrl,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === 'CredentialsSignin') {
        redirect('/login?error=CredentialsSignin&callbackUrl=' + encodeURIComponent(callbackUrl));
      }
      redirect('/login?error=Default&callbackUrl=' + encodeURIComponent(callbackUrl));
    }
    throw error; // Rethrow other errors (like NEXT_REDIRECT)
  }
}
