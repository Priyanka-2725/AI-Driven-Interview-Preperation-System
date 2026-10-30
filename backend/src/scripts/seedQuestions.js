import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import Question from '../models/Question.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ALLOWED_TOPICS = new Set([
  'arrays',
  'trees',
  'graphs',
  'strings',
  'system-design',
  'javascript',
  'python',
  'databases'
]);

export async function seedQuestions(filePath) {
  const seedPath =
    filePath ||
    path.resolve(__dirname, '../../../ml-service/app/data/questions_seed.json');

  if (!fs.existsSync(seedPath)) {
    throw new Error(`Seed file not found at: ${seedPath}`);
  }

  const rawData = fs.readFileSync(seedPath, 'utf-8');
  const questions = JSON.parse(rawData);

  let insertedCount = 0;
  let updatedCount = 0;

  for (const q of questions) {
    if (!ALLOWED_TOPICS.has(q.topic)) {
      throw new Error(
        `Question ${q.slug} has invalid topic '${q.topic}'. Allowed: ${Array.from(ALLOWED_TOPICS).join(', ')}`
      );
    }

    const questionDoc = {
      title: q.title,
      slug: q.slug,
      topic: q.topic,
      difficulty: q.difficulty,
      type: q.type,
      description: q.description,
      questionText: q.questionText || q.description,
      starterCode: q.starterCode || {},
      testCases: q.testCases || [],
      referenceSolution: q.referenceSolution || null,
      referenceAnswer: q.referenceAnswer || null,
      keyConcepts: q.keyConcepts || [],
      timeLimitSeconds: q.timeLimitSeconds || 3.0,
      memoryLimitMb: q.memoryLimitMb || 128,
      isCurated: true
    };

    const existing = await Question.findOne({ slug: q.slug });
    if (!existing) {
      await Question.create(questionDoc);
      insertedCount++;
    } else {
      await Question.updateOne({ slug: q.slug }, { $set: questionDoc });
      updatedCount++;
    }
  }

  return {
    total: questions.length,
    insertedCount,
    updatedCount
  };
}

const isDirectRun =
  process.argv[1] &&
  path.resolve(process.argv[1]).toLowerCase() ===
    path.resolve(fileURLToPath(import.meta.url)).toLowerCase();

if (isDirectRun) {
  const run = async () => {
    try {
      console.log('Connecting to MongoDB...');
      await mongoose.connect(env.MONGODB_URI);
      console.log('Connected to MongoDB. Starting question seed...');
      const result = await seedQuestions();
      console.log(
        `Seeding complete! Processed: ${result.total}, Inserted: ${result.insertedCount}, Updated: ${result.updatedCount}`
      );
      await mongoose.disconnect();
      process.exit(0);
    } catch (err) {
      console.error('Seeding failed:', err);
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
      process.exit(1);
    }
  };
  run();
}
