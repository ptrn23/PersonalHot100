import { ImageResponse } from "next/og";
import { supabase } from "@/utils/supabase";

export const alt = "Album Chart Performance";
export const size = { width: 1200, height: 600 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  
  const { data: album } = await supabase
    .from("albums")
    .select("cover_url")
    .eq("id", resolvedParams.id)
    .single();

  const coverUrl = album?.cover_url || "https://yourdomain.com/default-cover.png";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          backgroundColor: "#000",
        }}
      >
        <img
          src={coverUrl}
          style={{
            width: "50%",
            height: "100%",
            objectFit: "cover",
          }}
        />
        <img
          src={coverUrl}
          style={{
            width: "50%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}