import { supabase } from "@/utils/supabase";
import Link from "next/link";

export default async function AlbumPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const { data: album, error } = await supabase
    .from("albums")
    .select(
      `
      *,
      artists ( id, name )
    `,
    )
    .eq("id", resolvedParams.id)
    .single();

  if (error || !album) {
    return <div className="p-10 font-bold text-red-500">Album not found.</div>;
  }

  const artistName = album.artists?.name || "Unknown Artist";
  const artistId = album.artists?.id;

  return (
    <main className="min-h-screen bg-white text-gray-900 p-10">
      <Link
        href="/"
        className="text-sm font-bold text-gray-400 hover:text-black uppercase tracking-widest mb-8 block transition-colors"
      >
        Back to Hot 100
      </Link>

      <div className="max-w-5xl">
        <div className="flex flex-col md:flex-row gap-10 items-end mb-12 pb-8 border-b-2 border-black">
          <div className="w-64 h-64 shrink-0 bg-gray-100 shadow-xl border border-gray-200">
            {album.cover_url ? (
              <img
                src={album.cover_url}
                alt={album.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold uppercase text-sm">
                No Cover
              </div>
            )}
          </div>

          <div>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-sm mb-2">
              Album Profile
            </p>
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-4">
              {album.title}
            </h1>
            <Link
              href={`/artist/${artistId}`}
              className="text-2xl font-bold text-gray-600 hover:text-blue-600 transition-colors inline-block"
            >
              By {artistName}
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-50 border border-gray-200 p-6 rounded-lg col-span-2">
            <h2 className="font-black uppercase text-xl mb-2">
              Tracklist Performance
            </h2>
            <p className="text-sm text-gray-500">
              TO DO: Generate a table of every song on{" "}
              <strong>{album.title}</strong> that charted on the Hot 100,
              displaying their individual peaks and then total units.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg flex flex-col justify-center items-center text-center">
            <span className="font-bold text-blue-800 text-xs uppercase mb-1">
              Total Era Units
            </span>
            <span className="text-5xl font-black text-blue-900 tracking-tighter">
              --
            </span>
            <span className="text-xs text-blue-600/70 font-mono font-bold tracking-tight mt-1">
              (Pending Calculation Engine)
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
