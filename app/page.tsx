"use client";

import { useCallback, useEffect, useState } from "react";
import { AuthScreen } from "@/app/components/auth-screen";
import { Portal } from "@/app/components/portal";
import { ApiError, request } from "@/app/lib/api";
import type { User } from "@/app/lib/types";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    setLoading(true);
    try {
      setUser(await request<User>("auth/me"));
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401) {
        console.error("Could not restore session", error);
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    request<User>("auth/me")
      .then(setUser)
      .catch((error) => {
        if (!(error instanceof ApiError) || error.status !== 401) {
          console.error("Could not restore session", error);
        }
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="boot-screen">
        <span className="brand-mark">LN</span>
        <div className="boot-line"><span /></div>
        <p>Preparing your learning space…</p>
      </main>
    );
  }

  if (!user) return <AuthScreen onAuthenticated={loadUser} />;
  return <Portal user={user} onSignedOut={() => setUser(null)} />;
}
