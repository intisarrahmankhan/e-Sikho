import { afterEach, describe, expect, it, vi } from 'vitest';
import { sendOtpSms } from '@/lib/sms';

describe('SMS verification delivery', () => {
  afterEach(() => vi.unstubAllEnvs());

  it.each(['production', 'development'] as const)('only permits an explicit local demo, including in %s', async (mode) => {
    vi.stubEnv('NODE_ENV', mode);
    vi.stubEnv('GREENWEB_SMS_API_KEY', undefined);
    vi.stubEnv('BULKSMSBD_API_KEY', undefined);
    vi.stubEnv('ALLOW_DEV_OTP', 'false');
    const disabled = await sendOtpSms('01700000000', '123456', 'LOGIN');
    expect(disabled.success).toBe(false);
    expect(disabled.devCode).toBeUndefined();

    vi.stubEnv('ALLOW_DEV_OTP', 'true');
    const enabled = await sendOtpSms('01700000000', '123456', 'LOGIN');
    expect(enabled.success).toBe(mode === 'development');
    expect(enabled.devCode).toBe(mode === 'development' ? '123456' : undefined);
  });
});
