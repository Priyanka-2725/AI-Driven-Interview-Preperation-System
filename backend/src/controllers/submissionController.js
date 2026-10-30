import mongoose from 'mongoose';
import Submission from '../models/Submission.js';
import Question from '../models/Question.js';
import Attempt from '../models/Attempt.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../config/constants.js';
import {
  evaluateCodeInMl,
  evaluateAnswerInMl,
  scoreAssessmentInMl
} from '../services/mlClient.js';

/**
 * 1. POST /api/v1/submissions/run
 * Non-graded code execution against visible test cases only.
 * Condition 6: Creates NO database records. Rate limited to 20/min.
 */
export const runCode = async (req, res, next) => {
  try {
    const { questionId, code, language = 'python', testCases } = req.body;

    if (language.toLowerCase() !== 'python') {
      throw new ApiError(
        422,
        ERROR_CODES.UNSUPPORTED_LANGUAGE,
        `Unsupported language '${language}'. Week 3 supports python only.`
      );
    }

    let targetTests = [];

    if (questionId) {
      let qDoc;
      if (questionId.match(/^[0-9a-fA-F]{24}$/)) {
        qDoc = await Question.findById(questionId);
      }
      if (!qDoc) {
        qDoc = await Question.findOne({ slug: questionId.toLowerCase() });
      }
      if (!qDoc) {
        throw new ApiError(404, ERROR_CODES.QUESTION_NOT_FOUND, 'Question not found');
      }
      // Visible test cases only
      targetTests = (qDoc.testCases || [])
        .filter((tc) => !tc.isHidden)
        .map((tc) => ({
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          isHidden: false
        }));
    } else if (Array.isArray(testCases) && testCases.length > 0) {
      targetTests = testCases.map((tc) => ({
        input: tc.input || '',
        expectedOutput: tc.expectedOutput || '',
        isHidden: false
      }));
    } else {
      throw new ApiError(
        400,
        ERROR_CODES.VALIDATION_ERROR,
        'Either questionId or testCases must be provided'
      );
    }

    const mlResult = await evaluateCodeInMl({
      code,
      language,
      testCases: targetTests,
      timeLimitSeconds: 3.0,
      visibleOnly: true,
      requestId: req.requestId || req.id
    });

    res.status(200).json({
      success: true,
      data: mlResult,
      meta: {
        requestId: req.requestId || req.id,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. POST /api/v1/submissions
 * Graded evaluation for candidate code or conceptual answer.
 */
export const createSubmission = async (req, res, next) => {
  try {
    const { questionId, attemptId, type, code, language = 'python', answerText } = req.body;
    const userId = req.user.id;

    // 1. Verify question exists
    let qDoc;
    if (questionId.match(/^[0-9a-fA-F]{24}$/)) {
      qDoc = await Question.findById(questionId).select('+referenceAnswer +referenceSolution');
    }
    if (!qDoc) {
      qDoc = await Question.findOne({ slug: questionId.toLowerCase() }).select(
        '+referenceAnswer +referenceSolution'
      );
    }
    if (!qDoc) {
      throw new ApiError(404, ERROR_CODES.QUESTION_NOT_FOUND, 'Question not found');
    }

    // 2. Verify attempt if provided
    let attemptDoc = null;
    if (attemptId) {
      attemptDoc = await Attempt.findById(attemptId);
      if (!attemptDoc) {
        throw new ApiError(404, ERROR_CODES.ATTEMPT_NOT_FOUND, 'Attempt not found');
      }
      if (attemptDoc.userId.toString() !== userId.toString()) {
        throw new ApiError(404, ERROR_CODES.ATTEMPT_NOT_FOUND, 'Attempt not found');
      }
      if (attemptDoc.status === 'completed') {
        throw new ApiError(
          400,
          ERROR_CODES.ATTEMPT_ALREADY_COMPLETED,
          'Attempt session has already been completed'
        );
      }
    }

    // Input validation before creating document
    if (type === 'coding') {
      if (!code || !code.trim()) {
        throw new ApiError(400, ERROR_CODES.VALIDATION_ERROR, 'Code is required for coding submissions');
      }
      if (language.toLowerCase() !== 'python') {
        throw new ApiError(
          422,
          ERROR_CODES.UNSUPPORTED_LANGUAGE,
          `Language '${language}' is unsupported. Week 3 supports python only.`
        );
      }
    } else if (type === 'conceptual') {
      if (!answerText || !answerText.trim()) {
        throw new ApiError(
          400,
          ERROR_CODES.VALIDATION_ERROR,
          'answerText is required for conceptual submissions'
        );
      }
    }

    // 3. Create initial pending Submission
    const submission = await Submission.create({
      userId,
      questionId: qDoc._id,
      attemptId: attemptDoc ? attemptDoc._id : null,
      type,
      code: type === 'coding' ? code : null,
      language,
      answerText: type === 'conceptual' ? answerText : null,
      status: 'pending'
    });

    // 4. Evaluate via ML Service with ML-down handling
    try {
      if (type === 'coding') {
        const fullTestCases = (qDoc.testCases || []).map((tc) => ({
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          isHidden: tc.isHidden
        }));

        const evalResult = await evaluateCodeInMl({
          code,
          language,
          testCases: fullTestCases,
          timeLimitSeconds: qDoc.timeLimitSeconds || 3.0,
          visibleOnly: false,
          requestId: req.requestId || req.id
        });

        const scoreResult = await scoreAssessmentInMl({
          type: 'coding',
          difficulty: qDoc.difficulty,
          codingResult: {
            passRatio: evalResult.passRatio,
            totalTests: evalResult.totalTests,
            passedTests: evalResult.passedTests,
            failedTests: evalResult.failedTests,
            avgRuntimeMs: evalResult.avgRuntimeMs
          },
          requestId: req.requestId || req.id
        });

        submission.status = 'evaluated';
        submission.evaluation = evalResult;
        submission.score = scoreResult.overallScore;
        submission.scoreBreakdown = scoreResult.breakdown;
        submission.feedback = scoreResult.feedback;
        await submission.save();
      } else if (type === 'conceptual') {
        const evalResult = await evaluateAnswerInMl({
          questionText: qDoc.questionText || qDoc.description,
          referenceAnswer: qDoc.referenceAnswer || '',
          keyConcepts: qDoc.keyConcepts || [],
          candidateAnswer: answerText,
          requestId: req.requestId || req.id
        });

        const scoreResult = await scoreAssessmentInMl({
          type: 'conceptual',
          difficulty: qDoc.difficulty,
          nlpResult: {
            semanticSimilarity: evalResult.semanticSimilarity,
            conceptCoverage: evalResult.conceptCoverage,
            wordCount: evalResult.wordCount,
            matchedConcepts: evalResult.matchedConcepts,
            missingConcepts: evalResult.missingConcepts
          },
          requestId: req.requestId || req.id
        });

        submission.status = 'evaluated';
        submission.evaluation = evalResult;
        submission.score = scoreResult.overallScore;
        submission.scoreBreakdown = scoreResult.breakdown;
        submission.feedback = scoreResult.feedback;
        await submission.save();
      }

      res.status(201).json({
        success: true,
        data: {
          submission: submission.toJSON()
        },
        meta: {
          requestId: req.requestId || req.id,
          timestamp: new Date().toISOString()
        }
      });
    } catch (mlErr) {
      if (mlErr instanceof ApiError && mlErr.statusCode < 500) {
        await submission.deleteOne();
        throw mlErr;
      }

      // Condition 5: Save as failed when ML is down/unreachable, respond with 503
      submission.status = 'failed';
      submission.errorDetails = {
        message: mlErr.message || 'ML service unreachable or timed out',
        code: mlErr.code || ERROR_CODES.ML_SERVICE_UNAVAILABLE
      };
      await submission.save();

      throw new ApiError(
        503,
        ERROR_CODES.ML_SERVICE_UNAVAILABLE,
        'ML Service is currently unavailable. Submission recorded as failed and can be retried.',
        {
          submissionId: submission._id.toString(),
          status: 'failed'
        }
      );
    }
  } catch (error) {
    next(error);
  }
};

/**
 * 3. GET /api/v1/submissions/:id
 * Condition 8: Ownership isolation (user A cannot view user B's submissions).
 * Condition 4: Redaction of hidden test cases via toJSON.
 */
export const getSubmissionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const submission = await Submission.findById(id).populate('questionId', 'title slug topic difficulty type');

    if (!submission) {
      throw new ApiError(404, ERROR_CODES.SUBMISSION_NOT_FOUND, 'Submission not found');
    }

    if (submission.userId.toString() !== req.user.id.toString()) {
      throw new ApiError(404, ERROR_CODES.SUBMISSION_NOT_FOUND, 'Submission not found');
    }

    res.status(200).json({
      success: true,
      data: {
        submission: submission.toJSON()
      },
      meta: {
        requestId: req.requestId || req.id,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. GET /api/v1/submissions
 * Paginated list of user's past submissions (user-isolated).
 */
export const listSubmissions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, questionId } = req.query;
    const filter = { userId };
    if (questionId) filter.questionId = questionId;

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * Math.max(1, parseInt(limit, 10));
    const parsedLimit = Math.min(50, Math.max(1, parseInt(limit, 10)));

    const [submissions, total] = await Promise.all([
      Submission.find(filter)
        .populate('questionId', 'title slug topic difficulty type')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit),
      Submission.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: {
        submissions: submissions.map((s) => s.toJSON()),
        pagination: {
          total,
          page: parseInt(page, 10),
          limit: parsedLimit,
          pages: Math.ceil(total / parsedLimit) || 1
        }
      },
      meta: {
        requestId: req.requestId || req.id,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 5. POST /api/v1/submissions/:id/retry
 * Condition 5: Retry a failed or pending submission once ML is back online.
 * Condition 8: Ownership isolation.
 */
export const retrySubmission = async (req, res, next) => {
  try {
    const { id } = req.params;
    const submission = await Submission.findById(id);

    if (!submission) {
      throw new ApiError(404, ERROR_CODES.SUBMISSION_NOT_FOUND, 'Submission not found');
    }

    if (submission.userId.toString() !== req.user.id.toString()) {
      throw new ApiError(404, ERROR_CODES.SUBMISSION_NOT_FOUND, 'Submission not found');
    }

    if (submission.status === 'evaluated') {
      throw new ApiError(
        400,
        ERROR_CODES.SUBMISSION_NOT_RETRYABLE,
        'Submission has already been evaluated and does not need retry'
      );
    }

    const qDoc = await Question.findById(submission.questionId).select(
      '+referenceAnswer +referenceSolution'
    );
    if (!qDoc) {
      throw new ApiError(404, ERROR_CODES.QUESTION_NOT_FOUND, 'Associated question no longer exists');
    }

    try {
      if (submission.type === 'coding') {
        const fullTestCases = (qDoc.testCases || []).map((tc) => ({
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          isHidden: tc.isHidden
        }));

        const evalResult = await evaluateCodeInMl({
          code: submission.code,
          language: submission.language,
          testCases: fullTestCases,
          timeLimitSeconds: qDoc.timeLimitSeconds || 3.0,
          visibleOnly: false,
          requestId: req.requestId || req.id
        });

        const scoreResult = await scoreAssessmentInMl({
          type: 'coding',
          difficulty: qDoc.difficulty,
          codingResult: {
            passRatio: evalResult.passRatio,
            totalTests: evalResult.totalTests,
            passedTests: evalResult.passedTests,
            failedTests: evalResult.failedTests,
            avgRuntimeMs: evalResult.avgRuntimeMs
          },
          requestId: req.requestId || req.id
        });

        submission.status = 'evaluated';
        submission.evaluation = evalResult;
        submission.score = scoreResult.overallScore;
        submission.scoreBreakdown = scoreResult.breakdown;
        submission.feedback = scoreResult.feedback;
        submission.errorDetails = null;
        await submission.save();
      } else if (submission.type === 'conceptual') {
        const evalResult = await evaluateAnswerInMl({
          questionText: qDoc.questionText || qDoc.description,
          referenceAnswer: qDoc.referenceAnswer || '',
          keyConcepts: qDoc.keyConcepts || [],
          candidateAnswer: submission.answerText,
          requestId: req.requestId || req.id
        });

        const scoreResult = await scoreAssessmentInMl({
          type: 'conceptual',
          difficulty: qDoc.difficulty,
          nlpResult: {
            semanticSimilarity: evalResult.semanticSimilarity,
            conceptCoverage: evalResult.conceptCoverage,
            wordCount: evalResult.wordCount,
            matchedConcepts: evalResult.matchedConcepts,
            missingConcepts: evalResult.missingConcepts
          },
          requestId: req.requestId || req.id
        });

        submission.status = 'evaluated';
        submission.evaluation = evalResult;
        submission.score = scoreResult.overallScore;
        submission.scoreBreakdown = scoreResult.breakdown;
        submission.feedback = scoreResult.feedback;
        submission.errorDetails = null;
        await submission.save();
      }

      res.status(200).json({
        success: true,
        data: {
          submission: submission.toJSON()
        },
        meta: {
          requestId: req.requestId || req.id,
          timestamp: new Date().toISOString()
        }
      });
    } catch (mlErr) {
      submission.status = 'failed';
      submission.errorDetails = {
        message: mlErr.message || 'ML service retry failed',
        code: mlErr.code || ERROR_CODES.ML_SERVICE_UNAVAILABLE
      };
      await submission.save();

      throw new ApiError(
        503,
        ERROR_CODES.ML_SERVICE_UNAVAILABLE,
        'ML Service is still unavailable. Submission remains failed.',
        {
          submissionId: submission._id.toString(),
          status: 'failed'
        }
      );
    }
  } catch (error) {
    next(error);
  }
};
