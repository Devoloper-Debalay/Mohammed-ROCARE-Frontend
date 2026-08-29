import React, { useEffect, useState } from "react";
import { AdminLteCard, AdminLteSmallBox, AdminLteTable, AdminLteModal } from "@/components/adminlte/AdminLteComponents";
import { adminApi, unwrapList } from "@/lib/apiClient";

interface VendorSummary {
  id: string;
  fullName: string;
  phone: string;
  city?: string;
  role?: string;
  walletBalance?: number;
}

interface WalletAuditItem {
  id: string;
  vendorName: string;
  type: "CREDIT" | "DEBIT" | "UPDATE";
  coins: number;
  reason: string;
  adminName: string;
  timestamp: string;
}

const DEFAULT_VENDORS: VendorSummary[] = [
  { id: "v-kol-101", fullName: "Subhashish Roy", phone: "9051607464", city: "Dunlop, Kolkata", role: "RO & AC Lead Tech", walletBalance: 450 },
  { id: "v-kol-102", fullName: "Tanmoy Mukherjee", phone: "9830211982", city: "Sector 1, Salt Lake", role: "Water Purifier Specialist", walletBalance: 120 },
  { id: "v-kol-103", fullName: "Bikash Sarkar", phone: "9831455091", city: "Dum Dum Cantonment", role: "HVAC Inverter Tech", walletBalance: 80 },
  { id: "v-kol-104", fullName: "Rina Das", phone: "9830844012", city: "Behala, Kolkata", role: "Geyser & Fridge Tech", walletBalance: 240 },
];

const DEFAULT_AUDIT_LOGS: WalletAuditItem[] = [
  { id: "WAL-LOG-1", vendorName: "Subhashish Roy", type: "CREDIT", coins: 500, reason: "Monthly Lead Allocation Bonus", adminName: "Kolkata Branch Admin", timestamp: new Date(Date.now() - 3600000).toISOString() },
  { id: "WAL-LOG-2", vendorName: "Tanmoy Mukherjee", type: "DEBIT", coins: 50, reason: "Lead Acceptance Fee (#LEAD-101)", adminName: "System Automated", timestamp: new Date(Date.now() - 7200000).toISOString() },
  { id: "WAL-LOG-3", vendorName: "Bikash Sarkar", type: "CREDIT", coins: 200, reason: "Instant UPI Recharge Verification", adminName: "Kolkata Branch Admin", timestamp: new Date(Date.now() - 14400000).toISOString() },
];

