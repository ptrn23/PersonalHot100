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
        <pre className="mt-4 bg-gray-100 p-4 rounded text-sm">
          {JSON.stringify(error, null, 2)}
        </pre>
      </div>
    );
  }

  return (
    <div className="p-10 font-sans">
      <h1 className="text-3xl font-black mb-6 uppercase tracking-tighter">
        Database Connection Test
      </h1>
      <p className="mb-4 text-green-600 font-bold">
        ✅ Successfully connected to Supabase!
      </p>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 max-w-xl">
        <h2 className="text-xl font-bold mb-4 border-b pb-2">
          Latest Artists Imported:
        </h2>
        <ul className="space-y-2 text-sm">
          {artists?.map((artist, index) => (
            <li
              key={artist.id}
              className="flex justify-between items-center bg-white p-3 rounded shadow-sm border"
            >
              <span className="font-semibold text-gray-800">
                {index + 1}. {artist.name}
              </span>
              <span className="text-gray-400 text-xs truncate ml-4 w-32">
                {artist.id}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
