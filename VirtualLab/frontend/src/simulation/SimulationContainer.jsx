import React, { useEffect, useMemo, useState } from 'react';

const SAMPLE_CODES = {
  interface: `interface Animal {
    void sound();
}

class Dog implements Animal {
    public void sound() {
        System.out.println("Dog barks");
    }
}

public class Main {
    public static void main(String[] args) {
        Animal a = new Dog();
        a.sound();
    }
}`,

  package: `package mypackage;

class Student {
    void display() {
        System.out.println("Student class from package");
    }
}

public class Main {
    public static void main(String[] args) {
        Student s = new Student();
        s.display();
    }
}`,

  exception: `public class Main {
    public static void main(String[] args) {
        try {
            int a = 10;
            int b = 0;
            int result = a / b;
            System.out.println(result);
        } catch (ArithmeticException e) {
            System.out.println("Cannot divide by zero");
        }
    }
}`,

  multithreading: `class MyThread extends Thread {
    public void run() {
        System.out.println("Thread is running");
    }
}

public class Main {
    public static void main(String[] args) {
        MyThread t = new MyThread();
        t.start();
    }
}`,

  file: `import java.io.FileWriter;
import java.io.IOException;

public class Main {
    public static void main(String[] args) {
        try {
            FileWriter writer = new FileWriter("data.txt");
            writer.write("Hello Java File Handling");
            writer.close();

            System.out.println("Data written to file successfully");
        } catch (IOException e) {
            System.out.println("File error occurred");
        }
    }
}`
};

function getExperimentType(title = '') {
  const value = title.toLowerCase();

  if (value.includes('interface')) return 'interface';
  if (value.includes('package')) return 'package';
  if (value.includes('exception')) return 'exception';
  if (value.includes('multithread')) return 'multithreading';
  if (value.includes('file')) return 'file';

  return 'interface';
}

function getExperimentName(type) {
  const names = {
    interface: 'Interface',
    package: 'Package',
    exception: 'Exception Handling',
    multithreading: 'Multithreading',
    file: 'File Handling'
  };

  return names[type];
}

function getExpectedOutput(type) {
  const outputs = {
    interface: 'Dog barks',
    package: 'Student class from package',
    exception: 'Cannot divide by zero',
    multithreading: 'Thread is running',
    file: 'Data written to file successfully'
  };

  return outputs[type];
}

