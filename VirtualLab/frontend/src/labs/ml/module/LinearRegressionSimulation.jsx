import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sliders, 
  Sparkles, 
  RotateCcw, 
  TrendingUp, 
  BarChart3, 
  Target,
  Zap,
  Server,
  CheckCircle2
} from 'lucide-react';

export default function LinearRegressionSimulation({ experiment }) {
  // Preset Scenarios
  const PRESETS = {
    clean_linear: {
      name: 'Linear Trend (Low Noise)',
      n_samples: 60,
      slope: 3.0,
      intercept: 5.0,
      noise: 2.0,
      x_min: 0,
      x_max: 10,
      train_split: 0.8,
      solver: 'ols'
    },
    noisy: {
      name: 'High Variance / Noisy Data',
      n_samples: 80,
      slope: 2.5,
      intercept: 8.0,
      noise: 10.0,
      x_min: 0,
      x_max: 15,
      train_split: 0.8,
      solver: 'ols'
    },
    negative_slope: {
      name: 'Steep Negative Slope',
      n_samples: 50,
      slope: -4.0,
      intercept: 30.0,
      noise: 3.0,
      x_min: 0,
      x_max: 10,
      train_split: 0.8,
      solver: 'ols'
    },
    gradient_descent: {
      name: 'Gradient Descent Optimization',
      n_samples: 60,
      slope: 2.0,
      intercept: 4.0,
      noise: 3.0,
      x_min: 0,
      x_max: 10,
      train_split: 0.8,
      solver: 'gradient_descent',
      learning_rate: 0.01,
      epochs: 100
    }
  };

  // State Management
  const [selectedPresetKey, setSelectedPresetKey] = useState('clean_linear');
  const [nSamples, setNSamples] = useState(60);
  const [slope, setSlope] = useState(3.0);
  const [intercept, setIntercept] = useState(5.0);
  const [noise, setNoise] = useState(2.0);
  const [xMin, setXMin] = useState(0);
  const [xMax, setXMax] = useState(10);
  const [trainSplit, setTrainSplit] = useState(0.8);
  const [solver, setSolver] = useState('ols');
  const [learningRate, setLearningRate] = useState(0.01);
  const [epochs, setEpochs] = useState(100);

  // Single Point Predictor Tool Input
  const [predictX, setPredictX] = useState(5.0);
  const [backendConnected, setBackendConnected] = useState(false);
  const [backendResponse, setBackendResponse] = useState(null);

  // Regex input limits guard validator
  const validateAndClamp = (val, min, max, defaultVal) => {
    const numRegex = /^-?\d+(\.\d+)?$/;
    if (!numRegex.test(String(val))) return defaultVal;
    const num = parseFloat(val);
    if (isNaN(num)) return defaultVal;
    return Math.min(Math.max(num, min), max);
  };

  // Apply Preset Dropdown Selection
  const handlePresetChange = (key) => {
    setSelectedPresetKey(key);
    if (key !== 'custom' && PRESETS[key]) {
      const p = PRESETS[key];
      setNSamples(p.n_samples);
      setSlope(p.slope);
      setIntercept(p.intercept);
      setNoise(p.noise);
      setXMin(p.x_min);
      setXMax(p.x_max);
      setTrainSplit(p.train_split);
      setSolver(p.solver);
      if (p.learning_rate) setLearningRate(p.learning_rate);
      if (p.epochs) setEpochs(p.epochs);
    }
  };

  // Fetch backend FastAPI simulation
  useEffect(() => {
    const fetchBackendSimulation = async () => {
      try {
        const payload = {
          preset: selectedPresetKey,
          n_samples: nSamples,
          slope,
          intercept,
          noise,
          x_min: xMin,
          x_max: xMax,
          train_split: trainSplit,
          solver,
          learning_rate: learningRate,
          epochs,
          predict_x: predictX
        };

        const res = await fetch('http://localhost:8000/api/ml/linear-regression/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const data = await res.json();
          setBackendResponse(data);
          setBackendConnected(true);
        } else {
          setBackendConnected(false);
        }
      } catch (err) {
        setBackendConnected(false);
      }
    };

    fetchBackendSimulation();
  }, [selectedPresetKey, nSamples, slope, intercept, noise, xMin, xMax, trainSplit, solver, learningRate, epochs, predictX]);

  // Simulation Calculation (Client-side computation fallback)
  const clientResult = useMemo(() => {
    const safeN = validateAndClamp(nSamples, 10, 300, 50);
    const safeSlope = validateAndClamp(slope, -15, 15, 3.0);
    const safeIntercept = validateAndClamp(intercept, -50, 50, 5.0);
    const safeNoise = validateAndClamp(noise, 0, 30, 2.0);
    const safeXMin = validateAndClamp(xMin, -50, 50, 0);
    const safeXMax = Math.max(validateAndClamp(xMax, 1, 100, 10), safeXMin + 1);
    const safeSplit = validateAndClamp(trainSplit, 0.5, 0.9, 0.8);

    const points = [];
    const nTrain = Math.floor(safeN * safeSplit);

    for (let i = 0; i < safeN; i++) {
      const normX = i / Math.max(1, safeN - 1);
      const x = safeXMin + normX * (safeXMax - safeXMin);
      
      const pseudoNoise = (Math.sin(i * 12.9898 + 78.233) * 43758.5453) % 1;
      const noiseOffset = (pseudoNoise - 0.5) * 2 * safeNoise;
      
      const yTrue = safeSlope * x + safeIntercept;
      const yActual = yTrue + noiseOffset;
      const isTrain = i < nTrain;

      points.push({ x, yTrue, yActual, isTrain });
    }

    // OLS Regression Solver
    const trainPoints = points.filter(p => p.isTrain);
    const meanX = trainPoints.reduce((acc, p) => acc + p.x, 0) / trainPoints.length;
    const meanY = trainPoints.reduce((acc, p) => acc + p.yActual, 0) / trainPoints.length;

    let num = 0, den = 0;
    trainPoints.forEach(p => {
      num += (p.x - meanX) * (p.yActual - meanY);
      den += (p.x - meanX) ** 2;
    });

    let fittedSlope = den !== 0 ? num / den : 0;
    let fittedIntercept = meanY - fittedSlope * meanX;

    if (solver === 'gradient_descent') {
      let gIntercept = 0.0;
      let gSlope = 0.0;
      const m = trainPoints.length;
      const lr = validateAndClamp(learningRate, 0.0001, 0.1, 0.01);
      const ep = validateAndClamp(epochs, 10, 500, 100);

      for (let epoch = 0; epoch < ep; epoch++) {
        let d0 = 0, d1 = 0;
        trainPoints.forEach(p => {
          const h = gIntercept + gSlope * p.x;
          d0 += (h - p.yActual);
          d1 += (h - p.yActual) * p.x;
        });
        gIntercept -= (lr * (d0 / m));
        gSlope -= (lr * (d1 / m));
      }
      fittedSlope = gSlope;
      fittedIntercept = gIntercept;
    }

    let ssRes = 0, ssTot = 0, sumMse = 0, sumMae = 0;
    const actualMean = points.reduce((acc, p) => acc + p.yActual, 0) / points.length;

    const evaluatedPoints = points.map(p => {
      const yPred = fittedSlope * p.x + fittedIntercept;
      const err = p.yActual - yPred;
      ssRes += err ** 2;
      ssTot += (p.yActual - actualMean) ** 2;
      sumMse += err ** 2;
      sumMae += Math.abs(err);

      return { ...p, yPred };
    });

    const mse = sumMse / safeN;
    const rmse = Math.sqrt(mse);
    const mae = sumMae / safeN;
    const r2 = ssTot !== 0 ? 1 - (ssRes / ssTot) : 1;

    const safePredictX = validateAndClamp(predictX, safeXMin, safeXMax, (safeXMin + safeXMax) / 2);
    const predictedY = fittedSlope * safePredictX + fittedIntercept;

    return {
      points: evaluatedPoints,
      fittedSlope,
      fittedIntercept,
      metrics: {
        r2: Math.max(-1, Math.min(1, r2)),
        mse,
        rmse,
        mae
      },
      predictX: safePredictX,
      predictedY
    };
  }, [nSamples, slope, intercept, noise, xMin, xMax, trainSplit, solver, learningRate, epochs, predictX]);

  // Combine backend response if available, else client fallback
  const simulationResult = useMemo(() => {
    if (backendConnected && backendResponse) {
      return {
        points: backendResponse.points.map(p => ({
          x: p.x,
          yTrue: p.y_true,
          yActual: p.y_actual,
          yPred: p.y_pred,
          isTrain: p.is_train
        })),
        fittedSlope: backendResponse.metrics.fitted_slope,
        fittedIntercept: backendResponse.metrics.fitted_intercept,
        metrics: {
          r2: backendResponse.metrics.r2_score,
          mse: backendResponse.metrics.mse,
          rmse: backendResponse.metrics.rmse,
          mae: backendResponse.metrics.mae
        },
        predictX: backendResponse.prediction_result ? backendResponse.prediction_result.x_input : predictX,
        predictedY: backendResponse.prediction_result ? backendResponse.prediction_result.y_predicted : clientResult.predictedY
      };
    }
    return clientResult;
  }, [backendConnected, backendResponse, clientResult, predictX]);

  // SVG Chart Bounds
  const chartBounds = useMemo(() => {
    const pts = simulationResult.points;
    if (pts.length === 0) return { minX: 0, maxX: 10, minY: 0, maxY: 10 };
    let minX = Math.min(...pts.map(p => p.x));
    let maxX = Math.max(...pts.map(p => p.x));
    let minY = Math.min(...pts.map(p => p.yActual), ...pts.map(p => p.yPred));
    let maxY = Math.max(...pts.map(p => p.yActual), ...pts.map(p => p.yPred));
    
    const paddingX = (maxX - minX) * 0.1 || 1;
    const paddingY = (maxY - minY) * 0.1 || 1;
    return {
      minX: minX - paddingX,
      maxX: maxX + paddingX,
      minY: minY - paddingY,
      maxY: maxY + paddingY
    };
  }, [simulationResult]);

  const toSvgX = (x) => {
    const { minX, maxX } = chartBounds;
    return 40 + ((x - minX) / (maxX - minX)) * 520;
  };
  const toSvgY = (y) => {
    const { minY, maxY } = chartBounds;
    return 280 - ((y - minY) / (maxY - minY)) * 240;
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-50 via-white to-red-50 p-5 rounded-2xl border border-red-100 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-[#800000] text-white rounded-xl shadow-xs">
            <Sliders className="h-6 w-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="text-lg font-bold text-slate-900">
                Linear Regression Interactive Simulator
              </h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                backendConnected ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                <Server className="h-3 w-3" />
                {backendConnected ? 'FastAPI Connected (Port 8000)' : 'Client Engine Active'}
              </span>
            </div>
            <p className="text-xs text-slate-600">
              SPIT-style clean layout: select preset scenarios, adjust range sliders, and observe real-time fit metrics.
            </p>
          </div>
        </div>

        <button
          onClick={() => handlePresetChange('clean_linear')}
          className="flex items-center space-x-2 text-xs font-semibold text-[#800000] bg-white border border-red-200 hover:bg-red-50 px-3.5 py-2 rounded-xl transition-all shadow-xs"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Reset Defaults</span>
        </button>
      </div>

      {/* Top Controls Grid: Dropdowns & Presets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Preset Selector Dropdown */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
            <span>Select Preset Scenario</span>
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          </label>
          <select
            value={selectedPresetKey}
            onChange={(e) => handlePresetChange(e.target.value)}
            className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-[#800000] outline-none cursor-pointer"
          >
            {Object.keys(PRESETS).map((key) => (
              <option key={key} value={key}>
                {PRESETS[key].name}
              </option>
            ))}
            <option value="custom">Custom Parameters</option>
          </select>
        </div>

        {/* Solver Method Dropdown */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
          <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
            <span>Regression Solver Algorithm</span>
            <Zap className="h-3.5 w-3.5 text-[#800000]" />
          </label>
          <select
            value={solver}
            onChange={(e) => {
              setSolver(e.target.value);
              setSelectedPresetKey('custom');
            }}
            className="w-full text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-[#800000] outline-none cursor-pointer"
          >
            <option value="ols">Ordinary Least Squares (OLS) - Closed Form</option>
            <option value="gradient_descent">Gradient Descent (Iterative Optimization)</option>
          </select>
        </div>
      </div>

      {/* Main Interactive Controls & Sliders */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <Sliders className="h-4 w-4 text-[#800000]" /> Continuous Dataset & Model Parameters
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-xs">
          
          {/* Slider 1: Sample Size N */}
          <div className="space-y-1.5">
            <div className="flex justify-between font-semibold">
              <span className="text-slate-700">Sample Count (N):</span>
              <span className="text-[#800000] font-bold">{nSamples}</span>
            </div>
            <input
              type="range"
              min="10"
              max="250"
              step="5"
              value={nSamples}
              onChange={(e) => {
                setNSamples(parseInt(e.target.value));
                setSelectedPresetKey('custom');
              }}
              className="w-full accent-[#800000] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>10</span>
              <span>250</span>
            </div>
          </div>

          {/* Slider 2: Slope (m) */}
          <div className="space-y-1.5">
            <div className="flex justify-between font-semibold">
              <span className="text-slate-700">True Slope (m):</span>
              <span className="text-[#800000] font-bold">{slope}</span>
            </div>
            <input
              type="range"
              min="-8.0"
              max="8.0"
              step="0.5"
              value={slope}
              onChange={(e) => {
                setSlope(parseFloat(e.target.value));
                setSelectedPresetKey('custom');
              }}
              className="w-full accent-[#800000] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>-8.0</span>
              <span>+8.0</span>
            </div>
          </div>

          {/* Slider 3: Intercept (c) */}
          <div className="space-y-1.5">
            <div className="flex justify-between font-semibold">
              <span className="text-slate-700">True Intercept (c):</span>
              <span className="text-[#800000] font-bold">{intercept}</span>
            </div>
            <input
              type="range"
              min="-20.0"
              max="30.0"
              step="1.0"
              value={intercept}
              onChange={(e) => {
                setIntercept(parseFloat(e.target.value));
                setSelectedPresetKey('custom');
              }}
              className="w-full accent-[#800000] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>-20</span>
              <span>+30</span>
            </div>
          </div>

          {/* Slider 4: Noise Level */}
          <div className="space-y-1.5">
            <div className="flex justify-between font-semibold">
              <span className="text-slate-700">Noise Level (σ):</span>
              <span className="text-[#800000] font-bold">{noise}</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="15.0"
              step="0.5"
              value={noise}
              onChange={(e) => {
                setNoise(parseFloat(e.target.value));
                setSelectedPresetKey('custom');
              }}
              className="w-full accent-[#800000] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>0 (No Noise)</span>
              <span>15 (High Noise)</span>
            </div>
          </div>

          {/* Slider 5: Train Split Ratio */}
          <div className="space-y-1.5">
            <div className="flex justify-between font-semibold">
              <span className="text-slate-700">Train Split %:</span>
              <span className="text-[#800000] font-bold">{Math.round(trainSplit * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="0.9"
              step="0.05"
              value={trainSplit}
              onChange={(e) => {
                setTrainSplit(parseFloat(e.target.value));
                setSelectedPresetKey('custom');
              }}
              className="w-full accent-[#800000] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>50%</span>
              <span>90%</span>
            </div>
          </div>

          {/* Conditional Gradient Descent Controls */}
          {solver === 'gradient_descent' && (
            <div className="space-y-1.5">
              <div className="flex justify-between font-semibold">
                <span className="text-slate-700">Learning Rate (α):</span>
                <span className="text-[#800000] font-bold">{learningRate}</span>
              </div>
              <input
                type="range"
                min="0.001"
                max="0.05"
                step="0.002"
                value={learningRate}
                onChange={(e) => setLearningRate(parseFloat(e.target.value))}
                className="w-full accent-[#800000] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>0.001</span>
                <span>0.05</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SVG Interactive Scatter & Best-Fit Line Graph */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[#800000]" /> Scatter Plot & Fitted Regression Line
            </h4>
            <p className="text-xs text-slate-500">
              Blue = Training Points | Green = Testing Points | Red Line = Fitted Model
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <span className="flex items-center gap-1 font-semibold text-blue-600">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span> Train
            </span>
            <span className="flex items-center gap-1 font-semibold text-emerald-600">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Test
            </span>
            <span className="flex items-center gap-1 font-semibold text-red-600">
              <span className="w-4 h-0.5 bg-red-600 inline-block"></span> Fit Line
            </span>
          </div>
        </div>

        {/* SVG Canvas */}
        <div className="w-full bg-slate-50 rounded-xl border border-slate-200 overflow-hidden relative">
          <svg viewBox="0 0 600 300" className="w-full h-auto">
            {[60, 120, 180, 240].map((yVal, idx) => (
              <line key={`grid-y-${idx}`} x1="40" y1={yVal} x2="560" y2={yVal} stroke="#e2e8f0" strokeDasharray="3,3" />
            ))}
            {[140, 240, 340, 440].map((xVal, idx) => (
              <line key={`grid-x-${idx}`} x1={xVal} y1="20" x2={xVal} y2="280" stroke="#e2e8f0" strokeDasharray="3,3" />
            ))}

            <line x1="40" y1="280" x2="560" y2="280" stroke="#64748b" strokeWidth="1.5" />
            <line x1="40" y1="20" x2="40" y2="280" stroke="#64748b" strokeWidth="1.5" />

            {simulationResult.points.map((p, idx) => (
              <circle
                key={idx}
                cx={toSvgX(p.x)}
                cy={toSvgY(p.yActual)}
                r="3.5"
                fill={p.isTrain ? '#3b82f6' : '#10b981'}
                opacity="0.8"
              />
            ))}

            {simulationResult.points.length > 1 && (
              <line
                x1={toSvgX(chartBounds.minX)}
                y1={toSvgY(simulationResult.fittedSlope * chartBounds.minX + simulationResult.fittedIntercept)}
                x2={toSvgX(chartBounds.maxX)}
                y2={toSvgY(simulationResult.fittedSlope * chartBounds.maxX + simulationResult.fittedIntercept)}
                stroke="#dc2626"
                strokeWidth="2.5"
              />
            )}

            {simulationResult.predictX !== undefined && (
              <g>
                <line
                  x1={toSvgX(simulationResult.predictX)}
                  y1="280"
                  x2={toSvgX(simulationResult.predictX)}
                  y2={toSvgY(simulationResult.predictedY)}
                  stroke="#9333ea"
                  strokeWidth="1.5"
                  strokeDasharray="4,4"
                />
                <circle
                  cx={toSvgX(simulationResult.predictX)}
                  cy={toSvgY(simulationResult.predictedY)}
                  r="6"
                  fill="#9333ea"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
              </g>
            )}
          </svg>
        </div>

        {/* Single Point Prediction Tool */}
        <div className="bg-purple-50/70 border border-purple-200 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
              <Target className="h-4 w-4 text-purple-600" /> Interactive Single X Predictor
            </span>
            <p className="text-[11px] text-purple-700">
              Enter or drag any X value to calculate predicted Y value on the fitted regression line.
            </p>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <div className="flex items-center space-x-2 text-xs font-semibold text-purple-950">
              <span>X =</span>
              <input
                type="number"
                value={predictX}
                onChange={(e) => setPredictX(validateAndClamp(e.target.value, xMin, xMax, 5))}
                className="w-16 px-2 py-1 bg-white border border-purple-300 rounded text-xs font-bold text-purple-900 focus:outline-none"
              />
            </div>
            <div className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-bold shadow-xs">
              Predicted Y = {simulationResult.predictedY.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">R² Score</span>
          <span className="text-lg font-extrabold text-[#800000]">{simulationResult.metrics.r2.toFixed(3)}</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">MSE</span>
          <span className="text-lg font-extrabold text-slate-800">{simulationResult.metrics.mse.toFixed(2)}</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">RMSE</span>
          <span className="text-lg font-extrabold text-slate-800">{simulationResult.metrics.rmse.toFixed(2)}</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">MAE</span>
          <span className="text-lg font-extrabold text-slate-800">{simulationResult.metrics.mae.toFixed(2)}</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Fitted Slope (m)</span>
          <span className="text-lg font-extrabold text-blue-600">{simulationResult.fittedSlope.toFixed(2)}</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Fitted Intercept (c)</span>
          <span className="text-lg font-extrabold text-blue-600">{simulationResult.fittedIntercept.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
