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

export const formatMilestone = (num: number): string => {
  if (!num || num === 0) return "0";
  
  if (num >= 1_000_000_000) {
    return Math.floor(num / 1_000_000_000) + " Billion";
  }
  if (num >= 1_000_000) {
    return Math.floor(num / 1_000_000) + " Million";
  }
  if (num >= 1_000) {
    return Math.floor(num / 1_000) + " Thousand";
  }
  
  return num.toLocaleString("en-US");
};

export const formatOrdinal = (num: number): string => {
  if (!num) return "0th";
  
  const j = Math.abs(num) % 10;
  const k = Math.abs(num) % 100;
  
  if (j === 1 && k !== 11) return `${num}st`;
  if (j === 2 && k !== 12) return `${num}nd`;
  if (j === 3 && k !== 13) return `${num}rd`;
  
  return `${num}th`;
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
    year: "2-digit",
    timeZone: CHART_TIMEZONE,
  });
};

export const formatDateRange = (startIso?: string, endIso?: string): string => {
  if (!startIso || !endIso) return "--";
  return `${formatFullDate(startIso)} - ${formatFullDate(endIso)}`;
};