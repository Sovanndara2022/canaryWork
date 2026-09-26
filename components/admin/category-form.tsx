"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { api, errorMessage } from "@/lib/api/client";

export function CategoryForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const name = String(new FormData(form).get("name") ?? "").trim();
        setError(null);
        startTransition(async () => {
          try {
            await api("/api/categories", { body: { name } });
            form.reset();
            router.refresh();
          } catch (e) {
            setError(errorMessage(e));
          }
        });
      }}
      className="flex flex-col gap-2"
    >
      <div className="flex gap-2">
        <Input name="name" required minLength={2} maxLength={40} placeholder="e.g. Photography" aria-label="Category name" className="h-9" />
        <Button type="submit" disabled={pending} className="h-9 px-4">
          {pending ? <Loader2 className="animate-spin" /> : <Plus />} Add
        </Button>
      </div>
      {error && <FieldError>{error}</FieldError>}
    </form>
  );
}
