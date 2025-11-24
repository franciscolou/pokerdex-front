export const API_BASE = "http://localhost:8000/api";

export function getAuthToken(): string | null {
  return localStorage.getItem("access_token");
}

export async function checkAuth(): Promise<boolean> {
  const token = getAuthToken();
  if (!token) return false;

  try {
    const response = await apiGet("/auth/me/");
    return !!response;
  } catch {
    return false;
  }
}

async function apiRequest(
  method: string,
  path: string,
  body?: any
): Promise<any> {
  const token = getAuthToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    credentials: "include",
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (res.status === 401) {
    console.warn("Token expirado ou inválido → redirecionando...");
    localStorage.removeItem("access_token");
    window.location.href = "/src/pages/login.html";
    return;
  }

  if (!res.ok) {
    throw new Error(`Erro ${res.status}: ${await res.text()}`);
  }

  return res.json();
}

export const apiGet = (path: string) => apiRequest("GET", path);

export const apiPost = (path: string, body: any) =>
  apiRequest("POST", path, body);

export const apiPut = (path: string, body: any) =>
  apiRequest("PUT", path, body);

export const apiDelete = (path: string) => apiRequest("DELETE", path);
