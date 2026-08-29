import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, Badge } from "@/components/ui/Card";
import { adminApi, unwrapList } from "@/lib/apiClient";

interface AuditLog {
  id: string;
  action: string;
  entityType?: string;
  actorId?: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export function SuperAdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    adminApi
      .get("/admin/super/audit-logs")
      .then((res) => setLogs(unwrapList<AuditLog>(res.data?.data ?? res.data)))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader eyebrow="Platform" title="Audit logs" description="A record of every admin action." />

      {loading ? (
        <div className="h-40 animate-pulse rounded-card bg-ink/[0.04]" />
      ) : logs.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="font-display text-lg font-semibold text-ink">No audit entries yet</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {logs.map((log) => (
            <Card key={log.id} className="flex items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-mono text-sm font-medium text-ink">{log.action}</p>
                  {log.entityType && <Badge tone="gold">{log.entityType}</Badge>}
                </div>
                {log.actorId && <p className="mt-0.5 truncate text-xs text-ink-soft/50">Actor: {log.actorId}</p>}
              </div>
              <span className="shrink-0 text-xs text-ink-soft/50">{new Date(log.createdAt).toLocaleString()}</span>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
