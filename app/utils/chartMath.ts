export const formatNumber = (num: number) => {
  if (!num) return "0";
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "m";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "k";
  return num.toString();
};

export const getStableSeed = (seedString?: string) => {
  if (!seedString) return 0;
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    hash += (i + 1) * seedString.charCodeAt(i);
  }
  return hash;
};

export const applyDeviation = (
  base: number,
  seed: number,
  scale = 0.1,
  mod = 100,
) => {
  const deviation = ((seed % mod) / mod - 0.5) * 2 * scale;
  return Math.floor(base * (1 + deviation));
};
