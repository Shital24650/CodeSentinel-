import { TraceStep } from "./types";

// Default Demo Code for PR Review
export const DEMO_CODE_PR = `def get_user_data(user_id):
    query = "SELECT * FROM users WHERE id = " + user_id
    result = db.execute(query)
    return result[0]

def calculate_discount(price, discount_code):
    codes = {"SAVE10": 0.10, "SAVE20": 0.20}
    multiplier = codes[discount_code]
    final_price = price * (1 - multiplier)
    return final_price

def process_file(filename):
    data = eval(open(filename).read())
    return data
`;

// Default Demo for Debug Assistant
export const DEMO_CODE_DEBUG = `function fetchUserProfile(userId) {
  // Fetch user data from simulated profile API
  const response = fetch("https://api.example.com/users/" + userId);
  const data = response.json();
  
  console.log("Loaded profile for " + data.profile.name);
  return data;
}
`;

export const DEMO_ERROR_DEBUG = "TypeError: Cannot read properties of undefined (reading 'name')";

export const DEMO_STACK_DEBUG = `at fetchUserProfile (profile.js:5:46)
at handleLoadProfile (profile.js:12:3)
at HTMLButtonElement.dispatch (jquery.js:3:520)`;

// Default Demo for Test Writer
export const DEMO_CODE_TEST = `export function validateEmail(email: string): boolean {
  if (!email) return false;
  if (email.length > 254) return false;
  
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) return false;
  
  const parts = email.split('@');
  if (parts.length !== 2) return false;
  
  const [localPart, domain] = parts;
  if (localPart.length > 64) return false;
  
  // Disallow sequential dots in domain or local part
  if (localPart.includes('..') || domain.includes('..')) return false;
  
  return true;
}
`;

// Heuristics to auto-detect programming language
export function detectLanguageHeuristically(code: string): string {
  const trimmed = code.trim();
  if (!trimmed) return "plaintext";
  
  if (trimmed.startsWith("def ") || trimmed.includes("import os") || trimmed.includes("print(") && !trimmed.includes("console.log")) {
    return "python";
  }
  if (trimmed.startsWith("package ") || trimmed.includes("public class ") || trimmed.includes("System.out.println")) {
    return "java";
  }
  if (trimmed.includes("const ") || trimmed.includes("let ") || trimmed.includes("import ") || trimmed.includes("console.log") || trimmed.includes("function ")) {
    if (trimmed.includes("interface ") || trimmed.includes(": string") || trimmed.includes(": number") || trimmed.includes("export function ")) {
      return "typescript";
    }
    return "javascript";
  }
  if (trimmed.includes("#include <") || trimmed.includes("std::cout")) {
    return "cpp";
  }
  if (trimmed.startsWith("func ") || trimmed.includes("fmt.Println")) {
    return "go";
  }
  if (trimmed.includes("<?php")) {
    return "php";
  }
  if (trimmed.includes("using System;") || trimmed.includes("namespace ")) {
    return "csharp";
  }
  if (trimmed.includes("class ") && trimmed.includes("def ")) {
    return "python";
  }
  
  return "javascript"; // Safe fallback
}

// Initial step descriptions for PR Review
export const INITIAL_STEPS_PR = (): TraceStep[] => [
  {
    step: 1,
    title: "Pass 1: Security Vulnerability Scan",
    description: "Analyzing source code for injection vectors, exposed credentials, unsafe standard functions, and input validation risks.",
    text: "",
    status: "idle",
  },
  {
    step: 2,
    title: "Pass 2: Logic & Boundary Analysis",
    description: "Evaluating program conditionals, race conditions, null/undefined reference risks, and boundary exceptions.",
    text: "",
    status: "idle",
  },
  {
    step: 3,
    title: "Pass 3: Coverage Gap Detection",
    description: "Determining untested logical execution blocks, missed error branches, and complex decision hierarchies.",
    text: "",
    status: "idle",
  },
  {
    step: 4,
    title: "Pass 4: Self-Validation Audit",
    description: "Rigorous self-criticism. Removing speculative or unprovable findings, keeping only highly substantiated, line-cited items.",
    text: "",
    status: "idle",
  },
];

// Initial step descriptions for Debug Assistant
export const INITIAL_STEPS_DEBUG = (): TraceStep[] => [
  {
    step: 1,
    title: "Step 1: Formulate Root Hypotheses",
    description: "Analyzing stack trace, error logs, and source to rank the top 2-3 likely logical breakdowns.",
    text: "",
    status: "idle",
  },
  {
    step: 2,
    title: "Step 2: Isolate Culprit Location",
    description: "Locating the exact line, expression, or expression evaluation causing the failure state.",
    text: "",
    status: "idle",
  },
  {
    step: 3,
    title: "Step 3: Plain-English Mechanics Explanation",
    description: "Decoding exactly what went wrong under the hood during execution (why the state crashed).",
    text: "",
    status: "idle",
  },
  {
    step: 4,
    title: "Step 4: Target Fix Implementation",
    description: "Formulating a pristine, highly-optimized patch resolved strictly against isolated mechanics.",
    text: "",
    status: "idle",
  },
  {
    step: 5,
    title: "Step 5: Verification Suite Design",
    description: "Designing a targeted test scenario that validates correct execution and prevents future regression.",
    text: "",
    status: "idle",
  },
];

// Initial step descriptions for Test Writer
export const INITIAL_STEPS_TEST = (): TraceStep[] => [
  {
    step: 1,
    title: "Step 1: Execution Path Mapping",
    description: "Deconstructing function logic to map out happy paths, negative boundaries, alternate routes, and exceptions.",
    text: "",
    status: "idle",
  },
  {
    step: 2,
    title: "Step 2: Risk-Based Prioritization",
    description: "Filtering mapped paths to identify the 3 highest-risk channels needing immediate rigorous tests.",
    text: "",
    status: "idle",
  },
  {
    step: 3,
    title: "Step 3: Target Test Generation",
    description: "Writing fully annotated, assertion-backed unit tests matching the system language and popular frameworks.",
    text: "",
    status: "idle",
  },
  {
    step: 4,
    title: "Step 4: Adversarial Stress Injection",
    description: "Crafting a clever, non-obvious broken state input to ensure resilience against extreme conditions.",
    text: "",
    status: "idle",
  },
];
