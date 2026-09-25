import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  RefreshCw,
  RotateCcw,
  Sliders,
  Zap,
  Play,
  SkipForward,
  FastForward,
  BarChart2,
  Target,
  Crosshair,
  Layers,
  Eye
} from 'lucide-react';

// ─── Deterministic PRNG (Mulberry32) ─────────────────────────
function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Cluster colour palette (10 saturated hues) ─────────────
const CLUSTER_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#22c55e', // green
  '#f59e0b', // amber
  '#a855f7', // purple
  '#06b6d4', // cyan
  '#f97316', // orange
  '#ec4899', // pink
  '#14b8a6', // teal
  '#8b5cf6'  // violet
];

const CENTROID_GLOW = [
  'rgba(59,130,246,0.45)',
  'rgba(239,68,68,0.45)',
  'rgba(34,197,94,0.45)',
  'rgba(245,158,11,0.45)',
  'rgba(168,85,247,0.45)',
  'rgba(6,182,212,0.45)',
  'rgba(249,115,22,0.45)',
  'rgba(236,72,153,0.45)',
  'rgba(20,184,166,0.45)',
  'rgba(139,92,246,0.45)'
];

// ─── Dataset generators ──────────────────────────────────────
function generateBlobs(n, k, noise, rng) {
  const randn = () => {
    const u1 = Math.max(1e-7, rng());
    const u2 = rng();
    return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  };
  const angleStep = (2 * Math.PI) / k;
  const radius = 3.5 + k * 0.4;
  const points = [];
  const perCluster = Math.floor(n / k);
  for (let c = 0; c < k; c++) {
    const cx = radius * Math.cos(angleStep * c + 0.3);
    const cy = radius * Math.sin(angleStep * c + 0.3);
    const count = c < k - 1 ? perCluster : n - points.length;
    for (let i = 0; i < count; i++) {
      points.push([cx + randn() * (0.5 + noise * 0.8), cy + randn() * (0.5 + noise * 0.8)]);
    }
  }
  return points;
}

function generateMoons(n, noise, rng) {
  const randn = () => {
    const u1 = Math.max(1e-7, rng());
    const u2 = rng();
    return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  };
  const points = [];
  const half = Math.floor(n / 2);
  for (let i = 0; i < half; i++) {
    const angle = (Math.PI * i) / half;
    points.push([
      3 * Math.cos(angle) + randn() * noise * 0.5,
      3 * Math.sin(angle) + randn() * noise * 0.5
    ]);
  }
  for (let i = 0; i < n - half; i++) {
    const angle = (Math.PI * i) / (n - half);
    points.push([
      3 * Math.cos(angle) + 1.5 + randn() * noise * 0.5,
      -3 * Math.sin(angle) + 1.0 + randn() * noise * 0.5
    ]);
  }
  return points;
}

function generateCircles(n, noise, rng) {
  const randn = () => {
    const u1 = Math.max(1e-7, rng());
    const u2 = rng();
    return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  };
  const points = [];
  const half = Math.floor(n / 2);
  for (let i = 0; i < half; i++) {
    const angle = (2 * Math.PI * i) / half;
    points.push([
      4 * Math.cos(angle) + randn() * noise * 0.3,
      4 * Math.sin(angle) + randn() * noise * 0.3
    ]);
  }
  for (let i = 0; i < n - half; i++) {
    const angle = (2 * Math.PI * i) / (n - half);
    points.push([
      1.5 * Math.cos(angle) + randn() * noise * 0.3,
      1.5 * Math.sin(angle) + randn() * noise * 0.3
    ]);
  }
  return points;
}

function generateCountries(n, noise, rng) {
  const randn = () => {
    const u1 = Math.max(1e-7, rng());
    const u2 = rng();
    return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  };
  const points = [];
  // 3 natural clusters: underdeveloped, developing, developed
  const groups = [
    { cx: -4, cy: -3, sx: 1.2, sy: 1.0, frac: 0.35 },
    { cx: 0, cy: 1, sx: 1.6, sy: 1.4, frac: 0.40 },
    { cx: 5, cy: 4, sx: 0.9, sy: 0.8, frac: 0.25 }
  ];
  let remaining = n;
  groups.forEach((g, idx) => {
    const cnt = idx < groups.length - 1 ? Math.round(n * g.frac) : remaining;
    remaining -= cnt;
    for (let i = 0; i < cnt; i++) {
      points.push([
        g.cx + randn() * g.sx * (0.5 + noise * 0.6),
        g.cy + randn() * g.sy * (0.5 + noise * 0.6)
      ]);
    }
  });
  return points;
}

