"use client";

import { FormEvent, useState } from "react";
import { sessionRequest } from "@/app/lib/api";
import { Icons } from "./icons";

interface AuthScreenProps {
  onAuthenticated: () => Promise<void>;
}

export function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (mode === "register") {
        await sessionRequest("register", { name, email, password });
      } else {
        await sessionRequest("login", { email, password });
      }
      await onAuthenticated();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-story" aria-label="Learn Nova introduction">
        <div className="brand brand-light">
          <span className="brand-mark"><Icons.spark /></span>
          <span>Learn_Nova</span>
        </div>
        <div className="auth-story-copy">
          <span className="eyebrow eyebrow-light">Personalized learning, made visible</span>
          <h1>Know what you understand. Know what to learn next.</h1>
          <p>
            Take focused quizzes, see topic-level insights, and follow clear
            recommendations built around your progress.
          </p>
        </div>
        <div className="auth-proof-grid" aria-label="Platform benefits">
          <article>
            <span>01</span>
            <strong>Measure</strong>
            <p>Accurate quiz scoring with time and topic analysis.</p>
          </article>
          <article>
            <span>02</span>
            <strong>Understand</strong>
            <p>See strengths and gaps without decoding raw marks.</p>
          </article>
          <article>
            <span>03</span>
            <strong>Improve</strong>
            <p>Get the next best practice step after every attempt.</p>
          </article>
        </div>
        <p className="auth-note">Connected securely to the Learn_Nova learning API</p>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <div className="auth-mobile-brand brand">
            <span className="brand-mark"><Icons.spark /></span>
            <span>Learn_Nova</span>
          </div>
          <span className="eyebrow">Student learning portal</span>
          <h2>{mode === "login" ? "Welcome back" : "Create your account"}</h2>
          <p className="auth-subtitle">
            {mode === "login"
              ? "Sign in to continue your learning journey."
              : "Join the portal and begin your first assessment."}
          </p>

          <div className="auth-switch" role="tablist" aria-label="Authentication mode">
            <button
              type="button"
              className={mode === "login" ? "active" : ""}
              onClick={() => { setMode("login"); setError(""); }}
            >
              Sign in
            </button>
            <button
              type="button"
              className={mode === "register" ? "active" : ""}
              onClick={() => { setMode("register"); setError(""); }}
            >
              Register
            </button>
          </div>

          <form className="auth-form" onSubmit={submit}>
            {mode === "register" && (
              <label>
                <span>Full name</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  minLength={2}
                  maxLength={100}
                  placeholder="Your name"
                  autoComplete="name"
                  required
                />
              </label>
            )}
            <label>
              <span>Email address</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </label>
            <label>
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                minLength={8}
                required
              />
            </label>

            {error && <div className="form-error" role="alert">{error}</div>}

            <button className="button button-primary button-wide" disabled={loading}>
              <span>{loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}</span>
              {!loading && <Icons.arrow />}
            </button>
          </form>

          <p className="privacy-note">
            Your login token is stored in a secure HTTP-only session cookie and
            is not exposed to the browser interface.
          </p>
        </div>
      </section>
    </main>
  );
}
