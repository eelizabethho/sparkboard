import Link from "next/link";
import { signOut } from "@/app/actions";
import { isOwner } from "@/lib/ideas";

// Request-time (cookies): render inside <Suspense>.
export async function OwnerNav() {
  if (!(await isOwner())) return null;
  return (
    <>
      <Link
        href="/new"
        className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground outline-none transition focus-visible:ring-[3px] focus-visible:ring-ring active:scale-95"
      >
        + New
      </Link>
      <form action={signOut}>
        <button className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition hover:text-foreground">
          Log out
        </button>
      </form>
    </>
  );
}
