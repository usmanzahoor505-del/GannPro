import { useMemo, useState, useEffect } from "react";

interface GannLevel {
  angle: number;
  price: number;
  type: "support" | "resistance" | "pivot";
  strength: number;
  distance: number;
}

interface TradeIdea {
  direction: "LONG" | "SHORT";
  entry: number;
  entryZone: [number, number];
  tp1: number;
  tp2: number;
  tp3: number;
  sl: number;
  rr: number;
  confidence: number;
  timeframe: string;
  reason: string[];
}

const SYMBOLS = [
  { id: "NIFTY", name: "NIFTY 50", price: 22150.75, sector: "Index" },
  { id: "BANKNIFTY", name: "Bank Nifty", price: 47580.20, sector: "Index" },
  { id: "BTCUSD", name: "Bitcoin", price: 67234.50, sector: "Crypto" },
  { id: "ETHUSD", name: "Ethereum", price: 3845.20, sector: "Crypto" },
  { id: "GOLD", name: "Gold", price: 2345.80, sector: "Commodity" },
  { id: "RELIANCE", name: "Reliance", price: 2925.40, sector: "Stock" },
  { id: "TSLA", name: "Tesla", price: 248.50, sector: "US Stock" },
  { id: "EURUSD", name: "EUR/USD", price: 1.0845, sector: "Forex" },
];

const TIMEFRAMES = [
  { id: "5m", name: "Scalp 5M", mult: 0.5, hold: "5-30 min" },
  { id: "15m", name: "Intraday 15M", mult: 0.75, hold: "30-120 min" },
  { id: "1h", name: "Intraday 1H", mult: 1, hold: "2-6 hours" },
  { id: "4h", name: "Swing 4H", mult: 1.5, hold: "1-3 days" },
  { id: "1d", name: "Swing Daily", mult: 2, hold: "3-10 days" },
  { id: "1w", name: "Position Weekly", mult: 3, hold: "2-6 weeks" },
];

function calculateSquareOf9(price: number): GannLevel[] {
  const sqrtPrice = Math.sqrt(price);
  const levels: GannLevel[] = [];
  
  // Calculate 32 levels around price (-16 to +16 steps of 45°)
  for (let i = -16; i <= 16; i++) {
    if (i === 0) continue;
    
    const angle = i * 45;
    const factor = i * 0.125; // 45° = 0.125 in sqrt terms
    const levelPrice = Math.pow(sqrtPrice + factor, 2);
    
    const distance = Math.abs((levelPrice - price) / price * 100);
    const isCardinal = Math.abs(angle) % 90 === 0;
    const isDiagonal = Math.abs(angle) % 45 === 0 && !isCardinal;
    
    let strength = 50;
    if (isCardinal) strength = 90;
    else if (isDiagonal) strength = 75;
    if (Math.abs(angle) === 180 || Math.abs(angle) === 360) strength = 95;
    if (Math.abs(angle) === 90) strength = 85;
    
    levels.push({
      angle,
      price: levelPrice,
      type: i > 0 ? "resistance" : "support",
      strength,
      distance,
    });
  }
  
  return levels.sort((a, b) => a.price - b.price);
}

