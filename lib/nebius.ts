import { z } from "zod";

const NEBIUS_BASE_URL = "https://api.tokenfactory.us-central1.nebius.com/v1";
const CALL_TIMEOUT_MS = 30_000;

export const NEMOTRON_MODEL = process.env.NEBIUS_MODEL ?? "nvidia/nemotron-3-super-120b-a12b";

export type ToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

export type ChatMessage =
  | { role: "system" | "user"; content: string }
  | { role: "assistant"; content: string; tool_calls?: ToolCall[] }
  | { role: "tool"; tool_call_id: string; content: string };

export type ToolDefinition = {
  type: "function";
  function: { name: string; description: string; parameters: Record<string, unknown> };
};

export type ChatParams = {
  messages: ChatMessage[];
  max_tokens: number;
  temperature: number;
  tools?: ToolDefinition[];
  tool_choice?: "auto";
  response_format?: {
    type: "json_schema";
    json_schema: { name: string; schema: Record<string, unknown>; strict: boolean };
  };
  // Nemotron 3 Super reads its reasoning switches from the chat template. Low
  // effort keeps a short thought before each answer, which is what the trace
  // shows, without paying for a full reasoning pass on every call.
  chat_template_kwargs?: { enable_thinking: boolean; low_effort?: boolean };
};

const completionSchema = z.object({
  choices: z
    .array(
      z.object({
        finish_reason: z.string().nullish(),
        message: z.object({
          content: z.string().nullish(),
          reasoning_content: z.string().nullish(),
          tool_calls: z
            .array(
              z.object({
                id: z.string(),
                type: z.literal("function").default("function"),
                function: z.object({ name: z.string(), arguments: z.string() }),
              }),
            )
            .nullish(),
        }),
      }),
    )
    .min(1),
  usage: z
    .object({ prompt_tokens: z.number(), completion_tokens: z.number() })
    .nullish(),
});

export type Completion = z.infer<typeof completionSchema>;

export type ChatModel = (params: ChatParams, signal: AbortSignal) => Promise<Completion>;

export class ModelCallError extends Error {}

export function nemotronFromEnv(): ChatModel {
  const apiKey = process.env.NEBIUS_API_KEY;
  if (!apiKey) {
    throw new ModelCallError("NEBIUS_API_KEY is not configured on the server.");
  }
  return async (params, signal) => {
    const response = await fetch(`${NEBIUS_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: NEMOTRON_MODEL, ...params }),
      signal: AbortSignal.any([signal, AbortSignal.timeout(CALL_TIMEOUT_MS)]),
    });
    if (!response.ok) {
      throw new ModelCallError(`Token Factory answered ${response.status}`);
    }
    const parsed = completionSchema.safeParse(await response.json());
    if (!parsed.success) {
      throw new ModelCallError("Token Factory returned an unexpected payload");
    }
    return parsed.data;
  };
}
