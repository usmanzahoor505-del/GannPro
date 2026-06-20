import type { GannResult } from '../utils/gannCalculator';

interface GannResultsProps {
  result: GannResult;
  input: { prevHigh: number; prevLow: number; prevClose: number; todayOpen: number };
}

function SignalBadge({ direction, strength }: { direction: string; strength: string }) {
  const colors: Record<string, string> = {
    BUY: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    SELL: 'bg-red-500/20 text-red-300 border-red-500/30',
    NEUTRAL: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  };
  const strengthColors: Record<string, string> = {
    STRONG: 'ring-2 ring-emerald-400/30',
    MODERATE: 'ring-2 ring-blue-400/20',
    WEAK: '',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
        colors[direction] || ''
      } ${strengthColors[strength] || ''}`}
    >
      {direction === 'BUY' && (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        </svg>
      )}
      {direction === 'SELL' && (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      )}
      {direction} {strength !== 'WEAK' ? `(${strength})` : ''}
    </span>
  );
}

function StatCard({
  label,
  value,
  color = 'text-white',
  sub,
}: {
  label: string;
  value: string | number;
  color?: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border border-gray-700/40 bg-gray-800/60 p-3">
      <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-0.5">{label}</p>
      <p className={`text-sm font-bold ${color}`}>{value}</p>
      {sub && <p className="text-[10px] text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}

function LevelBar({ label, value, type, isActive = false }: { label: string; value: number; type: 'support' | 'resistance' | 'pivot'; isActive?: boolean }) {
  const colors = {
    support: 'border-green-500/30 bg-green-500/10 text-green-300',
    resistance: 'border-red-500/30 bg-red-500/10 text-red-300',
    pivot: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300',
  };

  return (
    <div
      className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-all duration-200 ${
        colors[type]
      } ${isActive ? 'ring-2 ring-white/20 scale-[1.02]' : ''}`}
    >
      <span className="font-medium">{label}</span>
      <span className="font-bold tabular-nums">{value.toFixed(2)}</span>
    </div>
  );
}