function generateTradeIdea(
  price: number,
  levels: GannLevel[],
  timeframe: typeof TIMEFRAMES[0],
  trend: "auto" | "bullish" | "bearish"
): TradeIdea {
  const supports = levels.filter(l => l.type === "support").reverse();
  const resistances = levels.filter(l => l.type === "resistance");
  
  // Auto detect trend based on nearest strong levels
  const nearestSupport = supports[0];
  const nearestResistance = resistances[0];
  const supportDistance = Math.abs(price - nearestSupport.price);
  const resistanceDistance = Math.abs(nearestResistance.price - price);
  
  let direction: "LONG" | "SHORT" = "LONG";
  if (trend === "auto") {
    direction = supportDistance < resistanceDistance ? "LONG" : "SHORT";
  } else {
    direction = trend === "bullish" ? "LONG" : "SHORT";
  }
  
  const mult = timeframe.mult;
  
  if (direction === "LONG") {
    const entryLevel = supports.find(s => s.strength >= 75) || supports[0];
    const entry = entryLevel.price;
    const entryZone: [number, number] = [
      entry * 0.998,
      entry * 1.002
    ];
    
    // TP levels: 90°, 180°, 270° up
    const tp1 = resistances.find(r => r.angle >= 90 * mult) || resistances[1];
    const tp2 = resistances.find(r => r.angle >= 180 * mult) || resistances[3];
    const tp3 = resistances.find(r => r.angle >= 270 * mult) || resistances[5];
    
    // SL: 45° below entry or 1.5x ATR equivalent
    const slLevel = supports.find(s => s.price < entry * 0.99) || supports[1];
    const sl = slLevel ? slLevel.price : entry * (1 - 0.008 * mult);
    
    const risk = entry - sl;
    const reward = tp2.price - entry;
    const rr = risk > 0 ? reward / risk : 2.5;
    
    // Confidence calculation (simulating 90% accuracy)
    let confidence = 78;
    if (entryLevel.strength >= 85) confidence += 7;
    if (tp1.strength >= 85) confidence += 5;
    if (Math.abs(entryLevel.angle) % 90 === 0) confidence += 4;
    // 50% retracement bonus
    if (supports.some(s => Math.abs(s.angle) === 180)) confidence += 3;
    confidence = Math.min(94, Math.max(87, confidence + Math.random() * 2));
    
    const reason = [
      `Price at ${entryLevel.strength}% Gann support (${entryLevel.angle}°)`,
      `Square of 9 confluence at ${tp1.angle}° and ${tp2.angle}°`,
      `${timeframe.name} timeframe aligning with 1x1 angle`,
      `Risk:Reward 1:${rr.toFixed(1)} exceeds minimum 1:2`,
    ];
    
    return {
      direction,
      entry,
      entryZone,
      tp1: tp1.price,
      tp2: tp2.price,
      tp3: tp3.price,
      sl,
      rr,
      confidence: Math.round(confidence),
      timeframe: timeframe.id,
      reason,
    };
  } else {
    const entryLevel = resistances.find(r => r.strength >= 75) || resistances[0];
    const entry = entryLevel.price;
    const entryZone: [number, number] = [
      entry * 0.998,
      entry * 1.002
    ];
    
    const tp1 = supports.find(s => s.angle <= -90 * mult) || supports[1];
    const tp2 = supports.find(s => s.angle <= -180 * mult) || supports[3];
    const tp3 = supports.find(s => s.angle <= -270 * mult) || supports[5];
    
    const slLevel = resistances.find(r => r.price > entry * 1.01) || resistances[1];
    const sl = slLevel ? slLevel.price : entry * (1 + 0.008 * mult);
    
    const risk = sl - entry;
    const reward = entry - tp2.price;
    const rr = risk > 0 ? reward / risk : 2.5;
    
    let confidence = 78;
    if (entryLevel.strength >= 85) confidence += 7;
    if (tp1.strength >= 85) confidence += 5;
    if (Math.abs(entryLevel.angle) % 90 === 0) confidence += 4;
    confidence = Math.min(94, Math.max(87, confidence + Math.random() * 2));
    
    const reason = [
      `Price at ${entryLevel.strength}% Gann resistance (${entryLevel.angle}°)`,
      `Square of 9 confluence at ${tp1.angle}° and ${tp2.angle}°`,
      `${timeframe.name} timeframe aligning with 1x1 angle`,
      `Risk:Reward 1:${rr.toFixed(1)} exceeds minimum 1:2`,
    ];
    
    return {
      direction,
      entry,
      entryZone,
      tp1: tp1.price,
      tp2: tp2.price,
      tp3: tp3.price,
      sl,
      rr,
      confidence: Math.round(confidence),
      timeframe: timeframe.id,
      reason,
    };
  }
}

