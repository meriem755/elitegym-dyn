const rawApiUrl = process.env.EXPO_PUBLIC_API_URL || "";

const normalizedApiUrl = rawApiUrl.replace(/\/+$/, "");

export const API_URL = normalizedApiUrl || "http://localhost:8080/api";
export const WS_URL = API_URL.replace(/^http/, "ws");
