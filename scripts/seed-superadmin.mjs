import mongoose from 'mongoose';
import fs from 'fs';
import crypto from 'crypto';

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

const envContent = fs.readFileSync('.env.local', 'utf-8');
const mongoLine = envContent.split('\n').find((l) => l.startsWith('MONGODB_URI='));
const uri = mongoLine.split('=')[1].replace(/["']/g, '').trim();

async function run() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  // 1. Promote existing admin app.isolate.dev@gmail.com and admin@eshikho.com to SUPERADMIN
  const promoteRes = await db.collection('users').updateOne(
    { email: 'app.isolate.dev@gmail.com' },
    { $set: { role: 'SUPERADMIN', status: 'APPROVED' } }
  );
  if (promoteRes.matchedCount > 0) {
    console.log('✔ Promoted app.isolate.dev@gmail.com to SUPERADMIN');
  }

  const promoteAdminRes = await db.collection('users').updateOne(
    { email: 'admin@eshikho.com' },
    { $set: { role: 'SUPERADMIN', status: 'APPROVED' } }
  );
  if (promoteAdminRes.matchedCount > 0) {
    console.log('✔ Promoted admin@eshikho.com to SUPERADMIN');
  }

  // 2. Create or update dedicated Superadmin credentials
  const superEmail = 'superadmin@esikho.com';
  const superPhone = '01700000000';
  const superPassword = 'SuperAdmin@123';
  const hashedPassword = hashPassword(superPassword);

  const existingSuper = await db.collection('users').findOne({
    $or: [{ email: superEmail }, { phone: superPhone }],
  });

  if (existingSuper) {
    await db.collection('users').updateOne(
      { _id: existingSuper._id },
      {
        $set: {
          name: 'Super Admin',
          role: 'SUPERADMIN',
          status: 'APPROVED',
          password: hashedPassword,
          phone: superPhone,
        },
      }
    );
    console.log('✔ Updated existing Superadmin account:', superEmail, '| Phone:', superPhone);
  } else {
    await db.collection('users').insertOne({
      name: 'Super Admin',
      email: superEmail,
      phone: superPhone,
      password: hashedPassword,
      role: 'SUPERADMIN',
      status: 'APPROVED',
      availableBalance: 0,
      totalEarnings: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log('✔ Created new Superadmin account:', superEmail, '| Phone:', superPhone);
  }

  // 3. Verify superadmins in database
  const superadmins = await db.collection('users').find({ role: 'SUPERADMIN' }).toArray();
  console.log(`\nVerified ${superadmins.length} Superadmin account(s) in DB:`);
  for (const s of superadmins) {
    console.log(`- ${s.name} (${s.email} | ${s.phone || 'no phone'}): Role = ${s.role}, Status = ${s.status}`);
  }

  await mongoose.disconnect();
}

run().catch(console.error);
