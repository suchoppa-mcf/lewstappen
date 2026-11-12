import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Activity, Check, Loader2, RefreshCw, Save, Search, ShieldCheck, Trash2, Users, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAccount } from "@/components/plan-provider";
import { getDeveloperDashboard, manageDeveloperSpecials, updateDeveloperAccount } from "@/lib/developer.functions";
import type { DirectoryUser } from "@/lib/developer";
import { HardwareEnquiries } from "@/components/hardware-enquiries";

export const Route = createFileRoute("/_authenticated/developer")({
  head: () => ({ meta: [
    { title: "Developer — LewStappen" }, { name: "description", content: "Private LewStappen account, usage and promotion management." },
    { property: "og:title", content: "Developer — LewStappen" }, { property: "og:description", content: "LewStappen developer account management." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex,nofollow" },
  ] }),
  component: Developer,
});

function Developer() {
  const fetchDashboard = useServerFn(getDeveloperDashboard);
  const saveSpecials = useServerFn(manageDeveloperSpecials);
  const client = useQueryClient();
  const { user, refreshPlan, refreshAccess } = useAccount();
  const query = useQuery({ queryKey: ["developer-dashboard", user?.id], queryFn: () => fetchDashboard() });
  const [search, setSearch] = useState("");
  const [tier, setTier] = useState("all");
  const [email, setEmail] = useState("");
  const refresh = async () => { await Promise.all([client.invalidateQueries({ queryKey: ["developer-dashboard"] }), client.invalidateQueries({ queryKey: ["pricing-specials"] }), refreshPlan(), refreshAccess()]); };
  const manage = useMutation({ mutationFn: (data: Parameters<typeof saveSpecials>[0]["data"]) => saveSpecials({ data }), onSuccess: refresh });
  const data = query.data;
  return <div className="min-h-screen bg-background">
    <header className="border-b border-border"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
      <Link to="/" className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground"><Wand2 className="h-5 w-5" /></span><span className="font-display text-lg font-semibold">Lew<span className="text-destructive">Stappen</span></span></Link>
      <div className="flex items-center gap-2"><span className="flex items-center gap-2 text-sm text-primary"><ShieldCheck className="h-4 w-4" />Developer</span><Button asChild variant="outline"><Link to="/">Back to app</Link></Button></div>
    </div></header>
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between gap-4"><div><p className="mb-2 font-mono text-xs uppercase text-primary">Control room</p><h1 className="font-display text-3xl font-semibold">Developer dashboard</h1></div><Button variant="outline" size="icon" title="Refresh dashboard" aria-label="Refresh dashboard" onClick={() => query.refetch()}><RefreshCw className={query.isFetching ? "animate-spin" : ""} /></Button></div>
      {query.isPending && <p role="status" className="flex gap-2 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />Loading account data…</p>}
      {query.isError && <p role="alert" className="bg-baby-red p-4 text-destructive">{query.error.message}</p>}
      {data && <>
        <HardwareEnquiries />
        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Registered users" value={data.totalUsers} icon={<Users className="h-4 w-4" />} />
          <Metric label="Completed updates" value={data.totalUses} icon={<Activity className="h-4 w-4" />} />
          <Metric label="Pro / Premium" value={data.users.filter((u) => u.tier !== "basic").length} icon={<ShieldCheck className="h-4 w-4" />} />
          <Metric label="Active promotions" value={data.promos.filter((p) => p.is_active && (!p.expires_at || new Date(p.expires_at) > new Date())).length} icon={<Check className="h-4 w-4" />} />
        </div>
        <section className="border-t border-border py-8">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4"><div><h2 className="font-display text-xl font-semibold">User directory</h2><p className="mt-1 text-sm text-muted-foreground">{["basic", "pro", "premium"].map((t) => `${data.users.filter((u) => u.tier === t).length} ${t}`).join(" · ")}</p></div><div className="flex flex-wrap gap-2"><label className="flex items-center gap-2"><Search className="h-4 w-4 text-muted-foreground" /><input aria-label="Search users" className="field" placeholder="Search by email" value={search} onChange={(e) => setSearch(e.target.value)} /></label><select aria-label="Filter membership" className="field" value={tier} onChange={(e) => setTier(e.target.value)}><option value="all">All memberships</option>{["basic", "pro", "premium"].map((t) => <option key={t} value={t}>{t}</option>)}</select></div></div>
          <div className="overflow-x-auto"><table className="w-full border-collapse text-left text-sm"><thead className="bg-muted text-xs text-muted-foreground"><tr>{["Account", "Membership", "Uses", "Basic trials", "Special access", "Activity", "Actions"].map((h) => <th key={h} className="px-3 py-3 font-medium">{h}</th>)}</tr></thead><tbody>{data.users.filter((u) => (u.email ?? "").toLowerCase().includes(search.toLowerCase()) && (tier === "all" || u.tier === tier)).map((u) => <UserRow key={`${u.id}-${u.tier}-${u.has_special_access}-${u.trials_used}`} user={u} onSaved={refresh} />)}</tbody></table></div>
          {!data.users.some((u) => (u.email ?? "").toLowerCase().includes(search.toLowerCase()) && (tier === "all" || u.tier === tier)) && <p className="py-6 text-sm text-muted-foreground">No matching accounts.</p>}
        </section>
        <section className="grid gap-10 border-t border-border py-8 lg:grid-cols-2">
          <div><h2 className="mb-5 font-display text-xl font-semibold">Site-wide special</h2><form className="space-y-4" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); manage.mutate({ kind: "settings", tag: String(f.get("tag")), description: String(f.get("description")), active: f.has("active"), allFree: f.has("free") }); }}>
            <label className="block text-sm">Special tag<input name="tag" aria-label="Special tag" className="field mt-2 w-full" required maxLength={100} defaultValue={data.settings.special_tag} /></label>
            <label className="block text-sm">Promotion description<textarea name="description" aria-label="Promotion description" className="field mt-2 w-full" maxLength={500} defaultValue={data.settings.promo_description} /></label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={data.settings.is_active} />Show the special</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="free" defaultChecked={data.settings.all_plans_free} />Free activation for everyone</label>
            <Button disabled={manage.isPending}><Save />Save special</Button>
          </form></div>
          <div><h2 className="mb-5 font-display text-xl font-semibold">Email whitelist</h2><form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); manage.mutate({ kind: "whitelist", email, remove: false }); }}><input aria-label="Whitelist email" type="email" required className="field min-w-0 flex-1" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} /><Button disabled={manage.isPending}><Check />Add</Button></form><ul className="mt-4 divide-y divide-border">{data.whitelist.map((w) => <li key={w.email} className="flex items-center justify-between gap-3 py-3"><span className="break-all text-sm">{w.email}</span><Button size="icon" variant="ghost" aria-label={`Remove ${w.email}`} title="Remove from whitelist" disabled={manage.isPending} onClick={() => manage.mutate({ kind: "whitelist", email: w.email, remove: true })}><Trash2 /></Button></li>)}</ul>{!data.whitelist.length && <p className="mt-4 text-sm text-muted-foreground">No whitelisted emails.</p>}</div>
        </section>
        <section className="border-t border-border py-8"><h2 className="mb-5 font-display text-xl font-semibold">Promotion codes</h2><div className="grid gap-4 md:grid-cols-2">{data.promos.map((p) => <form key={p.code} className="rounded-lg border border-border p-5" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); const expires = String(f.get("expires") ?? ""); const limit = String(f.get("limit") ?? ""); manage.mutate({ kind: "promo", code: p.code, active: f.has("active"), expires: expires ? new Date(expires).toISOString() : null, maxUses: limit ? Number(limit) : null }); }}><div className="mb-4 flex items-center justify-between"><h3 className="font-mono font-semibold">{p.code}</h3><span className="text-sm text-muted-foreground">{p.uses} redemptions</span></div><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm">Expiry<input aria-label={`${p.code} expiry`} type="datetime-local" name="expires" className="field mt-2 w-full" defaultValue={p.expires_at ? new Date(new Date(p.expires_at).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0,16) : ""} /></label><label className="text-sm">Redemption limit<input aria-label={`${p.code} limit`} type="number" min={1} name="limit" placeholder="Unlimited" className="field mt-2 w-full" defaultValue={p.max_uses ?? ""} /></label></div><div className="mt-4 flex items-center justify-between"><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={p.is_active} />Active</label><Button variant="outline" disabled={manage.isPending}><Save />Save code</Button></div></form>)}</div></section>
        {manage.isError && <p role="alert" className="text-sm text-destructive">{manage.error.message}</p>}{manage.isSuccess && <p role="status" className="text-sm text-primary">Changes saved.</p>}
      </>}
    </main>
  </div>;
}
function Metric({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return <div className="rounded-lg border border-border p-5"><div className="mb-3 flex items-center justify-between gap-3 text-sm text-muted-foreground">{label}<span className="text-primary">{icon}</span></div><p className="font-display text-3xl font-semibold">{value.toLocaleString()}</p></div>;
}
function UserRow({ user, onSaved }: { user: DirectoryUser; onSaved: () => Promise<unknown> }) {
  const update = useServerFn(updateDeveloperAccount);
  const [tier, setTier] = useState(user.tier);
  const [special, setSpecial] = useState(user.has_special_access);
  const mutation = useMutation({ mutationFn: (resetTrials: boolean) => update({ data: { accountId: user.id, tier, specialAccess: special, resetTrials } }), onSuccess: onSaved });
  return <tr className="border-b border-border"><td className="px-3 py-4"><p className="max-w-64 break-all font-medium">{user.email ?? "No email"}</p><p className="mt-1 text-xs text-muted-foreground">Joined {new Date(user.created_at).toLocaleDateString()} · {user.email_confirmed_at ? "Verified" : "Unverified"}</p></td><td className="px-3 py-4"><select aria-label={`Membership for ${user.email}`} className="field" value={tier} onChange={(e) => { const v = e.target.value; if (v === "basic" || v === "pro" || v === "premium") setTier(v); }}>{["basic", "pro", "premium"].map((t) => <option key={t}>{t}</option>)}</select></td><td className="px-3 py-4 font-mono">{user.uses}</td><td className="px-3 py-4 font-mono">{user.trials_used}/3</td><td className="px-3 py-4"><input type="checkbox" aria-label={`Special access for ${user.email}`} checked={special} onChange={(e) => setSpecial(e.target.checked)} /></td><td className="px-3 py-4 text-xs text-muted-foreground">{user.last_use ? new Date(user.last_use).toLocaleString() : "No updates yet"}</td><td className="px-3 py-4"><div className="flex gap-2"><Button size="icon" variant="outline" aria-label={`Save ${user.email}`} title="Save account" disabled={mutation.isPending} onClick={() => mutation.mutate(false)}><Save /></Button><Button size="icon" variant="ghost" aria-label={`Reset trials for ${user.email}`} title="Reset Basic trials" disabled={mutation.isPending} onClick={() => { if (window.confirm(`Reset Basic trials for ${user.email}?`)) mutation.mutate(true); }}><RefreshCw /></Button></div>{mutation.isError && <p role="alert" className="mt-2 text-xs text-destructive">{mutation.error.message}</p>}</td></tr>;
}