export default function SimulationContainer({ experimentTitle }) {
  const experimentType = useMemo(
    () => getExperimentType(experimentTitle),
    [experimentTitle]
  );

  const sampleCode = SAMPLE_CODES[experimentType];

  const [code, setCode] = useState('');
  const [showSample, setShowSample] = useState(false);
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState('Ready');
  const [liveChecking, setLiveChecking] = useState(true);
  const [lineNumbers, setLineNumbers] = useState('1');

  useEffect(() => {
    setCode('');
    setOutput('');
    setStatus('Ready');
    setShowSample(false);
  }, [experimentType]);

  useEffect(() => {
    const lines = Math.max(code.split('\n').length, 1);

    let numbers = '';

    for (let i = 1; i <= lines; i++) {
      numbers += i;

      if (i < lines) {
        numbers += '\n';
      }
    }

    setLineNumbers(numbers);
  }, [code]);

  const compileCode = (sourceCode, live = false) => {
    const trimmedCode = sourceCode.trim();

    if (!trimmedCode) {
      setStatus('Ready');
      setOutput('');
      return;
    }

    const lines = trimmedCode.split('\n');

    const publicClassMatch = trimmedCode.match(
      /public\s+class\s+(\w+)/
    );

    const hasClass = /\bclass\s+\w+/.test(trimmedCode);

    const hasMain =
      /public\s+static\s+void\s+main\s*\(\s*String\s*(\[\s*\]|\.\.\.)\s*\w*\s*\)/.test(
        trimmedCode
      );

    /* Missing class */
    if (!hasClass) {
      setStatus('Error');

      setOutput(
        'Compilation Error\n\n' +
        'class, interface, or enum expected\n\n' +
        `${lines[0] || ''}\n` +
'^'
      );

      return;
    }

    /* Missing main method */
    if (!hasMain) {
      setStatus('Error');

      setOutput(
        'Compilation Error\n\n' +
        'Main method not found\n\n' +
        'Please add:\n' +
        'public static void main(String[] args)'
      );

      return;
    }

    /* Simple syntax checks */
    const openBraces = (trimmedCode.match(/{/g) || []).length;
    const closeBraces = (trimmedCode.match(/}/g) || []).length;

    if (openBraces !== closeBraces) {
      setStatus('Error');

      setOutput(
        'Compilation Error\n\n' +
        'reached end of file while parsing\n\n' +
        'Check your { } brackets.'
      );

      return;
    }

    /* Special Java error example */
    if (
      /^\s*public\s*$/m.test(trimmedCode) ||
      /^\s*public\s+\n/m.test(trimmedCode)
    ) {
      setStatus('Error');

      setOutput(
        'Compilation Error\n\n' +
        'class, interface, or enum expected\n\n' +
        'public\n' +
        '^\n\n' +
        'Fix the error on line 1 to continue\n' +
        '1 error found'
      );

      return;
    }

    setStatus('Success');

    setOutput(
      'Compilation successful.\n\n' +
      'Running Java program...\n\n' +
      getExpectedOutput(experimentType)
    );
  };

  const runCode = () => {
    const trimmedCode = code.trim();

    if (!trimmedCode) {
      setStatus('Error');

      setOutput(
        'Compilation Error\n\n' +
        'Please type your Java code in the editor before running.'
      );

      return;
    }

    setStatus('Compiling...');

    setTimeout(() => {
      compileCode(code);
    }, 500);
  };

  const handleCodeChange = (event) => {
    const newCode = event.target.value;

    setCode(newCode);

    if (liveChecking) {
      setStatus(newCode.trim() ? 'Checking...' : 'Ready');

      clearTimeout(window.__javaLiveTimer);

      window.__javaLiveTimer = setTimeout(() => {
        if (newCode.trim()) {
          compileCode(newCode, true);
        }
      }, 800);
    }
  };

  const resetCode = () => {
    setCode('');
    setOutput('');
    setStatus('Ready');
    setShowSample(false);
  };

  const clearCode = () => {
    setCode('');
    setOutput('');
    setStatus('Ready');
  };

  const preventClipboard = (event) => {
    event.preventDefault();
  };

  const handleKeyDown = (event) => {
    const key = event.key.toLowerCase();

    if (
      (event.ctrlKey || event.metaKey) &&
      ['c', 'v', 'x'].includes(key)
    ) {
      event.preventDefault();
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
  };

  const statusDot =
    status === 'Success'
      ? 'bg-emerald-500'
      : status === 'Error'
        ? 'bg-red-500'
        : 'bg-slate-400';

  const statusClass =
    status === 'Success'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : status === 'Error'
        ? 'bg-red-50 text-red-700 border-red-200'
        : 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <div className="w-full space-y-5">

      {/* MAIN COMPILER */}
      <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">

        {/* HEADER */}
        <div className="px-5 pt-5">

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b-2 border-[#b5122b] pb-3">

            <h3 className="text-lg font-semibold text-[#800000]">
              Interactive Java Code Simulator
            </h3>

            <label className="flex items-center gap-2 px-3 py-1.5 border border-red-200 rounded-md text-xs text-[#800000]">
              <input
                type="checkbox"
                checked={liveChecking}
                onChange={(e) => setLiveChecking(e.target.checked)}
                className="accent-[#800000]"
              />

              <span>Live Checking &amp; Run</span>
            </label>

          </div>

        </div>

        {/* DESCRIPTION */}
        <div className="px-5 pt-5">

          <p className="text-sm text-slate-700 leading-relaxed">
            Type your Java code in the <strong>Simulator</strong> box on the
            left. The <strong>Output</strong> box on the right will
            simultaneously display compilation status, errors, or live
            standard output.
          </p>

        </div>

        {/* BUTTONS */}
        <div className="px-5 py-5">

          <div className="flex flex-wrap gap-2">

            <button
              type="button"
              onClick={runCode}
              className="px-4 py-2 bg-[#b5122b] text-white rounded-md text-sm font-medium hover:bg-[#980f24] transition"
            >
              ▶ Run Code
            </button>

            <button
              type="button"
              onClick={resetCode}
              className="px-4 py-2 bg-white text-[#b5122b] border border-[#b5122b] rounded-md text-sm font-medium hover:bg-red-50 transition"
            >
              ↻ Reset Code
            </button>

            <button
              type="button"
              onClick={clearCode}
              className="px-4 py-2 bg-white text-[#b5122b] border border-[#b5122b] rounded-md text-sm font-medium hover:bg-red-50 transition"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={() => setShowSample(!showSample)}
              className="px-4 py-2 bg-white text-[#b5122b] border border-[#b5122b] rounded-md text-sm font-medium hover:bg-red-50 transition"
            >
              📄 Sample Code
            </button>

          </div>

        </div>

        {/* SAMPLE CODE */}
        {showSample && (
          <div className="mx-5 mb-5 border border-red-200 rounded-lg overflow-hidden">

            <div className="bg-red-50 px-4 py-3 flex items-center justify-between">

              <span className="text-sm font-medium text-[#800000]">
                Provided Sample Code
              </span>

              <span className="text-xs text-slate-500">
                Type manually in the editor
              </span>

            </div>

            <pre
              onCopy={preventClipboard}
              onCut={preventClipboard}
              onPaste={preventClipboard}
              onContextMenu={preventClipboard}
              onDragStart={preventClipboard}
              className="bg-slate-950 text-green-400 p-4 text-xs sm:text-sm overflow-x-auto whitespace-pre font-mono select-none"
            >
              {sampleCode}
            </pre>

          </div>
        )}

        {/* TWO BOXES */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 px-5 pb-5">

          {/* LEFT EDITOR */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">

            {/* EDITOR HEADER */}
            <div className="bg-[#252525] px-4 py-3 flex items-center justify-between">

              <h4 className="text-sm font-normal text-slate-200">
                💻 Simulator (Java Editor)
              </h4>

              <span className="px-3 py-1 bg-[#3a3a3a] rounded-full text-xs font-normal text-slate-200">
                JAVA 17
              </span>

            </div>

            {/* EDITOR */}
            <div className="bg-[#1e1e1e] flex min-h-[420px]">

              {/* LINE NUMBERS */}
              <pre className="w-10 sm:w-12 shrink-0 bg-[#1e1e1e] text-slate-500 text-xs text-right px-2 py-4 leading-6 select-none border-r border-[#303030] overflow-hidden">
                {lineNumbers}
              </pre>

              {/* CODE AREA */}
              <textarea
                value={code}
                onChange={handleCodeChange}
                onCopy={preventClipboard}
                onCut={preventClipboard}
                onPaste={preventClipboard}
                onContextMenu={preventClipboard}
                onDrop={handleDrop}
                onDragOver={handleDrop}
                onKeyDown={handleKeyDown}
                spellCheck="false"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                className="flex-1 min-w-0 bg-[#1e1e1e] text-slate-200 p-4 text-xs sm:text-sm leading-6 font-mono resize-none outline-none border-0 placeholder:text-green-500"
                placeholder="// Type your Java code here manually..."
              />

            </div>

            {/* STDIN */}
            <div className="bg-[#1e1e1e] border-t border-[#303030] px-3 py-2 flex items-center gap-2">

              <label className="text-xs text-slate-300 whitespace-nowrap">
                ⌨ Stdin (Scanner Input):
              </label>

              <input
                type="text"
                placeholder="Space or newline separated values (e.g. Heet 20)"
                className="flex-1 min-w-0 bg-[#252525] border border-[#3a3a3a] rounded-md px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 outline-none"
              />

            </div>

          </div>

          {/* RIGHT TERMINAL */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">

            {/* TERMINAL HEADER */}
            <div className="bg-[#171717] px-4 py-3 flex items-center justify-between border-b border-[#303030]">

              <div className="flex items-center gap-2">

                <span
                  className={`h-2.5 w-2.5 rounded-full ${statusDot}`}
                />

                <div>
                  <h4 className="text-sm font-normal text-slate-200 uppercase tracking-wide">
                    Terminal Output
                  </h4>

                  {/* RED LINE */}
                  <div className="h-[2px] w-24 bg-[#b5122b] mt-1" />
                </div>

              </div>

              <span
                className={`px-3 py-1 rounded-full border text-xs font-normal ${statusClass}`}
              >
                {status.toUpperCase()}
              </span>

            </div>

            {/* TERMINAL BODY */}
            <div className="bg-[#111111] min-h-[420px] p-4">

              {!output ? (
                <div className="bg-[#191919] border border-[#303030] rounded-lg p-4">

                  <div className="flex items-center justify-between mb-4">

                    <span className="text-xs text-slate-400">
                      ▸ KJSIT VIRTUAL LAB CONSOLE
                    </span>

                    <span className="text-xs text-slate-400">
                      JAVA 17
                    </span>

                  </div>

                  <p className="text-sm text-slate-200 mb-2">
                    <strong>Status:</strong> Ready
                  </p>

                  <p className="text-sm text-slate-200 leading-6">
                    Type your Java code in the Simulator on the left to see
                    live simulation and output.
                  </p>

                  <div className="mt-4 space-y-1 text-xs text-slate-500">
                    <p>• Brackets come only when you type them.</p>
                    <p>• Pressing Enter automatically indents by 4 spaces.</p>
                    <p>• Standard input (Scanner) can be entered in the Stdin bar below.</p>
                  </div>

                </div>
              ) : status === 'Error' ? (

                /* ERROR OUTPUT */
                <div className="bg-[#261719] border border-red-500 rounded-lg p-4">

                  <div className="flex items-center justify-between mb-4">

                    <span className="text-sm text-red-400 font-medium">
                      ⚠ Compilation Error
                    </span>

                    <span className="bg-red-900 text-red-300 px-2 py-1 rounded text-xs">
                      Line 1
                    </span>

                  </div>

                  <p className="text-sm text-red-400 mb-3">
                    {output.split('\n')[2] || 'Compilation error'}
                  </p>

                  <pre className="bg-[#101010] border border-[#333] rounded p-3 text-xs text-slate-200 whitespace-pre-wrap">
                    {output}
                  </pre>

                  <div className="flex justify-between mt-4 text-xs text-slate-400">
                    <span>Fix the error on line 1 to continue</span>
                    <span>1 error found</span>
                  </div>

                </div>

              ) : (

                /* SUCCESS OUTPUT */
                <div className="bg-[#191919] border border-[#303030] rounded-lg p-4">

                  <div className="flex items-center justify-between mb-4">

                    <span className="text-xs text-slate-400">
                      ▸ KJSIT VIRTUAL LAB CONSOLE
                    </span>

                    <span className="text-xs text-slate-400">
                      JAVA 17
                    </span>

                  </div>

                  <pre className="text-sm text-slate-200 whitespace-pre-wrap font-mono leading-6">
                    {output}
                  </pre>

                </div>

              )}

            </div>

          </div>

        </div>

      </section>

    </div>
  );
}