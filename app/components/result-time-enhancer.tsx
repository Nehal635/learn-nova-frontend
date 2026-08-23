"use client";

import { useEffect } from "react";
import { request } from "@/app/lib/api";

type AttemptWithTotalTime = {
  id: number;
  total_time_seconds?: number;
};

function formatDuration(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.round(Number(totalSeconds) || 0));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}

function getVisibleQuizSeconds() {
  const timer = document.querySelector<HTMLElement>(
    ".quiz-modal .quiz-modal-header .level-pill",
  );

  if (!timer) return null;

  const match = timer.textContent?.match(/Time\s+(\d+):(\d{2})/i);
  if (!match) return null;

  const minutes = Number(match[1]);
  const seconds = Number(match[2]);
  return minutes * 60 + seconds;
}

export function ResultTimeEnhancer() {
  useEffect(() => {
    const originalFetch = window.fetch.bind(window);

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const requestUrl = typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

      if (requestUrl.includes("/api/backend/attempts") && init?.method?.toUpperCase() === "POST" && typeof init.body === "string") {
        try {
          const payload = JSON.parse(init.body) as {
            quiz_id?: number;
            answers?: Array<{ question_id: number; selected_option: number; time_taken_seconds: number }>;
          };
          const totalSeconds = getVisibleQuizSeconds();

          if (totalSeconds !== null && Array.isArray(payload.answers) && payload.answers.length > 0) {
            const count = payload.answers.length;
            const baseSeconds = Math.floor(totalSeconds / count);
            const remainder = totalSeconds % count;

            payload.answers = payload.answers.map((answer, index) => ({
              ...answer,
              time_taken_seconds: Math.min(
                3600,
                baseSeconds + (index < remainder ? 1 : 0),
              ),
            }));

            init = {
              ...init,
              body: JSON.stringify(payload),
            };
          }
        } catch {
          // Leave the original submission untouched if the request cannot be parsed.
        }
      }

      return originalFetch(input, init);
    };

    let requestInFlight = false;

    async function enhanceResult() {
      const stats = document.querySelector<HTMLElement>(
        ".result-modal .result-stats",
      );

      if (!stats || stats.querySelector("[data-total-time]") || requestInFlight) {
        return;
      }

      requestInFlight = true;
      try {
        const attempts = await request<AttemptWithTotalTime[]>("auth/me/attempts");
        const latest = attempts[0];

        if (!latest || latest.total_time_seconds === undefined) return;

        const card = document.createElement("div");
        card.dataset.totalTime = "true";
        card.style.padding = "13px";
        card.style.borderRadius = "11px";
        card.style.background = "#f6f6fa";
        card.innerHTML = `<strong style="display:block;font-size:17px;">${formatDuration(latest.total_time_seconds)}</strong><span style="display:block;margin-top:3px;color:#6f758b;font-size:9px;">Total time</span>`;
        stats.appendChild(card);
      } finally {
        requestInFlight = false;
      }
    }

    enhanceResult();
    const observer = new MutationObserver(enhanceResult);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      window.fetch = originalFetch;
    };
  }, []);

  return null;
}