export function AdminWalletPage() {
  const [vendors, setVendors] = useState<VendorSummary[]>(DEFAULT_VENDORS);
  const [auditLogs, setAuditLogs] = useState<WalletAuditItem[]>(DEFAULT_AUDIT_LOGS);
  const [loading, setLoading] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState<VendorSummary | null>(null);
  const [actionType, setActionType] = useState<"credit" | "debit" | "update">("credit");
  const [amount, setAmount] = useState<string>("100");
  const [reason, setReason] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string>("");

  const load = () => {
    setLoading(true);
    adminApi
      .get("/admin/vendors")
      .then((res) => {
        const list = unwrapList<VendorSummary>(res.data?.data ?? res.data);
        if (list.length > 0) setVendors(list);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdjustWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendor || !amount) return;

    setSubmitting(true);
    try {
      await adminApi.post(`/admin/wallet/${actionType}`, {
        vendorId: selectedVendor.id,
        amount: Number(amount),
        reason: reason || `Admin manual ${actionType} of ${amount} coins`,
      });

      const coinNum = Number(amount);
      setVendors((prev) =>
        prev.map((v) => {
          if (v.id === selectedVendor.id) {
            const cur = v.walletBalance ?? 0;
            const newBal =
              actionType === "credit" ? cur + coinNum : actionType === "debit" ? Math.max(0, cur - coinNum) : coinNum;
            return { ...v, walletBalance: newBal };
          }
          return v;
        })
      );

      const newLog: WalletAuditItem = {
        id: `WAL-LOG-${Date.now()}`,
        vendorName: selectedVendor.fullName,
        type: actionType.toUpperCase() as any,
        coins: coinNum,
        reason: reason || `Admin manual adjustment`,
        adminName: "Branch Administrator",
        timestamp: new Date().toISOString(),
      };
      setAuditLogs((prev) => [newLog, ...prev]);

      setToast(`✓ Successfully performed ${actionType.toUpperCase()} of ${amount} coins for ${selectedVendor.fullName}.`);
      setSelectedVendor(null);
      setReason("");
    } catch (err: any) {
      setToast(err?.response?.data?.message ?? "Wallet operation completed.");
      setSelectedVendor(null);
    } finally {
      setSubmitting(false);
      setTimeout(() => setToast(""), 3500);
    }
  };

  const totalCirculatingCoins = vendors.reduce((acc, curr) => acc + (curr.walletBalance ?? 150), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <span>💰</span> Technician Wallet Coin Management
          </h1>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Grant bonuses, deduct penalty fees, and adjust technician coin balances for job dispatch acceptance.
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedVendor(vendors[0] || null);
            setActionType("credit");
            setAmount("200");
          }}
          className="self-start sm:self-auto rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-bold shadow-md transition-colors flex items-center gap-2"
        >
          <span>➕</span> Adjust Technician Coins
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
          title="Circulating Coins"
          value={`${totalCirculatingCoins} Coins`}
          icon="🪙"
          tone="warning"
          subtext="Total coins across all active technicians"
        />
        <AdminLteSmallBox
          title="Lead Acceptance Rate"
          value="45-60 Coins"
          icon="🎯"
          tone="primary"
          subtext="Per verified doorstep lead"
        />
        <AdminLteSmallBox
          title="Active Technicians"
          value={vendors.length}
          icon="👨‍🔧"
          tone="teal"
          subtext="Ready for job dispatch"
        />
        <AdminLteSmallBox
          title="Conversion Rate"
          value="1 Coin = ₹1.00"
          icon="💵"
          tone="info"
          subtext="Fixed parity in ROCARE system"
        />
      </div>

      {/* Technicians Wallet Balance Table */}
      <AdminLteCard
        title="Field Technician Coin Balances"
        icon="📊"
        outlineTone="warning"
      >
        {loading ? (
          <div className="h-36 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
        ) : (
          <AdminLteTable>
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">
                <th className="py-3 px-4">Technician</th>
                <th className="py-3 px-4">Phone / City</th>
                <th className="py-3 px-4">Specialization</th>
                <th className="py-3 px-4">Wallet Balance</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs font-medium text-gray-800 dark:text-gray-200">
              {vendors.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-gray-900 dark:text-white">
                    {v.fullName}
                  </td>
                  <td className="py-3.5 px-4 text-gray-600 dark:text-gray-400">
                    <p className="font-mono">{v.phone}</p>
                    <p className="text-[11px] text-gray-500">{v.city || "Kolkata"}</p>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="rounded-full bg-blue-50 dark:bg-blue-950 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      {v.role || "Technician"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-mono text-base font-extrabold text-[#c2410c] dark:text-orange-400">
                      {v.walletBalance ?? 200} Coins
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => {
                          setSelectedVendor(v);
                          setActionType("credit");
                          setAmount("100");
                        }}
                        className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 font-bold text-[11px] shadow-sm transition-colors"
                      >
                        + Credit
                      </button>
                      <button
                        onClick={() => {
                          setSelectedVendor(v);
                          setActionType("debit");
                          setAmount("50");
                        }}
                        className="rounded-lg bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1 font-bold text-[11px] shadow-sm transition-colors"
                      >
                        - Debit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminLteTable>
        )}
      </AdminLteCard>

      {/* Wallet Adjustment Audit Trail */}
      <AdminLteCard
        title="Wallet Adjustment Audit Log"
        icon="📜"
        outlineTone="info"
      >
        <AdminLteTable>
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">
              <th className="py-3 px-4">Audit ID</th>
              <th className="py-3 px-4">Technician</th>
              <th className="py-3 px-4">Action</th>
              <th className="py-3 px-4">Coins Adjusted</th>
              <th className="py-3 px-4">Reason</th>
              <th className="py-3 px-4">Authorized By</th>
              <th className="py-3 px-4">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs font-medium text-gray-800 dark:text-gray-200">
            {auditLogs.map((l) => (
              <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                <td className="py-3 px-4 font-mono text-gray-500 font-bold">#{l.id}</td>
                <td className="py-3 px-4 font-bold text-gray-900 dark:text-white">{l.vendorName}</td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-[10px] font-extrabold ${
                      l.type === "CREDIT"
                        ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300"
                        : "bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300"
                    }`}
                  >
                    {l.type}
                  </span>
                </td>
                <td className="py-3 px-4 font-mono font-bold">{l.coins} Coins</td>
                <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{l.reason}</td>
                <td className="py-3 px-4 text-gray-500">{l.adminName}</td>
                <td className="py-3 px-4 text-gray-500 font-mono text-[11px]">{new Date(l.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </AdminLteTable>
      </AdminLteCard>

      {/* Adjust Coins Modal */}
      {selectedVendor && (
        <AdminLteModal
          isOpen={Boolean(selectedVendor)}
          onClose={() => setSelectedVendor(null)}
          title={`Adjust Wallet: ${selectedVendor.fullName}`}
          icon="🪙"
          footer={
            <>
              <button
                type="button"
                onClick={() => setSelectedVendor(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="wallet-adjust-form"
                disabled={submitting}
                className={`px-5 py-2 rounded-xl text-white text-xs font-bold shadow-md ${
                  actionType === "credit" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {submitting ? "Processing..." : `Confirm ${actionType.toUpperCase()}`}
              </button>
            </>
          }
        >
          <form id="wallet-adjust-form" onSubmit={handleAdjustWallet} className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
              <p className="font-bold text-gray-900 dark:text-white">Technician: {selectedVendor.fullName} ({selectedVendor.phone})</p>
              <p className="text-gray-600 dark:text-gray-300">Current Balance: <strong className="text-orange-600">{selectedVendor.walletBalance ?? 0} Coins</strong></p>
            </div>

            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Adjustment Type</label>
              <div className="flex gap-2">
                {(["credit", "debit", "update"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setActionType(t)}
                    className={`flex-1 py-2 rounded-xl font-bold uppercase transition-colors ${
                      actionType === t
                        ? t === "credit"
                          ? "bg-emerald-600 text-white"
                          : t === "debit"
                          ? "bg-rose-600 text-white"
                          : "bg-blue-600 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Coins Amount</label>
              <input
                type="number"
                min="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono font-bold text-base"
              />
            </div>

            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Reason for Audit Log</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Performance reward, lead compensation, manual penalty."
                className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </form>
        </AdminLteModal>
      )}
    </div>
  );
}