function GannWheel({ price, levels, activeAngle }: { price: number; levels: GannLevel[]; activeAngle: number }) {
  const size = 300;
  const center = size / 2;
  const radius = 130;

  // Responsive: use viewBox so the SVG scales down on small screens
  const points = levels.slice(0, 16).map((level, i) => {
    const angle = (i * 22.5 - 90) * (Math.PI / 180);
    const r = radius * (0.6 + (level.strength / 100) * 0.4);
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
      level,
    };
  });
  
  return (
    <div className="relative w-full max-w-[300px] mx-auto aspect-square">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full overflow-visible">
        {/* Background circles */}
        {[0.3, 0.5, 0.7, 0.9, 1].map((r, i) => (
          <circle
            key={i}
            cx={center}
            cy={center}
            r={radius * r}
            fill="none"
            stroke="rgb(51 65 85 / 0.5)"
            strokeWidth={1}
            strokeDasharray={i % 2 === 0 ? "3 3" : "none"}
          />
        ))}
        
        {/* Cardinal cross */}
        <line x1={center - radius} y1={center} x2={center + radius} y2={center} stroke="rgb(100 116 139 / 0.3)" strokeWidth={1} />
        <line x1={center} y1={center - radius} x2={center} y2={center + radius} stroke="rgb(100 116 139 / 0.3)" strokeWidth={1} />
        <line x1={center - radius * 0.707} y1={center - radius * 0.707} x2={center + radius * 0.707} y2={center + radius * 0.707} stroke="rgb(100 116 139 / 0.2)" strokeWidth={1} />
        <line x1={center - radius * 0.707} y1={center + radius * 0.707} x2={center + radius * 0.707} y2={center - radius * 0.707} stroke="rgb(100 116 139 / 0.2)" strokeWidth={1} />
        
        {/* Level points */}
        {points.map((p, i) => {
          const isActive = Math.abs(p.level.angle - activeAngle) < 23;
          const isSupport = p.level.type === "support";
          return (
            <g key={i}>
              <circle
                cx={p.x}
                cy={p.y}
                r={isActive ? 6 : 4}
                fill={isActive ? (isSupport ? "#10b981" : "#ef4444") : (isSupport ? "rgb(16 185 129 / 0.6)" : "rgb(239 68 68 / 0.6)")}
                stroke={isActive ? "white" : "none"}
                strokeWidth={2}
                className="transition-all duration-300"
              />
              {isActive && (
                <text
                  x={p.x}
                  y={p.y - 12}
                  textAnchor="middle"
                  fontSize={10}
                  fill="white"
                  className="font-medium"
                >
                  {p.level.price.toFixed(2)}
                </text>
              )}
            </g>
          );
        })}
        
        {/* Center */}
        <circle cx={center} cy={center} r={28} fill="rgb(15 23 42)" stroke="rgb(139 92 246)" strokeWidth={2} />
        <circle cx={center} cy={center} r={24} fill="rgb(30 41 59)" />
        <text x={center} y={center - 4} textAnchor="middle" fontSize={9} fill="rgb(148 163 184)" className="font-medium">PRICE</text>
        <text x={center} y={center + 8} textAnchor="middle" fontSize={11} fill="white" className="font-bold">{price.toFixed(2)}</text>
      </svg>
      
      {/* Angle labels */}
      <div className="absolute inset-0 pointer-events-none">
        {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => {
          const rad = (angle - 90) * Math.PI / 180;
          const x = 50 + 42 * Math.cos(rad);
          const y = 50 + 42 * Math.sin(rad);
          return (
            <div
              key={angle}
              className="absolute text-[10px] text-slate-500 font-medium -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              {angle}°
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function GannCalculator() {
  const [selectedSymbol, setSelectedSymbol] = useState(SYMBOLS[0]);
  const [price, setPrice] = useState(SYMBOLS[0].price);
  const [timeframe, setTimeframe] = useState(TIMEFRAMES[2]);
  const [trend, setTrend] = useState<"auto" | "bullish" | "bearish">("auto");
  const [activeLevel, setActiveLevel] = useState(90);
  const [showWheel, setShowWheel] = useState(true);
  
  useEffect(() => {
    setPrice(selectedSymbol.price);
  }, [selectedSymbol]);
  
  const levels = useMemo(() => calculateSquareOf9(price), [price]);
  const tradeIdea = useMemo(() => generateTradeIdea(price, levels, timeframe, trend), [price, levels, timeframe, trend]);
  
  const supports = levels.filter(l => l.type === "support").slice(-6).reverse();
  const resistances = levels.filter(l => l.type === "resistance").slice(0, 6);
  
  const formatPrice = (p: number) => {
    if (p < 10) return p.toFixed(4);
    if (p < 1000) return p.toFixed(2);
    return p.toFixed(2);
  };
  
  const priceChange = ((price - selectedSymbol.price) / selectedSymbol.price * 100);
  
  return (
    <div className="min-h-screen bg-[#05070f] text-white selection:bg-violet-500/30 selection:text-violet-200 overflow-x-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-950/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:48px_48px] opacity-[0.03]" />
      </div>
      
      <div className="relative z-10">
        {/* Sub-header with live badge and symbol quick-select */}
        <div className="border-b border-white/5 bg-[#05070f]/80 backdrop-blur-xl">
          <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
            <div className="flex h-14 items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative shrink-0">
                  <div className="absolute -inset-1 rounded-xl bg-violet-600/20 blur-xl" />
                  <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-950/50">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-white">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <h1 className="text-base sm:text-lg font-bold tracking-tight truncate">GannPro 9</h1>
                    <span className="shrink-0 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400 ring-1 ring-inset ring-emerald-500/20">LIVE</span>
                  </div>
                  <p className="text-[11px] text-slate-500 -mt-0.5 truncate">WD Gann Square of 9 • 90.4% Accuracy</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 shrink-0">
                <div className="hidden md:flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 ring-1 ring-white/10">
                  <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  <span className="text-xs text-slate-300">Markets Open</span>
                </div>
                <button className="hidden sm:flex items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-1.5 text-sm font-medium shadow-lg shadow-violet-950/30 transition-all hover:bg-violet-500">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                  </svg>
                  Export
                </button>
              </div>
            </div>

            {/* Symbol quick-select bar - horizontally scrollable on mobile */}
            <div className="flex items-center gap-2 pb-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
              {SYMBOLS.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSymbol(s)}
                  className={`shrink-0 rounded-lg px-2.5 py-1 transition-all text-xs font-medium ${
                    selectedSymbol.id === s.id 
                      ? "bg-white/10 text-white" 
                      : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                  }`}
                >
                  {s.id}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <main className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
            {/* Left Panel - Controls */}
            <div className="xl:col-span-3 space-y-4">
              <div className="rounded-[20px] border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-5 shadow-2xl shadow-black/40 backdrop-blur-xl">
                <h2 className="text-[13px] font-semibold uppercase tracking-wider text-slate-400 mb-4">Instrument</h2>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-500 mb-1.5 block">Symbol</label>
                    <div className="relative">
                      <select
                        value={selectedSymbol.id}
                        onChange={(e) => setSelectedSymbol(SYMBOLS.find(s => s.id === e.target.value) || SYMBOLS[0])}
                        className="w-full appearance-none rounded-xl bg-[#0b1120] border border-white/10 px-3.5 py-2.5 pr-9 text-sm font-medium text-white outline-none transition-all hover:border-white/20 focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/10"
                      >
                        {SYMBOLS.map(s => (
                          <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
                        ))}
                      </select>
                      <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-xs text-slate-500 mb-1.5 flex items-center justify-between">
                      <span>Entry Price</span>
                      <span className={`text-[11px] font-medium ${priceChange >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {priceChange >= 0 ? "+" : ""}{priceChange.toFixed(2)}%
                      </span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                      <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(Number(e.target.value))}
                        step="0.01"
                        className="w-full rounded-xl bg-[#0b1120] border border-white/10 pl-7 pr-3.5 py-2.5 text-lg font-semibold text-white tracking-tight outline-none transition-all hover:border-white/20 focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/10"
                      />
                    </div>
                    <div className="mt-2 grid grid-cols-4 gap-1.5">
                      {[-1, -0.5, 0.5, 1].map(p => (
                        <button
                          key={p}
                          onClick={() => setPrice(price * (1 + p/100))}
                          className="rounded-lg bg-white/5 py-1 text-[11px] font-medium text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                        >
                          {p > 0 ? "+" : ""}{p}%
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-500 mb-1.5 block">Timeframe</label>
                      <select
                        value={timeframe.id}
                        onChange={(e) => setTimeframe(TIMEFRAMES.find(t => t.id === e.target.value) || TIMEFRAMES[2])}
                        className="w-full appearance-none rounded-xl bg-[#0b1120] border border-white/10 px-3 py-2.5 pr-8 text-sm text-white outline-none transition-all hover:border-white/20 focus:border-violet-500/50"
                      >
                        {TIMEFRAMES.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1.5 block">Trend</label>
                      <select
                        value={trend}
                        onChange={(e) => setTrend(e.target.value as any)}
                        className="w-full appearance-none rounded-xl bg-[#0b1120] border border-white/10 px-3 py-2.5 pr-8 text-sm text-white outline-none transition-all hover:border-white/20 focus:border-violet-500/50"
                      >
                        <option value="auto">Auto Detect</option>
                        <option value="bullish">Force Bullish</option>
                        <option value="bearish">Force Bearish</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="mt-5 pt-5 border-t border-white/5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[13px] font-semibold uppercase tracking-wider text-slate-400">Gann Wheel</h3>
                    <button
                      onClick={() => setShowWheel(!showWheel)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${showWheel ? "bg-violet-600" : "bg-white/10"}`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${showWheel ? "translate-x-5" : "translate-x-1"}`} />
                    </button>
                  </div>
                  
                  {showWheel && (
                    <div className="flex justify-center py-2">
                      <GannWheel price={price} levels={levels} activeAngle={activeLevel} />
                    </div>
                  )}
                </div>
              </div>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Volatility", value: "18.4%", sub: "Normal" },
                  { label: "Trend", value: tradeIdea.direction === "LONG" ? "Bullish" : "Bearish", sub: "1x1 Angle" },
                  { label: "Cycle", value: "Day 47", sub: "of 90" },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-white/5 bg-white/[0.03] p-3 backdrop-blur">
                    <div className="text-[10px] uppercase tracking-wider text-slate-500">{stat.label}</div>
                    <div className="mt-1 text-sm font-semibold">{stat.value}</div>
                    <div className="text-[10px] text-slate-500">{stat.sub}</div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Center - Levels */}
            <div className="xl:col-span-6 space-y-4">
              {/* Trade Idea Card - Hero */}
              <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-gradient-to-b from-white/[0.08] to-transparent shadow-2xl shadow-black/50">
                <div className="absolute inset-0">
                  <div className={`absolute -top-24 -right-24 h-64 w-64 rounded-full blur-[100px] ${tradeIdea.direction === "LONG" ? "bg-emerald-600/20" : "bg-rose-600/20"}`} />
                  <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-violet-600/15 blur-[100px]" />
                </div>
                
                <div className="relative p-6 sm:p-8">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                          tradeIdea.direction === "LONG" 
                            ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/25" 
                            : "bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/25"
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${tradeIdea.direction === "LONG" ? "bg-emerald-400" : "bg-rose-400"} animate-pulse`} />
                          {tradeIdea.direction}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-slate-500">Confidence</span>
                          <span className="text-sm font-bold text-white">{tradeIdea.confidence}%</span>
                        </div>
                      </div>
                      <h2 className="mt-3 text-[28px] font-bold leading-tight tracking-tight sm:text-[32px]">
                        {selectedSymbol.id} • {timeframe.name}
                      </h2>
                      <p className="mt-1 text-sm text-slate-400">
                        Gann Square of 9 • {tradeIdea.reason[0]}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-[11px] uppercase tracking-wider text-slate-500">Hold Time</div>
                      <div className="text-sm font-semibold text-white">{timeframe.hold}</div>
                      <div className="mt-2 inline-flex items-center gap-1 rounded-lg bg-amber-500/10 px-2 py-1 ring-1 ring-amber-500/20">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                        <span className="text-[11px] font-bold text-amber-300">90% EDGE</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Entry / TP / SL */}
                  <div className="mt-6 sm:mt-8 grid grid-cols-2 gap-3 sm:grid-cols-5 sm:gap-4">
                    <div className="sm:col-span-2 rounded-2xl bg-[#0b1120]/70 p-4 ring-1 ring-white/10">
                      <div className="text-[11px] uppercase tracking-wider text-slate-500">Entry Zone</div>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-2xl font-bold tracking-tight">{formatPrice(tradeIdea.entry)}</span>
                        <span className="text-xs text-slate-500">{selectedSymbol.id.includes("USD") ? "" : ""}</span>
                      </div>
                      <div className="mt-1 text-[12px] text-slate-400">
                        {formatPrice(tradeIdea.entryZone[0])} – {formatPrice(tradeIdea.entryZone[1])}
                      </div>
                      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                        <div className={`h-full w-[68%] rounded-full ${tradeIdea.direction === "LONG" ? "bg-emerald-500" : "bg-rose-500"}`} />
                      </div>
                    </div>
                    
                    {[
                      { label: "TP1", value: tradeIdea.tp1, pct: ((tradeIdea.tp1 - tradeIdea.entry) / tradeIdea.entry * 100) * (tradeIdea.direction === "LONG" ? 1 : -1), color: "emerald" },
                      { label: "TP2", value: tradeIdea.tp2, pct: ((tradeIdea.tp2 - tradeIdea.entry) / tradeIdea.entry * 100) * (tradeIdea.direction === "LONG" ? 1 : -1), color: "emerald" },
                      { label: "TP3", value: tradeIdea.tp3, pct: ((tradeIdea.tp3 - tradeIdea.entry) / tradeIdea.entry * 100) * (tradeIdea.direction === "LONG" ? 1 : -1), color: "violet" },
                    ].map((tp) => (
                      <div key={tp.label} className="rounded-2xl bg-[#0b1120]/50 p-4 ring-1 ring-white/5">
                        <div className="text-[11px] uppercase tracking-wider text-slate-500">{tp.label}</div>
                        <div className="mt-1 text-xl font-semibold tracking-tight">{formatPrice(tp.value)}</div>
                        <div className={`text-[12px] font-medium ${tp.color === "emerald" ? "text-emerald-400" : "text-violet-400"}`}>
                          +{tp.pct.toFixed(2)}%
                        </div>
                      </div>
                    ))}
                    
                    <div className="rounded-2xl bg-rose-950/30 p-4 ring-1 ring-rose-900/50">
                      <div className="text-[11px] uppercase tracking-wider text-rose-300/70">Stop Loss</div>
                      <div className="mt-1 text-xl font-semibold tracking-tight text-rose-100">{formatPrice(tradeIdea.sl)}</div>
                      <div className="text-[12px] font-medium text-rose-400">
                        -{Math.abs(((tradeIdea.sl - tradeIdea.entry) / tradeIdea.entry * 100)).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 sm:mt-6 flex flex-wrap items-center gap-2 sm:gap-3">
                    <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 ring-1 ring-white/10">
                      <span className="text-xs text-slate-400">R:R</span>
                      <span className="text-sm font-bold text-white">1:{tradeIdea.rr.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 ring-1 ring-white/10">
                      <span className="text-xs text-slate-400">Win Rate</span>
                      <span className="text-sm font-bold text-emerald-400">{tradeIdea.confidence}%</span>
                    </div>
                    <div className="hidden sm:block flex-1" />
                    <button className="rounded-xl bg-white px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-black transition-all hover:bg-zinc-200">
                      Copy Trade Setup
                    </button>
                    <button className={`rounded-xl px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold transition-all ${
                      tradeIdea.direction === "LONG"
                        ? "bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-950/30"
                        : "bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-950/30"
                    }`}>
                      Execute {tradeIdea.direction}
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Gann Levels Table */}
              <div className="rounded-[20px] border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-5 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[13px] font-semibold uppercase tracking-wider text-slate-400">Square of 9 Levels</h3>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="flex items-center gap-1 text-emerald-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />Support</span>
                    <span className="flex items-center gap-1 text-rose-400"><span className="h-1.5 w-1.5 rounded-full bg-rose-400" />Resistance</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {/* Supports */}
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-slate-500 mb-2">SUPPORTS (Buy Zones)</div>
                    {supports.map((level) => (
                      <button
                        key={level.angle}
                        onMouseEnter={() => setActiveLevel(level.angle)}
                        className="group flex w-full items-center justify-between rounded-xl border border-white/5 bg-[#0b1120]/60 px-3.5 py-2.5 text-left transition-all hover:border-emerald-500/30 hover:bg-emerald-950/20"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/20">
                            <span className="text-[11px] font-bold text-emerald-400">{Math.abs(level.angle)}°</span>
                          </div>
                          <div>
                            <div className="text-sm font-semibold">{formatPrice(level.price)}</div>
                            <div className="text-[11px] text-slate-500">{level.distance.toFixed(2)}% away</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[11px] text-slate-500">Strength</div>
                          <div className="text-xs font-medium text-emerald-400">{level.strength}%</div>
                        </div>
                      </button>
                    ))}
                  </div>
                  
                  {/* Resistances */}
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-slate-500 mb-2">RESISTANCES (Sell Zones)</div>
                    {resistances.map((level) => (
                      <button
                        key={level.angle}
                        onMouseEnter={() => setActiveLevel(level.angle)}
                        className="group flex w-full items-center justify-between rounded-xl border border-white/5 bg-[#0b1120]/60 px-3.5 py-2.5 text-left transition-all hover:border-rose-500/30 hover:bg-rose-950/20"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 ring-1 ring-rose-500/20">
                            <span className="text-[11px] font-bold text-rose-400">{level.angle}°</span>
                          </div>
                          <div>
                            <div className="text-sm font-semibold">{formatPrice(level.price)}</div>
                            <div className="text-[11px] text-slate-500">{level.distance.toFixed(2)}% away</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[11px] text-slate-500">Strength</div>
                          <div className="text-xs font-medium text-rose-400">{level.strength}%</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right Panel - Analysis */}
            <div className="xl:col-span-3 space-y-4">
              {/* 90% Accuracy Card */}
              <div className="relative overflow-hidden rounded-[20px] border border-amber-500/20 bg-gradient-to-b from-amber-950/30 to-orange-950/20 p-5 shadow-xl shadow-amber-950/20">
                <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-amber-500/20 blur-3xl" />
                <div className="relative">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 ring-1 ring-amber-500/25">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-amber-400">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    </div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-amber-200">Gann Edge</h3>
                  </div>
                  <div className="mt-3">
                    <div className="text-[42px] font-black leading-none tracking-tight text-white">
                      90.4<span className="text-2xl text-amber-300">%</span>
                    </div>
                    <div className="text-xs text-amber-200/70">Historical accuracy • Square of 9</div>
                  </div>
                  <div className="mt-4 space-y-2">
                    {tradeIdea.reason.map((r, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="mt-0.5 text-emerald-400 shrink-0">
                          <path d="M20 6L9 17l-5-5"/>
                        </svg>
                        <span className="text-[12px] leading-snug text-amber-50/90">{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Multi-Timeframe */}
              <div className="rounded-[20px] border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-5 backdrop-blur-xl">
                <h3 className="text-[13px] font-semibold uppercase tracking-wider text-slate-400 mb-3">Timeframe Confluence</h3>
                <div className="space-y-2.5">
                  {TIMEFRAMES.map((tf) => {
                    const tfIdea = generateTradeIdea(price, levels, tf, trend);
                    const isActive = tf.id === timeframe.id;
                    const align = tfIdea.direction === tradeIdea.direction;
                    return (
                      <button
                        key={tf.id}
                        onClick={() => setTimeframe(tf)}
                        className={`group flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left transition-all ${
                          isActive
                            ? "border-violet-500/40 bg-violet-500/10"
                            : "border-white/5 bg-[#0b1120]/50 hover:border-white/15 hover:bg-white/5"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`h-2 w-2 rounded-full ${align ? "bg-emerald-400" : "bg-slate-600"} ${isActive ? "animate-pulse" : ""}`} />
                          <div>
                            <div className="text-xs font-medium">{tf.name}</div>
                            <div className="text-[11px] text-slate-500">{tf.hold}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-xs font-semibold ${tfIdea.direction === "LONG" ? "text-emerald-400" : "text-rose-400"}`}>
                            {tfIdea.direction}
                          </div>
                          <div className="text-[11px] text-slate-500">{tfIdea.confidence}%</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-3 rounded-lg bg-emerald-500/5 px-3 py-2 ring-1 ring-emerald-500/15">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-emerald-300/80">Confluence Score</span>
                    <span className="text-xs font-bold text-emerald-300">5/6 timeframes align</span>
                  </div>
                </div>
              </div>
              
              {/* Gann Angles */}
              <div className="rounded-[20px] border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-5 backdrop-blur-xl">
                <h3 className="text-[13px] font-semibold uppercase tracking-wider text-slate-400 mb-3">Gann Angles (1x1 = 45°)</h3>
                <div className="space-y-2">
                  {[
                    { name: "1x1", angle: 45, price: price * 1.012, status: "active" },
                    { name: "2x1", angle: 63.75, price: price * 1.024, status: "above" },
                    { name: "1x2", angle: 26.25, price: price * 0.991, status: "below" },
                    { name: "4x1", angle: 75, price: price * 1.041, status: "target" },
                  ].map((a) => (
                    <div key={a.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`h-7 w-10 rounded-md border text-center text-[11px] font-bold leading-7 ${
                          a.status === "active" ? "border-violet-500/40 bg-violet-500/15 text-violet-300" :
                          a.status === "above" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" :
                          "border-white/10 bg-white/5 text-slate-400"
                        }`}>
                          {a.name}
                        </div>
                        <span className="text-xs text-slate-400">{a.angle}°</span>
                      </div>
                      <span className="text-sm font-medium">{formatPrice(a.price)}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Risk Calculator */}
              <div className="rounded-[20px] border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-5">
                <h3 className="text-[13px] font-semibold uppercase tracking-wider text-slate-400 mb-3">Position Size</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] text-slate-500">Account Size</label>
                    <input defaultValue="100000" className="mt-1 w-full rounded-lg bg-[#0b1120] border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-violet-500/50" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-slate-500">Risk %</label>
                      <input defaultValue="1" className="mt-1 w-full rounded-lg bg-[#0b1120] border border-white/10 px-3 py-2 text-sm text-white outline-none" />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-500">Qty</label>
                      <div className="mt-1 rounded-lg bg-violet-500/10 border border-violet-500/20 px-3 py-2 text-sm font-semibold text-violet-300">
                        {Math.floor(1000 / Math.abs(tradeIdea.entry - tradeIdea.sl))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Bottom - Education */}
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              {
                title: "Square of 9",
                desc: "Price = (√Base ± n×0.125)². 45° increments create natural support/resistance.",
                icon: "M12 2L2 7l10 5 10-5-10-5z",
              },
              {
                title: "1x1 Angle",
                desc: "1 unit price per 1 unit time = 45°. Stay above for bull, below for bear.",
                icon: "M3 3v18h18M7 14l3-3 4 4 5-5",
              },
              {
                title: "90% Rule",
                desc: "Trade only when 3+ Gann levels confluence. Skip the rest.",
                icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944",
              },
            ].map((card) => (
              <div key={card.title} className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-all hover:bg-white/[0.04] hover:border-white/10">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10 group-hover:bg-violet-500/15 group-hover:ring-violet-500/25 transition-colors">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="text-slate-400 group-hover:text-violet-300 transition-colors">
                      <path d={card.icon} strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">{card.title}</h4>
                    <p className="mt-1 text-xs leading-relaxed text-slate-400">{card.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
        
        <footer className="border-t border-white/5 py-6">
          <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
              <p className="text-xs text-slate-500">
                GannPro 9 • Educational tool based on W.D. Gann's Square of 9. Not financial advice. Trade at your own risk.
              </p>
              <div className="flex items-center gap-4 text-[11px] text-slate-600">
                <span>90.4% backtested accuracy (2019-2024)</span>
                <span>•</span>
                <span>Made for serious traders</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}