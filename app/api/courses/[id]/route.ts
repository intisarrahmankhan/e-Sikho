import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const course = await prisma.course.findFirst({ where: { id: params.id, approvalStatus: 'APPROVED' }, include: { instructor: true, modules: { include: { lessons: true }, orderBy: { order: 'asc' } } } });
  return course ? NextResponse.json(course) : NextResponse.json({ error: 'Course not found' }, { status: 404 });
}
