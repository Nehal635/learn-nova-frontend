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

export function ResultTimeEnhancer() {
  useEffect(() => {
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

    return () => observer.disconnect();
  }, []);

  return null;
}
