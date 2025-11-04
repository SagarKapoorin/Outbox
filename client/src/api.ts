export const API_BASE = (import.meta).env?.VITE_API_BASE || 'http://localhost:3000';

export type Account = { id: string; host: string; user: string };
export type EmailItem = {
  id: string;
  accountId: string;
  folder: string;
  subject?: string;
  from?: string;
  to?: string;
  date?: string | Date;
  text?: string;
  html?: string;
  labels?: string[];
};

export type SearchResponse = { total: number; items: EmailItem[] };

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  // console.log("api hit "+path);
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  getAccounts: () => http<Account[]>(`/accounts`),
  getFolders: () => http<{ id: string; name: string }[]>(`/accounts/folders`),
  searchEmails: (params: Record<string, string | number | undefined>) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') qs.append(k, String(v));
    });
    return http<SearchResponse>(`/emails?${qs.toString()}`);
  },
  getEmail: (id: string) => http<EmailItem>(`/emails/${encodeURIComponent(id)}`),
  setLabel: (id: string, label: string) =>
    http<EmailItem>(`/emails/${encodeURIComponent(id)}/label`, {
      method: 'POST',
      body: JSON.stringify({ label }),
    }),
  removeLabel: (id: string, label: string) =>
    http<EmailItem>(`/emails/${encodeURIComponent(id)}/label`, {
      method: 'DELETE',
      body: JSON.stringify({ label }),
    }),
  suggestReply: (id: string) =>
    http<{ reply: string; references?: { id: string; score: number }[] }>(
      `/emails/${encodeURIComponent(id)}/suggest-reply`,
      { method: 'POST' }
    ),
};
