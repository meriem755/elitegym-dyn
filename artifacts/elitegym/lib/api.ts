import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE = `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

async function getToken(): Promise<string | null> {
  const val = await AsyncStorage.getItem("elitegym_user");
  if (!val) return null;
  return JSON.parse(val).token;
}

async function request(path: string, options: RequestInit = {}) {
  const token = await getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
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
