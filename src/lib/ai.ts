import Groq, { APIError } from "groq-sdk";
import { HttpError } from "./api";
import { AiCall } from "@/models/AiCall";

// Groq free tier allows ~8k tokens/min (prompt + output), so cap input at ~5k tokens; no RAG, just the (truncated) full text.
export const MAX_CHARS = 20_000;

export function truncate(text: string) {
  if (text.length <= MAX_CHARS) return { text, truncated: false };
  return { text: text.slice(0, MAX_CHARS), truncated: true };
}

function getClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not set. Add it to .env.local");
  // The SDK retries 429 (rate limit) and 5xx (overloaded) with backoff; these usually clear in seconds.
  return new Groq({ apiKey, maxRetries: 3 });
}

export async function generate(
  userId: string,
  kind: "summarize" | "quiz" | "ask",
  prompt: string,
  json = false
) {
  let text: string;
  try {
    const res = await getClient().chat.completions.create({
      model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
      messages: [{ role: "user", content: prompt }],
      response_format: json ? { type: "json_object" } : undefined,
    });
    text = res.choices[0]?.message?.content ?? "";
  } catch (e) {
    throw toHttpError(e);
  }
  await AiCall.create({ userId, kind });
  return text;
}

function toHttpError(e: unknown) {
  if (!(e instanceof APIError)) return e;
  switch (e.status) {
    case 401:
    case 403:
      return new HttpError(502, "Groq rejected the request. Check GROQ_API_KEY in your environment.");
    case 404:
      return new HttpError(502, "Groq model not found. Set GROQ_MODEL to a current model name.");
    case 413:
      return new HttpError(413, "This content is too large for the AI's current limits. Try a shorter note or PDF.");
    case 429:
      return new HttpError(429, "AI rate limit reached. Please wait a minute and try again.");
    case 400:
      return new HttpError(502, `Groq rejected the request: ${e.message}`);
  }
  if (e.status && e.status >= 500) return new HttpError(503, "The AI service is busy right now. Please try again in a moment.");
  return e;
}
