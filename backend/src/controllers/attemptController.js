import Attempt from '../models/Attempt.js';
import Question from '../models/Question.js';
import Submission from '../models/Submission.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../config/constants.js';

export const createAttempt = async (req, res, next) => {
  try {
    const { questionIds, topic, difficulty, count = 3 } = req.body;
    const userId = req.user.id;

    let targetQuestionIds = [];

    if (Array.isArray(questionIds) && questionIds.length > 0) {
      const found = await Question.find({ _id: { $in: questionIds } });
      if (found.length !== questionIds.length) {
        throw new ApiError(
          404,
          ERROR_CODES.QUESTION_NOT_FOUND,
          'One or more specified questions were not found'
        );
      }
      targetQuestionIds = found.map((q) => q._id);
    } else {
      const filter = { isCurated: true };
      if (topic) filter.topic = topic;
      if (difficulty) filter.difficulty = difficulty;

      const candidates = await Question.find(filter).limit(count);
      if (candidates.length === 0) {
        throw new ApiError(
          404,
          ERROR_CODES.QUESTION_NOT_FOUND,
          'No questions match the requested criteria'
        );
      }
      targetQuestionIds = candidates.map((q) => q._id);
    }

    const titleTopic = topic ? topic.charAt(0).toUpperCase() + topic.slice(1) : 'General';
    const titleDifficulty = difficulty ? ` (${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)})` : '';
    const title = `Technical Assessment - ${titleTopic}${titleDifficulty}`;

    const attempt = await Attempt.create({
      userId,
      title,
      topic: topic || 'general',
      difficulty: difficulty || 'medium',
      questions: targetQuestionIds,
      status: 'in_progress'
    });

    const populatedAttempt = await Attempt.findById(attempt._id).populate('questions');

    res.status(201).json({
      success: true,
      data: {
        attempt: populatedAttempt.toJSON()
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

export const getAttemptById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const attempt = await Attempt.findById(id).populate('questions');

    if (!attempt) {
      throw new ApiError(404, ERROR_CODES.ATTEMPT_NOT_FOUND, 'Attempt not found');
    }

    // Condition 8: Ownership isolation
    if (attempt.userId.toString() !== req.user.id.toString()) {
      throw new ApiError(404, ERROR_CODES.ATTEMPT_NOT_FOUND, 'Attempt not found');
    }

    // Fetch submissions associated with this attempt
    const submissions = await Submission.find({
      attemptId: attempt._id,
      userId: req.user.id
    }).sort({ createdAt: 1 });

    const formatted = attempt.toJSON();
    const formattedSubmissions = submissions.map((s) => s.toJSON());

    res.status(200).json({
      success: true,
      data: {
        attempt: formatted,
        submissions: formattedSubmissions
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

export const completeAttempt = async (req, res, next) => {
  try {
    const { id } = req.params;
    const attempt = await Attempt.findById(id);

    if (!attempt) {
      throw new ApiError(404, ERROR_CODES.ATTEMPT_NOT_FOUND, 'Attempt not found');
    }

    // Condition 8: Ownership isolation
    if (attempt.userId.toString() !== req.user.id.toString()) {
      throw new ApiError(404, ERROR_CODES.ATTEMPT_NOT_FOUND, 'Attempt not found');
    }

    if (attempt.status === 'completed') {
      throw new ApiError(
        400,
        ERROR_CODES.ATTEMPT_ALREADY_COMPLETED,
        'Attempt session has already been completed'
      );
    }

    // Calculate composite score: unanswered questions receive 0
    const assignedQuestions = attempt.questions || [];
    let totalScore = 0;

    for (const qId of assignedQuestions) {
      const qObjectId = qId._id || qId;
      const latestSub = await Submission.findOne({
        attemptId: attempt._id,
        questionId: qObjectId,
        status: 'evaluated'
      }).sort({ createdAt: -1 });

      const score = latestSub ? (latestSub.score ?? 0) : 0;
      totalScore += score;
    }

    const compositeScore =
      assignedQuestions.length > 0 ? Math.round(totalScore / assignedQuestions.length) : 0;

    attempt.status = 'completed';
    attempt.completedAt = new Date();
    attempt.compositeScore = compositeScore;
    attempt.summaryScore = compositeScore;
    await attempt.save();

    res.status(200).json({
      success: true,
      data: {
        attempt: attempt.toJSON()
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

export const listUserAttempts = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const attempts = await Attempt.find({ userId }).populate('questions').sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        attempts: attempts.map((a) => a.toJSON())
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
