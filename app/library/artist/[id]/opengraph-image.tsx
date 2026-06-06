import { ImageResponse } from "next/og";
import { supabase } from "@/utils/supabase";
import { promises as fs } from "fs";
import path from "path";

export const alt = "Artist Chart Performance";
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

  const { data: artist } = await supabase
    .from("artists")
    .select("name, image_url")
    .eq("id", resolvedParams.id)
    .single();

  const artistName = artist?.name || "Unknown Artist";
  const imageUrl = artist?.image_url;

  return new ImageResponse(
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
      {imageUrl && (
        <img
          src={imageUrl}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            zIndex: 0,
          }}
        />
      )}

      {imageUrl && (
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            width: "50%",
            backgroundColor: "#EB0000",
            opacity: 0.9,
            zIndex: 5,
          }}
        />
      )}

      <div
        style={{
          position: "relative",
          display: "flex",
          width: "50%",
          height: "100%",
          zIndex: 10,
        }}
      >
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
          ARTIST
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
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
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
          }}
        >
          <h1
            style={{
              fontSize: artistName.length > 20 ? 65 : 90,
              lineHeight: 0.9,
              margin: 0,
              textTransform: "uppercase",
              textAlign: "right",
            }}
          >
            {artistName}
          </h1>
        </div>
      </div>
    </div>,
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
    },
  );
}
