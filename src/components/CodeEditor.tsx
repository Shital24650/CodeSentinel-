import React, { useState, useRef, useEffect } from "react";
import { Mode } from "../types";
import { 
  DEMO_CODE_PR, 
  DEMO_CODE_DEBUG, 
  DEMO_ERROR_DEBUG, 
  DEMO_STACK_DEBUG, 
  DEMO_CODE_TEST, 
  detectLanguageHeuristically 
} from "../data";
import { Upload, Terminal, Eye, Edit2, Play, Code2 } from "lucide-react";
import hljs from "highlight.js";
import "highlight.js/styles/atom-one-dark.css";

interface CodeEditorProps {
  mode: Mode;
  code: string;
  setCode: (code: string) => void;
  errorMsg: string;
  setErrorMsg: (msg: string) => void;
  stackTrace: string;
  setStackTrace: (stack: string) => void;
  onAnalyze: () => void;
  isRunning: boolean;
  language: string;
  setLanguage: (lang: string) => void;
}

export default function CodeEditor({
  mode,
  code,
  setCode,
  errorMsg,
  setErrorMsg,
  stackTrace,
  setStackTrace,
  onAnalyze,
  isRunning,
  language,
  setLanguage,
}: CodeEditorProps) {
  const [isEditing, setIsEditing] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const highlightedRef = useRef<HTMLPreElement>(null);

  // Auto-detect language and update highlight.js
  useEffect(() => {
    const detected = detectLanguageHeuristically(code);
    setLanguage(detected);
  }, [code, setLanguage]);

  useEffect(() => {
    if (!isEditing && highlightedRef.current) {
      hljs.highlightElement(highlightedRef.current);
    }
  }, [isEditing, code, language]);

  // Load the standard demo templates based on current mode
  const handleLoadDemo = () => {
    if (mode === "pr_review") {
      setCode(DEMO_CODE_PR);
    } else if (mode === "debug_assistant") {
      setCode(DEMO_CODE_DEBUG);
      setErrorMsg(DEMO_ERROR_DEBUG);
      setStackTrace(DEMO_STACK_DEBUG);
    } else if (mode === "test_writer") {
      setCode(DEMO_CODE_TEST);
    }
    setIsEditing(true);
  };

  // Drag and drop event handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isRunning) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        setCode(content);
        setIsEditing(true);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (isRunning) return;
    
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleFileUploadClick = () => {
    if (!isRunning) fileInputRef.current?.click();
  };

  // Generate line numbers column
  const lineNumbers = code.split("\n").map((_, i) => i + 1);

  return (
    <div 
      id="editor-container"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col h-full bg-gray-950 border rounded-lg overflow-hidden transition-all duration-300 ${
        isDragOver 
          ? "border-red-500/50 shadow-[0_0_25px_rgba(239,68,68,0.1)] bg-gray-950/90" 
          : "border-gray-800"
      }`}
    >
      {/* Editor Subheader Controls */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-gray-400" />
          <span className="font-mono text-xs text-gray-300 font-semibold tracking-wider">
            INPUT_STAGE_RESERVOIR
          </span>
          <span className="text-[10px] bg-gray-800 border border-gray-700/80 text-gray-400 px-1.5 py-0.5 rounded font-mono uppercase">
            {language}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Demo Button */}
          <button
            id="btn-load-demo"
            onClick={handleLoadDemo}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-medium border border-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-800/60 rounded cursor-pointer transition-all duration-200 disabled:opacity-40"
          >
            <Code2 className="w-3.5 h-3.5 text-gray-400" />
            LOAD_DEMO
          </button>

          {/* Upload Button */}
          <button
            id="btn-file-upload"
            onClick={handleFileUploadClick}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-medium border border-gray-800 text-gray-400 hover:text-gray-200 hover:bg-gray-800/60 rounded cursor-pointer transition-all duration-200 disabled:opacity-40"
          >
            <Upload className="w-3.5 h-3.5" />
            UPLOAD
          </button>
          <input
            id="editor-file-input"
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".py,.js,.ts,.tsx,.json,.java,.cpp,.go,.php,.cs,.txt"
          />

          {/* Toggle Read/Edit View */}
          <div className="flex bg-gray-950 border border-gray-800 p-0.5 rounded">
            <button
              id="btn-view-edit"
              onClick={() => setIsEditing(true)}
              className={`p-1 rounded cursor-pointer ${
                isEditing ? "bg-gray-800 text-gray-200" : "text-gray-500 hover:text-gray-300"
              }`}
              title="Edit Plaintext"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              id="btn-view-highlight"
              onClick={() => setIsEditing(false)}
              className={`p-1 rounded cursor-pointer ${
                !isEditing ? "bg-gray-800 text-gray-200" : "text-gray-500 hover:text-gray-300"
              }`}
              title="Syntax Highlighted Code"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Editor Content Body */}
      <div className="flex-1 flex overflow-hidden min-h-[300px] lg:min-h-[450px]">
        {/* Editor Main Board */}
        <div className="flex-1 flex overflow-hidden">
          {isEditing ? (
            <div className="flex-1 flex">
              {/* Monospace Line Ruler */}
              <div className="py-4 pl-3 pr-2 text-right bg-gray-950 border-r border-gray-900 select-none font-mono text-xs text-gray-600 leading-6 min-w-[2.5rem]">
                {lineNumbers.map((ln) => (
                  <div key={ln}>{ln}</div>
                ))}
              </div>
              {/* Real Textarea */}
              <textarea
                id="code-textarea"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={isRunning}
                spellCheck={false}
                placeholder="// Paste or write your source code here...&#10;// Or drag-and-drop a code file directly into this panel."
                className="flex-1 p-4 bg-gray-950 text-gray-100 font-mono text-xs leading-6 resize-none focus:outline-none placeholder:text-gray-600 select-text"
              />
            </div>
          ) : (
            <div className="flex-1 flex overflow-auto">
              {/* Highlighted Pre-Block */}
              <div className="py-4 pl-3 pr-2 text-right bg-gray-950 border-r border-gray-900 select-none font-mono text-xs text-gray-600 leading-6 min-w-[2.5rem]">
                {lineNumbers.map((ln) => (
                  <div key={ln}>{ln}</div>
                ))}
              </div>
              <pre className="flex-1 p-4 bg-gray-950 text-xs overflow-auto font-mono leading-6">
                <code
                  ref={highlightedRef}
                  className={`language-${language} text-gray-200 block whitespace-pre`}
                >
                  {code || "// Empty reservoir. Paste code to render highlighted view."}
                </code>
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Debugger Secondary Inputs (Shown only in debug mode) */}
      {mode === "debug_assistant" && isEditing && (
        <div className="border-t border-gray-800 p-4 bg-gray-900/50 flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label id="lbl-error-msg" className="font-mono text-[10px] text-red-400 font-bold tracking-wider">
              ERROR_LOG_MESSAGE (REQUIRED)
            </label>
            <input
              id="input-error-msg"
              type="text"
              value={errorMsg}
              onChange={(e) => setErrorMsg(e.target.value)}
              placeholder="e.g. TypeError: Cannot read properties of undefined (reading 'name')"
              disabled={isRunning}
              className="bg-gray-950 border border-gray-800 px-3 py-1.5 text-xs font-mono text-gray-200 rounded focus:outline-none focus:border-red-500/40"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label id="lbl-stack-trace" className="font-mono text-[10px] text-gray-400 font-bold tracking-wider">
              STACK_TRACE_SNAPSHOT (OPTIONAL)
            </label>
            <textarea
              id="textarea-stack-trace"
              value={stackTrace}
              onChange={(e) => setStackTrace(e.target.value)}
              placeholder="at fetchUserProfile (profile.js:5:46)&#10;at handleLoadProfile (profile.js:12:3)"
              disabled={isRunning}
              rows={3}
              className="bg-gray-950 border border-gray-800 p-3 text-xs font-mono text-gray-200 rounded resize-none focus:outline-none focus:border-red-500/40"
            />
          </div>
        </div>
      )}

      {/* Bottom Run Action Ribbon */}
      <div className="p-4 bg-gray-900 border-t border-gray-800 flex items-center justify-between">
        <p className="text-xs text-gray-500 font-sans">
          {code.trim() ? `${code.trim().split("\n").length} lines loaded` : "No code loaded"}
        </p>

        <button
          id="btn-trigger-analysis"
          onClick={onAnalyze}
          disabled={isRunning || !code.trim() || (mode === "debug_assistant" && !errorMsg.trim())}
          className={`flex items-center gap-2 px-5 py-2.5 rounded font-mono text-xs font-bold uppercase tracking-wider cursor-pointer transition-all duration-200 shadow-md ${
            isRunning || !code.trim() || (mode === "debug_assistant" && !errorMsg.trim())
              ? "bg-gray-800 text-gray-500 border border-gray-700/50 cursor-not-allowed shadow-none"
              : "bg-red-600 hover:bg-red-500 text-white border border-red-500/30 hover:shadow-[0_0_20px_rgba(220,38,38,0.3)]"
          }`}
        >
          <Play className="w-4 h-4 text-white" />
          {isRunning ? "PROCESSING_AGENT_LOOP..." : "RUN_CODESENTINEL"}
        </button>
      </div>
    </div>
  );
}
