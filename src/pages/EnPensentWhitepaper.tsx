import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Cell, PieChart, Pie } from 'recharts';

const CHESS = { total: '590,988', acc: '60.2%', sf: '55.8%', delta: '+4.4pp', z: '>438' };
const BAT = { cells: '140', cycles: '114,692', acc: '56.5%', crit: '89.0%', bl: '89.2%' };
const TEP = { f1: '93.3%', blF1: '72.7%', recall: '88.9%', blRecall: '57.1%' };
const NRG = { acc: '66.6%', bl: '66.9%', records: '10,805' };
const MUS = { acc: '34.4%', persist: '33.9%', rand: '33.3%', stable: '44.9%', perfs: '1,276', notes: '5.6M' };
const MKT = { acc: '35.5%', tact: '47.1%', resolved: '214' };

const DOMAIN_CHART = [
  { domain: 'Chess', ep: 60.2, baseline: 55.8, random: 33.3 },
  { domain: 'Battery', ep: 56.5, baseline: 89.2, random: 33.3 },
  { domain: 'Chemical', ep: 93.3, baseline: 72.7, random: 50.0 },
  { domain: 'Energy', ep: 66.6, baseline: 66.9, random: 33.3 },
  { domain: 'Music', ep: 34.4, baseline: 33.9, random: 33.3 },
  { domain: 'Market', ep: 35.5, baseline: 33.3, random: 33.3 },
];
const ARCHETYPE_CHART = [
  { name: 'sacrificial_attack', accuracy: 62.1, count: 42844 },
  { name: 'kingside_attack', accuracy: 61.8, count: 136470 },
  { name: 'queenside_exp', accuracy: 61.4, count: 200820 },
  { name: 'positional_squeeze', accuracy: 59.2, count: 93545 },
  { name: 'central_dom', accuracy: 58.5, count: 85000 },
];
const QUADRANT_RADAR = [
  { q: 'Q1 KS-W', value: 65 }, { q: 'Q2 QS-W', value: 58 },
  { q: 'Q3 KS-B', value: 62 }, { q: 'Q4 QS-B', value: 55 },
  { q: 'Q5 Ctr-W', value: 72 }, { q: 'Q6 Ctr-B', value: 68 },
  { q: 'Q7 Ext-KS', value: 45 }, { q: 'Q8 Ext-QS', value: 42 },
];

// Piece colors — the core visualization concept
const PIECE_COLORS: Record<string, string> = {
  K: '#eab308', Q: '#ef4444', R: '#3b82f6', B: '#8b5cf6', N: '#22c55e', P: '#9ca3af',
  k: '#ca8a04', q: '#dc2626', r: '#2563eb', b: '#7c3aed', n: '#16a34a', p: '#6b7280',
};

// Simulate a mini game: moves that fill the board with color
const DEMO_MOVES = [
  { piece: 'P', from: [6,4], to: [4,4], label: '1. e4' },
  { piece: 'p', from: [1,4], to: [3,4], label: '1...e5' },
  { piece: 'N', from: [7,6], to: [5,5], label: '2. Nf3' },
  { piece: 'n', from: [0,1], to: [2,2], label: '2...Nc6' },
  { piece: 'B', from: [7,5], to: [4,2], label: '3. Bc4' },
  { piece: 'b', from: [0,5], to: [3,2], label: '3...Bc5' },
  { piece: 'P', from: [6,3], to: [4,3], label: '4. d4' },
  { piece: 'p', from: [3,4], to: [4,3], label: '4...exd4' },
];

// Get all squares a piece passes through (path-based coloring)
function getDemoPathSquares(from: number[], to: number[], piece: string): number[][] {
  const squares: number[][] = [];
  const pieceType = piece.toLowerCase();
  // Knights trace the L-shape path (long leg first, then short leg)
  if (pieceType === 'n') {
    const rDiff = Math.abs(to[0] - from[0]);
    const cDiff = Math.abs(to[1] - from[1]);
    const rDir = Math.sign(to[0] - from[0]);
    const cDir = Math.sign(to[1] - from[1]);
    if (rDiff === 2 && cDiff === 1) {
      squares.push([from[0] + rDir, from[1]]);
      squares.push([from[0] + rDir * 2, from[1]]);
    } else if (cDiff === 2 && rDiff === 1) {
      squares.push([from[0], from[1] + cDir]);
      squares.push([from[0], from[1] + cDir * 2]);
    }
    squares.push(to);
    return squares;
  }
  // Sliding pieces + pawns: trace the path from→to (excluding origin)
  const rDir = Math.sign(to[0] - from[0]);
  const cDir = Math.sign(to[1] - from[1]);
  let cr = from[0] + rDir;
  let cc = from[1] + cDir;
  while (cr !== to[0] || cc !== to[1]) {
    squares.push([cr, cc]);
    cr += rDir;
    cc += cDir;
  }
  squares.push(to); // always include destination
  return squares;
}

