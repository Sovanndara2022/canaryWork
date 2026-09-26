"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ShareButton() {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: document.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // share sheet dismissed — nothing to do
    }
  }

  return (
    <Button variant="outline" onClick={share} aria-live="polite">
      {copied ? <Check /> : <Link2 />}
      {copied ? "Link copied" : "Share"}
    </Button>
  );
}
