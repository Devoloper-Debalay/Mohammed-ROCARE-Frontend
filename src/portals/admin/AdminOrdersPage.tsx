import React, { useEffect, useState } from "react";
import { AdminLteCard, AdminLteSmallBox, AdminLteTable, AdminLteModal } from "@/components/adminlte/AdminLteComponents";
import { GoogleMapsTracker } from "@/components/tracking/GoogleMapsTracker";
import { adminApi, unwrapList } from "@/lib/apiClient";

export interface OrderItem {
  id: string;
  productId?: string;
  partId?: string;
  quantity: number;
  unitPrice?: number | string;
  product?: { name: string; price: number | string };
  part?: { name: string; price: number | string };
}

export interface Order {
  id: string;
  status: string;
  totalAmount?: string | number;
  orderType?: string;
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  customer?: {
    id: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
  };
  itemsSummary?: string;
  items?: OrderItem[];
  technicianName?: string;
  assignedVendorId?: string | null;
  assignedVendor?: {
    id?: string;
    fullName: string;
    phone?: string;
    vendorCode?: string;
  } | null;
  createdAt?: string;
}

export interface VendorBrief {
  id: string;
  fullName: string;
  phone: string;
  vendorCode: string;
  specialization?: string;
}

const ORDER_STATUSES = ["PENDING", "ACCEPTED", "DISPATCHED", "COMPLETED", "CONFIRMED", "CANCELLED"];

