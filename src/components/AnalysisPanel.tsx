"use client";

import { useState } from "react";

interface AnalysisMetrics {
  wonRevenue: number;
  pipelineValue: number;
  winRatePercent: number | null;
}

interface AnalysisResult {
  summary: string;
  insights: string[];
  recommendations: string[];
}

interface AnalysisResponse {
  generatedAt: string;
  metrics: AnalysisMetrics;
  analysis: AnalysisResult;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: "SGD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function AnalysisPanel() {
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function generate() {
    setStatus("loading");
    setErrorMessage(null);
    try {
      const res = await fetch("/api/analysis", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to generate analysis.");
      }
      setResult(data as AnalysisResponse);
      setStatus("success");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900">
      <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">AI Analysis</h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            {result
              ? `Generated ${new Date(result.generatedAt).toLocaleString("en-SG")}`
              : "Get AI-generated insights from your quotation data, powered by Gemini."}
          </p>
        </div>
        <button
          onClick={generate}
          disabled={status === "loading"}
          className="rounded-md bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "loading" ? "Analyzing..." : result ? "Refresh Analysis" : "Generate Analysis"}
        </button>
      </div>

      <div className="px-5 py-5">
        {status === "idle" && (
          <p className="text-sm text-zinc-500">
            Click &ldquo;Generate Analysis&rdquo; to summarize pipeline health, spot trends, and get action items.
          </p>
        )}

        {status === "error" && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {errorMessage}
          </div>
        )}

        {status === "success" && result && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-md border border-zinc-800 bg-zinc-950 px-4 py-3">
                <p className="text-xs text-zinc-500">Won Revenue</p>
                <p className="mt-1 text-lg font-semibold text-emerald-400">
                  {formatCurrency(result.metrics.wonRevenue)}
                </p>
              </div>
              <div className="rounded-md border border-zinc-800 bg-zinc-950 px-4 py-3">
                <p className="text-xs text-zinc-500">Pipeline Value</p>
                <p className="mt-1 text-lg font-semibold text-blue-400">
                  {formatCurrency(result.metrics.pipelineValue)}
                </p>
              </div>
              <div className="rounded-md border border-zinc-800 bg-zinc-950 px-4 py-3">
                <p className="text-xs text-zinc-500">Win Rate</p>
                <p className="mt-1 text-lg font-semibold text-zinc-100">
                  {result.metrics.winRatePercent === null ? "—" : `${result.metrics.winRatePercent}%`}
                </p>
              </div>
            </div>

            <p className="text-sm leading-relaxed text-zinc-300">{result.analysis.summary}</p>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Insights</h3>
              <ul className="mt-2 space-y-1.5">
                {result.analysis.insights.map((insight, i) => (
                  <li key={i} className="flex gap-2 text-sm text-zinc-300">
                    <span className="text-indigo-400">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Recommendations</h3>
              <ul className="mt-2 space-y-1.5">
                {result.analysis.recommendations.map((rec, i) => (
                  <li key={i} className="flex gap-2 text-sm text-zinc-300">
                    <span className="text-emerald-400">✓</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
