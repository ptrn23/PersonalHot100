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