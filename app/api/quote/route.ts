import { NextRequest, NextResponse } from "next/server";
import { runQuoteAgent } from "@/lib/agent";
import { NEMOTRON_MODEL, nemotronFromEnv, type ChatModel } from "@/lib/nebius";
import { quoteRequestSchema, type AgentEvent } from "@/lib/quoteSchema";
import { checkRateLimit } from "@/lib/ratelimit";
import { researchFromEnv } from "@/lib/tavily";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BODY_BYTES = 4_096;

function clientIdentifier(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
}

function isSameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host === req.headers.get("host");
  } catch {
    return false;
  }
}

function fail(status: number, error: string, headers?: HeadersInit): NextResponse {
  return NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

export async function POST(req: NextRequest): Promise<Response> {
  if (!isSameOrigin(req)) {
    return fail(403, "Requests must come from the Devis Agent page.");
  }
  if (!req.headers.get("content-type")?.startsWith("application/json")) {
    return fail(415, "Send the request as JSON.");
  }

  const rawBody = await req.text();
  if (rawBody.length > MAX_BODY_BYTES) {
    return fail(413, "The request is too large.");
  }
  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return fail(400, "The request body is not valid JSON.");
  }

  const parsed = quoteRequestSchema.safeParse(body);
  if (!parsed.success) {
    return fail(400, parsed.error.issues[0]?.message ?? "The request is invalid.");
  }

  const rateLimit = checkRateLimit(clientIdentifier(req));
  if (!rateLimit.allowed) {
    const message =
      rateLimit.reason === "global"
        ? "This public demo has reached its daily cap. Please come back tomorrow."
        : "This demo allows 3 quotes per hour per visitor. Please try again later.";
    return fail(429, message, { "Retry-After": String(Math.ceil(rateLimit.retryAfterMs / 1000)) });
  }

  let model: ChatModel;
  try {
    model = nemotronFromEnv();
  } catch {
    return fail(503, "The quoting agent is not configured on this deployment.");
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: AgentEvent) => {
        if (!req.signal.aborted) controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };
      try {
        await runQuoteAgent(
          parsed.data,
          { model, modelName: NEMOTRON_MODEL, research: researchFromEnv(), now: () => new Date() },
          send,
          req.signal,
        );
      } catch (error) {
        console.error("quote agent failed", error);
        send({ type: "error", message: "The quoting agent hit an unexpected error. Please try again." });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
