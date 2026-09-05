import { SupabaseClient } from "@supabase/supabase-js";
import { getSpotifyTrackId } from "../utils/spotify";

export async function syncSpotifyIds(supabaseAdmin: SupabaseClient, stagedEntries: any[]) {
  console.log("\nRunning Spotify ID Synchronization...");

  const top100Ids = stagedEntries.slice(0, 100).map((e) => e.song_id).filter(Boolean);

  const { data: missingSongs, error } = await supabaseAdmin
    .from("songs")
    .select("id, title, artists(name)")
    .in("id", top100Ids)
    .is("spotify_id", null);

  if (error) {
    console.error("Error fetching songs for Spotify sync:", error);
    return;
  }

  if (!missingSongs || missingSongs.length === 0) {
    console.log("All Top 100 songs already have Spotify IDs. Skipping.");
    return;
  }

  console.log(`Found ${missingSongs.length} songs missing Spotify IDs. Fetching...`);

  let updatedCount = 0;

  for (const song of missingSongs) {
    const artistName = (song.artists as any)?.name || "Unknown Artist";
    const spotifyId = await getSpotifyTrackId(song.title, artistName);

    if (spotifyId) {
      await supabaseAdmin
        .from("songs")
        .update({ spotify_id: spotifyId })
        .eq("id", song.id);
      
      updatedCount++;
    }

    // 150ms delay to prevent hitting Spotify API rate limits
    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  console.log(`Successfully synced ${updatedCount} new Spotify IDs!`);
}