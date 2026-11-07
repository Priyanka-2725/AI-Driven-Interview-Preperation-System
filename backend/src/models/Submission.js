import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
      index: true
    },
    attemptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Attempt',
      default: null,
      index: true
    },
    type: {
      type: String,
      required: true,
      enum: ['coding', 'conceptual']
    },
    code: {
      type: String,
      default: null
    },
    language: {
      type: String,
      default: 'python'
    },
    answerText: {
      type: String,
      default: null
    },
    status: {
      type: String,
      enum: ['pending', 'evaluated', 'failed'],
      default: 'pending',
      index: true
    },
    evaluation: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    scoreBreakdown: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    feedback: {
      type: String,
      default: ''
    },
    errorDetails: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.referenceSolution;
        delete ret.referenceAnswer;

        // Condition 4: Never reveal hidden test inputs/outputs to candidates in evaluation results
        const sanitizeTestList = (list) => {
          if (!Array.isArray(list)) return list;
          return list.map((r) => {
            if (r && r.isHidden) {
              const cleaned = { ...r };
              cleaned.input = null;
              cleaned.expected = null;
              cleaned.expectedOutput = null;
              cleaned.actual = null;
              cleaned.actualOutput = null;
              return cleaned;
            }
            return r;
          });
        };

        if (ret.evaluation) {
          if (Array.isArray(ret.evaluation.results)) {
            ret.evaluation.results = sanitizeTestList(ret.evaluation.results);
          }
          if (Array.isArray(ret.evaluation.testResults)) {
            ret.evaluation.testResults = sanitizeTestList(ret.evaluation.testResults);
          }
          if (ret.evaluation.codingResult) {
            if (Array.isArray(ret.evaluation.codingResult.results)) {
              ret.evaluation.codingResult.results = sanitizeTestList(ret.evaluation.codingResult.results);
            }
            if (Array.isArray(ret.evaluation.codingResult.testResults)) {
              ret.evaluation.codingResult.testResults = sanitizeTestList(ret.evaluation.codingResult.testResults);
            }
          }
        }

        // Sanitize populated questionId if present
        if (ret.questionId && typeof ret.questionId === 'object') {
          delete ret.questionId.referenceSolution;
          delete ret.questionId.referenceAnswer;
          if (Array.isArray(ret.questionId.testCases)) {
            ret.questionId.testCases = ret.questionId.testCases
              .filter((tc) => !tc.isHidden)
              .map((tc) => ({
                input: tc.input,
                expectedOutput: tc.expectedOutput,
                isHidden: false
              }));
          }
        }
      }
    }
  }
);

submissionSchema.index({ userId: 1, createdAt: -1 });

const Submission = mongoose.model('Submission', submissionSchema);
export default Submission;
