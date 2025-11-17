export function floorToThousand(value: number): number {
  if (!isFinite(value)) return 0;
  return Math.floor(value / 1000) * 1000;
}

export function roundToYen(value: number): number {
  if (!isFinite(value)) return 0;
  return Math.round(value);
}
