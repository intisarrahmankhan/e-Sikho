import { PrismaClient, Role, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123456', 10);

  // 1. Existing Super Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@eshikho.com' },
    update: {
      status: UserStatus.APPROVED,
    },
    create: {
      email: 'admin@eshikho.com',
      name: 'Super Admin',
      password: hashedPassword,
      role: Role.SUPERADMIN,
      status: UserStatus.APPROVED,
    },
  });

  console.log('Super Admin ready:', admin.email);

  // 2. Pending Student Request
  const pendingStudent = await prisma.user.upsert({
    where: { email: 'rafiq.student@example.com' },
    update: {},
    create: {
      email: 'rafiq.student@example.com',
      name: 'Rafiqul Islam',
      password: hashedPassword,
      role: Role.STUDENT,
      status: UserStatus.PENDING,
    },
  });

  // 3. Pending Instructor Request
  const pendingInstructor = await prisma.user.upsert({
    where: { email: 'nusrat.teacher@example.com' },
    update: {},
    create: {
      email: 'nusrat.teacher@example.com',
      name: 'Nusrat Jahan',
      password: hashedPassword,
      role: Role.INSTRUCTOR,
      status: UserStatus.PENDING,
    },
  });

  // 4. Approved Active Student (for metrics)
  const approvedStudent = await prisma.user.upsert({
    where: { email: 'tanvir.student@example.com' },
    update: {},
    create: {
      email: 'tanvir.student@example.com',
      name: 'Tanvir Ahmed',
      password: hashedPassword,
      role: Role.STUDENT,
      status: UserStatus.APPROVED,
    },
  });

  console.log('Test pending and approved users seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });