import { getFreshIdToken } from "@/store/auth-store";

// In dev, hit the relative path "/api/v1" so Vite's proxy forwards the request
// server-side (avoids the broken CORS config on the Laravel host). In prod,
// VITE_API_BASE_URL (or the absolute fallback) is used.
const API_BASE_DEFAULT = import.meta.env.DEV
  ? "/api/v1"
  : "https://student-tracker-server-main-w0iha2.laravel.cloud/api/v1";

export const API_BASE = (import.meta.env.VITE_API_BASE_URL || API_BASE_DEFAULT).replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message, { status, data } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

function toQuery(params) {
  const query = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.set(key, value);
  });
  const text = query.toString();
  return text ? `?${text}` : "";
}

async function parseResponse(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function apiRequest(path, { method = "GET", body, params, auth = true, signal } = {}) {
  const token = auth ? await getFreshIdToken() : null;
  const response = await fetch(`${API_BASE}${path}${toQuery(params)}`, {
    method,
    signal,
    headers: {
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await parseResponse(response);
  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      (typeof data === "string" ? data : null) ||
      `${response.status} ${response.statusText}`;
    throw new ApiError(message, { status: response.status, data });
  }
  return data;
}

// Multipart upload — same auth as apiRequest, but lets the browser set the
// multipart/form-data boundary (do NOT set Content-Type manually).
export async function apiUpload(path, formData, { auth = true, signal } = {}) {
  const token = auth ? await getFreshIdToken() : null;
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    signal,
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  const data = await parseResponse(response);
  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      (typeof data === "string" ? data : null) ||
      `${response.status} ${response.statusText}`;
    throw new ApiError(message, { status: response.status, data });
  }
  return data;
}

export const unwrapData = (payload, fallback = null) => {
  if (payload == null) return fallback;
  if (Array.isArray(payload)) return payload;
  return payload.data ?? payload.user ?? payload;
};

export const crud = (basePath) => ({
  list: (params) => apiRequest(basePath, { params }),
  create: (body) => apiRequest(basePath, { method: "POST", body }),
  show: (id) => apiRequest(`${basePath}/${id}`),
  update: (id, body) => apiRequest(`${basePath}/${id}`, { method: "PATCH", body }),
  remove: (id) => apiRequest(`${basePath}/${id}`, { method: "DELETE" }),
});
