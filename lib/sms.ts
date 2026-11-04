/**
 * SMS sender utility supporting Bangladeshi SMS gateways.
 */

export interface SendSmsResult {
  success: boolean;
  message?: string;
  error?: string;
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
        signal: AbortSignal.timeout(10000),
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
  if (process.env.BULKSMSBD_API_KEY && process.env.BULKSMSBD_SENDER_ID) {
    try {
      const formattedPhone = phone.startsWith('880') ? phone : phone.startsWith('0') ? `88${phone}` : phone;
      const res = await fetch('https://bulksmsbd.net/api/smsapi', {
        method: 'POST',
        signal: AbortSignal.timeout(10000),
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: process.env.BULKSMSBD_API_KEY,
          type: 'text',
          number: formattedPhone,
          senderid: process.env.BULKSMSBD_SENDER_ID,
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

  return { success: false, error: 'The verification SMS could not be sent. Please try again later or contact support.' };
}
