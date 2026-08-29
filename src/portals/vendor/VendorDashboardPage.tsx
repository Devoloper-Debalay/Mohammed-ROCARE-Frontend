import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { vendorApi } from "@/lib/apiClient";
import { useVendorAuth } from "@/store/authStore";

interface Wallet {
  balance: string;
}

interface Lead {
  id: string;
  customerName: string;
  area?: string;
  serviceType?: string;
  status: string;
}

const leadStatusTone: Record<string, "gold" | "teal" | "success" | "danger" | "neutral"> = {
  NEW: "gold",
  ACCEPTED: "teal",
  ONGOING: "teal",
  PENDING_START_VERIFICATION: "gold",
  PENDING_DENIAL_VERIFICATION: "gold",
  COMPLETED: "success",
  DENIED: "danger",
};

export function VendorDashboardPage() {
  const user = useVendorAuth((s) => s.user);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([vendorApi.get("/vendor/wallet"), vendorApi.get("/vendor/leads")]).then(([w, l]) => {
      if (w.status === "fulfilled") setWallet(w.value.data?.data ?? null);
      if (l.status === "fulfilled") setLeads((l.value.data?.data ?? []).slice(0, 5));
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <PageHeader
        eyebrow="Overview"
        title={`Welcome back, ${user?.fullName?.split(" ")[0] ?? "there"}`}
        description="Your leads, wallet and verification status at a glance."
        action={
          <Link to="/vendor/leads">
            <Button accent="orange">View all leads</Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-soft/60">Wallet balance</p>
          <p className="mt-2 font-mono text-3xl font-semibold text-ink">{loading ? "—" : `₹${wallet?.balance ?? "0"}`}</p>
          <Link to="/vendor/wallet" className="mt-3 inline-block text-sm font-semibold text-orange-deep">
            Recharge
          </Link>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-soft/60">Active leads</p>
          <p className="mt-2 font-display text-3xl font-semibold text-ink">{loading ? "—" : leads.length}</p>
          <Link to="/vendor/leads" className="mt-3 inline-block text-sm font-semibold text-orange-deep">
            Manage
          </Link>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-soft/60">Verification</p>
          <p className="mt-2 font-display text-lg font-semibold text-ink">{user?.verificationStatus ?? "—"}</p>
          <Link to="/vendor/profile" className="mt-3 inline-block text-sm font-semibold text-orange-deep">
            View profile
          </Link>
        </Card>
      </div>

      <Card className="mt-6 p-6">
        <p className="mb-4 font-display text-lg font-semibold text-ink">Recent leads</p>
        {loading ? (
          <div className="h-24 animate-pulse rounded-xl bg-ink/[0.04]" />
        ) : leads.length === 0 ? (
          <p className="text-sm text-ink-soft/70">No leads assigned yet. New leads will appear here as they come in.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {leads.map((lead) => (
              <div key={lead.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-base px-4 py-3">
                <div>
                  <p className="font-medium text-ink">{lead.customerName}</p>
                  <p className="text-sm text-ink-soft/60">{lead.serviceType ?? "Service"} · {lead.area ?? "Area not shared"}</p>
                </div>
                <Badge tone={leadStatusTone[lead.status] ?? "neutral"}>{lead.status.replaceAll("_", " ")}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
