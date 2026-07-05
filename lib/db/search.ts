"use server";

import { supabase } from "@/utils/supabase";

export async function performGlobalSearch(query: string) {
  if (!query.trim()) {
    return { artists: [], albums: [], songs: [] };
  }

  const [resArtists, resAlbums, resSongs] = await Promise.all([
    supabase
      .from("artists")
      .select("id, name, image_url")
      .ilike("name", `%${query}%`)
      .limit(3),
    supabase
      .from("albums")
      .select("id, title, cover_url")
      .ilike("title", `%${query}%`)
      .limit(3),
    supabase
      .from("songs")
      .select("id, title, display_title, artists(name)")
      .ilike("title", `%${query}%`)
      .limit(5),
  ]);

  return {
    artists: resArtists.data || [],
    albums: resAlbums.data || [],
    songs: resSongs.data || [],
  };
}