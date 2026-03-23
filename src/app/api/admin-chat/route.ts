import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import Visitor from "@/models/Visitor";
import VisitLog from "@/models/VisitLog";

type KnowledgeDoc = {
  title: string;
  content: string;
};

type ChatHistoryItem = {
  role: "user" | "assistant";
  content: string;
};

type TimeRange =
  | { kind: "all"; label: string }
  | { kind: "bounded"; label: string; start: Date; end: Date };

type Intent =
  | "summary"
  | "ranking"
  | "trend"
  | "comparison"
  | "outlier"
  | "account_lookup";

type ToolOutput = {
  name: string;
  summary: string;
};

type CountAgg = { _id: string | number; count: number };

type MetricsSnapshot = {
  totalAccounts: number;
  blockedAccounts: number;
  logsInRange: number;
  topReasonsAgg: CountAgg[];
  topCollegesAgg: CountAgg[];
  monthlyAgg: CountAgg[];
  dailyAgg: CountAgg[];
  hourlyAgg: CountAgg[];
};

const STOPWORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "to",
  "for",
  "of",
  "in",
  "on",
  "is",
  "are",
  "with",
  "by",
  "from",
  "at",
  "this",
  "that",
  "what",
  "how",
  "can",
  "you",
  "please",
  "show",
  "me",
  "all",
]);

const SYNONYMS: Record<string, string[]> = {
  visitor: ["visitors", "checkin", "check-ins", "logs"],
  logs: ["visits", "entries", "checkins", "check-ins"],
  month: ["monthly", "months"],
  reason: ["purpose", "reasons"],
  college: ["program", "department", "course"],
  trend: ["pattern", "timeline"],
  top: ["highest", "most", "best"],
};

const MONTH_MAP: Record<string, number> = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
};

const FOLLOW_UP_MARKERS = ["what about", "how about", "also", "compare with", "same", "that"];

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function endOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function toolTitle(name: string) {
  return name.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function detectIntent(message: string): Intent {
  const text = message.toLowerCase();
  if (/(email|account|who is|who has|find visitor|lookup)/.test(text)) return "account_lookup";
  if (/(outlier|spike|drop|anomaly|unusual)/.test(text)) return "outlier";
  if (/(compare|versus|vs\.?|difference)/.test(text)) return "comparison";
  if (/(trend|over time|month|daily|weekly|yearly|hour|busiest|peak|time)/.test(text)) return "trend";
  if (/(most|least|top|highest|lowest|rank)/.test(text)) return "ranking";
  return "summary";
}

function tokenize(input: string) {
  const tokens = input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOPWORDS.has(token));

  const expanded = new Set<string>();
  for (const token of tokens) {
    expanded.add(token);
    for (const synonym of SYNONYMS[token] || []) {
      expanded.add(synonym);
    }
  }

  return Array.from(expanded);
}

function scoreDocument(doc: KnowledgeDoc, queryTokens: string[]) {
  const title = doc.title.toLowerCase();
  const content = doc.content.toLowerCase();
  return queryTokens.reduce((score, token) => {
    const titleHit = title.includes(token) ? 2 : 0;
    const contentHit = content.includes(token) ? 1 : 0;
    return score + titleHit + contentHit;
  }, 0);
}

function parseMonthMention(text: string, now: Date) {
  const pattern =
    /(january|february|march|april|may|june|july|august|september|october|november|december)\s*(\d{4})?/i;
  const match = text.match(pattern);
  if (!match) return null;

  const monthIndex = MONTH_MAP[match[1].toLowerCase()];
  const year = match[2] ? Number(match[2]) : now.getFullYear();
  const start = new Date(year, monthIndex, 1);
  return {
    kind: "bounded" as const,
    label: `${match[1]} ${year}`,
    start,
    end: endOfMonth(start),
  };
}

