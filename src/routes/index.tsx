import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Copy, Download, FileArchive, FileDiff, GitCommit, History, Loader2, Send, ShieldCheck, Sparkles, Square, Trash2, Upload, Wand2 } from "lucide-react";
import { diffLines, createTwoFilesPatch } from "diff";
import hljs from "highlight.js";
import { EXAMPLES, GOALS, SOURCES, TARGETS, parseOutput } from "@/lib/legacy";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Legacy Code Updater — modernize old code in seconds" },
      { name: "description", content: "Paste old FORTRAN, COBOL, BASIC, PHP 5, Python 2, jQuery and more. Get modern, secure code, a diff, tests and a security audit." },
      { property: "og:title", content: "Legacy Code Updater" },
      { property: "og:description", content: "Turn legacy code into modern, secure code with a diff, tests and an explanation of every change." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Entry = { id: string; at: number; source: string; target: string; input: string; raw: string };
type Preset = { name: string; source: string; target: string; goals: boolean[] };
const HKEY = "lcu-history";
const PKEY = "lcu-presets";
const load = <T,>(k: string, d: T): T => { try { return JSON.parse(localStorage.getItem(k) || "") as T; } catch { return d; } };

function Index() {
  const [source, setSource] = useState(SOURCES[0]);
  const [target, setTarget] = useState(TARGETS[0]);
  const [goals, setGoals] = useState(GOALS.map((g) => g.on));
  const [input, setInput] = useState("");
  const [raw, setRaw] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const [tab, setTab] = useState<"code" | "diff" | "tests">("code");
  const [refine, setRefine] = useState("");
  const [history, setHistory] = useState<Entry[]>([]);
  const [presets, setPresets] = useState<Preset[]>([]);
  const ctl = useRef<AbortController | null>(null);
  const out = useMemo(() => parseOutput(raw), [raw]);

  useEffect(() => { setHistory(load(HKEY, [])); setPresets(load(PKEY, [])); }, []);
  const saveHistory = (h: Entry[]) => { setHistory(h); localStorage.setItem(HKEY, JSON.stringify(h)); };
  const savePresets = (p: Preset[]) => { setPresets(p); localStorage.setItem(PKEY, JSON.stringify(p)); };

  async function run(instruction?: string) {
    setError("");
    if (!input.trim()) return setError("Paste or upload some code first.");
    const previous = instruction ? raw : undefined;
    setRaw("");
    ctl.current?.abort();
    const ac = new AbortController();
    ctl.current = ac;
    setBusy(true);
    try {
      const res = await fetch("/api/modernize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: input, source, target, goals: GOALS.filter((_, i) => goals[i]).map((g) => g.label), previous, instruction }),
        signal: ac.signal,
      });
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}));
        throw new Error(res.status === 429 ? "Too many requests. Wait a moment and try again." : res.status === 402 ? "AI credits have run out." : j.error || "Something went wrong.");
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setRaw(acc);
      }
      if (!acc.trim()) setError("No result came back. Try again.");
      else {
        saveHistory([{ id: crypto.randomUUID(), at: Date.now(), source, target, input, raw: acc }, ...load<Entry[]>(HKEY, [])].slice(0, 30));
        setRefine("");
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") { setError((e as Error).message); if (previous) setRaw(previous); }
    } finally {
      setBusy(false);
    }
  }

  function flash(k: string) { setCopied(k); setTimeout(() => setCopied(""), 1500); }
  function copy(text: string, k: string) { navigator.clipboard.writeText(text).then(() => flash(k)); }
  function save(blob: Blob, name: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  }
  const patch = () => createTwoFilesPatch("legacy", "updated", input, out.code);
  async function zip() {
    const JSZip = (await import("jszip")).default;
    const z = new JSZip();
    z.file("legacy-code.txt", input);
    z.file("updated-code.txt", out.code);
    if (out.tests) z.file("tests.txt", out.tests);
    z.file("changes.diff", patch());
    z.file("CHANGES.md", `# Changes\n\n${out.changes}\n\n# Security\n\n${out.security}\n`);
    if (out.commit) z.file("COMMIT_MSG.txt", out.commit);
    save(await z.generateAsync({ type: "blob" }), "modernized.zip");
  }
  function upload(f?: File) {
    if (!f) return;
    if (f.size > 60000) return setError("That file is too large (max about 60 KB).");
    f.text().then((t) => { setInput(t); setError(""); });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-6 py-4">
          <div className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground"><Wand2 className="h-5 w-5" /></div>
          <span className="font-display text-lg font-semibold tracking-tight">Legacy Code Updater</span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 pb-20">
        <section className="py-12 md:py-16">
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-primary">// from FORTRAN & COBOL to modern</p>
          <h1 className="max-w-3xl font-display text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
            Old code in. <span className="text-primary">Modern, secure code</span> out.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">Paste or upload legacy code, pick a target or framework, and get updated code, a side-by-side diff, tests and a security audit.</p>
        </section>

        <section className="mb-6">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Try an example</h2>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {EXAMPLES.map((ex) => (
              <button key={ex.name} onClick={() => { setInput(ex.code); setSource(ex.source); setRaw(""); }} className="shrink-0 rounded-lg border border-border bg-card px-3 py-2 text-left text-sm hover:border-primary">
                <span className="block font-medium">{ex.name}</span>
                <span className="font-mono text-[11px] text-muted-foreground">{ex.source}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-5 shadow-panel">
          <div className="flex flex-wrap items-end gap-4">
            <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
              Source language
              <select value={source} onChange={(e) => setSource(e.target.value)} className="field min-w-48">
                {SOURCES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
            <label className="flex flex-1 flex-col gap-1.5 text-xs font-medium text-muted-foreground">
              Update to (language or framework)
              <input value={target} onChange={(e) => setTarget(e.target.value)} list="targets" className="field min-w-64" />
              <datalist id="targets">{TARGETS.map((t) => <option key={t} value={t} />)}</datalist>
            </label>
            {busy && <button onClick={() => ctl.current?.abort()} className="btn-ghost"><Square className="h-4 w-4" /> Stop</button>}
            <button onClick={() => run()} disabled={busy} className="btn-primary">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {busy ? "Updating…" : "Update code"}
            </button>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {GOALS.map((g, i) => (
              <button key={g.label} onClick={() => setGoals((p) => p.map((v, j) => (j === i ? !v : v)))} className={goals[i] ? "chip chip-on" : "chip"} aria-pressed={goals[i]}>{g.label}</button>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4 text-xs">
            <span className="text-muted-foreground">Presets:</span>
            {presets.map((p, i) => (
              <span key={p.name} className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5">
                <button onClick={() => { setSource(p.source); setTarget(p.target); setGoals(p.goals); }}>{p.name}</button>
                <button aria-label={`Delete ${p.name}`} onClick={() => savePresets(presets.filter((_, j) => j !== i))}><Trash2 className="h-3 w-3 text-muted-foreground" /></button>
              </span>
            ))}
            <button className="icon-btn" onClick={() => { const name = prompt("Name this preset"); if (name) savePresets([...presets.filter((p) => p.name !== name), { name, source, target, goals }]); }}>+ Save current</button>
          </div>
        </section>

        {error && <p className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}

        <section className="mt-6 grid items-start gap-5 lg:grid-cols-2">
          <Pane title="Legacy code" tag="before" actions={
            <label className="icon-btn cursor-pointer"><Upload className="h-3.5 w-3.5" />Upload file
              <input type="file" className="hidden" onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ""; }} />
            </label>
          }>
            <textarea value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} placeholder="Paste legacy code here, or upload a file (.cbl, .f, .bas, .php, .py, .java…)" className="code-area" />
          </Pane>
          <Pane
            title="Updated code"
            tag="after"
            tabs={
              <div className="flex gap-1">
                {(["code", "diff", "tests"] as const).map((t) => (
                  <button key={t} onClick={() => setTab(t)} className={tab === t ? "tab tab-on" : "tab"}>{t === "code" ? "Code" : t === "diff" ? "Diff" : "Tests"}</button>
                ))}
              </div>
            }
            actions={
              <>
                <button onClick={() => copy(tab === "tests" ? out.tests : out.code, "code")} disabled={!out.code || busy} className="icon-btn"><Copy className="h-3.5 w-3.5" />{copied === "code" ? "Copied" : "Copy"}</button>
                <button onClick={() => save(new Blob([out.code]), "updated-code.txt")} disabled={!out.code || busy} className="icon-btn"><Download className="h-3.5 w-3.5" />Code</button>
                <button onClick={() => save(new Blob([patch()]), "changes.patch")} disabled={!out.code || busy} className="icon-btn"><FileDiff className="h-3.5 w-3.5" />.patch</button>
                <button onClick={zip} disabled={!out.code || busy} className="icon-btn"><FileArchive className="h-3.5 w-3.5" />.zip</button>
              </>
            }
          >
            {!out.code ? (
              <pre className="code-area text-muted-foreground">{busy ? "Thinking…" : "Your modernized code will appear here."}</pre>
            ) : tab === "code" ? (
              <Highlighted code={out.code} />
            ) : tab === "diff" ? (
              <DiffView a={input} b={out.code} />
            ) : out.tests ? (
              <Highlighted code={out.tests} />
            ) : (
              <pre className="code-area text-muted-foreground">Turn on “Add unit tests” and run again to get a test file.</pre>
            )}
          </Pane>
        </section>

        {out.code && !busy && (
          <form onSubmit={(e) => { e.preventDefault(); if (refine.trim()) run(refine.trim()); }} className="mt-5 flex gap-2">
            <input value={refine} onChange={(e) => setRefine(e.target.value)} placeholder="Ask for a change, e.g. “Use PDO instead of MySQLi” or “Explain the loop on line 14”" className="field flex-1" />
            <button className="btn-primary" disabled={!refine.trim()}><Send className="h-4 w-4" />Refine</button>
          </form>
        )}

        {(out.changes || out.security || out.commit) && (
          <section className="mt-6 grid gap-5 lg:grid-cols-3">
            <Card title="What changed" icon={<Sparkles className="h-4 w-4 text-primary" />} className="lg:col-span-2"><Bullets text={out.changes} /></Card>
            <div className="flex flex-col gap-5">
              <Card title="Security audit" icon={<ShieldCheck className="h-4 w-4 text-primary" />}><Bullets text={out.security || "- Waiting…"} /></Card>
              {out.commit && (
                <Card title="Commit message" icon={<GitCommit className="h-4 w-4 text-primary" />} action={<button className="icon-btn" onClick={() => copy(out.commit, "commit")}><Copy className="h-3.5 w-3.5" />{copied === "commit" ? "Copied" : "Copy"}</button>}>
                  <pre className="whitespace-pre-wrap rounded-md bg-code p-3 font-mono text-xs">{out.commit}</pre>
                </Card>
              )}
            </div>
          </section>
        )}

        {history.length > 0 && (
          <section className="mt-10">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold"><History className="h-4 w-4" />History</h2>
              <button className="icon-btn" onClick={() => saveHistory([])}><Trash2 className="h-3.5 w-3.5" />Clear</button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {history.map((h) => (
                <button key={h.id} onClick={() => { setInput(h.input); setSource(h.source); setTarget(h.target); setRaw(h.raw); setTab("code"); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="rounded-lg border border-border bg-card p-3 text-left text-sm hover:border-primary">
                  <span className="block font-medium">{h.source} → {h.target}</span>
                  <span className="block truncate font-mono text-[11px] text-muted-foreground">{h.input.split("\n").find((l) => l.trim())}</span>
                  <span className="text-[11px] text-muted-foreground">{new Date(h.at).toLocaleString()}</span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">History and presets are saved in this browser only.</p>
          </section>
        )}
      </main>
    </div>
  );
}

function Highlighted({ code }: { code: string }) {
  const html = useMemo(() => hljs.highlightAuto(code).value, [code]);
  const lines = code.split("\n").length;
  return (
    <div className="code-area flex gap-4 p-0">
      <pre aria-hidden className="select-none py-4 pl-4 text-right text-muted-foreground">{Array.from({ length: lines }, (_, i) => i + 1).join("\n")}</pre>
      <pre className="hljs flex-1 py-4 pr-4" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}

function DiffView({ a, b }: { a: string; b: string }) {
  const rows = useMemo(() => {
    const out: { l?: string; r?: string; kind: "same" | "del" | "add" | "mod" }[] = [];
    const parts = diffLines(a, b);
    const lines = (s: string) => s.replace(/\n$/, "").split("\n");
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i]!;
      const n = parts[i + 1];
      if (p.removed && n?.added) {
        const L = lines(p.value), R = lines(n.value);
        for (let k = 0; k < Math.max(L.length, R.length); k++) out.push({ l: L[k], r: R[k], kind: L[k] === undefined ? "add" : R[k] === undefined ? "del" : "mod" });
        i++;
      } else if (p.removed) lines(p.value).forEach((l) => out.push({ l, kind: "del" }));
      else if (p.added) lines(p.value).forEach((r) => out.push({ r, kind: "add" }));
      else lines(p.value).forEach((x) => out.push({ l: x, r: x, kind: "same" }));
    }
    return out;
  }, [a, b]);
  return (
    <div className="code-area p-0">
      <table className="w-full border-collapse">
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td className={`w-1/2 px-3 align-top ${r.kind === "del" || r.kind === "mod" ? "diff-del" : ""}`}>{r.l ?? ""}</td>
              <td className={`w-1/2 border-l border-border px-3 align-top ${r.kind === "add" || r.kind === "mod" ? "diff-add" : ""}`}>{r.r ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Bullets({ text }: { text: string }) {
  const items = text.split("\n").map((l) => l.replace(/^\s*[-*•]\s?/, "").trim()).filter(Boolean);
  return <ul className="space-y-2 text-sm leading-relaxed">{items.map((t, i) => <li key={i} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />{t.replace(/\*\*/g, "")}</li>)}</ul>;
}

function Card({ title, icon, action, className = "", children }: { title: string; icon: React.ReactNode; action?: React.ReactNode; className?: string; children: React.ReactNode }) {
  return (
    <div className={`rounded-xl border border-border bg-card p-5 ${className}`}>
      <div className="mb-3 flex items-center justify-between"><h2 className="flex items-center gap-2 font-display text-base font-semibold">{icon}{title}</h2>{action}</div>
      {children}
    </div>
  );
}

function Pane({ title, tag, tabs, actions, children }: { title: string; tag: string; tabs?: React.ReactNode; actions?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-3 text-sm font-semibold">
          <span className="flex items-center gap-2">{title}<span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] uppercase text-muted-foreground">{tag}</span></span>
          {tabs}
        </div>
        <div className="flex flex-wrap gap-1.5">{actions}</div>
      </div>
      {children}
    </div>
  );
}
