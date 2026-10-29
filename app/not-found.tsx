import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-24 text-center">
      <h1 className="text-5xl font-semibold sm:text-6xl">Nothing here.</h1>
      <p className="mt-4 text-lg text-muted-foreground">That idea doesn&apos;t exist, or it isn&apos;t public.</p>
      <Link href="/" className="mt-8 inline-block rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground">
        Back to ideas
      </Link>
    </div>
  );
}
