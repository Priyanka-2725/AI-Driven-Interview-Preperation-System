import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import app from '../src/app.js';
import { env } from '../src/config/env.js';
import User from '../src/models/User.js';
import Question from '../src/models/Question.js';
import Submission from '../src/models/Submission.js';
import Attempt from '../src/models/Attempt.js';
import tokenService from '../src/services/tokenService.js';
import { seedQuestions } from '../src/scripts/seedQuestions.js';

let passed = 0;
let failed = 0;
let skipped = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    passed++;
    console.log(`  \x1b[32m✔ PASS\x1b[0m ${testName}`);
  } else {
    failed++;
    console.error(`  \x1b[31m✖ FAIL\x1b[0m ${testName} ${details ? '- ' + details : ''}`);
  }
}

async function runAllTests() {
  console.log('\n======================================================');
  console.log('   PHASE 3 BACKEND INTEGRATION TEST SUITE');
  console.log('======================================================\n');

  // 1. Connect to MongoDB and seed
  await mongoose.connect(env.MONGODB_URI);
  console.log('[Setup] Connected to MongoDB.');

  const seedResult = await seedQuestions();
  console.log(`[Setup] Seeded questions: Total ${seedResult.total}, Inserted ${seedResult.insertedCount}, Updated ${seedResult.updatedCount}\n`);

  const twoSum = await Question.findOne({ slug: 'two-sum' });
  if (!twoSum) throw new Error('two-sum question not found in DB');

  // 2. Create Test Users & Tokens
  const timestamp = Date.now();
  const hashedPassword = await bcrypt.hash('Password123!', 10);

  const userA = await User.create({
    fullName: 'Candidate Alpha',
    email: `candidate_a_${timestamp}@test.com`,
    passwordHash: hashedPassword
  });
  const tokenA = tokenService.generateAccessToken(userA);

  const userB = await User.create({
    fullName: 'Candidate Beta',
    email: `candidate_b_${timestamp}@test.com`,
    passwordHash: hashedPassword
  });
  const tokenB = tokenService.generateAccessToken(userB);

  console.log('--- 1. Condition 8: Auth-Required on Every Route ---');
  const dummyId = new mongoose.Types.ObjectId().toString();

  const authRoutes = [
    { method: 'get', path: '/api/v1/questions' },
    { method: 'get', path: `/api/v1/questions/${twoSum._id}` },
    { method: 'post', path: '/api/v1/questions/generate' },
    { method: 'post', path: '/api/v1/submissions/run' },
    { method: 'post', path: '/api/v1/submissions' },
    { method: 'get', path: '/api/v1/submissions' },
    { method: 'get', path: `/api/v1/submissions/${dummyId}` },
    { method: 'post', path: `/api/v1/submissions/${dummyId}/retry` },
    { method: 'post', path: '/api/v1/attempts' },
    { method: 'get', path: '/api/v1/attempts' },
    { method: 'get', path: `/api/v1/attempts/${dummyId}` },
    { method: 'post', path: `/api/v1/attempts/${dummyId}/complete` }
  ];

  for (const r of authRoutes) {
    const res = await request(app)[r.method](r.path).send({});
    assert(
      res.status === 401 && res.body.error?.code === 'MISSING_TOKEN',
      `Auth-required: ${r.method.toUpperCase()} ${r.path} returns 401 MISSING_TOKEN`,
      `Got status ${res.status}, code ${res.body.error?.code}`
    );
  }

  console.log('\n--- 2. Condition 4: Secret Fields & Hidden Tests Never Leaked ---');
  // 2.1 GET /questions
  const listQRes = await request(app)
    .get('/api/v1/questions')
    .set('Authorization', `Bearer ${tokenA}`);

  assert(listQRes.status === 200, 'GET /questions succeeds with 200');
  const questionsList = listQRes.body.data.questions;
  let qLeaked = false;
  let hiddenTestsLeaked = false;

  for (const q of questionsList) {
    if (q.referenceSolution !== undefined || q.referenceAnswer !== undefined) qLeaked = true;
    if (Array.isArray(q.testCases) && q.testCases.some((tc) => tc.isHidden)) hiddenTestsLeaked = true;
  }
  assert(!qLeaked, 'GET /questions strips referenceSolution and referenceAnswer from all questions');
  assert(!hiddenTestsLeaked, 'GET /questions strips hidden test cases from all questions');

  // 2.2 GET /questions/:id
  const getQRes = await request(app)
    .get(`/api/v1/questions/${twoSum._id}`)
    .set('Authorization', `Bearer ${tokenA}`);

  assert(getQRes.status === 200, 'GET /questions/:id succeeds with 200');
  const singleQ = getQRes.body.data.question;
  assert(
    singleQ.referenceSolution === undefined && singleQ.referenceAnswer === undefined,
    'GET /questions/:id strips referenceSolution and referenceAnswer'
  );
  assert(
    Array.isArray(singleQ.testCases) && singleQ.testCases.every((tc) => !tc.isHidden),
    'GET /questions/:id returns only visible test cases'
  );

  // 2.3 POST /questions/generate
  const genQRes = await request(app)
    .post('/api/v1/questions/generate')
    .set('Authorization', `Bearer ${tokenA}`)
    .send({ topic: 'arrays', difficulty: 'easy', type: 'coding', count: 1 });

  assert(genQRes.status === 201, 'POST /questions/generate returns 201 Created');
  const genQ = genQRes.body.data.question;
  assert(
    genQ.referenceSolution === undefined && genQ.referenceAnswer === undefined,
    'POST /questions/generate strips referenceSolution and referenceAnswer'
  );
  assert(
    Array.isArray(genQ.testCases) && genQ.testCases.every((tc) => !tc.isHidden),
    'POST /questions/generate strips hidden test cases'
  );

  // 2.4 POST /attempts & GET /attempts/:id
  const createAttRes = await request(app)
    .post('/api/v1/attempts')
    .set('Authorization', `Bearer ${tokenA}`)
    .send({ topic: 'arrays', difficulty: 'easy', count: 2 });

  assert(createAttRes.status === 201, 'POST /attempts returns 201 Created');
  const attData = createAttRes.body.data.attempt;
  let attLeaked = false;
  for (const q of attData.questions || []) {
    if (typeof q === 'object') {
      if (q.referenceSolution !== undefined || q.referenceAnswer !== undefined) attLeaked = true;
      if (Array.isArray(q.testCases) && q.testCases.some((tc) => tc.isHidden)) attLeaked = true;
    }
  }
  assert(!attLeaked, 'POST /attempts populated questions do not leak secrets or hidden tests');

  const getAttRes = await request(app)
    .get(`/api/v1/attempts/${attData.id}`)
    .set('Authorization', `Bearer ${tokenA}`);
  assert(getAttRes.status === 200, 'GET /attempts/:id succeeds with 200');

  console.log('\n--- 3. Condition 6: Non-Graded Run & System Limits ---');
  // 3.1 Run endpoint uses visible tests only and creates NO DB records
  const subCountBefore = await Submission.countDocuments();
  const validTwoSumCode = "import sys\nlines = sys.stdin.read().splitlines()\nif lines:\n    nums = list(map(int, lines[0].split()))\n    target = int(lines[1])\n    seen = {}\n    for i, n in enumerate(nums):\n        if target - n in seen:\n            print(f'{seen[target - n]} {i}')\n            break\n        seen[n] = i\n";

  const runRes = await request(app)
    .post('/api/v1/submissions/run')
    .set('Authorization', `Bearer ${tokenA}`)
    .send({
      questionId: twoSum._id.toString(),
      code: validTwoSumCode,
      language: 'python'
    });

  const subCountAfter = await Submission.countDocuments();
  assert(runRes.status === 200, 'POST /submissions/run returns 200 OK');
  assert(runRes.body.data.allPassed === true, 'POST /submissions/run executes visible tests successfully');
  assert(subCountBefore === subCountAfter, 'POST /submissions/run creates ZERO database records');

  // 3.2 Code max 64 KB -> CODE_TOO_LARGE (413)
  const hugeCode = 'x = 1\n'.repeat(12000); // ~72 KB (>64KB)
  const codeTooLargeRun = await request(app)
    .post('/api/v1/submissions/run')
    .set('Authorization', `Bearer ${tokenA}`)
    .send({ questionId: twoSum._id.toString(), code: hugeCode, language: 'python' });
  assert(
    codeTooLargeRun.status === 413 && codeTooLargeRun.body.error?.code === 'CODE_TOO_LARGE',
    'POST /submissions/run rejects >64KB code with 413 CODE_TOO_LARGE'
  );

  const codeTooLargeSub = await request(app)
    .post('/api/v1/submissions')
    .set('Authorization', `Bearer ${tokenA}`)
    .send({ questionId: twoSum._id.toString(), type: 'coding', code: hugeCode, language: 'python' });
  assert(
    codeTooLargeSub.status === 413 && codeTooLargeSub.body.error?.code === 'CODE_TOO_LARGE',
    'POST /submissions rejects >64KB code with 413 CODE_TOO_LARGE'
  );

  // 3.3 Answer max 5,000 chars -> ANSWER_TOO_LONG (400)
  const hugeAnswer = 'A'.repeat(5001);
  const answerTooLong = await request(app)
    .post('/api/v1/submissions')
    .set('Authorization', `Bearer ${tokenA}`)
    .send({ questionId: twoSum._id.toString(), type: 'conceptual', answerText: hugeAnswer });
  assert(
    answerTooLong.status === 400 && answerTooLong.body.error?.code === 'ANSWER_TOO_LONG',
    'POST /submissions rejects >5000 char answer with 400 ANSWER_TOO_LONG'
  );

  // 3.4 Unsupported language -> UNSUPPORTED_LANGUAGE (422)
  const badLangRun = await request(app)
    .post('/api/v1/submissions/run')
    .set('Authorization', `Bearer ${tokenA}`)
    .send({ questionId: twoSum._id.toString(), code: 'console.log("hello");', language: 'javascript' });
  assert(
    badLangRun.status === 422 && badLangRun.body.error?.code === 'UNSUPPORTED_LANGUAGE',
    'POST /submissions/run rejects javascript with 422 UNSUPPORTED_LANGUAGE'
  );

  const badLangSub = await request(app)
    .post('/api/v1/submissions')
    .set('Authorization', `Bearer ${tokenA}`)
    .send({ questionId: twoSum._id.toString(), type: 'coding', code: 'console.log("hello");', language: 'javascript' });
  assert(
    badLangSub.status === 422 && badLangSub.body.error?.code === 'UNSUPPORTED_LANGUAGE',
    'POST /submissions rejects javascript with 422 UNSUPPORTED_LANGUAGE'
  );

  console.log('\n--- 4. Condition 8: Ownership Isolation Tests ---');
  // User A creates a real graded submission
  const userASubRes = await request(app)
    .post('/api/v1/submissions')
    .set('Authorization', `Bearer ${tokenA}`)
    .send({
      questionId: twoSum._id.toString(),
      type: 'coding',
      code: validTwoSumCode,
      language: 'python'
    });

  assert(userASubRes.status === 201, 'User A creates graded submission with 201 Created');
  const userASub = userASubRes.body.data.submission;
  const subIdA = userASub.id;

  // Condition 4 check on submission response: hidden tests redacted
  let hiddenResultRedacted = true;
  if (userASub.evaluation && Array.isArray(userASub.evaluation.results)) {
    for (const r of userASub.evaluation.results) {
      if (r.isHidden && (r.input !== null || r.expectedOutput !== null || r.actualOutput !== null)) {
        hiddenResultRedacted = false;
      }
    }
  }
  assert(hiddenResultRedacted, 'GET/POST submission redacts input/output for hidden test cases');

  // User B tries to access User A's submission
  const userBGetSub = await request(app)
    .get(`/api/v1/submissions/${subIdA}`)
    .set('Authorization', `Bearer ${tokenB}`);
  assert(
    userBGetSub.status === 404 && userBGetSub.body.error?.code === 'SUBMISSION_NOT_FOUND',
    'User B cannot GET User A submission (404 SUBMISSION_NOT_FOUND)'
  );

  const userBRetrySub = await request(app)
    .post(`/api/v1/submissions/${subIdA}/retry`)
    .set('Authorization', `Bearer ${tokenB}`);
  assert(
    userBRetrySub.status === 404 && userBRetrySub.body.error?.code === 'SUBMISSION_NOT_FOUND',
    'User B cannot retry User A submission (404 SUBMISSION_NOT_FOUND)'
  );

  // User B tries to access User A's attempt
  const userBGetAtt = await request(app)
    .get(`/api/v1/attempts/${attData.id}`)
    .set('Authorization', `Bearer ${tokenB}`);
  assert(
    userBGetAtt.status === 404 && userBGetAtt.body.error?.code === 'ATTEMPT_NOT_FOUND',
    'User B cannot GET User A attempt (404 ATTEMPT_NOT_FOUND)'
  );

  const userBCompleteAtt = await request(app)
    .post(`/api/v1/attempts/${attData.id}/complete`)
    .set('Authorization', `Bearer ${tokenB}`);
  assert(
    userBCompleteAtt.status === 404 && userBCompleteAtt.body.error?.code === 'ATTEMPT_NOT_FOUND',
    'User B cannot complete User A attempt (404 ATTEMPT_NOT_FOUND)'
  );

  // User B listing submissions & attempts isolates User A's data
  const userBListSub = await request(app)
    .get('/api/v1/submissions')
    .set('Authorization', `Bearer ${tokenB}`);
  assert(
    userBListSub.body.data.submissions.every((s) => s.id !== subIdA),
    'User B submissions list does NOT contain User A submission'
  );

  const userBListAtt = await request(app)
    .get('/api/v1/attempts')
    .set('Authorization', `Bearer ${tokenB}`);
  assert(
    userBListAtt.body.data.attempts.every((a) => a.id !== attData.id),
    'User B attempts list does NOT contain User A attempt'
  );

  console.log('\n--- 5. Condition 5: The ML-Down Path & Retry ---');
  // Create a failed submission in DB (as would happen when ML is unreachable)
  const failedSubDoc = await Submission.create({
    userId: userA._id,
    questionId: twoSum._id,
    type: 'coding',
    code: validTwoSumCode,
    language: 'python',
    status: 'failed',
    errorDetails: { message: 'ML service simulated timeout', code: 'ML_SERVICE_UNAVAILABLE' }
  });

  const getFailedSub = await request(app)
    .get(`/api/v1/submissions/${failedSubDoc._id}`)
    .set('Authorization', `Bearer ${tokenA}`);
  assert(
    getFailedSub.status === 200 && getFailedSub.body.data.submission.status === 'failed',
    'Failed submission is saved in DB and retrieved with status: failed'
  );

  // Retry the failed submission with ML service online
  const retryRes = await request(app)
    .post(`/api/v1/submissions/${failedSubDoc._id}/retry`)
    .set('Authorization', `Bearer ${tokenA}`);

  assert(retryRes.status === 200, 'POST /submissions/:id/retry succeeds with 200 OK');
  assert(
    retryRes.body.data.submission.status === 'evaluated',
    'Retried submission status transitions to evaluated'
  );
  assert(
    typeof retryRes.body.data.submission.score === 'number' && retryRes.body.data.submission.score >= 80,
    'Retried submission receives graded score'
  );

  // Retrying an already evaluated submission fails with SUBMISSION_NOT_RETRYABLE (400)
  const retryAgain = await request(app)
    .post(`/api/v1/submissions/${failedSubDoc._id}/retry`)
    .set('Authorization', `Bearer ${tokenA}`);
  assert(
    retryAgain.status === 400 && retryAgain.body.error?.code === 'SUBMISSION_NOT_RETRYABLE',
    'Retrying already evaluated submission returns 400 SUBMISSION_NOT_RETRYABLE'
  );

  console.log('\n--- 6. Condition 7: RequestId Forwarding & Envelopes ---');
  const customReqId = 'custom-test-uuid-999';
  const reqIdRes = await request(app)
    .get('/api/v1/questions')
    .set('Authorization', `Bearer ${tokenA}`)
    .set('X-Request-Id', customReqId);

  assert(
    reqIdRes.headers['x-request-id'] === customReqId,
    'Backend echoes custom X-Request-Id header'
  );
  assert(
    reqIdRes.body.meta?.requestId === customReqId,
    'meta.requestId matches forwarded X-Request-Id'
  );
  assert(
    reqIdRes.body.success === true && reqIdRes.body.data !== undefined && reqIdRes.body.meta?.timestamp !== undefined,
    'Standard success envelope structure verified'
  );

  console.log('\n--- 7. Attempt Finalization & Composite Scoring ---');
  // Create an attempt with 2 questions for User A
  const attempt2Q = await request(app)
    .post('/api/v1/attempts')
    .set('Authorization', `Bearer ${tokenA}`)
    .send({ topic: 'arrays', count: 2 });
  const att2Id = attempt2Q.body.data.attempt.id;

  // Complete attempt without answering any questions -> compositeScore should be 0
  const completeAttRes = await request(app)
    .post(`/api/v1/attempts/${att2Id}/complete`)
    .set('Authorization', `Bearer ${tokenA}`);

  assert(completeAttRes.status === 200, 'POST /attempts/:id/complete succeeds with 200');
  assert(
    completeAttRes.body.data.attempt.status === 'completed',
    'Attempt status transitions to completed'
  );
  assert(
    completeAttRes.body.data.attempt.compositeScore === 0,
    'Unanswered questions receive 0 composite score'
  );

  // Complete again -> 400 ATTEMPT_ALREADY_COMPLETED
  const completeAgain = await request(app)
    .post(`/api/v1/attempts/${att2Id}/complete`)
    .set('Authorization', `Bearer ${tokenA}`);
  assert(
    completeAgain.status === 400 && completeAgain.body.error?.code === 'ATTEMPT_ALREADY_COMPLETED',
    'Completing already completed attempt returns 400 ATTEMPT_ALREADY_COMPLETED'
  );

  console.log('\n--- 8. Rate Limiting Tests (Isolated Users) ---');
  // Rate limit on /run: 20/min
  const userRunRL = await User.create({
    fullName: 'Candidate RateLimit Run',
    email: `cand_rl_run_${Date.now()}@test.com`,
    passwordHash: hashedPassword
  });
  const tokenRunRL = tokenService.generateAccessToken(userRunRL);

  let runRateLimited = false;
  for (let i = 0; i < 22; i++) {
    const res = await request(app)
      .post('/api/v1/submissions/run')
      .set('Authorization', `Bearer ${tokenRunRL}`)
      .send({ questionId: twoSum._id.toString(), code: 'print("hi")', language: 'python' });
    if (res.status === 429 && res.body.error?.code === 'RUN_RATE_LIMIT_EXCEEDED') {
      runRateLimited = true;
      break;
    }
  }
  assert(runRateLimited, 'Exceeding 20 runs/min returns 429 RUN_RATE_LIMIT_EXCEEDED');

  // Rate limit on /submissions: 10/min
  const userSubRL = await User.create({
    fullName: 'Candidate RateLimit Submit',
    email: `cand_rl_sub_${Date.now()}@test.com`,
    passwordHash: hashedPassword
  });
  const tokenSubRL = tokenService.generateAccessToken(userSubRL);

  let subRateLimited = false;
  for (let i = 0; i < 12; i++) {
    const res = await request(app)
      .post('/api/v1/submissions')
      .set('Authorization', `Bearer ${tokenSubRL}`)
      .send({ questionId: twoSum._id.toString(), type: 'coding', code: 'print("hi")', language: 'python' });
    if (res.status === 429 && res.body.error?.code === 'SUBMISSION_RATE_LIMIT_EXCEEDED') {
      subRateLimited = true;
      break;
    }
  }
  assert(subRateLimited, 'Exceeding 10 submissions/min returns 429 SUBMISSION_RATE_LIMIT_EXCEEDED');

  console.log('\n======================================================');
  console.log(`TEST SUMMARY: ${passed} passed, ${failed} failed, ${skipped} skipped`);
  console.log('======================================================\n');

  await mongoose.disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

runAllTests().catch((err) => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
