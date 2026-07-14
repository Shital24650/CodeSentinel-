export type Mode = "pr_review" | "debug_assistant" | "test_writer";

export interface Finding {
  id: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  line: string;
  title: string;
  risk: string;
  fix: string;
}

export interface Confidence {
  validatedCount: number;
  removedCount: number;
  totalBeforeValidation: number;
  explanation: string;
}

export interface PRReviewReport {
  findings: Finding[];
  confidence: Confidence;
  knownIssuesFound: number;
}

export interface Hypothesis {
  rank: number;
  cause: string;
  likelihood: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | string;
}

export interface DebugReport {
  hypotheses: Hypothesis[];
  isolatedLine: string;
  explanation: string;
  fixedCode: string;
  verification: string;
}

export interface PrioritizedPath {
  path: string;
  risk: string;
}

export interface TestWriterReport {
  mappedPaths: string[];
  prioritizedPaths: PrioritizedPath[];
  testFile: string;
  adversarialExplanation: string;
}

export interface TraceStep {
  step: number;
  title: string;
  description: string;
  text: string;
  status: "idle" | "running" | "completed" | "failed";
}
