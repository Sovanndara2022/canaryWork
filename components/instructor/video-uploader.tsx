"use client";

// Mux direct upload (design doc, Section 10.2):
//   1. POST /api/upload/mux -> upload_url
//   2. browser PUTs the file straight to Mux (with a progress bar)
//   3. poll GET /api/lessons/:id/video until the asset is ready
//      (that route also attaches the asset if the webhook can't reach us)

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import MuxPlayer from "@mux/mux-player-react";
import { AlertTriangle, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, errorMessage } from "@/lib/api/client";
import { formatDuration } from "@/lib/format";

type Phase = "idle" | "requesting" | "uploading" | "processing" | "errored";

interface Props {
  lessonId: string;
  playbackId: string | null;
  durationSeconds: number | null;
  hasPendingUpload: boolean;
  editable: boolean;
  configured: boolean;
}

const MAX_BYTES = 2 * 1024 * 1024 * 1024; // 2 GB

export function VideoUploader({ lessonId, playbackId, durationSeconds, hasPendingUpload, editable, configured }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>(hasPendingUpload && configured ? "processing" : "idle");
  const [percent, setPercent] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  const poll = useCallback(async () => {
    try {
      const status = await api<{ state: string; playback_id: string | null; hint?: string }>(`/api/lessons/${lessonId}/video`);
      if (status.state === "ready" && status.playback_id && status.playback_id !== playbackId) {
        setPhase("idle");
        router.refresh();
        return true;
      }
      if (status.state === "ready" || status.state === "none") {
        setPhase("idle");
        return true;
      }
      if (status.state === "errored") {
        setPhase("errored");
        setMessage("Mux couldn't process this file. Try a different video (MP4 or MOV works best).");
        return true;
      }
      if (status.hint) setMessage(status.hint);
      return false;
    } catch (e) {
      setPhase("errored");
      setMessage(errorMessage(e));
      return true;
    }
  }, [lessonId, playbackId, router]);

  useEffect(() => {
    if (phase !== "processing") return;
    let stopped = false;
    const tick = async () => {
      if (stopped) return;
      const done = await poll();
      if (!done && !stopped) timer = setTimeout(tick, 4000);
    };
    let timer = setTimeout(tick, 1500);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [phase, poll]);

  async function onFile(file: File) {
    setMessage(null);
    if (!file.type.startsWith("video/")) {
      setMessage("Choose a video file.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setMessage("That file is over 2 GB. Please upload a shorter or compressed video.");
      return;
    }

    try {
      setPhase("requesting");
      const { upload_url } = await api<{ upload_url: string }>("/api/upload/mux", { body: { lesson_id: lessonId } });

      setPhase("uploading");
      setPercent(0);
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", upload_url);
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) setPercent(Math.round((event.loaded / event.total) * 100));
        };
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("Upload failed.")));
        xhr.onerror = () => reject(new Error("Upload failed. Check your connection and try again."));
        xhr.send(file);
      });

      setPhase("processing");
    } catch (e) {
      setPhase("errored");
      setMessage(errorMessage(e));
    }
  }

  const busy = phase === "requesting" || phase === "uploading" || phase === "processing";

  return (
    <div className="space-y-4">
      {playbackId ? (
        <div>
          <div className="overflow-hidden rounded-xl bg-black">
            <MuxPlayer playbackId={playbackId} style={{ aspectRatio: "16 / 9", width: "100%", display: "block" }} accentColor="#f5f5f5" />
          </div>
          {durationSeconds && <p className="mt-2 text-xs text-muted-foreground">Length {formatDuration(durationSeconds)}</p>}
        </div>
      ) : (
        !busy && (
          <div className="flex aspect-video flex-col items-center justify-center rounded-xl border border-dashed text-center">
            <Upload className="size-6 text-muted-foreground" />
            <p className="mt-2 text-sm font-medium">No video yet</p>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground">Short is good — most lessons are 5 to 15 minutes.</p>
          </div>
        )
      )}

      {busy && (
        <div className="rounded-xl border p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Loader2 className="size-4 animate-spin" />
            {phase === "requesting" && "Preparing upload…"}
            {phase === "uploading" && `Uploading… ${percent}%`}
            {phase === "processing" && "Processing video — this usually takes under a minute."}
          </div>
          {phase === "uploading" && (
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-foreground transition-[width]" style={{ width: `${percent}%` }} />
            </div>
          )}
          {phase === "processing" && <p className="mt-1 text-xs text-muted-foreground">You can leave this page; the video attaches on its own.</p>}
        </div>
      )}

      {message && (
        <p className="flex items-start gap-2 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" /> {message}
        </p>
      )}

      {editable && configured && !busy && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="video/*"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void onFile(file);
            }}
          />
          <Button type="button" variant="outline" onClick={() => inputRef.current?.click()} className="h-9 px-4">
            <Upload /> {playbackId ? "Replace video" : "Upload video"}
          </Button>
        </>
      )}

      {editable && !configured && (
        <p className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
          Video uploads aren&apos;t set up on this server. Add <code>MUX_TOKEN_ID</code>, <code>MUX_TOKEN_SECRET</code> and{" "}
          <code>SUPABASE_SERVICE_ROLE_KEY</code> to <code>.env.local</code> and restart <code>npm run dev</code>.
        </p>
      )}
    </div>
  );
}
