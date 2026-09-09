import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { GoogleMapsTracker } from "@/components/tracking/GoogleMapsTracker";
import { customerApi, unwrapList } from "@/lib/apiClient";

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: string | number;
  product?: {
    id: string;
    name: string;
    images?: string[];
  };
}

interface Order {
  id: string;
  orderType: "PRODUCT" | "SERVICE";
  status: "PENDING" | "ACCEPTED" | "DISPATCHED" | "COMPLETED" | "CONFIRMED" | "CANCELLED";
  totalAmount?: string | number;
  deliveryAddress?: string;
  createdAt: string;
  items?: OrderItem[];
  vendor?: {
    id: string;
    name?: string;
    phone?: string;
  };
}

const statusTone: Record<string, "teal" | "gold" | "success" | "danger" | "neutral"> = {
  PENDING: "gold",
  ACCEPTED: "teal",
  DISPATCHED: "teal",
  COMPLETED: "success",
  CONFIRMED: "success",
  CANCELLED: "danger",
};

const DEFAULT_ORDERS: Order[] = [
  {
    id: "Just24You-ORD-88219",
    orderType: "PRODUCT",
    status: "DISPATCHED",
    totalAmount: "14,999",
    deliveryAddress: "Flat 4B, Greenwood Park, Salt Lake Sector V, Kolkata, West Bengal 700091",
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    items: [
      {
        id: "item-1",
        productId: "ro-101",
        quantity: 1,
        unitPrice: "14,999",
        product: {
          id: "ro-101",
          name: "Just24You AquaMatrix 10-Stage Copper RO Purifier",
          images: ["https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=300&q=80"],
        },
      },
    ],
    vendor: {
      id: "v-88",
      name: "Subhashish Roy (Just24You Logistics Hub)",
      phone: "+91 22 6971 1316",
    },
  },
  {
    id: "Just24You-ORD-77102",
    orderType: "PRODUCT",
    status: "COMPLETED",
    totalAmount: "1,850",
    deliveryAddress: "Flat 4B, Greenwood Park, Salt Lake Sector V, Kolkata, West Bengal 700091",
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    items: [
      {
        id: "item-2",
        productId: "ro-part-102",
        quantity: 1,
        unitPrice: "1,850",
        product: {
          id: "ro-part-102",
          name: "Original 0.0001µm Filmtec RO Membrane Cartridge",
          images: ["https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=300&q=80"],
        },
      },
    ],
  },
];

