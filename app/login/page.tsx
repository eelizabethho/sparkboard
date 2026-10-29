import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Log in", robots: { index: false } };

async function Form({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  return <LoginForm failed={!!(await searchParams).error} />;
}

export default function LoginPage(props: PageProps<"/login">) {
  return (
    <div className="mx-auto max-w-sm py-16">
      <h1 className="mb-6 text-3xl font-semibold">Log in</h1>
      <Suspense>
        <Form searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
