// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const setupNextChartWeek = async (
  supabase: any,
  targetWeekEndDate: string,
  isFinalizing: boolean,
) => {
  if (!isFinalizing) {
    console.log(`Current charting week still ongoing. Skipping calendar setup.`);
    return null;
  }

  console.log("Setting up the database for next week's tracking...");

  const nextStartDate = new Date(targetWeekEndDate);
  const nextEndDate = new Date(targetWeekEndDate);
  nextEndDate.setDate(nextEndDate.getDate() + 7);

  const nextStartStr = nextStartDate.toISOString();
  const nextEndStr = nextEndDate.toISOString();

  const { data: existingNextWeek } = await supabase
    .from("chart_weeks")
    .select("id")
    .eq("end_date", nextEndStr)
    .maybeSingle();

  if (existingNextWeek) {
    console.log(`Next charting week already exists. Skipping creation.`);
    return existingNextWeek;
  }

  const { data: newWeek, error: newWeekErr } = await supabase
    .from("chart_weeks")
    .insert({ start_date: nextStartStr, end_date: nextEndStr })
    .select()
    .single();

  if (newWeekErr) {
    console.error(`Failed to create next week:`, newWeekErr);
    throw newWeekErr;
  }

  console.log(`SUCCESS: Created next charting week (${newWeek.start_date} to ${newWeek.end_date})`);

  return newWeek;
};
