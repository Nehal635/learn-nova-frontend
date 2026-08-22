import { cookies } from "next/headers";

const BACKEND_URL = "https://learn-nova-backend.onrender.com";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      return Response.json(data, { status: response.status });
    }

    const cookieStore = await cookies();
    cookieStore.set("learn_nova_token", data.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: Number(data.expires_in ?? 1800),
    });

    return Response.json({
      ok: true,
      token_type: data.token_type,
      expires_in: data.expires_in,
    });
  } catch {
    return Response.json(
      { detail: "The learning service is temporarily unavailable." },
      { status: 502 },
    );
  }
}
