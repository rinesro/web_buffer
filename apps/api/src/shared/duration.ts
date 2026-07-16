const UNIT_TO_MS: Record<string, number> = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

/**
 * Parses a short duration string such as "15m" or "7d" into milliseconds.
 * Supported units: s (seconds), m (minutes), h (hours), d (days).
 */
export function parseDurationToMs(duration: string): number {
  const match = /^(\d+)([smhd])$/.exec(duration.trim());
  if (!match) {
    throw new Error(`Invalid duration format: "${duration}". Expected e.g. "15m", "7d".`);
  }
  const [, amount, unit] = match;
  const unitMs = UNIT_TO_MS[unit as keyof typeof UNIT_TO_MS];
  if (unitMs === undefined) {
    throw new Error(`Unreachable: unit "${unit}" matched the regex but has no UNIT_TO_MS entry`);
  }
  return Number(amount) * unitMs;
}