// ─── K-Means engine (single iteration) ──────────────────────
function kmeansAssign(points, centroids) {
  const assignments = new Array(points.length);
  for (let i = 0; i < points.length; i++) {
    let minDist = Infinity;
    let closest = 0;
    for (let c = 0; c < centroids.length; c++) {
      const dx = points[i][0] - centroids[c][0];
      const dy = points[i][1] - centroids[c][1];
      const d = dx * dx + dy * dy;
      if (d < minDist) {
        minDist = d;
        closest = c;
      }
    }
    assignments[i] = closest;
  }
  return assignments;
}

function kmeansUpdate(points, assignments, k) {
  const sums = Array.from({ length: k }, () => [0, 0]);
  const counts = new Array(k).fill(0);
  for (let i = 0; i < points.length; i++) {
    const c = assignments[i];
    sums[c][0] += points[i][0];
    sums[c][1] += points[i][1];
    counts[c]++;
  }
  return sums.map((s, i) =>
    counts[i] > 0 ? [s[0] / counts[i], s[1] / counts[i]] : [s[0], s[1]]
  );
}

function computeWCSS(points, assignments, centroids) {
  let wcss = 0;
  for (let i = 0; i < points.length; i++) {
    const c = assignments[i];
    const dx = points[i][0] - centroids[c][0];
    const dy = points[i][1] - centroids[c][1];
    wcss += dx * dx + dy * dy;
  }
  return wcss;
}

function computeSilhouette(points, assignments, k) {
  if (k < 2 || points.length < k) return 0;
  const n = points.length;
  let totalSil = 0;
  for (let i = 0; i < n; i++) {
    const ci = assignments[i];
    // a(i) = mean intra-cluster distance
    let aSum = 0, aCount = 0;
    for (let j = 0; j < n; j++) {
      if (j === i || assignments[j] !== ci) continue;
      const dx = points[i][0] - points[j][0];
      const dy = points[i][1] - points[j][1];
      aSum += Math.sqrt(dx * dx + dy * dy);
      aCount++;
    }
    const a = aCount > 0 ? aSum / aCount : 0;

    // b(i) = min mean inter-cluster distance
    let b = Infinity;
    for (let c = 0; c < k; c++) {
      if (c === ci) continue;
      let bSum = 0, bCount = 0;
      for (let j = 0; j < n; j++) {
        if (assignments[j] !== c) continue;
        const dx = points[i][0] - points[j][0];
        const dy = points[i][1] - points[j][1];
        bSum += Math.sqrt(dx * dx + dy * dy);
        bCount++;
      }
      if (bCount > 0) b = Math.min(b, bSum / bCount);
    }
    if (b === Infinity) b = 0;

    const denom = Math.max(a, b);
    totalSil += denom > 0 ? (b - a) / denom : 0;
  }
  return totalSil / n;
}

// Run full K-Means to convergence (max 100 iters)
function kmeansRunFull(points, initialCentroids, k) {
  let centroids = initialCentroids.map(c => [...c]);
  let assignments = kmeansAssign(points, centroids);
  for (let iter = 0; iter < 100; iter++) {
    const newCentroids = kmeansUpdate(points, assignments, k);
    const newAssignments = kmeansAssign(points, newCentroids);
    let changed = false;
    for (let i = 0; i < assignments.length; i++) {
      if (assignments[i] !== newAssignments[i]) { changed = true; break; }
    }
    centroids = newCentroids;
    assignments = newAssignments;
    if (!changed) break;
  }
  return { centroids, assignments };
}

// ─── Initialise centroids using K-Means++ ────────────────────
function kmeansppInit(points, k, rng) {
  const centroids = [];
  const firstIdx = Math.floor(rng() * points.length);
  centroids.push([...points[firstIdx]]);

  for (let c = 1; c < k; c++) {
    const dists = points.map(p => {
      let minD = Infinity;
      centroids.forEach(ct => {
        const dx = p[0] - ct[0];
        const dy = p[1] - ct[1];
        minD = Math.min(minD, dx * dx + dy * dy);
      });
      return minD;
    });
    const totalDist = dists.reduce((a, b) => a + b, 0);
    let r = rng() * totalDist;
    let idx = 0;
    for (let i = 0; i < dists.length; i++) {
      r -= dists[i];
      if (r <= 0) { idx = i; break; }
    }
    centroids.push([...points[idx]]);
  }
  return centroids;
}

