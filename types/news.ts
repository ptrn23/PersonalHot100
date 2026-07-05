export type NewsItem = {
  week_id: string;
  event_type: string;
  entity_type: "song" | "album" | "artist";
  entity_id: string;
  headline: string;
  subtext?: string;
  priority: number;
};
