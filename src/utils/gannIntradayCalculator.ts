export interface GannInput {
  prevHigh: number;
  prevLow: number;
  prevClose: number;
  todayOpen: number;
}

export interface GannLevel {
  angle: number;
  label: string;
  value: number;
  type: 'support' | 'resistance';
}

export interface GannResult {
  pivot: number;
  range: number;
  squareOf9Levels: GannLevel[];
  rangeBasedLevels: {
    r1: number;
    r2: number;
    r3: number;
    r4: number;
    s1: number;
    s2: number;
    s3: number;
    s4: number;
  };
  signal: {
    direction: 'BUY' | 'SELL' | 'NEUTRAL';
    bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    strength: 'STRONG' | 'MODERATE' | 'WEAK';
    reason: string;
  };
  reversal: {
    bullishAbove: number;
    bearishBelow: number;
    majorResistance: number;
    majorSupport: number;
  };
  tradingLevels: {
    buyAbove: number;
    buyTargets: number[];
    buyStopLoss: number;
    sellBelow: number;
    sellTargets: number[];
    sellStopLoss: number;
  };
  biasPrediction: {
    overall: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    confidence: number;
    factors: { label: string; bullish: boolean; weight: number }[];
  };
}

function roundTo(val: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
}

function sanitizeNumber(val: number): number {
  if (!isFinite(val) || isNaN(val)) return 0;
  return val;
}

/**
 * Gann Square of 9: Level = (√(pivot) + angle/360)² for resistance
 * Level = (√(pivot) - angle/360)² for support
 */
function calculateSquareOf9Levels(pivot: number): GannLevel[] {
  const sqrtPivot = Math.sqrt(Math.abs(pivot));
  const angles = [
    { angle: 45, label: '45° (Minor)' },
    { angle: 90, label: '90°' },
    { angle: 135, label: '135°' },
    { angle: 180, label: '180° (Major)' },
    { angle: 225, label: '225°' },
    { angle: 270, label: '270°' },
    { angle: 315, label: '315°' },
    { angle: 360, label: '360° (Full Cycle)' },
  ];

  const levels: GannLevel[] = [];

  for (const { angle, label } of angles) {
    const increment = angle / 360;

    // Resistance: moving clockwise (add)
    const resValue = (sqrtPivot + increment) ** 2;
    levels.push({
      angle,
      label: `R: ${label}`,
      value: roundTo(sanitizeNumber(resValue), 2),
      type: 'resistance',
    });

    // Support: moving counter-clockwise (subtract)
    const supValue = (sqrtPivot - increment) ** 2;
    if (supValue > 0) {
      levels.push({
        angle: -angle,
        label: `S: ${label}`,
        value: roundTo(sanitizeNumber(supValue), 2),
        type: 'support',
      });
    }
  }

  return levels;
}

/**
 * Calculate range-based Gann levels
 */
function calculateRangeBasedLevels(pivot: number, range: number) {
  const factors = [0.125, 0.25, 0.375, 0.5];

  return {
    r1: roundTo(pivot + range * factors[0], 2),
    r2: roundTo(pivot + range * factors[1], 2),
    r3: roundTo(pivot + range * factors[2], 2),
    r4: roundTo(pivot + range * factors[3], 2),
    s1: roundTo(pivot - range * factors[0], 2),
    s2: roundTo(pivot - range * factors[1], 2),
    s3: roundTo(pivot - range * factors[2], 2),
    s4: roundTo(pivot - range * factors[3], 2),
  };
}

/**
 * Determine trading signal based on today's open vs pivot
 */
