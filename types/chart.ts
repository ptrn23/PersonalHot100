export type MaxStats = {
  sales: number;
  streams: number;
  airplay: number;
  units: number;
};

export type DisplayEntry = {
  id: string;
  rank: number;
  previousRank: number | null;

  coverUrl: string | null;
  primaryText: string;
  primaryHref: string | null;
  secondaryText: string | null;
  secondaryHref: string | null;

  mathSeedString: string;
  disableDropdown?: boolean;
  hideRankChange?: boolean;
  isOut?: boolean;

  isNewPeak: boolean;
  isRePeak: boolean;
  peakPosition: number;
  peakStreak: number | null;
  weeksOnChart: number;
  totalPoints: number;
  currentWeekPoints: number;
  previousWeekRawPoints: number | null;
  twoWeeksAgoRawPoints: number | null;
  sales: number;
  streams: number;
  airplay: number;
};

export type RecordEntry = {
  id: string;
  rank: number;
  coverUrl: string | null;
  title: string;
  artist: string;
  metricValue: string | number;
  peak: number;
  weekDisplay: string;
  weekUrl: string;
};