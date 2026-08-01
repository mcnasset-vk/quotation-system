import { NextResponse } from "next/server";
import { Type } from "@google/genai";
import { callEdgeFunction } from "@/lib/edge-functions";
import { gemini, GEMINI_MODEL } from "@/lib/gemini";
import { CustomerRow, mapCustomer, mapQuote, QuoteRow } from "@/lib/supabase-mappers";
import { Customer, Quote, quoteTotal } from "@/lib/types";

export const runtime = "nodejs";

interface AnalysisResult {
  summary: string;
  insights: string[];
  recommendations: string[];
}

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: "2-3 sentence executive summary of overall pipeline health.",
    },
    insights: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "4-6 specific, data-grounded observations (trends, standout customers, stale quotes, etc).",
    },
    recommendations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "3-5 concrete, actionable next steps for the sales team or owner.",
    },
  },
  required: ["summary", "insights", "recommendations"],
};

export async function POST() {
  let customers: Customer[];
  let quotes: Quote[];
  try {
    const [customerRows, quoteRows] = await Promise.all([
      callEdgeFunction<CustomerRow[]>("customers", { method: "GET" }),
      callEdgeFunction<QuoteRow[]>("quotes", { method: "GET" }),
    ]);
    customers = customerRows.map(mapCustomer);
    quotes = quoteRows.map(mapQuote);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load quotation data.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  if (quotes.length === 0) {
    return NextResponse.json({ error: "No quotes yet — create a few quotes before running analysis." }, { status: 400 });
  }

  const statusCounts = { Draft: 0, Sent: 0, Accepted: 0, Rejected: 0 };
  let wonRevenue = 0;
  let pipelineValue = 0;
  let lostValue = 0;
  const revenueByCustomer = new Map<string, number>();
  const revenueByMonth = new Map<string, { count: number; revenue: number }>();
  const itemStats = new Map<string, { quantity: number; revenue: number }>();

  for (const quote of quotes) {
    const total = quoteTotal(quote);
    statusCounts[quote.status] += 1;

    if (quote.status === "Accepted") wonRevenue += total;
    if (quote.status === "Draft" || quote.status === "Sent") pipelineValue += total;
    if (quote.status === "Rejected") lostValue += total;

    revenueByCustomer.set(quote.customerId, (revenueByCustomer.get(quote.customerId) ?? 0) + total);

    const month = quote.createdAt.slice(0, 7);
    const monthEntry = revenueByMonth.get(month) ?? { count: 0, revenue: 0 };
    monthEntry.count += 1;
    monthEntry.revenue += total;
    revenueByMonth.set(month, monthEntry);

    for (const item of quote.items) {
      const entry = itemStats.get(item.description) ?? { quantity: 0, revenue: 0 };
      entry.quantity += item.quantity;
      entry.revenue += item.quantity * item.unitPrice;
      itemStats.set(item.description, entry);
    }
  }

  const totalRevenue = quotes.reduce((sum, q) => sum + quoteTotal(q), 0);
  const closedCount = statusCounts.Accepted + statusCounts.Rejected;
  const winRate = closedCount > 0 ? Math.round((statusCounts.Accepted / closedCount) * 1000) / 10 : null;

  const topCustomers = [...revenueByCustomer.entries()]
    .map(([customerId, revenue]) => ({
      name: customers.find((c) => c.id === customerId)?.companyName ?? "Unknown",
      revenue,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const monthlyTrend = [...revenueByMonth.entries()]
    .map(([month, stats]) => ({ month, ...stats }))
    .sort((a, b) => (a.month < b.month ? -1 : 1));

  const topItems = [...itemStats.entries()]
    .map(([description, stats]) => ({ description, ...stats }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const stalePending = quotes
    .filter((q) => q.status === "Draft" || q.status === "Sent")
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1))
    .slice(0, 5)
    .map((q) => ({
      quoteNumber: q.quoteNumber,
      customer: customers.find((c) => c.id === q.customerId)?.companyName ?? "Unknown",
      status: q.status,
      date: q.createdAt,
      total: quoteTotal(q),
    }));

  const metrics = {
    totalCustomers: customers.length,
    totalQuotes: quotes.length,
    statusCounts,
    totalRevenue,
    wonRevenue,
    pipelineValue,
    lostValue,
    winRatePercent: winRate,
    avgQuoteValue: Math.round(totalRevenue / quotes.length),
    topCustomers,
    monthlyTrend,
    topItems,
    stalePending,
  };

  let analysis: AnalysisResult;
  try {
    const response = await gemini.models.generateContent({
      model: GEMINI_MODEL,
      contents: `Here is the current quotation pipeline data for a senior co-living community, as JSON:\n\n${JSON.stringify(metrics, null, 2)}\n\nAnalyze this data and produce a business report.`,
      config: {
        systemInstruction:
          "You are a business analyst for a senior co-living community's sales operation. You analyze quotation pipeline data and produce concise, actionable insights for the business owner and sales team. Reference concrete numbers from the data (revenue, names, counts) rather than generic advice.",
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    });

    const text = response.text;
    if (!text) throw new Error("Gemini returned an empty response.");
    analysis = JSON.parse(text) as AnalysisResult;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate AI analysis.";
    return NextResponse.json({ error: message, metrics }, { status: 502 });
  }

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    metrics,
    analysis,
  });
}