// ═══════════════════════════════════════════════════════════════
export default function KMeansSimulation({ experiment }) {
  // ─── State ─────────────────────────────────────────────────
  const [preset, setPreset] = useState('blobs');
  const [k, setK] = useState(3);
  const [samples, setSamples] = useState(200);
  const [noise, setNoise] = useState(0.5);
  const [speed, setSpeed] = useState(600); // ms per step in auto-play
  const [showConnections, setShowConnections] = useState(false);
  const [showVoronoi, setShowVoronoi] = useState(true);
  const [activeTab, setActiveTab] = useState('clusters');
  const [seed, setSeed] = useState(42);

  // K-Means iteration state
  const [dataPoints, setDataPoints] = useState([]);
  const [centroids, setCentroids] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [iteration, setIteration] = useState(0);
  const [converged, setConverged] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [wcss, setWcss] = useState(0);
  const [silhouette, setSilhouetteScore] = useState(0);

  // Elbow curve data
  const [elbowData, setElbowData] = useState([]);

  // Animation: smoothly lerp centroids
  const [displayCentroids, setDisplayCentroids] = useState([]);
  const animFrameRef = useRef(null);
  const prevCentroidsRef = useRef([]);
  const targetCentroidsRef = useRef([]);
  const animStartRef = useRef(0);

  const clusterCanvasRef = useRef(null);
  const elbowCanvasRef = useRef(null);
  const playTimerRef = useRef(null);

  // ─── Generate data & initial centroids ─────────────────────
  const generateData = useCallback(
    (currentSeed, currentK, currentSamples, currentNoise, currentPreset) => {
      const rng = mulberry32(currentSeed);
      let pts;
      switch (currentPreset) {
        case 'moons':
          pts = generateMoons(currentSamples, currentNoise, rng);
          break;
        case 'circles':
          pts = generateCircles(currentSamples, currentNoise, rng);
          break;
        case 'countries':
          pts = generateCountries(currentSamples, currentNoise, rng);
          break;
        default:
          pts = generateBlobs(currentSamples, currentK, currentNoise, rng);
      }
      // Initialize centroids using K-Means++ with a second deterministic RNG
      const rng2 = mulberry32(currentSeed + 7919);
      const initC = kmeansppInit(pts, currentK, rng2);
      const initA = kmeansAssign(pts, initC);
      return { pts, initC, initA };
    },
    []
  );

  // Full reset when params change
  useEffect(() => {
    setIsPlaying(false);
    if (playTimerRef.current) clearInterval(playTimerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    const { pts, initC, initA } = generateData(seed, k, samples, noise, preset);
    setDataPoints(pts);
    setCentroids(initC);
    setDisplayCentroids(initC.map(c => [...c]));
    prevCentroidsRef.current = initC.map(c => [...c]);
    targetCentroidsRef.current = initC.map(c => [...c]);
    setAssignments(initA);
    setIteration(0);
    setConverged(false);
    const w = computeWCSS(pts, initA, initC);
    setWcss(w);
    setSilhouetteScore(computeSilhouette(pts, initA, k));

    // Compute elbow curve
    computeElbow(pts, seed);
  }, [seed, k, samples, noise, preset]);

  // Compute elbow data for K=1..10
  const computeElbow = (pts, currentSeed) => {
    const data = [];
    for (let ek = 1; ek <= 10; ek++) {
      const rng = mulberry32(currentSeed + 7919 + ek * 31);
      const initC = kmeansppInit(pts, ek, rng);
      const { centroids: finalC, assignments: finalA } = kmeansRunFull(pts, initC, ek);
      data.push({ k: ek, wcss: computeWCSS(pts, finalA, finalC) });
    }
    setElbowData(data);
  };

  // ─── Smooth centroid animation ─────────────────────────────
  const ANIM_DURATION = 400; // ms

  const animateCentroids = useCallback(
    (from, to) => {
      prevCentroidsRef.current = from.map(c => [...c]);
      targetCentroidsRef.current = to.map(c => [...c]);
      animStartRef.current = performance.now();

      const tick = (now) => {
        const elapsed = now - animStartRef.current;
        const t = Math.min(1, elapsed / ANIM_DURATION);
        // ease-out cubic
        const ease = 1 - Math.pow(1 - t, 3);
        const lerped = to.map((c, i) => {
          const prev = prevCentroidsRef.current[i] || c;
          return [prev[0] + (c[0] - prev[0]) * ease, prev[1] + (c[1] - prev[1]) * ease];
        });
        setDisplayCentroids(lerped);
        if (t < 1) {
          animFrameRef.current = requestAnimationFrame(tick);
        }
      };
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = requestAnimationFrame(tick);
    },
    []
  );

  // ─── Step: one K-Means iteration ───────────────────────────
  const stepOnce = useCallback(() => {
    if (converged) return;
    const newCentroids = kmeansUpdate(dataPoints, assignments, k);
    const newAssignments = kmeansAssign(dataPoints, newCentroids);

    let changed = false;
    for (let i = 0; i < assignments.length; i++) {
      if (assignments[i] !== newAssignments[i]) { changed = true; break; }
    }

    // Animate centroids from old to new
    animateCentroids(centroids, newCentroids);
    setCentroids(newCentroids);
    setAssignments(newAssignments);
    setIteration(prev => prev + 1);
    const w = computeWCSS(dataPoints, newAssignments, newCentroids);
    setWcss(w);
    setSilhouetteScore(computeSilhouette(dataPoints, newAssignments, k));
    if (!changed) setConverged(true);
    return !changed;
  }, [dataPoints, centroids, assignments, k, converged, animateCentroids]);

  // ─── Run to convergence ────────────────────────────────────
  const runToEnd = useCallback(() => {
    if (converged || dataPoints.length === 0) return;
    let curCentroids = centroids.map(c => [...c]);
    let curAssign = [...assignments];
    let iter = iteration;
    for (let i = 0; i < 100; i++) {
      const newC = kmeansUpdate(dataPoints, curAssign, k);
      const newA = kmeansAssign(dataPoints, newC);
      iter++;
      let changed = false;
      for (let j = 0; j < curAssign.length; j++) {
        if (curAssign[j] !== newA[j]) { changed = true; break; }
      }
      curCentroids = newC;
      curAssign = newA;
      if (!changed) break;
    }
    animateCentroids(centroids, curCentroids);
    setCentroids(curCentroids);
    setAssignments(curAssign);
    setIteration(iter);
    setConverged(true);
    const w = computeWCSS(dataPoints, curAssign, curCentroids);
    setWcss(w);
    setSilhouetteScore(computeSilhouette(dataPoints, curAssign, k));
  }, [dataPoints, centroids, assignments, k, iteration, converged, animateCentroids]);

  // ─── Auto-play ─────────────────────────────────────────────
  useEffect(() => {
    if (isPlaying && !converged) {
      playTimerRef.current = setInterval(() => {
        // We need the latest state, so we use a trick
        setIsPlaying(prev => {
          // stepOnce will be called via the ref update below
          return prev;
        });
      }, speed);
      return () => clearInterval(playTimerRef.current);
    } else {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    }
  }, [isPlaying, converged, speed]);

  // Ref-based step for auto-play interval
  const stepRef = useRef(stepOnce);
  stepRef.current = stepOnce;

  useEffect(() => {
    if (isPlaying && !converged) {
      playTimerRef.current = setInterval(() => {
        const done = stepRef.current();
        if (done) {
          setIsPlaying(false);
        }
      }, speed);
      return () => clearInterval(playTimerRef.current);
    }
  }, [isPlaying, converged, speed]);

  // Stop auto-play on convergence
  useEffect(() => {
    if (converged) setIsPlaying(false);
  }, [converged]);

  // ─── Draw cluster canvas ───────────────────────────────────
  const drawClusterCanvas = useCallback(() => {
    const canvas = clusterCanvasRef.current;
    if (!canvas || dataPoints.length === 0) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Compute bounding box for auto-scale
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    dataPoints.forEach(([x, y]) => {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    });
    const pad = 1.5;
    minX -= pad; maxX += pad; minY -= pad; maxY += pad;
    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;
    const scale = Math.min((W - 60) / rangeX, (H - 60) / rangeY);
    const cx = W / 2;
    const cy = H / 2;
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;
    const toCanvasX = x => cx + (x - midX) * scale;
    const toCanvasY = y => cy - (y - midY) * scale;

    // Grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 5]);
    const gridStep = rangeX > 15 ? 5 : rangeX > 8 ? 2 : 1;
    for (let gx = Math.ceil(minX / gridStep) * gridStep; gx <= maxX; gx += gridStep) {
      const sx = toCanvasX(gx);
      ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx, H); ctx.stroke();
    }
    for (let gy = Math.ceil(minY / gridStep) * gridStep; gy <= maxY; gy += gridStep) {
      const sy = toCanvasY(gy);
      ctx.beginPath(); ctx.moveTo(0, sy); ctx.lineTo(W, sy); ctx.stroke();
    }
    ctx.setLineDash([]);

    // Axes
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    const ox = toCanvasX(0);
    const oy = toCanvasY(0);
    if (ox > 0 && ox < W) { ctx.beginPath(); ctx.moveTo(ox, 0); ctx.lineTo(ox, H); ctx.stroke(); }
    if (oy > 0 && oy < H) { ctx.beginPath(); ctx.moveTo(0, oy); ctx.lineTo(W, oy); ctx.stroke(); }

    // Voronoi-style background fill (approximate by painting each pixel would be too expensive,
    // so we draw subtle radial gradients behind each centroid)
    if (showVoronoi && displayCentroids.length > 0) {
      displayCentroids.forEach((ct, ci) => {
        const sx = toCanvasX(ct[0]);
        const sy = toCanvasY(ct[1]);
        const color = CLUSTER_COLORS[ci % CLUSTER_COLORS.length];
        const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, scale * 3);
        grad.addColorStop(0, color.replace(')', ', 0.08)').replace('rgb', 'rgba'));
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
      });
    }

    // Connection lines from points to centroids
    if (showConnections && displayCentroids.length > 0) {
      for (let i = 0; i < dataPoints.length; i++) {
        const ci = assignments[i];
        if (ci === undefined) continue;
        const ct = displayCentroids[ci];
        if (!ct) continue;
        ctx.strokeStyle = CLUSTER_COLORS[ci % CLUSTER_COLORS.length].replace(')', ', 0.15)').replace('#', '');
        // Convert hex to rgba
        const hex = CLUSTER_COLORS[ci % CLUSTER_COLORS.length];
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        ctx.strokeStyle = `rgba(${r},${g},${b},0.12)`;
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(toCanvasX(dataPoints[i][0]), toCanvasY(dataPoints[i][1]));
        ctx.lineTo(toCanvasX(ct[0]), toCanvasY(ct[1]));
        ctx.stroke();
      }
    }

    // Data points
    for (let i = 0; i < dataPoints.length; i++) {
      const ci = assignments[i] !== undefined ? assignments[i] : 0;
      const color = CLUSTER_COLORS[ci % CLUSTER_COLORS.length];
      const px = toCanvasX(dataPoints[i][0]);
      const py = toCanvasY(dataPoints[i][1]);
      ctx.beginPath();
      ctx.arc(px, py, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.shadowColor = CENTROID_GLOW[ci % CENTROID_GLOW.length];
      ctx.shadowBlur = 3;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Centroids with animated ring pulse
    displayCentroids.forEach((ct, ci) => {
      const sx = toCanvasX(ct[0]);
      const sy = toCanvasY(ct[1]);
      const color = CLUSTER_COLORS[ci % CLUSTER_COLORS.length];

      // Outer glow ring
      ctx.beginPath();
      ctx.arc(sx, sy, 12, 0, Math.PI * 2);
      ctx.fillStyle = CENTROID_GLOW[ci % CENTROID_GLOW.length];
      ctx.fill();

      // Inner solid circle
      ctx.beginPath();
      ctx.arc(sx, sy, 7, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.fill();
      ctx.stroke();

      // Cross-hair × marker
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      const cs = 4.5;
      ctx.beginPath();
      ctx.moveTo(sx - cs, sy - cs); ctx.lineTo(sx + cs, sy + cs);
      ctx.moveTo(sx + cs, sy - cs); ctx.lineTo(sx - cs, sy + cs);
      ctx.stroke();
    });

    // Axis labels
    ctx.fillStyle = '#64748b';
    ctx.font = '10px Inter, system-ui, sans-serif';
    ctx.fillText('Feature 1 (X₁)', W - 85, H - 8);
    ctx.save();
    ctx.translate(14, 75);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Feature 2 (X₂)', 0, 0);
    ctx.restore();
  }, [dataPoints, assignments, displayCentroids, showConnections, showVoronoi]);

  // ─── Draw elbow canvas ─────────────────────────────────────
  const drawElbowCanvas = useCallback(() => {
    const canvas = elbowCanvasRef.current;
    if (!canvas || elbowData.length === 0) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const padL = 60, padR = 30, padT = 30, padB = 45;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;

    const maxWCSS = Math.max(...elbowData.map(d => d.wcss)) * 1.05;
    const toX = kv => padL + ((kv - 1) / 9) * plotW;
    const toY = w => padT + (1 - w / maxWCSS) * plotH;

    // Background grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 5]);
    for (let i = 1; i <= 10; i++) {
      const x = toX(i);
      ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, padT + plotH); ctx.stroke();
    }
    for (let i = 0; i <= 5; i++) {
      const y = padT + (plotH * i) / 5;
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + plotW, y); ctx.stroke();
    }
    ctx.setLineDash([]);

    // Axes
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(padL, padT);
    ctx.lineTo(padL, padT + plotH);
    ctx.lineTo(padL + plotW, padT + plotH);
    ctx.stroke();

    // Axis labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Number of Clusters (K)', padL + plotW / 2, H - 6);
    ctx.save();
    ctx.translate(16, padT + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('WCSS (Inertia)', 0, 0);
    ctx.restore();
    ctx.textAlign = 'start';

    // Tick labels
    ctx.fillStyle = '#64748b';
    ctx.font = '10px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    for (let i = 1; i <= 10; i++) {
      ctx.fillText(String(i), toX(i), padT + plotH + 18);
    }
    ctx.textAlign = 'end';
    for (let i = 0; i <= 5; i++) {
      const val = (maxWCSS * (5 - i)) / 5;
      ctx.fillText(val.toFixed(0), padL - 8, padT + (plotH * i) / 5 + 4);
    }

    // Area fill under the curve
    ctx.beginPath();
    ctx.moveTo(toX(elbowData[0].k), padT + plotH);
    elbowData.forEach(d => ctx.lineTo(toX(d.k), toY(d.wcss)));
    ctx.lineTo(toX(elbowData[elbowData.length - 1].k), padT + plotH);
    ctx.closePath();
    const areaGrad = ctx.createLinearGradient(0, padT, 0, padT + plotH);
    areaGrad.addColorStop(0, 'rgba(244, 63, 94, 0.2)');
    areaGrad.addColorStop(1, 'rgba(244, 63, 94, 0.02)');
    ctx.fillStyle = areaGrad;
    ctx.fill();

    // Line
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    elbowData.forEach((d, i) => {
      const x = toX(d.k);
      const y = toY(d.wcss);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Data points
    elbowData.forEach(d => {
      const x = toX(d.k);
      const y = toY(d.wcss);
      const isSelected = d.k === k;

      ctx.beginPath();
      ctx.arc(x, y, isSelected ? 7 : 4.5, 0, Math.PI * 2);
      ctx.fillStyle = isSelected ? '#f43f5e' : '#fb7185';
      ctx.shadowColor = isSelected ? 'rgba(244, 63, 94, 0.6)' : 'rgba(244, 63, 94, 0.3)';
      ctx.shadowBlur = isSelected ? 10 : 4;
      ctx.fill();
      ctx.shadowBlur = 0;

      if (isSelected) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        // Label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`K=${d.k}`, x, y - 14);
        ctx.font = '9px Inter, system-ui, sans-serif';
        ctx.fillStyle = '#fda4af';
        ctx.fillText(`WCSS: ${d.wcss.toFixed(1)}`, x, y - 3 - 14);
        ctx.textAlign = 'start';
      }
    });

    // Elbow annotation: dashed vertical line at current K
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#fda4af';
    ctx.lineWidth = 1;
    const kx = toX(k);
    ctx.beginPath();
    ctx.moveTo(kx, padT);
    ctx.lineTo(kx, padT + plotH);
    ctx.stroke();
    ctx.setLineDash([]);
  }, [elbowData, k]);

  // ─── Redraw on state change ────────────────────────────────
  useEffect(() => {
    drawClusterCanvas();
    drawElbowCanvas();
  }, [drawClusterCanvas, drawElbowCanvas]);

  // Redraw cluster canvas during centroid animation
  useEffect(() => {
    drawClusterCanvas();
  }, [displayCentroids, drawClusterCanvas]);

  // ─── Reset handler ─────────────────────────────────────────
  const handleReset = () => {
    setIsPlaying(false);
    if (playTimerRef.current) clearInterval(playTimerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    const { pts, initC, initA } = generateData(seed, k, samples, noise, preset);
    setDataPoints(pts);
    setCentroids(initC);
    setDisplayCentroids(initC.map(c => [...c]));
    prevCentroidsRef.current = initC.map(c => [...c]);
    targetCentroidsRef.current = initC.map(c => [...c]);
    setAssignments(initA);
    setIteration(0);
    setConverged(false);
    const w = computeWCSS(pts, initA, initC);
    setWcss(w);
    setSilhouetteScore(computeSilhouette(pts, initA, k));
  };

  // ─── JSX ───────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ═══ Header Bar ═══ */}
      <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30">
              Interactive Lab Simulator
            </span>
            <span className="px-2 py-0.5 rounded-full text-2xs font-semibold flex items-center gap-1 bg-sky-500/20 text-sky-300">
              <Zap className="h-3 w-3" />
              60 FPS Client-side K-Means Engine
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Target className="h-6 w-6 text-blue-400" />
            K-Means Clustering Playground
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm">
            Visualize centroid convergence step-by-step, explore the Elbow Method, and observe cluster formation in real-time.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setSeed(Math.floor(Math.random() * 1000000))}
            className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all active:scale-95 cursor-pointer"
            title="Generate new random data"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Randomize Data</span>
          </button>
          <button
            onClick={() => {
              setSamples(200); setK(3); setNoise(0.5);
              setPreset('blobs'); setSeed(42); setSpeed(600);
              setShowConnections(false); setShowVoronoi(true);
            }}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium border border-slate-700 transition-all cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset All</span>
          </button>
        </div>
      </div>

      {/* ═══ Main Grid ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ─── LEFT: Controls (4 cols) ─── */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="h-4 w-4 text-[#800000]" />
                Simulation Parameters
              </h3>
              <span className="text-2xs text-slate-400 font-mono">Seed #{seed}</span>
            </div>

            {/* Dataset Preset */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Dataset Shape:</label>
              <select
                value={preset}
                onChange={e => setPreset(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#800000]/20 focus:border-[#800000]"
              >
                <option value="blobs">🎯 Gaussian Blobs (K-separated)</option>
                <option value="moons">🌙 Two Moons (Non-convex)</option>
                <option value="circles">⭕ Concentric Circles</option>
                <option value="countries">🌍 UN Country Dev. Indicators</option>
              </select>
            </div>

            {/* K slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-600 font-medium">Number of Clusters (K)</span>
                <span className="font-bold font-mono text-[#800000]">{k}</span>
              </div>
              <input
                type="range" min="2" max="10" step="1" value={k}
                onChange={e => setK(Number(e.target.value))}
                className="w-full accent-[#800000] cursor-pointer"
              />
              <div className="flex justify-between text-3xs text-slate-400">
                <span>2</span><span>6</span><span>10</span>
              </div>
            </div>

            {/* Sample count slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-600 font-medium">Sample Count (N)</span>
                <span className="font-bold font-mono text-[#800000]">{samples}</span>
              </div>
              <input
                type="range" min="50" max="500" step="1" value={samples}
                onChange={e => setSamples(Number(e.target.value))}
                className="w-full accent-[#800000] cursor-pointer"
              />
              <div className="flex justify-between text-3xs text-slate-400">
                <span>50 pts</span><span>500 pts</span>
              </div>
            </div>

            {/* Noise slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-600 font-medium">Noise / Spread (σ)</span>
                <span className="font-bold font-mono text-[#800000]">{noise}</span>
              </div>
              <input
                type="range" min="0.1" max="2.0" step="0.01" value={noise}
                onChange={e => setNoise(Number(e.target.value))}
                className="w-full accent-[#800000] cursor-pointer"
              />
              <div className="flex justify-between text-3xs text-slate-400">
                <span>0.1 (Tight)</span><span>2.0 (Spread)</span>
              </div>
            </div>

            {/* Animation speed slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-600 font-medium">Step Speed (Auto-play)</span>
                <span className="font-bold font-mono text-[#800000]">{speed}ms</span>
              </div>
              <input
                type="range" min="100" max="2000" step="50" value={speed}
                onChange={e => setSpeed(Number(e.target.value))}
                className="w-full accent-[#800000] cursor-pointer"
              />
              <div className="flex justify-between text-3xs text-slate-400">
                <span>100ms (Fast)</span><span>2000ms (Slow)</span>
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Connection Lines</span>
                  <span className="text-3xs text-slate-500">Lines from points to centroids</span>
                </div>
                <input
                  type="checkbox" checked={showConnections}
                  onChange={e => setShowConnections(e.target.checked)}
                  className="h-4 w-4 accent-[#800000] rounded cursor-pointer"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Cluster Glow</span>
                  <span className="text-3xs text-slate-500">Radial gradient behind centroids</span>
                </div>
                <input
                  type="checkbox" checked={showVoronoi}
                  onChange={e => setShowVoronoi(e.target.checked)}
                  className="h-4 w-4 accent-[#800000] rounded cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Iteration Controls Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <Play className="h-4 w-4 text-[#800000]" />
              Iteration Controls
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={stepOnce}
                disabled={converged}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  converged
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md active:scale-95'
                }`}
              >
                <SkipForward className="h-3.5 w-3.5" />
                Step
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                disabled={converged}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  converged
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : isPlaying
                      ? 'bg-amber-500 hover:bg-amber-400 text-white shadow-md active:scale-95'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md active:scale-95'
                }`}
              >
                <Play className="h-3.5 w-3.5" />
                {isPlaying ? 'Pause' : 'Auto-play'}
              </button>
              <button
                onClick={runToEnd}
                disabled={converged}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  converged
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-500 text-white shadow-md active:scale-95'
                }`}
              >
                <FastForward className="h-3.5 w-3.5" />
                Converge
              </button>
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium border border-slate-200 transition-all cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Re-init
              </button>
            </div>
            {converged && (
              <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100">
                <span className="font-bold">✓ Converged!</span>
                <span className="text-emerald-500">No reassignments in iteration {iteration}.</span>
              </div>
            )}
          </div>

          {/* Quick Readout Card */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-sm border border-slate-800 text-xs space-y-3 font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-blue-400">Clustering Metrics</span>
              <span className="text-3xs text-slate-400">Iteration #{iteration}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-2xs">
              <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                <span className="text-slate-400 block mb-0.5">WCSS (Inertia)</span>
                <span className="text-rose-400 font-bold text-sm">{wcss.toFixed(2)}</span>
              </div>
              <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                <span className="text-slate-400 block mb-0.5">Silhouette Score</span>
                <span className="text-emerald-400 font-bold text-sm">{silhouette.toFixed(3)}</span>
              </div>
            </div>
            <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80 space-y-1 text-2xs">
              <span className="text-slate-400 block mb-1">Centroid Coordinates:</span>
              {displayCentroids.map((ct, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: CLUSTER_COLORS[i % CLUSTER_COLORS.length] }}
                  />
                  <span style={{ color: CLUSTER_COLORS[i % CLUSTER_COLORS.length] }}>
                    C{i + 1}: [{ct[0].toFixed(2)}, {ct[1].toFixed(2)}]
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── RIGHT: Visualizations (8 cols) ─── */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-950 rounded-2xl border border-slate-800 p-5 shadow-md flex flex-col justify-between">
            {/* Tab Navigation */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActiveTab('clusters')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'clusters'
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  1. Cluster Visualization
                </button>
                <button
                  onClick={() => setActiveTab('elbow')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'elbow'
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  2. Elbow Method (WCSS)
                </button>
              </div>
              <div className="flex items-center space-x-3 text-2xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Crosshair className="h-3 w-3 text-white" />
                  <strong className="text-white">K = {k}</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <Layers className="h-3 w-3 text-slate-400" />
                  <strong className="text-white">{samples}</strong> pts
                </span>
                <span className="flex items-center gap-1.5">
                  <Eye className="h-3 w-3 text-slate-400" />
                  Iter <strong className="text-white">{iteration}</strong>
                </span>
              </div>
            </div>

            {/* Canvas: Cluster View — ALWAYS in DOM, hidden/block only */}
            <div className={activeTab === 'clusters' ? 'block space-y-3' : 'hidden'}>
              <div className="relative w-full aspect-[16/10] bg-[#030712] rounded-xl border border-slate-900 overflow-hidden flex items-center justify-center">
                <canvas
                  ref={clusterCanvasRef}
                  width={640}
                  height={400}
                  className="w-full h-full object-contain"
                />
              </div>
              <p className="text-2xs text-slate-400 text-center">
                Data points coloured by cluster assignment. <strong>×</strong> markers show centroid positions.
                {!converged && ' Press Step or Auto-play to iterate the algorithm.'}
                {converged && ' Algorithm has converged — centroids are stable.'}
              </p>
            </div>

            {/* Canvas: Elbow View — ALWAYS in DOM, hidden/block only */}
            <div className={activeTab === 'elbow' ? 'block space-y-3' : 'hidden'}>
              <div className="relative w-full aspect-[16/10] bg-[#030712] rounded-xl border border-slate-900 overflow-hidden flex items-center justify-center">
                <canvas
                  ref={elbowCanvasRef}
                  width={640}
                  height={400}
                  className="w-full h-full object-contain"
                />
              </div>
              <p className="text-2xs text-slate-400 text-center">
                <strong>Elbow Method:</strong> WCSS (Within-Cluster Sum of Squares) vs K. The optimal K is at the "elbow" bend
                where adding more clusters yields diminishing returns. Currently highlighted: <strong>K = {k}</strong>.
              </p>
            </div>
          </div>

          {/* Cluster Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {displayCentroids.map((ct, i) => {
              const count = assignments.filter(a => a === i).length;
              return (
                <div
                  key={i}
                  className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs text-center"
                >
                  <span
                    className="inline-block h-3 w-3 rounded-full mb-1"
                    style={{ backgroundColor: CLUSTER_COLORS[i % CLUSTER_COLORS.length] }}
                  />
                  <p className="text-xs font-bold text-slate-900">Cluster {i + 1}</p>
                  <p className="text-2xs text-slate-500 font-mono">{count} points</p>
                  <p className="text-3xs text-slate-400 font-mono mt-0.5">
                    ({ct[0].toFixed(1)}, {ct[1].toFixed(1)})
                  </p>
                </div>
              );
            })}
          </div>

          {/* Educational Concept Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
              <span className="text-3xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Step 1-2
              </span>
              <p className="text-xs font-bold text-slate-900">Initialisation (K-Means++)</p>
              <p className="text-3xs text-slate-500 mt-1">
                Choose K initial centroids using distance-weighted probability to avoid poor random starts.
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
              <span className="text-3xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Step 3-5
              </span>
              <p className="text-xs font-bold text-slate-900">Assign → Recompute → Repeat</p>
              <p className="text-3xs text-slate-500 mt-1">
                Each point moves to its nearest centroid; centroids shift to cluster means until stable (convergence).
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
              <span className="text-3xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Step 7
              </span>
              <p className="text-xs font-bold text-slate-900">Elbow Method (WCSS)</p>
              <p className="text-3xs text-slate-500 mt-1">
                Plot inertia vs K. The "elbow" point marks optimal cluster count — beyond it, gains are marginal.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
