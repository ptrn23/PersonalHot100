import { supabase } from "@/utils/supabase";

export async function getCertificationsByEntity(
  entityIdColumn: "song_id" | "album_id",
  entityId: string,
) {
  const { data, error } = await supabase
    .from("certifications")
    .select(
      `
      award_name,
      multiplier,
      chart_weeks ( start_date )
    `,
    )
    .eq(entityIdColumn, entityId);

  if (error) {
    console.error(`Error fetching certifications:`, error);
    return [];
  }
  return data || [];
}
