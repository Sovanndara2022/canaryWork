import Link from "next/link";
import { SignInForm } from "@/components/forms/login-forms";

export default function SignInPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Welcome back. Pick up where you left off.
      </p>

      <div className="mt-8">
        <SignInForm />
      </div>

      <p className="mt-8 text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/sign-up" className="font-medium text-foreground underline-offset-4 hover:underline">
          Sign up
        </Link>
      </p>
    </>
  );
}
