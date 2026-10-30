"use client";

import { useActionState } from "react";
import { signIn, signInWithGoogle, type LoginState } from "@/app/actions";
import { Input } from "@/components/ui/input";

export function LoginForm({ failed }: { failed: boolean }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(signIn, { status: "idle" });
  if (state.status === "sent") {
    return <p className="rounded-2xl bg-card p-6">Check your email for a sign-in link.</p>;
  }
  return (
    <div className="space-y-6">
      <form action={signInWithGoogle}>
        <button className="h-11 w-full rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition active:scale-95">
          Continue with Google
        </button>
      </form>
      <p className="text-center text-xs text-muted-foreground">or get a link by email</p>
      <form action={action} className="space-y-3">
        <Input type="email" name="email" required autoComplete="email" placeholder="Email" className="h-11" />
        <button
          disabled={pending}
          className="h-11 w-full rounded-full border bg-card px-5 text-sm font-medium transition active:scale-95 disabled:opacity-50"
        >
          {pending ? "Sending…" : "Send magic link"}
        </button>
        {state.status === "error" && (
          <p role="alert" className="text-sm text-destructive">
            Couldn’t send a sign-in link. Try again in a few minutes.
          </p>
        )}
        {failed && state.status === "idle" && (
          <p role="alert" className="text-sm text-destructive">
            That sign-in didn’t work. Try again.
          </p>
        )}
      </form>
    </div>
  );
}
