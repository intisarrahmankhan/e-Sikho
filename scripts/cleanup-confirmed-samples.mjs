import fs from 'node:fs/promises';
import mongoose from 'mongoose';
import nextEnv from '@next/env';
import dns from 'node:dns';

nextEnv.loadEnvConfig(process.cwd());
const apply = process.argv.includes('--apply');
const fingerprints = JSON.parse(await fs.readFile(new URL('./dummy-data-fingerprints.json', import.meta.url), 'utf8'));
const references = (documents) => documents.flatMap((document) => [document._id, String(document._id)]);
const EJSON = mongoose.mongo.BSON.EJSON;
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
  await mongoose.connect(process.env.MONGODB_URI, { autoIndex: false, serverSelectionTimeoutMS: 10000 });
  const db = mongoose.connection.db;
  const plan = {};
  const preserved = [];
  const put = async (name, filter) => { plan[name] = await db.collection(name).find(filter).toArray(); return plan[name]; };
  const sampleInstructors = await db.collection('instructors').find({ name: { $in: fingerprints.instructorNames } }).toArray();
  const candidateCourses = await db.collection('courses').find({ slug: { $in: fingerprints.courseSlugs }, title: { $in: fingerprints.courseTitles }, createdById: { $exists: false }, instructorId: { $in: references(sampleInstructors) } }).toArray();
  // Snapshot fingerprints include the exact lesson/module titles from the retired seed sources.
  const safeCourses = [];
  for (const course of candidateCourses) {
    const modules = await db.collection('modules').find({ courseId: { $in: [course._id, String(course._id)] } }).toArray();
    const lessons = await db.collection('lessons').find({ moduleId: { $in: references(modules) } }).toArray();
    if (modules.some((record) => !fingerprints.moduleTitles.includes(record.title)) || lessons.some((record) => !fingerprints.lessonTitles.includes(record.title))) {
      preserved.push({ collection: 'courses', id: String(course._id), reason: 'Contains content not found in historical sample sources.' });
    } else safeCourses.push(course);
  }
  plan.courses = safeCourses;
  const courseRefs = [...references(safeCourses), ...safeCourses.map((course) => course.slug)];
  const samples = await db.collection('users').find({ email: { $in: fingerprints.userEmails.filter((email) => !email.endsWith('@phone.esikho.com')) } }).toArray();
  samples.push(...await db.collection('users').find({ email: /^dev_(student|instructor|admin|superadmin)@eshikho\.test$/ }).toArray());
  const safeUsers = [];
  for (const user of samples) {
    if (['ADMIN', 'SUPERADMIN', 'MODERATOR'].includes(user.role) || /intisar/i.test(user.name || '')) { preserved.push({ collection: 'users', id: String(user._id), reason: 'Protected owner or administrator account.' }); continue; }
    const ownedCourse = await db.collection('courses').findOne({ createdById: { $in: [user._id, String(user._id)] }, _id: { $nin: safeCourses.map((record) => record._id) } });
    const ownedExam = await db.collection('exams').findOne({ createdById: { $in: [user._id, String(user._id)] }, title: { $nin: fingerprints.examTitles } });
    const ownedContest = await db.collection('contests').findOne({ createdById: { $in: [user._id, String(user._id)] }, slug: { $nin: fingerprints.contestSlugs } });
    if (ownedCourse || ownedExam || ownedContest) preserved.push({ collection: 'users', id: String(user._id), reason: 'Owns content outside the confirmed sample set.' }); else safeUsers.push(user);
  }
  plan.users = [...new Map(safeUsers.map((user) => [String(user._id), user])).values()];
  const userRefs = references(plan.users);
  const instructorIds = [];
  for (const instructor of sampleInstructors) if (!await db.collection('courses').findOne({ instructorId: instructor._id, _id: { $nin: safeCourses.map((record) => record._id) } })) instructorIds.push(instructor._id);
  await put('instructors', { _id: { $in: instructorIds } });
  await put('modules', { courseId: { $in: courseRefs } });
  const moduleRefs = references(plan.modules);
  await put('lessons', { moduleId: { $in: moduleRefs } });
  const lessonRefs = references(plan.lessons);
  await put('exams', { title: { $in: fingerprints.examTitles }, createdById: { $exists: false } });
  await put('contests', { slug: { $in: fingerprints.contestSlugs }, createdById: { $exists: false } });
  const examRefs = references(plan.exams); const contestRefs = references(plan.contests);
  for (const name of ['enrollments', 'payments', 'lessonprogresses', 'reviews', 'wishlists', 'certificates', 'projectsubmissions', 'courseroutines', 'lessonresources']) await put(name, { $or: [{ courseId: { $in: courseRefs } }, { userId: { $in: userRefs } }, { studentId: { $in: userRefs } }, { lessonId: { $in: lessonRefs } }] });
  await put('examsubmissions', { $or: [{ examId: { $in: examRefs } }, { studentId: { $in: userRefs } }] });
  await put('contestsubmissions', { $or: [{ contestId: { $in: contestRefs } }, { studentId: { $in: userRefs } }] });
  await put('livesessions', { courseId: { $in: courseRefs } });
  await put('livequestions', { $or: [{ courseId: { $in: courseRefs } }, { studentId: /^student-seed-\d+$/ }, { studentId: { $in: userRefs } }] });
  await put('comments', { $or: [{ lessonId: { $in: lessonRefs } }, { userId: { $in: userRefs } }, { authorId: { $in: userRefs } }] });
  for (const name of ['instructorprofiles', 'instructorrequests', 'payoutrequests', 'financialledgers', 'globalassessmentpermissions']) await put(name, { $or: [{ userId: { $in: userRefs } }, { instructorId: { $in: userRefs } }, { courseId: { $in: courseRefs } }] });
  await put('platformcommissions', { $or: [{ courseId: { $in: courseRefs } }, { enrollmentId: { $in: references(plan.enrollments) } }] });
  await put('reports', { $or: [{ reporterId: { $in: userRefs } }, { targetUserId: { $in: userRefs } }, { targetId: { $in: [...courseRefs, ...lessonRefs, ...references(plan.comments), ...userRefs] } }] });
  const actionUrls = [...plan.contests.map((record) => `/contests/${record.slug}`), ...courseRefs.map((id) => `/courses/${id}`)];
  await put('notifications', { $or: [{ recipientId: { $in: userRefs } }, { actionUrl: { $in: actionUrls } }] });
  const summary = { mode: apply ? 'APPLY' : 'PREVIEW', counts: Object.fromEntries(Object.entries(plan).map(([name, records]) => [name, records.length])), preserved };
  await fs.mkdir('audit-local', { recursive: true });
  if (apply) {
    const backupPath = `audit-local/sample-cleanup-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    await fs.writeFile(backupPath, EJSON.stringify({ generatedAt: new Date(), collections: plan, preserved }, null, 2));
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        for (const [collection, records] of Object.entries(plan)) for (const record of records) {
          const filter = { _id: record._id, ...(record.updatedAt ? { updatedAt: record.updatedAt } : {}) };
          const result = await db.collection(collection).deleteOne(filter, { session });
          if (result.deletedCount !== 1) throw new Error('A candidate changed while cleanup was running. Transaction cancelled.');
        }
      });
      summary.backupPath = backupPath; summary.committed = true;
    } finally { await session.endSession(); }
  }
  await fs.writeFile('audit-local/sample-cleanup-result.json', JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
} catch (error) { console.error(`Sample cleanup failed (${error.code || error.name}). No secret values logged. Check the local backup and transaction state.`); process.exitCode = 1; }
finally { await mongoose.disconnect(); }
