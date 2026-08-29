import { Link } from "react-router-dom";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StageRing } from "@/components/ui/StageRing";

const pipeline = ["Requested", "Assigned", "In progress", "Completed"];

const portals = [
  {
    key: "customer",
    title: "Book a service",
    desc: "Order RO, AC and geyser products, or raise a service request and track it stage by stage.",
    to: "/customer/login",
    accent: "teal" as const,
    icon: "C",
  },
  {
    key: "vendor",
    title: "Vendor & technician",
    desc: "Accept leads, manage your wallet, and get paid for completed jobs.",
    to: "/vendor/login",
    accent: "orange" as const,
    icon: "V",
  },
  {
    key: "staff",
    title: "Admin & operations",
    desc: "Run branches, review vendors, and oversee the platform end to end.",
    to: "/staff/login",
    accent: "slate" as const,
    icon: "A",
  },
];

const accentClasses = {
  teal: { ring: "var(--color-teal)", bg: "bg-teal-tint", text: "text-teal-deep", dot: "bg-teal" },
  orange: { ring: "var(--color-orange)", bg: "bg-orange-tint", text: "text-orange-deep", dot: "bg-orange" },
  slate: { ring: "var(--color-slate)", bg: "bg-slate-tint", text: "text-slate-deep", dot: "bg-slate" },
};

export function LandingPage() {
  return (
    <div className="min-h-screen bg-base">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 sm:px-10">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm font-medium text-ink-soft sm:flex">
          <a href="#pipeline" className="hover:text-ink">How it works</a>
          <a href="#portals" className="hover:text-ink">Portals</a>
        </nav>
        <Link to="/customer/login">
          <Button accent="teal" variant="secondary">Sign in</Button>
        </Link>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 py-16 sm:px-10 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
        <div>
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-teal-tint px-3 py-1 text-xs font-semibold uppercase tracking-widest text-teal-deep">
            <span className="h-1.5 w-1.5 rounded-full bg-teal" /> Live service pipeline
          </p>
          <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-6xl">
            Every water purifier,
            <br />
            tracked stage by stage.
          </h1>
          <p className="mt-6 max-w-lg text-base text-ink-soft/90 sm:text-lg">
            ROCARE runs the full loop from sale to service — request, assign a technician, work the job, close it out — with one pipeline everyone can see their part of.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/customer/signup">
              <Button accent="teal" className="!px-7 !py-3 !text-base">Book a service</Button>
            </Link>
            <Link to="/vendor/signup">
              <Button accent="orange" variant="secondary" className="!px-7 !py-3 !text-base">Join as a vendor</Button>
            </Link>
          </div>
          <div className="mt-12 flex items-center gap-8 border-t border-ink/[0.08] pt-6">
            <div>
              <p className="font-display text-2xl font-semibold text-ink">RO · AC · Geyser</p>
              <p className="text-xs text-ink-soft/70">Products &amp; on-site service</p>
            </div>
            <div className="h-8 w-px bg-ink/10" />
            <div>
              <p className="font-display text-2xl font-semibold text-ink">4 stages</p>
              <p className="text-xs text-ink-soft/70">Requested to completed</p>
            </div>
          </div>
        </div>

        <div className="flex justify-center lg:justify-end">
          <Card className="w-full max-w-sm p-8">
            <p className="mb-6 text-center text-xs font-semibold uppercase tracking-widest text-ink-soft/60">Sample service request</p>
            <div className="flex justify-center">
              <StageRing stages={pipeline} activeIndex={2} size={200} centerLabel="Stage 3/4" centerSub="Technician on site" />
            </div>
            <div className="mt-6 flex items-center justify-between rounded-xl bg-base px-4 py-3">
              <span className="font-mono text-xs text-ink-soft/70">SR-2026-08114</span>
              <span className="rounded-full bg-teal-tint px-2.5 py-0.5 text-xs font-semibold text-teal-deep">In progress</span>
            </div>
          </Card>
        </div>
      </section>

      {/* Pipeline explainer */}
      <section id="pipeline" className="border-y border-ink/[0.06] bg-surface py-16">
        <div className="mx-auto max-w-6xl px-6 sm:px-10">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-ink-soft/60">The pipeline</p>
          <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">One status system, three portals watching it</h2>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {pipeline.map((stage, i) => (
              <div key={stage} className="rounded-card border border-ink/[0.06] bg-base p-5">
                <span className="font-mono text-xs text-ink-soft/50">Stage {i + 1}</span>
                <p className="mt-2 font-display text-lg font-semibold text-ink">{stage}</p>
                <p className="mt-1.5 text-sm text-ink-soft/70">
                  {i === 0 && "A customer books a service or the lead comes in."}
                  {i === 1 && "A technician accepts and is assigned to the job."}
                  {i === 2 && "Work starts on-site with proof captured for admin."}
                  {i === 3 && "Admin verifies and the job closes for everyone."}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Portals */}
      <section id="portals" className="mx-auto max-w-6xl px-6 py-16 sm:px-10">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-ink-soft/60">Sign in</p>
        <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">Pick your portal</h2>
        <p className="mt-2 max-w-xl text-sm text-ink-soft/70">
          Each portal is separate on purpose — customers, vendors, and staff each see only what's theirs.
        </p>
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {portals.map((p) => {
            const a = accentClasses[p.accent];
            return (
              <Link key={p.key} to={p.to}>
                <Card className="group h-full p-6 transition-shadow hover:shadow-[0_1px_2px_rgba(14,42,43,0.06),0_16px_32px_-16px_rgba(14,42,43,0.22)]">
                  <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${a.bg} font-display font-semibold ${a.text}`}>
                    {p.icon}
                  </div>
                  <h3 className="mt-4 font-display text-lg font-semibold text-ink">{p.title}</h3>
                  <p className="mt-1.5 text-sm text-ink-soft/70">{p.desc}</p>
                  <span className={`mt-4 inline-flex items-center gap-1 text-sm font-semibold ${a.text}`}>
                    Continue
                    <span className="transition-transform group-hover:translate-x-0.5">→</span>
                  </span>
                </Card>
              </Link>
            );
          })}
        </div>
        <p className="mt-6 text-center text-xs text-ink-soft/50">
          Platform operator?{" "}
          <Link to="/staff/login" className="font-semibold text-ink-soft underline underline-offset-2">
            Sign in here
          </Link>{" "}
          — super-admin access is granted by role after login.
        </p>
      </section>

      <footer className="border-t border-ink/[0.06] py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row sm:px-10">
          <Logo size={22} />
          <p className="text-xs text-ink-soft/60">© {new Date().getFullYear()} ROCARE. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
