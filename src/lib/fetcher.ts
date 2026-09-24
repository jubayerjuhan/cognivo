/** fetch wrapper for client components: parses JSON and throws the API's error message. */
export async function api<T = unknown>(url: string, init?: RequestInit): Promise<T> {
  const isForm = init?.body instanceof FormData;
  const res = await fetch(url, {
    ...init,
    headers: isForm ? init?.headers : { "Content-Type": "application/json", ...init?.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data as T;
}

export function errMsg(e: unknown) {
  return e instanceof Error ? e.message : "Something went wrong";
}
