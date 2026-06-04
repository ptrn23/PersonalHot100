import { ImageResponse } from "next/og";
import { supabase } from "@/utils/supabase";

export const alt = "Album Chart Performance";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: { id: string } }) {
  const { data: album } = await supabase
    .from("albums")
    .select("title, cover_url, artists(name)")
    .eq("id", params.id)
    .single();

  const title = album?.title || "Unknown Album";
  const artistName = (album?.artists as any)?.name || "Unknown Artist";
  const coverUrl = album?.cover_url || "https://yourdomain.com/default-cover.png";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          backgroundColor: "#000",
          color: "#fff",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <img
          src={coverUrl}
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "blur(40px) brightness(0.3)",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            width: "100%",
            height: "100%",
            padding: "80px",
            zIndex: 10,
          }}
        >
          <img
            src={coverUrl}
            style={{
              width: "400px",
              height: "400px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.8)",
              border: "4px solid #fff",
            }}
          />

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginLeft: "60px",
            }}
          >
            <p
              style={{
                fontSize: "32px",
                fontWeight: "bold",
                color: "#B30000",
                textTransform: "uppercase",
                letterSpacing: "4px",
                margin: 0,
              }}
            >
              Personal Hot 100
            </p>
            <h1
              style={{
                fontSize: "72px",
                fontWeight: "900",
                lineHeight: "1.1",
                margin: "20px 0",
                textTransform: "uppercase",
                color: "white",
              }}
            >
              {title}
            </h1>
            <p style={{ fontSize: "40px", color: "#ccc", margin: 0 }}>
              By {artistName}
            </p>
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            top: "40px",
            right: "40px",
            display: "flex",
            alignItems: "center",
          }}
        >
          <div
            style={{
              background: "#B30000",
              color: "white",
              padding: "10px 20px",
              fontSize: "24px",
              fontWeight: "bold",
              borderRadius: "8px",
            }}
          >
            HOT 100
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}