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

    if (!response.ok) {
      console.error("Failed to fetch Spotify access token");
      return null;
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error("Error authenticating with Spotify:", error);
    return null;
  }
}

export async function getSpotifyTrackId(title: string, artist: string): Promise<string | null> {
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

    return track ? track.id : null;
  } catch (error) {
    console.error(`Error fetching Spotify data for ${title}:`, error);
    return null;
  }
}