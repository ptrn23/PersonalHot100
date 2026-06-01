import { supabase } from "@/utils/supabase";
import Link from "next/link";

export default async function ArtistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;

  const { data: artist, error } = await supabase
    .from("artists")
    .select("*")
    .eq("id", resolvedParams.id)
    .single();

  if (error || !artist) {
    return <div className="p-10 font-bold text-red-500">Artist not found.</div>;
  }

  return (
    <main className="min-h-screen bg-white text-gray-900 p-10">
      <Link
        href="/"
        className="text-sm font-bold text-gray-400 hover:text-black uppercase tracking-widest mb-8 block transition-colors"
      >
        Back to Hot 100
      </Link>

      <header className="mb-10 pb-6 border-b-2 border-black">
        <h1 className="text-6xl font-black uppercase tracking-tighter">
          {artist.name}
        </h1>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-sm mt-2">
          Artist Profile
        </p>
      </header>

      <div className="bg-gray-50 border border-gray-200 p-8 rounded-lg max-w-2xl">
        <p className="text-gray-600 font-medium">
          Database ID:{" "}
          <span className="font-mono text-xs bg-gray-200 px-2 py-1 rounded">
            {artist.id}
          </span>
        </p>
        <p className="mt-4 text-sm text-gray-500">
          Query Supabase here to instantly list all #1s, total weeks on chart,
          and the full discography performance for {artist.name}.
        </p>
      </div>
    </main>
  );
}
