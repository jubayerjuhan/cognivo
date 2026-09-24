import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <main className="flex min-h-full flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-5xl font-bold tracking-tight">
        Cogni<span className="text-indigo-600">vo</span>
      </h1>
      <p className="max-w-xl text-lg text-slate-600">
        Your AI-powered knowledge workspace. Take rich notes, attach PDFs, get instant
        summaries and quizzes, sketch on a whiteboard, and keep track of your tasks.
      </p>
      <div className="flex gap-3">
        <Link href="/sign-up" className="btn-primary px-5 py-2 text-base">
          Get started
        </Link>
        <Link href="/sign-in" className="btn-secondary px-5 py-2 text-base">
          Sign in
        </Link>
      </div>
    </main>
  );
}
