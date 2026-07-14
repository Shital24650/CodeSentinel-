import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const PORT = 3000;
const HOST = "0.0.0.0";

// Lazy initialization of Gemini SDK client to prevent startup failures if key is missing
let aiClient: GoogleGenAI | null = null;
function getAi(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined in the environment.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Helper to construct prompts for PR Review Mode
function getPRReviewPrompt(step: number, code: string, history: string[]): string {
  switch (step) {
    case 1:
      return `You are an expert software security engineer. Perform Pass 1 (Security Scan) on the provided code.
Scan for injection risks (SQL, Command, etc.), exposed secrets/credentials, unsafe functions (like eval, unsafe deserialization), and unvalidated inputs.
For every issue found, specify the exact line numbers, the nature of the risk, and a concrete fix suggestion. Be detailed and direct. Do not write generic advice.

Code to analyze:
\`\`\`
${code}
\`\`\`

Analyze and stream your security audit:`;

    case 2:
      return `You are an expert logic and code reliability analyst. Perform Pass 2 (Logic & Conditional Analysis) on the provided code.
Scan for logical bugs like off-by-one errors, null or undefined handling issues, incorrect conditionals, unhandled edge cases, race conditions, and error boundaries.
For context, here is the Security Scan result from Pass 1:
--- Security Scan Pass 1 Output ---
${history[0]}
------------------------------------

Identify every logical issue with specific line numbers, risk descriptions, and concrete code fixes.

Code to analyze:
\`\`\`
${code}
\`\`\`

Analyze and stream your logical audit:`;

    case 3:
      return `You are an expert test architect. Perform Pass 3 (Test Coverage Gap Detection) on the provided code.
Identify complex execution paths, error handling scenarios, and boundary conditions that lack adequate test coverage.
For context, here are the findings from the previous analysis passes:
--- Security Scan Pass 1 ---
${history[0]}

--- Logic Analysis Pass 2 ---
${history[1]}
-----------------------------

Describe the coverage gaps with precise line/path references, the risk of leaving them untested, and concrete scenarios to write tests for.

Code to analyze:
\`\`\`
${code}
\`\`\`

Analyze and stream your coverage audit:`;

    case 4:
      return `You are the Lead Auditor of CodeSentinel (AI Auditor Pass 4).
Perform a rigorous self-validation pass on the accumulated findings from Pass 1, 2, and 3.
You MUST discard or filter out any findings that are speculative, vague, or cannot be tied back to a specific, identifiable line of code. Keep only high-fidelity, high-impact concerns that are fully substantiated.
Provide a clear self-criticism log explaining which findings you are keeping and why, and which findings you decided to drop (e.g. because they are minor styling issues, false positives, or speculative).

Code:
\`\`\`
${code}
\`\`\`

Trace history to validate:
--- Pass 1 (Security) ---
${history[0]}

--- Pass 2 (Logic) ---
${history[1]}

--- Pass 3 (Coverage Gaps) ---
${history[2]}

Audit and stream your self-validation trace:`;

    default:
      return "";
  }
}

// Helper to construct prompts for Debug Mode
function getDebugPrompt(step: number, code: string, errorMsg: string, stackTrace: string, history: string[]): string {
  switch (step) {
    case 1:
      return `You are an expert debugging assistant. Perform Step 1 (Hypothesize Root Causes) for this failure.
Analyze the provided code, error message, and optional stack trace. Formulate 2-3 precise candidate root causes, ranked by likelihood. Explain why they are likely.

Code:
\`\`\`
${code}
\`\`\`

Error Message:
${errorMsg}

Stack Trace:
${stackTrace || "None provided"}

Stream your candidate hypotheses:`;

    case 2:
      return `Perform Step 2 (Code Isolation) for this failure.
Pinpoint the exact line number, function, or expression most likely responsible for the crash or misbehavior. Use the hypotheses from Step 1 as context.

Code:
\`\`\`
${code}
\`\`\`

Step 1 Hypotheses:
${history[0]}

Stream your isolation analysis:`;

    case 3:
      return `Perform Step 3 (Mechanics Explanation) for this failure.
Provide a clear, plain-English mechanical explanation of WHY this bug occurs. Explain the state flow, memory condition, or logic flow that triggers the exception or unexpected result.

Code:
\`\`\`
${code}
\`\`\`

Step 2 Isolation Result:
${history[1]}

Stream your mechanics explanation:`;

    case 4:
      return `Perform Step 4 (Targeted Fix Implementation).
Produce a corrected and highly optimized version of the failing section or function. Highlight the changes you made and why they resolve the root cause.

Code:
\`\`\`
${code}
\`\`\`

Step 3 Mechanical Explanation:
${history[2]}

Stream the corrected code block and fix rationale:`;

    case 5:
      return `Perform Step 5 (Verification & Prevention Design).
Write a precise verification guide, unit test, or automated scenario that would definitively prove the fix works and prevents regression.

Code:
\`\`\`
${code}
\`\`\`

Step 4 Targeted Fix:
${history[3]}

Stream the verification steps and tests:`;

    default:
      return "";
  }
}

// Helper to construct prompts for Test Writer Mode
function getTestWriterPrompt(step: number, code: string, history: string[]): string {
  switch (step) {
    case 1:
      return `You are an expert test suite engineer. Perform Step 1 (Execution Path Mapping).
Analyze the following code and map all logical paths including: happy paths, alternate paths, extreme inputs, and error/exception paths.

Code:
\`\`\`
${code}
\`\`\`

Stream your path mapping:`;

    case 2:
      return `Perform Step 2 (Prioritize High-Risk Paths).
Select the 3 highest-risk paths that absolutely require unit testing due to vulnerability to inputs, complexity, or system criticality. Detail the risk of leaving them untested.

Path Map Context:
${history[0]}

Stream your prioritization audit:`;

    case 3:
      return `Perform Step 3 (Targeted Test Generation).
Write high-quality unit tests covering the 3 prioritized paths. Choose a standard framework that matches the language of the code (e.g. PyTest for Python, Jest/Vitest for TypeScript/JavaScript, Mocha, JUnit, etc.). Provide ready-to-run tests with assertions.

Prioritization Context:
${history[1]}

Code:
\`\`\`
${code}
\`\`\`

Stream your target tests:`;

    case 4:
      return `Perform Step 4 (Adversarial Robustness Test).
Design one clever adversarial test case. This must use a highly non-obvious input (such as nested structures, overflow limits, unexpected type coercion, or extreme concurrency) designed specifically to stress and potentially break the implementation. Explain the targeting mechanism.

Code:
\`\`\`
${code}
\`\`\`

Test Suite context:
${history[2]}

Stream your adversarial test and analysis:`;

    default:
      return "";
  }
}

// Sleep helper
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function generateContentStreamWithRetry(params: {
  contents: string;
}) {
  const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
  let lastError: any = null;

  for (const model of modelsToTry) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`Calling generateContentStream on model ${model} (attempt ${attempt})...`);
        const responseStream = await getAi().models.generateContentStream({
          model,
          contents: params.contents,
        });
        return responseStream;
      } catch (error: any) {
        lastError = error;
        console.warn(`Attempt ${attempt} on model ${model} failed with error:`, error?.message || error);
        
        const errObj = error?.error || error;
        const code = errObj?.code || errObj?.status || error?.status || error?.code;
        const statusStr = String(errObj?.status || error?.status || "");
        const msgStr = String(errObj?.message || error?.message || "");
        
        const isModelOverloaded = 
          code === 503 || 
          code === "503" || 
          statusStr.includes("Service Unavailable") || 
          statusStr.includes("Unavailable") || 
          msgStr.includes("503") || 
          msgStr.includes("UNAVAILABLE") || 
          msgStr.includes("high demand") ||
          msgStr.includes("Service Unavailable");

        const isQuotaExceeded = 
          code === 429 || 
          code === "429" ||
          statusStr.includes("RESOURCE_EXHAUSTED") ||
          msgStr.includes("quota") ||
          msgStr.includes("Quota") ||
          msgStr.includes("limit") ||
          msgStr.includes("RESOURCE_EXHAUSTED");

        if (isModelOverloaded || isQuotaExceeded) {
          console.log(`Model ${model} is overloaded or quota-exhausted. Immediately falling back to the next model...`);
          break;
        }

        const isTransient = 
          !code || 
          code === 503 || 
          code === "503" ||
          code === 429 || 
          code === "429" ||
          code === 500 || 
          code === "500" ||
          statusStr.includes("Service Unavailable") ||
          statusStr.includes("Unavailable") ||
          msgStr.includes("503") ||
          msgStr.includes("UNAVAILABLE") ||
          msgStr.includes("429");

        if (!isTransient) {
          console.log(`Non-transient error detected on model ${model}. Skipping further retries, trying next model...`);
          break;
        }

        if (attempt < 2) {
          await sleep(1000 * attempt);
        }
      }
    }
  }
  throw lastError || new Error("All attempts failed");
}

