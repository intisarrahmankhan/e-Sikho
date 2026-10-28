import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import crypto from 'crypto';
import { parseBunnyVideoUrl, generateBunnySignedEmbedUrl, uploadVideoToBunny } from '@/lib/bunny';
import { getSignedVideoPlaybackAction } from '@/actions/bunny-stream';
import { auth } from '@/auth';
import { getCourseAccessDetails } from '@/actions/course-access';
import Lesson from '@/models/Lesson';
import Module from '@/models/Module';

vi.mock('@/lib/mongoose', () => ({ default: vi.fn() }));
vi.mock('@/models/Course', () => ({ default: { findById: vi.fn(() => ({ lean: async () => ({ status: 'PUBLISHED' }) })) } }));
vi.mock('@/models/Lesson', () => ({ default: { findById: vi.fn() } }));
vi.mock('@/models/Module', () => ({ default: { findOne: vi.fn() } }));
vi.mock('@/actions/course-access', () => ({ getCourseAccessDetails: vi.fn() }));

const courseId = '507f1f77bcf86cd799439010';
const lessonId = '507f1f77bcf86cd799439011';
const lesson = { moduleId: '507f1f77bcf86cd799439012', title: 'Lecture', isFree: false, videoUrl: 'bunny:12345:video-guid' };

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('BUNNY_STREAM_TOKEN_KEY', 'test-signing-key');
  vi.mocked(auth).mockResolvedValue({ user: { id: 'student-1', email: 'student@example.test' } } as any);
  vi.mocked(getCourseAccessDetails).mockResolvedValue({ canAccessAll: true } as any);
  vi.mocked(Lesson.findById).mockReturnValue({ lean: async () => ({ ...lesson }) } as any);
  vi.mocked(Module.findOne).mockReturnValue({ lean: async () => ({ courseId }) } as any);
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe('Bunny signed playback', () => {
  it.each(['https://iframe.mediadelivery.net/embed/12345/video-guid', 'https://video.bunnycdn.com/play/12345/video-guid', 'bunny:12345:video-guid'])('parses %s', (url) => {
    expect(parseBunnyVideoUrl(url)).toEqual({ libraryId: '12345', videoId: 'video-guid' });
  });
  it.each(['https://attacker.test/mediadelivery.net/embed/123/video', 'https://iframe.mediadelivery.net.attacker.test/embed/123/video', 'javascript:mediadelivery.net/embed/123/video', '', 'https://youtube.com/watch?v=video'])('rejects invalid provider URL %s', (url) => {
    expect(parseBunnyVideoUrl(url)).toBeNull();
  });
  it('signs the provider-defined SHA256 payload with an expiry', () => {
    const { embedUrl, token, expires } = generateBunnySignedEmbedUrl('12345', 'video-guid', 600);
    expect(token).toBe(crypto.createHash('sha256').update(`test-signing-keyvideo-guid${expires}`).digest('hex'));
    expect(expires).toBeGreaterThan(Math.floor(Date.now() / 1000));
    expect(new URL(embedUrl).searchParams.get('token')).toBe(token);
  });
  it('refuses to sign with missing or public demo secrets', () => {
    vi.stubEnv('BUNNY_STREAM_TOKEN_KEY', '');
    expect(() => generateBunnySignedEmbedUrl('12345', 'video-guid')).toThrow('not configured');
    vi.stubEnv('BUNNY_STREAM_TOKEN_KEY', 'bunny-drm-secret-token-key');
    expect(() => generateBunnySignedEmbedUrl('12345', 'video-guid')).toThrow('not configured');
  });
  it('does not fabricate a successful upload without credentials', async () => {
    expect(await uploadVideoToBunny(Buffer.from('video'), 'Lecture')).toMatchObject({ success: false, videoId: '', embedUrl: '' });
  });
  it('uploads through both provider requests when configured', async () => {
    // Import after configuration because library and API key are module constants.
    vi.resetModules();
    vi.stubEnv('BUNNY_STREAM_API_KEY', 'test-api-key');
    vi.stubEnv('BUNNY_STREAM_LIBRARY_ID', '12345');
    const fetchMock = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ guid: 'video-guid' }) }).mockResolvedValueOnce({ ok: true });
    vi.stubGlobal('fetch', fetchMock);
    const bunny = await import('@/lib/bunny');
    expect(await bunny.uploadVideoToBunny(Buffer.from('video'), 'Lecture')).toMatchObject({ success: true, videoId: 'video-guid' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it('requires a signed-in viewer', async () => {
    vi.mocked(auth).mockResolvedValue(null as any);
    expect(await getSignedVideoPlaybackAction(courseId, lessonId)).toMatchObject({ success: false, isLocked: true });
  });
  it('blocks non-enrolled viewers of paid lessons', async () => {
    vi.mocked(getCourseAccessDetails).mockResolvedValue({ canAccessAll: false } as any);
    expect(await getSignedVideoPlaybackAction(courseId, lessonId)).toMatchObject({ success: false, isLocked: true });
  });
  it('does not let enrollment in one course unlock another course lesson', async () => {
    vi.mocked(Module.findOne).mockReturnValue({ lean: async () => null } as any);
    expect(await getSignedVideoPlaybackAction(courseId, lessonId)).toMatchObject({ success: false });
    expect(Module.findOne).toHaveBeenCalledWith({ _id: lesson.moduleId, courseId });
  });
  it('returns a signed URL and viewer watermark for an entitled viewer', async () => {
    const result = await getSignedVideoPlaybackAction(courseId, lessonId);
    expect(result.success).toBe(true);
    expect(result.playbackUrl).toContain('token=');
    expect(result.watermark?.studentId).toBe('student-1');
  });
  it('does not substitute unrelated videos for a missing lesson', async () => {
    vi.mocked(Lesson.findById).mockReturnValue({ lean: async () => null } as any);
    expect(await getSignedVideoPlaybackAction(courseId, lessonId)).toMatchObject({ success: false });
  });
  it('converts watch URLs to an embeddable player URL', async () => {
    vi.mocked(Lesson.findById).mockReturnValue({ lean: async () => ({ ...lesson, videoUrl: 'https://www.youtube.com/watch?v=abcdefghijk' }) } as any);
    expect(await getSignedVideoPlaybackAction(courseId, lessonId)).toMatchObject({ success: true, playbackUrl: 'https://www.youtube.com/embed/abcdefghijk' });
  });
});
