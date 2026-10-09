import { describe, it, expect } from 'vitest';
import { normalizePhone, isValidBDPhone, hashPassword, verifyPassword } from '@/lib/auth-helpers';

describe('auth-helpers', () => {
  describe('normalizePhone', () => {
    it('normalizes local 11-digit Bangladeshi number', () => {
      expect(normalizePhone('01712345678')).toBe('01712345678');
      expect(normalizePhone('018-1234-5678')).toBe('01812345678');
      expect(normalizePhone('019 1234 5678')).toBe('01912345678');
    });

    it('normalizes numbers starting with +880 or 880', () => {
      expect(normalizePhone('+8801712345678')).toBe('01712345678');
      expect(normalizePhone('8801712345678')).toBe('01712345678');
    });
  });

  describe('isValidBDPhone', () => {
    it('validates correct Bangladeshi phone numbers', () => {
      expect(isValidBDPhone('01712345678')).toBe(true);
      expect(isValidBDPhone('+8801812345678')).toBe(true);
      expect(isValidBDPhone('01312345678')).toBe(true);
      expect(isValidBDPhone('01912345678')).toBe(true);
    });

    it('rejects invalid phone numbers', () => {
      expect(isValidBDPhone('01212345678')).toBe(false); // invalid operator prefix 012
      expect(isValidBDPhone('017123456')).toBe(false); // too short
      expect(isValidBDPhone('abcdefghijk')).toBe(false);
    });
  });

  describe('hashPassword and verifyPassword', () => {
    it('hashes and securely verifies matching passwords', () => {
      const password = 'SecretPassword123!';
      const hash = hashPassword(password);

      expect(hash).toContain(':');
      expect(verifyPassword(password, hash)).toBe(true);
      expect(verifyPassword('WrongPassword', hash)).toBe(false);
    });
  });
});
