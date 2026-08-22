import { cookies } from "next/headers";

const BACKEND_URL = "https://learn-nova-backend.onrender.com";

async function proxy(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const incomingUrl = new URL(request.url);
  const targetUrl = new URL(`/api/${path.join("/")}`, BACKEND_URL);
  targetUrl.search = incomingUrl.search;

  const cookieStore = await cookies();
  const token = cookieStore.get("learn_nova_token")?.value;
  const headers = new Headers();
  headers.set("accept", "application/json");
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  if (token) headers.set("authorization", `Bearer ${token}`);

  const method = request.method.toUpperCase();
  const body = method === "GET" || method === "HEAD" ? undefined : await request.arrayBuffer();

  try {
    const response = await fetch(targetUrl, { method, headers, body });
    const responseBody = await response.arrayBuffer();
    const responseHeaders = new Headers();
    responseHeaders.set(
      "content-type",
      response.headers.get("content-type") ?? "application/json",
    );

    return new Response(responseBody, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch {
    return Response.json(
      { detail: "The learning service is waking up. Please try again in a moment." },
      { status: 502 },
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
