import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  RotateCcw, 
  RefreshCw, 
  Sliders, 
  Layers, 
  Activity, 
  Zap, 
  HelpCircle, 
  Info, 
  Check, 
  MoveRight,
  TrendingUp,
  BarChart2,
  Sparkles
} from 'lucide-react';

// Pseudo-random number generator (Mulberry32) for reproducible data points
function mulberry32(a) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function PcaSimulation({ experiment }) {
  // Preset configurations
  const [preset, setPreset] = useState('gaussian'); // 'gaussian', 's_curve', 'clusters', 'parkinsons'
  
  // Interactive Sliders
  const [samples, setSamples] = useState(140);
  const [correlation, setCorrelation] = useState(0.85); // -0.95 to 0.95
  const [noise, setNoise] = useState(0.4); // 0.1 to 1.5
  const [rotationDeg, setRotationDeg] = useState(35); // 0 to 180 deg
  const [standardize, setStandardize] = useState(true);
  const [targetComponents, setTargetComponents] = useState(2); // 1 or 2
  const [showProjections, setShowProjections] = useState(true);
  const [activeTab, setActiveTab] = useState('original'); // 'original', 'projected', 'variance'

  // Persistent seed so moving sliders and switching tabs is 100% deterministic
  const [seed, setSeed] = useState(42);

  // Simulation Results State
  const [pcaResult, setPcaResult] = useState(null);
  const [backendConnected, setBackendConnected] = useState(false);

  const canvasRef = useRef(null);
  const projectedCanvasRef = useRef(null);

  // Instant 60FPS Pure Mathematical SVD & PCA computation
  const computePcaState = (customSamples, customCorr, customNoise, customRot, isStandardized, currentSeed) => {
    const n = customSamples;
    const rad = (customRot * Math.PI) / 180;
    const cosR = Math.cos(rad);
    const sinR = Math.sin(rad);

    const random = mulberry32(currentSeed);

    // Box-Muller Gaussian generator with deterministic PRNG
    const randn = () => {
      const u1 = Math.max(1e-7, random());
      const u2 = random();
      return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    };

    // 1. Generate canonical points based on preset
    let rawPoints = [];
    if (preset === 'clusters') {
      const nHalf = Math.floor(n / 2);
      for (let i = 0; i < nHalf; i++) {
        const x = randn() * 0.8 - 2.5;
        const y = randn() * (0.3 + customNoise * 0.4) - 1.5;
        rawPoints.push([x, y]);
      }
      for (let i = 0; i < n - nHalf; i++) {
        const x = randn() * 0.8 + 2.5;
        const y = randn() * (0.3 + customNoise * 0.4) + 1.5;
        rawPoints.push([x, y]);
      }
    } else if (preset === 's_curve') {
      for (let i = 0; i < n; i++) {
        const t = -3 + (6 * i) / n;
        const x = Math.sin(t) * 3 + randn() * (customNoise * 0.5);
        const y = t * 1.4 + randn() * (customNoise * 0.5);
        rawPoints.push([x, y]);
      }
    } else if (preset === 'parkinsons') {
      // Multi-correlated vocal acoustic metrics
      for (let i = 0; i < n; i++) {
        const base = randn() * 2.2;
        const f1 = base + randn() * (customNoise * 0.9);
        const f2 = 0.7 * base + randn() * (customNoise * 0.6);
        rawPoints.push([f1, f2]);
      }
    } else {
      // Correlated Gaussian Cloud
      const corr = Math.max(-0.99, Math.min(0.99, customCorr));
      for (let i = 0; i < n; i++) {
        const z0 = randn();
        const z1 = randn();
        const x = z0 * 2.5;
        const y = (corr * z0 + Math.sqrt(1.0 - corr * corr) * z1) * (1.0 + customNoise);
        rawPoints.push([x, y]);
      }
    }

    // Apply smooth rotation angle
    let X = rawPoints.map(([x, y]) => [
      x * cosR - y * sinR,
      x * sinR + y * cosR
    ]);

    // Mean centering
    let meanX = 0, meanY = 0;
    X.forEach(([x, y]) => { meanX += x; meanY += y; });
    meanX /= n; meanY /= n;

    let centered = X.map(([x, y]) => [x - meanX, y - meanY]);

    // Standardization (Unit variance)
    let stdX = 0, stdY = 0;
    centered.forEach(([x, y]) => {
      stdX += x * x;
      stdY += y * y;
    });
    stdX = Math.sqrt(stdX / (n - 1)) || 1;
    stdY = Math.sqrt(stdY / (n - 1)) || 1;

    let processed = centered;
    if (isStandardized) {
      processed = centered.map(([x, y]) => [x / stdX, y / stdY]);
    }

    // 2x2 Covariance Matrix
    let c00 = 0, c01 = 0, c11 = 0;
    processed.forEach(([x, y]) => {
      c00 += x * x;
      c01 += x * y;
      c11 += y * y;
    });
    c00 /= (n - 1);
    c01 /= (n - 1);
    c11 /= (n - 1);

    // Analytic Eigendecomposition of 2x2 symmetric matrix
    // Covariance matrix C = [[c00, c01], [c01, c11]]
    // Eigenvalues: det(C - λI) = 0 => λ^2 - (trace)λ + det = 0
    const trace = c00 + c11;
    const det = c00 * c11 - c01 * c01;
    const disc = Math.sqrt(Math.max(0, (trace * trace) / 4 - det));
    
    let l1 = trace / 2 + disc;
    let l2 = trace / 2 - disc;
    if (l1 < l2) { const tmp = l1; l1 = l2; l2 = tmp; }

    // Smooth Eigenvector computation using half-angle arctan2
    // Angle of the principal axis is 0.5 * atan2(2*c01, c00 - c11)
    const theta1 = 0.5 * Math.atan2(2 * c01, c00 - c11);
    let v1x = Math.cos(theta1);
    let v1y = Math.sin(theta1);

    // Continuous orientation: ensure right-hand consistency
    if (v1x < 0 || (Math.abs(v1x) < 1e-6 && v1y < 0)) {
      v1x = -v1x;
      v1y = -v1y;
    }

    // v2 is strictly orthogonal (+90 degrees counter-clockwise)
    let v2x = -v1y;
    let v2y = v1x;

    const totalVar = Math.max(1e-6, l1 + l2);
    const var1Pct = Number(((l1 / totalVar) * 100).toFixed(1));
    const var2Pct = Number(((l2 / totalVar) * 100).toFixed(1));

    // Projection onto PC1 and PC2
    const projected = processed.map(([x, y]) => {
      const pc1Coord = x * v1x + y * v1y;
      const pc2Coord = x * v2x + y * v2y;
      return [pc1Coord, pc2Coord];
    });

    return {
      status: 'success',
      sample_count: n,
      mean: [Number(meanX.toFixed(3)), Number(meanY.toFixed(3))],
      std: [Number(stdX.toFixed(3)), Number(stdY.toFixed(3))],
      covariance_matrix: [
        [Number(c00.toFixed(3)), Number(c01.toFixed(3))],
        [Number(c01.toFixed(3)), Number(c11.toFixed(3))]
      ],
      eigenvalues: [Number(l1.toFixed(3)), Number(l2.toFixed(3))],
      eigenvectors: [
        {
          name: 'PC1',
          vector: [Number(v1x.toFixed(3)), Number(v1y.toFixed(3))],
          variance_explained: var1Pct,
          eigenvalue: Number(l1.toFixed(3))
        },
        {
          name: 'PC2',
          vector: [Number(v2x.toFixed(3)), Number(v2y.toFixed(3))],
          variance_explained: var2Pct,
          eigenvalue: Number(l2.toFixed(3))
        }
      ],
      total_variance_explained: targetComponents === 1 ? var1Pct : 100.0,
      original_data: X,
      centered_data: processed,
      projected_data: projected
    };
  };

  // Instant update on slider change (Zero network debounce delay, buttery smooth 60 FPS)
  useEffect(() => {
    const res = computePcaState(samples, correlation, noise, rotationDeg, standardize, seed);
    setPcaResult(res);

    // Optional background sync with backend if running
    fetch('http://localhost:8000/health')
      .then(r => r.ok && setBackendConnected(true))
      .catch(() => setBackendConnected(false));
  }, [samples, correlation, noise, rotationDeg, standardize, targetComponents, preset, seed]);

  // Draw Original Feature Space Canvas
  const drawOriginalCanvas = () => {
    if (!canvasRef.current || !pcaResult) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;
    const scale = Math.min(width, height) / 12;

    // Draw Grid & Axes
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    for (let x = -6; x <= 6; x += 2) {
      if (x === 0) continue;
      ctx.beginPath();
      ctx.moveTo(cx + x * scale, 0);
      ctx.lineTo(cx + x * scale, height);
      ctx.stroke();
    }
    for (let y = -6; y <= 6; y += 2) {
      if (y === 0) continue;
      ctx.beginPath();
      ctx.moveTo(0, cy - y * scale);
      ctx.lineTo(width, cy - y * scale);
      ctx.stroke();
    }

    // Main axes
    ctx.setLineDash([]);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(width, cy);
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, height);
    ctx.stroke();

    // Axis labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText('X₁ (Feature 1)', width - 75, cy - 8);
    ctx.fillText('X₂ (Feature 2)', cx + 8, 15);

    const points = pcaResult.centered_data;
    const pc1 = pcaResult.eigenvectors[0];
    const pc2 = pcaResult.eigenvectors[1];
    const v1 = pc1.vector;
    const v2 = pc2.vector;

    // Optional: Draw projection lines from points to PC1
    if (showProjections && targetComponents >= 1) {
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.25)';
      ctx.lineWidth = 1;
      points.forEach(([px, py]) => {
        const dot = px * v1[0] + py * v1[1];
        const projX = dot * v1[0];
        const projY = dot * v1[1];
        ctx.beginPath();
        ctx.moveTo(cx + px * scale, cy - py * scale);
        ctx.lineTo(cx + projX * scale, cy - projY * scale);
        ctx.stroke();
      });
    }

    // Draw Data Points
    points.forEach(([px, py]) => {
      ctx.beginPath();
      ctx.arc(cx + px * scale, cy - py * scale, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#38bdf8'; // Sky blue
      ctx.shadowColor = 'rgba(56, 189, 248, 0.4)';
      ctx.shadowBlur = 4;
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Draw Principal Component Vectors (Eigenvectors)
    // PC1 Vector (Red / Rose)
    const len1 = Math.max(2.5, Math.sqrt(pc1.eigenvalue || 1.5) * 2.2);
    const endX1 = cx + v1[0] * len1 * scale;
    const endY1 = cy - v1[1] * len1 * scale;

    ctx.strokeStyle = '#f43f5e'; // Rose 500
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(cx - v1[0] * len1 * scale * 0.8, cy + v1[1] * len1 * scale * 0.8);
    ctx.lineTo(endX1, endY1);
    ctx.stroke();

    drawArrowHead(ctx, cx, cy, endX1, endY1, '#f43f5e');

    // PC2 Vector (Emerald / Green)
    if (targetComponents >= 2) {
      const len2 = Math.max(1.8, Math.sqrt(pc2.eigenvalue || 0.8) * 2.0);
      const endX2 = cx + v2[0] * len2 * scale;
      const endY2 = cy - v2[1] * len2 * scale;

      ctx.strokeStyle = '#10b981'; // Emerald
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx - v2[0] * len2 * scale * 0.7, cy + v2[1] * len2 * scale * 0.7);
      ctx.lineTo(endX2, endY2);
      ctx.stroke();

      drawArrowHead(ctx, cx, cy, endX2, endY2, '#10b981');
    }

    // Mean Center
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();
  };

  // Draw Projected Space Canvas (PC1 vs PC2)
  const drawProjectedCanvas = () => {
    if (!projectedCanvasRef.current || !pcaResult) return;
    const canvas = projectedCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;
    const scale = Math.min(width, height) / 10;

    // Grid
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    for (let x = -5; x <= 5; x += 2) {
      if (x === 0) continue;
      ctx.beginPath();
      ctx.moveTo(cx + x * scale, 0);
      ctx.lineTo(cx + x * scale, height);
      ctx.stroke();
    }
    for (let y = -5; y <= 5; y += 2) {
      if (y === 0) continue;
      ctx.beginPath();
      ctx.moveTo(0, cy - y * scale);
      ctx.lineTo(width, cy - y * scale);
      ctx.stroke();
    }

    // Axes in PC space
    ctx.setLineDash([]);
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(width, cy); // PC1 Axis (Horizontal)
    ctx.stroke();

    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, height); // PC2 Axis (Vertical)
    ctx.stroke();

    ctx.fillStyle = '#f43f5e';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.fillText('PC₁ Axis (Max Variance)', width - 145, cy - 8);

    ctx.fillStyle = '#10b981';
    ctx.fillText('PC₂ Axis', cx + 8, 20);

    // Plot Projected Points
    const projPoints = pcaResult.projected_data;
    projPoints.forEach(([p1, p2]) => {
      // If 1D reduction chosen, collapse PC2 to 0
      const actualY = targetComponents === 1 ? 0 : p2;
      ctx.beginPath();
      ctx.arc(cx + p1 * scale, cy - actualY * scale, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = targetComponents === 1 ? '#f43f5e' : '#a855f7'; // Purple in 2D, Rose in 1D
      ctx.shadowColor = targetComponents === 1 ? 'rgba(244, 63, 94, 0.4)' : 'rgba(168, 85, 247, 0.4)';
      ctx.shadowBlur = 4;
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  };

  // Re-draw canvases whenever pcaResult or activeTab changes
  useEffect(() => {
    drawOriginalCanvas();
    drawProjectedCanvas();
  }, [pcaResult, activeTab, showProjections, targetComponents]);

  // Helper function to draw arrowhead
  const drawArrowHead = (ctx, fromX, fromY, toX, toY, color) => {
    const headlen = 10;
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
  };

  const pc1Data = pcaResult?.eigenvectors?.[0];
  const pc2Data = pcaResult?.eigenvectors?.[1];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Simulation Playground Header */}
      <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30">
              Interactive Lab Simulator
            </span>
            <span className={`px-2 py-0.5 rounded-full text-2xs font-semibold flex items-center gap-1 ${
              backendConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-sky-500/20 text-sky-300'
            }`}>
              <Zap className="h-3 w-3" />
              60 FPS Real-time Math Engine
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Principal Component Analysis (PCA) Playground
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm">
            Simulate dimensionality reduction, rotate feature spaces, and observe orthogonal eigenvectors live.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              // Generate fresh random seed only when explicitly requested
              setSeed(Math.floor(Math.random() * 1000000));
            }}
            className="flex items-center space-x-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all active:scale-95 cursor-pointer"
            title="Generate a new randomized dataset distribution"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Randomize Data</span>
          </button>
          <button
            onClick={() => {
              setSamples(140);
              setCorrelation(0.85);
              setNoise(0.4);
              setRotationDeg(35);
              setStandardize(true);
              setTargetComponents(2);
              setPreset('gaussian');
              setSeed(42);
            }}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium border border-slate-700 transition-all cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Controls & Sliders Panel (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="h-4 w-4 text-[#800000]" />
                <span>Simulation Parameters</span>
              </h3>
              <span className="text-2xs text-slate-400 font-mono">Seed #{seed}</span>
            </div>

            {/* Dataset Preset Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Dataset Topology Preset:
              </label>
              <select
                value={preset}
                onChange={(e) => setPreset(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#800000]/20 focus:border-[#800000]"
              >
                <option value="gaussian">🌌 Correlated Gaussian Cloud</option>
                <option value="parkinsons">🧬 Parkinson's Biomarkers (Expt 10)</option>
                <option value="s_curve">🌀 Non-linear S-Curve</option>
                <option value="clusters">🎯 Two Distinct Clusters</option>
              </select>
            </div>

            {/* Slider 1: Sample Size */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-600 font-medium">Sample Count (N)</span>
                <span className="font-bold font-mono text-[#800000]">{samples}</span>
              </div>
              <input
                type="range"
                min="40"
                max="350"
                step="1"
                value={samples}
                onChange={(e) => setSamples(Number(e.target.value))}
                className="w-full accent-[#800000] cursor-pointer"
              />
              <div className="flex justify-between text-3xs text-slate-400">
                <span>40 pts</span>
                <span>350 pts</span>
              </div>
            </div>

            {/* Slider 2: Correlation Strength */}
            {preset === 'gaussian' && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600 font-medium">Correlation (ρ)</span>
                  <span className="font-bold font-mono text-[#800000]">{correlation}</span>
                </div>
                <input
                  type="range"
                  min="-0.95"
                  max="0.95"
                  step="0.01"
                  value={correlation}
                  onChange={(e) => setCorrelation(Number(e.target.value))}
                  className="w-full accent-[#800000] cursor-pointer"
                />
                <div className="flex justify-between text-3xs text-slate-400">
                  <span>-0.95 (Inverse)</span>
                  <span>0</span>
                  <span>+0.95 (Collinear)</span>
                </div>
              </div>
            )}

            {/* Slider 3: Noise / Spread */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-600 font-medium">Noise / Orthogonal Spread (σ)</span>
                <span className="font-bold font-mono text-[#800000]">{noise}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.5"
                step="0.01"
                value={noise}
                onChange={(e) => setNoise(Number(e.target.value))}
                className="w-full accent-[#800000] cursor-pointer"
              />
              <div className="flex justify-between text-3xs text-slate-400">
                <span>0.1 (Tight line)</span>
                <span>1.5 (High dispersion)</span>
              </div>
            </div>

            {/* Slider 4: Rotation Angle */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-600 font-medium">Feature Rotation Angle (θ)</span>
                <span className="font-bold font-mono text-[#800000]">{rotationDeg}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="180"
                step="1"
                value={rotationDeg}
                onChange={(e) => setRotationDeg(Number(e.target.value))}
                className="w-full accent-[#800000] cursor-pointer"
              />
              <div className="flex justify-between text-3xs text-slate-400">
                <span>0°</span>
                <span>90°</span>
                <span>180°</span>
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Standardize Data</span>
                  <span className="text-3xs text-slate-500">Unit variance & zero mean</span>
                </div>
                <input
                  type="checkbox"
                  checked={standardize}
                  onChange={(e) => setStandardize(e.target.checked)}
                  className="h-4 w-4 accent-[#800000] rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Projection Lines</span>
                  <span className="text-3xs text-slate-500">Show error lines dropped to PC₁</span>
                </div>
                <input
                  type="checkbox"
                  checked={showProjections}
                  onChange={(e) => setShowProjections(e.target.checked)}
                  className="h-4 w-4 accent-[#800000] rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Target Dimension</span>
                  <span className="text-3xs text-slate-500">Number of components kept</span>
                </div>
                <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg text-xs">
                  <button
                    onClick={() => setTargetComponents(1)}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                      targetComponents === 1 ? 'bg-white shadow-xs text-[#800000]' : 'text-slate-600'
                    }`}
                  >
                    1D (Line)
                  </button>
                  <button
                    onClick={() => setTargetComponents(2)}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                      targetComponents === 2 ? 'bg-white shadow-xs text-[#800000]' : 'text-slate-600'
                    }`}
                  >
                    2D (Plane)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Mathematical Readout Card */}
          {pcaResult && (
            <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-sm border border-slate-800 text-xs space-y-3 font-mono">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-rose-400">Eigen Decomposition</span>
                <span className="text-3xs text-slate-400">Step 4 in Manual</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-2xs">
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                  <span className="text-slate-400 block mb-0.5">PC₁ Eigenvalue (λ₁)</span>
                  <span className="text-rose-400 font-bold text-sm">{pc1Data?.eigenvalue}</span>
                </div>
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                  <span className="text-slate-400 block mb-0.5">PC₂ Eigenvalue (λ₂)</span>
                  <span className="text-emerald-400 font-bold text-sm">{pc2Data?.eigenvalue}</span>
                </div>
              </div>

              <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80 space-y-1 text-2xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">PC₁ Vector:</span>
                  <span className="text-rose-300">[{pc1Data?.vector?.[0]}, {pc1Data?.vector?.[1]}]</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">PC₂ Vector:</span>
                  <span className="text-emerald-300">[{pc2Data?.vector?.[0]}, {pc2Data?.vector?.[1]}]</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Interactive High-Contrast Visualizations (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-950 rounded-2xl border border-slate-800 p-5 shadow-md flex flex-col justify-between">
            {/* Visualization Navigation Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActiveTab('original')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'original'
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  1. Original Space (Eigenvectors)
                </button>
                <button
                  onClick={() => setActiveTab('projected')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'projected'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  2. Projected PCA Space ({targetComponents}D)
                </button>
                <button
                  onClick={() => setActiveTab('variance')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'variance'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  3. Scree Plot / Variance
                </button>
              </div>

              <div className="flex items-center space-x-3 text-2xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500 inline-block" />
                  <strong className="text-white">PC₁</strong> ({pc1Data?.variance_explained || 0}%)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block" />
                  <strong className="text-white">PC₂</strong> ({pc2Data?.variance_explained || 0}%)
                </span>
              </div>
            </div>

            {/* Canvas Display View 1: Original Space */}
            <div className={activeTab === 'original' ? 'block space-y-3' : 'hidden'}>
              <div className="relative w-full aspect-[16/10] bg-[#030712] rounded-xl border border-slate-900 overflow-hidden flex items-center justify-center">
                <canvas
                  ref={canvasRef}
                  width={560}
                  height={350}
                  className="w-full h-full object-contain"
                />
              </div>
              <p className="text-2xs text-slate-400 text-center">
                Red Vector represents <strong>PC₁</strong> (direction of maximum variance). Green Vector is <strong>PC₂</strong> (orthogonal). 
                Light dashed lines show projections of each data point onto the principal component line.
              </p>
            </div>

            {/* Canvas Display View 2: Projected PCA Space */}
            <div className={activeTab === 'projected' ? 'block space-y-3' : 'hidden'}>
              <div className="relative w-full aspect-[16/10] bg-[#030712] rounded-xl border border-slate-900 overflow-hidden flex items-center justify-center">
                <canvas
                  ref={projectedCanvasRef}
                  width={560}
                  height={350}
                  className="w-full h-full object-contain"
                />
              </div>
              <p className="text-2xs text-slate-400 text-center">
                Data rotated into the orthogonal principal coordinate system: X-axis is now <strong>PC₁</strong> and Y-axis is <strong>PC₂</strong>.
                {targetComponents === 1 && ' In 1D mode, all data points are collapsed onto the single PC₁ line, achieving 50% feature reduction!'}
              </p>
            </div>

            {/* View 3: Scree Plot & Explained Variance Card */}
            <div className={activeTab === 'variance' ? 'block' : 'hidden'}>
              <div className="bg-[#030712] rounded-xl border border-slate-900 p-6 space-y-6 min-h-[350px] flex flex-col justify-center">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-rose-400" />
                  <span>Explained Variance Ratio (Scree Plot Analysis)</span>
                </h4>

                <div className="space-y-4">
                  {/* PC1 Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-slate-300">
                      <span className="font-semibold text-rose-400">Principal Component 1 (PC₁)</span>
                      <span className="font-mono font-bold">{pc1Data?.variance_explained || 0}% of variance</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-rose-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${pc1Data?.variance_explained || 0}%` }}
                      />
                    </div>
                  </div>

                  {/* PC2 Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-slate-300">
                      <span className="font-semibold text-emerald-400">Principal Component 2 (PC₂)</span>
                      <span className="font-mono font-bold">{pc2Data?.variance_explained || 0}% of variance</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${pc2Data?.variance_explained || 0}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Cumulative Variance Retained:</span>
                    <span className="font-bold text-white font-mono text-sm">
                      {pcaResult?.total_variance_explained || 100}%
                    </span>
                  </div>
                  <p className="text-2xs text-slate-400 leading-relaxed">
                    According to the <strong>KJSIT Lab Manual</strong> (Step 5), components with negligible eigenvalues can be discarded without sacrificing significant information, effectively compressing high-dimensional records (like the 755 Parkinson's features) into compact representation.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Educational Concept Highlights Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
              <span className="text-3xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Property 1
              </span>
              <p className="text-xs font-bold text-slate-900">Linear Combination</p>
              <p className="text-3xs text-slate-500 mt-1">
                Each PC is a weighted linear sum of the original attributes: PC₁ = w₁X₁ + w₂X₂.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
              <span className="text-3xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Property 2
              </span>
              <p className="text-xs font-bold text-slate-900">Orthogonal (90°)</p>
              <p className="text-3xs text-slate-500 mt-1">
                Correlation between any pair of Principal Components is mathematically zero.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
              <span className="text-3xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Property 3
              </span>
              <p className="text-xs font-bold text-slate-900">Ordered Variance</p>
              <p className="text-3xs text-slate-500 mt-1">
                PC₁ retains the maximum possible variance; PC₂ captures the next largest, and so on.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
