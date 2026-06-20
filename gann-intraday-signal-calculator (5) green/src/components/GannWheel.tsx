import { getGannWheelData } from '../utils/gannCalculator';

interface GannWheelProps {
  pivot: number;
}

export default function GannWheel({ pivot }: GannWheelProps) {
  const wheelData = getGannWheelData(pivot);

  if (!pivot || pivot <= 0) {
    return (
      <div className="rounded-xl border border-gray-700/40 bg-gray-800/30 p-6 text-center">
        <p className="text-xs text-gray-500">Enter valid data to see the Gann Wheel</p>
      </div>
    );
  }

  const centerX = 150;
  const centerY = 150;
  const radius = 120;

  return (
    <div className="rounded-xl border border-gray-700/40 bg-gray-800/30 p-4">
      <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-3">🎯 Gann Square of 9 — Wheel</h4>

      <div className="flex justify-center">
        <svg viewBox="0 0 300 300" className="w-full max-w-[280px] h-auto">
          {/* Grid lines */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
            const rad = (deg * Math.PI) / 180;
            const x2 = centerX + radius * Math.cos(rad - Math.PI / 2);
            const y2 = centerY + radius * Math.sin(rad - Math.PI / 2);
            return (
              <line
                key={deg}
                x1={centerX}
                y1={centerY}
                x2={x2}
                y2={y2}
                stroke="rgba(255,255,255,0.08)"
                strokeWidth={deg % 90 === 0 ? 1.5 : 0.5}
              />
            );
          })}

          {/* Concentric rings */}
          {[40, 80, 120].map((r) => (
            <circle
              key={r}
              cx={centerX}
              cy={centerY}
              r={r}
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth={0.5}
            />
          ))}

          {/* Center point */}
          <circle cx={centerX} cy={centerY} r={4} fill="#fbbf24" stroke="#f59e0b" strokeWidth={1.5} />
          <text x={centerX} y={centerY + 4} textAnchor="middle" fill="#fbbf24" fontSize="8" fontWeight="bold">
            {pivot.toFixed(1)}
          </text>

          {/* Angle labels and values */}
          {wheelData.map((item) => {
            const rad = (item.degree * Math.PI) / 180;
            // Position label at radius + 10
            const labelR = radius + 16;
            const lx = centerX + labelR * Math.cos(rad - Math.PI / 2);
            const ly = centerY + labelR * Math.sin(rad - Math.PI / 2);

            // Position resistance value at radius * 0.7
            const resR = radius * 0.7;
            const resX = centerX + resR * Math.cos(rad - Math.PI / 2);
            const resY = centerY + resR * Math.sin(rad - Math.PI / 2);

            // Position support value at radius * 0.4 (opposite side)
            const supR = radius * 0.55;
            const supAngle = rad + Math.PI;
            const supX = centerX + supR * Math.cos(supAngle - Math.PI / 2);
            const supY = centerY + supR * Math.sin(supAngle - Math.PI / 2);

            return (
              <g key={item.degree}>
                {/* Degree label */}
                <text x={lx} y={ly} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="7" fontWeight="500">
                  {item.label}
                </text>

                {/* Resistance value */}
                <text x={resX} y={resY} textAnchor="middle" fill="#f87171" fontSize="6.5" fontWeight="bold">
                  {item.resistance.toFixed(1)}
                </text>

                {/* Support value */}
                {item.support !== null && (
                  <text x={supX} y={supY} textAnchor="middle" fill="#34d399" fontSize="6.5" fontWeight="bold">
                    {item.support.toFixed(1)}
                  </text>
                )}
              </g>
            );
          })}

          {/* Additional cardinal cross labels */}
          <text x={centerX} y={centerY - radius - 22} textAnchor="middle" fill="#f87171" fontSize="7" fontWeight="bold" opacity={0.7}>
            R-0°
          </text>
          <text x={centerX} y={centerY + radius + 24} textAnchor="middle" fill="#34d399" fontSize="7" fontWeight="bold" opacity={0.7}>
            S-180°
          </text>
          <text x={centerX - radius - 24} y={centerY + 2} textAnchor="middle" fill="#34d399" fontSize="7" fontWeight="bold" opacity={0.7}>
            S-270°
          </text>
          <text x={centerX + radius + 24} y={centerY + 2} textAnchor="middle" fill="#f87171" fontSize="7" fontWeight="bold" opacity={0.7}>
            R-90°
          </text>

          {/* Legend */}
          <rect x={220} y={252} width={6} height={6} rx={1} fill="#f87171" opacity={0.7} />
          <text x={230} y={258} fill="rgba(255,255,255,0.4)" fontSize="6">R</text>
          <rect x={250} y={252} width={6} height={6} rx={1} fill="#34d399" opacity={0.7} />
          <text x={260} y={258} fill="rgba(255,255,255,0.4)" fontSize="6">S</text>
        </svg>
      </div>

      <p className="text-[10px] text-center text-gray-500 mt-2">
        Pivot: {pivot.toFixed(2)} — Resistance (red) &amp; Support (green) at standard Gann angles
      </p>
    </div>
  );
}
