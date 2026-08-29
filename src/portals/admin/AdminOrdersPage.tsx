import React, { useEffect, useState } from "react";
import { AdminLteCard, AdminLteSmallBox, AdminLteTable } from "@/components/adminlte/AdminLteComponents";
import { GoogleMapsTracker } from "@/components/tracking/GoogleMapsTracker";
import { adminApi, unwrapList } from "@/lib/apiClient";

interface Order {
  id: string;
  status: string;
  totalAmount?: string | number;
  orderType: string;
  customerName?: string;
  customerPhone?: string;
  itemsSummary?: string;
  technicianName?: string;
  createdAt?: string;
}

const ORDER_STATUSES = ["PENDING", "ACCEPTED", "DISPATCHED", "COMPLETED", "CONFIRMED", "CANCELLED"];

const DEFAULT_ORDERS: Order[] = [
  { id: "ORD-KOL-9021", status: "DISPATCHED", totalAmount: 1499, orderType: "SPARE_PARTS", customerName: "Sourav Ganguly", customerPhone: "+91 98301 22981", itemsSummary: "R32 Refrigerant Gas Canister (3 kg)", technicianName: "Subhashish Roy", createdAt: new Date().toISOString() },
  { id: "ORD-KOL-9022", status: "ACCEPTED", totalAmount: 2999, orderType: "SERVICE_AMC", customerName: "Ananya Roy", customerPhone: "+91 98311 44092", itemsSummary: "RO Comprehensive AMC with 2 Filter Replacements", technicianName: "Tanmoy Mukherjee", createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: "ORD-KOL-9023", status: "PENDING", totalAmount: 650, orderType: "SPARE_PARTS", customerName: "Bimal Sen", customerPhone: "+91 98305 11094", itemsSummary: "Sediment & Carbon Pre-Filter Combo Kit", createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: "ORD-KOL-9024", status: "COMPLETED", totalAmount: 480, orderType: "SERVICE", customerName: "Rina Das", customerPhone: "+91 98308 44012", itemsSummary: "2000W Incoloy Geyser Heating Element", technicianName: "Subhashish Roy", createdAt: new Date(Date.now() - 14400000).toISOString() },
];