async function generateContentWithRetry(params: {
  contents: string;
  config?: any;
}) {
  const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
  let lastError: any = null;

  for (const model of modelsToTry) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`Calling generateContent on model ${model} (attempt ${attempt})...`);
        const result = await getAi().models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });
        return result;
      } catch (error: any) {
        lastError = error;
        console.warn(`Attempt ${attempt} on model ${model} failed with error:`, error?.message || error);
        
        const errObj = error?.error || error;
        const code = errObj?.code || errObj?.status || error?.status || error?.code;
        const statusStr = String(errObj?.status || error?.status || "");
        const msgStr = String(errObj?.message || error?.message || "");
        
        const isModelOverloaded = 
          code === 503 || 
          code === "503" || 
          statusStr.includes("Service Unavailable") || 
          statusStr.includes("Unavailable") || 
          msgStr.includes("503") || 
          msgStr.includes("UNAVAILABLE") || 
          msgStr.includes("high demand") ||
          msgStr.includes("Service Unavailable");

        const isQuotaExceeded = 
          code === 429 || 
          code === "429" ||
          statusStr.includes("RESOURCE_EXHAUSTED") ||
          msgStr.includes("quota") ||
          msgStr.includes("Quota") ||
          msgStr.includes("limit") ||
          msgStr.includes("RESOURCE_EXHAUSTED");

        if (isModelOverloaded || isQuotaExceeded) {
          console.log(`Model ${model} is overloaded or quota-exhausted. Immediately falling back to the next model...`);
          break;
        }

        const isTransient = 
          !code || 
          code === 503 || 
          code === "503" ||
          code === 429 || 
          code === "429" ||
          code === 500 || 
          code === "500" ||
          statusStr.includes("Service Unavailable") ||
          statusStr.includes("Unavailable") ||
          msgStr.includes("503") ||
          msgStr.includes("UNAVAILABLE") ||
          msgStr.includes("429");

        if (!isTransient) {
          console.log(`Non-transient error detected on model ${model}. Skipping further retries, trying next model...`);
          break;
        }

        if (attempt < 2) {
          await sleep(1000 * attempt);
        }
      }
    }
  }
  throw lastError || new Error("All attempts failed");
}

