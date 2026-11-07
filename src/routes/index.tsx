import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Copy, Download, Loader2, Sparkles, Square, Wand2 } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Legacy Code Updater — modernize old code in seconds" },
      { name: "description", content: "Paste old PHP, Python 2, jQuery, COBOL and more. Get a modern, secure version with a plain-language list of changes." },
      { property: "og:title", content: "Legacy Code Updater" },
      { property: "og:description", content: "Turn legacy code into modern, secure code with an explanation of every change." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const SOURCES = ["Auto-detect", "PHP 5", "Python 2", "Java 6/7", "JavaScript (ES5)", "jQuery", "C#/.NET Framework", "Perl", "COBOL", "Visual Basic 6", "C/C++ (pre-C++11)"];
const TARGETS = ["Latest stable version, same language", "Python 3.12", "Modern TypeScript", "Java 21", "C# 12 / .NET 8", "PHP 8.3", "Go", "Rust"];
const GOALS = [
  { label: "Replace deprecated APIs", on: true },
  { label: "Fix security issues", on: true },
  { label: "Add comments where logic is unclear", on: true },
  { label: "Add type hints/annotations", on: false },
  { label: "Add unit tests", on: false },
];
const DEMO = `<?php
// user lookup
mysql_connect("localhost","root","");
mysql_select_db("app");
function get_user($id){
  $q = mysql_query("SELECT * FROM users WHERE id = " . $_GET["id"]);
  $row = mysql_fetch_array($q);
  if(split(",", $row["roles"])[0] == "admin"){ echo "Hi admin"; }
  return $row;
}
$u = get_user($_GET["id"]);
echo "Welcome " . $_GET["name"];
?>`;

function splitOutput(text: string) {
  const m = text.match(/```[^\n]*\n([\s\S]*?)(```|$)/);
  if (!m) return { code: text, notes: "" };
  const rest = m[2] ? text.slice((m.index ?? 0) + m[0].length).trim() : "";
  return { code: m[1].replace(/\n$/, ""), notes: rest.replace(/^#+\s*[^\n]*\n/, "").replace(/^\**Changes\**:?\s*\n/i, "") };
}

function Index() {
  const [source, setSource] = useState(SOURCES[0]);
  const [target, setTarget] = useState(TARGETS[0]);
  const [goals, setGoals] = useState(GOALS.map((g) => g.on));
  const [input, setInput] = useState("");
  const [raw, setRaw] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const ctl = useRef<AbortController | null>(null);
  const { code, notes } = splitOutput(raw);

  async function run() {
    setError("");
    setRaw("");
    if (!input.trim()) return setError("Paste some code first.");
    ctl.current?.abort();
    const ac = new AbortController();
    ctl.current = ac;
    setBusy(true);
    try {
      const res = await fetch("/api/modernize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: input, source, target, goals: GOALS.filter((_, i) => goals[i]).map((g) => g.label) }),
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
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function copy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }
  function download() {
    const url = URL.createObjectURL(new Blob([code], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "updated-code.txt";
    a.click();
    URL.revokeObjectURL(url);
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
        <section className="py-14 md:py-20">
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-primary">// from mysql_query to modern</p>
          <h1 className="max-w-3xl font-display text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
            Old code in. <span className="text-primary">Modern, secure code</span> out.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">Paste legacy code, pick a target, and get an updated version with a plain-language list of every change.</p>
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
              Update to
              <input value={target} onChange={(e) => setTarget(e.target.value)} list="targets" className="field min-w-64" />
              <datalist id="targets">{TARGETS.map((t) => <option key={t} value={t} />)}</datalist>
            </label>
            <button onClick={() => { setInput(DEMO); setSource("PHP 5"); }} className="btn-ghost">Load example</button>
            {busy ? (
              <button onClick={() => ctl.current?.abort()} className="btn-ghost"><Square className="h-4 w-4" /> Stop</button>
            ) : null}
            <button onClick={run} disabled={busy} className="btn-primary">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {busy ? "Updating…" : "Update code"}
            </button>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {GOALS.map((g, i) => (
              <button
                key={g.label}
                onClick={() => setGoals((p) => p.map((v, j) => (j === i ? !v : v)))}
                className={goals[i] ? "chip chip-on" : "chip"}
                aria-pressed={goals[i]}
              >
                {g.label}
              </button>
            ))}
          </div>
        </section>

        {error && <p className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}

        <section className="mt-6 grid gap-5 lg:grid-cols-2">
          <Pane title="Legacy code" tag="before">
            <textarea value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} placeholder="Paste legacy code here…" className="code-area" />
          </Pane>
          <Pane
            title="Updated code"
            tag="after"
            actions={
              <>
                <button onClick={copy} disabled={!code || busy} className="icon-btn"><Copy className="h-3.5 w-3.5" />{copied ? "Copied" : "Copy"}</button>
                <button onClick={download} disabled={!code || busy} className="icon-btn"><Download className="h-3.5 w-3.5" />Download</button>
              </>
            }
          >
            <pre className="code-area">{code || <span className="text-muted-foreground">{busy ? "Thinking…" : "Your modernized code will appear here."}</span>}</pre>
          </Pane>
        </section>

        {notes && (
          <section className="mt-6 rounded-xl border border-border bg-card p-6">
            <h2 className="mb-3 font-display text-lg font-semibold">What changed</h2>
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-card-foreground">{notes}</div>
          </section>
        )}
      </main>
    </div>
  );
}

function Pane({ title, tag, actions, children }: { title: string; tag: string; actions?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-2 text-sm font-semibold">
          {title}
          <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] uppercase text-muted-foreground">{tag}</span>
        </div>
        <div className="flex gap-1.5">{actions}</div>
      </div>
      {children}
    </div>
  );
}
