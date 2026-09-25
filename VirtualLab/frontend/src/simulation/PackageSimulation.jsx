import React, { useState } from 'react';
import { Sliders, Settings, Play, RotateCcw } from 'lucide-react';

export default function PackageSimulation({ experimentTitle }) {
  const [output, setOutput] = useState('');
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(0);
  const [selectedClass, setSelectedClass] = useState('');

  const runSimulation = () => {
    if (selectedClass !== 'Calculator') {
      setOutput('Please select the Calculator class first.');
      return;
    }

    setRunning(true);
    setStep(1);

    setOutput('Step 1: Package "mypackage" selected.');

    setTimeout(() => {
      setStep(2);

      setOutput(
        'Step 1: Package "mypackage" selected.\n' +
        'Step 2: Calculator class imported.'
      );
    }, 700);

    setTimeout(() => {
      setStep(3);

      setOutput(
        'Step 1: Package "mypackage" selected.\n' +
        'Step 2: Calculator class imported.\n' +
        'Step 3: add() method called.\n\n' +
        'Output: 10 + 20 = 30'
      );

      setRunning(false);
    }, 1400);
  };

  const resetSimulation = () => {
    setOutput('');
    setRunning(false);
    setStep(0);
    setSelectedClass('');
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
              {experimentTitle || 'Package'}
            </strong>.
          </p>

        </div>
      </div>

      <div className="w-full max-w-xl mx-auto space-y-4">

        <div className="bg-white border border-slate-200 rounded-xl p-4">

          <h4 className="font-bold text-[#800000] mb-2">
            Java Package Simulation
          </h4>

          <pre className="bg-slate-950 text-slate-100 p-4 rounded-lg text-xs overflow-x-auto">
{`package mypackage;

public class Calculator {
    public int add(int a, int b) {
        return a + b;
    }
}

import mypackage.Calculator;

Calculator c = new Calculator();
System.out.println(c.add(10, 20));`}
          </pre>

        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">

          <h4 className="font-bold text-slate-800 mb-3">
            Select Class from Package
          </h4>

          <button
            onClick={() => {
              setSelectedClass('Calculator');
              setStep(0);
              setOutput('');
            }}
            className={
              "px-5 py-2 rounded-lg font-semibold text-sm border-2 " +
              (selectedClass === 'Calculator'
                ? "border-[#800000] bg-red-50 text-[#800000]"
                : "border-slate-200 bg-white text-slate-600")
            }
          >
            Calculator
          </button>

          {selectedClass && (
            <p className="text-xs text-slate-500 mt-3">
              Selected class: <strong>{selectedClass}</strong>
            </p>
          )}

        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">

          <h4 className="font-bold text-slate-800 mb-3">
            Package Execution Flow
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
              Package
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
              Import Class
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
              add()
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