export type Topic =
  | 'arrays'
  | 'trees'
  | 'graphs'
  | 'strings'
  | 'system-design'
  | 'javascript'
  | 'python'
  | 'databases';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type QuestionType = 'coding' | 'conceptual';

export interface QuestionTestCase {
  input?: string | null;
  expectedOutput?: string | null;
  isHidden: boolean;
}

export interface Question {
  id: string;
  _id?: string;
  title: string;
  slug: string;
  topic: Topic;
  difficulty: Difficulty;
  type: QuestionType;
  description?: string;
  questionText?: string;
  starterCode?: {
    python?: string | null;
  };
  testCases?: QuestionTestCase[];
  timeLimitSeconds?: number;
  isCurated?: boolean;
  keyConcepts?: string[];
  createdAt?: string;
}

export interface CodingTestResult {
  testIndex: number;
  passed: boolean;
  runtimeMs?: number;
  input?: string | null;
  expected?: string | null;
  expectedOutput?: string | null;
  actual?: string | null;
  actualOutput?: string | null;
  error?: string | null;
  isHidden: boolean;
}

export interface CodingEvaluation {
  allPassed: boolean;
  passRatio: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  avgRuntimeMs?: number;
  testResults?: CodingTestResult[];
  results?: CodingTestResult[];
}

export interface ConceptualEvaluation {
  score?: number;
  semanticSimilarity?: number;
  conceptCoverage?: number;
  matchedConcepts?: string[];
  missingConcepts?: string[];
  wordCount?: number;
  feedback?: string;
  engine?: 'neural' | 'heuristic' | string;
}

export interface Submission {
  id: string;
  _id?: string;
  userId: string;
  questionId: string | Question;
  attemptId?: string | null;
  type: QuestionType;
  code?: string | null;
  language?: string;
  answerText?: string | null;
  status: 'pending' | 'evaluated' | 'failed';
  score?: number;
  scoreBreakdown?: {
    testPassWeight?: number;
    runtimeEfficiency?: number;
    similarityScore?: number;
    conceptScore?: number;
    structureScore?: number;
    [key: string]: number | undefined;
  };
  feedback?: string;
  evaluation?: CodingEvaluation | ConceptualEvaluation;
  errorDetails?: {
    message?: string;
    code?: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface Attempt {
  id: string;
  _id?: string;
  userId: string;
  title: string;
  topic: Topic;
  difficulty: Difficulty;
  status: 'in_progress' | 'completed';
  questions: Array<Question | string>;
  compositeScore?: number | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  submissions?: Submission[];
}

export interface RunCodeResult {
  allPassed: boolean;
  passRatio: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  avgRuntimeMs?: number;
  testResults: CodingTestResult[];
}
