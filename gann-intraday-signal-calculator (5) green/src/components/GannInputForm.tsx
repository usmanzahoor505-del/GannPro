import { useState } from 'react';
import type { GannInput } from '../utils/gannCalculator';

interface GannInputFormProps {
  onCalculate: (input: GannInput) => void;
  hasResult: boolean;
}

export default function GannInputForm({ onCalculate, hasResult }: GannInputFormProps) {
  const [prevHigh, setPrevHigh] = useState('');
  const [prevLow, setPrevLow] = useState('');
  const [prevClose, setPrevClose] = useState('');
  const [todayOpen, setTodayOpen] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const h = parseFloat(prevHigh);
    const l = parseFloat(prevLow);
    const c = parseFloat(prevClose);
    const o = parseFloat(todayOpen);

    if (isNaN(h) || isNaN(l) || isNaN(c) || isNaN(o)) {
      setError('Please enter valid numeric values for all fields.');
      return;
    }
    if (h <= l) {
      setError('Previous day High must be greater than Low.');
      return;
    }
    if (c < l || c > h) {
      setError('Previous day Close should be between High and Low.');
      return;
    }

    onCalculate({ prevHigh: h, prevLow: l, prevClose: c, todayOpen: o });
  };

  const inputClass =
    'w-full rounded-lg border border-gray-700 bg-gray-800/80 px-4 py-2.5 text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all duration-200 text-sm';

  const labelClass = 'block text-xs font-medium text-gray-300 mb-1.5 tracking-wide uppercase';

  return (
    <div className="rounded-xl border border-gray-700/50 bg-gray-800/40 backdrop-blur-sm p-5 shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20">
          <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
          </svg>
        </div>
        <h2 className="font-semibold text-white text-sm">Market Data Input</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Prev Day High</label>
            <input
              type="number"
              step="any"
              value={prevHigh}
              onChange={(e) => setPrevHigh(e.target.value)}
              placeholder="e.g., 18450.00"
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className={labelClass}>Prev Day Low</label>
            <input
              type="number"
              step="any"
              value={prevLow}
              onChange={(e) => setPrevLow(e.target.value)}
              placeholder="e.g., 18200.00"
              className={inputClass}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Prev Day Close</label>
            <input
              type="number"
              step="any"
              value={prevClose}
              onChange={(e) => setPrevClose(e.target.value)}
              placeholder="e.g., 18350.00"
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className={labelClass}>Today's Open</label>
            <input
              type="number"
              step="any"
              value={todayOpen}
              onChange={(e) => setTodayOpen(e.target.value)}
              placeholder="e.g., 18400.00"
              className={inputClass}
              required
            />
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2">
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        <button
          type="submit"
          className="w-full rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-500 active:scale-[0.98] transition-all duration-200"
        >
          {hasResult ? 'Recalculate Gann Levels' : 'Calculate Gann Levels'}
        </button>
      </form>
    </div>
  );
}
