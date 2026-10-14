import crypto from 'crypto';

/**
 * Normalizes phone numbers to standard format (e.g. 01XXXXXXXXX for Bangladesh)
 */
export function normalizePhone(phone: string): string {
  if (!phone) return '';
  let cleaned = phone.replace(/[\s\-\(\)]/g, '').trim();

  if (cleaned.startsWith('+880')) {
    cleaned = '0' + cleaned.slice(4);
  } else if (cleaned.startsWith('880')) {
    cleaned = '0' + cleaned.slice(3);
  } else if (cleaned.startsWith('+88')) {
    cleaned = cleaned.slice(3);
  }

  return cleaned;
}

/**
 * Validates Bangladeshi mobile phone number (11 digits, starts with 01[3-9])
 */
export function isValidBDPhone(phone: string): boolean {
  const cleaned = normalizePhone(phone);
  return /^01[3-9]\d{8}$/.test(cleaned);
}

/**
 * Hashes password securely using Node.js built-in scrypt
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verifies password against salt and hash
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, key] = storedHash.split(':');
    if (!salt || !key) return false;
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(key, 'hex'));
  } catch {
    return false;
  }
}
