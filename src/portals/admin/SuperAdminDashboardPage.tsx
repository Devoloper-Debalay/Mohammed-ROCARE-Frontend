import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, Badge } from "@/components/ui/Card";
import { adminApi, unwrapList } from "@/lib/apiClient";

interface Branch {
  id: string;
  name: string;
  city: string;
  isActive: boolean;
}

export function SuperAdminDashboardPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [adminCount, setAdminCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([adminApi.get("/admin/super/branches"), adminApi.get("/admin/super/admins")]).then(([b, a]) => {
      if (b.status === "fulfilled") {
        const list = unwrapList<Branch>(b.value.data?.data ?? b.value.data);
        setBranches(list);
      }
      if (a.status === "fulfilled") {
        const list = unwrapList(a.value.data?.data ?? a.value.data);
        setAdminCount(list.length);
      }
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <PageHeader eyebrow="Platform" title="Super-admin overview" description="Branches, admins and platform-wide controls." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-soft/60">Branches</p>
          <p className="mt-2 font-mono text-2xl font-semibold text-ink">{loading ? "—" : branches.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-soft/60">Admins</p>
          <p className="mt-2 font-mono text-2xl font-semibold text-ink">{loading ? "—" : adminCount}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-soft/60">Your role</p>
          <p className="mt-2 font-display text-lg font-semibold text-ink">Super-admin</p>
        </Card>
      </div>

      <Card className="mt-6 p-6">
        <p className="mb-4 font-display text-lg font-semibold text-ink">Branches</p>
        {loading ? (
          <div className="h-24 animate-pulse rounded-xl bg-ink/[0.04]" />
        ) : branches.length === 0 ? (
          <p className="text-sm text-ink-soft/70">No branches created yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {branches.map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-xl bg-base px-4 py-3 text-sm">
                <div>
                  <p className="font-medium text-ink">{b.name}</p>
                  <p className="text-ink-soft/60">{b.city}</p>
                </div>
                <Badge tone={b.isActive ? "success" : "neutral"}>{b.isActive ? "Active" : "Inactive"}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
