import { useState, useCallback } from 'react';
import type { GannInput, GannResult } from './utils/gannCalculator';
import { calculateGannLevels } from './utils/gannCalculator';
import GannInputForm from './components/GannInputForm';
import GannResults from './components/GannResults';
import GannWheel from './components/GannWheel';

export default function App() {
  const [result, setResult] = useState<GannResult | null>(null);
  const [input, setInput] = useState<GannInput | null>(null);
  const [showWheel, setShowWheel] = useState(true);

  const handleCalculate = useCallback((data: GannInput) => {
    const gannResult = calculateGannLevels(data);
    setResult(gannResult);
    setInput(data);
  }, []);

  const isBullish = result?.signal.direction === 'BUY';
  const isBearish = result?.signal.direction === 'SELL';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-slate-900 text-white">
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 py-6 sm:py-10">
        {/* Header */}
        <header className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-xl shadow-emerald-500/20 mb-3">
            <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
              <path d="M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-200 bg-clip-text text-transparent">
            W.D. Gann Intraday Calculator
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1.5 max-w-md mx-auto">
            Square of 9 · Buy/Sell Signals · Reversal Points · TP/SL Levels · Bias Prediction
          </p>

          {/* Status indicator */}
          {result && (
            <div className="flex items-center justify-center gap-3 mt-3">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  isBullish
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : isBearish
                    ? 'bg-red-500/15 text-red-300 border border-red-500/30'
                    : 'bg-yellow-500/15 text-yellow-300 border border-yellow-500/30'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isBullish ? 'bg-emerald-400 animate-pulse' : isBearish ? 'bg-red-400 animate-pulse' : 'bg-yellow-400'}`} />
                {result.biasPrediction.overall} — {result.biasPrediction.confidence}% confidence
              </span>
            </div>
          )}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Left Sidebar — Input Form */}
          <div className="lg:col-span-2">
            <GannInputForm onCalculate={handleCalculate} hasResult={result !== null} />

            {/* Quick tips */}
            {!result && (
              <div className="mt-4 rounded-xl border border-gray-700/40 bg-gray-800/30 p-4">
                <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2">💡 How to use</h4>
                <ul className="space-y-1.5 text-[11px] text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">1.</span>
                    <span>Enter previous day's <strong className="text-gray-200">High, Low &amp; Close</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">2.</span>
                    <span>Enter today's <strong className="text-gray-200">Opening price</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">3.</span>
                    <span>Click <strong className="text-gray-200">Calculate</strong> to get all Gann levels</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">4.</span>
                    <span>Use the <strong className="text-gray-200">Buy/Sell</strong> signal and levels for trading</span>
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Right Side — Results */}
          <div className="lg:col-span-3 space-y-5">
            {result && input ? (
              <>
                <GannResults result={result} input={input} />

                {/* Gann Wheel Toggle */}
                <button
                  onClick={() => setShowWheel(!showWheel)}
                  className="w-full flex items-center justify-between rounded-lg border border-gray-700/40 bg-gray-800/40 px-4 py-2.5 text-xs text-gray-300 hover:bg-gray-800/60 transition-all"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {showWheel ? 'Hide' : 'Show'} Gann Square of 9 Wheel
                  </span>
                  <svg className={`w-3.5 h-3.5 transition-transform ${showWheel ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showWheel && <GannWheel pivot={result.pivot} />}
              </>
            ) : (
              /* Empty state */
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-700/50 bg-gray-800/20 p-8 sm:p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-800/60 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-gray-300 mb-1">Enter Market Data</h3>
                <p className="text-xs text-gray-500 max-w-xs">
                  Input previous day's High, Low, Close and today's Open to calculate Gann levels, signals, and reversals.
                </p>
              </div>
            )}

            {/* Footer */}
            <div className="text-center pt-2 pb-4">
              <p className="text-[10px] text-gray-600">
                W.D. Gann Intraday Calculator &bull; Square of 9 Methodology &bull; For educational purposes only
              </p>
              <p className="text-[10px] text-gray-700 mt-0.5">
                Always use proper risk management. Past performance does not guarantee future results.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
