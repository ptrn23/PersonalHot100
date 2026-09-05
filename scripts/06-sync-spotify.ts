import { SupabaseClient } from "@supabase/supabase-js";
import { getSpotifyTrackId, getSpotifyArtistImage } from "../utils/spotify";

export async function syncSpotifyIds(supabaseAdmin: SupabaseClient, stagedEntries: any[]) {
  console.log("\nRunning Spotify Data Synchronization...");

  const top100Ids = stagedEntries.slice(0, 100).map((e) => e.song_id).filter(Boolean);

  const { data: missingSongs, error: songError } = await supabaseAdmin
    .from("songs")
    .select("id, title, artists(name)")
    .in("id", top100Ids)
    .is("spotify_id", null);

  if (songError) {
    console.error("Error fetching songs for Spotify sync:", songError);
  } else if (missingSongs && missingSongs.length > 0) {
    console.log(`Found ${missingSongs.length} songs missing Spotify IDs. Fetching...`);
    let songUpdates = 0;

    for (const song of missingSongs) {
      const artistName = (song.artists as any)?.name || "Unknown Artist";
      const spotifyId = await getSpotifyTrackId(song.title, artistName);

      if (spotifyId) {
        await supabaseAdmin.from("songs").update({ spotify_id: spotifyId }).eq("id", song.id);
        songUpdates++;
      }
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
    console.log(`Successfully synced ${songUpdates} new Spotify Track IDs!`);
  }

  const { data: top100SongsData } = await supabaseAdmin
    .from("songs")
    .select("artist_id")
    .in("id", top100Ids);

  const top100ArtistIds = Array.from(
    new Set(top100SongsData?.map((s) => s.artist_id).filter(Boolean))
  );

  if (top100ArtistIds.length === 0) return;

  const { data: missingArtists, error: artistError } = await supabaseAdmin
    .from("artists")
    .select("id, name")
    .in("id", top100ArtistIds)
    .is("square_image", null);

  if (artistError) {
    console.error("Error fetching artists for Spotify sync:", artistError);
  } else if (missingArtists && missingArtists.length > 0) {
    console.log(`Found ${missingArtists.length} currently charting artists missing Square Images. Fetching...`);
    let artistUpdates = 0;

    for (const artist of missingArtists) {
      const imageUrl = await getSpotifyArtistImage(artist.name);

      if (imageUrl) {
        await supabaseAdmin.from("artists").update({ square_image: imageUrl }).eq("id", artist.id);
        artistUpdates++;
      }
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
    console.log(`Successfully synced ${artistUpdates} new Artist Images!`);
  } else {
    console.log("All currently charting artists already have Square Images.");
  }
}
