import { SupabaseClient } from "@supabase/supabase-js";
import { getSpotifyTrackMetadata, getSpotifyArtistMetadata } from "../utils/spotify";

export async function syncSpotifyIds(supabaseAdmin: SupabaseClient, stagedEntries: any[]) {
  console.log("\nRunning Spotify Metadata Synchronization...");

  const top100Ids = stagedEntries.slice(0, 100).map((e) => e.song_id).filter(Boolean);

  const { data: missingSongs, error: songError } = await supabaseAdmin
    .from("songs")
    .select("id, title, album_id, artists(name)")
    .in("id", top100Ids)
    .is("release_date", null);

  if (songError) {
    console.error("Error fetching songs for Spotify sync:", songError);
  } else if (missingSongs && missingSongs.length > 0) {
    console.log(`Found ${missingSongs.length} songs missing metadata. Fetching...`);
    let songUpdates = 0;

    for (const song of missingSongs) {
      const artistName = (song.artists as any)?.name || "Unknown Artist";
      const meta = await getSpotifyTrackMetadata(song.title, artistName);

      if (meta) {
        await supabaseAdmin.from("songs").update({ 
          spotify_id: meta.song.spotify_id,
          release_date: meta.song.release_date,
          release_date_precision: meta.song.release_date_precision,
        }).eq("id", song.id);

        if (song.album_id) {
          await supabaseAdmin.from("albums").update({
            spotify_id: meta.album.spotify_id,
            album_type: meta.album.album_type,
            release_date: meta.album.release_date,
            release_date_precision: meta.album.release_date_precision,
            cover_url: meta.album.cover_url,
          }).eq("id", song.album_id);
        }

        songUpdates++;
      }
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
    console.log(`Successfully synced metadata for ${songUpdates} songs and their albums!`);
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
    .is("spotify_id", null);

  if (artistError) {
    console.error("Error fetching artists for Spotify sync:", artistError);
  } else if (missingArtists && missingArtists.length > 0) {
    console.log(`Found ${missingArtists.length} currently charting artists missing Spotify IDs. Fetching...`);
    let artistUpdates = 0;

    for (const artist of missingArtists) {
      const meta = await getSpotifyArtistMetadata(artist.name);

      if (meta) {
        await supabaseAdmin.from("artists").update({ 
          spotify_id: meta.spotify_id,
          square_image: meta.square_image 
        }).eq("id", artist.id);

        artistUpdates++;
      }
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
    console.log(`Successfully synced ${artistUpdates} new Artist profiles!`);
  } else {
    console.log("All currently charting artists have up-to-date metadata.");
  }
}
