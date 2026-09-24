import { GoogleGenerativeAI, GoogleGenerativeAIFetchError } from "@google/generative-ai";
import { HttpError } from "./api";
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
    model: process.env.GEMINI_MODEL || "gemini-3.6-flash",
    generationConfig: json ? { responseMimeType: "application/json" } : undefined,
  });
}

export async function generate(
  userId: string,
  kind: "summarize" | "quiz" | "ask",
  prompt: string,
  json = false
) {
  const text = await withRetry(async () => (await getModel(json).generateContent(prompt)).response.text());
  await AiCall.create({ userId, kind });
  return text;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// The free tier often returns 503 (model overloaded) or 429 (rate limit); these usually clear in seconds.
async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  for (let i = 0; ; i++) {
    try {
      return await fn();
    } catch (e) {
      const status = e instanceof GoogleGenerativeAIFetchError ? e.status : undefined;
      const retryable = status === 503 || status === 429;
      if (retryable && i < attempts - 1) {
        await sleep(1500 * 2 ** i);
        continue;
      }
      if (status === 503) throw new HttpError(503, "Gemini is busy right now. Please try again in a moment.");
      if (status === 429) throw new HttpError(429, "Gemini rate limit reached. Please wait a minute and try again.");
      if (status === 400 && !/api key/i.test((e as Error).message)) {
        throw new HttpError(502, `Gemini rejected the request: ${(e as Error).message}`);
      }
      if (status === 400 || status === 401 || status === 403) {
        throw new HttpError(502, "Gemini rejected the request. Check GEMINI_API_KEY in your environment.");
      }
      if (status === 404) {
        throw new HttpError(502, "Gemini model not found. Set GEMINI_MODEL to a current model name.");
      }
      throw e;
    }
  }
}
