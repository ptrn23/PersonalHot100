import { supabase } from "@/utils/supabase";

// Next.js Server Component
export default async function DatabaseTestPage() {
  // Fetch the 10 most recently added artists
  const { data: artists, error } = await supabase
    .from("artists")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    return (
      <div className="p-10 text-red-500">
        <h1 className="text-2xl font-bold">Database Connection Error</h1>
        <pre className="mt-4 rounded bg-gray-100 p-4 text-sm">{JSON.stringify(error, null, 2)}</pre>
      </div>
    );
  }

  return (
    <div className="p-10 font-sans">
      <h1 className="mb-6 text-3xl font-black tracking-tighter uppercase">
        Database Connection Test
      </h1>
      <p className="mb-4 font-bold text-green-600">✅ Successfully connected to Supabase!</p>

      <div className="max-w-xl rounded-lg border border-gray-200 bg-gray-50 p-6">
        <h2 className="mb-4 border-b pb-2 text-xl font-bold">Latest Artists Imported:</h2>
        <ul className="space-y-2 text-sm">
          {artists?.map((artist, index) => (
            <li
              key={artist.id}
              className="flex items-center justify-between rounded border bg-white p-3 shadow-sm"
            >
              <span className="font-semibold text-gray-800">
                {index + 1}. {artist.name}
              </span>
              <span className="ml-4 w-32 truncate text-xs text-gray-400">{artist.id}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
