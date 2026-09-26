import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";
import { getSession, homePathFor } from "@/lib/auth/getSession";
import { AsciiAnimation } from "../components/effect/asciieffect";

export default async function Home() {
  const session = await getSession();

  return (
    <main className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-[#0b0d12] text-[#f4f4f4]">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_top,_rgba(255,147,77,0.08),transparent_35%)]" />
      <div className="absolute inset-0 z-0 opacity-80">
        <AsciiAnimation />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center">
        <LogoMark className="mb-6 size-12 rounded-xl bg-white text-[#0b0d12] [&_svg]:size-6" />

        <h1 className="font-reckless text-5xl tracking-[-0.06em] text-white md:text-7xl">
          Lightning Lessons
        </h1>

        <p className="mt-6 max-w-xl text-base leading-7 text-gray-300 md:text-lg">
          Learn something in the time it takes to boil an egg — free, short lessons
          taught by people who actually do the thing.
        </p>

        <div className="pointer-events-auto mt-10 flex flex-wrap items-center justify-center gap-4">
          {session ? (
            <Link
              href={homePathFor(session.profile.role)}
              className="rounded-[12px] bg-[#f4f4f4] px-6 py-3 text-sm font-semibold text-[#111111] transition duration-200 hover:bg-white"
            >
              Continue
            </Link>
          ) : (
            <>
              <Link
                href="/sign-up"
                className="rounded-[12px] bg-[#f4f4f4] px-6 py-3 text-sm font-semibold text-[#111111] transition duration-200 hover:bg-white"
              >
                Get started
              </Link>
              <Link
                href="/sign-in"
                className="rounded-[12px] border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition duration-200 hover:border-white/30 hover:bg-white/10"
              >
                Sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