function calculateSignal(
  open: number,
  pivot: number,
  _range: number,
  prevClose: number
): GannResult['signal'] {
  const diffFromPivot = open - pivot;
  const diffPercent = (diffFromPivot / pivot) * 100;
  const gapFromClose = open - prevClose;
  const gapPercent = (gapFromClose / prevClose) * 100;

  let direction: 'BUY' | 'SELL' | 'NEUTRAL';
  let bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  let strength: 'STRONG' | 'MODERATE' | 'WEAK';
  let reason: string;

  // Determine direction and bias
  if (open > pivot) {
    direction = 'BUY';
    bias = 'BULLISH';
    reason = `Open (${open}) > Pivot (${pivot}) — Bullish bias. `;
    if (diffPercent > 0.5) {
      strength = 'STRONG';
      reason += 'Opening significantly above pivot indicates strong buying momentum. ';
    } else if (diffPercent > 0.2) {
      strength = 'MODERATE';
      reason += 'Opening above pivot with moderate buying pressure. ';
    } else {
      strength = 'WEAK';
      reason += 'Opening marginally above pivot, awaiting confirmation. ';
    }
  } else if (open < pivot) {
    direction = 'SELL';
    bias = 'BEARISH';
    reason = `Open (${open}) < Pivot (${pivot}) — Bearish bias. `;
    if (diffPercent < -0.5) {
      strength = 'STRONG';
      reason += 'Opening significantly below pivot indicates strong selling pressure. ';
    } else if (diffPercent < -0.2) {
      strength = 'MODERATE';
      reason += 'Opening below pivot with moderate selling pressure. ';
    } else {
      strength = 'WEAK';
      reason += 'Opening marginally below pivot, awaiting confirmation. ';
    }
  } else {
    direction = 'NEUTRAL';
    bias = 'NEUTRAL';
    strength = 'WEAK';
    reason = 'Open exactly at pivot — neutral. Waiting for price breakout. ';
  }

  // Add gap info
  if (Math.abs(gapPercent) > 0.3) {
    if (gapPercent > 0) reason += 'Gap-up opening adds bullish confirmation.';
    else reason += 'Gap-down opening adds bearish confirmation.';
  }

  return { direction, bias, strength, reason };
}

/**
 * Calculate reversal levels
 */
function calculateReversalLevels(pivot: number, range: number) {
  return {
    // Bullish reversal: crossing above pivot + 0.25 * range
    bullishAbove: roundTo(pivot + range * 0.25, 2),
    // Bearish reversal: crossing below pivot - 0.25 * range
    bearishBelow: roundTo(pivot - range * 0.25, 2),
    // Major resistance (180° equivalent in terms of range)
    majorResistance: roundTo(pivot + range * 0.5, 2),
    // Major support (180° equivalent)
    majorSupport: roundTo(pivot - range * 0.5, 2),
  };
}

/**
 * Calculate actionable trading levels
 */
function calculateTradingLevels(
  open: number,
  pivot: number,
  range: number,
  rangeLevels: GannResult['rangeBasedLevels'],
  direction: 'BUY' | 'SELL' | 'NEUTRAL'
): GannResult['tradingLevels'] {
  if (direction === 'BUY') {
    const buyAbove = roundTo(open + range * 0.05, 2);
    return {
      buyAbove,
      buyTargets: [rangeLevels.r1, rangeLevels.r2, rangeLevels.r3, rangeLevels.r4],
      buyStopLoss: rangeLevels.s1,
      sellBelow: 0,
      sellTargets: [],
      sellStopLoss: 0,
    };
  } else if (direction === 'SELL') {
    const sellBelow = roundTo(open - range * 0.05, 2);
    return {
      buyAbove: 0,
      buyTargets: [],
      buyStopLoss: 0,
      sellBelow,
      sellTargets: [rangeLevels.s4, rangeLevels.s3, rangeLevels.s2, rangeLevels.s1],
      sellStopLoss: rangeLevels.r1,
    };
  } else {
    // Neutral - provide both sides
    return {
      buyAbove: roundTo(pivot + range * 0.1, 2),
      buyTargets: [rangeLevels.r1, rangeLevels.r2, rangeLevels.r3],
      buyStopLoss: rangeLevels.s1,
      sellBelow: roundTo(pivot - range * 0.1, 2),
      sellTargets: [rangeLevels.s1, rangeLevels.s2, rangeLevels.s3],
      sellStopLoss: rangeLevels.r1,
    };
  }
}

/**
 * Bias prediction with confidence score
 */
