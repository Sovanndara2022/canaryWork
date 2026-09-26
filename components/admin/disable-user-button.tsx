"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, errorMessage } from "@/lib/api/client";

export function DisableUserButton({ userId, disabled }: { userId: string; disabled: boolean }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(next: boolean) {
    setError(null);
    startTransition(async () => {
      try {
        await api(`/api/admin/users/${userId}`, { method: "PATCH", body: { disabled: next } });
        setConfirming(false);
        router.refresh();
      } catch (e) {
        setError(errorMessage(e));
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {disabled ? (
        <Button variant="outline" size="sm" disabled={pending} onClick={() => run(false)}>
          {pending && <Loader2 className="animate-spin" />} Enable
        </Button>
      ) : confirming ? (
        <div className="flex gap-1">
          <Button variant="destructive" size="sm" disabled={pending} onClick={() => run(true)}>
            {pending && <Loader2 className="animate-spin" />} Confirm
          </Button>
          <Button variant="ghost" size="sm" disabled={pending} onClick={() => setConfirming(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setConfirming(true)}>
          Disable
        </Button>
      )}
      {error && <p className="max-w-40 text-right text-xs text-destructive">{error}</p>}
    </div>
  );
}
