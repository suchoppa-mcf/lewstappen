import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check, CreditCard, Loader2, Wand2, X } from "lucide-react";
import { BASIC, LANG_FACTOR, PRO_RATE, TYPE_FACTOR, URGENCY_FACTOR, premiumPrice, type PremiumInput } from "@/lib/pricing";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — LewStappen" },
      { name: "description", content: "LewStappen plans: Basic free trials, Pro at $6.99 per file, and Premium one-time project pricing." },
      { property: "og:title", content: "Pricing — LewStappen" },
      { property: "og:description", content: "Pick Basic, Pro or Premium to modernize your legacy code." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Pricing,
});

const usd = (n: number) => `$${n.toFixed(2)}`;

function Pricing() {
  const [p, setP] = useState<PremiumInput>({ lines: 2000, files: 10, language: "COBOL / RPG / PL/I", type: "Business / batch system", dependencies: 2, databases: true, tests: true, security: true, docs: false, urgency: "Standard" });
  const [files, setFiles] = useState(1);
  const [checkout, setCheckout] = useState<{ plan: string; amount: string } | null>(null);
  const premium = premiumPrice(p);
  const set = <K extends keyof PremiumInput>(k: K, v: PremiumInput[K]) => setP((x) => ({ ...x, [k]: v }));

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground"><Wand2 className="h-5 w-5" /></div>
            <span className="font-display text-lg font-semibold">Lew<span className="text-destructive">Stappen</span></span>
          </Link>
          <Link to="/" className="btn-ghost ml-auto">Back to app</Link>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 pb-20">
        <section className="py-12 text-center">
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-destructive">// pricing</p>
          <h1 className="font-display text-4xl font-semibold tracking-tight md:text-5xl">Pick the plan that fits your code</h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">Demo only — no real payment is taken.</p>
        </section>

        <div className="grid gap-5 lg:grid-cols-3">
          <Plan name="Basic" price="Free" note={`${BASIC.trials} trials per user`} features={[`${BASIC.trials} free modernizations`, `Up to ${BASIC.maxLines} lines of code each`, "Diff and security audit"]}
            cta="Start free" onClick={() => setCheckout({ plan: "Basic", amount: "$0.00" })} />
          <Plan name="Pro" price={usd(PRO_RATE)} note="per file, per hour" highlight features={["Fixed hourly rate per file", "No line limit", "Tests, .patch and .zip exports", "Saved history and presets"]}
            cta="Choose Pro" onClick={() => setCheckout({ plan: `Pro · ${files} file${files > 1 ? "s" : ""}`, amount: usd(PRO_RATE * files) })}>
            <label className="mt-4 flex items-center justify-between text-sm">Files <input type="number" min={1} value={files} onChange={(e) => setFiles(Math.max(1, +e.target.value))} className="field w-24" /></label>
          </Plan>
          <Plan name="Premium" price={usd(premium)} note="one-time, per project" features={["Priced to your project", "Everything in Pro", "Priority support"]}
            cta="Buy Premium" onClick={() => setCheckout({ plan: "Premium project", amount: usd(premium) })} />
        </div>

        <section className="mt-10 rounded-xl border border-border bg-card p-6 shadow-panel">
          <h2 className="font-display text-xl font-semibold">Premium project estimator</h2>
          <p className="mt-1 text-sm text-muted-foreground">Your price adjusts as you describe the project.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Num label="Lines of code" v={p.lines} on={(v) => set("lines", v)} />
            <Num label="Number of files" v={p.files} on={(v) => set("files", v)} />
            <Num label="Outside libraries / dependencies" v={p.dependencies} on={(v) => set("dependencies", v)} />
            <Sel label="Language" v={p.language} opts={Object.keys(LANG_FACTOR)} on={(v) => set("language", v)} />
            <Sel label="Type of code" v={p.type} opts={Object.keys(TYPE_FACTOR)} on={(v) => set("type", v)} />
            <Sel label="Turnaround" v={p.urgency} opts={Object.keys(URGENCY_FACTOR)} on={(v) => set("urgency", v)} />
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {([["databases", "Talks to a database"], ["tests", "Include unit tests"], ["security", "Deep security review"], ["docs", "Write documentation"]] as const).map(([k, l]) => (
              <button key={k} onClick={() => set(k, !p[k])} className={p[k] ? "chip chip-on" : "chip"} aria-pressed={p[k]}>{l}</button>
            ))}
          </div>
          <div className="mt-6 flex items-center justify-between border-t border-border pt-5">
            <span className="text-sm text-muted-foreground">Estimated one-time price</span>
            <span className="font-display text-3xl font-semibold text-primary">{usd(premium)}</span>
          </div>
        </section>
      </main>
      {checkout && <Checkout {...checkout} onClose={() => setCheckout(null)} />}
    </div>
  );
}

