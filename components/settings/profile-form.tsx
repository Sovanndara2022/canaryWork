"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api, errorMessage } from "@/lib/api/client";

export function ProfileForm({ initial }: { initial: { full_name: string | null; avatar_url: string | null; bio: string | null } }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = (key: string) => String(form.get(key) ?? "").trim();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await api("/api/users/me", {
          method: "PATCH",
          body: { full_name: text("full_name"), avatar_url: text("avatar_url") || null, bio: text("bio") || null },
        });
        setSaved(true);
        router.refresh();
      } catch (e) {
        setError(errorMessage(e));
      }
    });
  }

  return (
    <form onSubmit={onSubmit}>
      <FieldGroup className="gap-5">
        <Field>
          <FieldLabel htmlFor="full_name">Full name</FieldLabel>
          <Input id="full_name" name="full_name" defaultValue={initial.full_name ?? ""} required maxLength={100} className="h-10" />
        </Field>
        <Field>
          <FieldLabel htmlFor="avatar_url">Avatar URL</FieldLabel>
          <Input id="avatar_url" name="avatar_url" type="url" defaultValue={initial.avatar_url ?? ""} placeholder="https://…" className="h-10" />
          <FieldDescription>Optional. A link to a square image.</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="bio">Bio</FieldLabel>
          <Textarea id="bio" name="bio" defaultValue={initial.bio ?? ""} maxLength={500} rows={4} placeholder="What do you teach or want to learn?" />
        </Field>

        {error && <FieldError>{error}</FieldError>}
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={pending} className="h-9 px-4">
            {pending && <Loader2 className="animate-spin" />} Save changes
          </Button>
          {saved && <span className="text-sm text-muted-foreground">Saved.</span>}
        </div>
      </FieldGroup>
    </form>
  );
}
