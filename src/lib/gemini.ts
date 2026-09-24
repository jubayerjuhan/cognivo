import { GoogleGenerativeAI } from "@google/generative-ai";
import { AiCall } from "@/models/AiCall";

// Keep prompts well within free-tier limits; no RAG, just the (truncated) full text.
export const MAX_CHARS = 100_000;

export function truncate(text: string) {
  if (text.length <= MAX_CHARS) return { text, truncated: false };
  return { text: text.slice(0, MAX_CHARS), truncated: true };
}

function getModel(json = false) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set. Add it to .env.local");
  const genAI = new GoogleGenerativeAI(key);
  return genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    generationConfig: json ? { responseMimeType: "application/json" } : undefined,
  });
}

export async function generate(
  userId: string,
  kind: "summarize" | "quiz" | "ask",
  prompt: string,
  json = false
) {
  const result = await getModel(json).generateContent(prompt);
  const text = result.response.text();
  await AiCall.create({ userId, kind });
  return text;
}