// Endpoint to run a single step in a streaming fashion
app.post("/api/agent/run-step", async (req, res) => {
  try {
    const { mode, step, code, history = [], errorMsg = "", stackTrace = "" } = req.body;

    if (!code) {
      return res.status(400).json({ error: "Code content is required" });
    }

    let prompt = "";
    if (mode === "pr_review") {
      prompt = getPRReviewPrompt(Number(step), code, history);
    } else if (mode === "debug_assistant") {
      prompt = getDebugPrompt(Number(step), code, errorMsg, stackTrace, history);
    } else if (mode === "test_writer") {
      prompt = getTestWriterPrompt(Number(step), code, history);
    } else {
      return res.status(400).json({ error: "Invalid mode" });
    }

    if (!prompt) {
      return res.status(400).json({ error: "Invalid step for selected mode" });
    }

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");

    // Use our resilient streaming generator
    const responseStream = await generateContentStreamWithRetry({
      contents: prompt,
    });

    for await (const chunk of responseStream) {
      res.write(chunk.text || "");
    }

    res.end();
  } catch (error: any) {
    console.error("Error in run-step:", error);
    res.write(`[ERROR: ${error?.message || "Internal server error occurred while invoking Gemini"}]`);
    res.end();
  }
});

// Endpoint to compile unstructured logs/traces into a pristine, structured JSON schema
app.post("/api/agent/compile-results", async (req, res) => {
  try {
    const { mode, code, history = [] } = req.body;

    if (!code || history.length === 0) {
      return res.status(400).json({ error: "Missing required inputs for compiler" });
    }

    const historyText = history.map((h: string, idx: number) => `=== Step ${idx + 1} ===\n${h}`).join("\n\n");

    if (mode === "pr_review") {
      const prompt = `You are the final compilation module of CodeSentinel.
Parse the accumulated self-criticism and review history to compile a structured, severity-ranked report of validated findings.
Ensure every finding cites specific line(s) and has a concrete fix suggestion.

Original Code:
\`\`\`
${code}
\`\`\`

Trace and Findings History:
${historyText}

Output a clean, valid JSON report. Check carefully: if the code is the Python demo code (get_user_data, calculate_discount, process_file), look for SQL Injection, missing KeyError handling, eval(), and no file handling, and calculate how many of these 4 issues were successfully found (0-4).`;

      const result = await generateContentWithRetry({
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              findings: {
                type: Type.ARRAY,
                description: "List of severity-ranked validated findings",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    severity: { 
                      type: Type.STRING, 
                      description: "CRITICAL, HIGH, MEDIUM, or LOW" 
                    },
                    line: { type: Type.STRING, description: "Line number or line range, e.g., 'Line 3' or 'Lines 12-14'" },
                    title: { type: Type.STRING, description: "Actionable summary of the issue" },
                    risk: { type: Type.STRING, description: "Clear explanation of the danger or impact" },
                    fix: { type: Type.STRING, description: "Concrete replacement code snippet or implementation detail" }
                  },
                  required: ["id", "severity", "line", "title", "risk", "fix"]
                }
              },
              confidence: {
                type: Type.OBJECT,
                properties: {
                  validatedCount: { type: Type.INTEGER },
                  removedCount: { type: Type.INTEGER },
                  totalBeforeValidation: { type: Type.INTEGER },
                  explanation: { type: Type.STRING, description: "Reasoning for why the unsubstantiated findings were discarded" }
                },
                required: ["validatedCount", "removedCount", "totalBeforeValidation", "explanation"]
              },
              knownIssuesFound: { 
                type: Type.INTEGER, 
                description: "If analyzing the provided default Python demo code (containing get_user_data/calculate_discount/process_file), count how many of the 4 deliberate bugs were flagged (SQL injection, KeyError, eval, file not found). Otherwise, output 0." 
              }
            },
            required: ["findings", "confidence", "knownIssuesFound"]
          }
        }
      });

      const responseText = result.text;
      return res.json(JSON.parse(responseText.trim()));

    } else if (mode === "debug_assistant") {
      const prompt = `You are the debugging compiler of CodeSentinel.
Extract and compile the structured debug results from the trace history.

Original Code:
\`\`\`
${code}
\`\`\`

Trace History:
${historyText}

Output a clean, valid JSON matching the schema.`;

      const result = await generateContentWithRetry({
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              hypotheses: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    rank: { type: Type.INTEGER },
                    cause: { type: Type.STRING },
                    likelihood: { type: Type.STRING, description: "CRITICAL, HIGH, MEDIUM, or LOW" }
                  },
                  required: ["rank", "cause", "likelihood"]
                }
              },
              isolatedLine: { type: Type.STRING, description: "Exact line, expression, or function identified" },
              explanation: { type: Type.STRING, description: "Plain-English mechanics of the crash" },
              fixedCode: { type: Type.STRING, description: "Full corrected code snippet or replacement function" },
              verification: { type: Type.STRING, description: "The unit test or validation steps to run" }
            },
            required: ["hypotheses", "isolatedLine", "explanation", "fixedCode", "verification"]
          }
        }
      });

      const responseText = result.text;
      return res.json(JSON.parse(responseText.trim()));

    } else if (mode === "test_writer") {
      const prompt = `You are the test suite compiler of CodeSentinel.
Extract and compile the targeted test generation suite from the trace history.

Original Code:
\`\`\`
${code}
\`\`\`

Trace History:
${historyText}

Output a clean, valid JSON matching the schema.`;

      const result = await generateContentWithRetry({
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              mappedPaths: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              prioritizedPaths: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    path: { type: Type.STRING },
                    risk: { type: Type.STRING }
                  },
                  required: ["path", "risk"]
                }
              },
              testFile: { type: Type.STRING, description: "Complete ready-to-run test file contents matching the language" },
              adversarialExplanation: { type: Type.STRING, description: "Explanation of what failure mode the adversarial test targets" }
            },
            required: ["mappedPaths", "prioritizedPaths", "testFile", "adversarialExplanation"]
          }
        }
      });

      const responseText = result.text;
      return res.json(JSON.parse(responseText.trim()));

    } else {
      res.status(400).json({ error: "Invalid mode for compiler" });
    }

  } catch (error: any) {
    console.error("Error in compile-results:", error);
    res.status(500).json({ error: "Failed to compile structured report. Gemini schema error or parse failure." });
  }
});

// Configure full-stack static files and Vite serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Integrate Vite as a development middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production from dist
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CodeSentinel Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
