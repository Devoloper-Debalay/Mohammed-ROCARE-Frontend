import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { adminApi, unwrapList } from "@/lib/apiClient";

interface Lead {
  id: string;
  customerName: string;
  status: string;
  area?: string;
}

interface Proof {
  id: string;
  leadId: string;
  imageUrl?: string;
  reason?: string;
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

export function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [startProofs, setStartProofs] = useState<Proof[]>([]);
  const [denialProofs, setDenialProofs] = useState<Proof[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    Promise.allSettled([
      adminApi.get("/admin/leads"),
      adminApi.get("/admin/leads/start-proofs/pending"),
      adminApi.get("/admin/leads/denial-proofs/pending"),
    ]).then(([l, s, d]) => {
      if (l.status === "fulfilled") setLeads(unwrapList<Lead>(l.value.data?.data ?? l.value.data));
      if (s.status === "fulfilled") setStartProofs(unwrapList<Proof>(s.value.data?.data ?? s.value.data));
      if (d.status === "fulfilled") setDenialProofs(unwrapList<Proof>(d.value.data?.data ?? d.value.data));
      setLoading(false);
    });
  };

  useEffect(load, []);

  const review = async (kind: "start" | "denial", proofId: string, approved: boolean) => {
    setActingId(proofId);
    try {
      await adminApi.post(`/admin/leads/${kind}-proofs/${proofId}/review`, { approved });
      load();
    } finally {
      setActingId(null);
    }
  };

  return (
    <div>
      <PageHeader eyebrow="Pipeline" title="Leads" description="Branch-wide lead pipeline and proof verification queue." />

      {(startProofs.length > 0 || denialProofs.length > 0) && (
        <Card className="mb-6 p-6">
          <p className="mb-4 font-display text-lg font-semibold text-ink">Awaiting your review</p>
          <div className="flex flex-col gap-3">
            {startProofs.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-base px-4 py-3">
                <div>
                  <p className="font-medium text-ink">Start-of-work proof</p>
                  <p className="text-xs text-ink-soft/50">Lead #{p.leadId.slice(0, 8)}</p>
                </div>
                <div className="flex gap-2">
                  <Button accent="slate" variant="secondary" loading={actingId === p.id} onClick={() => review("start", p.id, false)}>
                    Reject
                  </Button>
                  <Button accent="slate" loading={actingId === p.id} onClick={() => review("start", p.id, true)}>
                    Approve
                  </Button>
                </div>
              </div>
            ))}
            {denialProofs.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-base px-4 py-3">
                <div>
                  <p className="font-medium text-ink">Denial proof{p.reason ? ` — ${p.reason}` : ""}</p>
                  <p className="text-xs text-ink-soft/50">Lead #{p.leadId.slice(0, 8)}</p>
                </div>
                <div className="flex gap-2">
                  <Button accent="slate" variant="secondary" loading={actingId === p.id} onClick={() => review("denial", p.id, false)}>
                    Reject
                  </Button>
                  <Button accent="slate" loading={actingId === p.id} onClick={() => review("denial", p.id, true)}>
                    Approve
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-6">
        <p className="mb-4 font-display text-lg font-semibold text-ink">All leads</p>
        {loading ? (
          <div className="h-32 animate-pulse rounded-xl bg-ink/[0.04]" />
        ) : leads.length === 0 ? (
          <p className="text-sm text-ink-soft/70">No leads yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {leads.map((l) => (
              <div key={l.id} className="flex items-center justify-between rounded-xl bg-base px-4 py-3 text-sm">
                <div>
                  <p className="font-medium text-ink">{l.customerName}</p>
                  <p className="text-ink-soft/50">{l.area ?? "Area not shared"}</p>
                </div>
                <Badge tone={leadStatusTone[l.status] ?? "neutral"}>{l.status.replaceAll("_", " ")}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
