import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { uploadToR2, getR2PresignedUploadUrl } from '@/lib/r2';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const user = session?.user as { id?: string; role?: string } | undefined;

    if (!user?.id || (user.role !== 'INSTRUCTOR' && user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
      return NextResponse.json({ error: 'Unauthorized. Instructors only.' }, { status: 401 });
    }

    const contentTypeHeader = req.headers.get('content-type') || '';

    // Handle presigned URL request for large video client uploads
    if (contentTypeHeader.includes('application/json')) {
      const body = await req.json();
      const { filename, contentType } = body;

      if (!filename) {
        return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
      }

      const presigned = await getR2PresignedUploadUrl(filename, contentType || 'video/mp4');
      return NextResponse.json({
        success: true,
        uploadUrl: presigned.uploadUrl,
        fileUrl: presigned.fileUrl,
        key: presigned.key,
      });
    }

    // Handle Direct Multipart FormData Upload
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate video file
    if (!file.type.startsWith('video/') && !file.name.match(/\.(mp4|webm|mov|mkv|avi|m4v)$/i)) {
      return NextResponse.json({ error: 'Uploaded file must be a video.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const videoUrl = await uploadToR2(buffer, file.name, file.type || 'video/mp4');

    return NextResponse.json({
      success: true,
      videoUrl,
      filename: file.name,
      size: file.size,
    });
  } catch (error: any) {
    console.error('Cloudflare R2 Upload Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload video to Cloudflare R2' },
      { status: 500 }
    );
  }
}
