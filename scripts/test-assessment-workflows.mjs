import mongoose from 'mongoose';
import nextEnv from '@next/env';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import { spawn } from 'node:child_process';
import dns from 'node:dns';
nextEnv.loadEnvConfig(process.cwd());
process.env.E_SIKHO_BUILD_DIR ||= '.next-assessment-audit';
const databaseName = 'e_sikho_assessment_test_' + crypto.randomBytes(6).toString('hex');
const uri = new URL(process.env.MONGODB_URI); uri.pathname = '/' + databaseName;
dns.setServers(['8.8.8.8', '1.1.1.1']);
const connection = await mongoose.createConnection(uri.toString(), { autoIndex: false, serverSelectionTimeoutMS: 10000 }).asPromise();
const users = {};
const password = 'AssessmentFixture123!';
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
  const specs = [
    ['teacher', 'Teacher Fixture', 'INSTRUCTOR', '', ''], ['otherTeacher', 'Other Teacher Fixture', 'INSTRUCTOR', '', ''],
    ['admin', 'Superadmin Fixture', 'SUPERADMIN', '', ''], ['school', 'School Learner', 'STUDENT', 'SCHOOL', 'Science'],
    ['college', 'College Learner', 'STUDENT', 'COLLEGE', 'Science'], ['university', 'University CSE Learner', 'STUDENT', 'UNIVERSITY', 'CSE'],
    ['outsider', 'University EEE Learner', 'STUDENT', 'UNIVERSITY', 'EEE'], ['otherSchool', 'Other School Learner', 'STUDENT', 'SCHOOL', 'Science'],
  ];
  for (const [key, name, role, educationLevel, department] of specs) {
    const salt = crypto.randomBytes(16).toString('hex'); const id = new mongoose.Types.ObjectId();
    const record = { _id: id, name, role, status: 'APPROVED', email: `${key.toLowerCase()}@assessment-fixture.test`, password: `${salt}:${crypto.scryptSync(password, salt, 64).toString('hex')}`, educationLevel: educationLevel || undefined, department, createdAt: new Date(), updatedAt: new Date() };
    await connection.db.collection('users').insertOne(record); users[key] = { id: String(id), email: record.email };
  }
  const courses = {};
  for (const [key, title, owner, status] of [['draft', 'Owned Draft Course', 'teacher', 'DRAFT'], ['published', 'Owned Published Course', 'teacher', 'PUBLISHED'], ['foreign', 'Other Instructor Course', 'otherTeacher', 'PUBLISHED']]) {
    const id = new mongoose.Types.ObjectId();
    await connection.db.collection('courses').insertOne({ _id: id, title, titleEn: title, tagline: 'Workflow fixture', description: 'Temporary isolated workflow fixture', category: 'programming', categoryBangla: 'প্রোগ্রামিং', level: 'বিগিনার', price: 0, originalPrice: 0, rating: 0, totalRatings: 0, studentsEnrolled: 0, duration: '1 hour', totalLessons: 0, thumbnailUrl: '/favicon.ico', status, approvalStatus: 'APPROVED', createdById: new mongoose.Types.ObjectId(users[owner].id), instructorId: new mongoose.Types.ObjectId(), learningOutcomes: 'Learn', prerequisites: 'None', createdAt: new Date(), updatedAt: new Date() });
    courses[key] = String(id);
  }
  await connection.db.collection('enrollments').insertOne({ userId: new mongoose.Types.ObjectId(users.university.id), courseId: courses.published, paymentStatus: 'GRANTED', amountPaid: 0 });
  await fs.mkdir('audit-local', { recursive: true });
  await fs.writeFile('audit-local/assessment-test-context.json', JSON.stringify({ users, courses, password, databaseName }));
  console.log('Running workflow tests against isolated database: ' + databaseName);
  const exitCode = await new Promise((resolve) => {
    const child = spawn(process.execPath, ['node_modules/@playwright/test/cli.js', 'test', '--config=playwright.assessments.config.ts'], { stdio: 'inherit', windowsHide: true, env: { ...process.env, MONGODB_URI: uri.toString(), AUTH_URL: 'http://localhost:3101', NEXTAUTH_URL: 'http://localhost:3101', ASSESSMENT_WORKFLOW_ISOLATED_DB: databaseName } });
    child.on('exit', (code) => resolve(code ?? 1)); child.on('error', () => resolve(1));
  });
  process.exitCode = Number(exitCode);
} finally {
  if (connection.name !== databaseName || !databaseName.startsWith('e_sikho_assessment_test_')) throw new Error('Refusing to remove an unexpected database.');
  await connection.dropDatabase(); await connection.close();
  console.log('Removed the isolated workflow database; project database was not used.');
}
