export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function errorMessage(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "Something went wrong.";
  const detail = (payload as { detail?: unknown }).detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (item && typeof item === "object" && "msg" in item) {
          return String((item as { msg: unknown }).msg);
        }
        return String(item);
      })
      .join(" ");
  }
  return "The request could not be completed.";
}

export async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const normalizedPath = path.replace(/^\/+/, "");
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  const response = await fetch(`/api/backend/${normalizedPath}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    throw new ApiError(
      typeof payload === "string" ? payload : errorMessage(payload),
      response.status,
    );
  }

  return payload as T;
}

export async function sessionRequest<T>(
  path: "login" | "register" | "logout",
  body?: unknown,
): Promise<T> {
  const response = await fetch(`/api/session/${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new ApiError(errorMessage(payload), response.status);
  }
  return payload as T;
}
