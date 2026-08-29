import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { customerApi, unwrapList } from "@/lib/apiClient";

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export function CustomerNotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    customerApi
      .get("/notifications/customer")
      .then((res) => setItems(unwrapList<Notification>(res.data?.data ?? res.data)))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const markRead = async (id: string) => {
    await customerApi.patch(`/notifications/customer/${id}/read`);
    load();
  };

  const markAllRead = async () => {
    await customerApi.patch("/notifications/customer/read-all");
    load();
  };

  const unreadCount = items.filter((n) => !n.isRead).length;

  return (
    <div>
      <PageHeader
        eyebrow="Updates"
        title="Notifications"
        description="Order, service and account updates."
        action={
          unreadCount > 0 ? (
            <Button accent="teal" variant="secondary" onClick={markAllRead}>
              Mark all read
            </Button>
          ) : undefined
        }
      />

      {loading ? (
        <div className="h-32 animate-pulse rounded-card bg-ink/[0.04]" />
      ) : items.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="font-display text-lg font-semibold text-ink">You're all caught up</p>
          <p className="mt-1 text-sm text-ink-soft/70">Updates on your orders and service requests will appear here.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((n) => (
            <Card key={n.id} className={`flex items-start justify-between gap-4 p-4 ${!n.isRead ? "border-teal/30" : ""}`}>
              <div>
                <p className="font-medium text-ink">{n.title}</p>
                <p className="mt-0.5 text-sm text-ink-soft/70">{n.message}</p>
                <p className="mt-1 text-xs text-ink-soft/40">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
              {!n.isRead && (
                <button onClick={() => markRead(n.id)} className="shrink-0 text-xs font-semibold text-teal-deep">
                  Mark read
                </button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
