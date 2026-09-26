"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { api, errorMessage } from "@/lib/api/client";
import type { Category } from "@/types/lesson";

interface Props {
  categories: Category[];
  lesson?: { id: string; title: string; description: string | null; category_id: string | null };
  disabled?: boolean;
}

// Create (POST /api/lessons) or edit (PATCH /api/lessons/:id) a lesson's details.
export function LessonForm({ categories, lesson, disabled }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body = {
      title: String(form.get("title") ?? "").trim(),
      description: String(form.get("description") ?? "").trim() || null,
      category_id: String(form.get("category_id") ?? ""),
    };
    setError(null);
    setSaved(false);

    startTransition(async () => {
      try {
        if (lesson) {
          await api(`/api/lessons/${lesson.id}`, { method: "PATCH", body });
          setSaved(true);
          router.refresh();
        } else {
          const created = await api<{ id: string }>("/api/lessons", { body });
          router.push(`/instructor/lessons/${created.id}`);
        }
      } catch (e) {
        setError(errorMessage(e));
      }
    });
  }

  return (
    <form onSubmit={onSubmit} onChange={() => setSaved(false)}>
      <fieldset disabled={disabled || pending} className="contents">
        <FieldGroup className="gap-5">
          <Field>
            <FieldLabel htmlFor="title">Title</FieldLabel>
            <Input id="title" name="title" defaultValue={lesson?.title} required minLength={3} maxLength={120} placeholder="e.g. Intro to SQL joins" className="h-10" />
          </Field>

          <Field>
            <FieldLabel htmlFor="category_id">Category</FieldLabel>
            <NativeSelect id="category_id" name="category_id" defaultValue={lesson?.category_id ?? ""} required>
              <option value="" disabled>
                Choose a category
              </option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </NativeSelect>
            {categories.length === 0 && (
              <FieldDescription>No categories yet — an admin needs to add some (or run supabase/seed.sql).</FieldDescription>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="description">Description</FieldLabel>
            <Textarea
              id="description"
              name="description"
              defaultValue={lesson?.description ?? ""}
              maxLength={2000}
              rows={5}
              placeholder="What will someone be able to do after watching?"
            />
          </Field>

          {error && <FieldError>{error}</FieldError>}

          {!disabled && (
            <div className="flex items-center gap-3">
              <Button type="submit" className="h-9 px-4">
                {pending && <Loader2 className="animate-spin" />}
                {lesson ? "Save details" : "Create draft & continue"}
              </Button>
              {saved && <span className="text-sm text-muted-foreground">Saved.</span>}
            </div>
          )}
        </FieldGroup>
      </fieldset>
    </form>
  );
}
