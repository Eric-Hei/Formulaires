import type { DocsDocument } from "@/types";

const DOCS_API_URL = process.env.NEXT_PUBLIC_DOCS_API_URL ?? "http://localhost:8071/api/v1.0";
const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === "true";
const DEV_TOKEN = process.env.NEXT_PUBLIC_DEV_BYPASS_TOKEN ?? "dev-bypass-token";

function getAuthHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  if (DEV_MODE) return { Authorization: `Bearer ${DEV_TOKEN}` };
  const token = localStorage.getItem("docs_access_token");
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${DOCS_API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    throw new Error(`Docs API error ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

export const docsApi = {
  listDocuments: (): Promise<DocsDocument[]> =>
    request<{ results: DocsDocument[] }>("/documents/").then((r) => r.results ?? []),

  getDocument: (id: string): Promise<DocsDocument> =>
    request<DocsDocument>(`/documents/${id}/`),

  createDocument: (data: Partial<DocsDocument>): Promise<DocsDocument> =>
    request<DocsDocument>("/documents/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateDocument: (id: string, data: Partial<DocsDocument>): Promise<DocsDocument> =>
    request<DocsDocument>(`/documents/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteDocument: (id: string): Promise<void> =>
    request<void>(`/documents/${id}/`, { method: "DELETE" }),

  setToken: (token: string): void => {
    if (typeof window !== "undefined") {
      localStorage.setItem("docs_access_token", token);
    }
  },

  getToken: (): string | null => {
    if (DEV_MODE) return DEV_TOKEN;
    if (typeof window === "undefined") return null;
    return localStorage.getItem("docs_access_token");
  },

  clearToken: (): void => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("docs_access_token");
    }
  },
};
