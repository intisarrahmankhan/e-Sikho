import mongoose from 'mongoose';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf-8');
const mongoLine = envContent.split('\n').find((l) => l.startsWith('MONGODB_URI='));
const uri = mongoLine.split('=')[1].replace(/["']/g, '').trim();

async function run() {
  await mongoose.connect(uri);
  const users = await mongoose.connection.db
    .collection('users')
    .find({}, { projection: { name: 1, email: 1, phone: 1, role: 1, status: 1 } })
    .toArray();
  console.log('Total users:', users.length);
  console.log(users);

  const courses = await mongoose.connection.db
    .collection('courses')
    .find({}, { projection: { title: 1, approvalStatus: 1, status: 1, price: 1 } })
    .toArray();
  console.log('Total DB courses:', courses.length);
  console.log(courses);
  await mongoose.disconnect();
}

run().catch(console.error);
