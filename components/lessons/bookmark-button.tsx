"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { api, ApiRequestError, errorMessage } from "@/lib/api/client";

export function BookmarkButton({
  lessonId,
  initialBookmarkId,
  signedIn,
}: {
  lessonId: string;
  initialBookmarkId: string | null;
  signedIn: boolean;
}) {
  const [bookmarkId, setBookmarkId] = useState(initialBookmarkId);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!signedIn) {
    return (
      <Link href="/sign-in" className={buttonVariants({ variant: "outline" })}>
        <Bookmark /> Save
      </Link>
    );
  }

  function toggle() {
    setError(null);
    startTransition(async () => {
      try {
        if (bookmarkId) {
          await api(`/api/bookmarks/${bookmarkId}`, { method: "DELETE" });
          setBookmarkId(null);
        } else {
          const bookmark = await api<{ id: string }>("/api/bookmarks", { body: { lesson_id: lessonId } });
          setBookmarkId(bookmark.id);
        }
      } catch (e) {
        // Saved in another tab — treat as saved.
        if (e instanceof ApiRequestError && e.code === "ALREADY_BOOKMARKED") return;
        setError(errorMessage(e));
      }
    });
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button variant={bookmarkId ? "secondary" : "outline"} onClick={toggle} disabled={pending} aria-pressed={Boolean(bookmarkId)}>
        {pending ? <Loader2 className="animate-spin" /> : bookmarkId ? <BookmarkCheck /> : <Bookmark />}
        {bookmarkId ? "Saved" : "Save"}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
