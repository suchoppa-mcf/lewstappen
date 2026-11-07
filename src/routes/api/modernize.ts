import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

const Body = z.object({
  code: z.string().min(1).max(60000),
  source: z.string().max(100),
  target: z.string().max(200),
  goals: z.array(z.string().max(100)).max(10),
});

const RUN_ID = "X-Lovable-AIG-Run-ID";

export const Route = createFileRoute("/api/modernize")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = Body.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
        const key = process.env["LOVABLE_API_KEY"];
        if (!key) return Response.json({ error: "AI is not configured" }, { status: 500 });
        const { code, source, target, goals } = parsed.data;

        let runId: string | undefined;
        const openai = createOpenAI({
          baseURL: "https://ai.gateway.lovable.dev/v1",
          apiKey: "unused",
          headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
          fetch: async (input, init) => {
            const headers = new Headers(init?.headers);
            headers.delete("Authorization");
            if (runId) headers.set(RUN_ID, runId);
            const res = await fetch(input, { ...init, headers });
            runId ??= res.headers.get(RUN_ID) ?? undefined;
            return res;
          },
        });

        const prompt = `You are a senior engineer modernizing legacy code.
Source language: ${source}
Target: ${target}
Goals: ${goals.join("; ") || "none specified"}

Rules: preserve behavior unless it is a security bug; keep names recognizable; do not invent external dependencies without saying so.

Output format, exactly: first ONE fenced code block containing the full updated code (and tests, if requested, in the same block). Then a short bulleted list titled "Changes" explaining each change and any behavior differences or things to verify. Nothing else.

Legacy code:
${code}`;

        const result = streamText({
          model: openai.responses("openai/gpt-6-astra"),
          prompt,
          abortSignal: request.signal,
          providerOptions: {
            openai: {
              forceReasoning: true,
              reasoningEffort: "low",
              reasoningSummary: "auto",
              store: false,
              include: ["reasoning.encrypted_content"],
            },
          },
        });
        return result.toTextStreamResponse();
      },
    },
  },
});
