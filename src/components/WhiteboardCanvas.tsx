"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Excalidraw, exportToBlob, getSceneVersion } from "@excalidraw/excalidraw";
import type { ExcalidrawImperativeAPI, BinaryFiles } from "@excalidraw/excalidraw/types/types";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/types/element/types";
import toast from "react-hot-toast";
import { api, errMsg } from "@/lib/fetcher";

const POLL_MS = 8000;

type Meta = { updatedAt: string | null; lastEditedBy: string; lastClientId: string; noteId?: string };
type Scene = Meta & { elements: ExcalidrawElement[]; files: BinaryFiles };
type NoteLite = { _id: string; title: string };

export default function WhiteboardCanvas() {
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);
  const [initial, setInitial] = useState<Scene | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [remoteChange, setRemoteChange] = useState<Meta | null>(null);
  const [notesList, setNotesList] = useState<NoteLite[]>([]);
  const [linkedNote, setLinkedNote] = useState("");

  // Unique per browser tab, so polling can tell our own saves apart from others'.
  const clientId = useRef(Math.random().toString(36).slice(2));
  const knownUpdatedAt = useRef<string | null>(null);
  const savedVersion = useRef(0);

  useEffect(() => {
    api<Scene>("/api/whiteboard")
      .then((scene) => {
        setInitial(scene);
        setMeta(scene);
        setLinkedNote(scene.noteId ?? "");
        knownUpdatedAt.current = scene.updatedAt;
        savedVersion.current = getSceneVersion(scene.elements);
      })
      .catch((e) => toast.error(errMsg(e)));
  }, []);

  useEffect(() => {
    api<NoteLite[]>("/api/notes").then(setNotesList).catch(() => {});
  }, []);

  async function linkNote(noteId: string) {
    if (!excalidrawAPI) return;
    try {
      await api("/api/whiteboard", {
        method: "PUT",
        body: JSON.stringify({
          elements: excalidrawAPI.getSceneElements(),
          files: excalidrawAPI.getFiles(),
          clientId: clientId.current,
          noteId,
        }),
      });
      setLinkedNote(noteId);
      toast.success(noteId ? "Whiteboard linked to note" : "Whiteboard unlinked");
    } catch (e) {
      toast.error(errMsg(e));
    }
  }

  async function exportPng() {
    if (!excalidrawAPI) return;
    try {
      const blob = await exportToBlob({
        elements: excalidrawAPI.getSceneElements(),
        files: excalidrawAPI.getFiles(),
        appState: { exportBackground: true },
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "cognivo-whiteboard.png";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(errMsg(e));
    }
  }

  const save = useCallback(async () => {
    if (!excalidrawAPI) return;
    setSaving(true);
    try {
      const elements = excalidrawAPI.getSceneElements();
      const m = await api<Meta>("/api/whiteboard", {
        method: "PUT",
        body: JSON.stringify({ elements, files: excalidrawAPI.getFiles(), clientId: clientId.current, noteId: linkedNote }),
      });
      knownUpdatedAt.current = m.updatedAt;
      // onChange reports versions including deleted elements, so compare against the same set.
      savedVersion.current = getSceneVersion(excalidrawAPI.getSceneElementsIncludingDeleted());
      setMeta(m);
      setDirty(false);
      setRemoteChange(null);
      toast.success("Whiteboard saved");
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setSaving(false);
    }
  }, [excalidrawAPI, linkedNote]);

  const refresh = useCallback(async () => {
    if (!excalidrawAPI) return;
    try {
      const scene = await api<Scene>("/api/whiteboard");
      const files = Object.values(scene.files ?? {});
      if (files.length) excalidrawAPI.addFiles(files);
      excalidrawAPI.updateScene({ elements: scene.elements });
      knownUpdatedAt.current = scene.updatedAt;
      savedVersion.current = getSceneVersion(scene.elements);
      setMeta(scene);
      setDirty(false);
      setRemoteChange(null);
    } catch (e) {
      toast.error(errMsg(e));
    }
  }, [excalidrawAPI]);

  // Poll the lightweight meta endpoint for changes saved from other tabs/devices.
  useEffect(() => {
    const id = setInterval(async () => {
      if (document.hidden) return;
      try {
        const m = await api<Meta>("/api/whiteboard?meta=1");
        if (m.updatedAt && m.updatedAt !== knownUpdatedAt.current && m.lastClientId !== clientId.current) {
          setRemoteChange(m);
        }
      } catch {
        // ignore transient polling errors
      }
    }, POLL_MS);
    return () => clearInterval(id);
  }, []);

  // Ctrl/Cmd+S saves
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [save]);

  if (!initial) return <p className="p-6 text-slate-500">Loading whiteboard…</p>;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-2">
        <h1 className="font-semibold">Whiteboard</h1>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <select
            className="input w-auto py-1 text-xs"
            value={linkedNote}
            onChange={(e) => linkNote(e.target.value)}
            title="Link this board to a note"
          >
            <option value="">Not linked to a note</option>
            {notesList.map((n) => (
              <option key={n._id} value={n._id}>
                {n.title || "Untitled"}
              </option>
            ))}
          </select>
          <button className="btn-secondary" onClick={exportPng} disabled={!excalidrawAPI}>
            Export PNG
          </button>
          {dirty && <span className="text-xs text-amber-600">Unsaved changes</span>}
          <button className="btn-primary" onClick={save} disabled={saving || !excalidrawAPI}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {remoteChange && (
        <div className="flex items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          <span>
            New changes available
            {remoteChange.lastEditedBy && ` (saved by ${remoteChange.lastEditedBy})`}
            {dirty && " — refreshing will discard your unsaved changes"}
          </span>
          <div className="flex gap-2">
            <button className="btn-primary" onClick={refresh}>
              Click to refresh
            </button>
            <button
              className="btn-secondary"
              onClick={() => {
                knownUpdatedAt.current = remoteChange.updatedAt;
                setRemoteChange(null);
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="relative min-h-0 flex-1">
        <Excalidraw
          excalidrawAPI={setExcalidrawAPI}
          initialData={{
            elements: initial.elements,
            files: initial.files,
            appState: { viewBackgroundColor: "#ffffff" },
            scrollToContent: true,
          }}
          onChange={(elements) => setDirty(getSceneVersion(elements) !== savedVersion.current)}
        />
      </div>

      <div className="border-t border-slate-200 bg-white px-4 py-1.5 text-xs text-slate-500">
        {meta?.updatedAt
          ? `Last saved by ${meta.lastEditedBy || "you"} at ${new Date(meta.updatedAt).toLocaleString()}`
          : "Not saved yet"}
      </div>
    </div>
  );
}
