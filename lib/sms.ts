/**
 * SMS sender utility supporting Bangladeshi SMS gateways and fallback for development
 */

export interface SendSmsResult {
  success: boolean;
  message?: string;
  error?: string;
  devCode?: string;
}

export async function sendOtpSms(phone: string, otp: string, purpose: 'SIGNUP' | 'LOGIN' = 'SIGNUP'): Promise<SendSmsResult> {
  const purposeBangla = purpose === 'SIGNUP' ? 'অ্যাকাউন্ট ভেরিফিকেশন' : 'লগইন';
  const smsBody = `e-Shikho: আপনার ${purposeBangla} ওটিপি কোড হলো ${otp}। এটি ৫ মিনিটের জন্য কার্যকর থাকবে। কাউকে কোডটি বলবেন না।`;

  // Check for Greenweb BD Gateway
  if (process.env.GREENWEB_SMS_API_KEY) {
    try {
      const formattedPhone = phone.startsWith('880') ? phone : phone.startsWith('0') ? `88${phone}` : phone;
      const res = await fetch('https://api.greenweb.com.bd/api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          token: process.env.GREENWEB_SMS_API_KEY,
          to: formattedPhone,
          message: smsBody,
        }),
      });
      const data = await res.text();
      if (!res.ok || !data.startsWith('Ok:')) throw new Error('SMS gateway rejected the request.');
      return { success: true, message: 'SMS পাঠানো হয়েছে।' };
    } catch (err: any) {
      console.error('Greenweb SMS send error:', err?.message);
    }
  }

  // Check for BulkSMSBD Gateway
  if (process.env.BULKSMSBD_API_KEY) {
    try {
      const formattedPhone = phone.startsWith('880') ? phone : phone.startsWith('0') ? `88${phone}` : phone;
      const res = await fetch('https://bulksmsbd.net/api/smsapi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: process.env.BULKSMSBD_API_KEY,
          type: 'text',
          number: formattedPhone,
          senderid: process.env.BULKSMSBD_SENDER_ID || 'eShikho',
          message: smsBody,
        }),
      });
      const data = await res.json();
      if (!res.ok || Number(data.response_code) !== 202) throw new Error('SMS gateway rejected the request.');
      return { success: true, message: 'SMS পাঠানো হয়েছে।' };
    } catch (err: any) {
      console.error('BulkSMSBD SMS send error:', err?.message);
    }
  }

  if (process.env.NODE_ENV === 'development') return { success: true, devCode: otp, message: 'Development OTP (SMS not sent).' };
  return { success: false, error: 'SMS delivery is not configured or failed.' };
}
