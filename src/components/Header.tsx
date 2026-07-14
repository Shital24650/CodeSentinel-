import React from "react";
import { Mode } from "../types";
import { Shield, Bug, FileCheck2, Zap } from "lucide-react";

interface HeaderProps {
  activeMode: Mode;
  setActiveMode: (mode: Mode) => void;
  isRunning: boolean;
}

export default function Header({ activeMode, setActiveMode, isRunning }: HeaderProps) {
  const modes = [
    {
      id: "pr_review" as Mode,
      name: "PR Review Agent",
      icon: Shield,
      desc: "4-pass security, logic & test coverage audit",
    },
    {
      id: "debug_assistant" as Mode,
      name: "Debug Assistant",
      icon: Bug,
      desc: "5-step root-cause isolation & patch generator",
    },
    {
      id: "test_writer" as Mode,
      name: "Test Writer Agent",
      icon: FileCheck2,
      desc: "Path mapper & adversarial test generator",
    },
  ];

  return (
    <header className="border-b border-gray-800 bg-gray-900/40 backdrop-blur-md px-6 py-4 sticky top-0 z-30 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      {/* App Branding */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-red-950/40 border border-red-500/30 rounded text-red-500 flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.15)]">
          <Zap className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h1 id="app-title" className="text-xl font-mono font-bold tracking-wider text-gray-100 flex items-center gap-2">
            CODESENTINEL <span className="text-xs bg-red-500/10 border border-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-mono font-normal">v1.2 // AGENTIC</span>
          </h1>
          <p className="text-xs text-gray-400 font-sans mt-0.5">
            Multi-step autonomous reasoning & self-validating code engineering
          </p>
        </div>
      </div>

      {/* Mode Selectors */}
      <div className="flex bg-gray-950/80 border border-gray-800/80 p-1 rounded-lg self-start md:self-auto">
        {modes.map((m) => {
          const Icon = m.icon;
          const isActive = activeMode === m.id;
          return (
            <button
              id={`tab-btn-${m.id}`}
              key={m.id}
              disabled={isRunning}
              onClick={() => setActiveMode(m.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded font-sans text-xs font-medium transition-all duration-200 ${
                isActive
                  ? "bg-red-500/10 border border-red-500/30 text-red-400 shadow-[0_2px_10px_rgba(239,68,68,0.08)]"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-900/60 disabled:opacity-40"
              }`}
              title={m.desc}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-red-400" : "text-gray-400"}`} />
              <span className="hidden sm:inline">{m.name}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
