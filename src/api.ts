export const API_BASE = "http://localhost:8000";

export async function apiGet(path: string) {
  const res = await fetch(`${API_BASE}${path}`, { credentials: "include" });
  if (!res.ok) throw new Error(`Erro HTTP ${res.status}`);
  return res.json();
}