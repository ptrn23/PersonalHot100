import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
dotenv.config();

const getStableSeed = (seedString?: string) => {
  if (!seedString) return 0;
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    hash += (i + 1) * seedString.charCodeAt(i);
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

const calculateUnits = (entry: any): number => {
  const streams = entry.streams || 0;
  const sales = entry.sales || 0;
  const airplay = entry.airplay || 0;
  
  const base = Math.floor((streams + sales + airplay) * 1750 * 2);
  
  const seedString = `${entry.song_id}-${entry.week_id}`;
  const seed = getStableSeed(seedString);

  return applyDeviation(base, seed + 4);
};

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
);

const CERT_THRESHOLDS = {
  song: { Gold: 500_000, Platinum: 1_000_000, Diamond: 10_000_000 },
  album: { Gold: 1_000_000, Platinum: 5_000_000, Diamond: 50_000_000 },
};

async function rebuildAllCertifications() {
  console.log("🏁 Starting total certification rebuild...");

  // 1. Fetch all weeks in chronological order
  const { data: weeks, error: weeksErr } = await supabase
    .from("chart_weeks")
    .select("id, start_date")
    .order("start_date", { ascending: true });

  if (weeksErr || !weeks) {
    console.error("Failed to fetch chart weeks:", weeksErr);
    return;
  }
  console.log(`Loaded ${weeks.length} weeks chronologically.`);

  // 2. Fetch song-to-album mappings
  const songAlbumMap = new Map<string, string>();
  let songFrom = 0;
  const songStep = 1000;

  while (true) {
    const { data: songs, error: songsErr } = await supabase
      .from("songs")
      .select("id, album_id")
      .range(songFrom, songFrom + songStep - 1);

    if (songsErr) {
      console.error("Failed to fetch songs dictionary:", songsErr);
      return;
    }
    if (!songs || songs.length === 0) break;
    songs.forEach((s) => {
      if (s.album_id) songAlbumMap.set(s.id, s.album_id);
    });
    if (songs.length < songStep) break;
    songFrom += songStep;
  }
  console.log("Loaded song dictionary.");

  // 3. Fetch ALL historical chart entries in chronological order
  console.log("Fetching all chart entries (this might take a few moments)...");
  const allEntries: any[] = [];
  let entryFrom = 0;
  const entryStep = 1000;

  while (true) {
    const { data: entries, error: entriesErr } = await supabase
      .from("chart_entries")
      .select("song_id, week_id, total_points, streams, sales, airplay")
      .range(entryFrom, entryFrom + entryStep - 1);

    if (entriesErr) {
      console.error("Failed to fetch chart entries:", entriesErr);
      return;
    }
    if (!entries || entries.length === 0) break;
    allEntries.push(...entries);
    if (entries.length < entryStep) break;
    entryFrom += entryStep;
  }
  console.log(`Loaded ${allEntries.length} total chart entries.`);

  // 4. Group chart entries by week_id for rapid processing
  const entriesByWeek = new Map<string, any[]>();
  allEntries.forEach((entry) => {
    if (!entriesByWeek.has(entry.week_id)) {
      entriesByWeek.set(entry.week_id, []);
    }
    entriesByWeek.get(entry.week_id)!.push(entry);
  });

  // Running cumulative point totals
  const songTotals = new Map<string, number>();
  const albumTotals = new Map<string, number>();

  // Tracks awarded levels to prevent double-insertions during timeline simulation
  const awardedSongCerts = new Set<string>();
  const awardedAlbumCerts = new Set<string>();

  const certsToInsert: any[] = [];

  // 5. Chronological Simulation Loop
  for (const week of weeks) {
    const weekEntries = entriesByWeek.get(week.id) || [];
    if (weekEntries.length === 0) continue;

    // Add this week's points to our running totals
    weekEntries.forEach((entry) => {
      const sId = entry.song_id;
      const units = calculateUnits(entry); // 🚨 USING THE FORMULA

      songTotals.set(sId, (songTotals.get(sId) || 0) + units);

      const aId = songAlbumMap.get(sId);
      if (aId) {
        albumTotals.set(aId, (albumTotals.get(aId) || 0) + units);
      }
    });

    // Check milestones for every song that has points so far
    for (const [sId, total] of songTotals.entries()) {
      if (total >= CERT_THRESHOLDS.song.Gold) {
        const key = `${sId}-Gold-1`;
        if (!awardedSongCerts.has(key)) {
          awardedSongCerts.add(key);
          certsToInsert.push({ entity_type: "song", song_id: sId, award_name: "Gold", multiplier: 1, week_id: week.id });
        }
      }
      if (total >= CERT_THRESHOLDS.song.Platinum) {
        const maxPlat = Math.floor(total / CERT_THRESHOLDS.song.Platinum);
        const limit = total >= CERT_THRESHOLDS.song.Diamond ? 9 : maxPlat;
        for (let m = 1; m <= limit; m++) {
          const key = `${sId}-Platinum-${m}`;
          if (!awardedSongCerts.has(key)) {
            awardedSongCerts.add(key);
            certsToInsert.push({ entity_type: "song", song_id: sId, award_name: "Platinum", multiplier: m, week_id: week.id });
          }
        }
      }
      if (total >= CERT_THRESHOLDS.song.Diamond) {
        const maxDiamond = Math.floor(total / CERT_THRESHOLDS.song.Diamond);
        for (let m = 1; m <= maxDiamond; m++) {
          const key = `${sId}-Diamond-${m}`;
          if (!awardedSongCerts.has(key)) {
            awardedSongCerts.add(key);
            certsToInsert.push({ entity_type: "song", song_id: sId, award_name: "Diamond", multiplier: m, week_id: week.id });
          }
        }
      }
    }

    // Check milestones for every album that has points so far
    for (const [aId, total] of albumTotals.entries()) {
      if (total >= CERT_THRESHOLDS.album.Gold) {
        const key = `${aId}-Gold-1`;
        if (!awardedAlbumCerts.has(key)) {
          awardedAlbumCerts.add(key);
          certsToInsert.push({ entity_type: "album", album_id: aId, award_name: "Gold", multiplier: 1, week_id: week.id });
        }
      }
      if (total >= CERT_THRESHOLDS.album.Platinum) {
        const maxPlat = Math.floor(total / CERT_THRESHOLDS.album.Platinum);
        const limit = total >= CERT_THRESHOLDS.album.Diamond ? 9 : maxPlat;
        for (let m = 1; m <= limit; m++) {
          const key = `${aId}-Platinum-${m}`;
          if (!awardedAlbumCerts.has(key)) {
            awardedAlbumCerts.add(key);
            certsToInsert.push({ entity_type: "album", album_id: aId, award_name: "Platinum", multiplier: m, week_id: week.id });
          }
        }
      }
      if (total >= CERT_THRESHOLDS.album.Diamond) {
        const maxDiamond = Math.floor(total / CERT_THRESHOLDS.album.Diamond);
        for (let m = 1; m <= maxDiamond; m++) {
          const key = `${aId}-Diamond-${m}`;
          if (!awardedAlbumCerts.has(key)) {
            awardedAlbumCerts.add(key);
            certsToInsert.push({ entity_type: "album", album_id: aId, award_name: "Diamond", multiplier: m, week_id: week.id });
          }
        }
      }
    }
  }

  // 6. Database Operations: Clear old certifications and insert rebuilt ones
  console.log("Cleaning up old certification entries from database...");
  const { error: delErr } = await supabase.from("certifications").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (delErr) {
    console.error("Failed to clear old certifications:", delErr);
    return;
  }

  if (certsToInsert.length === 0) {
    console.log("Rebuild complete. Zero certifications earned across chart history.");
    return;
  }

  console.log(`Calculated ${certsToInsert.length} total historical milestones. Saving to DB in chunks...`);
  
  // Chunk inserts to comply with maximum payload constraints
  const chunkSize = 1000;
  for (let i = 0; i < certsToInsert.length; i += chunkSize) {
    const chunk = certsToInsert.slice(i, i + chunkSize);
    const { error: insErr } = await supabase.from("certifications").insert(chunk);
    if (insErr) {
      console.error(`Failed to insert chunk starting at index ${i}:`, insErr);
      return;
    }
  }

  console.log("🏆 SUCCESS: The historical certification timeline has been completely rebuilt!");
}

rebuildAllCertifications();