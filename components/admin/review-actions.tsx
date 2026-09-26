"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { api, errorMessage } from "@/lib/api/client";

// Approve or reject (with a reason) a pending lesson — design doc Section 10.1.
export function ReviewActions({ lessonId }: { lessonId: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"idle" | "rejecting">("idle");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [action, setAction] = useState<"approve" | "reject" | null>(null);

  function run(kind: "approve" | "reject") {
    setError(null);
    setAction(kind);
    startTransition(async () => {
      try {
        await api(`/api/admin/lessons/${lessonId}/${kind}`, kind === "reject" ? { body: { reason } } : { method: "POST" });
        router.push("/admin/lessons?status=pending");
        router.refresh();
      } catch (e) {
        setError(errorMessage(e));
      }
    });
  }

  return (
    <div className="space-y-4">
      {mode === "idle" ? (
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => run("approve")} disabled={pending} className="h-9 px-4">
            {pending && action === "approve" ? <Loader2 className="animate-spin" /> : <Check />} Approve &amp; publish
          </Button>
          <Button variant="outline" onClick={() => setMode("rejecting")} disabled={pending} className="h-9 px-4">
            <X /> Request changes
          </Button>
        </div>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            run("reject");
          }}
          className="space-y-3"
        >
          <Field>
            <FieldLabel htmlFor="reason">What should the instructor change?</FieldLabel>
            <Textarea
              id="reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              required
              minLength={5}
              maxLength={1000}
              rows={4}
              autoFocus
              placeholder="e.g. Audio is too quiet in the second half — please re-record and resubmit."
            />
            <FieldDescription>The instructor sees this exactly as written.</FieldDescription>
          </Field>
          <div className="flex gap-2">
            <Button type="submit" variant="destructive" disabled={pending} className="h-9 px-4">
              {pending && action === "reject" && <Loader2 className="animate-spin" />} Send back
            </Button>
            <Button type="button" variant="ghost" onClick={() => setMode("idle")} disabled={pending} className="h-9 px-4">
              Cancel
            </Button>
          </div>
        </form>
      )}
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
}
