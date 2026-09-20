import { AsciiAnimation } from "../components/effect/asciieffect";

export default function Home() {
  return (
    <main className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-[#111111] text-[#f4f4f4]">

      {/*
        Moved AsciiAnimation here so it spans the entire <main> element,
        not just the text container.
      */}
      <div className="absolute inset-0 z-0">
        <AsciiAnimation />
      </div>

      {/* Foreground Content */}
      <div className="relative z-10 flex flex-col items-center text-center pointer-events-none">
        <img
          src="/logo.png"
          alt="Canary"
          // Increased size slightly and made it responsive
          className="mb-6 w-32 md:w-40 drop-shadow-lg"
        />

        <h1 className="text-5xl md:text-7xl font-reckless tracking-tight">
          Welcome to Canary
        </h1>

        {/* Added a subtle subtitle for visual balance */}
        <p className="mt-6 max-w-md text-base md:text-lg text-gray-400">
          The banking infrastructure you can rely on.
        </p>
      </div>

    </main>
  );
}
