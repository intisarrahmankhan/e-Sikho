import { describe, it, expect } from 'vitest';
import { normalizePhone, isValidBDPhone, hashPassword, verifyPassword, isValidMongoObjectId } from '@/lib/auth-helpers';

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

  describe('isValidMongoObjectId', () => {
    it('accepts valid 24-character hexadecimal MongoDB ObjectIds', () => {
      expect(isValidMongoObjectId('65f000000000000000000001')).toBe(true);
      expect(isValidMongoObjectId('507f1f77bcf86cd799439011')).toBe(true);
    });

    it('rejects UUID strings and prevents Mongoose CastError', () => {
      expect(isValidMongoObjectId('89ec140b-e56a-4cd9-a75b-ddf7cb80b754')).toBe(false);
      expect(isValidMongoObjectId('student@example.com')).toBe(false);
      expect(isValidMongoObjectId('student-1')).toBe(false);
      expect(isValidMongoObjectId(null)).toBe(false);
      expect(isValidMongoObjectId(undefined)).toBe(false);
      expect(isValidMongoObjectId('')).toBe(false);
    });
  });
});

