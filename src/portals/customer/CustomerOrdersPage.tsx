import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { GoogleMapsTracker } from "@/components/tracking/GoogleMapsTracker";
import { customerApi, unwrapList } from "@/lib/apiClient";

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
  const [activeTrackingOrder, setActiveTrackingOrder] = useState<Order | null>(null);

  useEffect(() => {
    setLoading(true);
    customerApi
      .get("/orders/customer")
      .then((res) => setOrders(unwrapList<Order>(res.data?.data ?? res.data)))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader eyebrow="Orders" title="Your orders" description="Products and services you've ordered with Google Maps shipment & service tracking." />

      {activeTrackingOrder && (
        <GoogleMapsTracker
          isModal
          isOpen={Boolean(activeTrackingOrder)}
          onClose={() => setActiveTrackingOrder(null)}
          serviceId={`ORD-${activeTrackingOrder.id.slice(0, 8)}`}
          serviceTitle={`Order Delivery · ${activeTrackingOrder.orderType}`}
          initialStage={activeTrackingOrder.status}
        />
      )}

      {loading ? (
        <div className="h-32 animate-pulse rounded-card bg-ink/[0.04]" />
      ) : orders.length === 0 ? (
        <Card className="p-10 text-center border border-ink/[0.08]">
          <p className="font-display text-lg font-semibold text-ink">No orders yet</p>
          <p className="mt-1 text-sm text-ink-soft/70">Products and services you order will show up here with Google Maps GPS tracking.</p>
          <div className="mt-6">
            <Button
              accent="teal"
              variant="secondary"
              onClick={() =>
                setActiveTrackingOrder({
                  id: "SAMPLE-ORD-9021",
                  orderType: "PRODUCT",
                  status: "DISPATCHED",
                  totalAmount: "14,999",
                  createdAt: new Date().toISOString(),
                })
              }
            >
              🗺️ Test Google Maps Delivery Tracker
            </Button>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((o) => (
            <Card key={o.id} className="flex flex-wrap items-center justify-between gap-3 p-4 hover:shadow-md transition-shadow border border-ink/[0.08]">
              <div>
                <p className="font-mono text-sm text-ink-soft/70">#{o.id.slice(0, 8)}</p>
                <p className="text-sm text-ink-soft/60">{new Date(o.createdAt).toLocaleDateString()} · {o.orderType}</p>
              </div>
              <div className="flex items-center gap-3">
                {o.totalAmount && <span className="font-mono font-semibold text-ink">₹{o.totalAmount}</span>}
                <Badge tone={statusTone[o.status] ?? "neutral"}>{o.status}</Badge>
                <Button
                  accent="teal"
                  variant="secondary"
                  className="!py-1 !px-3 !text-xs"
                  onClick={() => setActiveTrackingOrder(o)}
                >
                  🗺️ Track Live
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
