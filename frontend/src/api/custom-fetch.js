import { supabase } from "./supabase.js";

export class ApiError extends Error {
  constructor(message, status = 400, data = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
    this.error = data;
  }
}

// Generated query hooks retain their existing cache keys and contracts, but no
// request goes to /api or to an application server. Supabase owns every call.
export async function customFetch(input, options = {}) {
  const parsed = new URL(String(input), window.location.origin);
  const args = {
    method: options.method || "GET",
    path: parsed.pathname,
    body: options.body ? JSON.parse(options.body) : {},
    query: Object.fromEntries(parsed.searchParams),
  };
  let request = supabase.rpc("care_api", args);
  if (options.signal) request = request.abortSignal(options.signal);
  const { data, error } = await request;
  if (error) throw new ApiError(error.message, error.status || 500, error);
  if (data?.error) throw new ApiError(data.error, data.status || 400, data);
  return data;
}
