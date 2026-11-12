import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Loader2, Upload, Wand2 } from "lucide-react";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { PlanBadge } from "@/components/plan-badge";
import { useAccount } from "@/components/plan-provider";
import { activatePlan } from "@/lib/plans.functions";
import { specialsOptions } from "@/lib/plans.queries";
import { specialIsFree, type PlanTier } from "@/lib/plans";
import { redeemPromotion } from "@/lib/developer.functions";
import { analyzeProject, readUploads } from "@/lib/analyze";
import { BASIC, LANG_FACTOR, PRO_RATE, TYPE_FACTOR, URGENCY_FACTOR, premiumPrice, type PremiumInput } from "@/lib/pricing";

export const Route = createFileRoute("/pricing")({
  loader: ({ context }) => context.queryClient.ensureQueryData(specialsOptions),
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
  const [scanning, setScanning] = useState(false);
  const [reasons, setReasons] = useState<string[]>([]);
  const { data: specials } = useSuspenseQuery(specialsOptions);
  const { user, ready, specialAccess, refreshAccess, developer } = useAccount();
  const free = specialIsFree(specials) || specialAccess;
  const [promo, setPromo] = useState("");
  const redeem = useServerFn(redeemPromotion);
  const redemption = useMutation({ mutationFn: () => redeem({ data: { code: promo } }), onSuccess: async () => { await refreshAccess(); setPromo(""); } });
  const activate = useServerFn(activatePlan);
  const mutation = useMutation({ mutationFn: (tier: PlanTier) => activate({ data: { tier } }), onSuccess: () => window.location.assign("/") });
  const choose = (tier: PlanTier) => {
    if (!ready || mutation.isPending) return;
    if (!user) { window.location.assign("/auth"); return; }
    mutation.mutate(tier);
  };
  const premium = premiumPrice(p);
  const set = <K extends keyof PremiumInput>(k: K, v: PremiumInput[K]) => setP((x) => ({ ...x, [k]: v }));

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground"><Wand2 className="h-5 w-5" /></div>
            <span className="font-display text-lg font-semibold">Lew<span className="text-destructive">Stappen</span></span>
          </Link>
          <div className="col-span-3 row-start-2 sm:col-span-1 sm:col-start-2 sm:row-start-1"><PlanBadge /></div>
          <div className="col-start-3 row-start-1 flex flex-wrap justify-end gap-2"><Button asChild variant="outline" size="sm"><Link to="/hardware">Hardware</Link></Button>{developer && <Button asChild variant="outline"><Link to="/developer">Developer</Link></Button>}<Button asChild variant="ghost"><Link to="/">Back to app</Link></Button></div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 pb-20">
        <section className="py-12 text-center">
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-destructive">// pricing</p>
          <h1 className="font-display text-4xl font-semibold tracking-tight md:text-5xl">Pick the plan that fits your code</h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">Demo only — no real payment is taken.</p>
          {specials?.is_active && <div className="mt-5 text-sm"><span className="inline-flex rounded-md bg-baby-red px-3 py-1 font-medium text-destructive">{specials.special_tag}</span><p className="mt-2 text-muted-foreground">{specials.promo_description}</p></div>}
        </section>
        {mutation.isError && <p role="alert" className="mb-5 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{mutation.error.message}</p>}
        {mutation.isPending && <p role="status" className="mb-5 flex items-center justify-center gap-2 text-sm text-primary"><Loader2 className="h-4 w-4 animate-spin" />Activating your plan…</p>}
        <form className="mx-auto mb-7 max-w-md" onSubmit={(e) => { e.preventDefault(); redemption.mutate(); }}>
          <label htmlFor="promo-code" className="mb-2 block text-sm font-medium">Promotion code</label>
          <div className="flex gap-2"><input id="promo-code" className="field min-w-0 flex-1" value={promo} onChange={(e) => setPromo(e.target.value)} maxLength={100} placeholder="Enter code" /><Button disabled={!user || !promo.trim() || redemption.isPending}>{redemption.isPending ? <Loader2 className="animate-spin" /> : <Check />}Apply</Button></div>
          {!user && <p className="mt-2 text-sm text-muted-foreground"><Link to="/auth" className="text-primary underline">Sign in</Link> to redeem a code.</p>}
          {redemption.isError && <p role="alert" className="mt-2 text-sm text-destructive">{redemption.error.message}</p>}
          {redemption.isSuccess && <p role="status" className="mt-2 text-sm text-primary">Promotion applied to your account. Choose your plan below.</p>}
        </form>

        <div className="grid gap-5 lg:grid-cols-3">
          <Plan name="Basic" price="Free" note={`${BASIC.trials} trials per user`} features={[`${BASIC.trials} free modernizations`, `Up to ${BASIC.maxLines} lines of code each`, "Diff and security audit"]}
            cta="Start free" disabled={!ready || mutation.isPending} onClick={() => choose("basic")} />
          <Plan name="Pro" price={usd(PRO_RATE)} note="per file, per hour" highlight features={["Fixed hourly rate per file", "No line limit", "Tests, .patch and .zip exports", "Saved history and presets"]}
            cta="Choose Pro" disabled={!ready || mutation.isPending || !free} onClick={() => choose("pro")}>
            <label className="mt-4 flex items-center justify-between text-sm">Files <input type="number" min={1} value={files} onChange={(e) => setFiles(Math.max(1, +e.target.value))} className="field w-24" /></label>
          </Plan>
          <Plan name="Premium" price={usd(premium)} note="one-time, per project" features={["Priced to your project", "Everything in Pro", "Priority support"]}
            cta="Buy Premium" disabled={!ready || mutation.isPending || !free} onClick={() => choose("premium")} />
        </div>
        <p className="mt-4 text-center text-sm text-muted-foreground">{free ? "Due today: $0.00 on every plan. No card required." : "Paid activation is unavailable. No payment will be taken."}{!user && " Sign in to activate your plan."}</p>

        <section className="mt-10 rounded-xl border border-border bg-card p-6 shadow-panel">
          <h2 className="font-display text-xl font-semibold">Premium project estimator</h2>
          <p className="mt-1 text-sm text-muted-foreground">Upload your project (files or a .zip) and we'll price it automatically.</p>
          <label className="mt-4 flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-primary/40 bg-accent/40 p-6 text-center hover:border-primary">
            {scanning ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <Upload className="h-6 w-6 text-primary" />}
            <span className="font-medium">{scanning ? "Reading your project…" : "Upload project files or a .zip"}</span>
            <input type="file" multiple className="hidden" onChange={async (e) => {
              const fl = e.target.files; if (!fl?.length) return;
              setScanning(true);
              try { const a = analyzeProject(await readUploads(fl)); setReasons(a.reasons); const { reasons: _r, ...rest } = a; setP({ ...rest, urgency: p.urgency }); }
              catch { setReasons(["Couldn't read that upload. Try a .zip or plain code files."]); }
              finally { setScanning(false); e.target.value = ""; }
            }} />
          </label>
          {reasons.length > 0 && (
            <ul className="mt-4 grid gap-1.5 text-sm sm:grid-cols-2">{reasons.map((r) => <li key={r} className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-primary" />{r}</li>)}</ul>
          )}
          <p className="mt-5 text-xs text-muted-foreground">Detected details (you can adjust them):</p>
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
    </div>
  );
}

function Plan({ name, price, note, features, cta, onClick, highlight, children, disabled }: { name: string; price: string; note: string; features: string[]; cta: string; onClick: () => void; highlight?: boolean; children?: React.ReactNode; disabled?: boolean }) {
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
      <Button onClick={onClick} disabled={disabled} variant={highlight ? "default" : "outline"} className="mt-6">{cta}</Button>
    </div>
  );
}

function Num({ label, v, on }: { label: string; v: number; on: (v: number) => void }) {
  return <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">{label}<input type="number" min={0} value={v} onChange={(e) => on(Math.max(0, +e.target.value))} className="field" /></label>;
}
function Sel({ label, v, opts, on }: { label: string; v: string; opts: string[]; on: (v: string) => void }) {
  return <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">{label}<select value={v} onChange={(e) => on(e.target.value)} className="field">{opts.map((o) => <option key={o}>{o}</option>)}</select></label>;
}

