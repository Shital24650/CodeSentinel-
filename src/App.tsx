/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Mode, TraceStep, PRReviewReport, DebugReport, TestWriterReport } from "./types";
import { 
  DEMO_CODE_PR, 
  DEMO_CODE_DEBUG, 
  DEMO_ERROR_DEBUG, 
  DEMO_STACK_DEBUG, 
  DEMO_CODE_TEST, 
  INITIAL_STEPS_PR, 
  INITIAL_STEPS_DEBUG, 
  INITIAL_STEPS_TEST 
} from "./data";
import Header from "./components/Header";
import CodeEditor from "./components/CodeEditor";
import TraceConsole from "./components/TraceConsole";
import ReportViewer from "./components/ReportViewer";
import { Sparkles, Terminal, ShieldAlert, CheckCircle2, ShieldHalf } from "lucide-react";

export default function App() {
  const [mode, setMode] = useState<Mode>("pr_review");
  const [code, setCode] = useState<string>(DEMO_CODE_PR);
  const [language, setLanguage] = useState<string>("python");

  // Debug Assistant specific fields
  const [errorMsg, setErrorMsg] = useState<string>(DEMO_ERROR_DEBUG);
  const [stackTrace, setStackTrace] = useState<string>(DEMO_STACK_DEBUG);

  // Agent State Controls
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [steps, setSteps] = useState<TraceStep[]>(INITIAL_STEPS_PR());
  const [error, setError] = useState<string | null>(null);

  // Final Compiled structured JSON outcomes
  const [structuredResult, setStructuredResult] = useState<PRReviewReport | DebugReport | TestWriterReport | null>(null);

  // Sync default code template when user swaps active mode (unless they customized it)
  useEffect(() => {
    if (mode === "pr_review") {
      setCode(DEMO_CODE_PR);
      setSteps(INITIAL_STEPS_PR());
    } else if (mode === "debug_assistant") {
      setCode(DEMO_CODE_DEBUG);
      setErrorMsg(DEMO_ERROR_DEBUG);
      setStackTrace(DEMO_STACK_DEBUG);
      setSteps(INITIAL_STEPS_DEBUG());
    } else if (mode === "test_writer") {
      setCode(DEMO_CODE_TEST);
      setSteps(INITIAL_STEPS_TEST());
    }
    setStructuredResult(null);
    setCurrentStepIndex(0);
    setError(null);
  }, [mode]);

  // Execute the Multi-Step Reasoning Loop
  const handleRunSentinel = async () => {
    if (isRunning) return;

    // Reset loop states
    setIsRunning(true);
    setIsCompiling(false);
    setStructuredResult(null);
    setError(null);
    setCurrentStepIndex(0);

    // Initialize fresh step templates based on mode
    let freshSteps: TraceStep[] = [];
    if (mode === "pr_review") {
      freshSteps = INITIAL_STEPS_PR();
    } else if (mode === "debug_assistant") {
      freshSteps = INITIAL_STEPS_DEBUG();
    } else if (mode === "test_writer") {
      freshSteps = INITIAL_STEPS_TEST();
    }
    setSteps(freshSteps);

    const accumulatedHistory: string[] = [];

    try {
      // Loop sequentially through each step/pass
      for (let i = 0; i < freshSteps.length; i++) {
        const currentStep = freshSteps[i];
        const stepNum = currentStep.step;
        
        setCurrentStepIndex(stepNum);
        
        // Mark current step as running
        setSteps((prev) =>
          prev.map((s) => (s.step === stepNum ? { ...s, status: "running" } : s))
        );

        // Make streaming call to Express backend
        const response = await fetch("/api/agent/run-step", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mode,
            step: stepNum,
            code,
            history: accumulatedHistory,
            errorMsg: mode === "debug_assistant" ? errorMsg : "",
            stackTrace: mode === "debug_assistant" ? stackTrace : "",
          }),
        });

        if (!response.ok) {
          throw new Error(`Agent loop failed at step ${stepNum} [status ${response.status}]`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder("utf-8");

        if (!reader) {
          throw new Error("Response body is not readable.");
        }

        let done = false;
        let streamedText = "";

        // Read stream chunks in real-time
        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) {
            const chunk = decoder.decode(value, { stream: !done });
            
            // Check for server-side exceptions printed inside stream
            if (chunk.startsWith("[ERROR:")) {
              const cleanedError = chunk.replace("[ERROR:", "").replace("]", "");
              throw new Error(cleanedError);
            }

            streamedText += chunk;

            // Stream text directly into step logs
            setSteps((prev) =>
              prev.map((s) => (s.step === stepNum ? { ...s, text: streamedText } : s))
            );
          }
        }

        // Mark current step as completed & capture history
        setSteps((prev) =>
          prev.map((s) => (s.step === stepNum ? { ...s, status: "completed" } : s))
        );
        accumulatedHistory.push(streamedText);
      }

      // Multi-Step loop completed! Now launch Compile Step
      setIsCompiling(true);
      setCurrentStepIndex(0); // Finished reasoning steps, focus on compile

      const compilerResponse = await fetch("/api/agent/compile-results", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode,
          code,
          history: accumulatedHistory,
        }),
      });

      if (!compilerResponse.ok) {
        let errMsg = "Failed to compile trace into structured JSON format.";
        try {
          const errorData = await compilerResponse.json();
          errMsg = errorData?.error || errMsg;
        } catch {
          try {
            const textMsg = await compilerResponse.text();
            errMsg = textMsg || errMsg;
          } catch {}
        }
        throw new Error(errMsg);
      }

      let reportData;
      const contentType = compilerResponse.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        reportData = await compilerResponse.json();
      } else {
        const textResponse = await compilerResponse.text();
        console.error("Non-JSON compiler response received:", textResponse);
        if (textResponse.includes("<!DOCTYPE") || textResponse.includes("<!doctype")) {
          throw new Error("Received HTML instead of JSON. The server might be restarting or experiencing high demand. Please try again in a few seconds.");
        }
        throw new Error(`Invalid response format from compile server: ${textResponse.slice(0, 200)}`);
      }
      setStructuredResult(reportData);

    } catch (err: any) {
      console.error(err);
      setError(err?.message || "An unhandled error occurred in the agentic chain.");
      
      // Update running step as failed
      setSteps((prev) =>
        prev.map((s) => (s.status === "running" ? { ...s, status: "failed" } : s))
      );
    } finally {
      setIsRunning(false);
      setIsCompiling(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col font-sans selection:bg-red-500/20 selection:text-red-400">
      {/* Sticky Header with mode switch tabs */}
      <Header activeMode={mode} setActiveMode={setMode} isRunning={isRunning || isCompiling} />

      {/* Main Multi-Column Split Area */}
      <main className="flex-1 p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Hand: Input and Code Base Panel */}
        <section className="lg:col-span-5 xl:col-span-5 flex flex-col h-full">
          <CodeEditor
            mode={mode}
            code={code}
            setCode={setCode}
            errorMsg={errorMsg}
            setErrorMsg={setErrorMsg}
            stackTrace={stackTrace}
            setStackTrace={setStackTrace}
            onAnalyze={handleRunSentinel}
            isRunning={isRunning || isCompiling}
            language={language}
            setLanguage={setLanguage}
          />
        </section>

        {/* Right Hand: Deep Thinking Trace & Structured Reports Panel */}
        <section className="lg:col-span-7 xl:col-span-7 flex flex-col gap-6 h-full justify-start">
          
          {/* Action Error Banners */}
          {error && (
            <div id="error-banner" className="bg-red-950/40 border border-red-500/30 p-4 rounded-lg flex items-start gap-3 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
              <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-mono text-xs font-bold text-red-400">AGENTIC_CHAIN_INTERRUPTION</h4>
                <p className="text-xs text-gray-300 font-sans mt-1 leading-relaxed">
                  {error}
                </p>
                <button
                  id="btn-retry-analysis"
                  onClick={handleRunSentinel}
                  className="mt-3 px-3 py-1 bg-red-950 border border-red-500/40 hover:bg-red-900/60 font-mono text-[10px] text-red-400 font-bold rounded cursor-pointer transition-all duration-200"
                >
                  RE-INITIALIZE_CHAIN
                </button>
              </div>
            </div>
          )}

          {/* Reasoning trace collapsible drawer console */}
          {(isRunning || steps.some((s) => s.status !== "idle")) && (
            <div className="transition-all duration-300">
              <TraceConsole steps={steps} currentStepIndex={currentStepIndex} />
            </div>
          )}

          {/* Compiled Structured outcomes board */}
          <div className="flex-1 flex flex-col">
            <ReportViewer mode={mode} report={structuredResult} isLoading={isCompiling} />
          </div>
        </section>
      </main>

      {/* Connection to AgentTrust Technical Footer */}
      <footer id="footer-note" className="border-t border-gray-900 bg-gray-950/80 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <p className="font-sans text-[11px] text-gray-500">
          CodeSentinel Security Agency &middot; Stateless Session Architecture &middot; Engine v1.2
        </p>
        <p className="font-mono text-[11px] text-gray-400 flex items-center justify-center sm:justify-start gap-1.5">
          <ShieldHalf className="w-4 h-4 text-red-500" />
          Built with <span className="text-gray-300 font-bold underline decoration-red-500/40">AgentTrust</span> reliability principles — multi-step reasoning, self-validation, and transparent trace logging.
        </p>
      </footer>
    </div>
  );
}
