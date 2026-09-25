import React, { useState } from 'react';
import { Sliders, Settings, Play, RotateCcw } from 'lucide-react';

export default function ExceptionSimulation({ experimentTitle }) {
  const [output, setOutput] = useState('');
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(0);
  const [selectedCase, setSelectedCase] = useState('');

  const runSimulation = () => {
    if (selectedCase !== 'Divide by Zero') {
      setOutput('Please select the Divide by Zero case first.');
      return;
    }

    setRunning(true);
    setStep(1);

    setOutput('Step 1: Try block started.');

    setTimeout(() => {
      setStep(2);

      setOutput(
        'Step 1: Try block started.\n' +
        'Step 2: Division by zero attempted.'
      );
    }, 700);

    setTimeout(() => {
      setStep(3);

      setOutput(
        'Step 1: Try block started.\n' +
        'Step 2: Division by zero attempted.\n' +
        'Step 3: Exception caught by catch block.\n\n' +
        'Output: ArithmeticException handled'
      );

      setRunning(false);
    }, 1400);
  };

  const resetSimulation = () => {
    setOutput('');
    setRunning(false);
    setStep(0);
    setSelectedCase('');
  };

  return (
    <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 bg-slate-50 space-y-4 min-h-[320px]">

      <div className="flex flex-col items-center justify-center text-center">

        <div className="p-4 bg-red-100 text-[#800000] rounded-2xl">
          <Sliders className="h-10 w-10 stroke-[2]" />
        </div>

        <div className="max-w-md mt-4">

          <h3 className="text-lg font-bold text-slate-900 mb-1">
            Interactive Simulation Workspace
          </h3>

          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
            Run the interactive simulation for{' '}
            <strong className="text-[#800000]">
              {experimentTitle || 'Exception'}
            </strong>.
          </p>

        </div>
      </div>

      <div className="w-full max-w-xl mx-auto space-y-4">

        <div className="bg-white border border-slate-200 rounded-xl p-4">

          <h4 className="font-bold text-[#800000] mb-2">
            Java Exception Handling Simulation
          </h4>

          <pre className="bg-slate-950 text-slate-100 p-4 rounded-lg text-xs overflow-x-auto">
{`try {
    int a = 10;
    int b = 0;
    int result = a / b;
}
catch (ArithmeticException e) {
    System.out.println("Exception handled");
}`}
          </pre>

        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">

          <h4 className="font-bold text-slate-800 mb-3">
            Select Exception Case
          </h4>

          <button
            onClick={() => {
              setSelectedCase('Divide by Zero');
              setStep(0);
              setOutput('');
            }}
            className={
              "px-5 py-2 rounded-lg font-semibold text-sm border-2 " +
              (selectedCase === 'Divide by Zero'
                ? "border-[#800000] bg-red-50 text-[#800000]"
                : "border-slate-200 bg-white text-slate-600")
            }
          >
            Divide by Zero
          </button>

          {selectedCase && (
            <p className="text-xs text-slate-500 mt-3">
              Selected case: <strong>{selectedCase}</strong>
            </p>
          )}

        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">

          <h4 className="font-bold text-slate-800 mb-3">
            Exception Execution Flow
          </h4>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-sm">

            <div
              className={
                "px-3 py-2 rounded-lg border " +
                (step >= 1
                  ? "border-[#800000] bg-red-50 text-[#800000]"
                  : "border-slate-200 bg-white text-slate-500")
              }
            >
              try
            </div>

            <span className="text-slate-400">→</span>

            <div
              className={
                "px-3 py-2 rounded-lg border " +
                (step >= 2
                  ? "border-[#800000] bg-red-50 text-[#800000]"
                  : "border-slate-200 bg-white text-slate-500")
              }
            >
              Exception
            </div>

            <span className="text-slate-400">→</span>

            <div
              className={
                "px-3 py-2 rounded-lg border " +
                (step >= 3
                  ? "border-[#800000] bg-red-50 text-[#800000]"
                  : "border-slate-200 bg-white text-slate-500")
              }
            >
              catch
            </div>

          </div>

        </div>

        <div className="flex justify-center gap-3">

          <button
            onClick={runSimulation}
            disabled={running}
            className="flex items-center gap-2 px-4 py-2 bg-[#800000] text-white rounded-lg font-semibold text-sm hover:bg-[#6B0000] disabled:opacity-60"
          >
            <Play className="h-4 w-4" />
            {running ? 'Running...' : 'Run Simulation'}
          </button>

          <button
            onClick={resetSimulation}
            className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-semibold text-sm hover:bg-slate-300"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>

        </div>

        {output && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">

            <div className="flex items-center gap-2 mb-2">

              <Settings className="h-4 w-4 text-emerald-700" />

              <span className="font-bold text-emerald-800">
                Simulation Output
              </span>

            </div>

            <pre className="text-sm text-emerald-900 whitespace-pre-wrap">
              {output}
            </pre>

          </div>
        )}

      </div>

    </div>
  );
}