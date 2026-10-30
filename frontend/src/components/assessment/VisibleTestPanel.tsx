import React, { useState } from 'react';
import { CodingTestResult } from '../../types/assessment.types';

interface VisibleTestPanelProps {
  testResults: CodingTestResult[];
  isRunning?: boolean;
  onRun?: () => void;
  canRun?: boolean;
}

export const VisibleTestPanel: React.FC<VisibleTestPanelProps> = ({
  testResults,
  isRunning = false,
  onRun,
  canRun = true,
}) => {
  const [selectedIdx, setSelectedIdx] = useState(0);

  const passedCount = testResults.filter((t) => t.passed).length;
  const totalCount = testResults.length;
  const currentTest = testResults[selectedIdx] || testResults[0];

  return (
    <div className="bg-white border border-surface-border rounded-xl overflow-hidden shadow-sm flex flex-col">
      <div className="px-4 py-3 bg-surface-muted/60 border-b border-surface-border flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">
            Visible Test Cases
          </span>
          {totalCount > 0 && (
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                passedCount === totalCount
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {passedCount} / {totalCount} Passed
            </span>
          )}
        </div>
        {onRun && (
          <button
            onClick={onRun}
            disabled={!canRun || isRunning}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100/80 rounded-md transition disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <span className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-brand-600 inline-block mr-1" />
                Executing...
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Run Visible Tests</span>
              </>
            )}
          </button>
        )}
      </div>

      {totalCount === 0 ? (
        <div className="p-8 text-center text-sm text-ink-500">
          No test results yet. Click &quot;Run Visible Tests&quot; to test your code against visible inputs.
        </div>
      ) : (
        <div className="flex flex-col md:flex-row min-h-[220px]">
          {/* Test Tabs */}
          <div className="md:w-44 border-b md:border-b-0 md:border-r border-surface-border bg-surface-muted/30 p-2 flex md:flex-col gap-1 overflow-x-auto">
            {testResults.map((tc, idx) => (
              <button
                key={tc.testIndex ?? idx}
                onClick={() => setSelectedIdx(idx)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition text-left ${
                  selectedIdx === idx
                    ? 'bg-white shadow-sm border border-surface-border text-ink-900'
                    : 'text-ink-600 hover:bg-white/60 hover:text-ink-900'
                }`}
              >
                <span>Case {idx + 1}</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    tc.passed ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Details Pane */}
          {currentTest && (
            <div className="flex-1 p-4 space-y-3 font-mono text-xs overflow-y-auto">
              <div className="flex items-center justify-between font-sans">
                <span
                  className={`px-2 py-0.5 rounded text-xs font-semibold ${
                    currentTest.passed
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {currentTest.passed ? '✓ Passed' : '✗ Failed'}
                </span>
                {currentTest.runtimeMs !== undefined && (
                  <span className="text-xs text-ink-500">
                    Runtime: {currentTest.runtimeMs.toFixed(1)} ms
                  </span>
                )}
              </div>

              {currentTest.error ? (
                <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-lg text-rose-800">
                  <div className="font-semibold mb-1 font-sans">Execution Error:</div>
                  <pre className="whitespace-pre-wrap">{currentTest.error}</pre>
                </div>
              ) : null}

              <div>
                <div className="text-ink-500 font-sans mb-1 font-medium">Input:</div>
                <pre className="bg-surface-muted p-2 rounded border border-surface-border text-ink-900 whitespace-pre-wrap">
                  {currentTest.input || '(empty)'}
                </pre>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <div className="text-ink-500 font-sans mb-1 font-medium">Expected Output:</div>
                  <pre className="bg-surface-muted p-2 rounded border border-surface-border text-ink-900 whitespace-pre-wrap">
                    {currentTest.expectedOutput ?? currentTest.expected ?? '(empty)'}
                  </pre>
                </div>
                <div>
                  <div className="text-ink-500 font-sans mb-1 font-medium">Actual Output:</div>
                  <pre
                    className={`p-2 rounded border whitespace-pre-wrap ${
                      currentTest.passed
                        ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                        : 'bg-rose-50/50 border-rose-200 text-rose-900'
                    }`}
                  >
                    {currentTest.actualOutput ?? currentTest.actual ?? '(empty)'}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
