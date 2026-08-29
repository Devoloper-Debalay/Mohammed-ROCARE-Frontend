import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { adminApi, unwrapList } from "@/lib/apiClient";

interface Order {
  id: string;
  status: string;
  totalAmount?: string;
  orderType: string;
}

interface Payment {
  id: string;
  amount: string;
  status: string;
  method: string;
}

const ORDER_STATUSES = ["PENDING", "ACCEPTED", "DISPATCHED", "COMPLETED", "CONFIRMED", "CANCELLED"];

const statusTone: Record<string, "gold" | "teal" | "success" | "danger" | "neutral"> = {
  PENDING: "gold",
  ACCEPTED: "teal",
  DISPATCHED: "teal",
  COMPLETED: "success",
  CONFIRMED: "success",
  CANCELLED: "danger",
};

export function AdminOrdersPage() {
  const [tab, setTab] = useState<"orders" | "payments">("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    Promise.allSettled([adminApi.get("/admin/orders"), adminApi.get("/admin/payments")]).then(([o, p]) => {
      if (o.status === "fulfilled") setOrders(unwrapList<Order>(o.value.data?.data ?? o.value.data));
      if (p.status === "fulfilled") setPayments(unwrapList<Payment>(p.value.data?.data ?? p.value.data));
      setLoading(false);
    });
  };

  useEffect(load, []);

  const updateStatus = async (id: string, status: string) => {
    setActingId(id);
    try {
      await adminApi.patch(`/admin/orders/${id}/status`, { status });
      load();
    } finally {
      setActingId(null);
    }
  };

  const reviewPayment = async (id: string, approved: boolean) => {
    setActingId(id);
    try {
      await adminApi.post(`/admin/payments/${id}/review`, { approved });
      load();
    } finally {
      setActingId(null);
    }
  };

  return (
    <div>
      <PageHeader eyebrow="Commerce" title="Orders" description="Product and service orders for your branch." />

      <div className="mb-6 flex gap-2 rounded-full bg-base p-1 w-fit">
        {(["orders", "payments"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-2 text-sm font-semibold capitalize transition-colors ${
              tab === t ? "bg-slate text-white" : "text-ink-soft"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="h-40 animate-pulse rounded-card bg-ink/[0.04]" />
      ) : tab === "orders" ? (
        orders.length === 0 ? (
          <Card className="p-10 text-center">
            <p className="font-display text-lg font-semibold text-ink">No orders yet</p>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {orders.map((o) => (
              <Card key={o.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-mono text-sm text-ink-soft/70">#{o.id.slice(0, 8)}</p>
                  <p className="text-sm text-ink-soft/60">{o.orderType} {o.totalAmount ? `· ₹${o.totalAmount}` : ""}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={statusTone[o.status] ?? "neutral"}>{o.status}</Badge>
                  <select
                    defaultValue=""
                    disabled={actingId === o.id}
                    onChange={(e) => e.target.value && updateStatus(o.id, e.target.value)}
                    className="rounded-lg border border-ink/10 bg-surface px-2 py-1.5 text-xs"
                  >
                    <option value="" disabled>
                      Change status
                    </option>
                    {ORDER_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </Card>
            ))}
          </div>
        )
      ) : payments.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="font-display text-lg font-semibold text-ink">No payments to review</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {payments.map((p) => (
            <Card key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-mono text-sm text-ink-soft/70">#{p.id.slice(0, 8)}</p>
                <p className="text-sm text-ink-soft/60">{p.method} · ₹{p.amount}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={p.status === "PAID" ? "success" : "gold"}>{p.status}</Badge>
                {p.status === "PENDING" && (
                  <div className="flex gap-2">
                    <Button accent="slate" variant="secondary" loading={actingId === p.id} onClick={() => reviewPayment(p.id, false)}>
                      Reject
                    </Button>
                    <Button accent="slate" loading={actingId === p.id} onClick={() => reviewPayment(p.id, true)}>
                      Confirm
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