function parseTimeRange(message: string, history: ChatHistoryItem[], now = new Date()): TimeRange {
  const previousUserMessage = [...history].reverse().find((entry) => entry.role === "user")?.content || "";
  const text = `${previousUserMessage} ${message}`.toLowerCase();

  const monthRange = parseMonthMention(text, now);
  if (monthRange) return monthRange;

  if (text.includes("today")) {
    return { kind: "bounded", label: "today", start: startOfDay(now), end: endOfDay(now) };
  }

  if (text.includes("this week")) {
    const weekday = now.getDay();
    const mondayOffset = weekday === 0 ? 6 : weekday - 1;
    const start = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - mondayOffset));
    return { kind: "bounded", label: "this week", start, end: endOfDay(now) };
  }

  if (text.includes("this month")) {
    return {
      kind: "bounded",
      label: "this month",
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: endOfDay(now),
    };
  }

  if (text.includes("all") || text.includes("overall") || text.includes("entire")) {
    return { kind: "all", label: "all time" };
  }

  return {
    kind: "bounded",
    label: "last 30 days",
    start: startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29)),
    end: endOfDay(now),
  };
}

function enrichFollowUpQuestion(message: string, history: ChatHistoryItem[]) {
  const text = message.toLowerCase();
  const looksLikeFollowUp = text.length < 24 || FOLLOW_UP_MARKERS.some((marker) => text.includes(marker));
  if (!looksLikeFollowUp) return message;

  const previousUser = [...history].reverse().find((entry) => entry.role === "user" && entry.content.trim());
  if (!previousUser) return message;
  return `${previousUser.content}\nFollow-up: ${message}`;
}

function buildDateFilter(range: TimeRange) {
  if (range.kind === "all") return {};
  return {
    checkInTime: {
      $gte: range.start,
      $lte: range.end,
    },
  };
}

