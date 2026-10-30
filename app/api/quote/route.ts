import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { generateQuote } from "@/lib/nebius";
import { quoteRequestSchema } from "@/lib/quoteSchema";
import { checkRateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";

function clientIdentifier(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const identifier = clientIdentifier(req);
  const rateLimit = checkRateLimit(identifier);
  if (!rateLimit.allowed) {
    const message =
      rateLimit.reason === "global"
        ? "Cette démonstration a atteint son plafond de requêtes pour aujourd'hui. Réessayez demain."
        : "Vous avez atteint la limite de 3 essais par heure pour cette démonstration. Réessayez plus tard.";
    return NextResponse.json(
      { error: message },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rateLimit.retryAfterMs / 1000)) } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête JSON invalide." }, { status: 400 });
  }

  const parseResult = quoteRequestSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Requête invalide.", details: parseResult.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const quote = await generateQuote(parseResult.data);
    return NextResponse.json(quote, { status: 200 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Le modèle a renvoyé un format inattendu." },
        { status: 502 },
      );
    }
    const message = error instanceof Error ? error.message : "Erreur inconnue.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
