"use client";

import { useState } from "react";
import Link from "next/link";

type Result = {
  success: boolean;
  count?: number | null;
  stdout?: string;
  stderr?: string;
  error?: string;
};

export default function ScoringClient() {
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [result, setResult] = useState<Result | null>(null);
  const [timestamp, setTimestamp] = useState<string | null>(null);

  async function handleRun() {
    setStatus("running");
    setResult(null);
    try {
      const res = await fetch("/api/run-scoring", { method: "POST" });
      const data: Result = await res.json();
      setResult(data);
      setStatus(data.success ? "done" : "error");
      setTimestamp(new Date().toLocaleTimeString());
    } catch (e) {
      setResult({ success: false, error: String(e) });
      setStatus("error");
      setTimestamp(new Date().toLocaleTimeString());
    }
  }

  return (
    <div className="space-y-5">
      <button
        onClick={handleRun}
        disabled={status === "running"}
        className="bg-blue-600 text-white px-5 py-2 rounded font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {status === "running" ? "Running inference…" : "Run Scoring"}
      </button>

      {status === "running" && (
        <p className="text-sm text-gray-500 animate-pulse">
          Running scoring (local Python or SCORING_WEBHOOK_URL on Vercel)…
        </p>
      )}

      {status === "done" && result?.success && (
        <div className="border border-green-200 bg-green-50 rounded p-4 text-sm text-green-800 space-y-1">
          <div className="font-semibold">
            Success
            {result.count != null && ` — ${result.count} orders scored`}
          </div>
          {timestamp && <div className="text-xs text-green-600">Completed at {timestamp}</div>}
          {result.stdout && (
            <pre className="mt-2 text-xs bg-green-100 rounded p-2 whitespace-pre-wrap">
              {result.stdout}
            </pre>
          )}
          <div className="pt-2">
            <Link
              href="/warehouse/priority"
              className="inline-block bg-green-700 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-green-800 transition-colors"
            >
              View Priority Queue →
            </Link>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="border border-red-200 bg-red-50 rounded p-4 text-sm text-red-800 space-y-1">
          <div className="font-semibold">Inference failed</div>
          {result?.error && <div>{result.error}</div>}
          {result?.stderr && (
            <pre className="mt-2 text-xs bg-red-100 rounded p-2 whitespace-pre-wrap">
              {result.stderr}
            </pre>
          )}
          {result?.stdout && (
            <pre className="mt-2 text-xs bg-red-100 rounded p-2 whitespace-pre-wrap">
              {result.stdout}
            </pre>
          )}
          <p className="text-xs text-red-600 mt-1">
            Locally: <code>pip install -r jobs/requirements.txt</code>, set{" "}
            <code>DATABASE_URL</code>, run <code>python3 jobs/run_inference.py</code> from repo
            root. On Vercel use <code>SCORING_WEBHOOK_URL</code> or CI.
          </p>
        </div>
      )}
    </div>
  );
}
