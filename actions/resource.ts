'use server';

import dbConnect from '@/lib/mongoose';
import LessonResource from '@/models/LessonResource';
import { revalidatePath } from 'next/cache';
import xss from 'xss';

export async function addLessonResource(data: {
  title: string;
  content: string;
  moduleId: string;
  userId: string;
  isPublic: boolean;
  attachments?: string[];
}) {
  try {
    await dbConnect();
    
    // Input sanitization to prevent XSS
    const sanitizedContent = xss(data.content);
    const sanitizedTitle = xss(data.title);

    const resource = await LessonResource.create({
      title: sanitizedTitle,
      content: sanitizedContent,
      moduleId: data.moduleId,
      userId: data.userId,
      isPublic: data.isPublic,
      attachments: data.attachments || [],
    });
    
    revalidatePath(`/modules/${data.moduleId}`);
    return { success: true, resource: JSON.parse(JSON.stringify(resource)) };
  } catch (error) {
    console.error('Failed to add lesson resource:', error);
    return { success: false, error: 'Failed to add resource' };
  }
}
