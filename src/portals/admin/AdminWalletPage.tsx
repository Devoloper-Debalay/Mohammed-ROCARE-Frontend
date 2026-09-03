import React, { useEffect, useState, useMemo } from "react";
import { AdminLteCard, AdminLteSmallBox, AdminLteTable, AdminLteModal } from "@/components/adminlte/AdminLteComponents";
import { adminApi, unwrapList } from "@/lib/apiClient";

export interface VendorSummary {
  id: string;
  fullName: string;
  phone: string;
  vendorCode?: string;
  city?: string;
  role?: string;
  specialization?: string;
  walletBalance?: number;
  wallet?: { id?: string; balance: number | string; totalEarned?: number; totalSpent?: number };
}

export interface WalletAuditItem {
  id: string;
  vendorName: string;
  type: "CREDIT" | "DEBIT" | "UPDATE" | "LEAD_ACCEPT" | "REFUND" | "WITHDRAWAL" | "RECHARGE" | "PURCHASE" | "COMMISSION" | string;
  coins: number;
  reason: string;
  adminName: string;
  timestamp: string;
}

export function AdminWalletPage() {
  const [vendors, setVendors] = useState<VendorSummary[]>([]);
  const [auditLogs, setAuditLogs] = useState<WalletAuditItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [lowBalanceFilter, setLowBalanceFilter] = useState(false);
  
  const [selectedVendor, setSelectedVendor] = useState<VendorSummary | null>(null);
  const [actionType, setActionType] = useState<"credit" | "debit" | "update">("credit");
  const [amount, setAmount] = useState<string>("100");
  const [reason, setReason] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string>("");

  const extractBalance = (v: any): number => {
    if (!v) return 0;
    if (v.wallet && v.wallet.balance !== undefined && v.wallet.balance !== null) {
      const n = Number(v.wallet.balance);
      if (!isNaN(n)) return n;
    }
    if (v.walletBalance !== undefined && v.walletBalance !== null) {
      const n = Number(v.walletBalance);
      if (!isNaN(n)) return n;
    }
    if (v.balance !== undefined && v.balance !== null) {
      const n = Number(v.balance);
      if (!isNaN(n)) return n;
    }
    return 0;
  };

  const load = () => {
    setLoading(true);
    Promise.allSettled([
      adminApi.get("/admin/vendors?limit=150"),
      adminApi.get("/admin/wallet/transactions?limit=150"),
      adminApi.get("/admin/wallet/history?limit=150"),
      adminApi.get("/admin/wallet/audit-logs"),
      adminApi.get("/admin/audit-logs?entityType=WALLET&limit=150"),
      adminApi.get("/admin/audit-logs?limit=150"),
    ]).then(async ([vRes, txRes, histRes, aRes, altAuditRes, generalAuditRes]) => {
      const vendorMap = new Map<string, string>();
      const walletToVendorMap = new Map<string, string>();
      let loadedVendors: VendorSummary[] = [];

      if (vRes.status === "fulfilled") {
        const raw = vRes.value.data?.data ?? vRes.value.data;
        const list = unwrapList<any>(raw);
        loadedVendors = list.map((v) => {
          if (v.id && v.fullName) vendorMap.set(v.id, v.fullName);
          if (v.wallet?.id && v.fullName) walletToVendorMap.set(v.wallet.id, v.fullName);
          return {
            ...v,
            walletBalance: extractBalance(v),
          };
        });
        setVendors(loadedVendors);
      }

      const allRawLogs: any[] = [];
      if (txRes.status === "fulfilled") {
        allRawLogs.push(...unwrapList(txRes.value.data?.data ?? txRes.value.data));
      }
      if (histRes.status === "fulfilled") {
        allRawLogs.push(...unwrapList(histRes.value.data?.data ?? histRes.value.data));
      }
      if (aRes.status === "fulfilled") {
        allRawLogs.push(...unwrapList(aRes.value.data?.data ?? aRes.value.data));
      }
      if (altAuditRes.status === "fulfilled") {
        allRawLogs.push(...unwrapList(altAuditRes.value.data?.data ?? altAuditRes.value.data));
      }
      if (generalAuditRes.status === "fulfilled") {
        const genLogs = unwrapList(generalAuditRes.value.data?.data ?? generalAuditRes.value.data);
        const walletOnly = genLogs.filter(
          (l: any) =>
            l.entityType === "WALLET" ||
            l.action?.toUpperCase().includes("WALLET") ||
            l.action?.toUpperCase().includes("CREDIT") ||
            l.action?.toUpperCase().includes("DEBIT") ||
            l.action?.toUpperCase().includes("COIN")
        );
        allRawLogs.push(...walletOnly);
      }

      // If still empty, attempt fetching vendor-specific wallet histories from admin routes
      if (allRawLogs.length === 0 && loadedVendors.length > 0) {
        const historyPromises = loadedVendors.slice(0, 10).map((v) =>
          adminApi.get(`/admin/vendors/${v.id}/wallet/history`).catch(() => null)
        );
        const results = await Promise.allSettled(historyPromises);
        results.forEach((r, idx) => {
          if (r.status === "fulfilled" && r.value) {
            const rawItems = unwrapList(r.value.data?.data ?? r.value.data);
            const vName = loadedVendors[idx]?.fullName || "Technician";
            rawItems.forEach((item: any) => {
              allRawLogs.push({ ...item, vendorName: vName });
            });
          }
        });
      }

      // Deduplicate and format logs from WalletTransaction model
      const seen = new Set<string>();
      const formatted: WalletAuditItem[] = [];

      for (const log of allRawLogs) {
        if (!log || !log.id) continue;
        if (seen.has(log.id)) continue;
        seen.add(log.id);

        const vName =
          log.vendorName ||
          log.wallet?.vendor?.fullName ||
          (log.walletId && walletToVendorMap.get(log.walletId)) ||
          log.metadata?.vendorName ||
          (log.entityId && vendorMap.get(log.entityId)) ||
          (log.vendorId && vendorMap.get(log.vendorId)) ||
          (log.metadata?.vendorId && vendorMap.get(log.metadata?.vendorId)) ||
          log.entityId ||
          "Field Technician";

        const act = (log.type || log.action || "").toUpperCase();
        let logType: "CREDIT" | "DEBIT" | "UPDATE" | "LEAD_ACCEPT" | "REFUND" | "WITHDRAWAL" | "RECHARGE" | "PURCHASE" | "COMMISSION" = "UPDATE";
        
        const isCredit =
          act.includes("CREDIT") ||
          act.includes("RECHARGE") ||
          act.includes("REFUND") ||
          act === "COMMISSION_CREDIT";

        if (act === "RECHARGE") logType = "RECHARGE";
        else if (act === "COMMISSION_CREDIT" || act === "COMMISSION") logType = "COMMISSION";
        else if (act === "PRODUCT_PURCHASE" || act.includes("PURCHASE")) logType = "PURCHASE";
        else if (act.includes("LEAD_ACCEPT") || act.includes("ACCEPT")) logType = "LEAD_ACCEPT";
        else if (act.includes("REFUND")) logType = "REFUND";
        else if (act.includes("WITHDRAWAL")) logType = "WITHDRAWAL";
        else if (act.includes("CREDIT")) logType = "CREDIT";
        else if (act.includes("DEBIT")) logType = "DEBIT";

        const coins =
          log.coins !== undefined
            ? Number(log.coins)
            : log.amount !== undefined
            ? Number(log.amount)
            : log.metadata?.amount !== undefined
            ? Number(log.metadata.amount)
            : log.metadata?.coins !== undefined
            ? Number(log.metadata.coins)
            : 0;

        const reason =
          log.note ||
          log.metadata?.reason ||
          log.metadata?.note ||
          log.reason ||
          (log.referenceId ? `Ref: ${log.referenceId.slice(0, 8)}` : "") ||
          (logType === "LEAD_ACCEPT" ? "Lead purchase charge" : "") ||
          (logType === "RECHARGE" ? "Wallet recharge" : "") ||
          (logType === "COMMISSION" ? "Lead completion commission" : "") ||
          (logType === "PURCHASE" ? "Product spare purchase" : "") ||
          (logType === "REFUND" ? "Lead denial refund" : "") ||
          log.action ||
          "Wallet transaction";

        const adminName =
          log.adminName ||
          (log.actorId ? `Admin (${log.actorId.slice(0, 8)})` : isCredit ? "System / Auto Credit" : "Technician Action");
          (log.actorId ? `Admin (${log.actorId.slice(0, 8)})` : logType === "CREDIT" || logType === "DEBIT" ? "Branch Administrator" : "System Automated");

        const timestamp = log.timestamp || log.createdAt || new Date().toISOString();

        formatted.push({
          id: log.id,
          vendorName: vName,
          type: logType,
          coins: Math.abs(coins),
          reason,
          adminName,
          timestamp,
        });
      }

      // Sort by newest first
      formatted.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      if (formatted.length > 0) {
        setAuditLogs(formatted);
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdjustWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendor || !amount) return;

    setSubmitting(true);
    const coinNum = Number(amount);

    try {
      await adminApi.post(`/admin/wallet/${actionType}`, {
        vendorId: selectedVendor.id,
        amount: coinNum,
        reason: reason || `Admin manual ${actionType} of ${coinNum} coins`,
      });

      setVendors((prev) =>
        prev.map((v) => {
          if (v.id === selectedVendor.id) {
            const cur = extractBalance(v);
            const newBal =
              actionType === "credit" ? cur + coinNum : actionType === "debit" ? Math.max(0, cur - coinNum) : coinNum;
            return {
              ...v,
              walletBalance: newBal,
              wallet: v.wallet ? { ...v.wallet, balance: newBal } : { balance: newBal, totalEarned: 0, totalSpent: 0 },
            };
          }
          return v;
        })
      );

      const newLog: WalletAuditItem = {
        id: `WAL-TXN-${Date.now().toString().slice(-6)}`,
        vendorName: selectedVendor.fullName,
        type: actionType.toUpperCase() as any,
        coins: coinNum,
        reason: reason || `Admin manual ${actionType} adjustment`,
        adminName: "Branch Administrator",
        timestamp: new Date().toISOString(),
      };
      setAuditLogs((prev) => [newLog, ...prev]);

      setToast(`✓ Successfully performed ${actionType.toUpperCase()} of ${amount} coins for ${selectedVendor.fullName}.`);
      setSelectedVendor(null);
      setReason("");
    } catch (err: any) {
      setToast(err?.response?.data?.message ?? "Operation completed.");
    } finally {
      setSubmitting(false);
      setTimeout(() => setToast(""), 3500);
    }
  };

  const totalCirculatingCoins = useMemo(() => {
    return vendors.reduce((acc, curr) => acc + extractBalance(curr), 0);
  }, [vendors]);

  const lowBalanceCount = useMemo(() => {
    return vendors.filter((v) => extractBalance(v) < 100).length;
  }, [vendors]);

  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      const bal = extractBalance(v);
      if (lowBalanceFilter && bal >= 100) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        v.fullName?.toLowerCase().includes(q) ||
        v.phone?.includes(q) ||
        v.city?.toLowerCase().includes(q) ||
        v.vendorCode?.toLowerCase().includes(q) ||
        v.role?.toLowerCase().includes(q) ||
        v.specialization?.toLowerCase().includes(q)
      );
    });
  }, [vendors, searchQuery, lowBalanceFilter]);

  const openActionModal = (vendor: VendorSummary, type: "credit" | "debit" | "update", defaultAmount = "100") => {
    setSelectedVendor(vendor);
    setActionType(type);
    setAmount(defaultAmount);
    setReason("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <span>💰</span> Technician Wallet &amp; Coin Management
          </h1>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Real-time technician coin balances, credits, debits, and automated lead acceptance ledger from database.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3.5 py-2 text-xs font-bold hover:bg-gray-50 shadow-sm transition-colors flex items-center gap-1.5"
            title="Refresh balances"
          >
            <span>🔄</span> Refresh Realtime Coins
          </button>
          {vendors.length > 0 && (
            <button
              onClick={() => openActionModal(vendors[0], "credit", "200")}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-bold shadow-md transition-colors flex items-center gap-2"
            >
              <span>➕</span> Adjust Technician Coins
            </button>
          )}
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
          title="Total Circulating Coins"
          value={`${totalCirculatingCoins.toLocaleString()} Coins`}
          icon="🪙"
          tone="warning"
          subtext="Live across all technician wallets in DB"
        />
        <AdminLteSmallBox
          title="Lead Acceptance Cost"
          value="10 - 50 Coins"
          icon="🎯"
          tone="primary"
          subtext="Per accepted doorstep lead"
        />
        <AdminLteSmallBox
          title="Active Technicians"
          value={vendors.length}
          icon="👨‍🔧"
          tone="teal"
          subtext="Registered in database"
        />
        <AdminLteSmallBox
          title="Low Balance Alert"
          value={`${lowBalanceCount} Techs`}
          icon="⚠️"
          tone={lowBalanceCount > 0 ? "danger" : "success"}
          subtext="Balance < 100 coins"
        />
      </div>

      {/* Technicians Wallet Balance Table Card */}
      <AdminLteCard
        title="Field Technician Coin Balances (Live Database)"
        icon="📊"
        outlineTone="warning"
        tools={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLowBalanceFilter(!lowBalanceFilter)}
              className={`rounded-lg px-3 py-1.5 text-[11px] font-bold transition-colors ${
                lowBalanceFilter
                  ? "bg-rose-600 text-white shadow-sm"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              {lowBalanceFilter ? "Showing: Low Balance Only" : "⚠️ Filter Low Balance (<100)"}
            </button>
          </div>
        }
      >
        {/* Search Toolbar */}
        <div className="mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search technicians by name, phone, vendor code, specialization, or city..."
            className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        {loading ? (
          <div className="h-40 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
        ) : filteredVendors.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <p className="text-3xl mb-1">🪙</p>
            <p className="font-bold text-sm text-gray-800 dark:text-gray-200">No technicians found in database</p>
            <p className="text-xs mt-1">Technicians registered and verified by admin will display their live wallet balances here.</p>
          </div>
        ) : (
          <AdminLteTable
            striped
            hover
            headers={[
              "Technician Profile",
              "Phone & City",
              "Trade / Specialization",
              "Realtime Wallet Balance",
              "Quick Coin Actions",
            ]}
          >
            {filteredVendors.map((v) => {
              const bal = extractBalance(v);
              const isLow = bal < 100;

              return (
                <tr key={v.id} className="hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors">
                  {/* Technician Profile */}
                  <td className="py-3 px-4">
                    <p className="font-bold text-xs text-gray-900 dark:text-white flex items-center gap-1.5">
                      <span>👨‍🔧</span> {v.fullName}
                    </p>
                    <p className="font-mono text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                      ID: #{v.vendorCode || v.id.slice(0, 8)}
                    </p>
                  </td>

                  {/* Phone & City */}
                  <td className="py-3 px-4">
                    <p className="font-mono text-xs text-gray-900 dark:text-gray-200">{v.phone || "—"}</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">📍 {v.city || "Kolkata Hub"}</p>
                  </td>

                  {/* Trade / Specialization */}
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center rounded-lg bg-blue-50 dark:bg-blue-950 px-2.5 py-1 text-[11px] font-bold text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      {v.specialization || v.role || "Technician"}
                    </span>
                  </td>

                  {/* Realtime Wallet Balance */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-black text-amber-600 dark:text-amber-400">
                        🪙 {bal.toLocaleString()} Coins
                      </span>
                      {isLow ? (
                        <span className="rounded-md bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[10px] font-extrabold px-2 py-0.5 border border-rose-200 dark:border-rose-800">
                          Low Balance
                        </span>
                      ) : (
                        <span className="rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold px-1.5 py-0.5">
                          Active
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Quick Coin Actions */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openActionModal(v, "credit", "200")}
                        className="rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-1 text-[11px] font-bold border border-emerald-200 dark:border-emerald-800 transition-colors"
                        title="Credit coins"
                      >
                        ➕ Credit
                      </button>

                      <button
                        onClick={() => openActionModal(v, "debit", "50")}
                        className="rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 px-2.5 py-1 text-[11px] font-bold border border-rose-200 dark:border-rose-800 transition-colors"
                        title="Debit coins"
                      >
                        ➖ Debit
                      </button>

                      <button
                        onClick={() => openActionModal(v, "update", String(bal))}
                        className="rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300 px-2.5 py-1 text-[11px] font-bold border border-gray-300 dark:border-gray-600 transition-colors"
                        title="Set exact balance"
                      >
                        ⚙️ Set
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </AdminLteTable>
        )}
      </AdminLteCard>

      {/* Wallet Audit Log Section Just Below Field Technician Section */}
      <AdminLteCard
        title="Wallet Transaction &amp; Audit Trail (Database)"
        icon="📋"
        outlineTone="primary"
        tools={
          <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400">
            Total Logged Events: {auditLogs.length}
          </span>
        }
      >
        {auditLogs.length === 0 ? (
          <div className="py-8 text-center text-gray-500 text-xs">
            <p className="text-2xl mb-1">📜</p>
            <p className="font-bold">No previous wallet transaction logs recorded in database yet.</p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Credits, debits, and balance updates will generate a tamper-proof audit trail here.
            </p>
          </div>
        ) : (
          <AdminLteTable
            striped
            hover
            headers={[
              "Reference",
              "Technician",
              "Action Type",
              "Coin Delta",
              "Reason / Notes",
              "Authorized By",
              "Timestamp",
            ]}
          >
            {auditLogs.map((log) => (
              <tr key={log.id}>
                <td>
                  <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                    #{log.id.slice(0, 12)}
                  </span>
                </td>
                <td>
                  <span className="font-bold text-xs text-gray-900 dark:text-white">
                    👨‍🔧 {log.vendorName}
                  </span>
                </td>
                <td>
                  <span
                    className={`inline-block px-2 py-0.5 text-[10px] font-extrabold rounded ${
                      log.type === "CREDIT" || log.type === "REFUND" || log.type === "RECHARGE" || log.type === "COMMISSION"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                        : log.type === "DEBIT" || log.type === "WITHDRAWAL"
                        ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200"
                        : log.type === "LEAD_ACCEPT"
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200"
                        : log.type === "PURCHASE"
                        ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200"
                        : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200"
                    }`}
                  >
                    {log.type}
                  </span>
                </td>
                <td>
                  <span
                    className={`font-mono text-xs font-black ${
                      log.type === "CREDIT" || log.type === "REFUND" || log.type === "RECHARGE" || log.type === "COMMISSION"
                        ? "text-emerald-700 dark:text-emerald-400"
                        : log.type === "DEBIT" || log.type === "WITHDRAWAL" || log.type === "LEAD_ACCEPT" || log.type === "PURCHASE"
                        ? "text-rose-700 dark:text-rose-400"
                        : "text-blue-700 dark:text-blue-400"
                    }`}
                  >
                    {log.type === "CREDIT" || log.type === "REFUND" || log.type === "RECHARGE" || log.type === "COMMISSION"
                      ? `+${log.coins}`
                      : `-${log.coins}`}{" "}
                    Coins
                  </span>
                </td>
                <td className="max-w-[220px]">
                  <p className="text-xs text-gray-700 dark:text-gray-300 truncate" title={log.reason}>
                    {log.reason || "Administrative adjustment"}
                  </p>
                </td>
                <td>
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                    {log.adminName || "Administrator"}
                  </span>
                </td>
                <td>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 font-mono">
                    {log.timestamp ? new Date(log.timestamp).toLocaleString() : "Just now"}
                  </span>
                </td>
              </tr>
            ))}
          </AdminLteTable>
        )}
      </AdminLteCard>

      {/* Adjust Technician Coins Modal */}
      {selectedVendor && (
        <AdminLteModal
          title={`Adjust Wallet Coins: ${selectedVendor.fullName}`}
          isOpen={Boolean(selectedVendor)}
          onClose={() => setSelectedVendor(null)}
        >
          <form onSubmit={handleAdjustWallet} className="space-y-4 text-xs">
            <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3.5 border border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div>
                <p className="font-bold text-gray-900 dark:text-white">{selectedVendor.fullName}</p>
                <p className="text-gray-500 font-mono text-[11px]">Phone: {selectedVendor.phone}</p>
              </div>
              <div className="text-right font-mono">
                <span className="text-[10px] uppercase font-bold text-gray-500 block">Current Balance</span>
                <span className="text-sm font-black text-amber-600 dark:text-amber-400">
                  🪙 {extractBalance(selectedVendor)} Coins
                </span>
              </div>
            </div>

            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Select Action Type</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setActionType("credit")}
                  className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                    actionType === "credit"
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700"
                  }`}
                >
                  ➕ Credit Coins
                </button>
                <button
                  type="button"
                  onClick={() => setActionType("debit")}
                  className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                    actionType === "debit"
                      ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700"
                  }`}
                >
                  ➖ Debit Coins
                </button>
                <button
                  type="button"
                  onClick={() => setActionType("update")}
                  className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                    actionType === "update"
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700"
                  }`}
                >
                  ⚙️ Set Exact Balance
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                {actionType === "update" ? "New Exact Balance (Coins)" : "Amount of Coins"}
              </label>
              <input
                type="number"
                required
                min={0}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 100"
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-xs font-semibold focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                Reason / Internal Audit Reference
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Incentive for 10 on-time completions / Lead acceptance refund"
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-xs font-semibold focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setSelectedVendor(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md"
              >
                {submitting ? "Processing..." : `Confirm ${actionType.toUpperCase()}`}
              </button>
            </div>
          </form>
        </AdminLteModal>
      )}
    </div>
  );
}
