import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { vendorApi } from "@/lib/apiClient";

interface Lead {
  id: string;
  customerName: string;
  area?: string;
  serviceType?: string;
  issue?: string;
  status: string;
  leadAcceptanceCharge?: string;
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

export function VendorLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = () => {
    vendorApi
      .get("/vendor/leads")
      .then((res) => setLeads(res.data?.data ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const accept = async (leadId: string) => {
    setActingId(leadId);
    setError("");
    try {
      await vendorApi.post(`/vendor/leads/${leadId}/accept`);
      load();
    } catch {
      setError("Couldn't accept that lead — check your wallet balance.");
    } finally {
      setActingId(null);
    }
  };

  return (
    <div>
      <PageHeader eyebrow="Pipeline" title="Leads" description="New leads cost coins to accept — check your wallet balance first." />

      {error && <div className="mb-4 rounded-xl bg-danger/10 px-4 py-2.5 text-sm font-medium text-danger">{error}</div>}

      {loading ? (
        <div className="h-40 animate-pulse rounded-card bg-ink/[0.04]" />
      ) : leads.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="font-display text-lg font-semibold text-ink">No leads right now</p>
          <p className="mt-1 text-sm text-ink-soft/70">New leads in your area will show up here.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {leads.map((lead) => (
            <Card key={lead.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-ink">{lead.customerName}</p>
                  <Badge tone={leadStatusTone[lead.status] ?? "neutral"}>{lead.status.replaceAll("_", " ")}</Badge>
                </div>
                <p className="mt-1 text-sm text-ink-soft/70">{lead.serviceType ?? "Service"} · {lead.area ?? "Area not shared"}</p>
                {lead.issue && <p className="mt-1 text-sm text-ink-soft/60">{lead.issue}</p>}
              </div>
              <div className="flex items-center gap-3">
                {lead.leadAcceptanceCharge && (
                  <span className="font-mono text-sm text-ink-soft/70">{lead.leadAcceptanceCharge} coins</span>
                )}
                {lead.status === "NEW" && (
                  <Button accent="orange" loading={actingId === lead.id} onClick={() => accept(lead.id)}>
                    Accept
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