export default function GannResults({ result, input }: GannResultsProps) {
  const { pivot, range, signal, reversal, rangeBasedLevels, squareOf9Levels, tradingLevels, biasPrediction } = result;

  const isBullish = signal.direction === 'BUY';

  return (
    <div className="space-y-5">
      {/* Header Signal */}
      <div
        className={`rounded-xl border p-4 ${
          isBullish
            ? 'border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-teal-500/5'
            : signal.direction === 'SELL'
            ? 'border-red-500/30 bg-gradient-to-r from-red-500/10 to-rose-500/5'
            : 'border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 to-amber-500/5'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Actionable Signal</p>
            <h3 className="text-lg font-bold text-white mt-0.5">
              {signal.direction === 'BUY'
                ? '🟢 BUY SIGNAL'
                : signal.direction === 'SELL'
                ? '🔴 SELL SIGNAL'
                : '🟡 NEUTRAL'}
            </h3>
          </div>
          <SignalBadge direction={signal.direction} strength={signal.strength} />
        </div>
        <p className="text-xs text-gray-400 leading-relaxed">{signal.reason}</p>
      </div>

      {/* Key Levels Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <StatCard label="Gann Pivot" value={pivot.toFixed(2)} color="text-yellow-300" sub="(H+L+C)/3" />
        <StatCard label="Daily Range" value={range.toFixed(2)} color="text-blue-300" sub="H - L" />
        <StatCard label="Bias Prediction" value={biasPrediction.overall} color={isBullish ? 'text-emerald-300' : 'text-red-300'} sub={`${biasPrediction.confidence}% confidence`} />
        <StatCard label="Position" value={input.todayOpen > pivot ? 'Above Pivot' : input.todayOpen < pivot ? 'Below Pivot' : 'At Pivot'} color={isBullish ? 'text-emerald-300' : 'text-red-300'} />
      </div>

      {/* Bias Prediction Factors */}
      <div className="rounded-xl border border-gray-700/40 bg-gray-800/30 p-4">
        <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-3">📊 Bias Analysis Factors</h4>
        <div className="space-y-2">
          {biasPrediction.factors.map((f, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${f.bullish ? 'bg-emerald-400' : 'bg-red-400'}`} />
                <span className="text-gray-300">{f.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-medium ${f.bullish ? 'text-emerald-400' : 'text-red-400'}`}>
                  {f.bullish ? 'Bullish' : 'Bearish'}
                </span>
                <span className="text-gray-500 w-5 text-right">{f.weight}%</span>
              </div>
            </div>
          ))}
          <div className="border-t border-gray-700/40 pt-2 mt-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-200">Overall Confidence</span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-1.5 rounded-full bg-gray-700 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    biasPrediction.confidence >= 65 ? 'bg-emerald-400' : biasPrediction.confidence <= 35 ? 'bg-red-400' : 'bg-yellow-400'
                  }`}
                  style={{ width: `${biasPrediction.confidence}%` }}
                />
              </div>
              <span className="text-xs font-bold text-white">{biasPrediction.confidence}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Support & Resistance Levels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl border border-gray-700/40 bg-gray-800/30 p-4">
          <h4 className="text-xs font-semibold text-red-300 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            Resistance Levels
          </h4>
          <div className="space-y-1.5">
            <LevelBar label="R4 (180° Major)" value={rangeBasedLevels.r4} type="resistance" />
            <LevelBar label="R3 (135°)" value={rangeBasedLevels.r3} type="resistance" />
            <LevelBar label="R2 (90°)" value={rangeBasedLevels.r2} type="resistance" />
            <LevelBar label="R1 (45°)" value={rangeBasedLevels.r1} type="resistance" />
          </div>
        </div>

        <div className="rounded-xl border border-gray-700/40 bg-gray-800/30 p-4">
          <h4 className="text-xs font-semibold text-green-300 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            Support Levels
          </h4>
          <div className="space-y-1.5">
            <LevelBar label="S1 (45°)" value={rangeBasedLevels.s1} type="support" />
            <LevelBar label="S2 (90°)" value={rangeBasedLevels.s2} type="support" />
            <LevelBar label="S3 (135°)" value={rangeBasedLevels.s3} type="support" />
            <LevelBar label="S4 (180° Major)" value={rangeBasedLevels.s4} type="support" />
          </div>
        </div>
      </div>

      {/* Pivot Level */}
      <div>
        <LevelBar label="📐 Gann Pivot (PP)" value={pivot} type="pivot" isActive={true} />
      </div>

      {/* Reversal Levels */}
      <div className="rounded-xl border border-gray-700/40 bg-gray-800/30 p-4">
        <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-3">🔄 Reversal Points</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <StatCard
            label="Bullish Reversal Above"
            value={reversal.bullishAbove.toFixed(2)}
            color="text-emerald-300"
            sub="Breakout confirmation"
          />
          <StatCard
            label="Bearish Reversal Below"
            value={reversal.bearishBelow.toFixed(2)}
            color="text-red-300"
            sub="Breakdown confirmation"
          />
          <StatCard
            label="Major Reversal Zone"
            value={`${reversal.majorSupport.toFixed(2)} - ${reversal.majorResistance.toFixed(2)}`}
            color="text-yellow-300"
            sub="180° extreme levels"
          />
        </div>
      </div>

      {/* Trading Levels */}
      <div
        className={`rounded-xl border p-4 ${
          isBullish ? 'border-emerald-500/30 bg-emerald-500/5' : signal.direction === 'SELL' ? 'border-red-500/30 bg-red-500/5' : 'border-yellow-500/30 bg-yellow-500/5'
        }`}
      >
        <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-3">
          📈 Trading Plan — {isBullish ? 'BUY' : signal.direction === 'SELL' ? 'SELL' : 'BOTH SIDES'}
        </h4>

        {isBullish || signal.direction === 'NEUTRAL' ? (
          <div className="mb-3 last:mb-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">BUY</span>
              <span className="text-xs text-gray-400">
                Entry above <strong className="text-emerald-300">{tradingLevels.buyAbove.toFixed(2)}</strong>
              </span>
            </div>
            <div className="space-y-1 mb-2">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Targets</p>
              <div className="flex flex-wrap gap-1.5">
                {tradingLevels.buyTargets.map((t, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-200 text-[11px] font-medium border border-emerald-500/20"
                  >
                    T{i + 1}: {t.toFixed(2)}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-500 uppercase">Stop Loss:</span>
              <span className="text-xs font-bold text-red-300">{tradingLevels.buyStopLoss.toFixed(2)}</span>
            </div>
          </div>
        ) : null}

        {!isBullish || signal.direction === 'NEUTRAL' ? (
          <div className={isBullish || signal.direction === 'NEUTRAL' ? 'border-t border-gray-700/40 pt-3 mt-3' : ''}>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 text-[10px] font-bold">SELL</span>
              <span className="text-xs text-gray-400">
                Entry below <strong className="text-red-300">{tradingLevels.sellBelow.toFixed(2)}</strong>
              </span>
            </div>
            <div className="space-y-1 mb-2">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Targets</p>
              <div className="flex flex-wrap gap-1.5">
                {tradingLevels.sellTargets.map((t, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded bg-red-500/10 text-red-200 text-[11px] font-medium border border-red-500/20"
                  >
                    T{i + 1}: {t.toFixed(2)}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-500 uppercase">Stop Loss:</span>
              <span className="text-xs font-bold text-emerald-300">{tradingLevels.sellStopLoss.toFixed(2)}</span>
            </div>
          </div>
        ) : null}
      </div>

      {/* Square of 9 Levels */}
      <div className="rounded-xl border border-gray-700/40 bg-gray-800/30 p-4">
        <details>
          <summary className="text-xs font-semibold text-gray-300 uppercase tracking-wider cursor-pointer flex items-center gap-2 select-none">
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            Square of 9 — All Angular Levels
          </summary>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {squareOf9Levels.map((level, i) => (
              <LevelBar
                key={i}
                label={level.label}
                value={level.value}
                type={level.type}
              />
            ))}
          </div>
        </details>
      </div>

      {/* Input Summary */}
      <div className="rounded-lg border border-gray-700/30 bg-gray-800/20 p-3">
        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Input Data</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-400">
          <span>H: <strong className="text-gray-200">{input.prevHigh.toFixed(2)}</strong></span>
          <span>L: <strong className="text-gray-200">{input.prevLow.toFixed(2)}</strong></span>
          <span>C: <strong className="text-gray-200">{input.prevClose.toFixed(2)}</strong></span>
          <span>O: <strong className="text-gray-200">{input.todayOpen.toFixed(2)}</strong></span>
        </div>
      </div>
    </div>
  );
}
