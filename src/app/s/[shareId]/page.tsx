import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { Note } from "@/models/Note";
import { BlockRenderer } from "@/components/BlockRenderer";
import { Brain } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SharedNotePage({ params }: { params: { shareId: string } }) {
  await connectDB();
  const note = await Note.findOne({ shareId: params.shareId, shared: true })
    .select("title content updatedAt")
    .lean();
  if (!note) notFound();

  return (
    <main className="mx-auto min-h-full max-w-3xl px-4 py-10 sm:px-6">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
        Shared note · Updated {new Date(note.updatedAt).toLocaleDateString()}
      </p>
      <h1 className="mb-6 text-3xl font-bold tracking-tight">{note.title || "Untitled"}</h1>
      <BlockRenderer blocks={note.content} />
      <footer className="mt-12 flex items-center gap-2 border-t border-slate-200 pt-4 text-sm text-slate-400">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-600 text-white">
          <Brain className="h-3.5 w-3.5" aria-hidden />
        </span>
        Shared from Cognivo — an AI-powered knowledge workspace
      </footer>
    </main>
  );
}
