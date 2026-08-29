import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { adminApi, unwrapList } from "@/lib/apiClient";

interface Vendor {
  id: string;
  fullName: string;
  role: string;
  phone: string;
  vendorCode: string;
  verificationStatus: string;
  isBlocked?: boolean;
}

export function AdminVendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    adminApi
      .get("/admin/vendors")
      .then((res) => setVendors(unwrapList<Vendor>(res.data?.data ?? res.data)))
      .catch(() => setVendors([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const unblock = async (id: string) => {
    setActingId(id);
    try {
      await adminApi.patch(`/admin/vendors/${id}/unblock`);
      load();
    } finally {
      setActingId(null);
    }
  };

  return (
    <div>
      <PageHeader eyebrow="Vendors" title="All vendors" description="Every vendor and technician on your branch." />

      {loading ? (
        <div className="h-40 animate-pulse rounded-card bg-ink/[0.04]" />
      ) : vendors.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="font-display text-lg font-semibold text-ink">No vendors yet</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {vendors.map((v) => (
            <Card key={v.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-ink">{v.fullName}</p>
                  <Badge tone="slate">{v.role}</Badge>
                  {v.isBlocked && <Badge tone="danger">Blocked</Badge>}
                </div>
                <p className="text-sm text-ink-soft/60">{v.phone} · {v.vendorCode}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={v.verificationStatus === "VERIFIED" ? "success" : "gold"}>{v.verificationStatus}</Badge>
                {v.isBlocked && (
                  <Button accent="slate" variant="secondary" loading={actingId === v.id} onClick={() => unblock(v.id)}>
                    Unblock
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
