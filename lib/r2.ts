import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const bucketName = process.env.CLOUDFLARE_R2_BUCKET || 'myecomm';
const publicUrl = (process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL || '').replace(/\/$/, '');

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: accessKeyId || '',
    secretAccessKey: secretAccessKey || '',
  },
});

/**
 * Upload a Buffer or File to Cloudflare R2
 */
export async function uploadToR2(
  fileBuffer: Buffer,
  filename: string,
  contentType: string
): Promise<string> {
  const extension = filename.split('.').pop()?.toLowerCase() || 'mp4';
  const cleanFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  const key = `videos/${Date.now()}-${Math.random().toString(36).slice(2)}-${cleanFilename}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: fileBuffer,
    ContentType: contentType || 'video/mp4',
  });

  await r2Client.send(command);

  // Return the full public URL from R2
  return `${publicUrl}/${key}`;
}

/**
 * Generate a presigned URL for direct client-side upload to Cloudflare R2
 */
export async function getR2PresignedUploadUrl(filename: string, contentType: string) {
  const cleanFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  const key = `videos/${Date.now()}-${Math.random().toString(36).slice(2)}-${cleanFilename}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType || 'video/mp4',
  });

  const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });
  const fileUrl = `${publicUrl}/${key}`;

  return { uploadUrl, fileUrl, key };
}