function calculateBiasPrediction(
  open: number,
  pivot: number,
  range: number,
  prevClose: number,
  prevHigh: number,
  prevLow: number
): GannResult['biasPrediction'] {
  const factors: { label: string; bullish: boolean; weight: number }[] = [];

  // Factor 1: Open vs Pivot (weight: 30)
  if (open > pivot) {
    factors.push({ label: 'Open above Gann Pivot', bullish: true, weight: 30 });
  } else if (open < pivot) {
    factors.push({ label: 'Open below Gann Pivot', bullish: false, weight: 30 });
  } else {
    factors.push({ label: 'Open at Gann Pivot', bullish: true, weight: 0 });
  }

  // Factor 2: Gap Analysis (weight: 20)
  const gap = open - prevClose;
  if (gap > range * 0.1) {
    factors.push({ label: 'Significant gap-up opening', bullish: true, weight: 20 });
  } else if (gap < -range * 0.1) {
    factors.push({ label: 'Significant gap-down opening', bullish: false, weight: 20 });
  } else {
    factors.push({ label: 'Flat opening (no gap)', bullish: true, weight: 10 });
  }

  // Factor 3: Position in range (weight: 25)
  const positionInRange = ((open - prevLow) / (prevHigh - prevLow)) * 100;
  if (positionInRange > 70) {
    factors.push({
      label: `Open in upper range (${roundTo(positionInRange, 0)}%)`,
      bullish: true,
      weight: 25,
    });
  } else if (positionInRange < 30) {
    factors.push({
      label: `Open in lower range (${roundTo(positionInRange, 0)}%)`,
      bullish: false,
      weight: 25,
    });
  } else {
    factors.push({
      label: `Open in mid range (${roundTo(positionInRange, 0)}%)`,
      bullish: true,
      weight: 15,
    });
  }

  // Factor 4: Volatility context (weight: 15)
  const volatilityRatio = range / pivot;
  if (volatilityRatio > 0.02) {
    factors.push({
      label: 'High volatility (wide range)',
      bullish: open > pivot,
      weight: 15,
    });
  } else if (volatilityRatio < 0.005) {
    factors.push({
      label: 'Low volatility (narrow range)',
      bullish: true,
      weight: 10,
    });
  } else {
    factors.push({
      label: 'Normal volatility range',
      bullish: true,
      weight: 12,
    });
  }

  // Factor 5: Pivot proximity to close (weight: 10)
  const pivotVsClose = pivot - prevClose;
  if (pivotVsClose > 0 && prevClose > (prevHigh + prevLow) / 2) {
    factors.push({
      label: 'Pivot above close, close above mid-range',
      bullish: true,
      weight: 10,
    });
  } else if (pivotVsClose < 0 && prevClose < (prevHigh + prevLow) / 2) {
    factors.push({
      label: 'Pivot below close, close below mid-range',
      bullish: false,
      weight: 10,
    });
  } else {
    factors.push({ label: 'Mixed signals from pivot-close', bullish: true, weight: 5 });
  }

  // Calculate weighted score
  let bullishScore = 0;
  let totalWeight = 0;
  for (const f of factors) {
    totalWeight += f.weight;
    if (f.bullish) bullishScore += f.weight;
  }
  const confidence = totalWeight > 0 ? roundTo((bullishScore / totalWeight) * 100, 1) : 50;

  let overall: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  if (confidence >= 65) overall = 'BULLISH';
  else if (confidence <= 35) overall = 'BEARISH';
  else overall = 'NEUTRAL';

  return { overall, confidence, factors };
}

/**
 * Main Gann calculator function
 */
export function calculateGannLevels(input: GannInput): GannResult {
  const { prevHigh, prevLow, prevClose, todayOpen } = input;

  // Gann Pivot and Range
  const pivot = roundTo((prevHigh + prevLow + prevClose) / 3, 2);
  const range = roundTo(prevHigh - prevLow, 2);

  // Square of 9 Levels
  const squareOf9Levels = calculateSquareOf9Levels(pivot);

  // Range-based levels
  const rangeBasedLevels = calculateRangeBasedLevels(pivot, range);

  // Signal
  const signal = calculateSignal(todayOpen, pivot, range, prevClose);

  // Reversal
  const reversal = calculateReversalLevels(pivot, range);

  // Trading levels
  const tradingLevels = calculateTradingLevels(
    todayOpen,
    pivot,
    range,
    rangeBasedLevels,
    signal.direction
  );

  // Bias prediction
  const biasPrediction = calculateBiasPrediction(
    todayOpen,
    pivot,
    range,
    prevClose,
    prevHigh,
    prevLow
  );

  return {
    pivot,
    range,
    squareOf9Levels,
    rangeBasedLevels,
    signal,
    reversal,
    tradingLevels,
    biasPrediction,
  };
}

/**
 * Get the Gann Wheel visualization as array of angle positions
 */
export function getGannWheelData(pivot: number) {
  const sqrtPivot = Math.sqrt(Math.abs(pivot));
  const positions = [
    { degree: 0, label: '0°' },
    { degree: 45, label: '45°' },
    { degree: 90, label: '90°' },
    { degree: 135, label: '135°' },
    { degree: 180, label: '180°' },
    { degree: 225, label: '225°' },
    { degree: 270, label: '270°' },
    { degree: 315, label: '315°' },
    { degree: 360, label: '360°' },
  ];

  return positions.map((p) => {
    const inc = p.degree / 360;
    const res = (sqrtPivot + inc) ** 2;
    const sup = (sqrtPivot - inc) ** 2;
    return {
      degree: p.degree,
      label: p.label,
      resistance: roundTo(sanitizeNumber(res), 2),
      support: sup > 0 ? roundTo(sanitizeNumber(sup), 2) : null,
    };
  });
}
