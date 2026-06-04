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
      <div style={{ 
        width: "100%", 
        height: "100%", 
        display: "flex", 
        backgroundColor: "#B30000", 
        fontFamily: "Geist" 
      }}>
        <div style={{ position: "relative", display: "flex", width: "45%" }}>
           <img src={coverUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
           <div style={{ 
             position: "absolute", 
             top: 0, 
             left: 0, 
             backgroundColor: "black", 
             color: "white", 
             padding: "5px 5px", 
             fontSize: 24,
             fontWeight: 700 
           }}>
             ALBUM
           </div>
        </div>

        <div style={{ 
  display: "flex", 
  width: "55%", 
  padding: 40, 
  flexDirection: "column", 
  justifyContent: "space-between",
  color: "white" 
}}>
   <div style={{ display: "flex", justifyContent: "flex-end" }}>
     <span style={{ 
       fontSize: 20, 
       letterSpacing: 4, 
       opacity: 0.9, 
       textTransform: "uppercase" 
     }}>
       PERSONAL HOT 100
     </span>
   </div>
   
   <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
     <h1 style={{ 
       fontSize: 70, 
       lineHeight: 0.85, 
       margin: 0, 
       textTransform: "uppercase",
       textAlign: "right"
     }}>
       {title}
     </h1>

     <div style={{ 
       width: 80, 
       height: 4, 
       backgroundColor: "white", 
       margin: "30px 0" 
     }} />

     <span style={{ 
       fontSize: 20, 
       fontWeight: 700, 
       opacity: 0.9 
     }}>
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