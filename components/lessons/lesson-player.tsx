"use client";

// Streams the lesson from Mux and reports back to the API:
//   - POST /api/lessons/:id/view once, on first play (approved lessons only)
//   - POST /api/lessons/:id/progress every 15s, on pause, and on end
//     (signed-in viewers only); >= 90% watched marks it completed.

import { useCallback, useRef, useState } from "react";
import MuxPlayer from "@mux/mux-player-react";
import { CheckCircle2 } from "lucide-react";

const SAVE_EVERY_SECONDS = 15;
const COMPLETE_AT = 0.9;

interface Props {
  lessonId: string;
  playbackId: string;
  title: string;
  trackViews: boolean;
  trackProgress: boolean;
  initialProgress: { progress_seconds: number; completed: boolean } | null;
}

export function LessonPlayer({ lessonId, playbackId, title, trackViews, trackProgress, initialProgress }: Props) {
  const viewLogged = useRef(false);
  const lastSaved = useRef(initialProgress?.progress_seconds ?? 0);
  const [completed, setCompleted] = useState(initialProgress?.completed ?? false);

  const save = useCallback(
    (player: HTMLMediaElement, force = false) => {
      if (!trackProgress || !Number.isFinite(player.duration) || player.duration === 0) return;
      const seconds = Math.floor(player.currentTime);
      if (!force && Math.abs(seconds - lastSaved.current) < SAVE_EVERY_SECONDS) return;

      lastSaved.current = seconds;
      const isComplete = completed || player.currentTime / player.duration >= COMPLETE_AT;
      if (isComplete) setCompleted(true);

      void fetch(`/api/lessons/${lessonId}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progress_seconds: seconds, completed: isComplete }),
        keepalive: true,
      });
    },
    [completed, lessonId, trackProgress]
  );

  // Resume where the viewer left off, unless they'd basically finished.
  const resumeAt =
    initialProgress && !initialProgress.completed && initialProgress.progress_seconds > 5
      ? initialProgress.progress_seconds
      : undefined;

  return (
    <div>
      <div className="overflow-hidden rounded-xl bg-black">
        <MuxPlayer
          playbackId={playbackId}
          metadata={{ video_id: lessonId, video_title: title }}
          startTime={resumeAt}
          accentColor="#f5f5f5"
          style={{ aspectRatio: "16 / 9", width: "100%", display: "block" }}
          onPlay={() => {
            if (trackViews && !viewLogged.current) {
              viewLogged.current = true;
              void fetch(`/api/lessons/${lessonId}/view`, { method: "POST" });
            }
          }}
          onTimeUpdate={(event) => save(event.target as HTMLMediaElement)}
          onPause={(event) => save(event.target as HTMLMediaElement, true)}
          onEnded={(event) => save(event.target as HTMLMediaElement, true)}
        />
      </div>
      {trackProgress && completed && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="size-3.5" /> Completed
        </p>
      )}
    </div>
  );
}
