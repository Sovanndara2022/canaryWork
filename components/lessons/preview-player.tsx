"use client";

// Plain Mux player for server-rendered pages that don't track views or
// progress (admin review, instructor preview).
import MuxPlayer from "@mux/mux-player-react";

export function PreviewPlayer({ playbackId }: { playbackId: string }) {
  return (
    <div className="overflow-hidden rounded-xl bg-black">
      <MuxPlayer playbackId={playbackId} accentColor="#f5f5f5" style={{ aspectRatio: "16 / 9", width: "100%", display: "block" }} />
    </div>
  );
}
