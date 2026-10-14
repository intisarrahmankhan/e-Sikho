import vm from 'node:vm';

export interface TestCase {
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
}

export interface TestCaseResult {
  index: number;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  isHidden: boolean;
  errorMessage?: string;
  executionTimeMs?: number;
}

export interface CodeEvaluationOutcome {
  allPassed: boolean;
  passedCount: number;
  totalCount: number;
  results: TestCaseResult[];
  error?: string;
}

/**
 * Normalizes string output for robust comparison:
 * - Trims whitespace and newlines
 * - Normalizes Windows CRLF to LF
 * - Handles JSON array/object canonical equivalence
 */
export function normalizeOutput(str: string): string {
  if (typeof str !== 'string') {
    str = String(str ?? '');
  }
  const trimmed = str.replace(/\r\n/g, '\n').trim();

  // Try parsing JSON to compare structurally if both look like JSON arrays or objects
  if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
    try {
      const parsed = JSON.parse(trimmed);
      return JSON.stringify(parsed);
    } catch {
      // Not valid JSON, return trimmed string
    }
  }

  return trimmed;
}

/**
 * Evaluates student code submission against test cases in an isolated VM sandbox.
 * Supports:
 * - Function returns (e.g. solution(input), solve(input))
 * - Console output (console.log)
 * - Infinite loop & timeout protection (default 2000ms)
 */
export function evaluateCodeSubmission(
  studentCode: string,
  testCases: TestCase[],
  options?: { timeoutMs?: number; language?: string }
): CodeEvaluationOutcome {
  if (!studentCode || !studentCode.trim()) {
    return {
      allPassed: false,
      passedCount: 0,
      totalCount: testCases.length,
      results: testCases.map((tc, idx) => ({
        index: idx,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput: '',
        passed: false,
        isHidden: !!tc.isHidden,
        errorMessage: 'কোনো কোড জমা দেওয়া হয়নি (No code submitted)',
      })),
      error: 'কোনো কোড জমা দেওয়া হয়নি',
    };
  }

  if (!testCases || testCases.length === 0) {
    return {
      allPassed: true,
      passedCount: 0,
      totalCount: 0,
      results: [],
    };
  }

  const timeoutMs = options?.timeoutMs || 2500;
  const results: TestCaseResult[] = [];
  let passedCount = 0;

  for (let idx = 0; idx < testCases.length; idx++) {
    const tc = testCases[idx];
    const startTime = Date.now();
    let actualOutput = '';
    let errorMessage: string | undefined;
    let passed = false;

    try {
      const capturedLogs: string[] = [];

      // Parse input argument (number, array, object, or string)
      let parsedInput: any = tc.input;
      try {
        parsedInput = JSON.parse(tc.input);
      } catch {
        // Keep as raw string if not JSON
        parsedInput = tc.input;
      }

      // Prepare secure sandbox context
      const sandbox: Record<string, any> = {
        console: {
          log: (...args: any[]) => {
            capturedLogs.push(
              args
                .map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a)))
                .join(' ')
            );
          },
          info: (...args: any[]) => sandbox.console.log(...args),
          warn: (...args: any[]) => sandbox.console.log(...args),
          error: (...args: any[]) => sandbox.console.log(...args),
        },
        input: parsedInput,
        rawInput: tc.input,
        Math,
        Array,
        Object,
        String,
        Number,
        Boolean,
        Date,
        RegExp,
        JSON,
        parseInt,
        parseFloat,
        isNaN,
        isFinite,
        Set,
        Map,
        BigInt,
      };

      const context = vm.createContext(sandbox);

      // Wrapper script that extracts return value or invoked solution
      const wrappedScript = `
        ${studentCode}

        (function() {
          let __res = undefined;
          if (typeof solution === 'function') {
            __res = solution(input);
          } else if (typeof solve === 'function') {
            __res = solve(input);
          } else if (typeof main === 'function') {
            __res = main(input);
          }
          return __res;
        })();
      `;

      const script = new vm.Script(wrappedScript, { filename: 'student_solution.js' });
      const returnValue = script.runInContext(context, { timeout: timeoutMs });

      if (returnValue !== undefined && returnValue !== null) {
        if (typeof returnValue === 'object') {
          actualOutput = JSON.stringify(returnValue);
        } else {
          actualOutput = String(returnValue);
        }
      } else if (capturedLogs.length > 0) {
        actualOutput = capturedLogs.join('\n');
      } else {
        actualOutput = '';
      }

      const normalizedActual = normalizeOutput(actualOutput);
      const normalizedExpected = normalizeOutput(tc.expectedOutput);

      passed = normalizedActual === normalizedExpected;

      // Handle number tolerance if both are numeric (e.g. 3.14 vs 3.140)
      if (!passed) {
        const numActual = Number(normalizedActual);
        const numExpected = Number(normalizedExpected);
        if (!isNaN(numActual) && !isNaN(numExpected) && Math.abs(numActual - numExpected) < 1e-6) {
          passed = true;
        }
      }
    } catch (err: any) {
      if (err.code === 'ERR_SCRIPT_EXECUTION_TIMEOUT') {
        errorMessage = `টাইম লিমিট অতিক্রান্ত হয়েছে (${timeoutMs}ms Limit Exceeded)। ইনফিনিট লুপ পরীক্ষা করুন।`;
      } else {
        errorMessage = err.message || 'কোড এক্সিকিউশনে রানটাইম এরর হয়েছে।';
      }
      passed = false;
    }

    const executionTimeMs = Date.now() - startTime;
    if (passed) passedCount++;

    results.push({
      index: idx,
      input: tc.input,
      expectedOutput: tc.expectedOutput,
      actualOutput,
      passed,
      isHidden: !!tc.isHidden,
      errorMessage,
      executionTimeMs,
    });
  }

  return {
    allPassed: passedCount === testCases.length,
    passedCount,
    totalCount: testCases.length,
    results,
  };
}

/**
 * Intelligent Short-Answer string auto-grader:
 * - Trims whitespace
 * - Case-insensitive
 * - Handles punctuation and multiple acceptable synonyms
 */
export function evaluateShortAnswer(
  studentAnswer: string | undefined | null,
  acceptedAnswers: string[]
): boolean {
  if (!studentAnswer || typeof studentAnswer !== 'string') return false;
  if (!acceptedAnswers || acceptedAnswers.length === 0) return false;

  const cleanStudent = studentAnswer
    .trim()
    .toLowerCase()
    .replace(/[.,;!?]+$/, '') // Remove trailing sentence punctuation
    .replace(/\s+/g, ' ');

  for (const accepted of acceptedAnswers) {
    if (!accepted || typeof accepted !== 'string') continue;
    const cleanAccepted = accepted
      .trim()
      .toLowerCase()
      .replace(/[.,;!?]+$/, '')
      .replace(/\s+/g, ' ');

    if (cleanStudent === cleanAccepted) {
      return true;
    }

    // Check numeric equivalence (e.g., "10" === "10.0")
    const sNum = Number(cleanStudent);
    const aNum = Number(cleanAccepted);
    if (!isNaN(sNum) && !isNaN(aNum) && Math.abs(sNum - aNum) < 1e-6) {
      return true;
    }
  }

  return false;
}
