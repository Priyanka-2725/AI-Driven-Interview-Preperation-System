import Question from '../models/Question.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../config/constants.js';
import { generateQuestionsFromMl } from '../services/mlClient.js';

export const listQuestions = async (req, res, next) => {
  try {
    const { topic, difficulty, type, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (topic) filter.topic = topic;
    if (difficulty) filter.difficulty = difficulty;
    if (type) filter.type = type;

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * Math.max(1, parseInt(limit, 10));
    const parsedLimit = Math.min(50, Math.max(1, parseInt(limit, 10)));

    const [questions, total] = await Promise.all([
      Question.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit),
      Question.countDocuments(filter)
    ]);

    // Condition 4: Strip secret fields and hidden test cases via toJSON()
    const sanitizedQuestions = questions.map((q) => q.toJSON());

    res.status(200).json({
      success: true,
      data: {
        questions: sanitizedQuestions,
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

export const getQuestionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let question;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      question = await Question.findById(id);
    }
    if (!question) {
      question = await Question.findOne({ slug: id.toLowerCase() });
    }

    if (!question) {
      throw new ApiError(404, ERROR_CODES.QUESTION_NOT_FOUND, 'Question not found');
    }

    // Condition 4: Strip referenceSolution, referenceAnswer, hidden test cases
    res.status(200).json({
      success: true,
      data: {
        question: question.toJSON()
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

export const generateQuestions = async (req, res, next) => {
  try {
    const { topic, difficulty, type, count = 1, generateVariations = false } = req.body;

    const mlResponse = await generateQuestionsFromMl({
      topic,
      difficulty,
      type,
      count,
      generateVariations,
      requestId: req.id
    });

    const rawQuestions = mlResponse.questions || [];
    const savedOrSanitized = [];

    for (const q of rawQuestions) {
      // Look up existing or save newly generated variant
      let doc = await Question.findOne({ slug: q.slug });
      if (!doc) {
        doc = await Question.create({
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
          isCurated: !generateVariations
        });
      }
      // Condition 4: Redact reference answers/solutions and hidden tests before sending to client
      savedOrSanitized.push(doc.toJSON());
    }

    res.status(201).json({
      success: true,
      data: {
        question: savedOrSanitized[0] || null,
        questions: savedOrSanitized
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
