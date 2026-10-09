import mongoose from 'mongoose';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf-8');
const mongoLine = envContent.split('\n').find((l) => l.startsWith('MONGODB_URI='));
const uri = mongoLine.split('=')[1].replace(/["']/g, '').trim();

const coursesData = JSON.parse(fs.readFileSync('scripts/courses-data.json', 'utf-8'));

async function seed() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  console.log(`Starting course seed: ${coursesData.length} catalog courses.`);

  for (const c of coursesData) {
    // 1. Ensure Instructor exists
    let instructorDoc = await db.collection('instructors').findOne({ name: c.instructor.name });
    if (!instructorDoc) {
      const insRes = await db.collection('instructors').insertOne({
        name: c.instructor.name,
        role: c.instructor.role,
        avatar: c.instructor.avatar,
        bio: c.instructor.bio,
      });
      instructorDoc = { _id: insRes.insertedId };
      console.log(`✔ Created instructor: ${c.instructor.name}`);
    }

    // 2. Check if course already exists by title
    let courseDoc = await db.collection('courses').findOne({
      $or: [{ title: c.title }, { slug: c.id }]
    });

    if (!courseDoc) {
      const courseInsert = {
        title: c.title,
        titleEn: c.titleEn || '',
        slug: c.id,
        tagline: c.tagline,
        taglineEn: c.taglineEn || '',
        description: c.description,
        descriptionEn: c.descriptionEn || '',
        category: c.category,
        categoryBangla: c.categoryBangla,
        level: c.level,
        rating: c.rating,
        totalRatings: c.totalRatings,
        studentsEnrolled: c.studentsEnrolled,
        duration: c.duration,
        totalLessons: c.totalLessons,
        price: c.price,
        originalPrice: c.originalPrice,
        thumbnailUrl: c.thumbnailUrl,
        thumbnailUrlEn: c.thumbnailUrlEn || '',
        previewVideoUrl: c.previewVideoUrl || '',
        status: 'PUBLISHED',
        approvalStatus: 'APPROVED',
        instructorId: instructorDoc._id,
        learningOutcomes: JSON.stringify(c.learningOutcomes || []),
        prerequisites: JSON.stringify(c.prerequisites || []),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const res = await db.collection('courses').insertOne(courseInsert);
      courseDoc = { _id: res.insertedId };
      console.log(`✔ Created course: ${c.title}`);

      // 3. Create modules and lessons
      if (c.modules && c.modules.length > 0) {
        for (let mIdx = 0; mIdx < c.modules.length; mIdx++) {
          const m = c.modules[mIdx];
          const modRes = await db.collection('modules').insertOne({
            title: m.title,
            duration: m.duration,
            order: mIdx,
            courseId: courseDoc._id,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          if (m.lessons && m.lessons.length > 0) {
            for (let lIdx = 0; lIdx < m.lessons.length; lIdx++) {
              const l = m.lessons[lIdx];
              await db.collection('lessons').insertOne({
                title: l.title,
                duration: l.duration,
                content: `${l.title} - বিস্তারিত লেকচার কনটেন্ট`,
                videoUrl: l.videoUrl || '',
                isFree: !!l.isFree,
                order: lIdx,
                moduleId: modRes.insertedId,
                createdAt: new Date(),
                updatedAt: new Date(),
              });
            }
          }
        }
      }
    } else {
      console.log(`ℹ Course already exists: ${c.title}`);
    }
  }

  const count = await db.collection('courses').countDocuments();
  console.log(`Total courses in DB: ${count}`);

  await mongoose.disconnect();
}

seed().catch(console.error);