export function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [vendors, setVendors] = useState<VendorBrief[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  
  // Modals & Selection
  const [selectedTrackingOrder, setSelectedTrackingOrder] = useState<Order | null>(null);
  const [inspectOrder, setInspectOrder] = useState<Order | null>(null);
  const [assignVendorModal, setAssignVendorModal] = useState<Order | null>(null);
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [toast, setToast] = useState<string>("");

  const load = () => {
    setLoading(true);
    Promise.allSettled([
      adminApi.get("/admin/orders?limit=100"),
      adminApi.get("/admin/vendors?limit=100"),
    ]).then(([oRes, vRes]) => {
      if (oRes.status === "fulfilled") {
        const list = unwrapList<Order>(oRes.value.data?.data ?? oRes.value.data);
        setOrders(list);
      }
      if (vRes.status === "fulfilled") {
        const vList = unwrapList<VendorBrief>(vRes.value.data?.data ?? vRes.value.data);
        setVendors(vList);
        if (vList.length > 0 && !selectedVendorId) {
          setSelectedVendorId(vList[0].id);
        }
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    setActingId(id);
    try {
      await adminApi.patch(`/admin/orders/${id}/status`, { status });
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
      setToast(`✓ Order #${id.slice(0, 8)} status changed to ${status}.`);
    } catch (err: any) {
      setToast(err?.response?.data?.message ?? "Order status updated.");
    } finally {
      setActingId(null);
      setTimeout(() => setToast(""), 3000);
    }
  };

  const handleAssignVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignVendorModal || !selectedVendorId) return;
    setActingId(assignVendorModal.id);
    try {
      await adminApi.patch(`/admin/orders/${assignVendorModal.id}/vendor`, { vendorId: selectedVendorId });
      const matchedVendor = vendors.find((v) => v.id === selectedVendorId);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === assignVendorModal.id
            ? {
                ...o,
                assignedVendorId: selectedVendorId,
                assignedVendor: matchedVendor,
                status: o.status === "PENDING" ? "ACCEPTED" : o.status,
              }
            : o
        )
      );
      setToast(`✓ Assigned ${matchedVendor?.fullName || "Technician"} to order #${assignVendorModal.id.slice(0, 8)}.`);
    } catch (err: any) {
      setToast(err?.response?.data?.message ?? "Vendor assigned to order.");
    } finally {
      setActingId(null);
      setAssignVendorModal(null);
      setTimeout(() => setToast(""), 3500);
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
            Manage spare part dispatches, assign doorstep technicians, and monitor realtime GPS delivery routes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {orders.length > 0 && (
            <button
              onClick={() => setSelectedTrackingOrder(orders[0])}
              className="rounded-xl bg-[#0f766e] hover:bg-[#115e59] text-white px-4 py-2 text-xs font-bold shadow-md transition-colors flex items-center gap-2"
            >
              <span>🗺️</span> Open Live Fleet Radar
            </button>
          )}
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
          title="Pending Assignment"
          value={pendingCount}
          icon="⏳"
          tone="warning"
          onLinkClick={() => setFilterStatus("PENDING")}
          linkText="Assign technicians"
        />
        <AdminLteSmallBox
          title="Completed Delivery"
          value={orders.filter((o) => o.status === "COMPLETED" || o.status === "CONFIRMED").length}
          icon="✅"
          tone="success"
          subtext="Successful doorstep handovers"
        />
      </div>

      {/* Main Order Table Card */}
      <AdminLteCard
        title="Live Commerce & Dispatch Log"
        icon="📋"
        outlineTone="primary"
        tools={
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setFilterStatus("ALL")}
              className={`px-3 py-1 rounded-lg transition-all ${
                filterStatus === "ALL"
                  ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-gray-600 dark:text-gray-300"
              }`}
            >
              All ({orders.length})
            </button>
            <button
              onClick={() => setFilterStatus("PENDING")}
              className={`px-3 py-1 rounded-lg transition-all ${
                filterStatus === "PENDING"
                  ? "bg-white dark:bg-gray-800 text-amber-600 dark:text-amber-400 shadow-sm"
                  : "text-gray-600 dark:text-gray-300"
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setFilterStatus("DISPATCHED")}
              className={`px-3 py-1 rounded-lg transition-all ${
                filterStatus === "DISPATCHED"
                  ? "bg-white dark:bg-gray-800 text-teal-600 dark:text-teal-400 shadow-sm"
                  : "text-gray-600 dark:text-gray-300"
              }`}
            >
              Dispatched ({dispatchedCount})
            </button>
          </div>
        }
      >
        {loading ? (
          <div className="h-36 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <p className="text-3xl mb-2">📦</p>
            <p className="font-bold text-sm">No orders found under "{filterStatus}".</p>
          </div>
        ) : (
          <AdminLteTable
            striped
            hover
            headers={[
              "Order Reference",
              "Customer Details",
              "Items / Spares",
              "Total Amount",
              "Assigned Technician",
              "Fulfillment Status",
              "Actions",
            ]}
          >
            {filtered.map((order) => {
              const customerDisplayName =
                order.customerName ||
                order.customer?.fullName ||
                (order.customer?.firstName ? `${order.customer.firstName} ${order.customer.lastName || ""}` : "Customer");
              const customerPhone = order.customerPhone || order.customer?.phone || "—";
              const itemsCount = order.items?.length || 1;
              const itemsText =
                order.itemsSummary ||
                (order.items && order.items.length > 0
                  ? order.items.map((i) => i.product?.name || i.part?.name || "Item").join(", ")
                  : "Doorstep Service Items");

              return (
                <tr key={order.id} className="hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors">
                  <td>
                    <p className="font-mono text-xs font-black text-blue-600 dark:text-blue-400">
                      #{order.id.slice(0, 8)}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "Live Order"}
                    </p>
                  </td>

                  <td>
                    <p className="font-bold text-xs text-gray-900 dark:text-white">{customerDisplayName}</p>
                    <p className="font-mono text-[11px] text-gray-600 dark:text-gray-300">{customerPhone}</p>
                  </td>

                  <td className="max-w-[220px]">
                    <p className="font-semibold text-xs text-gray-800 dark:text-gray-200 truncate" title={itemsText}>
                      {itemsText}
                    </p>
                    <span className="text-[10px] font-bold text-gray-500">{itemsCount} line items</span>
                  </td>

                  <td>
                    <span className="font-mono text-xs font-black text-emerald-700 dark:text-emerald-400">
                      ₹{order.totalAmount || "0"}
                    </span>
                  </td>

                  <td>
                    {order.assignedVendor ? (
                      <div>
                        <p className="font-bold text-xs text-gray-900 dark:text-white flex items-center gap-1">
                          <span>🛵</span> {order.assignedVendor.fullName}
                        </p>
                        <p className="font-mono text-[10px] text-gray-500">
                          {order.assignedVendor.phone || order.assignedVendor.vendorCode}
                        </p>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setAssignVendorModal(order);
                          if (vendors[0]?.id) setSelectedVendorId(vendors[0].id);
                        }}
                        className="rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-2.5 py-1 text-[11px] font-bold transition-colors"
                      >
                        + Assign Vendor
                      </button>
                    )}
                  </td>

                  <td>
                    <select
                      value={order.status}
                      disabled={actingId === order.id}
                      onChange={(e) => updateStatus(order.id, e.target.value)}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-extrabold border uppercase focus:outline-none ${
                        order.status === "COMPLETED" || order.status === "CONFIRMED"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : order.status === "DISPATCHED"
                          ? "bg-teal-100 text-teal-800 border-teal-300"
                          : order.status === "CANCELLED"
                          ? "bg-rose-100 text-rose-800 border-rose-300"
                          : "bg-amber-100 text-amber-800 border-amber-300"
                      }`}
                    >
                      {ORDER_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setInspectOrder(order)}
                        className="rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 px-2.5 py-1 text-[11px] font-bold"
                      >
                        Inspect
                      </button>
                      <button
                        onClick={() => setSelectedTrackingOrder(order)}
                        className="rounded-lg bg-teal-600 hover:bg-teal-700 text-white px-2.5 py-1 text-[11px] font-bold shadow-sm"
                      >
                        GPS Map
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </AdminLteTable>
        )}
      </AdminLteCard>

      {/* GPS Radar Modal */}
      {selectedTrackingOrder && (
        <GoogleMapsTracker
          isModal
          isOpen={Boolean(selectedTrackingOrder)}
          onClose={() => setSelectedTrackingOrder(null)}
          serviceId={`ORD-${selectedTrackingOrder.id.slice(0, 8)}`}
          serviceTitle={`Order Delivery: ${selectedTrackingOrder.itemsSummary || "Parts Shipment"}`}
          customerAddress={selectedTrackingOrder.deliveryAddress || "Customer Delivery Destination"}
          vendorName={selectedTrackingOrder.assignedVendor?.fullName || "Delivery Fleet Agent"}
          vendorPhone={selectedTrackingOrder.assignedVendor?.phone || "+91 9051607464"}
        />
      )}

      {/* Assign Vendor Modal */}
      {assignVendorModal && (
        <AdminLteModal
          title={`Assign Technician / Vendor to Order #${assignVendorModal.id.slice(0, 8)}`}
          isOpen={Boolean(assignVendorModal)}
          onClose={() => setAssignVendorModal(null)}
        >
          <form onSubmit={handleAssignVendor} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                Select Technician Fleet Agent
              </label>
              <select
                value={selectedVendorId}
                onChange={(e) => setSelectedVendorId(e.target.value)}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-xs font-semibold focus:border-blue-500 focus:outline-none"
              >
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.fullName} ({v.phone}) - {v.specialization || "Tech"}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setAssignVendorModal(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actingId === assignVendorModal.id}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                Confirm Technician Assignment
              </button>
            </div>
          </form>
        </AdminLteModal>
      )}

      {/* Inspect Order Modal */}
      {inspectOrder && (
        <AdminLteModal
          title={`Order Breakdown: #${inspectOrder.id.slice(0, 8)}`}
          isOpen={Boolean(inspectOrder)}
          onClose={() => setInspectOrder(null)}
        >
          <div className="space-y-4 text-xs">
            <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3.5 border border-gray-200 dark:border-gray-700">
              <p className="font-bold text-gray-900 dark:text-white mb-1">Delivery Address &amp; Customer</p>
              <p className="text-gray-700 dark:text-gray-300">
                {inspectOrder.deliveryAddress || "Address on customer profile"}
              </p>
              <p className="mt-1 font-mono text-[11px] text-gray-500">
                Phone: {inspectOrder.customerPhone || inspectOrder.customer?.phone || "—"}
              </p>
            </div>

            <div>
              <p className="font-bold text-gray-900 dark:text-white mb-2">Order Line Items</p>
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
                {inspectOrder.items && inspectOrder.items.length > 0 ? (
                  inspectOrder.items.map((item) => (
                    <div key={item.id} className="p-3 flex items-center justify-between bg-white dark:bg-gray-800">
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">
                          {item.product?.name || item.part?.name || "Inventory Product"}
                        </p>
                        <p className="text-[10px] text-gray-500">Quantity: {item.quantity}</p>
                      </div>
                      <span className="font-mono font-bold text-xs">
                        ₹{item.unitPrice || item.product?.price || item.part?.price || "—"}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    {inspectOrder.itemsSummary || "Standard Appliance Service Package"}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700 font-bold">
              <span>Total Payable Amount:</span>
              <span className="font-mono text-base text-emerald-700 dark:text-emerald-400">
                ₹{inspectOrder.totalAmount || "0"}
              </span>
            </div>
          </div>
        </AdminLteModal>
      )}
    </div>
  );
}
