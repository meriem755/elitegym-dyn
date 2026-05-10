import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "./config";

let _cachedToken: string | null = null;

export function setApiToken(token: string | null) {
  _cachedToken = token;
}

async function getToken(): Promise<string | null> {
  if (_cachedToken) return _cachedToken;
  try {
    const val = await AsyncStorage.getItem("elitegym_user");
    if (!val) return null;
    const parsed = JSON.parse(val);
    _cachedToken = parsed.token || null;
    return _cachedToken;
  } catch {
    return null;
  }
}

async function request(path: string, options: RequestInit = {}) {
  const token = await getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Erreur réseau");
  return data;
}

export const api = {
  get: (path: string) => request(path),
  post: (path: string, body: object) => request(path, { method: "POST", body: JSON.stringify(body) }),
  put: (path: string, body?: object) => request(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined }),
  delete: (path: string) => request(path, { method: "DELETE" }),
};
