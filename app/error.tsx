"use client";

import Link from "next/link";
import { AlertTriangle, RotateCw } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <span className="flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
        <AlertTriangle className="size-6" />
      </span>
      <h1 className="mt-5 text-xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {process.env.NODE_ENV === "development" ? error.message : "This page couldn't load. Try again, or head back to the catalog."}
      </p>
      <div className="mt-6 flex gap-2">
        <Button onClick={reset} className="h-9 px-4">
          <RotateCw /> Try again
        </Button>
        <Link href="/" className={buttonVariants({ variant: "outline", className: "h-9 px-4" })}>
          Browse lessons
        </Link>
      </div>
      {error.digest && <p className="mt-6 font-mono text-xs text-muted-foreground">Ref {error.digest}</p>}
    </main>
  );
}