async function buildKnowledgeBase(question: string, intent: Intent, range: TimeRange) {
  const dateFilter = buildDateFilter(range);
  const matchStage = Object.keys(dateFilter).length ? [{ $match: dateFilter }] : [];

  const [totalAccounts, blockedAccounts, logsInRange, topReasonsAgg, topCollegesAgg, monthlyAgg, dailyAgg, hourlyAgg] =
    await Promise.all([
      Visitor.countDocuments(),
      Visitor.countDocuments({ blocked: true }),
      VisitLog.countDocuments(dateFilter),
      VisitLog.aggregate<CountAgg>([
        ...matchStage,
        { $group: { _id: "$reason", count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } },
        { $limit: 5 },
      ]),
      VisitLog.aggregate<CountAgg>([
        ...matchStage,
        {
          $lookup: {
            from: "visitors",
            localField: "visitor",
            foreignField: "_id",
            as: "visitorData",
          },
        },
        { $unwind: "$visitorData" },
        { $group: { _id: "$visitorData.program", count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } },
        { $limit: 5 },
      ]),
      VisitLog.aggregate<CountAgg>([
        ...matchStage,
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m",
                date: "$checkInTime",
                timezone: "Asia/Manila",
              },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: -1 } },
        { $limit: 12 },
      ]),
      VisitLog.aggregate<CountAgg>([
        ...matchStage,
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$checkInTime",
                timezone: "Asia/Manila",
              },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: -1 } },
        { $limit: 30 },
      ]),
      VisitLog.aggregate<CountAgg>([
        ...matchStage,
        {
          $group: {
            _id: {
              $hour: {
                date: "$checkInTime",
                timezone: "Asia/Manila",
              },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1, _id: 1 } },
        { $limit: 3 },
      ]),
    ]);

  const topMonth = [...monthlyAgg].sort((a, b) => b.count - a.count || String(a._id).localeCompare(String(b._id)))[0];
  const topDay = [...dailyAgg].sort((a, b) => b.count - a.count || String(a._id).localeCompare(String(b._id)))[0];

  const accountEmail = question.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
  const account = accountEmail
    ? ((await Visitor.findOne({ email: new RegExp(`^${accountEmail}$`, "i") })
        .select("name email program type blocked blockedReason")
        .lean()) as {
        name?: string;
        email?: string;
        program?: string;
        type?: string;
        blocked?: boolean;
        blockedReason?: string;
      } | null)
    : null;

  const toolOutputs: ToolOutput[] = [
    {
      name: "system_overview",
      summary: `Range: ${range.label}. Total accounts: ${totalAccounts}. Blocked accounts: ${blockedAccounts}. Visit logs in range: ${logsInRange}.`,
    },
    {
      name: "top_reasons",
      summary: topReasonsAgg.length
        ? topReasonsAgg.map((item) => `${item._id}: ${item.count}`).join("; ")
        : "No reason data available.",
    },
    {
      name: "top_colleges",
      summary: topCollegesAgg.length
        ? topCollegesAgg.map((item) => `${item._id}: ${item.count}`).join("; ")
        : "No college data available.",
    },
    {
      name: "monthly_trends",
      summary: monthlyAgg.length
        ? `Top month: ${topMonth?._id} (${topMonth?.count}). Monthly totals: ${monthlyAgg
            .map((item) => `${item._id}: ${item.count}`)
            .join("; ")}`
        : "No monthly data available.",
    },
    {
      name: "outlier_detection",
      summary: topDay
        ? `Highest day in range: ${topDay._id} (${topDay.count} check-ins).`
        : "No outlier data available.",
    },
    {
      name: "peak_hours",
      summary: hourlyAgg.length
        ? `Busiest hours: ${hourlyAgg
            .map((item) => `${String(item._id).padStart(2, "0")}:00 (${item.count})`)
            .join("; ")}`
        : "No hourly breakdown available.",
    },
  ];

  if (accountEmail) {
    toolOutputs.push({
      name: "account_lookup",
      summary: account
        ? `Matched account: ${account.name || "N/A"} (${account.email || "N/A"}) | ${account.program || "N/A"} | ${account.type || "N/A"} | blocked: ${account.blocked ? "yes" : "no"}${account.blockedReason ? ` | reason: ${account.blockedReason}` : ""}.`
        : `No account found for ${accountEmail}.`,
    });
  }

  const intentTools: Record<Intent, string[]> = {
    summary: ["system_overview", "top_reasons", "top_colleges", "peak_hours"],
    ranking: ["top_reasons", "top_colleges", "monthly_trends", "peak_hours"],
    trend: ["monthly_trends", "outlier_detection", "peak_hours", "system_overview"],
    comparison: ["top_reasons", "top_colleges", "system_overview"],
    outlier: ["outlier_detection", "monthly_trends", "peak_hours", "system_overview"],
    account_lookup: ["account_lookup", "system_overview"],
  };

  const selectedTools = toolOutputs.filter((tool) => intentTools[intent].includes(tool.name));
  const docs: KnowledgeDoc[] = selectedTools.map((tool) => ({
    title: toolTitle(tool.name),
    content: tool.summary,
  }));

  const metrics: MetricsSnapshot = {
    totalAccounts,
    blockedAccounts,
    logsInRange,
    topReasonsAgg,
    topCollegesAgg,
    monthlyAgg,
    dailyAgg,
    hourlyAgg,
  };

  return { docs, toolOutputs: selectedTools, metrics };
}

function formatRange(range: TimeRange) {
  if (range.kind === "all") return range.label;
  return `${range.label} (${range.start.toISOString().slice(0, 10)} to ${range.end
    .toISOString()
    .slice(0, 10)})`;
}

function computeConfidence(intent: Intent, answer: string) {
  const penalty = /cannot|missing|insufficient|no data/i.test(answer) ? 0.2 : 0;
  const base = intent === "account_lookup" ? 0.74 : 0.8;
  return Math.max(0.5, Math.min(0.95, Number((base - penalty).toFixed(2))));
}

