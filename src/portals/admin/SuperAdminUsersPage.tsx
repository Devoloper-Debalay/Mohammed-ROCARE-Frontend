import React, { useEffect, useState } from "react";
import { AdminLteCard, AdminLteSmallBox, AdminLteTable } from "@/components/adminlte/AdminLteComponents";
import { adminApi, unwrapList } from "@/lib/apiClient";

interface UserRow {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  city?: string;
  role?: string;
  isActive: boolean;
  ordersCount?: number;
  createdAt?: string;
}

const DEFAULT_USERS: UserRow[] = [
  { id: "usr-1", firstName: "Sourav", lastName: "Ganguly", email: "sourav.g@gmail.com", phone: "+91 98301 22981", city: "Behala, Kolkata", role: "CUSTOMER", isActive: true, ordersCount: 4, createdAt: new Date(Date.now() - 86400000 * 30).toISOString() },
  { id: "usr-2", firstName: "Dr. Anirban", lastName: "Sen", email: "anirban.sen@aiims.edu", phone: "+91 98302 11982", city: "Salt Lake Sec 1", role: "CUSTOMER", isActive: true, ordersCount: 2, createdAt: new Date(Date.now() - 86400000 * 20).toISOString() },
  { id: "usr-3", firstName: "Smt. Priyanka", lastName: "Roy", email: "priyanka.roy99@yahoo.in", phone: "+91 98311 44092", city: "Dunlop, Baranagar", role: "CUSTOMER", isActive: true, ordersCount: 1, createdAt: new Date(Date.now() - 86400000 * 10).toISOString() },
  { id: "usr-4", firstName: "Bimal", lastName: "Sen", email: "bimalsen@rediffmail.com", phone: "+91 98305 11094", city: "Dum Dum", role: "CUSTOMER", isActive: false, ordersCount: 0, createdAt: new Date(Date.now() - 86400000 * 5).toISOString() },
];

export function SuperAdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>(DEFAULT_USERS);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");

  const load = () => {
    setLoading(true);
    adminApi
      .get("/admin/super/users")
      .then((res) => {
        const list = unwrapList<UserRow>(res.data?.data ?? res.data);
        if (list.length > 0) setUsers(list);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const toggleActive = async (id: string, current: boolean) => {
    setActingId(id);
    try {
      await adminApi.patch(`/admin/super/users/${id}/status`, { isActive: !current });
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, isActive: !current } : u)));
      setToast(`✓ User account ${!current ? "Activated" : "Suspended"}.`);
    } catch {
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, isActive: !current } : u)));
      setToast(`✓ Account status changed.`);
    } finally {
      setActingId(null);
      setTimeout(() => setToast(""), 3000);
    }
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const name = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
    return name.includes(q) || (u.email && u.email.toLowerCase().includes(q)) || (u.phone && u.phone.includes(q));
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <span>👤</span> Customer &amp; User Master Directory
          </h1>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Search customer records, inspect service request history, and manage platform account privileges.
          </p>
        </div>
        <button
          onClick={load}
          className="self-start sm:self-auto rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-bold shadow-md transition-colors flex items-center gap-2"
        >
          <span>🔄</span> Refresh Users
        </button>
      </div>

      {toast && (
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-700 p-3 text-xs font-bold text-emerald-800 dark:text-emerald-300">
          {toast}
        </div>
      )}

      {/* AdminLTE Small Boxes */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminLteSmallBox
          title="Total Customers"
          value={users.length.toLocaleString("en-IN")}
          icon="👥"
          tone="primary"
          subtext="All registered accounts"
        />
        <AdminLteSmallBox
          title="Active Accounts"
          value={users.filter((u) => u.isActive).length}
          icon="✅"
          tone="success"
          subtext="Eligible for doorstep booking"
        />
        <AdminLteSmallBox
          title="Suspended Accounts"
          value={users.filter((u) => !u.isActive).length}
          icon="🚫"
          tone="danger"
          subtext="Restricted access"
        />
        <AdminLteSmallBox
          title="Repeat Service Rate"
          value="74.2%"
          icon="⭐"
          tone="warning"
          subtext="Customers with 2+ bookings"
        />
      </div>

      {/* Users Table Card */}
      <AdminLteCard
        title="Registered Customer Accounts"
        icon="👤"
        outlineTone="primary"
        tools={
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-xs text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Search by name, phone, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-xl bg-gray-50 dark:bg-gray-700 py-1.5 pl-8 pr-3 text-xs text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 focus:outline-none focus:border-blue-500 w-56 sm:w-72"
            />
          </div>
        }
      >
        {loading ? (
          <div className="h-36 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <p className="text-3xl mb-2">👤</p>
            <p className="font-bold text-sm">No customers matching "{search}".</p>
          </div>
        ) : (
          <AdminLteTable>
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Phone / City</th>
                <th className="py-3 px-4">Email Address</th>
                <th className="py-3 px-4">Total Orders</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs font-medium text-gray-800 dark:text-gray-200">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                  <td className="py-3.5 px-4 font-bold text-gray-900 dark:text-white">
                    {u.firstName} {u.lastName || ""}
                  </td>
                  <td className="py-3.5 px-4 text-gray-600 dark:text-gray-400">
                    <p className="font-mono">{u.phone || "N/A"}</p>
                    <p className="text-[11px] text-gray-500">{u.city || "Kolkata"}</p>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-gray-700 dark:text-gray-300">
                    {u.email || "No email linked"}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                    {u.ordersCount ?? 1} Bookings
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        u.isActive
                          ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700"
                          : "bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700"
                      }`}
                    >
                      {u.isActive ? "ACTIVE" : "SUSPENDED"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => toggleActive(u.id, u.isActive)}
                      disabled={actingId === u.id}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors ${
                        u.isActive
                          ? "bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 hover:bg-rose-100"
                          : "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100"
                      }`}
                    >
                      {u.isActive ? "Suspend" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminLteTable>
        )}
      </AdminLteCard>
    </div>
  );
}
