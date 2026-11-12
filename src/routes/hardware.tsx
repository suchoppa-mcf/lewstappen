import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState, type FormEvent } from "react";
import { ArrowDown, ArrowRight, Check, Cpu, Loader2, HardDrive, House, Laptop, Monitor, Server, Wand2, Wrench } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { submitHardwareEnquiry } from "@/lib/hardware.functions";
import { hardwareEnquirySchema } from "@/lib/hardware";
import { Button } from "@/components/ui/button";
import { PlanBadge } from "@/components/plan-badge";
import hardwarePhoto from "@/assets/hardware-home-upgrade.jpg";

export const Route = createFileRoute("/hardware")({
  head: () => ({ meta: [
    { title: "At-home hardware upgrades — LewStappen" },
    { name: "description", content: "LewStappen at-home hardware upgrades for PCs, laptops, servers and other devices. Plan a compatible upgrade and prepare your visit enquiry." },
    { property: "og:title", content: "At-home hardware upgrades — LewStappen" },
    { property: "og:description", content: "Give your PC, laptop or server a new lease of life with hardware upgrades at your home." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: HardwarePage,
});

const devices = [
  { name: "Desktop / PC", icon: Monitor, copy: "More headroom for work, gaming and everything in between.", upgrades: "Memory · Graphics · Storage · Cooling" },
  { name: "Laptop", icon: Laptop, copy: "Keep the device you know. Upgrade what’s replaceable.", upgrades: "Compatible memory · SSDs · Batteries" },
  { name: "Server / NAS", icon: Server, copy: "Room to grow your home lab, storage or small-business setup.", upgrades: "Memory · Drives · Network adapters" },
  { name: "Other device", icon: Cpu, copy: "Have something else in mind? Tell us the model and your goal.", upgrades: "Workstations · Mini PCs · Custom setups" },
];

function HardwarePage() {
  const formRef = useRef<HTMLFormElement>(null);
  const [device, setDevice] = useState("Desktop / PC");
  const requestId = useRef<string | null>(null);
  const [validationError, setValidationError] = useState("");
  const sendEnquiry = useServerFn(submitHardwareEnquiry);
  const submission = useMutation({ mutationFn: (data: Parameters<typeof sendEnquiry>[0]["data"]) => sendEnquiry({ data }), onSuccess: () => { formRef.current?.reset(); setDevice("Desktop / PC"); requestId.current = null; } });
  const openEnquiry = (selection?: string) => {
    if (selection) setDevice(selection);
    formRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submission.isPending) return;
    const values = new FormData(event.currentTarget);
    requestId.current ??= crypto.randomUUID();
    const result = hardwareEnquirySchema.safeParse({ ...Object.fromEntries(values), id: requestId.current });
    setValidationError("");
    if (!result.success) { setValidationError(result.error.issues[0]?.message ?? "Check your enquiry details."); return; }
    submission.mutate(result.data);
  };

  return <div className="min-h-screen bg-background">
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-6">
        <Link to="/" className="flex items-center gap-3" aria-label="LewStappen home"><span className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground"><Wand2 className="h-5 w-5" /></span><span className="font-display text-lg font-semibold">Lew<span className="text-destructive">Stappen</span></span></Link>
        <div className="hidden lg:block"><PlanBadge /></div>
        <nav aria-label="Main navigation" className="flex flex-wrap items-center gap-1">
          <Button asChild variant="ghost" size="sm"><Link to="/">Software</Link></Button>
          <Button asChild variant="secondary" size="sm"><Link to="/hardware" aria-current="page">Hardware</Link></Button>
          <Button asChild variant="ghost" size="sm"><Link to="/pricing">Pricing</Link></Button>
        </nav>
      </div>
    </header>

    <main>
      <section className="relative isolate overflow-hidden bg-photo-shade text-photo-foreground">
        <img src={hardwarePhoto} width={1536} height={1024} alt="Technician installing memory in a desktop PC at a home desk" fetchPriority="high" className="absolute inset-0 -z-20 h-full w-full object-cover object-[65%_center] md:object-center" />
        <div className="absolute inset-0 -z-10 bg-photo-shade/65 md:bg-photo-shade/40" />
        <div className="mx-auto flex min-h-[520px] max-w-7xl items-center px-5 py-14 sm:px-6 md:min-h-[540px]">
          <div className="max-w-lg">
            <p className="mb-5 flex items-center gap-2 font-mono text-xs uppercase tracking-wider"><House className="h-4 w-4" /> LewStappen Hardware</p>
            <h1 className="font-display text-4xl font-semibold leading-tight md:text-5xl">Hardware upgrades.<br />Right at your home.</h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed">Your PC, laptop, server or next project. We come to you to give your hardware a new lease of life.</p>
            <Button size="lg" className="mt-7" onClick={() => openEnquiry()}>Plan my upgrade <ArrowDown /></Button>
            <p className="mt-4 text-sm">Visits subject to service-area and availability confirmation.</p>
          </div>
        </div>
      </section>

      <div className="border-b border-border bg-secondary">
        <div className="mx-auto grid max-w-7xl gap-4 px-5 py-5 text-sm sm:grid-cols-3 sm:px-6">
          {[{ icon: House, text: "At your home or workspace" }, { icon: Wrench, text: "Upgrades matched to your device" }, { icon: HardDrive, text: "Parts and labour quoted individually" }].map(({ icon: Icon, text }) => <p key={text} className="flex items-center gap-3"><Icon className="h-5 w-5 shrink-0 text-primary" />{text}</p>)}
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-6">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-3"><div><p className="mb-2 font-mono text-xs uppercase tracking-wider text-destructive">Keep the device. Upgrade the possibilities.</p><h2 className="font-display text-3xl font-semibold">What are we upgrading?</h2></div><p className="max-w-sm text-sm text-muted-foreground">Every upgrade starts with your model and what you want it to do better.</p></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {devices.map(({ name, icon: Icon, copy, upgrades }) => <article key={name} className="flex flex-col rounded-lg border border-border bg-card p-5">
            <Icon className="mb-6 h-8 w-8 text-primary" strokeWidth={1.5} /><h3 className="font-display text-xl font-semibold">{name}</h3><p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{copy}</p><p className="mt-5 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">{upgrades}</p><Button variant="link" className="mt-3 justify-start px-0" onClick={() => openEnquiry(name)}>Explore an upgrade <ArrowRight /></Button>
          </article>)}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">Upgrade options depend on the device. Some parts are soldered or not replaceable.</p>
      </section>

      <section className="border-y border-border bg-muted">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6"><h2 className="font-display text-2xl font-semibold">From your setup to your next upgrade.</h2><div className="mt-7 grid gap-7 md:grid-cols-3">
          {[{ title: "Tell us about your device", text: "Share the make, model and what’s slowing you down." }, { title: "Agree on the right upgrade", text: "Compatibility, parts, costs and visit availability are confirmed before any work is agreed." }, { title: "We come to you", text: "The agreed hardware is installed at your location, followed by a check of the upgraded device." }].map(({ title, text }, i) => <div key={title}><span className="font-mono text-sm text-destructive">0{i + 1}</span><h3 className="mt-3 font-display text-lg font-semibold">{title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p></div>)}
        </div></div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-6 lg:grid-cols-[1fr_1.3fr]">
        <div><p className="mb-3 font-mono text-xs uppercase tracking-wider text-primary">Let’s talk hardware</p><h2 className="font-display text-3xl font-semibold">Your upgrade starts here.</h2><p className="mt-4 max-w-sm text-muted-foreground">Tell us about your setup and the upgrade you have in mind.</p><div className="mt-6 border-l-2 border-primary pl-4 text-sm leading-relaxed text-muted-foreground"><p className="font-medium text-foreground">Send your enquiry to the LewStappen team.</p><p className="mt-2">Your request is sent privately for review. A visit is only booked once availability, location and the work are agreed.</p></div><p className="mt-6 text-sm text-muted-foreground">Hardware services are quoted separately from software plans. No payment details are needed here.</p></div>
        <form ref={formRef} onSubmit={submit} onChange={() => { submission.reset(); setValidationError(""); }} className="scroll-mt-6 space-y-5">
          <div className="hidden" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
          <fieldset disabled={submission.isPending} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-medium">Your name<input name="name" required maxLength={100} autoComplete="name" className="field mt-2 w-full" placeholder="Full name" /></label>
            <label className="block text-sm font-medium">Email<input name="email" type="email" required maxLength={254} autoComplete="email" className="field mt-2 w-full" placeholder="you@example.com" /></label>
            <label className="block text-sm font-medium">City / postal code<input name="area" required maxLength={150} className="field mt-2 w-full" placeholder="No full address needed yet" /></label>
            <label className="block text-sm font-medium">Device type<select name="device" value={device} onChange={(event) => setDevice(event.target.value)} className="field mt-2 w-full">{devices.map(({ name }) => <option key={name}>{name}</option>)}</select></label>
          </div>
          <label className="block text-sm font-medium">Make / model<input name="model" maxLength={200} className="field mt-2 w-full" placeholder="e.g. Dell OptiPlex 7060, or not sure" /></label>
          <label className="block text-sm font-medium">What would you like to improve?<textarea name="goals" required maxLength={2000} rows={3} className="field mt-2 w-full resize-y" placeholder="More storage, faster gaming, extra server memory…" /></label>
          <label className="block text-sm font-medium">Anything else? <span className="font-normal text-muted-foreground">(optional)</span><textarea name="details" maxLength={2000} rows={2} className="field mt-2 w-full resize-y" placeholder="Current specifications, parts you already have, or questions" /></label>
          <Button type="submit" size="lg" disabled={submission.isPending}>{submission.isPending ? <><Loader2 className="animate-spin" />Sending enquiry…</> : <>Send visit enquiry <ArrowRight /></>}</Button>
          </fieldset>
          {(validationError || submission.isError) && <p role="alert" className="text-sm text-destructive">{validationError || submission.error?.message}</p>}
          {submission.isSuccess && <div className="border-t border-border pt-5" role="status"><p className="flex items-center gap-2 font-medium text-primary"><Check className="h-4 w-4" />Your enquiry has been sent</p><p className="mt-2 text-sm text-muted-foreground">The LewStappen team can now review your request. No visit is booked and no payment has been taken.</p></div>}
        </form>
      </section>
    </main>
    <footer className="border-t border-border"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-sm sm:px-6"><span className="font-display font-semibold">Lew<span className="text-destructive">Stappen</span> <span className="ml-2 font-sans font-normal text-muted-foreground">Software & hardware</span></span><Button asChild variant="link"><Link to="/">Back to software <ArrowRight /></Link></Button></div></footer>
  </div>;
}