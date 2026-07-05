import { supabase } from "@/utils/supabase";

export async function getAllChartRecords() {
  const entrySelect =
    "id, total_points, sales, streams, airplay, peak_position, weeks_on_chart, chart_weeks(start_date), songs(id, title, display_title, artists(name, display_name), albums(cover_url))";

  const [
    highestPointsRes,
    highestDebutRes,
    biggestJumpRes,
    biggestFallRes,
    biggestJumpTo1Res,
    longestFirstRunRes,
    biggestFallFrom1Res,
    highestSalesRes,
    highestStreamsRes,
    highestAirplayRes,
    highestDebutSalesRes,
    highestDebutStreamsRes,
    highestDebutAirplayRes,
    mostWeeksAt1Res,
    mostWeeksTop10Res,
    mostWeeksTop25Res,
    mostTotalWeeksRes,
  ] = await Promise.all([
    // points
    supabase.from("chart_entries").select(entrySelect).order("total_points", { ascending: false }).limit(10),
    supabase.from("chart_entries").select(entrySelect).eq("weeks_on_chart", 1).order("total_points", { ascending: false }).limit(10),
    
    // jumps & falls
    supabase.from("record_jumps_falls").select("*").order("position_change", { ascending: false }).limit(10),
    supabase.from("record_jumps_falls").select("*").order("position_change", { ascending: true }).limit(10),
    supabase.from("record_jumps_falls").select("*").eq("rank", 1).order("position_change", { ascending: false }).limit(10),
    supabase.from("record_longest_first_runs").select("*").order("run_length", { ascending: false }).limit(10),
    supabase.from("record_jumps_falls").select("*").eq("previous_position", 1).order("position_change", { ascending: true }).limit(10),

    // weekly peaks
    supabase.from("chart_entries").select(entrySelect).order("sales", { ascending: false }).limit(10),
    supabase.from("chart_entries").select(entrySelect).order("streams", { ascending: false }).limit(10),
    supabase.from("chart_entries").select(entrySelect).order("airplay", { ascending: false }).limit(10),

    // debut peaks
    supabase.from("chart_entries").select(entrySelect).eq("weeks_on_chart", 1).order("sales", { ascending: false }).limit(10),
    supabase.from("chart_entries").select(entrySelect).eq("weeks_on_chart", 1).order("streams", { ascending: false }).limit(10),
    supabase.from("chart_entries").select(entrySelect).eq("weeks_on_chart", 1).order("airplay", { ascending: false }).limit(10),

    // longevity
    supabase.from("record_weeks_at_ranks").select("*").order("weeks_at_1", { ascending: false }).limit(10),
    supabase.from("record_weeks_at_ranks").select("*").order("weeks_in_top_10", { ascending: false }).limit(10),
    supabase.from("record_weeks_at_ranks").select("*").order("weeks_in_top_25", { ascending: false }).limit(10),
    supabase.from("record_weeks_at_ranks").select("*").order("total_weeks", { ascending: false }).limit(10),
  ]);

  return {
    highestPoints: highestPointsRes.data || [],
    highestDebut: highestDebutRes.data || [],
    biggestJump: biggestJumpRes.data || [],
    biggestFall: biggestFallRes.data || [],
    biggestJumpTo1: biggestJumpTo1Res.data || [],
    longestFirstRun: longestFirstRunRes.data || [],
    biggestFallFrom1: biggestFallFrom1Res.data || [],
    highestSales: highestSalesRes.data || [],
    highestStreams: highestStreamsRes.data || [],
    highestAirplay: highestAirplayRes.data || [],
    highestDebutSales: highestDebutSalesRes.data || [],
    highestDebutStreams: highestDebutStreamsRes.data || [],
    highestDebutAirplay: highestDebutAirplayRes.data || [],
    mostWeeksAt1: mostWeeksAt1Res.data || [],
    mostWeeksTop10: mostWeeksTop10Res.data || [],
    mostWeeksTop25: mostWeeksTop25Res.data || [],
    mostTotalWeeks: mostTotalWeeksRes.data || [],
  };
}