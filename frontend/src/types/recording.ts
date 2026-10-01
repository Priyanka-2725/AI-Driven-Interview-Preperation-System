export interface FluencyBreakdown {
  wpmPenalty: number;
  fillerPenalty: number;
  silencePenalty: number;
}

export interface FluencyResult {
  score: number;
  wpm: number;
  fillerWordCount: number;
  fillerWordBreakdown: Record<string, number>;
  silenceRatio: number;
  breakdown: FluencyBreakdown;
}

export interface ConfidenceResult {
  isSample: boolean;
  score: number;
  eyeContactPercent: number;
  headStability: string;
  note: string;
}

export interface Recording {
  _id: string;
  userId: string;
  originalFilename: string;
  durationSeconds: number;
  status: 'uploaded' | 'processing' | 'analyzed' | 'failed';
  failureReason: string | null;
  fluencyResult: FluencyResult | null;
  confidenceResult: ConfidenceResult | null;
  analyzedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
