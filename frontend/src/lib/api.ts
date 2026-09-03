import type { ValidationResult, RowRecord, ParsedFile } from './types';

// TanStack Start's dev server runs its own request router in front of Vite,
// which intercepts paths like `/api/*` before Vite's `server.proxy` can forward
// them anywhere — so we always talk to the backend's absolute URL instead of a
// same-origin relative path. Override with VITE_API_URL if the backend runs
// somewhere other than http://localhost:4000 (e.g. in production).
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // ignore parse errors, keep default message
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export async function parseFile(file: File): Promise<ParsedFile> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/parse`, { method: 'POST', body: formData });
  return handle<ParsedFile>(res);
}

export async function revalidate(headers: string[], rows: RowRecord[]): Promise<ValidationResult> {
  const res = await fetch(`${API_BASE}/revalidate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ headers, rows }),
  });
  return handle<ValidationResult>(res);
}

export async function downloadFile(
  headers: string[],
  rows: RowRecord[],
  format: 'xlsx' | 'csv'
): Promise<void> {
  const res = await fetch(`${API_BASE}/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ headers, rows, format }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error || 'Export failed');
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `validated-data.${format}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
