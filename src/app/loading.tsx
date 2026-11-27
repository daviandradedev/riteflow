export default function Loading() {
  return (
    <main
      role="status"
      aria-live="polite"
      className="site-main flex min-h-[55dvh] flex-col items-center justify-center gap-3 text-muted"
    >
      <span
        aria-hidden="true"
        className="block h-8 w-8 animate-spin rounded-full border-[3px] border-border border-t-accent"
      />
      <span className="sr-only">Loading</span>
    </main>
  );
}
