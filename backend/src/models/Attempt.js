import mongoose from 'mongoose';

const attemptQuestionSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true
    },
    order: {
      type: Number,
      required: true
    }
  },
  { _id: false }
);

const attemptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      default: 'Technical Assessment'
    },
    topic: {
      type: String,
      default: 'general'
    },
    difficulty: {
      type: String,
      default: 'medium'
    },
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question'
      }
    ],
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'abandoned', 'in-progress'],
      default: 'in_progress',
      index: true
    },
    startedAt: {
      type: Date,
      default: Date.now
    },
    completedAt: {
      type: Date,
      default: null
    },
    compositeScore: {
      type: Number,
      default: null
    },
    summaryScore: {
      type: Number,
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
        // Strip any secret fields that might have leaked from populated questions
        delete ret.referenceSolution;
        delete ret.referenceAnswer;
        if (Array.isArray(ret.questions)) {
          ret.questions = ret.questions.map((q) => {
            if (q && typeof q === 'object' && q._id) {
              const qJson = typeof q.toJSON === 'function' ? q.toJSON() : { ...q };
              delete qJson.referenceSolution;
              delete qJson.referenceAnswer;
              if (Array.isArray(qJson.testCases)) {
                qJson.testCases = qJson.testCases
                  .filter((tc) => !tc.isHidden)
                  .map((tc) => ({
                    input: tc.input,
                    expectedOutput: tc.expectedOutput,
                    isHidden: false
                  }));
              }
              return qJson;
            }
            return q;
          });
        }
      }
    }
  }
);

attemptSchema.index({ userId: 1, createdAt: -1 });

const Attempt = mongoose.model('Attempt', attemptSchema);
export default Attempt;
