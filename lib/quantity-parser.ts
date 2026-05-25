// Robust client-safe fractional and decimal parser
export function parseQuantity(qtyStr: string): number | null {
  const cleanStr = qtyStr.trim().replace(/\s+/g, " ");
  if (!cleanStr) return null;

  // Mixed fractions (e.g. "1과 1/2", "1 1/2")
  const mixedFractionRegex = /^(\d+)\s*(?:과|\s)\s*(\d+)\/(\d+)$/;
  const simpleFractionRegex = /^(\d+)\/(\d+)$/;
  const decimalRegex = /^(\d+(?:\.\d+)?)$/;

  let mixedMatch = cleanStr.match(mixedFractionRegex);
  if (mixedMatch) {
    const whole = parseInt(mixedMatch[1], 10);
    const num = parseInt(mixedMatch[2], 10);
    const den = parseInt(mixedMatch[3], 10);
    if (den !== 0) return whole + num / den;
  }

  let fractionMatch = cleanStr.match(simpleFractionRegex);
  if (fractionMatch) {
    const num = parseInt(fractionMatch[1], 10);
    const den = parseInt(fractionMatch[2], 10);
    if (den !== 0) return num / den;
  }

  let decimalMatch = cleanStr.match(decimalRegex);
  if (decimalMatch) {
    return parseFloat(decimalMatch[1]);
  }

  const parsed = parseFloat(cleanStr);
  return isNaN(parsed) ? null : parsed;
}
