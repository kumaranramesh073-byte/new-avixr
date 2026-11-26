export function pctChange(curr: number, prev: number): number {
  if (!prev) return 0;
  return +(((curr - prev) / prev) * 100).toFixed(1);
}
