import Link from "next/link";

export default function NotFound() {
  return (
    <main
      id="main-content"
      className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center"
    >
      <span className="text-6xl font-black text-muted-foreground/30">404</span>
      <h2 className="text-2xl font-bold text-foreground">Page not found</h2>
      <p className="max-w-sm text-muted-foreground">
        The summoner or page you&apos;re looking for doesn&apos;t exist. Double-check the name and
        region and try again.
      </p>
      <Link
        href="/"
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Search for a summoner
      </Link>
    </main>
  );
}