function ColorFlowDemo() {
  const [step, setStep] = useState(0);
  const [grid, setGrid] = useState<string[][]>(
    Array.from({ length: 8 }, () => Array(8).fill(''))
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setStep(s => {
        const next = s < DEMO_MOVES.length ? s + 1 : 0;
        if (next === 0) {
          setGrid(Array.from({ length: 8 }, () => Array(8).fill('')));
        } else {
          setGrid(prev => {
            const g = prev.map(r => [...r]);
            const m = DEMO_MOVES[next - 1];
            // Color EVERY square the piece passes through (not just destination)
            const path = getDemoPathSquares(m.from, m.to, m.piece);
            for (const sq of path) {
              g[sq[0]][sq[1]] = m.piece;
            }
            return g;
          });
        }
        return next;
      });
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <div className="grid grid-cols-8 gap-0 w-64 h-64 mx-auto border border-gray-300 rounded-lg overflow-hidden">
        {Array.from({ length: 64 }).map((_, i) => {
          const r = Math.floor(i / 8), c = i % 8;
          const isLight = (r + c) % 2 === 0;
          const piece = grid[r]?.[c];
          const color = piece ? PIECE_COLORS[piece] : undefined;
          return (
            <div key={i} className="relative flex items-center justify-center transition-all duration-500" style={{
              backgroundColor: color
                ? `${color}${piece === piece.toUpperCase() ? '88' : '66'}`
                : isLight ? '#f5f0e8' : '#b7c0d0',
            }}>
              {color && <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }} />}
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-center gap-4 mt-4">
        <p className="text-sm font-mono font-bold text-amber-600">
          {step > 0 ? DEMO_MOVES[step - 1].label : 'Starting position...'}
        </p>
        <p className="text-xs text-gray-400">Step {step}/{DEMO_MOVES.length}</p>
      </div>
    </div>
  );
}

function Page({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`wp-page min-h-[11in] px-12 py-12 ${className}`}>{children}</section>;
}
function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-xs text-gray-400 mb-8 tracking-widest uppercase">{children}</div>;
}
function Stat({ value, label, color = 'gray' }: { value: string; label: string; color?: string }) {
  const colorMap: Record<string, string> = {
    amber: 'text-amber-600 bg-amber-50', violet: 'text-violet-600 bg-violet-50',
    emerald: 'text-emerald-600 bg-emerald-50', blue: 'text-blue-600 bg-blue-50',
    red: 'text-red-600 bg-red-50', yellow: 'text-yellow-600 bg-yellow-50',
    gray: 'text-gray-400 bg-gray-50', orange: 'text-orange-600 bg-orange-50',
  };
  return (
    <div className={`rounded-xl p-4 text-center ${colorMap[color] || colorMap.gray}`}>
      <p className="text-2xl font-black">{value}</p>
      <p className="text-[10px] text-gray-500 mt-1">{label}</p>
    </div>
  );
}

export default function EnPensentWhitepaper() {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      <header className="border-b bg-white sticky top-0 z-50 print:hidden">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-2" />Home</Button></Link>
            <h1 className="font-bold">En Pensent — Technical Whitepaper</h1>
          </div>
          <Button onClick={() => window.print()} className="gap-2"><Download className="h-4 w-4" />Export PDF</Button>
        </div>
      </header>

      <main className="max-w-[8.5in] mx-auto">

        {/* PAGE 1: COVER */}
        <Page className="flex flex-col items-center justify-center text-center">
          <div className="inline-block px-4 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs font-medium text-amber-700 mb-6">
            Patent Pending · February 2026
          </div>
          <h1 className="text-5xl font-black tracking-tight mb-4">En Pensent</h1>
          <p className="text-xl text-gray-500 mb-2 font-light tracking-wide">Universal Temporal Pattern Recognition</p>
          <p className="text-lg text-gray-400 mb-12">via Photonic Grid Interference Architecture</p>
          <div className="w-48 h-px bg-gray-200 mb-12" />
          <div className="grid grid-cols-8 gap-0.5 w-48 h-48 mx-auto mb-4">
            {Array.from({ length: 64 }).map((_, i) => {
              const r = Math.floor(i / 8), c = i % 8;
              const bright = Math.abs(Math.sin(r * 0.7 + c * 0.5)) * 0.6 + 0.2;
              return <div key={i} className="rounded-[1px]" style={{
                backgroundColor: (r + c) % 2 === 0
                  ? `rgba(245,158,11,${bright})` : `rgba(139,92,246,${bright * 0.8})`
              }} />;
            })}
          </div>
          <p className="text-[10px] text-gray-400 mb-12">The 8×8 Universal Grid — 64 cells, infinite domains</p>
          <div className="grid grid-cols-3 gap-8 text-center mb-12">
            <div><p className="text-3xl font-black text-amber-600">6</p><p className="text-xs text-gray-500">Validated Domains</p></div>
            <div><p className="text-3xl font-black text-violet-600">60.2%</p><p className="text-xs text-gray-500">Chess 3-Way Accuracy</p></div>
            <div><p className="text-3xl font-black text-emerald-600">93.3%</p><p className="text-xs text-gray-500">Chemical F1 Score</p></div>
          </div>
          <p className="text-sm text-gray-400">Alec Arthur Shelton · En Pensent Technologies</p>
        </Page>

        {/* PAGE 2: THE ORIGIN — How It Started */}
        <Page>
          <Label>The Origin</Label>
          <h2 className="text-3xl font-black mb-4">It Started with a Simple Idea</h2>
          <p className="text-base leading-relaxed text-gray-700 mb-6">
            What if you watched a chess game and, instead of tracking who was winning, you just <strong>colored every square a piece passed through</strong> — not just where it landed, but every square along its path?
          </p>

          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-sm font-bold mb-3">Step 1: Assign Colors to Pieces</h3>
              <p className="text-xs text-gray-500 mb-3">Every piece type gets a unique color. Each pawn gets a slightly different hue based on its file. Pair pieces (both rooks, both bishops, both knights) get distinct hues from each other.</p>
              <div className="space-y-2">
                {[
                  ['#eab308','King','♔','Stability, endgame king walks'],
                  ['#ef4444','Queen','♕','Dominant force, sweeping moves'],
                  ['#3b82f6','Rook','♖','Structural lines, files, ranks'],
                  ['#8b5cf6','Bishop','♗','Diagonal pressure, long range'],
                  ['#22c55e','Knight','♘','Non-linear jumps, surprises'],
                  ['#9ca3af','Pawn','♙','Territory, structure, slow push'],
                ].map(([color, name, icon, desc]) => (
                  <div key={name} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-md flex items-center justify-center text-white text-sm" style={{ backgroundColor: color }}>{icon}</div>
                    <div><span className="text-xs font-bold">{name}</span> <span className="text-[10px] text-gray-400">— {desc}</span></div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold mb-3">Step 2: Watch the Board Fill Up</h3>
              <p className="text-xs text-gray-500 mb-3">Each move paints color on every square the piece crosses — the full path. Sliding pieces trace their lines, knights trace their L-shape. Overlapping paths create nested layers (squares within squares):</p>
              <ColorFlowDemo />
            </div>
          </div>

          <div className="bg-amber-50 rounded-xl p-5 mb-6">
            <h3 className="text-sm font-bold mb-2">Step 3: A Pattern Emerges</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              After a full game, the board is a <strong>heat map of piece trajectories</strong>. Sliding pieces (queen, rook, bishop) color every square they pass through — not just where they land. When paths overlap, colors nest inside each other: squares within squares. Unmoved pieces leave their starting squares colorless. Kingside attacks show dense red/green trails on the right. Queenside expansions fill the left with blue paths. <strong>The layered pattern itself predicts the outcome</strong> — without needing to understand a single rule of chess.
            </p>
          </div>

          <div className="bg-gray-900 rounded-xl p-5 text-xs">
            <p className="text-amber-400 font-bold mb-1">The Breakthrough Realization:</p>
            <p className="text-gray-300">
              If coloring squares with chess pieces creates predictive patterns... what if you color squares with <em>anything</em>? Battery voltage curves. Chemical sensor readings. Musical notes. Stock prices. <strong>The grid doesn't care what fills it. The pattern is the prediction.</strong>
            </p>
          </div>
        </Page>

        {/* PAGE 3: HOW COLOR FLOW WORKS — Visual Deep Dive */}
        <Page>
          <Label>Color Flow Analysis</Label>
          <h2 className="text-3xl font-black mb-4">From Moves to Signatures</h2>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="text-3xl mb-2">♟→🎨</div>
              <p className="text-xs font-bold">1. Piece Moves</p>
              <p className="text-[10px] text-gray-500">Each move colors every square the piece passes through — the full path</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="text-3xl mb-2">🎨→📊</div>
              <p className="text-xs font-bold">2. Colors Accumulate</p>
              <p className="text-[10px] text-gray-500">Over 30-40 moves, overlapping paths create nested layers — squares in squares</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="text-3xl mb-2">📊→🎯</div>
              <p className="text-xs font-bold">3. Pattern Predicts</p>
              <p className="text-[10px] text-gray-500">The fingerprint is classified into archetypes that carry historical win rates</p>
            </div>
          </div>

          <h3 className="text-sm font-bold mb-3">The 8-Quadrant Profile</h3>
          <p className="text-xs text-gray-500 mb-4">The board is divided into 8 zones. Color intensity in each zone creates a unique signature:</p>
          
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={QUADRANT_RADAR}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="q" tick={{ fontSize: 9, fill: '#6b7280' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8 }} />
                  <Radar name="Intensity" dataKey="value" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <div className="grid grid-cols-4 grid-rows-2 gap-1 w-48 h-24 mx-auto mb-4">
                {['Q1\nKS-W','Q5\nCtr-W','Q6\nCtr-B','Q3\nKS-B','Q2\nQS-W','Q7\nExt','Q8\nExt','Q4\nQS-B'].map((q,i) => (
                  <div key={q} className="rounded text-[7px] font-bold flex items-center justify-center text-center leading-tight text-white" style={{
                    backgroundColor: [
                      '#f59e0b','#22c55e','#22c55e','#8b5cf6',
                      '#f59e0b','#94a3b8','#94a3b8','#8b5cf6'
                    ][i],
                    opacity: [0.65,0.72,0.68,0.62,0.58,0.45,0.42,0.55][i] + 0.3,
                  }}>{q.replace('\n',' ')}</div>
                ))}
              </div>
              <p className="text-[10px] text-gray-500 text-center mb-3">8 quadrants capture spatial distribution of piece activity</p>
              <div className="space-y-1 text-[10px]">
                <div className="flex gap-2"><span className="font-bold text-amber-600">White zones</span> Q1, Q2, Q5 — white piece activity</div>
                <div className="flex gap-2"><span className="font-bold text-violet-600">Black zones</span> Q3, Q4, Q6 — black piece activity</div>
                <div className="flex gap-2"><span className="font-bold text-gray-500">Extended</span> Q7, Q8 — wing pressure beyond center</div>
              </div>
            </div>
          </div>

          <div className="border-l-4 border-amber-400 pl-4 text-sm italic text-gray-600">
            "A chess board has 64 squares. From these emerge ~10¹²⁰ positions — more than atoms in the observable universe. The constraint doesn't limit complexity. It generates it."
          </div>
        </Page>

        {/* PAGE 3: ARCHITECTURE */}
        <Page>
          <Label>Architecture</Label>
          <h2 className="text-3xl font-black mb-6">The Universal Grid Portal</h2>
          <div className="bg-gray-900 text-green-400 rounded-xl p-6 mb-8 font-mono text-xs leading-relaxed">
            <pre>{`Grid G ∈ ℝ^(8×8×C)     C = color channels per domain

For each timestep t:
  path = getPathSquares(from, to, piece)  // full traversal
  ∀ sq ∈ path: G[sq.row][sq.col][ch] += intensity  // layers nest

Signature σ = extractUniversalSignature(G)
  σ = { quadrantProfile: {q₁..q₈}, temporalFlow: {early,mid,late},
        archetype: A, intensity: I ∈ (0,1], dominantSide: D }

Prediction = fusion(control, momentum, archetype, baseline,
                    phase, kingSafety, pawnStructure, enhancedControl)`}</pre>
          </div>
          <h3 className="text-lg font-bold mb-4">One Grid, Six Domains</h3>
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[['♟','Chess','12 piece colors','amber'],['🔋','Battery','24 electrochemical','blue'],['⚗️','Chemical','52 process vars','red'],['⚡','Energy','24 grid signals','yellow'],['🎵','Music','24 MIDI features','violet'],['📈','Market','24 price signals','emerald']].map(([icon,name,ch,col])=>(
              <div key={name} className={`p-3 rounded-lg bg-${col}-50 border border-${col}-100`}>
                <span className="text-xl">{icon}</span>
                <p className="font-bold text-sm">{name}</p>
                <p className="text-[10px] text-gray-500">{ch}</p>
              </div>
            ))}
          </div>
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-sm font-bold mb-2">The Key Constraint</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Every domain adapter maps raw data onto the <strong>same 64-cell grid</strong>. Grid architecture, signature extraction, archetype classification, and prediction logic remain <strong>identical</strong>. Only color channel mapping changes. This representational bottleneck forces all signals into a common spatial format.
            </p>
          </div>
        </Page>

        {/* PAGE 4: CHESS RESULTS — with charts */}
        <Page>
          <Label>Domain 1 — Chess</Label>
          <h2 className="text-3xl font-black mb-2">Chess Outcome Prediction</h2>
          <p className="text-sm text-gray-500 mb-6">3-way: White wins / Black wins / Draw · {CHESS.total} games · Lichess + Chess.com</p>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Stat value={CHESS.acc} label="EP Accuracy" color="amber" />
            <Stat value={CHESS.sf} label="Stockfish 17" />
            <Stat value={CHESS.delta} label="Improvement" color="emerald" />
          </div>

          <h3 className="text-sm font-bold mb-2">Archetype Performance</h3>
          <p className="text-[10px] text-gray-500 mb-2">Each strategic pattern carries its own accuracy — learned from hundreds of thousands of real games:</p>
          <div className="h-44 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ARCHETYPE_CHART} layout="vertical" margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" domain={[50, 65]} tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 8 }} width={110} />
                <Tooltip contentStyle={{ fontSize: 11 }} formatter={(v: number) => `${v}%`} />
                <Bar dataKey="accuracy" radius={[0, 4, 4, 0]}>
                  {ARCHETYPE_CHART.map((_, i) => (
                    <Cell key={i} fill={['#f59e0b', '#fb923c', '#fbbf24', '#d97706', '#b45309'][i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-amber-50 rounded-xl p-4 text-xs text-gray-600">
              <strong>z {'>'} 438</strong> — probability of this result by chance is effectively zero. 590,988 predictions on 3-way classification, 26.9pp above random (33.3%).
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-600">
              <strong>How it works:</strong> Mid-game position → color flow signature → 8-quadrant profile → archetype classification → 8-signal weighted fusion → outcome prediction. All from coloring squares.
            </div>
          </div>
        </Page>

        {/* PAGE 5: BATTERY + TEP */}
        <Page>
          <Label>Domains 2 & 3</Label>
          <h2 className="text-2xl font-black mb-2">Battery Degradation</h2>
          <p className="text-xs text-gray-500 mb-4">MIT-Stanford MATR + NASA Ames · {BAT.cells} cells · {BAT.cycles} cycles</p>
          <div className="grid grid-cols-4 gap-3 mb-4">
            <Stat value={BAT.acc} label="Overall" color="blue" />
            <Stat value={BAT.crit} label="Critical Det." color="red" />
            <Stat value={BAT.bl} label="Persistence BL" />
            <Stat value="+23.2pp" label="vs Random" color="emerald" />
          </div>
          <p className="text-xs text-gray-600 mb-6 leading-relaxed">
            Persistence is strong for smooth lab data. EP's value: <strong>89.0% critical-state detection</strong> catches safety-critical transitions using the same universal grid applied to chess.
          </p>
          <div className="w-full h-px bg-gray-200 my-6" />
          <h2 className="text-2xl font-black mb-2">Tennessee Eastman Process</h2>
          <p className="text-xs text-gray-500 mb-4">Chemical fault detection · 2,200 records · 52 process variables</p>
          <div className="grid grid-cols-4 gap-3 mb-4">
            <Stat value={TEP.f1} label="F1 Score" color="red" />
            <Stat value={TEP.recall} label="Fault Recall" color="orange" />
            <Stat value={TEP.blF1} label="Baseline F1" />
            <Stat value="+20.6pp" label="F1 Improvement" color="emerald" />
          </div>
          <div className="bg-gray-900 text-green-400 rounded-xl p-4 font-mono text-xs mb-4">
            <pre>{`Self-Learning Threshold Discovery:
  for θ ∈ [0.5, 1.0, 1.5, 2.0, 2.5, 3.0]:
    separation(θ) = |μ_normal - μ_fault| / (σ_normal + σ_fault)
  Result: θ* = 3.0  (sep = 3.881 vs θ=0.5's 0.207) — 18.8× better`}</pre>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            Catches <strong>31.8pp more faults</strong> than persistence. The self-learning module discovered z {'>'} 3.0 autonomously — no human tuning.
          </p>
        </Page>

        {/* PAGE 6: ENERGY + MUSIC */}
        <Page>
          <Label>Domains 4 & 5</Label>
          <h2 className="text-2xl font-black mb-2">Energy Grid Forecasting</h2>
          <p className="text-xs text-gray-500 mb-4">US EIA Hourly Grid Monitor · {NRG.records} records · 5 regions</p>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <Stat value={NRG.acc} label="EP Accuracy" color="yellow" />
            <Stat value={NRG.bl} label="Persistence" />
            <Stat value="+33.3pp" label="vs Random" color="emerald" />
          </div>
          <p className="text-xs text-gray-600 mb-6 leading-relaxed">
            Matching persistence without any energy-specific engineering. Self-learned blend alpha: 0.80.
          </p>
          <div className="w-full h-px bg-gray-200 my-6" />
          <h2 className="text-2xl font-black mb-2">Music Melodic Direction</h2>
          <p className="text-xs text-gray-500 mb-4">MAESTRO v3.0.0 · {MUS.perfs} concert piano performances · {MUS.notes} notes</p>
          <div className="grid grid-cols-4 gap-3 mb-4">
            <Stat value={MUS.acc} label="EP Accuracy" color="violet" />
            <Stat value={MUS.persist} label="Persistence" />
            <Stat value={MUS.rand} label="Random" />
            <Stat value={MUS.stable} label="Stable Class" color="violet" />
          </div>
          <p className="text-xs text-gray-600 mb-4 leading-relaxed">
            24 music channels: pitch (rainbow), rhythm (pulse), dynamics (brightness), harmony (warm/cool). Raw MIDI binary parsing, 8-beat phrases, 8-phrase context stacking. Top composers: Schubert, Beethoven, Chopin.
          </p>
          <div className="bg-violet-50 rounded-xl p-4 text-xs text-gray-600">
            <strong>Why it matters:</strong> Concert piano has highly variable phrase trajectories. The same 8×8 grid capturing <em>any</em> predictive signal from Schubert, Beethoven, and Chopin demonstrates genuine domain transfer.
          </div>
        </Page>

        {/* PAGE 7: MARKETS */}
        <Page>
          <Label>Domain 6 — Financial Markets</Label>
          <h2 className="text-3xl font-black mb-2">Market Direction Prediction</h2>
          <p className="text-sm text-gray-500 mb-8">Live multi-timeframe · Yahoo Finance · Chess→Market intelligence transfer</p>
          <div className="grid grid-cols-2 gap-6 mb-8">
            <Stat value={MKT.acc} label="Post-Calibration Accuracy" color="emerald" />
            <Stat value={MKT.tact} label="Tactical Pattern Accuracy" color="amber" />
          </div>
          <h3 className="text-sm font-bold mb-3">Chess-Inspired Tactical Detectors</h3>
          <div className="grid grid-cols-5 gap-2 mb-8">
            {[['♛','Queen Sacrifice','Trap'],['♟','En Passant','Fleeting Window'],['♕','Promotion','Breakout'],['♖','Castling','Repositioning'],['⚠','Blunder','Capitulation']].map(([i,c,m])=>(
              <div key={c} className="bg-gray-50 rounded-lg p-2 text-center">
                <div className="text-xl mb-1">{i}</div>
                <p className="text-[10px] font-bold">{c}</p>
                <p className="text-[10px] text-gray-400">→ {m}</p>
              </div>
            ))}
          </div>
          <h3 className="text-sm font-bold mb-3">Cross-Domain Time-Control Mapping</h3>
          <div className="bg-gray-50 rounded-xl p-4 mb-8">
            <div className="grid grid-cols-5 gap-2 text-center text-xs">
              {[['Bullet','Scalp 1h','46.9%'],['Blitz','Short 30m','48.1%'],['Rapid','Medium 2h','47.5%'],['Classical','Swing 8h','49.2%'],['Corresp.','Daily 24h','—']].map(([ch,mk,a])=>(
                <div key={ch}><p className="font-bold text-amber-600">{ch}</p><p className="text-gray-400">↓</p><p className="font-bold text-emerald-600">{mk}</p><p className="text-gray-400 text-[10px]">{a}</p></div>
              ))}
            </div>
          </div>
          <div className="border-l-4 border-emerald-400 pl-4 text-xs italic text-gray-600">
            "Cyclical confirmation vice versa — chess validates market signals AND market validates chess patterns. Bidirectional truth amplification through interference."
          </div>
        </Page>

        {/* PAGE 8: SELF-LEARNING */}
        <Page>
          <Label>Self-Learning</Label>
          <h2 className="text-3xl font-black mb-6">The System Teaches Itself</h2>
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            No human tuning required. <strong>Consistency of architecture doesn't change, but understanding grows with volume.</strong>
          </p>
          <div className="bg-gray-900 text-green-400 rounded-xl p-5 font-mono text-xs mb-6">
            <pre>{`1. THRESHOLD DISCOVERY
   separation(θ) = |μ_A(θ) - μ_B(θ)| / (σ_A + σ_B)
   θ* = argmax separation(θ)

2. ARCHETYPE WEIGHT LEARNING
   weight_A = accuracy_A / Σ(accuracy_all)   [n ≥ 20]

3. BLEND ALPHA
   α* = argmax accuracy(α·EP + (1-α)·baseline)

4. CONFIDENCE RECALIBRATION
   cap = min(reported_conf, actual_accuracy)`}</pre>
          </div>
          <h3 className="text-sm font-bold mb-3">Volume → Accuracy: Proven</h3>
          <div className="space-y-2 mb-6">
            {[['Battery','36.9% (4 cells)','56.5% (140 cells)','+19.6pp'],['TEP','F1 72.7% (no learn)','F1 93.3% (self-learned)','+20.6pp'],['Chess','54.4% (9.5K)','60.2% (590K)','+5.8pp'],['Market','18.9% (all-time)','35.5% (post-fix)','+16.6pp']].map(([d,f,t,delta])=>(
              <div key={d} className="flex items-center gap-3 text-xs">
                <span className="font-bold w-14">{d}</span>
                <span className="text-gray-400 w-32">{f}</span><span className="text-gray-400">→</span>
                <span className="font-bold w-36">{t}</span>
                <span className="text-emerald-600 font-bold">{delta}</span>
              </div>
            ))}
          </div>
          <div className="bg-amber-50 rounded-xl p-4 text-xs text-gray-600">
            <strong>The Self-Evolution Engine</strong> runs 24/7 as PM2 process. Queries 3-day vs 3-14 day per-archetype accuracy trends. Uses trend + live weights to decide: trust hybrid, trust baseline, consensus boost, or tiebreak. Every decision feeds back.
          </div>
        </Page>

        {/* PAGE 9: DUAL-INVERSION CONVERGENCE */}
        <Page>
          <Label>v11 — Latest Innovation</Label>
          <h2 className="text-3xl font-black mb-2">Dual-Inversion Relativity Convergence</h2>
          <p className="text-sm text-gray-500 mb-6">"Keep it all above negativity" — All positive, no zeros</p>
          <div className="bg-gray-900 text-green-400 rounded-xl p-5 font-mono text-xs mb-6">
            <pre>{`MATTER (what IS there):  M = [|q₁|+ε, ..., |q₈|+ε, ...]  ε=0.1
SHADOW (what ISN'T):     S = [|backRank|+ε, |shadow|+ε, ...]

INVERSION (reciprocal 1/x, NOT negation):
  inv_M = [1/m₁, 1/m₂, ...]   inv_S = [1/s₁, 1/s₂, ...]

CONVERGENCE:
  ratio = min(median(inv_M), median(inv_S))
        / max(median(inv_M), median(inv_S))
  → ≈ 1.0: equilibrium (DRAW)    → ≈ 0.0: decisive

ENVELOPE:
  envelope = min(all_4_stats) / max(all_4_stats)
  → Tight: confident    → Wide: uncertain`}</pre>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-violet-50 rounded-xl p-4">
              <h3 className="text-xs font-bold mb-2">Why All Positive?</h3>
              <p className="text-[10px] text-gray-600 leading-relaxed">
                Negatives create cancellation. Zero creates division errors. Reciprocal (1/x) flips perspective while staying positive. Matter and shadow are both real, both measurable, both positive.
              </p>
            </div>
            <div className="bg-amber-50 rounded-xl p-4">
              <h3 className="text-xs font-bold mb-2">Avoiding Three-Body</h3>
              <p className="text-[10px] text-gray-600 leading-relaxed">
                Previous: N signals weighted against each other = unpredictable. Dual-inversion: exactly TWO perspectives. 4 approaches benchmarked — only perspective-based achieved zero regression.
              </p>
            </div>
          </div>
          <div className="border-l-4 border-violet-400 pl-4 text-xs italic text-gray-600">
            "0 doesn't exist — we learn from absence of what we know. Where matter and shadow converge is equilibrium. Where they diverge is opportunity."
          </div>
        </Page>

        {/* PAGE 10: NEGATIVE SPACE */}
        <Page>
          <Label>Negative Space</Label>
          <h2 className="text-3xl font-black mb-6">Learning from What Isn't There</h2>
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            Traditional analysis focuses on pieces — what IS on the board. Negative space focuses on <strong>empty squares</strong> — pressure, shadows, and tension where nothing sits.
          </p>
          <div className="bg-gray-50 rounded-xl p-5 mb-6">
            <h3 className="text-sm font-bold mb-3">8 Negative Space Metrics</h3>
            <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
              <div><strong>backRankPressure</strong> — Enemy force on undefended back rank</div>
              <div><strong>whiteKingZoneShadow</strong> — Enemy pressure near white king voids</div>
              <div><strong>blackKingZoneShadow</strong> — Enemy pressure near black king voids</div>
              <div><strong>whiteInvasionShadow</strong> — White pressure into black territory</div>
              <div><strong>blackInvasionShadow</strong> — Black pressure into white territory</div>
              <div><strong>voidTension</strong> — Empty squares both sides contest</div>
              <div><strong>negativeSpaceBalance</strong> — Shadow distribution asymmetry</div>
              <div><strong>emptySquareCount</strong> — Game phase indicator</div>
            </div>
          </div>
          <h3 className="text-sm font-bold mb-3">4 Approaches Benchmarked</h3>
          {[['Weighted signal (dilute weights)','-1.01pp','✗'],['Post-fusion adjustments','-2.81pp','✗'],['Draw convergence (9th signal)','-2.50pp','✗'],['Perspective convergence (dual inv)','~0.00pp','✓']].map(([a,d,s])=>(
            <div key={a} className="flex items-center gap-3 text-xs mb-2">
              <span className={`text-lg ${s==='✓'?'text-emerald-500':'text-red-400'}`}>{s}</span>
              <span className="flex-1 text-gray-600">{a}</span>
              <span className={`font-mono font-bold ${s==='✓'?'text-emerald-600':'text-red-500'}`}>{d}</span>
            </div>
          ))}
          <div className="mt-4 bg-violet-50 rounded-xl p-4 text-xs text-gray-600">
            <strong>Key insight:</strong> The 8-signal fusion is too optimized for raw perturbation. Negative space works as a <em>perspective</em> — "is anyone winning at all?" is a different question from "who is winning."
          </div>
        </Page>

        {/* PAGE 11: DATA INTEGRITY */}
        <Page>
          <Label>Data Integrity</Label>
          <h2 className="text-3xl font-black mb-6">Zero Fake Data. Anywhere.</h2>
          <p className="text-sm text-gray-600 mb-8">Three audit rounds. <strong>Real data only — "OFFLINE" over fake.</strong></p>
          <div className="grid grid-cols-3 gap-4 mb-8">
            <Stat value="24" label="Violations Fixed" color="red" />
            <Stat value="3" label="Audit Rounds" color="emerald" />
            <Stat value="0" label="Remaining" color="amber" />
          </div>
          <div className="bg-gray-900 text-white rounded-xl p-5 text-xs mb-6">
            <p className="font-bold mb-2">The Absolute Rule:</p>
            <ul className="space-y-1 text-gray-300">
              <li>• Chess: real Lichess/Chess.com games, verifiable game IDs</li>
              <li>• Market: real Yahoo Finance data only</li>
              <li>• Battery: published MIT-Stanford MATR + NASA Ames</li>
              <li>• Chemical: standard TEP benchmark (Downs & Vogel, 1993)</li>
              <li>• Music: MAESTRO v3.0.0 (1,276 real performances)</li>
              <li>• Energy: US EIA Hourly Grid Monitor API</li>
              <li>• Correlations: real co-occurring signals only</li>
              <li>• Unavailable → "OFFLINE", never fake</li>
            </ul>
          </div>
          <h3 className="text-sm font-bold mb-3">What Was Fixed</h3>
          <div className="space-y-1 text-xs text-gray-600">
            <div><span className="text-red-500 font-bold">R1</span> Random correlations → real Supabase queries + OFFLINE</div>
            <div><span className="text-red-500 font-bold">R1</span> Mock market data → real timezone-based cultures</div>
            <div><span className="text-red-500 font-bold">R1</span> Random signals → reads actual engine state</div>
            <div><span className="text-orange-500 font-bold">R2</span> Fake price changes → 0% until real events</div>
            <div><span className="text-orange-500 font-bold">R2</span> Simulated ticks → keep last real price</div>
            <div><span className="text-amber-500 font-bold">R3</span> Math.random() sensory → deterministic physical constants</div>
            <div><span className="text-amber-500 font-bold">R3</span> Random confidence → deterministic based on correctness</div>
          </div>
        </Page>

        {/* PAGE 12: PHOTONIC CHIP */}
        <Page>
          <Label>Hardware Vision</Label>
          <h2 className="text-3xl font-black mb-2">The EnPensent-27 Photonic Chip</h2>
          <p className="text-sm text-gray-500 mb-6">27 domain processors · Silicon photonics · Speed of light</p>
          <p className="text-xs text-gray-600 mb-6 leading-relaxed">
            Each 8×8 grid cell becomes a physical <strong>ring resonator</strong>. Color accumulation becomes <strong>photon energy accumulation</strong>. Interference patterns computed numerically in software — computed at the speed of light in hardware.
          </p>
          <div className="bg-gray-950 rounded-2xl p-6 mb-6">
            <div className="grid grid-cols-5 gap-1.5">
              {[['Chess','Si₃N₄','#f59e0b'],['Synthesis','III-V/Si','#a78bfa'],['Trading','LiNbO₃','#22c55e'],['Light','SiO₂','#eab308'],['Atomic','Rb vapor','#f97316'],['Quantum','InGaAs','#8b5cf6'],['Cosmic','Si AWG','#6366f1'],['Bio','SPR','#84cc16'],['Mycelium','Benes','#06b6d4'],['Molecular','PCF','#8b5cf6'],['Botanical','Polymer','#84cc16'],['Conscious','InGaAs QD','#ec4899'],['Math','PhC slab','#8b5cf6'],['Universal','SRR','#a78bfa'],["Rubik's",'3D PIC','#f59e0b'],['Soul','PPLN','#ec4899'],['Temporal','WGM','#a855f7'],['Audio','Balanced','#3b82f6'],['Climate','Broadband','#10b981'],['Security','QKD','#ef4444']].map(([n,m,c])=>(
                <div key={n} className="rounded-lg p-1.5 text-center" style={{backgroundColor:c+'22',border:`1px solid ${c}44`}}>
                  <p className="text-[8px] font-bold text-white">{n}</p>
                  <p className="text-[7px]" style={{color:c}}>{m}</p>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-gray-500 mt-3 text-center">Each block maps to a real photonic component and running software adapter</p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-[10px] text-gray-600">
            <div>
              <h4 className="text-xs font-bold mb-2">Components</h4>
              <div className="space-y-1">
                <div>• 64-waveguide matrix (8×8) — Si₃N₄ on SiO₂</div>
                <div>• Ring resonators — phase shift encoding</div>
                <div>• 128-input MZI mesh — LiNbO₃ electro-optic</div>
                <div>• WGM microsphere — Q {'>'} 10⁸</div>
                <div>• 27-input combiner — phase-locked loop</div>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold mb-2">Physical Principles</h4>
              <div className="space-y-1">
                <div>• Constructive interference = occupied = "hot"</div>
                <div>• Destructive interference = vacant = "cold"</div>
                <div>• Matrix multiply at light speed (Shen 2017)</div>
                <div>• 27 domains interfere in single cavity</div>
                <div>• Murray's law branching for distribution</div>
              </div>
            </div>
          </div>
        </Page>

        {/* PAGE 13: MATHEMATICS */}
        <Page>
          <Label>Mathematics</Label>
          <h2 className="text-3xl font-black mb-6">The Math Behind It All</h2>
          <div className="space-y-4">
            {[
              ['1. Grid Accumulation','G(r,c,ch) = Σₜ adapter(Sₜ, r, c, ch)   ∀ r,c ∈ [0,7]','Intensity accumulates from all timesteps'],
              ['2. Quadrant Extraction','qₖ = Σ G(r,c,·)   ∀ (r,c) ∈ Quadrantₖ, k ∈ [1,8]','8 quadrants partition 64 cells'],
              ['3. Archetype Classification','A* = argmax_A Σᵢ wᵢ · featureᵢ(Q, T, I, A)','Weights learned from training data'],
              ['4. Prediction Fusion','P(outcome) = Σⱼ wⱼ · signalⱼ(σ)   where Σwⱼ = 1.0','8 independent signals, empirically weighted'],
              ['5. Dual-Inversion','conv = min(med(1/(M+ε)), med(1/(S+ε))) / max(...)','M=matter, S=shadow, ε=0.1. Conv→1 = equilibrium'],
              ['6. Statistical Significance','z = (p̂-p₀)/√(p₀(1-p₀)/n) = (0.602-0.333)/√(0.222/590988) = 438.6','z>438 → p ≈ 0'],
              ['7. Self-Learning','θ* = argmax_θ |μ_A(θ)-μ_B(θ)| / (σ_A(θ)+σ_B(θ))','Maximizes class separation autonomously'],
            ].map(([title,formula,note])=>(
              <div key={title} className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-xs font-bold mb-1">{title}</h3>
                <p className="font-mono text-xs text-gray-700">{formula}</p>
                <p className="text-[10px] text-gray-500 mt-1">{note}</p>
              </div>
            ))}
          </div>
        </Page>

        {/* PAGE 14: CROSS-DOMAIN */}
        <Page>
          <Label>Cross-Domain</Label>
          <h2 className="text-3xl font-black mb-6">Interference Across Domains</h2>
          <p className="text-sm text-gray-600 mb-6">When the same archetype appears simultaneously in chess and market, constructive interference amplifies confidence. Destructive interference provides skepticism.</p>
          <div className="bg-gray-50 rounded-xl p-5 mb-6">
            <h3 className="text-sm font-bold mb-3">Piece → Market Power Hierarchy</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              {[['♚','King','Central banks / Fed','System stability'],['♛','Queen','Mega-institutions','Dominant force'],['♜','Rook','Major banks','Structural positioning'],['♝','Bishop','Hedge funds','Asymmetric bets'],['♞','Knight','Active managers','Non-linear alpha'],['♟','Pawn','Retail flow','Structure-forming']].map(([i,p,m,d])=>(
                <div key={p} className="flex items-center gap-2">
                  <span className="text-xl">{i}</span>
                  <div><strong>{p}</strong> → {m}<br/><span className="text-gray-400">{d}</span></div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-gray-900 text-green-400 rounded-xl p-5 font-mono text-xs">
            <pre>{`Cyclical Confirmation Loop:
  1. Chess temporal patterns → predict institutional behavior
  2. Market data → confirms / denies
  3. Confirmation → adjusts chess→market weights
  4. Updated weights → better chess interpretation
  5. Repeat (bidirectional feedback)

Light squares = buy zones. Dark squares = sell zones.
Piece activity on light vs dark = bullish vs bearish stance.`}</pre>
          </div>
        </Page>

        {/* PAGE 15: INFRASTRUCTURE */}
        <Page>
          <Label>Infrastructure</Label>
          <h2 className="text-3xl font-black mb-6">Running 24/7 in Production</h2>
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-sm font-bold mb-3">PM2 Worker Fleet</h3>
              <div className="space-y-1.5 text-xs">
                {[['chess-benchmark','A/B test 4 vs 8 quad'],['chess-db-ingest','Bulk processing 300K+/day'],['chess-bulk','Lichess monthly DB'],['depth-analysis','Multi-depth SF eval'],['market-worker','Multi-TF grid predictions'],['options-scalper','EP-guided signal detection'],['paper-tracker','5-strategy portfolio'],['auto-evolution','Archetype trend analysis']].map(([n,d])=>(
                  <div key={n} className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"/><span className="font-mono font-bold">{n}</span><span className="text-gray-400">— {d}</span></div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold mb-3">Stack</h3>
              <div className="space-y-1 text-xs text-gray-600">
                <div><strong>Frontend:</strong> React + TypeScript + Tailwind + Vite</div>
                <div><strong>Backend:</strong> Supabase PostgreSQL + Edge Functions</div>
                <div><strong>Workers:</strong> Node.js ESM + PM2</div>
                <div><strong>Chess:</strong> Stockfish 17 @ depth 20</div>
                <div><strong>Market:</strong> Yahoo Finance real-time</div>
                <div><strong>Deploy:</strong> Vercel (enpensent.com)</div>
                <div><strong>DB:</strong> Supabase PostgreSQL + PgBouncer</div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-5">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div><p className="text-2xl font-black text-amber-600">300K+</p><p className="text-[10px] text-gray-500">Chess/day</p></div>
              <div><p className="text-2xl font-black text-emerald-600">600+</p><p className="text-[10px] text-gray-500">Market preds/cycle</p></div>
              <div><p className="text-2xl font-black text-violet-600">8</p><p className="text-[10px] text-gray-500">Workers online</p></div>
              <div><p className="text-2xl font-black text-blue-600">24/7</p><p className="text-[10px] text-gray-500">Continuous</p></div>
            </div>
          </div>
        </Page>

        {/* PAGE 16: SUMMARY — with domain comparison chart */}
        <Page>
          <Label>Summary</Label>
          <h2 className="text-3xl font-black mb-4">Six Domains, One Architecture</h2>
          <p className="text-xs text-gray-500 mb-4">En Pensent (amber) vs Domain Baseline (gray) vs Random Chance (dashed). Same algorithm, different data.</p>
          
          <div className="h-64 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DOMAIN_CHART} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="domain" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} label={{ value: 'Accuracy %', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }} />
                <Tooltip contentStyle={{ fontSize: 11 }} formatter={(v: number) => `${v}%`} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="ep" name="En Pensent" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="baseline" name="Baseline" fill="#d1d5db" radius={[4, 4, 0, 0]} />
                <Bar dataKey="random" name="Random" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <table className="w-full text-xs mb-6">
            <thead><tr className="border-b-2 border-gray-300">
              <th className="text-left py-2">Domain</th><th className="text-right py-2">EP</th><th className="text-right py-2">Baseline</th><th className="text-right py-2">Scale</th>
            </tr></thead>
            <tbody className="text-gray-600">
              {[['♟ Chess','60.2%','55.8% SF17','590,988 games'],['🔋 Battery','56.5%','89.2% persist','140 cells, 114K cycles'],['⚗️ Chemical','F1 93.3%','F1 72.7%','2,200 records'],['⚡ Energy','66.6%','66.9% persist','10,805 hourly'],['🎵 Music','34.4%','33.9% persist','1,276 performances'],['📈 Market','35.5% / 47.1%','33.3% random','214+ resolved']].map(([d,ep,bl,sc],i)=>(
                <tr key={d} className={`border-b ${i%2?'':'bg-gray-50/50'}`}>
                  <td className="py-1.5 font-bold">{d}</td>
                  <td className="text-right font-mono font-bold">{ep}</td>
                  <td className="text-right font-mono text-gray-400">{bl}</td>
                  <td className="text-right">{sc}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="text-center">
            <p className="text-lg font-black text-gray-300">"The grid doesn't care what fills it.</p>
            <p className="text-lg font-black text-gray-900">The pattern is the prediction."</p>
          </div>
        </Page>

        {/* PAGE 17: VISION */}
        <Page>
          <Label>Vision</Label>
          <h2 className="text-3xl font-black mb-6">What En Pensent Could Become</h2>
          <div className="space-y-4 mb-8">
            {[
              ['🏥','Medical Diagnostics','ECG waveforms, EEG brain signals, blood chemistry — all temporal. The same F1 93.3% fault detection applied to cardiac anomaly prediction. Patient vital archetypes could alert clinicians to deterioration patterns before they become critical.'],
              ['🌍','Climate Prediction','Weather stations, ocean buoys, satellite data — temporal sequences at planetary scale. The grid captures spatial-temporal patterns in atmospheric pressure, temperature gradients, and ocean currents. Self-learning thresholds could identify extreme weather precursors.'],
              ['🧬','Genomics & Drug Discovery','Gene expression time-series, protein folding trajectories, drug response curves. The grid architecture is inherently suited to sequential molecular data. Archetype classification could identify drug response patterns across patient populations.'],
              ['🛰','Satellite & Defense','Radar signatures, signal intelligence, orbital mechanics — temporal patterns with national security implications. The photonic chip speed-of-light computation enables real-time threat classification at the edge.'],
              ['🤖','Autonomous Systems','Self-driving sensor fusion, drone swarm coordination, robotic process control. Every sensor stream is a temporal sequence. The universal grid becomes the common language between heterogeneous sensor types.'],
              ['🧠','Consciousness Research','EEG/fMRI temporal patterns mapped to the grid could reveal cross-species consciousness signatures. The consciousness adapter already models encephalization quotients and neural density. With real brain data, the interference architecture could detect consciousness markers.'],
            ].map(([icon,title,desc])=>(
              <div key={title} className="flex gap-4">
                <span className="text-2xl mt-1">{icon}</span>
                <div>
                  <h3 className="text-sm font-bold">{title}</h3>
                  <p className="text-[10px] text-gray-600 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="border-l-4 border-amber-400 pl-4 text-sm italic text-gray-600">
            "All domains are wavelengths of the same universal temporal signal. When chess patterns match market patterns match biological patterns, that's constructive interference. The math is identical."
          </div>
        </Page>

        {/* PAGE 18: CLOSING */}
        <Page className="flex flex-col items-center justify-center text-center">
          <h1 className="text-5xl font-black tracking-tight mb-4">En Pensent</h1>
          <p className="text-lg text-gray-400 mb-12">Universal Temporal Pattern Recognition</p>
          <div className="w-48 h-px bg-gray-200 mb-12" />
          <div className="grid grid-cols-2 gap-8 text-left max-w-md mb-12">
            <div>
              <p className="text-xs font-bold mb-1">Author</p>
              <p className="text-xs text-gray-500">Alec Arthur Shelton</p>
            </div>
            <div>
              <p className="text-xs font-bold mb-1">Organization</p>
              <p className="text-xs text-gray-500">En Pensent Technologies</p>
            </div>
            <div>
              <p className="text-xs font-bold mb-1">Website</p>
              <p className="text-xs text-gray-500">enpensent.com</p>
            </div>
            <div>
              <p className="text-xs font-bold mb-1">Status</p>
              <p className="text-xs text-gray-500">Patent Pending · Feb 2026</p>
            </div>
          </div>
          <div className="max-w-lg text-xs text-gray-400 leading-relaxed mb-8">
            6 domains validated. 590,988+ chess predictions. F1 93.3% chemical fault detection. 
            Zero fake data in production. Self-learning architecture. 24/7 operation. 
            Silicon photonics hardware roadmap. The universal grid's constraint is not a limitation — 
            it's the mechanism that makes cross-domain pattern recognition possible.
          </div>
          <p className="text-xs text-gray-300">© 2026 En Pensent Technologies. All rights reserved.</p>
        </Page>
      </main>

      <style>{`
        @media print {
          header, .print\\:hidden { display: none !important; }
          .wp-page { page-break-after: always; padding: 0.75in; min-height: auto; }
          .wp-page:last-child { page-break-after: avoid; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
        @page { size: letter; margin: 0; }
      `}</style>
    </div>
  );
}
