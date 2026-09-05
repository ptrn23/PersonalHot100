import { supabase } from "@/utils/supabase";

export async function getSongMetadata(songId: string) {
  const { data, error } = await supabase
    .from("songs")
    .select(
      `
      title,
      display_title,
      spotify_id,
      artists (name),
      albums (cover_url)
    `,
    )
    .eq("id", songId)
    .single();

  if (error) return null;
  return data;
}

export async function getSongWithChartHistory(songId: string) {
  const { data, error } = await supabase
    .from("songs")
    .select(
      `
      *,
      artists ( id, name ),
      albums ( id, title, cover_url ),
      chart_entries (
        id,
        week_id,
        rank,
        previous_position,
        is_new_peak,
        is_repeak,
        total_points,
        current_week_points,
        previous_week_raw_points,
        two_weeks_ago_raw_points,
        streams,
        sales,
        airplay,
        peak_position,
        peak_streak,
        weeks_on_chart,
        chart_weeks ( start_date )
      )
    `,
    )
    .eq("id", songId)
    .single();

  if (error) return null;
  return data;
}
