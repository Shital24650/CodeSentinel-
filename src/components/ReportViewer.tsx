import React, { useState } from "react";
import { Mode, PRReviewReport, DebugReport, TestWriterReport, Finding } from "../types";
import { 
  ShieldCheck, 
  Bug, 
  FileCode, 
  Copy, 
  Check, 
  Sparkles, 
  AlertOctagon, 
  CheckCircle, 
  Code,
  ListFilter,
  BarChart4
} from "lucide-react";
import Markdown from "react-markdown";

interface ReportViewerProps {
  mode: Mode;
  report: PRReviewReport | DebugReport | TestWriterReport | null;
  isLoading: boolean;
}

export default function ReportViewer({ mode, report, isLoading }: ReportViewerProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-gray-950 border border-gray-800 rounded-lg min-h-[400px]">
        <div className="relative flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
          <Sparkles className="w-5 h-5 text-red-500 absolute animate-pulse" />
        </div>
        <p className="mt-4 font-mono text-xs text-red-400 font-bold tracking-widest animate-pulse">
          COMPILING_FINAL_STRUCTURED_REPORT
        </p>
        <p className="mt-1 text-xs text-gray-500 font-sans">
          Structuring trace logs with Gemini JSON schemas...
        </p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 bg-gray-950 border border-gray-800 rounded-lg text-center min-h-[400px]">
        <div className="p-4 bg-gray-900 border border-gray-800 rounded-full text-gray-500 mb-4">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h3 className="font-mono text-sm font-bold text-gray-300 uppercase tracking-wider">
          STANDBY_MODE
        </h3>
        <p className="mt-2 text-xs text-gray-500 max-w-sm leading-relaxed">
          Pasted source code is analyzed step-by-step to compile a validated logical and security audit report.
        </p>
      </div>
    );
  }

  return (
    <div id="report-viewer" className="flex flex-col h-full bg-gray-950 border border-gray-800 rounded-lg overflow-hidden">
      {/* Report Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-red-500" />
          <span className="font-mono text-xs font-bold text-gray-200 tracking-wider">
            COMPILED_AUDIT_OUTCOMES
          </span>
        </div>
      </div>

      <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-6">
        {/* ==================== MODE 1: PR REVIEW ==================== */}
        {mode === "pr_review" && (report as PRReviewReport).findings && (
          <>
            {/* Confidence & Self-Validation Stats Indicator */}
            {(() => {
              const r = report as PRReviewReport;
              const confidencePercentage = r.confidence.totalBeforeValidation > 0
                ? Math.round((r.confidence.validatedCount / r.confidence.totalBeforeValidation) * 100)
                : 100;
                
              return (
                <div id="confidence-card" className="bg-gray-900 border border-gray-800 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-red-400">
                      <BarChart4 className="w-4 h-4 text-red-500" />
                      SELF_VALIDATION_CONFIDENCE
                    </div>
                    <span className="font-mono text-xs text-gray-300 font-bold">
                      {confidencePercentage}% APPROVED
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-950 rounded-full h-1.5 border border-gray-800 overflow-hidden mb-3">
                    <div
                      className="bg-red-500 h-full transition-all duration-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                      style={{ width: `${confidencePercentage}%` }}
                    ></div>
                  </div>

                  <p className="font-mono text-[10px] text-gray-400 leading-4">
                    <span className="text-gray-200 font-bold">{r.confidence.validatedCount}</span> findings validated &middot;{" "}
                    <span className="text-gray-500 font-bold">{r.confidence.removedCount}</span> removed as speculative/unsubstantiated
                  </p>

                  {r.confidence.explanation && (
                    <div className="mt-2.5 pt-2 border-t border-gray-800/80 text-[10px] text-gray-500 font-sans leading-relaxed italic">
                      &quot;{r.confidence.explanation}&quot;
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Deliberate Benchmark Card (Shown for Python Demo) */}
            {(() => {
              const r = report as PRReviewReport;
              if (r.knownIssuesFound > 0) {
                return (
                  <div id="benchmark-card" className="bg-red-950/20 border border-red-500/30 p-4 rounded-lg flex items-start gap-3">
                    <AlertOctagon className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-mono text-[11px] font-bold text-red-400">
                        DEMO_CODE_BENCHMARK_SCORE
                      </h4>
                      <p className="text-xs text-gray-200 font-sans mt-0.5 font-semibold">
                        Found {r.knownIssuesFound}/4 known issues in the demo code.
                      </p>
                      <ul className="text-[10px] text-gray-400 font-mono list-disc pl-4 mt-2 space-y-1">
                        <li className="text-emerald-500/90">SQL injection via concatenation (Fixed)</li>
                        <li className="text-emerald-500/90">Missing KeyError exception handling (Fixed)</li>
                        <li className="text-emerald-500/90">Unsafe eval() on untrusted inputs (Fixed)</li>
                        <li className="text-emerald-500/90">No FileNotFoundError protection (Fixed)</li>
                      </ul>
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {/* Findings Filter Bar */}
            <div className="flex items-center justify-between border-b border-gray-800 pb-2">
              <div className="flex items-center gap-1.5 font-mono text-[10px] text-gray-400 font-bold">
                <ListFilter className="w-3.5 h-3.5" />
                FILTER_SEVERITY
              </div>
              <div className="flex gap-1.5">
                {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((sev) => {
                  const isActive = severityFilter === sev;
                  return (
                    <button
                      id={`btn-filter-${sev}`}
                      key={sev}
                      onClick={() => setSeverityFilter(sev)}
                      className={`px-2 py-0.5 text-[9px] font-mono rounded border transition-all duration-200 cursor-pointer ${
                        isActive
                          ? "bg-red-500/10 border-red-500/30 text-red-400"
                          : "bg-transparent border-gray-800 text-gray-500 hover:text-gray-300"
                      }`}
                    >
                      {sev}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Findings Stack */}
            <div className="flex flex-col gap-3">
              {(() => {
                const r = report as PRReviewReport;
                const filteredFindings = r.findings.filter(
                  (f) => severityFilter === "ALL" || f.severity === severityFilter
                );

                if (filteredFindings.length === 0) {
                  return (
                    <div className="text-center py-6 border border-dashed border-gray-800 rounded font-mono text-[10px] text-gray-600">
                      NO_VALIDATED_FINDINGS_IN_SELECTION
                    </div>
                  );
                }

                return filteredFindings.map((f, idx) => {
                  const sevColors = {
                    CRITICAL: "bg-red-500/15 text-red-400 border-red-500/30",
                    HIGH: "bg-amber-600/15 text-amber-400 border-amber-500/30",
                    MEDIUM: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
                    LOW: "bg-blue-500/15 text-blue-400 border-blue-500/30",
                  };

                  return (
                    <div
                      id={`finding-card-${f.id || idx}`}
                      key={f.id || idx}
                      className="bg-gray-900/40 border border-gray-800 rounded-lg p-4 flex flex-col gap-3 hover:border-gray-700/80 transition-all duration-200"
                    >
                      {/* Finding Card Header */}
                      <div className="flex items-start justify-between gap-2 flex-wrap sm:flex-nowrap">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono border font-bold ${sevColors[f.severity]}`}>
                            {f.severity}
                          </span>
                          <span className="font-mono text-[10px] text-gray-500 bg-gray-900 border border-gray-800 px-1.5 py-0.5 rounded font-bold">
                            {f.line}
                          </span>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-mono text-xs font-bold text-gray-200">
                          {f.title}
                        </h4>
                        <p className="text-xs text-gray-400 font-sans mt-1 leading-relaxed">
                          {f.risk}
                        </p>
                      </div>

                      {/* Code Fix Block */}
                      <div className="bg-gray-950 border border-gray-800 rounded overflow-hidden">
                        <div className="flex items-center justify-between px-3 py-1.5 bg-gray-900 border-b border-gray-800">
                          <div className="flex items-center gap-1.5 font-mono text-[9px] text-gray-500 font-bold">
                            <Code className="w-3 h-3 text-red-500" />
                            SUGGESTED_REPLACEMENT_PATCH
                          </div>
                          <button
                            id={`btn-copy-fix-${idx}`}
                            onClick={() => copyToClipboard(f.fix, `fix-${idx}`)}
                            className="p-1 text-gray-500 hover:text-gray-300 transition-colors"
                            title="Copy code snippet"
                          >
                            {copiedId === `fix-${idx}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <pre className="p-3 overflow-x-auto text-[11px] font-mono text-gray-300 leading-5">
                          <code>{f.fix}</code>
                        </pre>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </>
        )}

        {/* ==================== MODE 2: DEBUG ASSISTANT ==================== */}
        {mode === "debug_assistant" && (report as DebugReport).hypotheses && (
          <div className="flex flex-col gap-6">
            {/* Candidate Hypotheses Section */}
            <div>
              <h4 className="font-mono text-[11px] font-bold text-red-400 mb-3 tracking-wider">
                ROOT_CAUSE_HYPOTHESES
              </h4>
              <div className="flex flex-col gap-2.5">
                {(report as DebugReport).hypotheses.map((h, i) => (
                  <div
                    id={`hypothesis-card-${i}`}
                    key={i}
                    className="flex gap-3 bg-gray-900/40 border border-gray-800 p-3.5 rounded-lg items-start"
                  >
                    <div className="flex items-center justify-center h-5 w-5 rounded bg-gray-800 text-[10px] font-mono text-gray-400 font-bold">
                      #{h.rank}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[10px] font-bold text-gray-300">
                          {h.cause}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded font-mono text-[8px] font-bold border ${
                          h.likelihood === "HIGH" || h.likelihood === "CRITICAL"
                            ? "bg-red-500/10 border-red-500/20 text-red-400"
                            : h.likelihood === "MEDIUM"
                            ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
                            : "bg-blue-500/10 border-blue-500/20 text-blue-400"
                        }`}>
                          {h.likelihood} PROBABILITY
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Isolate culprit line */}
            <div id="isolated-culprit-card" className="bg-gray-900/20 border border-gray-800 p-4 rounded-lg flex items-start gap-3">
              <AlertOctagon className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-mono text-[10px] font-bold text-red-400">
                  ISOLATED_BUG_LOCATION
                </h4>
                <p className="text-xs font-mono text-gray-200 mt-1 font-bold">
                  {(report as DebugReport).isolatedLine}
                </p>
              </div>
            </div>

            {/* Mechanical Explanation */}
            <div id="explanation-card">
              <h4 className="font-mono text-[11px] font-bold text-red-400 mb-2 tracking-wider">
                MECHANICAL_DIAGNOSTICS
              </h4>
              <div className="prose prose-invert bg-gray-900/40 border border-gray-800 rounded-lg p-4 font-sans text-xs leading-6 text-gray-300">
                <Markdown>{(report as DebugReport).explanation}</Markdown>
              </div>
            </div>

            {/* Optimized Patch */}
            <div id="fixed-code-card">
              <h4 className="font-mono text-[11px] font-bold text-red-400 mb-2 tracking-wider">
                RESOLVED_TARGET_PATCH
              </h4>
              <div className="bg-gray-950 border border-gray-800 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-3 py-1.5 bg-gray-900 border-b border-gray-800">
                  <span className="font-mono text-[9px] text-gray-500 font-bold">
                    CORRECTED_SOURCE_SNIPPET
                  </span>
                  <button
                    id="btn-copy-fixed-code"
                    onClick={() => copyToClipboard((report as DebugReport).fixedCode, "fixedCode")}
                    className="p-1 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {copiedId === "fixedCode" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <pre className="p-4 overflow-x-auto text-[11px] font-mono text-gray-300 leading-5">
                  <code>{(report as DebugReport).fixedCode}</code>
                </pre>
              </div>
            </div>

            {/* Verification Suite */}
            <div id="verification-card">
              <h4 className="font-mono text-[11px] font-bold text-red-400 mb-2 tracking-wider">
                VERIFICATION_UNIT_TEST
              </h4>
              <div className="bg-gray-950 border border-gray-800 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-3 py-1.5 bg-gray-900 border-b border-gray-800">
                  <span className="font-mono text-[9px] text-gray-500 font-bold">
                    REGRESSION_VALIDATION_PROCEDURE
                  </span>
                  <button
                    id="btn-copy-verification"
                    onClick={() => copyToClipboard((report as DebugReport).verification, "verification")}
                    className="p-1 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {copiedId === "verification" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <pre className="p-4 overflow-x-auto text-[11px] font-mono text-gray-300 leading-5 whitespace-pre-wrap">
                  <code>{(report as DebugReport).verification}</code>
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* ==================== MODE 3: TEST WRITER ==================== */}
        {mode === "test_writer" && (report as TestWriterReport).mappedPaths && (
          <div className="flex flex-col gap-6">
            {/* Path Mapping Diagram */}
            <div>
              <h4 className="font-mono text-[11px] font-bold text-red-400 mb-3 tracking-wider">
                LOGICAL_EXECUTION_FLOW_PATHS
              </h4>
              <div className="flex flex-col gap-2 bg-gray-900/40 border border-gray-800 p-4 rounded-lg">
                {(report as TestWriterReport).mappedPaths.map((p, i) => (
                  <div id={`path-card-${i}`} key={i} className="flex gap-2.5 items-center">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="font-mono text-xs text-gray-300">{p}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Prioritized Paths */}
            <div>
              <h4 className="font-mono text-[11px] font-bold text-red-400 mb-3 tracking-wider">
                3_PRIORITIZED_HIGH_RISK_CHANNELS
              </h4>
              <div className="flex flex-col gap-3">
                {(report as TestWriterReport).prioritizedPaths.map((pp, i) => (
                  <div
                    id={`prioritized-card-${i}`}
                    key={i}
                    className="bg-gray-900/40 border border-gray-800 rounded-lg p-3.5 flex flex-col gap-1 hover:border-gray-700/60"
                  >
                    <div className="flex items-center gap-1.5 font-mono text-[10px] text-red-400 font-bold">
                      <AlertOctagon className="w-3.5 h-3.5 text-red-500" />
                      CRITICAL_PATH_#{i + 1}
                    </div>
                    <p className="text-xs text-gray-200 font-bold font-mono mt-0.5">
                      {pp.path}
                    </p>
                    <p className="text-[11px] text-gray-400 font-sans mt-0.5 leading-relaxed">
                      {pp.risk}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Test File Output */}
            <div id="test-file-card">
              <h4 className="font-mono text-[11px] font-bold text-red-400 mb-2 tracking-wider">
                TARGETED_UNIT_TESTS
              </h4>
              <div className="bg-gray-950 border border-gray-800 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-3 py-1.5 bg-gray-900 border-b border-gray-800">
                  <div className="flex items-center gap-1.5 font-mono text-[9px] text-gray-500 font-bold">
                    <FileCode className="w-3.5 h-3.5 text-red-500" />
                    TARGET_TEST_FILE_MODULE
                  </div>
                  <button
                    id="btn-copy-test-file"
                    onClick={() => copyToClipboard((report as TestWriterReport).testFile, "testFile")}
                    className="p-1 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {copiedId === "testFile" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <pre className="p-4 overflow-x-auto text-[11px] font-mono text-gray-300 leading-5">
                  <code>{(report as TestWriterReport).testFile}</code>
                </pre>
              </div>
            </div>

            {/* Adversarial Test Card */}
            {(() => {
              const r = report as TestWriterReport;
              if (r.adversarialExplanation) {
                return (
                  <div id="adversarial-card" className="bg-red-950/10 border border-red-500/20 p-4.5 rounded-lg">
                    <h4 className="font-mono text-[11px] font-bold text-red-400 mb-2 tracking-wider">
                      ADVERSARIAL_STRESS_INJECTION_ANALYSIS
                    </h4>
                    <p className="text-xs text-gray-300 font-sans leading-relaxed">
                      {r.adversarialExplanation}
                    </p>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
