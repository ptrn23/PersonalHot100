import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
dotenv.config();

const getStableSeed = (title: string, artist: string) => {
  const combo = `${title}|${artist}`;
  let hash = 0;
  for (let i = 0; i < combo.length; i++) {
    hash += (i + 1) * combo.charCodeAt(i);
  }
  return hash;
};

const applyDeviation = (
  base: number,
  seed: number,
  scale = 0.1,
  mod = 100,
) => {
  const deviation = ((seed % mod) / mod - 0.5) * 2 * scale;
  return Math.floor(base * (1 + deviation));
};

const calculateUnits = (entry: any, title: string, artist: string): number => {
  const streams = entry.streams || 0;
  const sales = entry.sales || 0;
  const airplay = entry.airplay || 0;
  
  const base = Math.floor((streams + sales + airplay) * 1750 * 2);
  
  const seed = getStableSeed(title, artist);
  return applyDeviation(base, seed + 4);
};

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
);

const CERT_THRESHOLDS = {
  song: {
    Gold: 500_000,
    Platinum: 1_000_000,
    Diamond: 10_000_000,
  },
  album: {
    Gold: 1_000_000,
    Platinum: 5_000_000,
    Diamond: 50_000_000,
  },
};

export const runCertifications = async (isFinalizing?: boolean, overrideTargetDate?: string) => {
  console.log("\nRunning certification engine...");
  if (!isFinalizing) {
    console.log("\nWeek not finished yet. Skipping certifications...");
    return;
  }

  let targetWeek;
  if (overrideTargetDate) {
    const exactCutoff = `${overrideTargetDate} 22:00:00+00`;
    const { data } = await supabase
      .from("chart_weeks")
      .select("*")
      .lte("end_date", exactCutoff)
      .order("end_date", { ascending: false })
      .limit(1)
      .single();
    targetWeek = data;
  } else {
    const { data } = await supabase
      .from("chart_weeks")
      .select("*")
      .order("end_date", { ascending: false })
      .limit(1)
      .single();
    targetWeek = data;
  }

  if (!targetWeek) {
    console.error("ERROR: No chart weeks found for certifications.");
    return;
  }

  console.log(`Checking certifications for week of ${targetWeek.start_date}`);

  const { data: weekEntries, error: entriesError } = await supabase
    .from("chart_entries")
    .select(`
      song_id,
      songs ( album_id )
    `)
    .eq("week_id", targetWeek.id);

  if (entriesError || !weekEntries || weekEntries.length === 0) {
    console.log("No chart entries found this week to certify.");
    return;
  }

  const songIds = Array.from(new Set(weekEntries.map((e) => e.song_id)));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const albumIds = Array.from(new Set(weekEntries.map((e) => (e.songs as any)?.album_id).filter(Boolean)));

  console.log(`Found ${songIds.length} unique songs and ${albumIds.length} unique albums to evaluate.`);
  
  let albumSongsData: any[] = [];
  if (albumIds.length > 0) {
    const { data, error } = await supabase
      .from("songs")
      .select("id, album_id, title, artists(name)")
      .in("album_id", albumIds);

    if (error) {
      console.error("Error fetching album songs:", error);
      return;
    }
    albumSongsData = data || [];
  }

  const albumSongsMap = new Map<string, string>();
  const songSeedMap = new Map<string, { title: string; artist: string }>();

  albumSongsData?.forEach((s) => {
    if (s.album_id) albumSongsMap.set(s.id, s.album_id);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const artistName = (s.artists as any)?.name || "Unknown Artist";
    songSeedMap.set(s.id, { title: s.title || "", artist: artistName });
  });
  
  const allRelevantSongIds = Array.from(
    new Set([...songIds, ...(albumSongsData?.map((s) => s.id) || [])])
  );

  const missingSeedIds = allRelevantSongIds.filter(id => !songSeedMap.has(id));
  if (missingSeedIds.length > 0) {
    const { data: missingSongs } = await supabase
      .from("songs")
      .select("id, title, artists(name)")
      .in("id", missingSeedIds);
      
    missingSongs?.forEach(s => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const artistName = (s.artists as any)?.name || "Unknown Artist";
      songSeedMap.set(s.id, { title: s.title || "", artist: artistName });
    });
  }

  console.log(`Fetching historical points for ${allRelevantSongIds.length} tracks...`);

  const historicalEntries: any[] = [];
  let from = 0;
  const step = 1000;

  while (true) {
    const { data, error } = await supabase
      .from("chart_entries")
      .select(`
        song_id, 
        total_points, 
        streams, 
        sales, 
        airplay, 
        chart_weeks!inner(end_date)
      `)
      .in("song_id", allRelevantSongIds)
      .lte("chart_weeks.end_date", targetWeek.end_date)
      .range(from, from + step - 1);

    if (error) {
      console.error("Database error fetching historical points:", error);
      return;
    }

    if (!data || data.length === 0) break;
    historicalEntries.push(...data);

    if (data.length < step) break;
    from += step;
  }

  const songTotals = new Map<string, number>();
  const albumTotals = new Map<string, number>();

  for (const entry of historicalEntries) {
    const sId = entry.song_id;
    
    const seedData = songSeedMap.get(sId) || { title: "Unknown", artist: "Unknown" };
    const units = calculateUnits(entry, seedData.title, seedData.artist);

    songTotals.set(sId, (songTotals.get(sId) || 0) + units);

    const aId = albumSongsMap.get(sId);
    if (aId) {
      albumTotals.set(aId, (albumTotals.get(aId) || 0) + units);
    }
  }

  console.log("Points tallied successfully!");

  let certsQuery = supabase.from("certifications").select("song_id, album_id, award_name, multiplier");
  
  if (albumIds.length > 0) {
    certsQuery = certsQuery.or(`song_id.in.(${songIds.join(",")}),album_id.in.(${albumIds.join(",")})`);
  } else {
    certsQuery = certsQuery.in("song_id", songIds);
  }

  const { data: existingCerts, error: certsError } = await certsQuery;

  if (certsError) {
    console.error("Error fetching existing certifications:", certsError);
    return;
  }

  const existingSongCerts = new Set<string>();
  const existingAlbumCerts = new Set<string>();

  existingCerts?.forEach((c) => {
    if (c.song_id) {
      existingSongCerts.add(`${c.song_id}-${c.award_name}-${c.multiplier}`);
    } else if (c.album_id) {
      existingAlbumCerts.add(`${c.album_id}-${c.award_name}-${c.multiplier}`);
    }
  });

  const certsToInsert: any[] = [];

  for (const sId of songIds) {
    const total = songTotals.get(sId) || 0;
    if (total === 0) continue;

    // GOLD
    if (total >= CERT_THRESHOLDS.song.Gold) {
      const key = `${sId}-Gold-1`;
      if (!existingSongCerts.has(key)) {
        certsToInsert.push({ entity_type: "song", song_id: sId, award_name: "Gold", multiplier: 1, week_id: targetWeek.id });
      }
    }

    // PLATINUM
    if (total >= CERT_THRESHOLDS.song.Platinum) {
      const maxPlatMultiplier = Math.floor(total / CERT_THRESHOLDS.song.Platinum);
      const platLimit = total >= CERT_THRESHOLDS.song.Diamond ? 9 : maxPlatMultiplier;

      for (let m = 1; m <= platLimit; m++) {
        const key = `${sId}-Platinum-${m}`;
        if (!existingSongCerts.has(key)) {
          certsToInsert.push({ entity_type: "song", song_id: sId, award_name: "Platinum", multiplier: m, week_id: targetWeek.id });
        }
      }
    }

    // DIAMOND
    if (total >= CERT_THRESHOLDS.song.Diamond) {
      const maxDiamondMultiplier = Math.floor(total / CERT_THRESHOLDS.song.Diamond);
      for (let m = 1; m <= maxDiamondMultiplier; m++) {
        const key = `${sId}-Diamond-${m}`;
        if (!existingSongCerts.has(key)) {
          certsToInsert.push({ entity_type: "song", song_id: sId, award_name: "Diamond", multiplier: m, week_id: targetWeek.id });
        }
      }
    }
  }

  for (const aId of albumIds) {
    const total = albumTotals.get(aId) || 0;
    if (total === 0) continue;

    // GOLD
    if (total >= CERT_THRESHOLDS.album.Gold) {
      const key = `${aId}-Gold-1`;
      if (!existingAlbumCerts.has(key)) {
        certsToInsert.push({ entity_type: "album", album_id: aId, award_name: "Gold", multiplier: 1, week_id: targetWeek.id });
      }
    }

    // PLATINUM
    if (total >= CERT_THRESHOLDS.album.Platinum) {
      const maxPlatMultiplier = Math.floor(total / CERT_THRESHOLDS.album.Platinum);
      const platLimit = total >= CERT_THRESHOLDS.album.Diamond ? 9 : maxPlatMultiplier;

      for (let m = 1; m <= platLimit; m++) {
        const key = `${aId}-Platinum-${m}`;
        if (!existingAlbumCerts.has(key)) {
          certsToInsert.push({ entity_type: "album", album_id: aId, award_name: "Platinum", multiplier: m, week_id: targetWeek.id });
        }
      }
    }

    // DIAMOND
    if (total >= CERT_THRESHOLDS.album.Diamond) {
      const maxDiamondMultiplier = Math.floor(total / CERT_THRESHOLDS.album.Diamond);
      for (let m = 1; m <= maxDiamondMultiplier; m++) {
        const key = `${aId}-Diamond-${m}`;
        if (!existingAlbumCerts.has(key)) {
          certsToInsert.push({ entity_type: "album", album_id: aId, award_name: "Diamond", multiplier: m, week_id: targetWeek.id });
        }
      }
    }
  }

  if (certsToInsert.length === 0) {
    console.log("No new certifications earned this week.");
    return;
  }

  console.log(`Inserting ${certsToInsert.length} new plaque(s) into the database...`);
  const { error: insertError } = await supabase
    .from("certifications")
    .insert(certsToInsert);

  if (insertError) {
    console.error("Failed to save new certifications:", insertError);
  } else {
    console.log(`SUCCESS: Successfully awarded ${certsToInsert.length} new certifications!`);
  }
};