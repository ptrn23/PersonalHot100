import { ImageResponse } from "next/og";
import { supabase } from "@/utils/supabase";
import { promises as fs } from "fs";
import path from "path";

export const alt = "Album Chart Performance";
export const size = { width: 1200, height: 600 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  
  const fontPath = path.join(process.cwd(), "public", "fonts", "Geist-Black.ttf");
  const fontData = await fs.readFile(fontPath);

  const { data: album } = await supabase
    .from("albums")
    .select("title, cover_url, artists(name)")
    .eq("id", resolvedParams.id)
    .single();

  const title = album?.title || "Unknown Album";
  const artistName = (album?.artists as any)?.name || "Unknown Artist";
  const coverUrl = album?.cover_url;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", backgroundColor: "#B30000", fontFamily: "Geist" }}>
        <div style={{ display: "flex", width: "50%" }}>
           <img src={coverUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <div style={{ display: "flex", width: "50%", padding: 60, flexDirection: "column", color: "white" }}>
           <h1 style={{ fontSize: 60 }}>{title}</h1>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Geist",
          data: fontData,
          weight: 700,
          style: "normal",
        },
      ],
    }
  );
}