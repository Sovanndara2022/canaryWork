"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, errorMessage } from "@/lib/api/client";

export function SubmitLessonButton({ lessonId, disabledReason }: { lessonId: string; disabledReason?: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-2">
      <Button
        disabled={pending || Boolean(disabledReason)}
        className="h-10 w-full"
        onClick={() => {
          setError(null);
          startTransition(async () => {
            try {
              await api(`/api/lessons/${lessonId}/submit`, { method: "POST" });
              router.refresh();
            } catch (e) {
              setError(errorMessage(e));
            }
          });
        }}
      >
        {pending ? <Loader2 className="animate-spin" /> : <Send />} Submit for review
      </Button>
      {(disabledReason || error) && <p className="text-xs text-muted-foreground">{error ?? disabledReason}</p>}
    </div>
  );
}

export function DeleteLessonButton({ lessonId, redirectTo }: { lessonId: string; redirectTo: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <Button variant="ghost" className="h-9 px-3 text-destructive hover:text-destructive" onClick={() => setConfirming(true)}>
        <Trash2 /> Delete lesson
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm">Delete this lesson permanently?</span>
      <Button
        variant="destructive"
        disabled={pending}
        className="h-8 px-3"
        onClick={() =>
          startTransition(async () => {
            try {
              await api(`/api/lessons/${lessonId}`, { method: "DELETE" });
              router.push(redirectTo);
              router.refresh();
            } catch (e) {
              setError(errorMessage(e));
            }
          })
        }
      >
        {pending && <Loader2 className="animate-spin" />} Delete
      </Button>
      <Button variant="ghost" className="h-8 px-3" onClick={() => setConfirming(false)} disabled={pending}>
        Cancel
      </Button>
      {error && <p className="w-full text-xs text-destructive">{error}</p>}
    </div>
  );
}
