const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

async function getSpotifyAccessToken(): Promise<string | null> {
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    console.error("Spotify API keys are missing in environment variables.");
    return null;
  }

  const basicAuth = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64");

  try {
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error("Error authenticating with Spotify:", error);
    return null;
  }
}

/**
 * Parses a Spotify date string (YYYY, YYYY-MM, or YYYY-MM-DD) into a valid Postgres DATE (YYYY-MM-DD)
 */
export function formatSpotifyDate(dateStr: string): string {
  if (!dateStr) return "1970-01-01";
  if (dateStr.length === 4) return `${dateStr}-01-01`; // Just a year
  if (dateStr.length === 7) return `${dateStr}-01`;    // Year and month
  return dateStr;
}

export async function getSpotifyTrackMetadata(title: string, artist: string) {
  const token = await getSpotifyAccessToken();
  if (!token) return null;
  
  const cleanTitle = title.replace(/&/g, "and").trim();
  const cleanArtist = artist.replace(/&/g, "and").trim();
  
  const query = encodeURIComponent(`track:${cleanTitle} artist:${cleanArtist}`);

  try {
    const response = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=track&limit=1`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error(`Spotify Search API error for ${title} by ${artist}`);
      return null;
    }

    const data = await response.json();
    const track = data.tracks?.items?.[0];

    if (!track) return null;

    return {
      song: {
        spotify_id: track.id,
        release_date: formatSpotifyDate(track.album.release_date), 
        release_date_precision: track.album.release_date_precision,
      },
      album: {
        spotify_id: track.album.id,
        album_type: track.album.album_type,
        release_date: formatSpotifyDate(track.album.release_date),
        release_date_precision: track.album.release_date_precision,
        cover_url: track.album.images?.[0]?.url || null, // High-res cover
      }
    };
  } catch (error) {
    console.error(`Error fetching Spotify data for ${title}:`, error);
    return null;
  }
}

export async function getSpotifyArtistMetadata(artistName: string) {
  const token = await getSpotifyAccessToken();
  if (!token) return null;

  const cleanArtist = artistName.replace(/&/g, "and").trim();
  const query = encodeURIComponent(`artist:${cleanArtist}`);

  try {
    const response = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=artist&limit=1`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error(`Spotify Artist Search API error for ${artistName}`);
      return null;
    }

    const data = await response.json();
    const artist = data.artists?.items?.[0];

    if (!artist) return null;

    return {
      spotify_id: artist.id,
      square_image: artist.images?.[0]?.url || null,
      // genres: artist.genres || [] 
    };
  } catch (error) {
    console.error(`Error fetching Spotify artist data for ${artistName}:`, error);
    return null;
  }
}
