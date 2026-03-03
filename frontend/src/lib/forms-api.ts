import type { FormSettingsData, FormResponseData, FormStatsData, FormAnswer } from "@/types";
import { docsApi } from "./docs-api";

const FORMS_API_URL = process.env.NEXT_PUBLIC_FORMS_API_URL ?? "http://localhost:8080";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = docsApi.getToken();
  const res = await fetch(`${FORMS_API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    throw new Error(`Forms API error ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

export const formsApi = {
  getSettings: (documentId: string): Promise<FormSettingsData> =>
    request<FormSettingsData>(`/api/forms/${documentId}/settings/`),

  updateSettings: (documentId: string, data: Partial<FormSettingsData>): Promise<FormSettingsData> =>
    request<FormSettingsData>(`/api/forms/${documentId}/settings/`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  createSettings: (documentId: string, data: Partial<FormSettingsData>): Promise<FormSettingsData> =>
    request<FormSettingsData>(`/api/forms/${documentId}/settings/`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  submitResponse: (
    documentId: string,
    answers: FormAnswer,
    respondentId = ""
  ): Promise<{ detail: string; redirect_url?: string }> =>
    request(`/api/forms/${documentId}/responses/`, {
      method: "POST",
      body: JSON.stringify({ answers, respondent_id: respondentId }),
    }),

  getResponses: (
    documentId: string
  ): Promise<{ count: number; results: FormResponseData[] }> =>
    request(`/api/forms/${documentId}/responses/`),

  getStats: (documentId: string): Promise<FormStatsData> =>
    request(`/api/forms/${documentId}/stats/`),
};
