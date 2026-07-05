import { supabase } from "@/utils/supabase";

export async function getNewsByEntity(entityType: "song" | "album" | "artist", entityId: string) {
  const { data, error } = await supabase
    .from("news_feed")
    .select(
      `
      headline,
      subtext,
      priority,
      event_type,
      chart_weeks ( start_date )
    `,
    )
    .eq("entity_type", entityType)
    .eq("entity_id", entityId);

  if (error) {
    console.error(`Error fetching news for ${entityType}:`, error);
    return [];
  }
  return data || [];
}
