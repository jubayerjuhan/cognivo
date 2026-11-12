"use client";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import type { PartialBlock } from "@blocknote/core";
import { useEffect, useState } from "react";

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

// Images are embedded as data URLs inside the note JSON (no separate file storage needed).
async function uploadFile(file: File) {
  if (file.size > MAX_IMAGE_BYTES) throw new Error("Images must be 2MB or smaller");
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function NoteEditor({
  initialContent,
  onChange,
}: {
  initialContent: unknown[];
  onChange: (blocks: unknown[]) => void;
}) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    const read = () => setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
    read();
    window.addEventListener("cognivo-theme", read);
    return () => window.removeEventListener("cognivo-theme", read);
  }, []);

  const editor = useCreateBlockNote({
    initialContent: initialContent.length ? (initialContent as PartialBlock[]) : undefined,
    uploadFile,
  });

  return (
    <BlockNoteView
      editor={editor}
      theme={theme}
      onChange={() => onChange(editor.document)}
    />
  );
}