function Plan({ name, price, note, features, cta, onClick, highlight, children }: { name: string; price: string; note: string; features: string[]; cta: string; onClick: () => void; highlight?: boolean; children?: React.ReactNode }) {
  return (
    <div className={`flex flex-col rounded-xl border bg-card p-6 ${highlight ? "border-primary shadow-panel" : "border-border"}`}>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">{name}</h2>
        {highlight && <span className="rounded-full bg-baby-red px-2 py-0.5 text-xs font-medium text-destructive">Popular</span>}
      </div>
      <p className="mt-4 font-display text-4xl font-semibold">{price}</p>
      <p className="text-sm text-muted-foreground">{note}</p>
      <ul className="mt-5 flex-1 space-y-2 text-sm">{features.map((f) => <li key={f} className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-primary" />{f}</li>)}</ul>
      {children}
      <button onClick={onClick} className={`${highlight ? "btn-primary" : "btn-ghost"} mt-6 justify-center`}>{cta}</button>
    </div>
  );
}

function Num({ label, v, on }: { label: string; v: number; on: (v: number) => void }) {
  return <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">{label}<input type="number" min={0} value={v} onChange={(e) => on(Math.max(0, +e.target.value))} className="field" /></label>;
}
function Sel({ label, v, opts, on }: { label: string; v: string; opts: string[]; on: (v: string) => void }) {
  return <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">{label}<select value={v} onChange={(e) => on(e.target.value)} className="field">{opts.map((o) => <option key={o}>{o}</option>)}</select></label>;
}

function Checkout({ plan, amount, onClose }: { plan: string; amount: string; onClose: () => void }) {
  const [state, setState] = useState<"form" | "busy" | "done">("form");
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-panel" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">Checkout</h2>
          <button aria-label="Close" onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        {state === "done" ? (
          <div className="py-6 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-accent text-primary"><Check className="h-6 w-6" /></div>
            <p className="mt-4 font-semibold">You're on {plan}!</p>
            <p className="mt-1 text-sm text-muted-foreground">This was a demo — no money was charged.</p>
            <Link to="/" className="btn-primary mt-6 justify-center">Start modernizing</Link>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); setState("busy"); setTimeout(() => setState("done"), 1200); }} className="flex flex-col gap-3">
            <div className="flex justify-between rounded-md bg-muted px-3 py-2 text-sm"><span>{plan}</span><span className="font-semibold">{amount}</span></div>
            <input required placeholder="Name on card" className="field" />
            <input required placeholder="4242 4242 4242 4242" inputMode="numeric" className="field" />
            <div className="flex gap-3"><input required placeholder="MM/YY" className="field w-1/2" /><input required placeholder="CVC" className="field w-1/2" /></div>
            <p className="rounded-md bg-baby-red px-3 py-2 text-xs text-destructive">Demo checkout — don't enter a real card.</p>
            <button disabled={state === "busy"} className="btn-primary justify-center">{state === "busy" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}Pay {amount}</button>
          </form>
        )}
      </div>
    </div>
  );
}
