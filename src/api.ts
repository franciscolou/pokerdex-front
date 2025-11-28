
export const API_BASE = process.env.APP_API_BASE || "http://localhost:8000/api";

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
    const errorMessage = await parseError(res);
    throw new Error(errorMessage);
  }
  return res.json();
}

export const apiGet = (path: string) => apiRequest("GET", path);

export async function apiPost(url: string, body: any) {
  return requestWithBody("POST", url, body);
}

export async function apiPut(url: string, body: any) {
  return requestWithBody("PUT", url, body);
}

export async function apiPatch(url: string, body: any) {
  return requestWithBody("PATCH", url, body);
}

export const apiDelete = (path: string) => apiRequest("DELETE", path);


async function requestWithBody(method: "POST" | "PUT" | "PATCH", url: string, body: any) {
  const token = localStorage.getItem("access_token");

  const res = await fetch(`${API_BASE}${url}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errorText = await parseError(res);
    throw new Error(errorText);
  }

  return await res.json();
}

async function parseError(res: Response): Promise<string> {
  try {
    const text = await res.text();
    if (!text) return res.statusText || `HTTP ${res.status}`;

    try {
      const data = JSON.parse(text);

      if (typeof data === "string") return data;
      if (data && typeof data.detail === "string") return data.detail;

      const keys = Object.keys(data);
      if (keys.length) {
        const first = data[keys[0]];
        if (Array.isArray(first)) return `${keys[0]}: ${first.join(", ")}`;
        if (typeof first === "string") return `${keys[0]}: ${first}`;
      }

      return JSON.stringify(data);
    } catch {
      return text;
    }
  } catch {
    return res.statusText || `HTTP ${res.status}`;
  }

}
