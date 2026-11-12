import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, RefreshCw, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAccount } from "@/components/plan-provider";
import { getHardwareEnquiries } from "@/lib/hardware.functions";

export function HardwareEnquiries() {
  const { user } = useAccount();
  const fetchEnquiries = useServerFn(getHardwareEnquiries);
  const query = useQuery({ queryKey: ["hardware-enquiries", user?.id], queryFn: () => fetchEnquiries() });
  return <section className="border-t border-border py-8" aria-labelledby="hardware-heading">
    <div className="mb-6 flex items-center justify-between gap-4"><div><h2 id="hardware-heading" className="flex items-center gap-2 font-display text-xl font-semibold"><Wrench className="h-5 w-5 text-primary" />Hardware</h2><p className="mt-1 text-sm text-muted-foreground">{query.data ? `${query.data.length} enquiries` : "Visit enquiries"}</p></div><Button size="icon" variant="outline" aria-label="Refresh hardware enquiries" title="Refresh hardware enquiries" disabled={query.isFetching} onClick={() => query.refetch()}><RefreshCw className={query.isFetching ? "animate-spin" : ""} /></Button></div>
    {query.isPending && <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading enquiries…</p>}
    {query.isError && <p role="alert" className="text-sm text-destructive">{query.error.message}</p>}
    {query.data?.length === 0 && <p className="text-sm text-muted-foreground">No hardware enquiries yet.</p>}
    <div className="grid gap-4 lg:grid-cols-2">{query.data?.map((enquiry) => <article key={enquiry.id} className="min-w-0 rounded-lg border border-border p-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="break-words font-display text-lg font-semibold">{enquiry.name}</h3><a href={`mailto:${enquiry.email}`} className="break-all text-sm text-primary underline">{enquiry.email}</a></div><span className="rounded-md bg-secondary px-2 py-1 text-xs text-secondary-foreground">{enquiry.device}</span></div>
      <dl className="mt-4 space-y-3 text-sm"><div><dt className="text-xs text-muted-foreground">Location</dt><dd className="break-words">{enquiry.area}</dd></div><div><dt className="text-xs text-muted-foreground">Make / model</dt><dd className="break-words">{enquiry.model || "Not provided"}</dd></div><div><dt className="text-xs text-muted-foreground">Upgrade goals</dt><dd className="whitespace-pre-wrap break-words">{enquiry.goals}</dd></div>{enquiry.details && <div><dt className="text-xs text-muted-foreground">Additional details</dt><dd className="whitespace-pre-wrap break-words">{enquiry.details}</dd></div>}</dl><p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">Received {new Date(enquiry.created_at).toLocaleString()}</p>
    </article>)}</div>
  </section>;
}