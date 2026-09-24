import { HttpError, isValidId } from "./api";
import { blocksToText } from "./blocknote-text";
import { truncate } from "./ai";
import { Note } from "@/models/Note";
import { Attachment } from "@/models/Attachment";

/** Loads the text the AI should work on: either a note's content or a PDF's extracted text. */
export async function loadSourceText(
  userId: string,
  body: { noteId?: string; attachmentId?: string }
) {
  let raw = "";
  let label = "";
  let kind: "note" | "pdf";

  if (body.attachmentId) {
    if (!isValidId(body.attachmentId)) throw new HttpError(404, "PDF not found");
    const att = await Attachment.findOne({ _id: body.attachmentId, userId }).select("+text");
    if (!att) throw new HttpError(404, "PDF not found");
    raw = att.text;
    label = att.fileName;
    kind = "pdf";
    if (!raw.trim()) {
      throw new HttpError(422, "No text could be extracted from this PDF (it may be a scanned image).");
    }
  } else if (body.noteId) {
    if (!isValidId(body.noteId)) throw new HttpError(404, "Note not found");
    const note = await Note.findOne({ _id: body.noteId, userId }).lean();
    if (!note) throw new HttpError(404, "Note not found");
    raw = `# ${note.title}\n\n${blocksToText(note.content)}`;
    label = note.title;
    kind = "note";
    if (!blocksToText(note.content).trim()) {
      throw new HttpError(422, "This note is empty — write something first (and save).");
    }
  } else {
    throw new HttpError(400, "Provide noteId or attachmentId");
  }

  const { text, truncated } = truncate(raw);
  return { text, truncated, label, kind };
}
