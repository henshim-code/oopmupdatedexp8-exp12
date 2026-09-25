import React, { useState, useEffect, useMemo } from 'react';
import { 
  Grid, 
  Layers, 
  Zap, 
  Gauge, 
  Database, 
  Terminal, 
  HelpCircle, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles
} from 'lucide-react';

export default function MlToolsSimulation() {
  const [activeTab, setActiveTab] = useState('playground');

  // ==================== 1. NUMPY PLAYGROUND STATE ====================
  const array1D = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const array2D = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]
  ];
  const [sliceExpr, setSliceExpr] = useState('A[1:5]');
  const [dimMode, setDimMode] = useState('1D'); // '1D' or '2D'

  // Determine highlighted indexes for 1D / 2D slicing
  const getIsHighlighted1D = (idx) => {
    if (sliceExpr === 'A[1:5]') return idx >= 1 && idx < 5;
    if (sliceExpr === 'A[:4]') return idx < 4;
    if (sliceExpr === 'A[3:]') return idx >= 3;
    if (sliceExpr === 'A[3]') return idx === 3;
    if (sliceExpr === 'A[-1]') return idx === array1D.length - 1;
    return false;
  };

  const getIsHighlighted2D = (r, c) => {
    if (sliceExpr === 'B[0, 1]') return r === 0 && c === 1;
    if (sliceExpr === 'B[1:3, 1:3]') return r >= 1 && r < 3 && c >= 1 && c < 3;
    if (sliceExpr === 'B[1, :]') return r === 1;
    if (sliceExpr === 'B[:, 2]') return c === 2;
    if (sliceExpr === 'B[2, 1]') return r === 2 && c === 1;
    return false;
  };

  // ==================== 2. RESHAPE / FLATTEN STATE ====================
  const [reshapeMode, setReshapeMode] = useState('original'); // 'original', '2d_3x3', 'flatten'

  // ==================== 3. BROADCASTING / MATRIX OPS STATE ====================
  const P = [
    [1, 2, 3],
    [4, 5, 6]
  ];
  const Q = [
    [2, -7, 5],
    [-6, 2, 0]
  ];
  const [matrixOp, setMatrixOp] = useState('multiply'); // 'multiply' or 'dot'

  // Computed results
  const elementWiseMult = [
    [1*2, 2*-7, 3*5],
    [4*-6, 5*2, 6*0]
  ]; // [[2, -14, 15], [-24, 10, 0]]

  // ==================== 4. SPEED & MEMORY RACE STATE ====================
  const [isRacing, setIsRacing] = useState(false);
  const [raceProgressPy, setRaceProgressPy] = useState(0);
  const [raceProgressNp, setRaceProgressNp] = useState(0);
  const [benchmarkResult, setBenchmarkResult] = useState(null);

  const startRace = async () => {
    setIsRacing(true);
    setRaceProgressPy(0);
    setRaceProgressNp(0);

    // Fast NumPy progress bar
    let npVal = 0;
    const npInterval = setInterval(() => {
      npVal += 25;
      setRaceProgressNp(Math.min(100, npVal));
      if (npVal >= 100) clearInterval(npInterval);
    }, 40);

    // Slow Python List progress bar
    let pyVal = 0;
    const pyInterval = setInterval(() => {
      pyVal += 5;
      setRaceProgressPy(Math.min(100, pyVal));
      if (pyVal >= 100) clearInterval(pyInterval);
    }, 60);

    try {
      const res = await fetch('http://localhost:8000/api/ml/tools/benchmark?n=100000');
      if (res.ok) {
        const data = await res.json();
        setBenchmarkResult(data);
      } else {
        throw new Error('Fallback benchmark');
      }
    } catch {
      setBenchmarkResult({
        num_elements: 100000,
        list_time_ms: 18.5,
        numpy_time_ms: 0.6,
        speedup: 30.8,
        list_memory_kb: 800.0,
        numpy_memory_kb: 400.0
      });
    } finally {
      setTimeout(() => setIsRacing(false), 1200);
    }
  };

  // ==================== 5 & 6. PANDAS EXPLORER & NULL DETECTIVE STATE ====================
  const initialData = [
    { id: 1, Name: "Avery Bradley", Team: "Boston Celtics", Age: 25, Position: "PG", Salary: 7730337 },
    { id: 2, Name: "Jae Crowder", Team: "Boston Celtics", Age: 25, Position: "SF", Salary: 6796117 },
    { id: 3, Name: "John Holland", Team: "Boston Celtics", Age: 27, Position: "SG", Salary: null },
    { id: 4, Name: "Amir Johnson", Team: "Boston Celtics", Age: 29, Position: "PF", Salary: 12000000 },
    { id: 5, Name: "Gordon Hayward", Team: "Utah Jazz", Age: 26, Position: "SF", Salary: 15409728 },
    { id: 6, Name: "Rudy Gobert", Team: "Utah Jazz", Age: 24, Position: "C", Salary: 1175880 },
    { id: 7, Name: null, Team: "Utah Jazz", Age: 20, Position: "PF", Salary: 2346540 },
    { id: 8, Name: "Shelvin Mack", Team: "Utah Jazz", Age: 26, Position: "PG", Salary: 2433333 }
  ];

  const [dfData] = useState(initialData);
  const [ageFilter, setAgeFilter] = useState(false);
  const [nullAction, setNullAction] = useState('none'); // 'none', 'find', 'drop'

  const filteredData = useMemo(() => {
    let list = [...dfData];
    if (nullAction === 'drop') {
      list = list.filter(row => row.Name !== null && row.Salary !== null);
    }
    if (ageFilter) {
      list = list.filter(row => row.Age > 25);
    }
    return list;
  }, [dfData, ageFilter, nullAction]);

  // ==================== 7. JUPYTER NOTEBOOK LAB RUNNER STATE (Q1-35) ====================
  const labQuestions = [
    { id: 1, title: "Q1. Install & Import NumPy", code: "import numpy as np\nprint(np.__version__)", output: "1.24.3 (NumPy ready)" },
    { id: 2, title: "Q2. Import NumPy with alias", code: "import numpy as np", output: "Imported numpy as np" },
    { id: 3, title: "Q3. Create 1-D Array A", code: "A = np.array([1,2,3,4,5,6,7,8,9])\nprint(A)", output: "[1 2 3 4 5 6 7 8 9]" },
    { id: 4, title: "Q4. Print elements and type of A", code: "print(A)\nprint(type(A))", output: "[1 2 3 4 5 6 7 8 9]\n<class 'numpy.ndarray'>" },
    { id: 5, title: "Q5. Create 2-D Array B", code: "B = np.array([[1,2,3], [4,5,6], [7,8,9]])\nprint(B)\nprint(type(B))", output: "[[1 2 3]\n [4 5 6]\n [7 8 9]]\n<class 'numpy.ndarray'>" },
    { id: 6, title: "Q6. Create 3-D Array C", code: "C = np.array([[[1,2],[3,4],[5,6]],[[7,8],[9,10],[11,12]],[[13,14],[15,16],[17,18]]])\nprint(C)", output: "3-D Array Shape (3, 3, 2) Created" },
    { id: 7, title: "Q7. Print 3rd element of A", code: "print(A[3])", output: "4" },
    { id: 8, title: "Q8. Print 2nd element of 3rd row of B", code: "print(B[2, 1])", output: "8" },
    { id: 11, title: "Q11. Slice elements from index 1 to 5 of A", code: "print(A[1:5])", output: "[2 3 4 5]" },
    { id: 16, title: "Q16. Reshape array A into 2D array (3x3)", code: "A1 = A.reshape(3, 3)\nprint(A1)", output: "[[1 2 3]\n [4 5 6]\n [7 8 9]]" },
    { id: 17, title: "Q17. Flatten 3-D array C", code: "C1 = C.reshape(-1)\nprint(C1)", output: "[1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18]" },
    { id: 22, title: "Q22. Element-wise matrix multiplication", code: "P = np.array([[1,2,3],[4,5,6]])\nQ = np.array([[2,-7,5],[-6,2,0]])\nprint(np.multiply(P, Q))", output: "[[  2 -14  15]\n [-24  10   0]]" },
    { id: 27, title: "Q27. Install & Import Pandas", code: "import pandas as pd", output: "Pandas ready" },
    { id: 28, title: "Q28. Read CSV data into dataframe df", code: "df = pd.read_csv('nba.csv')\nprint('Loaded rows:', len(df))", output: "Loaded rows: 457" },
    { id: 29, title: "Q29. Display top 10 rows", code: "df.head(10)", output: "Displaying top 10 rows of NBA dataset" },
    { id: 33, title: "Q33. Filter players with Age > 25", code: "df[df['Age'] > 25]", output: "Filtered 248 records where Age > 25" },
    { id: 35, title: "Q35. Check empty cells in dataframe", code: "df.isnull().sum()", output: "Name: 1\nTeam: 0\nAge: 0\nSalary: 1" }
  ];

  const [executedCells, setExecutedCells] = useState({});

  const handleRunCell = (qId) => {
    setExecutedCells(prev => ({ ...prev, [qId]: true }));
  };

  // ==================== 8. QUIZ / FLASHCARDS STATE ====================
  const quizQuestions = [
    {
      id: 1,
      q: "What is the primary difference between a Python list and a NumPy array?",
      options: [
        "NumPy arrays store elements in contiguous memory for vectorized speed, while lists hold pointers",
        "Python lists can only hold numeric integers",
        "NumPy arrays use more memory than lists",
        "Python lists do not support 2D indexing"
      ],
      ans: "NumPy arrays store elements in contiguous memory for vectorized speed, while lists hold pointers"
    },
    {
      id: 2,
      q: "Which method reshapes a multidimensional array into a 1D flat array in NumPy?",
      options: ["reshape(-1)", "flatten_all()", "to_single()", "array.to_list()"],
      ans: "reshape(-1)"
    },
    {
      id: 3,
      q: "What does `df.isnull().sum()` compute in Pandas?",
      options: [
        "Returns the total number of missing / null values in each column",
        "Deletes all missing values from the dataframe",
        "Calculates the sum of all numeric columns",
        "Finds the maximum value in the dataframe"
      ],
      ans: "Returns the total number of missing / null values in each column"
    }
  ];

  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-50 via-white to-red-50 p-5 rounded-2xl border border-red-100 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-[#800000] text-white rounded-xl shadow-xs">
            <Grid className="h-6 w-6 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              Expt 1: NumPy & Pandas ML Tools Simulator
              <span className="text-xs font-semibold px-2.5 py-0.5 bg-red-100 text-[#800000] rounded-full">
                SPIT Suite
              </span>
            </h3>
            <p className="text-xs text-slate-600">
              Interactive Array Slicing, Reshape Visualizer, Speed Race, Pandas Explorer, and Notebook Runner.
            </p>
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'playground', label: '1. Slicing & Reshape', icon: Grid },
          { id: 'broadcasting', label: '2. Matrix & Ops', icon: Layers },
          { id: 'race', label: '3. Speed Race', icon: Gauge },
          { id: 'pandas', label: '4. Pandas & Null Detective', icon: Database },
          { id: 'notebook', label: '5. Lab Notebook (Q1-35)', icon: Terminal },
          { id: 'quiz', label: '6. Post-Lab Quiz', icon: HelpCircle }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-[#800000] text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-red-50 hover:text-[#800000] border border-slate-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ==================== TAB 1: SLICING & RESHAPE PLAYGROUND ==================== */}
      {activeTab === 'playground' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Grid className="h-5 w-5 text-[#800000]" /> Live Slicing & Indexing Highlighter
                </h4>
                <p className="text-xs text-slate-500">
                  Select a slicing expression and watch matching elements glow visually in the array.
                </p>
              </div>

              {/* Mode Toggle (1D vs 2D) */}
              <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  onClick={() => { setDimMode('1D'); setSliceExpr('A[1:5]'); }}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${dimMode === '1D' ? 'bg-[#800000] text-white' : 'text-slate-600'}`}
                >
                  1D Array A
                </button>
                <button
                  onClick={() => { setDimMode('2D'); setSliceExpr('B[1:3, 1:3]'); }}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${dimMode === '2D' ? 'bg-[#800000] text-white' : 'text-slate-600'}`}
                >
                  2D Array B
                </button>
              </div>
            </div>

            {/* Expression Selector Dropdown */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Choose Slicing Expression:</label>
              <select
                value={sliceExpr}
                onChange={(e) => setSliceExpr(e.target.value)}
                className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl p-3 text-[#800000] focus:ring-2 focus:ring-[#800000] outline-none cursor-pointer font-mono"
              >
                {dimMode === '1D' ? (
                  <>
                    <option value="A[1:5]">A[1:5] -- Slice from index 1 to 4 (Elements 2,3,4,5)</option>
                    <option value="A[:4]">A[:4] -- Slice from start to index 3</option>
                    <option value="A[3:]">A[3:] -- Slice from index 3 to end</option>
                    <option value="A[3]">A[3] -- Single element at index 3</option>
                    <option value="A[-1]">A[-1] -- Last element</option>
                  </>
                ) : (
                  <>
                    <option value="B[1:3, 1:3]">B[1:3, 1:3] -- 2x2 Sub-matrix slice</option>
                    <option value="B[0, 1]">B[0, 1] -- Element at Row 0, Col 1</option>
                    <option value="B[1, :]">B[1, :] -- Entire Row index 1</option>
                    <option value="B[:, 2]">B[:, 2] -- Entire Column index 2</option>
                    <option value="B[2, 1]">B[2, 1] -- Element at Row 2, Col 1 (Expt 1 Q8)</option>
                  </>
                )}
              </select>
            </div>

            {/* Grid Display */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-4">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Visual Array Inspection ({dimMode})
              </span>

              {dimMode === '1D' ? (
                <div className="flex flex-wrap items-center justify-center gap-3">
                  {array1D.map((val, idx) => {
                    const isHigh = getIsHighlighted1D(idx);
                    return (
                      <div
                        key={idx}
                        className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center transition-all duration-300 transform ${
                          isHigh
                            ? 'bg-[#800000] text-white scale-110 shadow-lg ring-4 ring-red-200 font-extrabold'
                            : 'bg-white text-slate-700 border border-slate-300 font-bold'
                        }`}
                      >
                        <span className="text-base font-mono">{val}</span>
                        <span className={`text-[9px] ${isHigh ? 'text-red-200' : 'text-slate-400'}`}>idx {idx}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="inline-grid grid-cols-3 gap-3">
                  {array2D.map((row, r) =>
                    row.map((val, c) => {
                      const isHigh = getIsHighlighted2D(r, c);
                      return (
                        <div
                          key={`${r}-${c}`}
                          className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center transition-all duration-300 transform ${
                            isHigh
                              ? 'bg-[#800000] text-white scale-110 shadow-lg ring-4 ring-red-200 font-extrabold'
                              : 'bg-white text-slate-700 border border-slate-300 font-bold'
                          }`}
                        >
                          <span className="text-base font-mono">{val}</span>
                          <span className={`text-[9px] ${isHigh ? 'text-red-200' : 'text-slate-400'}`}>
                            [{r},{c}]
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Reshape / Flatten Visualizer */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" /> Reshape & Flatten Unfolding Visualizer
                </h4>
                <p className="text-xs text-slate-500">
                  See how data reorganizes without changing underlying values using `.reshape()`.
                </p>
              </div>

              <div className="flex items-center space-x-2 text-xs font-bold">
                <button
                  onClick={() => setReshapeMode('original')}
                  className={`px-3 py-1.5 rounded-lg border transition-colors ${reshapeMode === 'original' ? 'bg-[#800000] text-white' : 'bg-slate-50 text-slate-700'}`}
                >
                  Original 1D (9,)
                </button>
                <button
                  onClick={() => setReshapeMode('2d_3x3')}
                  className={`px-3 py-1.5 rounded-lg border transition-colors ${reshapeMode === '2d_3x3' ? 'bg-[#800000] text-white' : 'bg-slate-50 text-slate-700'}`}
                >
                  Reshape 2D (3x3)
                </button>
                <button
                  onClick={() => setReshapeMode('flatten')}
                  className={`px-3 py-1.5 rounded-lg border transition-colors ${reshapeMode === 'flatten' ? 'bg-[#800000] text-white' : 'bg-slate-50 text-slate-700'}`}
                >
                  Flatten .reshape(-1)
                </button>
              </div>
            </div>

            <div className="p-6 bg-red-50/40 rounded-xl border border-red-100 text-center space-y-4">
              <span className="text-xs font-mono text-[#800000] font-bold block">
                {reshapeMode === 'original' && 'A = np.array([1, 2, 3, 4, 5, 6, 7, 8, 9])'}
                {reshapeMode === '2d_3x3' && 'A1 = A.reshape(3, 3)'}
                {reshapeMode === 'flatten' && 'C1 = C.reshape(-1)  --> Flattened 1D'}
              </span>

              {reshapeMode === '2d_3x3' ? (
                <div className="inline-grid grid-cols-3 gap-2">
                  {array1D.map((val, idx) => (
                    <div key={idx} className="w-12 h-12 bg-white text-[#800000] border border-red-200 rounded-lg font-bold flex items-center justify-center text-sm shadow-xs font-mono">
                      {val}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {array1D.map((val, idx) => (
                    <div key={idx} className="w-12 h-12 bg-white text-slate-900 border border-slate-200 rounded-lg font-bold flex items-center justify-center text-sm shadow-xs font-mono">
                      {val}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 2: BROADCASTING & MATRIX OPS ==================== */}
      {activeTab === 'broadcasting' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="h-5 w-5 text-[#800000]" /> Matrix Operations (Expt 1 Q22 & Q23)
              </h4>
              <p className="text-xs text-slate-500">
                Pairing elements side-by-side: Element-wise Multiplication vs Matrix Multiplication.
              </p>
            </div>

            <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setMatrixOp('multiply')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${matrixOp === 'multiply' ? 'bg-[#800000] text-white' : 'text-slate-600'}`}
              >
                np.multiply(P, Q)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center text-center">
            {/* Matrix P */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-500 block mb-2 font-mono">Matrix P (2x3)</span>
              <div className="inline-grid grid-cols-3 gap-2">
                {P.map((row, r) =>
                  row.map((val, c) => (
                    <div key={`p-${r}-${c}`} className="w-10 h-10 bg-white border border-blue-200 text-blue-700 font-bold rounded-lg flex items-center justify-center font-mono text-sm">
                      {val}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Matrix Q */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-500 block mb-2 font-mono">Matrix Q (2x3)</span>
              <div className="inline-grid grid-cols-3 gap-2">
                {Q.map((row, r) =>
                  row.map((val, c) => (
                    <div key={`q-${r}-${c}`} className="w-10 h-10 bg-white border border-amber-200 text-amber-700 font-bold rounded-lg flex items-center justify-center font-mono text-sm">
                      {val}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Result Matrix R */}
            <div className="bg-red-50/60 p-4 rounded-xl border border-red-200">
              <span className="text-xs font-bold text-[#800000] block mb-2 font-mono">
                Result R = np.multiply(P, Q)
              </span>
              <div className="inline-grid grid-cols-3 gap-2">
                {elementWiseMult.map((row, r) =>
                  row.map((val, c) => (
                    <div key={`r-${r}-${c}`} className="w-10 h-10 bg-[#800000] text-white font-extrabold rounded-lg flex items-center justify-center font-mono text-sm shadow-xs">
                      {val}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 3: SPEED & MEMORY RACE ==================== */}
      {activeTab === 'race' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Gauge className="h-5 w-5 text-[#800000]" /> Memory & Speed Race: Python List vs NumPy Array
              </h4>
              <p className="text-xs text-slate-500">
                Squaring 100,000 numbers side-by-side to demonstrate why NumPy is 30x faster.
              </p>
            </div>

            <button
              onClick={startRace}
              disabled={isRacing}
              className="flex items-center space-x-2 bg-[#800000] hover:bg-[#6B0000] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all disabled:opacity-50"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>{isRacing ? 'Running Race...' : 'Start Speed Race'}</span>
            </button>
          </div>

          {/* Progress Bars */}
          <div className="space-y-6 bg-slate-50 p-6 rounded-xl border border-slate-200">
            {/* NumPy Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-emerald-700 flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-emerald-600 fill-emerald-600" /> NumPy ndarray Vectorized Engine
                </span>
                <span className="text-emerald-700">{raceProgressNp}%</span>
              </div>
              <div className="w-full bg-slate-200 h-4 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full transition-all duration-100" style={{ width: `${raceProgressNp}%` }}></div>
              </div>
            </div>

            {/* Python List Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-600">Standard Python List (For Loop)</span>
                <span className="text-slate-600">{raceProgressPy}%</span>
              </div>
              <div className="w-full bg-slate-200 h-4 rounded-full overflow-hidden">
                <div className="bg-slate-400 h-full transition-all duration-100" style={{ width: `${raceProgressPy}%` }}></div>
              </div>
            </div>
          </div>

          {/* Benchmark Comparison Results */}
          {benchmarkResult && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-center">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">Speedup Factor</span>
                <span className="text-2xl font-extrabold text-emerald-600">{benchmarkResult.speedup}x Faster</span>
              </div>
              <div className="bg-white border border-slate-200 p-4 rounded-xl text-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">NumPy Time</span>
                <span className="text-xl font-bold text-slate-800">{benchmarkResult.numpy_time_ms} ms</span>
              </div>
              <div className="bg-white border border-slate-200 p-4 rounded-xl text-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Python List Time</span>
                <span className="text-xl font-bold text-slate-800">{benchmarkResult.list_time_ms} ms</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB 4: PANDAS EXPLORER & NULL DETECTIVE ==================== */}
      {activeTab === 'pandas' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Database className="h-5 w-5 text-[#800000]" /> Pandas DataFrame & Missing Data Detective
              </h4>
              <p className="text-xs text-slate-500">
                Inspect DataFrame methods: `.head(10)`, `.info()`, `.isnull().sum()`, `.dropna()`, `.fillna()`.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setAgeFilter(!ageFilter)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                  ageFilter ? 'bg-[#800000] text-white' : 'bg-slate-50 text-slate-700'
                }`}
              >
                Filter: Age &gt; 25 (Q33)
              </button>
            </div>
          </div>

          {/* Action Toolbar for Missing Data */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 text-amber-500" /> Null Detective Controls:
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setNullAction('find')}
                className="px-3 py-1.5 bg-amber-100 text-amber-900 font-bold rounded-lg hover:bg-amber-200"
              >
                Find Nulls (.isnull().sum())
              </button>
              <button
                onClick={() => setNullAction('drop')}
                className="px-3 py-1.5 bg-red-100 text-red-900 font-bold rounded-lg hover:bg-red-200"
              >
                Drop Nulls (.dropna())
              </button>
              <button
                onClick={() => setNullAction('none')}
                className="px-3 py-1.5 bg-slate-200 text-slate-700 font-medium rounded-lg"
              >
                Reset Data
              </button>
            </div>
          </div>

          {/* Interactive Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700">
                  <th className="p-3">ID</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Team</th>
                  <th className="p-3">Position</th>
                  <th className="p-3">Age</th>
                  <th className="p-3">Salary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
                {filteredData.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-400">{row.id}</td>
                    <td className={`p-3 ${row.Name === null && nullAction === 'find' ? 'bg-red-100 text-red-700 font-bold' : ''}`}>
                      {row.Name ?? <span className="italic text-red-500">NaN (Null)</span>}
                    </td>
                    <td className="p-3">{row.Team}</td>
                    <td className="p-3 font-mono">{row.Position}</td>
                    <td className={`p-3 ${row.Age > 25 ? 'text-[#800000] font-bold' : ''}`}>{row.Age}</td>
                    <td className={`p-3 font-mono ${row.Salary === null && nullAction === 'find' ? 'bg-red-100 text-red-700 font-bold' : ''}`}>
                      {row.Salary !== null ? `$${row.Salary.toLocaleString()}` : <span className="italic text-red-500">NaN (Null)</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== TAB 5: NOTEBOOK SIMULATOR (Q1-35) ==================== */}
      {activeTab === 'notebook' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Terminal className="h-5 w-5 text-[#800000]" /> Step-by-Step Jupyter Notebook Simulator (Q1 - Q35)
            </h4>
            <p className="text-xs text-slate-500">
              Interactive notebook cells matching all lab manual questions. Click "Run Cell" to execute python commands.
            </p>
          </div>

          <div className="space-y-4">
            {labQuestions.map((q) => {
              const isRun = executedCells[q.id];
              return (
                <div key={q.id} className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <div className="bg-slate-100 p-3 flex items-center justify-between border-b border-slate-200">
                    <span className="text-xs font-bold text-slate-800">{q.title}</span>
                    <button
                      onClick={() => handleRunCell(q.id)}
                      className="flex items-center space-x-1 bg-[#800000] hover:bg-[#6B0000] text-white px-3 py-1 rounded-lg text-xs font-bold shadow-2xs"
                    >
                      <Play className="h-3 w-3 fill-current" />
                      <span>Run Cell</span>
                    </button>
                  </div>

                  <div className="bg-slate-950 p-3 font-mono text-xs text-emerald-400 overflow-x-auto">
                    <pre>{q.code}</pre>
                  </div>

                  {isRun && (
                    <div className="bg-slate-900 border-t border-slate-800 p-3 font-mono text-xs text-slate-200">
                      <span className="text-[10px] text-slate-500 block mb-1">Out[{q.id}]:</span>
                      <pre>{q.output}</pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================== TAB 6: POST-LAB QUIZ ==================== */}
      {activeTab === 'quiz' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-[#800000]" /> Post-Lab Assessment & Flashcards
            </h4>
            <p className="text-xs text-slate-500">
              Test your understanding of NumPy arrays, Pandas DataFrames, and vectorized operations.
            </p>
          </div>

          <div className="space-y-6">
            {quizQuestions.map((q) => (
              <div key={q.id} className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3">
                <p className="text-sm font-bold text-slate-800">
                  Q{q.id}. {q.q}
                </p>

                <div className="space-y-2">
                  {q.options.map((opt, idx) => {
                    const isSelected = quizAnswers[q.id] === opt;
                    const isCorrect = q.ans === opt;
                    let style = 'bg-white border-slate-200 text-slate-700 hover:border-red-300';
                    if (quizSubmitted) {
                      if (isCorrect) style = 'bg-emerald-100 border-emerald-500 text-emerald-900 font-bold';
                      else if (isSelected && !isCorrect) style = 'bg-red-100 border-red-500 text-red-900 font-bold';
                    } else if (isSelected) {
                      style = 'bg-red-100 border-[#800000] text-[#800000] font-bold';
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => setQuizAnswers(prev => ({ ...prev, [q.id]: opt }))}
                        className={`w-full text-left p-3 rounded-lg border text-xs transition-all flex items-center justify-between ${style}`}
                      >
                        <span>{opt}</span>
                        {quizSubmitted && isCorrect && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="flex justify-end">
              <button
                onClick={() => setQuizSubmitted(true)}
                className="bg-[#800000] hover:bg-[#6B0000] text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-md"
              >
                Submit Quiz Answers
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
