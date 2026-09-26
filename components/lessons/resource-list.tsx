import { ExternalLink, FileText, Link2, Presentation } from "lucide-react";
import type { LessonResource } from "@/types/lesson";

const icons = { link: Link2, slide: Presentation, note: FileText };

function isSafeUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

export function ResourceList({ resources, actions }: { resources: LessonResource[]; actions?: (resource: LessonResource) => React.ReactNode }) {
  return (
    <ul className="divide-y rounded-xl border bg-card shadow-xs">
      {resources.map((resource) => {
        const Icon = icons[resource.type];
        return (
          <li key={resource.id} className="flex items-start gap-3 p-3">
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
              <Icon className="size-4 text-muted-foreground" />
            </span>
            <div className="min-w-0 flex-1">
              {resource.type === "note" ? (
                <details className="group">
                  <summary className="cursor-pointer text-sm font-medium">{resource.title}</summary>
                  <p className="mt-2 text-sm whitespace-pre-line text-muted-foreground">{resource.url_or_content}</p>
                </details>
              ) : isSafeUrl(resource.url_or_content) ? (
                <a
                  href={resource.url_or_content}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium hover:underline hover:underline-offset-2"
                >
                  {resource.title}
                  <ExternalLink className="size-3 text-muted-foreground" />
                </a>
              ) : (
                <span className="text-sm font-medium">{resource.title}</span>
              )}
              <p className="text-xs text-muted-foreground capitalize">{resource.type}</p>
            </div>
            {actions?.(resource)}
          </li>
        );
      })}
    </ul>
  );
}