function sanitizeAnswer(answer: string) {
  return answer
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^\s*[-*]\s+/gm, "")
    .replace(/\*/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function formatRangeForAnswer(range: TimeRange) {
  if (range.kind === "all") return "all time";
  return `${range.label} (${range.start.toISOString().slice(0, 10)} to ${range.end
    .toISOString()
    .slice(0, 10)})`;
}

function formatHour(hour: string | number) {
  const h = Number(hour);
  if (Number.isNaN(h)) return `${hour}:00`;
  const displayHour = ((h + 11) % 12) + 1;
  const suffix = h >= 12 ? "PM" : "AM";
  return `${displayHour}:00 ${suffix}`;
}

function buildDeterministicAnswer(question: string, range: TimeRange, metrics: MetricsSnapshot) {
  const q = question.toLowerCase();
  const rangeText = formatRangeForAnswer(range);

  if (/(busiest|peak).*(hour|time)|(hour|time).*(busiest|peak)/.test(q)) {
    const topHour = metrics.hourlyAgg[0];
    if (!topHour) {
      return {
        answer: `I could not find hourly visit data for ${rangeText}.`,
        sourceNames: ["Peak Hours", "System Overview"],
      };
    }
    return {
      answer: `For ${rangeText}, the busiest hour is ${formatHour(topHour._id)} with ${topHour.count} visit log(s).`,
      sourceNames: ["Peak Hours", "System Overview"],
    };
  }

  if (/(top|most|highest).*(reason)|reason.*(top|most|highest)/.test(q)) {
    const topReason = metrics.topReasonsAgg[0];
    if (!topReason) {
      return {
        answer: `I could not find visit reason data for ${rangeText}.`,
        sourceNames: ["Top Reasons", "System Overview"],
      };
    }
    return {
      answer: `For ${rangeText}, the top reason is ${String(topReason._id)} with ${topReason.count} visit log(s).`,
      sourceNames: ["Top Reasons", "System Overview"],
    };
  }

  if (/(top|most|highest).*(college|program)|college|program.*(top|most|highest)/.test(q)) {
    const topCollege = metrics.topCollegesAgg[0];
    if (!topCollege) {
      return {
        answer: `I could not find college/program data for ${rangeText}.`,
        sourceNames: ["Top Colleges", "System Overview"],
      };
    }
    return {
      answer: `For ${rangeText}, the top college/program is ${String(topCollege._id)} with ${topCollege.count} visit log(s).`,
      sourceNames: ["Top Colleges", "System Overview"],
    };
  }

  if (/(top|most|highest).*(month)|month.*(top|most|highest)/.test(q)) {
    const topMonth = [...metrics.monthlyAgg].sort(
      (a, b) => b.count - a.count || String(a._id).localeCompare(String(b._id))
    )[0];
    if (!topMonth) {
      return {
        answer: `I could not find monthly trend data for ${rangeText}.`,
        sourceNames: ["Monthly Trends", "System Overview"],
      };
    }
    return {
      answer: `For ${rangeText}, the top month is ${String(topMonth._id)} with ${topMonth.count} visit log(s).`,
      sourceNames: ["Monthly Trends", "System Overview"],
    };
  }

  if (/(total|how many).*(visit|log|check)/.test(q)) {
    return {
      answer: `For ${rangeText}, the total number of visit logs is ${metrics.logsInRange}.`,
      sourceNames: ["System Overview"],
    };
  }

  if (/(blocked).*(account)|account.*(blocked)/.test(q)) {
    return {
      answer: `The total number of blocked accounts is ${metrics.blockedAccounts}.`,
      sourceNames: ["System Overview"],
    };
  }

  if (/(total|how many).*(account|registered)/.test(q)) {
    return {
      answer: `The total number of registered accounts is ${metrics.totalAccounts}.`,
      sourceNames: ["System Overview"],
    };
  }

  return null;
}

async function generateModelAnswer(
  question: string,
  docs: KnowledgeDoc[],
  toolOutputs: ToolOutput[],
  intent: Intent,
  range: TimeRange
) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return {
      answer: docs.map((doc) => `- ${doc.title}: ${doc.content}`).join("\n"),
      usedModel: "fallback-rag",
    };
  }

  const model = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite-preview";
  const prompt = `You are an admin assistant for the NEU Library Visitor Log.

Rules:
- Ground your answer in tool outputs and context.
- Include the exact time range used.
- Include concrete values for numeric questions.
- If missing data, say what is missing.
- Do not use markdown formatting characters like *, **, #, or backticks.

Question: ${question}
Intent: ${intent}
Time range: ${formatRange(range)}

Tool outputs:
${toolOutputs.map((tool) => `- ${tool.name}: ${tool.summary}`).join("\n")}

Context:
${docs.map((doc) => `${doc.title}: ${doc.content}`).join("\n\n")}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 500,
        },
      }),
    }
  );

  if (!response.ok) {
    return {
      answer: docs.map((doc) => `${doc.title}: ${doc.content}`).join("\n"),
      usedModel: "fallback-rag",
    };
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  const rawAnswer =
    data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
    "I could not produce a model response.";

  return {
    answer: sanitizeAnswer(rawAnswer),
    usedModel: model,
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string })?.role;

    if (role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { message?: string; history?: ChatHistoryItem[] };
    const message = (body?.message || "").trim();

    const history = Array.isArray(body?.history)
      ? body.history.filter((item): item is ChatHistoryItem => {
          return (
            !!item &&
            (item.role === "user" || item.role === "assistant") &&
            typeof item.content === "string"
          );
        })
      : [];

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    if (message.length > 500) {
      return NextResponse.json(
        { error: "Message too long. Keep it under 500 characters." },
        { status: 400 }
      );
    }

    await connectDB();

    const enrichedQuestion = enrichFollowUpQuestion(message, history);
    const intent = detectIntent(enrichedQuestion);
    const range = parseTimeRange(enrichedQuestion, history);

    const { docs, toolOutputs, metrics } = await buildKnowledgeBase(enrichedQuestion, intent, range);

    const deterministic = buildDeterministicAnswer(enrichedQuestion, range, metrics);
    if (deterministic) {
      return NextResponse.json({
        answer: sanitizeAnswer(deterministic.answer),
        usedModel: "database-deterministic",
        intent,
        timeRange:
          range.kind === "all"
            ? { label: range.label }
            : {
                label: range.label,
                start: range.start.toISOString(),
                end: range.end.toISOString(),
              },
        confidence: 0.95,
        grounding: deterministic.sourceNames,
        sources: deterministic.sourceNames.map((name) => ({ title: name })),
      });
    }

    const queryTokens = tokenize(enrichedQuestion);
    const selectedDocs = docs
      .map((doc) => ({ doc, score: scoreDocument(doc, queryTokens) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((item) => item.doc);

    const selectedTitles = new Set(selectedDocs.map((doc) => doc.title.toLowerCase()));
    const selectedTools = toolOutputs.filter((tool) =>
      selectedTitles.has(toolTitle(tool.name).toLowerCase())
    );

    const modelResult = await generateModelAnswer(
      enrichedQuestion,
      selectedDocs,
      selectedTools.length ? selectedTools : toolOutputs,
      intent,
      range
    );

    return NextResponse.json({
      answer: modelResult.answer,
      usedModel: modelResult.usedModel,
      intent,
      timeRange:
        range.kind === "all"
          ? { label: range.label }
          : {
              label: range.label,
              start: range.start.toISOString(),
              end: range.end.toISOString(),
            },
      confidence: computeConfidence(intent, modelResult.answer),
      grounding: (selectedTools.length ? selectedTools : toolOutputs).map(
        (tool) => `${toolTitle(tool.name)}: ${tool.summary}`
      ),
      sources: selectedDocs.map((doc) => ({ title: doc.title })),
    });
  } catch (error) {
    console.error("Admin chat error:", error);
    return NextResponse.json(
      { error: "Failed to process chat request" },
      { status: 500 }
    );
  }
}
