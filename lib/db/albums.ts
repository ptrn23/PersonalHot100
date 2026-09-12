import { supabase } from "@/utils/supabase";

export async function getAlbumMetadata(albumId: string) {
  const { data, error } = await supabase
    .from("albums")
    .select(
      `
      title,
      cover_url,
      release_date,
      release_date_precision,
      album_type,
      genre,
      spotify_id,
      artists (name)
    `,
    )
    .eq("id", albumId)
    .single();

  if (error) return null;
  return data;
}

export async function getAlbumWithSongHistory(albumId: string) {
  const { data, error } = await supabase
    .from("albums")
    .select(
      `
      *,
      artists ( id, name, spotify_id, genres ),
      songs (
        id,
        title,
        display_title,
        release_date,
        release_date_precision,
        spotify_id,
        cover_url_single,
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
    `,
    )
    .eq("id", albumId)
    .single();

  if (error) return null;
  return data;
}

export async function getAlbumChartHistory(albumId: string) {
  const { data, error } = await supabase.from("weekly_album_stats").select("*").eq("id", albumId);

  if (error) {
    console.error(`Error fetching album chart history:`, error);
    return [];
  }
  return data || [];
}
