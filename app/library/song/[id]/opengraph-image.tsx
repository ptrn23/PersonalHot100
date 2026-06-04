import { ImageResponse } from "next/og";
import { supabase } from "@/utils/supabase";
import { promises as fs } from "fs";
import path from "path";

export const alt = "Song Chart Performance";
export const size = { width: 1200, height: 600 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;

  const fontPath = path.join(
    process.cwd(),
    "public",
    "fonts",
    "Geist-Black.ttf",
  );
  const fontData = await fs.readFile(fontPath);

  const { data: song } = await supabase
    .from("songs")
    .select(`
      title,
      artists(name),
      albums(cover_url)
    `)
    .eq("id", resolvedParams.id)
    .single();

  const title = song?.title || "Unknown Song";
  const artistName = (song?.artists as any)?.name || "Unknown Artist";
  const coverUrl = (song?.albums as any)?.cover_url;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          backgroundColor: "#EB0000",
          fontFamily: "Geist",
          position: "relative",
        }}
      >
        <div style={{ position: "relative", display: "flex", width: "50%", height: "100%" }}>
          {coverUrl && (
            <img
              src={coverUrl}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          )}
          <div
            style={{
              position: "absolute",
              top: 40,
              left: 40,
              backgroundColor: "black",
              color: "white",
              padding: "10px 20px",
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: 2,
            }}
          >
            SONG
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 0,
            bottom: 0,
            borderLeft: "4px dashed rgba(235,0,0,1)",
            marginLeft: -2,
            zIndex: 20,
          }}
        />

        <div
          style={{
            position: "relative",
            display: "flex",
            width: "50%",
            height: "100%",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: 60,
            color: "white",
            overflow: "hidden",
          }}
        >
          {coverUrl && (
            <img
              src={coverUrl}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: "150%",
                height: "150%",
                objectFit: "cover",
                opacity: 0.15,
              }}
            />
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", zIndex: 10 }}>
            <span
              style={{
                fontSize: 20,
                letterSpacing: 4,
                opacity: 0.7,
                textTransform: "uppercase",
              }}
            >
              Personal Hot 100
            </span>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              zIndex: 10,
            }}
          >
            <h1
              style={{
                fontSize: title.length > 25 ? 60 : 80,
                lineHeight: 0.9,
                margin: 0,
                textTransform: "uppercase",
                textAlign: "right",
              }}
            >
              {title}
            </h1>

            <div
              style={{
                width: 100,
                height: 4,
                backgroundColor: "white",
                margin: "30px 0",
                opacity: 0.8,
              }}
            />

            <span
              style={{
                fontSize: 32,
                fontWeight: 700,
                opacity: 1,
              }}
            >
              {artistName}
            </span>
          </div>
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