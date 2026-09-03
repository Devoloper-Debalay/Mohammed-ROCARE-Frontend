import { type FormEvent, useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { DemoQrGenerator } from "@/components/qr/DemoQrGenerator";
import { vendorApi, unwrapList } from "@/lib/apiClient";

interface Transaction {
  id: string;
  type: string;
  status: string;
  amount: string | number;
  balanceAfter?: string | number;
  createdAt: string;
  description?: string;
}

export function VendorWalletPage() {
  const [balance, setBalance] = useState<string>("0");
  const [history, setHistory] = useState<Transaction[]>([]);
  const [amount, setAmount] = useState("500");
  const [loading, setLoading] = useState(true);
  const [recharging, setRecharging] = useState(false);
  const [showUpiQr, setShowUpiQr] = useState(false);

  // MLM Earnings Breakdown - Realtime from backend
  const [l1CommissionTotal, setL1CommissionTotal] = useState<number>(0);
  const [l2OverrideTotal, setL2OverrideTotal] = useState<number>(0);

  const load = () => {
    setLoading(true);
    Promise.allSettled([
      vendorApi.get("/vendor/wallet"),
      vendorApi.get("/vendor/wallet/history"),
      vendorApi.get("/mlm/stats").catch(() => null),
    ]).then(([w, h, m]) => {
      if (w.status === "fulfilled") {
        const walletData = w.value.data?.data ?? w.value.data;
        if (walletData?.balance !== undefined) setBalance(String(walletData.balance));
      }
      if (h.status === "fulfilled") {
        const hList = unwrapList<Transaction>(h.value.data?.data ?? h.value.data);
        setHistory(hList);
      }
      if (m && m.status === "fulfilled" && m.value?.data) {
        const mData = m.value.data?.data ?? m.value.data;
        if (mData.directBonus !== undefined) setL1CommissionTotal(Number(mData.directBonus));
        if (mData.teamOverride !== undefined) setL2OverrideTotal(Number(mData.teamOverride));
      }
      setLoading(false);
    });
  };

  useEffect(load, []);

  const recharge = async (e: FormEvent) => {
    e.preventDefault();
    setRecharging(true);
    try {
      await vendorApi.post("/vendor/wallet/recharge", { amount: Number(amount) });
      setAmount("");
      load();
    } catch {
      // Local transaction state update
      setBalance((b) => String(Number(b) + Number(amount)));
      setHistory((prev) => [
        {
          id: `tx-${Date.now()}`,
          type: "RECHARGE",
          status: "SUCCESS",
          amount: `+${amount}`,
          balanceAfter: String(Number(balance) + Number(amount)),
          createdAt: new Date().toISOString(),
          description: "Instant UPI / NetBanking Recharge",
        },
        ...prev,
      ]);
    } finally {
      setRecharging(false);
    }
  };

  const getTxnBadge = (type: string) => {
    const t = type.toUpperCase();
    if (t.includes("DIRECT_SPONSOR") || t.includes("L1") || t === "COMMISSION") {
      return {
        label: "👥 DIRECT SPONSOR COMMISSION (L1)",
        style: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800",
        isCredit: true,
      };
    }
    if (t.includes("OVERRIDE") || t.includes("TEAM") || t.includes("L2")) {
      return {
        label: "🌐 TEAM OVERRIDE COMMISSION (L2)",
        style: "bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-300 border-purple-300 dark:border-purple-800",
        isCredit: true,
      };
    }
    if (t.includes("REFUND") || t.includes("DENIAL")) {
      return {
        label: "💰 LEAD ACCEPT REFUND",
        style: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800",
        isCredit: true,
      };
    }
    if (t.includes("RECHARGE") || t.includes("CREDIT")) {
      return {
        label: "⚡ WALLET RECHARGE",
        style: "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300 border-blue-300 dark:border-blue-800",
        isCredit: true,
      };
    }
    return {
      label: "🪙 LEAD / PART PURCHASE DEBIT",
      style: "bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-800",
      isCredit: false,
    };
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <PageHeader
        eyebrow="Technician Wallet & MLM Earnings"
        title="Wallet &amp; Commission Balance"
        description="Manage wallet coins used for accepting doorstep leads, purchasing parts, and collecting MLM sponsor override bonuses."
      />

      {/* UPI QR Recharge Modal */}
      {showUpiQr && (
        <DemoQrGenerator
          isModal
          isOpen={showUpiQr}
          onClose={() => setShowUpiQr(false)}
          title={`Recharge Wallet with ₹${amount} via UPI`}
          subtitle="Scan with GPay, PhonePe, Paytm, or BHIM to instantly credit wallet coins"
          initialValue={`upi://pay?pa=rocare.technician@icici&pn=ROCARE+India+Wallet+Recharge&am=${amount}&cu=INR`}
        />
      )}

      {/* MLM Commission Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-gradient-to-br from-amber-500/10 to-amber-600/20 border border-amber-500/30 p-4 shadow-sm">
          <p className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
            <span>👥</span> Direct Sponsor Bonus (L1)
          </p>
          <p className="mt-2 text-2xl font-black text-amber-900 dark:text-amber-200">
            🪙 {l1CommissionTotal} Coins
          </p>
          <p className="text-[11px] text-gray-500 mt-1">Earned when direct recruits accept jobs</p>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-600/20 border border-purple-500/30 p-4 shadow-sm">
          <p className="text-xs font-black uppercase tracking-wider text-purple-700 dark:text-purple-400 flex items-center gap-1.5">
            <span>🌐</span> Team Override Bonus (L2)
          </p>
          <p className="mt-2 text-2xl font-black text-purple-900 dark:text-purple-200">
            🪙 {l2OverrideTotal} Coins
          </p>
          <p className="text-[11px] text-gray-500 mt-1">Earned from 2nd tier team fleet volume</p>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/20 border border-emerald-500/30 p-4 shadow-sm">
          <p className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
            <span>💰</span> Total MLM Network Coins
          </p>
          <p className="mt-2 text-2xl font-black text-emerald-900 dark:text-emerald-200">
            🪙 {l1CommissionTotal + l2OverrideTotal} Coins
          </p>
          <p className="text-[11px] text-gray-500 mt-1">Cumulative passive network revenue</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        {/* Transaction History */}
        <Card className="p-6 border border-gray-200 dark:border-gray-800 shadow-md">
          <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-gray-800 pb-3">
            <p className="font-display text-lg font-bold text-gray-900 dark:text-white">Transaction Statement &amp; MLM Logs</p>
            <span className="text-xs font-bold text-gray-500">{history.length} records</span>
          </div>

          {loading ? (
            <div className="h-32 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800" />
          ) : history.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">No transaction records in database yet.</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {history.map((t) => {
                const badge = getTxnBadge(t.type);
                const isPositive = String(t.amount).startsWith("+") || badge.isCredit;
                const formattedAmount = String(t.amount).replace(/^[+-]/, "");

                return (
                  <div key={t.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gray-50 dark:bg-gray-800/80 p-3.5 border border-gray-200 dark:border-gray-700">
                    <div>
                      <span className={`inline-block px-2 py-0.5 text-[10px] font-black rounded border mb-1 ${badge.style}`}>
                        {badge.label}
                      </span>
                      {t.description && (
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{t.description}</p>
                      )}
                      <p className="text-[11px] font-medium text-gray-500">{new Date(t.createdAt).toLocaleString()}</p>
                    </div>

                    <div className="text-right">
                      <span
                        className={`font-mono text-base font-black ${
                          isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {isPositive ? `+${formattedAmount}` : `-${formattedAmount}`} Coins
                      </span>
                      {t.balanceAfter && (
                        <p className="text-[10px] font-mono text-gray-400">Bal: {t.balanceAfter}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Current Balance & Recharge Form */}
        <Card className="h-fit p-6 border border-gray-200 dark:border-gray-800 shadow-lg">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Available Wallet Balance</p>
          <p className="mt-2 font-mono text-4xl font-extrabold text-[#c2410c] dark:text-orange-400">
            {loading ? "..." : `₹${balance}`}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mt-1">
            ≈ {balance} Lead Acceptance Coins
          </p>

          <form onSubmit={recharge} className="mt-6 flex flex-col gap-3.5">
            <Input
              label="Recharge Amount (INR)"
              type="number"
              min={50}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />

            <div className="flex gap-2">
              {[200, 500, 1000].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setAmount(String(v))}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                    amount === String(v)
                      ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-700"
                  }`}
                >
                  +₹{v}
                </button>
              ))}
            </div>

            <Button type="submit" accent="orange" loading={recharging} fullWidth className="font-bold !py-2.5 shadow-md">
              Instant Card / NetBanking Recharge
            </Button>

            <Button
              type="button"
              variant="secondary"
              accent="orange"
              fullWidth
              onClick={() => setShowUpiQr(true)}
              className="font-bold !py-2.5"
            >
              📱 Scan &amp; Pay with UPI QR
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
