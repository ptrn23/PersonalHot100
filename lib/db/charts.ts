import { supabase } from "@/utils/supabase";

export async function getAllChartWeeks() {
  const { data, error } = await supabase
    .from("chart_weeks")
    .select("*")
    .order("start_date", { ascending: false });

  if (error) {
    console.error("Error fetching chart weeks:", error);
    return [];
  }
  return data || [];
}

export async function getLatestChartWeek() {
  const { data, error } = await supabase
    .from("chart_weeks")
    .select("*")
    .order("start_date", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error("Error fetching latest chart week:", error);
    return null;
  }
  return data;
}

export async function getChartEntriesByWeekId(weekId: string, limit: number = 100) {
  const { data, error } = await supabase
    .from("chart_entries")
    .select(
      `
      *,
      songs (
        id,
        title,
        display_title,
        artists ( id, name, display_name ),
        albums ( id, title, display_title, cover_url )
      )
    `
    )
    .eq("week_id", weekId)
    .lte("rank", limit)
    .order("rank", { ascending: true });

  if (error) {
    console.error(`Error fetching entries for week ${weekId}:`, error);
    return [];
  }
  return data || [];
}

export async function getWeeklyAlbumsByWeekId(weekId: string, limit: number = 20) {
  const { data, error } = await supabase
    .from("weekly_album_stats")
    .select("*")
    .eq("week_id", weekId)
    .lte("rank", limit)
    .order("rank", { ascending: true });

  if (error) {
    console.error(`Error fetching weekly albums for week ${weekId}:`, error);
    return [];
  }
  return data || [];
}

export async function getWeeklyArtistsByWeekId(weekId: string, limit: number = 20) {
  const { data, error } = await supabase
    .from("weekly_artist_stats")
    .select("*")
    .eq("week_id", weekId)
    .lte("rank", limit)
    .order("rank", { ascending: true });

  if (error) {
    console.error(`Error fetching weekly artists for week ${weekId}:`, error);
    return [];
  }
  return data || [];
}

export async function getAllTimeSongs(startRange: number, endRange: number) {
  const { data, error } = await supabase
    .from("all_time_song_stats")
    .select("*")
    .order("total_points", { ascending: false })
    .range(startRange, endRange);

  if (error) {
    console.error("Error fetching all-time songs:", error);
    return [];
  }
  return data || [];
}

export async function getAllTimeAlbums(startRange: number, endRange: number) {
  const { data, error } = await supabase
    .from("all_time_album_stats")
    .select("*")
    .order("total_points", { ascending: false })
    .range(startRange, endRange);

  if (error) return [];
  return data || [];
}

export async function getAllTimeArtists(startRange: number, endRange: number) {
  const { data, error } = await supabase
    .from("all_time_artist_stats")
    .select("*")
    .order("total_points", { ascending: false })
    .range(startRange, endRange);

  if (error) return [];
  return data || [];
}