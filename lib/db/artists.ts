import { supabase } from "@/utils/supabase";

export async function getArtistMetadata(artistId: string) {
  const { data, error } = await supabase
    .from("artists")
    .select("name, image_url")
    .eq("id", artistId)
    .single();

  if (error) return null;
  return data;
}

export async function getArtistWithDiscography(artistId: string) {
  const { data, error } = await supabase
    .from("artists")
    .select(`
      *,
      albums ( id, title, cover_url, release_date ),
      songs (
        id,
        title,
        display_title,
        chart_entries (
          week_id,
          rank,
          total_points,
          streams,
          sales,
          airplay,
          peak_position,
          peak_streak,
          weeks_on_chart,
          chart_weeks ( start_date )
        )
      )
    `)
    .eq("id", artistId)
    .single();

  if (error) return null;
  return data;
}

export async function getArtistChartHistory(artistId: string) {
  const { data, error } = await supabase
    .from("weekly_artist_stats")
    .select("*")
    .eq("id", artistId);

  if (error) {
    console.error(`Error fetching artist chart history:`, error);
    return [];
  }
  return data || [];
}