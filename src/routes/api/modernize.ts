import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const Body = z.object({
  code: z.string().min(1).max(60000),
  source: z.string().max(100),
  target: z.string().max(200),
  goals: z.array(z.string().max(100)).max(10),
  previous: z.string().max(80000).optional(),
  instruction: z.string().max(2000).optional(),
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
        const url = process.env["SUPABASE_URL"];
        const publicKey = process.env["SUPABASE_PUBLISHABLE_KEY"];
        const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
        if (!token) return Response.json({ error: "Sign in to update code." }, { status: 401 });
        if (!url || !publicKey) return Response.json({ error: "Account plans are unavailable." }, { status: 503 });
        const client = createClient<Database>(url, publicKey, {
          auth: { persistSession: false, autoRefreshToken: false },
          global: { headers: { Authorization: `Bearer ${token}` } },
        });
        const { data: auth, error: authError } = await client.auth.getUser(token);
        if (authError || !auth.user) return Response.json({ error: "Please sign in again." }, { status: 401 });
        const reservation = await client.rpc("reserve_basic_trial", { code_text: parsed.data.code });
        if (reservation.error) return Response.json({ error: reservation.error.message }, { status: 403 });
        const accountId = auth.user.id;
        let refunded = false;
        const refund = async () => {
          if (!reservation.data || refunded) return;
          refunded = true;
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          await supabaseAdmin.rpc("refund_basic_trial_for_user", { account_id: accountId });
        };
        const { code, source, target, goals, previous, instruction } = parsed.data;
        const wantTests = goals.some((g) => /test/i.test(g));

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

        const format = `Output format, exactly and in this order:
1. ONE fenced code block with the full updated code${wantTests ? " (no tests in it)" : ""}.
${wantTests ? "2. ONE fenced code block with runnable unit tests using the idiomatic framework for the target (e.g. pytest, PHPUnit, JUnit 5, Jest/Vitest, xUnit, go test, cargo test), including a first-line comment telling how to run them.\n" : ""}Then these markdown sections:
## Changes
- bullet list explaining each change and behavior differences to verify
## Security
- bullet list of each vulnerability fixed (e.g. SQL injection, XSS, weak hashing), with CWE id when known; write "- None found" if none
## Commit message
A conventional-commit style message: one summary line, blank line, short body.
Nothing else.`;

        const prompt = `You are a senior engineer modernizing legacy code, including very old languages (FORTRAN, COBOL, ALGOL, BASIC, PL/I, RPG, assembly, etc).
Source language: ${source}
Target: ${target}
Goals: ${goals.join("; ") || "none specified"}

Rules: preserve behavior unless it is a security bug; keep names recognizable; do not invent external dependencies without saying so. For framework migrations, produce idiomatic code for that framework.

${format}

Legacy code:
${code}
${previous && instruction ? `\nYour previous answer was:\n${previous}\n\nThe user now asks for this refinement: ${instruction}\nApply it and reply again in the same full output format.` : ""}`;

        try {
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
        const reader = result.toTextStreamResponse().body?.getReader();
        if (!reader) { await refund(); return Response.json({ error: "No result came back. Try again." }, { status: 502 }); }
        let hadOutput = false;
        return new Response(new ReadableStream<Uint8Array>({
          async pull(controller) {
            try {
              const { done, value } = await reader.read();
              if (done) {
                if (!hadOutput) await refund();
                controller.close();
              } else { hadOutput ||= value.length > 0; controller.enqueue(value); }
            } catch (error) { await refund(); controller.error(error); }
          },
          async cancel() { await reader.cancel(); await refund(); },
        }), { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
        } catch {
          await refund();
          return Response.json({ error: "Couldn't update code. Your trial was not used." }, { status: 502 });
        }
      },
    },
  },
});
