import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <Logo />
      <h1 className="mt-10 text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        This page doesn&apos;t exist, or the lesson isn&apos;t published yet.
      </p>
      <Link href="/" className={buttonVariants({ className: "mt-6 h-9 px-4" })}>
        Browse lessons
      </Link>
    </main>
  );
}
