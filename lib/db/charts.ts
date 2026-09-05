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
    `,
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

export async function getLiveChartEntriesByWeekId(weekId: string, limit: number = 100) {
  const { data, error } = await supabase
    .from("live_chart_entries")
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
    `,
    )
    .eq("week_id", weekId)
    .lte("rank", limit)
    .order("rank", { ascending: true });

  if (error) {
    console.error(`Error fetching LIVE entries for week ${weekId}:`, error);
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

export async function getAvailableChartYears(): Promise<number[]> {
  const { data, error } = await supabase.from("chart_weeks").select("start_date");

  if (error || !data) {
    console.error("Error fetching available chart years:", error);
    return [];
  }

  const uniqueYears = Array.from(
    new Set(data.map((w) => new Date(w.start_date).getFullYear())),
  ).sort((a, b) => b - a);

  return uniqueYears;
}

export async function getYearEndSongStats(year: number) {
  const { data, error } = await supabase
    .from("year_end_song_stats")
    .select("*")
    .eq("chart_year", year)
    .or("rank.lte.100,peak_position.eq.1")
    .order("rank", { ascending: true });

  if (error) {
    console.error(`Error fetching year-end stats for ${year}:`, error);
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

export async function getLatestNumberOneSong() {
  const { data: weeks, error: weeksError } = await supabase
    .from("chart_weeks")
    .select("*")
    .order("start_date", { ascending: false });

  if (weeksError || !weeks || weeks.length === 0) {
    console.error("Error fetching weeks for homepage:", weeksError);
    return null;
  }

  for (const week of weeks) {
    const { data, error } = await supabase
      .from("chart_entries")
      .select(
        `
        *,
        chart_weeks!inner (
          id,
          start_date,
          end_date
        ),
        songs (
          id,
          title,
          display_title,
          artists ( id, name, display_name ),
          albums ( id, title, display_title, cover_url )
        )
      `
      )
      .eq("week_id", week.id)
      .eq("rank", 1)
      .maybeSingle();

    if (data) {
      return data;
    }
    
    if (error) {
      console.error(`Error checking week ${week.id} for #1 song:`, error);
    }
  }
  
  return null;
}

export async function getLatestTop5Songs() {
  const { data: weeks, error: weeksError } = await supabase
    .from("chart_weeks")
    .select("*")
    .order("start_date", { ascending: false });

  if (weeksError || !weeks || weeks.length === 0) {
    console.error("Error fetching weeks for homepage top 5:", weeksError);
    return [];
  }

  for (const week of weeks) {
    const { data, error } = await supabase
      .from("chart_entries")
      .select(
        `
        *,
        chart_weeks!inner (
          id,
          start_date,
          end_date
        ),
        songs (
          id,
          title,
          display_title,
          artists ( id, name, display_name ),
          albums ( id, title, display_title, cover_url )
        )
      `
      )
      .eq("week_id", week.id)
      .lte("rank", 5)
      .order("rank", { ascending: true });
      
    if (data && data.length > 0) {
      return data;
    }
    
    if (error) {
      console.error(`Error checking week ${week.id} for top 5 songs:`, error);
    }
  }
  
  return [];
}

export async function getCurrentYearEndTop5() {
  const currentYear = new Date().getFullYear();
  
  const { data, error } = await supabase
    .from("year_end_song_stats")
    .select("*")
    .eq("chart_year", currentYear)
    .lte("rank", 5)
    .order("rank", { ascending: true });

  if (error) {
    console.error(`Error fetching year-end top 5 for ${currentYear}:`, error);
    return [];
  }
  
  return data || [];
}