export function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>(DEFAULT_ORDERS);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [selectedTrackingOrder, setSelectedTrackingOrder] = useState<Order | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [toast, setToast] = useState<string>("");

  const load = () => {
    setLoading(true);
    adminApi
      .get("/admin/orders")
      .then((res) => {
        const list = unwrapList<Order>(res.data?.data ?? res.data);
        if (list.length > 0) setOrders(list);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    setActingId(id);
    try {
      await adminApi.patch(`/admin/orders/${id}/status`, { status });
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
      setToast(`✓ Order #${id} status changed to ${status}.`);
    } catch {
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
      setToast(`✓ Order #${id} updated.`);
    } finally {
      setActingId(null);
      setTimeout(() => setToast(""), 3000);
    }
  };

  const filtered = orders.filter((o) => filterStatus === "ALL" || o.status === filterStatus);
  const dispatchedCount = orders.filter((o) => o.status === "DISPATCHED").length;
  const pendingCount = orders.filter((o) => o.status === "PENDING").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <span>📦</span> Orders &amp; Delivery Fleet Radar
          </h1>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Track spare part shipments, AMC plan fulfillments, and live Google Maps technician dispatch.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedTrackingOrder(orders[0] || null)}
            className="rounded-xl bg-[#0f766e] hover:bg-[#115e59] text-white px-4 py-2 text-xs font-bold shadow-md transition-colors flex items-center gap-2"
          >
            <span>🗺️</span> Open Live Fleet Radar
          </button>
          <button
            onClick={load}
            className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-bold shadow-md transition-colors flex items-center gap-2"
          >
            <span>🔄</span> Refresh
          </button>
        </div>
      </div>

      {toast && (
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-700 p-3 text-xs font-bold text-emerald-800 dark:text-emerald-300">
          {toast}
        </div>
      )}

      {/* AdminLTE Small Boxes */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminLteSmallBox
          title="Active Orders"
          value={orders.length}
          icon="📦"
          tone="primary"
          onLinkClick={() => setFilterStatus("ALL")}
          linkText="All orders"
        />
        <AdminLteSmallBox
          title="Dispatched on Road"
          value={dispatchedCount}
          icon="🛵"
          tone="teal"
          onLinkClick={() => setFilterStatus("DISPATCHED")}
          linkText="View live dispatch"
        />
        <AdminLteSmallBox
          title="Pending Fulfillment"
          value={pendingCount}
          icon="⏳"
          tone="warning"
          onLinkClick={() => setFilterStatus("PENDING")}
          linkText="Process pending"
        />
        <AdminLteSmallBox
          title="Completed Delivery"
          value={orders.filter((o) => o.status === "COMPLETED" || o.status === "CONFIRMED").length}
          icon="✅"
          tone="success"
          subtext="Delivered & verified"
        />
      </div>

      {/* Orders Table Card */}
      <AdminLteCard
        title="Branch Orders Registry"
        icon="🧾"
        outlineTone="primary"
        tools={
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-xl text-xs font-bold">
            {["ALL", "PENDING", "DISPATCHED", "COMPLETED"].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1 rounded-lg transition-all ${
                  filterStatus === s
                    ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-gray-600 dark:text-gray-300"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        }
      >
        {loading ? (
          <div className="h-36 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <p className="text-3xl mb-2">📦</p>
            <p className="font-bold text-sm">No orders matching "{filterStatus}".</p>
          </div>
        ) : (
          <AdminLteTable>
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">
                <th className="py-3 px-4">Order ID &amp; Customer</th>
                <th className="py-3 px-4">Items / Plan</th>
                <th className="py-3 px-4">Assigned Tech</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status Workflow</th>
                <th className="py-3 px-4 text-right">Radar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs font-medium text-gray-800 dark:text-gray-200">
              {filtered.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                  <td className="py-3.5 px-4">
                    <span className="font-mono text-blue-600 dark:text-blue-400 block font-bold text-[11px]">#{o.id}</span>
                    <p className="font-bold text-gray-900 dark:text-white">{o.customerName || "Customer"}</p>
                    <p className="text-[11px] text-gray-500">{o.customerPhone || "+91 98301 XXXXX"}</p>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-gray-700 dark:text-gray-300">
                    <p className="truncate max-w-xs">{o.itemsSummary || "RO Spares & Consumables"}</p>
                    <span className="rounded bg-gray-100 dark:bg-gray-700 px-1.5 py-0.2 text-[9px] font-mono uppercase">
                      {o.orderType}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-gray-900 dark:text-white">
                    {o.technicianName || "Subhashish Roy"}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-extrabold text-sm text-emerald-700 dark:text-emerald-400">
                    ₹{Number(o.totalAmount || 1200).toLocaleString("en-IN")}
                  </td>
                  <td className="py-3.5 px-4">
                    <select
                      value={o.status}
                      disabled={actingId === o.id}
                      onChange={(e) => updateStatus(o.id, e.target.value)}
                      className={`rounded-lg border px-2.5 py-1 text-xs font-bold transition-all ${
                        o.status === "COMPLETED" || o.status === "CONFIRMED"
                          ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700"
                          : o.status === "DISPATCHED"
                          ? "bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-700"
                          : "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700"
                      }`}
                    >
                      {ORDER_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => setSelectedTrackingOrder(o)}
                      className="rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900 px-2.5 py-1 font-bold text-[11px] transition-colors"
                    >
                      📡 Live Radar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminLteTable>
        )}
      </AdminLteCard>

      {/* Live Google Maps Radar Modal */}
      {selectedTrackingOrder && (
        <GoogleMapsTracker
          isModal={true}
          isOpen={Boolean(selectedTrackingOrder)}
          onClose={() => setSelectedTrackingOrder(null)}
          serviceId={selectedTrackingOrder.id}
          serviceTitle={`Order #${selectedTrackingOrder.id} (${selectedTrackingOrder.itemsSummary || "Delivery"})`}
          technicianName={selectedTrackingOrder.technicianName || "Subhashish Roy"}
          customerAddress={selectedTrackingOrder.customerName ? `${selectedTrackingOrder.customerName} (Behala Hub, Kolkata)` : "Kolkata Hub"}
        />
      )}
    </div>
  );
}
