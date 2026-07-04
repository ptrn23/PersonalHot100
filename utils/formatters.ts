const CHART_TIMEZONE = "Asia/Manila";

export const formatNumber = (num: number): string => {
  if (!num || num === 0) return "0.0k";
  
  if (num >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(1) + "b";
  }
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + "m";
  }
  
  return (num / 1_000).toFixed(1) + "k";
};

export const formatFullDate = (isoString?: string): string => {
  if (!isoString) return "--";
  return new Date(isoString).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: CHART_TIMEZONE,
  });
};

export const formatShortDate = (isoString?: string): string => {
  if (!isoString) return "--";
  return new Date(isoString).toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    timeZone: CHART_TIMEZONE,
  });
};

export const formatDateRange = (startIso?: string, endIso?: string): string => {
  if (!startIso || !endIso) return "--";
  return `${formatFullDate(startIso)} - ${formatFullDate(endIso)}`;
};