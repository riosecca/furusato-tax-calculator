export function formatYen(rawValue: number): string {
  const safeValue = Math.max(Math.round(rawValue), 0);
  return `${safeValue.toLocaleString()}円`;
}
