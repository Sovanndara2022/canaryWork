// Decorative, slowly animated page background: soft colour glows that
// drift, over a dot grid that fades out down the page. Colours come from
// the surrounding data-area (see globals.css), so student, instructor and
// admin pages each get their own. Motion stops for prefers-reduced-motion.
export function AreaBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="animate-backdrop-dots absolute inset-0 [background-image:radial-gradient(var(--dots)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:linear-gradient(to_bottom,black,transparent_75%)]" />
      <div className="animate-backdrop-a absolute -top-56 left-1/2 h-[520px] w-[1100px] max-w-[160vw] rounded-full bg-[var(--glow-1)] blur-3xl will-change-transform" />
      <div className="animate-backdrop-b absolute top-24 -right-48 size-[460px] rounded-full bg-[var(--glow-2)] blur-3xl will-change-transform" />
      <div className="animate-backdrop-c absolute top-[40%] -left-56 size-[420px] rounded-full bg-[var(--glow-2)] opacity-60 blur-3xl will-change-transform" />
    </div>
  );
}
