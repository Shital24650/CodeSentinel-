import React, { useState, useEffect, useRef } from "react";
import { TraceStep } from "../types";
import { Terminal, ChevronDown, ChevronRight, CheckCircle2, AlertTriangle, Loader2, PlayCircle } from "lucide-react";
import Markdown from "react-markdown";

interface TraceConsoleProps {
  steps: TraceStep[];
  currentStepIndex: number;
}

export default function TraceConsole({ steps, currentStepIndex }: TraceConsoleProps) {
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({ 1: true });
  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Automatically expand active step
  useEffect(() => {
    if (currentStepIndex > 0 && currentStepIndex <= steps.length) {
      setExpandedSteps((prev) => ({
        ...prev,
        [currentStepIndex]: true,
      }));
    }
  }, [currentStepIndex, steps.length]);

  const toggleStep = (stepNum: number) => {
    setExpandedSteps((prev) => ({
      ...prev,
      [stepNum]: !prev[stepNum],
    }));
  };

  return (
    <div id="trace-console" className="bg-gray-950 border border-gray-800 rounded-lg overflow-hidden flex flex-col">
      {/* Console Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-red-500" />
          <span className="font-mono text-xs font-bold text-gray-200 tracking-wider">
            AGENT_REASONING_TRACE_CONSOLES
          </span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[10px] text-gray-500">
          <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
          ACTIVE_SESSION
        </div>
      </div>

      {/* Steps List */}
      <div className="p-3 flex flex-col gap-2.5 max-h-[600px] overflow-y-auto">
        {steps.map((st) => {
          const isExpanded = !!expandedSteps[st.step];
          const isCurrent = currentStepIndex === st.step;
          
          return (
            <div
              id={`trace-step-${st.step}`}
              key={st.step}
              className={`border rounded overflow-hidden transition-all duration-200 ${
                isCurrent
                  ? "border-red-500/30 bg-red-950/5"
                  : st.status === "completed"
                  ? "border-gray-800 bg-gray-900/10"
                  : "border-gray-900 bg-transparent"
              }`}
            >
              {/* Step Title Header Accordion */}
              <button
                id={`btn-toggle-step-${st.step}`}
                onClick={() => toggleStep(st.step)}
                className="w-full flex items-center justify-between p-3 cursor-pointer text-left focus:outline-none"
              >
                <div className="flex items-start gap-3">
                  {/* Status Icon */}
                  <div className="mt-0.5">
                    {st.status === "running" && (
                      <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
                    )}
                    {st.status === "completed" && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    )}
                    {st.status === "failed" && (
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    )}
                    {st.status === "idle" && (
                      <PlayCircle className="w-4 h-4 text-gray-700" />
                    )}
                  </div>

                  <div>
                    <h4 className={`font-mono text-xs font-bold tracking-wide ${
                      isCurrent ? "text-red-400" : st.status === "completed" ? "text-gray-200" : "text-gray-500"
                    }`}>
                      {st.title}
                    </h4>
                    <p className="text-[10px] text-gray-400 font-sans mt-0.5">
                      {st.description}
                    </p>
                  </div>
                </div>

                <div>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )}
                </div>
              </button>

              {/* Step Stream Output Body */}
              {isExpanded && (
                <div className="border-t border-gray-900/80 bg-gray-950/80 px-4 py-3.5 font-mono text-xs leading-6 text-gray-300">
                  {st.text ? (
                    <div className="prose prose-invert max-w-none text-gray-300">
                      <Markdown>{st.text}</Markdown>
                    </div>
                  ) : st.status === "running" ? (
                    <div className="flex items-center gap-2 text-gray-500 italic text-[11px]">
                      <Loader2 className="w-3 h-3 animate-spin text-red-500" />
                      Streaming initial analysis from Gemini API...
                    </div>
                  ) : (
                    <span className="text-gray-600 italic text-[11px]">No log entries recorded.</span>
                  )}
                  {/* Scroll Anchor */}
                  {st.status === "running" && <div ref={consoleEndRef} />}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
