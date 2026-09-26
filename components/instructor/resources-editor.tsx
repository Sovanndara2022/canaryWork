"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { ResourceList } from "@/components/lessons/resource-list";
import { api, errorMessage } from "@/lib/api/client";
import type { LessonResource, ResourceType } from "@/types/lesson";

export function ResourcesEditor({ lessonId, resources, editable }: { lessonId: string; resources: LessonResource[]; editable: boolean }) {
  const router = useRouter();
  const [type, setType] = useState<ResourceType>("link");
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function add(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setError(null);
    startTransition(async () => {
      try {
        await api(`/api/lessons/${lessonId}/resources`, {
          body: { type, title: String(form.get("title") ?? "").trim(), url_or_content: String(form.get("url_or_content") ?? "").trim() },
        });
        formElement.reset();
        router.refresh();
      } catch (e) {
        setError(errorMessage(e));
      }
    });
  }

  function remove(resourceId: string) {
    setError(null);
    setRemoving(resourceId);
    startTransition(async () => {
      try {
        await api(`/api/lessons/${lessonId}/resources/${resourceId}`, { method: "DELETE" });
        router.refresh();
      } catch (e) {
        setError(errorMessage(e));
      } finally {
        setRemoving(null);
      }
    });
  }

  return (
    <div className="space-y-5">
      {resources.length > 0 ? (
        <ResourceList
          resources={resources}
          actions={
            editable
              ? (resource) => (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remove ${resource.title}`}
                    disabled={pending}
                    onClick={() => remove(resource.id)}
                  >
                    {removing === resource.id ? <Loader2 className="animate-spin" /> : <Trash2 />}
                  </Button>
                )
              : undefined
          }
        />
      ) : (
        <p className="text-sm text-muted-foreground">No resources yet. Add slides, links, or notes that go with the video.</p>
      )}

      {editable && (
        <form onSubmit={add} className="rounded-xl border p-4">
          <FieldGroup className="gap-4">
            <div className="grid gap-4 sm:grid-cols-[9rem_1fr]">
              <Field>
                <FieldLabel htmlFor="resource-type">Type</FieldLabel>
                <NativeSelect id="resource-type" value={type} onChange={(e) => setType(e.target.value as ResourceType)}>
                  <option value="link">Link</option>
                  <option value="slide">Slides</option>
                  <option value="note">Note</option>
                </NativeSelect>
              </Field>
              <Field>
                <FieldLabel htmlFor="resource-title">Title</FieldLabel>
                <Input id="resource-title" name="title" required maxLength={120} placeholder={type === "note" ? "Key takeaways" : "Slide deck"} className="h-10" />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="resource-body">{type === "note" ? "Note" : "URL"}</FieldLabel>
              {type === "note" ? (
                <Textarea id="resource-body" name="url_or_content" required maxLength={5000} rows={3} />
              ) : (
                <Input id="resource-body" name="url_or_content" type="url" required placeholder="https://" className="h-10" />
              )}
            </Field>
            {error && <FieldError>{error}</FieldError>}
            <div>
              <Button type="submit" variant="outline" disabled={pending} className="h-9 px-4">
                {pending && !removing ? <Loader2 className="animate-spin" /> : <Plus />} Add resource
              </Button>
            </div>
          </FieldGroup>
        </form>
      )}
    </div>
  );
}
