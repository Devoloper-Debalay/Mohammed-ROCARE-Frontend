import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, Badge } from "@/components/ui/Card";
import { customerApi } from "@/lib/apiClient";

interface Order {
  id: string;
  orderType: "PRODUCT" | "SERVICE";
  status: string;
  totalAmount?: string;
  createdAt: string;
}

const statusTone: Record<string, "teal" | "gold" | "success" | "danger" | "neutral"> = {
  PENDING: "gold",
  ACCEPTED: "teal",
  DISPATCHED: "teal",
  COMPLETED: "success",
  CONFIRMED: "success",
  CANCELLED: "danger",
};

export function CustomerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    customerApi
      .get("/orders/customer")
      .then((res) => setOrders(res.data?.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader eyebrow="Orders" title="Your orders" description="Products and services you've ordered." />

      {loading ? (
        <div className="h-32 animate-pulse rounded-card bg-ink/[0.04]" />
      ) : orders.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="font-display text-lg font-semibold text-ink">No orders yet</p>
          <p className="mt-1 text-sm text-ink-soft/70">Products you buy from the catalog will show up here.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((o) => (
            <Card key={o.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-mono text-sm text-ink-soft/70">#{o.id.slice(0, 8)}</p>
                <p className="text-sm text-ink-soft/60">{new Date(o.createdAt).toLocaleDateString()} · {o.orderType}</p>
              </div>
              {o.totalAmount && <span className="font-mono font-semibold text-ink">₹{o.totalAmount}</span>}
              <Badge tone={statusTone[o.status] ?? "neutral"}>{o.status}</Badge>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
