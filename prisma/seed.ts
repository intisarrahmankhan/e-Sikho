import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('admin123456', 10);
  const instructorPassword = await bcrypt.hash('instructor123', 10);
  const studentPassword = await bcrypt.hash('student123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@eshikho.com' },
    update: {
      password: adminPassword,
      role: 'SUPERADMIN',
    },
    create: {
      email: 'admin@eshikho.com',
      name: 'Super Admin',
      password: adminPassword,
      role: 'SUPERADMIN',
    },
  });

  const instructor = await prisma.user.upsert({
    where: { email: 'instructor@eshikho.com' },
    update: {
      password: instructorPassword,
      role: 'INSTRUCTOR',
    },
    create: {
      email: 'instructor@eshikho.com',
      name: 'Tariq Instructor',
      password: instructorPassword,
      role: 'INSTRUCTOR',
    },
  });

  const student = await prisma.user.upsert({
    where: { email: 'student@eshikho.com' },
    update: {
      password: studentPassword,
      role: 'STUDENT',
    },
    create: {
      email: 'student@eshikho.com',
      name: 'Rahim Student',
      password: studentPassword,
      role: 'STUDENT',
    },
  });

  console.log('Seeded Users:');
  console.log(`- Super Admin: ${admin.email} (role: ${admin.role})`);
  console.log(`- Instructor: ${instructor.email} (role: ${instructor.role})`);
  console.log(`- Student: ${student.email} (role: ${student.role})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
