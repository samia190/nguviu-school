// api.js

// Simple fetch helper with upload support and automatic Authorization header
const API_ORIGIN = (() => {
  try {
    if (typeof window !== "undefined" && window.__API_ORIGIN) return window.__API_ORIGIN;
  } catch {}

  try {
    if (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_ORIGIN) {
      return import.meta.env.VITE_API_ORIGIN;
    }
  } catch {}

  try {
    if (typeof process !== "undefined" && process.env?.REACT_APP_API_ORIGIN) {
      return process.env.REACT_APP_API_ORIGIN;
    }
  } catch {}

  return "http://localhost:4000"; // Default API origin for local testing
})();

function getToken() {
  try {
    return localStorage.getItem("token");
  } catch {
    return null;
  }
}

async function apiFetch(url, options = {}) {
  const headers = { ...(options.headers || {}) };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const isFormData = options.body instanceof FormData;

  const res = await fetch(url.startsWith("http") ? url : `${API_ORIGIN}${url}`, {
    method: options.method || "GET",
    headers: isFormData ? headers : { "Content-Type": "application/json", ...headers },
    body: isFormData ? options.body : options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const err = new Error(data?.error || res.statusText || "Request failed");
    err.status = res.status;
    err.body = data;
    throw err;
  }

  return data;
}

export async function get(path) {
  return apiFetch(path, { method: "GET" });
}

export async function post(path, body) {
  return apiFetch(path, { method: "POST", body });
}

export async function patch(path, body) {
  return apiFetch(path, { method: "PATCH", body });
}

export async function put(path, body) {
  return apiFetch(path, { method: "PUT", body });
}

export async function del(path) {
  return apiFetch(path, { method: "DELETE" });
}

export function upload(url, formData, extraHeaders = {}, options = {}) {
  const fullUrl = url.startsWith("http") ? url : `${API_ORIGIN}${url}`;
  const token = getToken();
  const headers = { ...extraHeaders };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  if (options.setLoading) options.setLoading(true);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", fullUrl, true);

    Object.entries(headers).forEach(([k, v]) => {
      try { xhr.setRequestHeader(k, v); } catch (e) {}
    });

    xhr.onload = () => {
      if (options.setLoading) options.setLoading(false);
      const text = xhr.responseText;
      let data;
      try { data = text ? JSON.parse(text) : null; } catch { data = text; }
      if (xhr.status >= 200 && xhr.status < 300) return resolve(data);
      const err = new Error(data?.error || xhr.statusText || "Upload failed");
      err.status = xhr.status;
      err.body = data;
      return reject(err);
    };

    xhr.onerror = () => {
      if (options.setLoading) options.setLoading(false);
      const err = new Error("Network error during upload");
      return reject(err);
    };

    if (options.onProgress && xhr.upload) {
      xhr.upload.onprogress = (evt) => {
        if (evt.lengthComputable) {
          const pct = Math.round((evt.loaded / evt.total) * 100);
          try { options.onProgress(pct); } catch (e) {}
        }
      };
    }

    xhr.send(formData);
  });
}

export function saveToken(token) {
  try {
    if (token) localStorage.setItem("token", token);
  } catch {}
}

export function clearToken() {
  try {
    localStorage.removeItem("token");
  } catch {}
}

export async function login(email, password) {
  return post("/api/auth/login", { email, password });
}

export async function signup(name, email, password) {
  return post("/api/auth/register", { name, email, password });
}

// New function to fetch footer links
export async function fetchFooterLinks() {
  return get("/api/footer-links");  // Fetch footer links using the existing `get` function
}

export { apiFetch };
