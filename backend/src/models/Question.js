import mongoose from 'mongoose';

const testCaseSchema = new mongoose.Schema(
  {
    input: {
      type: String,
      default: ''
    },
    expectedOutput: {
      type: String,
      default: ''
    },
    isHidden: {
      type: Boolean,
      default: false
    }
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true
    },
    topic: {
      type: String,
      required: true,
      enum: [
        'arrays',
        'trees',
        'graphs',
        'strings',
        'system-design',
        'javascript',
        'python',
        'databases'
      ],
      index: true
    },
    difficulty: {
      type: String,
      required: true,
      enum: ['easy', 'medium', 'hard'],
      index: true
    },
    type: {
      type: String,
      required: true,
      enum: ['coding', 'conceptual'],
      index: true
    },
    description: {
      type: String,
      required: true
    },
    questionText: {
      type: String,
      default: null
    },
    starterCode: {
      python: {
        type: String,
        default: null
      }
    },
    testCases: {
      type: [testCaseSchema],
      default: []
    },
    referenceSolution: {
      type: String,
      select: false,
      default: null
    },
    referenceAnswer: {
      type: String,
      select: false,
      default: null
    },
    keyConcepts: {
      type: [String],
      default: []
    },
    timeLimitSeconds: {
      type: Number,
      default: 3.0,
      min: 0.5,
      max: 10.0
    },
    memoryLimitMb: {
      type: Number,
      default: 128
    },
    isCurated: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        // Condition 4: Never leak reference solution, reference answer, or hidden test cases to clients
        delete ret.referenceSolution;
        delete ret.referenceAnswer;
        delete ret.memoryLimitMb; // Not enforced in Week 3; omitted from client payload
        if (Array.isArray(ret.testCases)) {
          ret.testCases = ret.testCases
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
);

questionSchema.index({ topic: 1, difficulty: 1, type: 1 });

const Question = mongoose.model('Question', questionSchema);
export default Question;
