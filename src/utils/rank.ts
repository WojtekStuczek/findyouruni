export function getNumericRank(rank: number | string): number {
  if (typeof rank === 'number') return rank;
  const match = rank.match(/\d+/);
  return match ? parseInt(match[0], 10) : 9999;
}
