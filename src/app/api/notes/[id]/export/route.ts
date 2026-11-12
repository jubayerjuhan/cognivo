import { handler, HttpError, isValidId, requireUser } from "@/lib/api";
import { Note } from "@/models/Note";
import { blocksToMarkdown } from "@/lib/blocknote-text";

export const dynamic = "force-dynamic";
type Ctx = { params: { id: string } };

// GET -> the note as a downloadable Markdown file.
export const GET = handler(async (_req: Request, { params }: Ctx) => {
  const userId = await requireUser();
  if (!isValidId(params.id)) throw new HttpError(404, "Note not found");
  const note = await Note.findOne({ _id: params.id, userId }).lean();
  if (!note) throw new HttpError(404, "Note not found");
  const md = `# ${note.title || "Untitled"}\n\n${blocksToMarkdown(note.content)}\n`;
  const safe = (note.title || "note").replace(/[^\w\- ]+/g, "").trim().slice(0, 60) || "note";
  return new Response(md, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${safe}.md"`,
    },
  });
});