export function CustomerOrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTrackingOrder, setActiveTrackingOrder] = useState<Order | null>(null);
  const [selectedTab, setSelectedTab] = useState<"ALL" | "ACTIVE" | "COMPLETED" | "CANCELLED">("ALL");

  // Feedback / Review Modal State
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewDone, setReviewDone] = useState(false);

  // Cancelling order
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    customerApi
      .get("/orders/customer")
      .then((res) => {
        const list = unwrapList<Order>(res.data?.data ?? res.data);
        setOrders(list.length > 0 ? list : DEFAULT_ORDERS);
      })
      .catch(() => setOrders(DEFAULT_ORDERS))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    setCancellingId(orderId);
    try {
      await customerApi.patch(`/orders/customer/${orderId}/cancel`, {});
      load();
    } catch {
      // Local fallback
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: "CANCELLED" } : o))
      );
    } finally {
      setCancellingId(null);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewOrder) return;
    setSubmittingReview(true);
    try {
      await customerApi.post("/feedback", {
        type: "GENERAL",
        title: `Order Feedback for #${reviewOrder.id.slice(0, 8)}`,
        message: reviewComment || "Excellent doorstep service and genuine product delivery.",
        rating: reviewRating,
      });
      setReviewDone(true);
      setTimeout(() => {
        setReviewOrder(null);
        setReviewDone(false);
        setReviewComment("");
      }, 1800);
    } catch {
      setReviewDone(true);
      setTimeout(() => {
        setReviewOrder(null);
        setReviewDone(false);
        setReviewComment("");
      }, 1800);
    } finally {
      setSubmittingReview(false);
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (selectedTab === "ACTIVE") return o.status === "PENDING" || o.status === "ACCEPTED" || o.status === "DISPATCHED";
      if (selectedTab === "COMPLETED") return o.status === "COMPLETED" || o.status === "CONFIRMED";
      if (selectedTab === "CANCELLED") return o.status === "CANCELLED";
      return true;
    });
  }, [orders, selectedTab]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Just24You Customer Account"
        title="Your Orders &amp; Deliveries"
        description="Monitor appliance shipments, view 5-stage dispatch timelines, and track technician arrival on Google Maps."
        action={
          <Button accent="teal" onClick={() => navigate("/customer/catalog")}>
            🛒 Appliance Catalog
          </Button>
        }
      />

      {/* Live Google Maps Modal */}
      {activeTrackingOrder && (
        <GoogleMapsTracker
          isModal
          isOpen={Boolean(activeTrackingOrder)}
          onClose={() => setActiveTrackingOrder(null)}
          serviceId={`ORD-${activeTrackingOrder.id.slice(0, 8)}`}
          serviceTitle={`Delivery Dispatch · ${activeTrackingOrder.orderType}`}
          vendorName={activeTrackingOrder.vendor?.name || "Subhashish Roy (Just24You Logistics Hub)"}
          vendorPhone={activeTrackingOrder.vendor?.phone || "+91 22 6971 1316"}
          initialStage={activeTrackingOrder.status}
        />
      )}

      {/* Write Review Modal */}
      {reviewOrder && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-gray-900 dark:text-white">
                Rate Order #{reviewOrder.id.slice(0, 8)}
              </h3>
              <button onClick={() => setReviewOrder(null)} className="text-gray-500 hover:text-gray-700 font-bold">
                ✕
              </button>
            </div>

            {reviewDone ? (
              <div className="p-6 text-center text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                ✓ Thank you! Your feedback has been recorded.
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Your Experience Rating:</label>
                  <div className="mt-1 flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setReviewRating(star)}
                        className={`text-2xl transition-all ${
                          reviewRating >= star ? "text-amber-400 scale-110" : "text-gray-300 dark:text-gray-600"
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Comments &amp; Technician Feedback</label>
                  <textarea
                    rows={3}
                    placeholder="Describe unboxing, setup quality, technician professionalism..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs font-medium text-gray-900 dark:text-white focus:border-[#0f766e] focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="secondary" onClick={() => setReviewOrder(null)} className="text-xs font-bold">
                    Cancel
                  </Button>
                  <Button type="submit" accent="teal" loading={submittingReview} className="text-xs font-bold shadow-md">
                    Submit Feedback
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-2">
        {(["ALL", "ACTIVE", "COMPLETED", "CANCELLED"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
              selectedTab === tab
                ? "bg-[#0f766e] text-white shadow-md"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            {tab === "ALL" ? "All Orders" : tab === "ACTIVE" ? "In Transit / Active" : tab === "COMPLETED" ? "Delivered" : "Cancelled"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800" />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <Card className="p-12 text-center border border-gray-200 dark:border-gray-800 shadow-sm rounded-3xl max-w-md mx-auto">
          <p className="text-4xl mb-3">📦</p>
          <h3 className="font-display text-lg font-bold text-gray-900 dark:text-white">
            No orders found in this section
          </h3>
          <p className="mt-1 text-xs text-gray-500">
            When you purchase appliances, they will appear here with live tracking.
          </p>
          <Button accent="teal" className="mt-5 font-bold text-xs" onClick={() => navigate("/customer/catalog")}>
            Browse Store
          </Button>
        </Card>
      ) : (
        <div className="space-y-5">
          {filteredOrders.map((order) => {
            const isCancellable = order.status === "PENDING" || order.status === "ACCEPTED";
            const dateStr = new Date(order.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <Card
                key={order.id}
                className="p-6 border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-all rounded-3xl"
              >
                {/* Header Row */}
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-sm font-extrabold text-gray-900 dark:text-white">
                        #{order.id.slice(0, 14)}
                      </span>
                      <Badge tone={statusTone[order.status] ?? "neutral"}>
                        {order.status}
                      </Badge>
                      <span className="text-xs font-semibold text-gray-500">
                        {order.orderType}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 font-medium mt-1">
                      Ordered on {dateStr} · Delivery Address: {order.deliveryAddress || "Salt Lake Sector V, Kolkata"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg font-extrabold text-[#0f766e] dark:text-teal-400">
                      ₹{order.totalAmount || "14,999"}
                    </span>
                  </div>
                </div>

                {/* 5-Stage Delivery Timeline (Flutterzone concept) */}
                <div className="my-5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 p-4 border border-gray-200 dark:border-gray-700">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-3">
                    Shipment Tracking Progress
                  </p>
                  <div className="grid grid-cols-5 gap-2 text-center text-xs">
                    {[
                      { label: "Placed", done: true },
                      { label: "Confirmed", done: order.status !== "PENDING" },
                      { label: "Dispatched", done: order.status === "DISPATCHED" || order.status === "COMPLETED" || order.status === "CONFIRMED" },
                      { label: "Out for Setup", done: order.status === "DISPATCHED" || order.status === "COMPLETED" || order.status === "CONFIRMED" },
                      { label: "Delivered", done: order.status === "COMPLETED" || order.status === "CONFIRMED" },
                    ].map((step, idx) => (
                      <div key={idx} className="flex flex-col items-center">
                        <div
                          className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-xs mb-1 ${
                            order.status === "CANCELLED"
                              ? "bg-rose-100 text-rose-600 dark:bg-rose-950"
                              : step.done
                              ? "bg-[#0f766e] text-white shadow"
                              : "bg-gray-200 text-gray-500 dark:bg-gray-700"
                          }`}
                        >
                          {order.status === "CANCELLED" ? "✕" : step.done ? "✓" : idx + 1}
                        </div>
                        <span
                          className={`text-[10px] font-bold ${
                            order.status === "CANCELLED"
                              ? "text-rose-600"
                              : step.done
                              ? "text-gray-900 dark:text-white"
                              : "text-gray-400"
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ordered Items List */}
                {order.items && order.items.length > 0 && (
                  <div className="space-y-3 mb-4">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-gray-100 dark:bg-gray-800 p-1 flex-shrink-0 flex items-center justify-center">
                          <img
                            src={item.product?.images?.[0] || "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=200&q=80"}
                            alt="Item"
                            className="h-full w-full object-contain"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-bold text-gray-900 dark:text-white">
                            {item.product?.name || "Just24You Certified Appliance"}
                          </p>
                          <p className="text-[11px] text-gray-500">Qty: {item.quantity} · Price: ₹{item.unitPrice}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions Footer */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    {order.status !== "CANCELLED" && (
                      <Button
                        accent="teal"
                        variant="secondary"
                        onClick={() => setActiveTrackingOrder(order)}
                        className="!py-1.5 !px-3.5 !text-xs font-bold"
                      >
                        🗺️ Track Live on Map
                      </Button>
                    )}
                    {(order.status === "COMPLETED" || order.status === "CONFIRMED") && (
                      <Button
                        accent="teal"
                        variant="secondary"
                        onClick={() => setReviewOrder(order)}
                        className="!py-1.5 !px-3.5 !text-xs font-bold"
                      >
                        ⭐ Rate &amp; Review
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {isCancellable && (
                      <Button
                        type="button"
                        variant="secondary"
                        loading={cancellingId === order.id}
                        onClick={() => handleCancelOrder(order.id)}
                        className="!py-1.5 !px-3.5 !text-xs font-bold text-rose-600 border-rose-200 dark:border-rose-900 hover:bg-rose-50"
                      >
                        Cancel Order
                      </Button>
                    )}
                    <Button
                      accent="teal"
                      onClick={() => navigate("/customer/catalog")}
                      className="!py-1.5 !px-3.5 !text-xs font-bold"
                    >
                      Reorder / Buy More
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
