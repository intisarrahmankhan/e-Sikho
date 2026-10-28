import mongoose from 'mongoose';
import nextEnv from '@next/env';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import dns from 'node:dns';

// Preview only: this script contains no database writes or deletion mode.
nextEnv.loadEnvConfig(process.cwd());
const output = resolve(process.argv[2] || 'audit-local/dummy-data-review.json');
const fingerprints = JSON.parse(await readFile(new URL('./dummy-data-fingerprints.json', import.meta.url), 'utf8'));
const ids = (values) => values.flatMap((value) => mongoose.isValidObjectId(value) ? [value, new mongoose.Types.ObjectId(value)] : [value]);
const selectors = {
  users: { role: { $nin: ['ADMIN', 'SUPERADMIN', 'MODERATOR'] }, $or: [{ email: { $in: fingerprints.userEmails } }, { email: /^dev_(student|instructor|admin|superadmin)@eshikho\.test$/ }, { _id: { $in: ids(['65f000000000000000000001', '65f000000000000000000002', '65f000000000000000000003']) } }] },
  courses: { $or: [{ title: { $in: fingerprints.courseTitles } }, { slug: { $in: fingerprints.courseSlugs } }] },
  instructors: { name: { $in: fingerprints.instructorNames } },
  exams: { title: { $in: fingerprints.examTitles } },
  contests: { slug: { $in: fingerprints.contestSlugs } },
  livequestions: { studentId: /^student-seed-\d+$/ },
  livesessions: { meetUrl: /^https:\/\/meet\.google\.com\/esh-ikho-/ },
  payments: { transactionId: /^TXN-(BKASH|NAGAD|CARD)-\d+-[123]$/ },
  enrollments: { transactionId: /^TXN-(INIT|OBJ)-/ },
};

try {
  if (!process.env.MONGODB_URI) throw new Error('MissingDatabaseConfiguration');
  try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch {}
  await mongoose.connect(process.env.MONGODB_URI, { autoIndex: false, serverSelectionTimeoutMS: 10000 });
  const db = mongoose.connection.db;
  const candidates = {};
  for (const [collection, filter] of Object.entries(selectors)) {
    const documents = await db.collection(collection).find(filter, { projection: { _id: 1 } }).limit(1001).toArray();
    candidates[collection] = { ids: documents.slice(0, 1000).map((document) => String(document._id)), truncated: documents.length > 1000 };
  }
  const courseRefs = ids(candidates.courses.ids);
  const userRefs = ids(candidates.users.ids);
  const modules = await db.collection('modules').find({ courseId: { $in: courseRefs } }, { projection: { _id: 1 } }).toArray();
  const moduleRefs = ids(modules.map((module) => String(module._id)));
  const relatedRecords = {};
  for (const collection of ['enrollments', 'payments', 'lessonprogresses', 'reviews', 'wishlists', 'certificates', 'projectsubmissions', 'financialledgers', 'payoutrequests', 'instructorprofiles', 'instructorrequests', 'notifications']) {
    relatedRecords[collection] = await db.collection(collection).countDocuments({ $or: [
      { courseId: { $in: courseRefs } }, { userId: { $in: userRefs } },
      { studentId: { $in: userRefs } }, { instructorId: { $in: userRefs } }, { recipientId: { $in: userRefs } },
    ] });
  }
  relatedRecords.modules = modules.length;
  relatedRecords.lessons = await db.collection('lessons').countDocuments({ moduleId: { $in: moduleRefs } });
  const report = {
    generatedAt: new Date().toISOString(), sourceCommit: fingerprints.sourceCommit,
    mode: 'READ_ONLY_REVIEW', databaseWrites: 0,
    instructions: [
      'These are candidates, not confirmed dummy records. Real records can share a title or email with a historical sample.',
      'Review the exact IDs and all linked content with the team before deleting anything.',
      'Back up approved records and dependencies; do not cascade-delete real enrollments, balances, payments, or contributions.',
      'Older seeders changed aggregate ratings, enrollment counters, and balances without provenance. They cannot be safely reversed from names alone.',
      'This report does not identify every possible historical demo report, payout, or copied course. No deletion commands are generated.',
    ],
    candidates, relatedRecords,
  };
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ report: output, candidateCounts: Object.fromEntries(Object.entries(candidates).map(([name, value]) => [name, value.ids.length])), relatedRecords, databaseWrites: 0 }, null, 2));
} catch (error) {
  console.error(`Read-only database preview failed (${error.code || error.name}). Check database access and MONGODB_URI locally.`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
