// lib/validators/resource.ts — zod schema for lesson resources.
// Links and slides must be URLs; notes are free text.

import { z } from "zod";

export const createResourceSchema = z.discriminatedUnion("type", [
  z.strictObject({
    type: z.enum(["link", "slide"]),
    title: z.string().trim().min(1, "Give the resource a title.").max(120),
    url_or_content: z.url({ protocol: /^https?$/, message: "Enter a full URL, starting with https://" }),
  }),
  z.strictObject({
    type: z.literal("note"),
    title: z.string().trim().min(1, "Give the note a title.").max(120),
    url_or_content: z.string().trim().min(1, "The note can't be empty.").max(5000),
  }),
]);
