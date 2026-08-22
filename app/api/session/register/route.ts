import { cookies } from "next/headers";

const BACKEND_URL = "https://learn-nova-backend.onrender.com";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const createResponse = await fetch(`${BACKEND_URL}/api/students`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const student = await createResponse.json();

    if (!createResponse.ok) {
      return Response.json(student, { status: createResponse.status });
    }

    const loginResponse = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: payload.email, password: payload.password }),
    });
    const login = await loginResponse.json();

    if (!loginResponse.ok) {
      return Response.json(
        { detail: "Account created. Please sign in to continue.", student },
        { status: 201 },
      );
    }

    const cookieStore = await cookies();
    cookieStore.set("learn_nova_token", login.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: Number(login.expires_in ?? 1800),
    });

    return Response.json({ ok: true, student }, { status: 201 });
  } catch {
    return Response.json(
      { detail: "The learning service is temporarily unavailable." },
      { status: 502 },
    );
  }
}
