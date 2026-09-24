"use client";

import dynamic from "next/dynamic";

// Excalidraw needs `window`, so render it on the client only.
const WhiteboardCanvas = dynamic(() => import("@/components/WhiteboardCanvas"), {
  ssr: false,
  loading: () => <p className="p-6 text-slate-500">Loading whiteboard…</p>,
});

export default function WhiteboardPage() {
  return <WhiteboardCanvas />;
}
