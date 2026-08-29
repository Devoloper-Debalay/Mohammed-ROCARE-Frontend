import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { adminApi, unwrapList } from "@/lib/apiClient";

interface UserRow {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  isActive: boolean;
}

export function SuperAdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    adminApi
      .get("/admin/super/users")
      .then((res) => setUsers(unwrapList<UserRow>(res.data?.data ?? res.data)))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const toggleActive = async (id: string, isActive: boolean) => {
    setActingId(id);
    try {
      await adminApi.patch(`/admin/super/users/${id}/status`, { isActive: !isActive });
      load();
    } finally {
      setActingId(null);
    }
  };

  return (
    <div>
      <PageHeader eyebrow="Platform" title="Users" description="Every customer account on the platform." />

      {loading ? (
        <div className="h-40 animate-pulse rounded-card bg-ink/[0.04]" />
      ) : users.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="font-display text-lg font-semibold text-ink">No users yet</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {users.map((u) => (
            <Card key={u.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-medium text-ink">{u.firstName} {u.lastName}</p>
                <p className="text-sm text-ink-soft/60">{u.phone ?? u.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={u.isActive ? "success" : "danger"}>{u.isActive ? "Active" : "Suspended"}</Badge>
                <Button
                  accent="gold"
                  variant="secondary"
                  loading={actingId === u.id}
                  onClick={() => toggleActive(u.id, u.isActive)}
                >
                  {u.isActive ? "Suspend" : "Reactivate"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
