import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import { isValidMongoObjectId } from '@/lib/auth-helpers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const email = (session.user as any).email;

    await dbConnect();
    const query = isValidMongoObjectId(userId) ? { _id: userId } : { email };
    const user = await User.findOne(query).select('role status name').lean() as any;

    if (!user) {
      return NextResponse.json({ authenticated: true, role: (session.user as any).role || 'STUDENT' });
    }

    return NextResponse.json({
      authenticated: true,
      role: user.role || 'STUDENT',
      status: user.status || 'APPROVED',
      name: user.name,
      sessionRole: (session.user as any).role,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to check role' }, { status: 500 });
  }
}
