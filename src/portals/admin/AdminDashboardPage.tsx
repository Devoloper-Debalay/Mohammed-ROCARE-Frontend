import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { adminApi } from "@/lib/apiClient";

interface PendingVendor {
  id: string;
  fullName: string;
  role: string;
  phone: string;
  city?: string;
}

export function AdminDashboardPage() {
  const [report, setReport] = useState<Record<string, unknown> | null>(null);
  const [pending, setPending] = useState<PendingVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = () => {
    Promise.allSettled([adminApi.get("/admin/dashboard"), adminApi.get("/admin/vendors/pending")]).then(([r, p]) => {
      if (r.status === "fulfilled") setReport(r.value.data?.data ?? null);
      if (p.status === "fulfilled") setPending(p.value.data?.data ?? []);
      setLoading(false);
    });
  };

  useEffect(load, []);

  const decide = async (vendorId: string, approved: boolean) => {
    setActingId(vendorId);
    try {
      await adminApi.patch(`/admin/vendors/${vendorId}/verify`, { approved });
      load();
    } finally {
      setActingId(null);
    }
  };

  const metrics = report ? Object.entries(report).filter(([, v]) => typeof v === "number" || typeof v === "string") : [];

  return (
    <div>
      <PageHeader eyebrow="Overview" title="Branch overview" description="Vendor verification queue and today's activity." />

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-card bg-ink/[0.04]" />
          ))}
        </div>
      ) : metrics.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {metrics.slice(0, 6).map(([key, value]) => (
            <Card key={key} className="p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-ink-soft/60">{key.replaceAll(/([A-Z])/g, " $1")}</p>
              <p className="mt-2 font-mono text-2xl font-semibold text-ink">{String(value)}</p>
            </Card>
          ))}
        </div>
      ) : null}

      <Card className="mt-6 p-6">
        <p className="mb-4 font-display text-lg font-semibold text-ink">Pending vendor verification</p>
        {loading ? (
          <div className="h-24 animate-pulse rounded-xl bg-ink/[0.04]" />
        ) : pending.length === 0 ? (
          <p className="text-sm text-ink-soft/70">No vendors waiting on verification.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {pending.map((v) => (
              <div key={v.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-base px-4 py-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-ink">{v.fullName}</p>
                    <Badge tone="slate">{v.role}</Badge>
                  </div>
                  <p className="text-sm text-ink-soft/60">{v.phone} · {v.city ?? "City not set"}</p>
                </div>
                <div className="flex gap-2">
                  <Button accent="slate" variant="secondary" loading={actingId === v.id} onClick={() => decide(v.id, false)}>
                    Reject
                  </Button>
                  <Button accent="slate" loading={actingId === v.id} onClick={() => decide(v.id, true)}>
                    Approve
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
