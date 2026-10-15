import crypto from 'crypto';

/**
 * Bunny.net Stream Configuration & Token Authentication Utilities
 */
export const BUNNY_STREAM_LIBRARY_ID = process.env.BUNNY_STREAM_LIBRARY_ID || '345678';
export const BUNNY_STREAM_API_KEY = process.env.BUNNY_STREAM_API_KEY || '';
export const BUNNY_STREAM_TOKEN_KEY = process.env.BUNNY_STREAM_TOKEN_KEY || 'bunny-drm-secret-token-key';
export const BUNNY_STREAM_CDN_HOSTNAME = process.env.BUNNY_STREAM_CDN_HOSTNAME || 'iframe.mediadelivery.net';

export interface BunnyParsedVideo {
  libraryId: string;
  videoId: string;
}

/**
 * Detects whether a URL or lesson reference is a Bunny.net Stream video
 */
export function parseBunnyVideoUrl(url?: string): BunnyParsedVideo | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // Pattern 1: iframe.mediadelivery.net/embed/{libraryId}/{videoId}
  const embedMatch = trimmed.match(/mediadelivery\.net\/embed\/(\d+)\/([a-zA-Z0-9_-]+)/i);
  if (embedMatch && embedMatch[1] && embedMatch[2]) {
    return { libraryId: embedMatch[1], videoId: embedMatch[2] };
  }

  // Pattern 2: video.bunnycdn.com/play/{libraryId}/{videoId}
  const playMatch = trimmed.match(/video\.bunnycdn\.com\/play\/(\d+)\/([a-zA-Z0-9_-]+)/i);
  if (playMatch && playMatch[1] && playMatch[2]) {
    return { libraryId: playMatch[1], videoId: playMatch[2] };
  }

  // Pattern 3: Custom bunny scheme "bunny:{libraryId}:{videoId}"
  const customScheme = trimmed.match(/^bunny:(\d+):([a-zA-Z0-9_-]+)$/i);
  if (customScheme && customScheme[1] && customScheme[2]) {
    return { libraryId: customScheme[1], videoId: customScheme[2] };
  }

  return null;
}

/**
 * Generate Bunny.net Stream DRM signed embed URL using HMAC SHA-256 token authentication
 * Token formula: SHA256(tokenSecurityKey + videoId + expires)
 */
export function generateBunnySignedEmbedUrl(
  libraryId: string,
  videoId: string,
  expiresInSeconds = 14400 // Default 4 hours
): {
  embedUrl: string;
  token: string;
  expires: number;
} {
  const tokenKey = BUNNY_STREAM_TOKEN_KEY;
  const expires = Math.floor(Date.now() / 1000) + expiresInSeconds;

  // Bunny.net Stream token authentication SHA256 signature
  const hashData = `${tokenKey}${videoId}${expires}`;
  const token = crypto.createHash('sha256').update(hashData).digest('hex');

  const embedUrl = `https://${BUNNY_STREAM_CDN_HOSTNAME}/embed/${libraryId}/${videoId}?token=${token}&expires=${expires}&autoplay=true`;

  return {
    embedUrl,
    token,
    expires,
  };
}

/**
 * Generate Bunny.net HLS playlist URL with signed authorization token
 */
export function generateBunnyHlsPlaylistUrl(
  libraryId: string,
  videoId: string,
  expiresInSeconds = 14400
): string {
  const tokenKey = BUNNY_STREAM_TOKEN_KEY;
  const expires = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const hashData = `${tokenKey}${videoId}${expires}`;
  const token = crypto.createHash('sha256').update(hashData).digest('hex');

  return `https://video.bunnycdn.com/play/${libraryId}/${videoId}/playlist.m3u8?token=${token}&expires=${expires}`;
}

/**
 * Upload raw video buffer to Bunny.net Stream API and obtain transcoded encrypted video GUID
 */
export async function uploadVideoToBunny(
  fileBuffer: Buffer,
  title: string,
  customLibraryId?: string
): Promise<{
  success: boolean;
  libraryId: string;
  videoId: string;
  embedUrl: string;
  error?: string;
}> {
  const libraryId = customLibraryId || BUNNY_STREAM_LIBRARY_ID;
  const apiKey = BUNNY_STREAM_API_KEY;

  if (!apiKey) {
    // Graceful fallback for local development / testing without live Bunny account
    const mockGuid = `bunny-drm-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const { embedUrl } = generateBunnySignedEmbedUrl(libraryId, mockGuid);
    return {
      success: true,
      libraryId,
      videoId: mockGuid,
      embedUrl,
    };
  }

  try {
    // 1. Create Video Object in Bunny Stream Library
    const createRes = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos`, {
      method: 'POST',
      headers: {
        AccessKey: apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title: title || 'e-Shikho Lecture Video' }),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      throw new Error(`Failed to create Bunny video: ${errText}`);
    }

    const createData = (await createRes.json()) as { guid: string };
    const videoId = createData.guid;

    // 2. Upload Video Binary Data to Bunny Storage
    const uploadRes = await fetch(
      `https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`,
      {
        method: 'PUT',
        headers: {
          AccessKey: apiKey,
          'Content-Type': 'application/octet-stream',
        },
        body: new Uint8Array(fileBuffer),
      }
    );

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      throw new Error(`Failed to upload binary to Bunny: ${errText}`);
    }

    const { embedUrl } = generateBunnySignedEmbedUrl(libraryId, videoId);

    return {
      success: true,
      libraryId,
      videoId,
      embedUrl,
    };
  } catch (error: any) {
    console.error('Bunny.net Stream upload error:', error);
    return {
      success: false,
      libraryId,
      videoId: '',
      embedUrl: '',
      error: error.message || 'Bunny video upload failed',
    };
  }
}
