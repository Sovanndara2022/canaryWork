import Link from "next/link";
import { SignUpForm } from "@/components/forms/login-forms";

export default function SignUpPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Free to join. Watch, save, and track lessons — or teach your own.
      </p>

      <div className="mt-8">
        <SignUpForm />
      </div>

      <p className="mt-8 text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-medium text-foreground underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
