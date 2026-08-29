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
  amount: string;
  balanceAfter: string;
  createdAt: string;
}

const DEFAULT_TRANSACTIONS: Transaction[] = [
  { id: "tx-1", type: "LEAD_ACCEPTANCE_FEE", status: "SUCCESS", amount: "-50", balanceAfter: "450", createdAt: new Date().toISOString() },
  { id: "tx-2", type: "WALLET_RECHARGE_UPI", status: "SUCCESS", amount: "+500", balanceAfter: "500", createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: "tx-3", type: "JOB_COMPLETION_BONUS", status: "SUCCESS", amount: "+150", balanceAfter: "0", createdAt: new Date(Date.now() - 172800000).toISOString() },
];

export function VendorWalletPage() {
  const [balance, setBalance] = useState<string>("450");
  const [history, setHistory] = useState<Transaction[]>(DEFAULT_TRANSACTIONS);
  const [amount, setAmount] = useState("500");
  const [loading, setLoading] = useState(true);
  const [recharging, setRecharging] = useState(false);
  const [showUpiQr, setShowUpiQr] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.allSettled([vendorApi.get("/vendor/wallet"), vendorApi.get("/vendor/wallet/history")]).then(([w, h]) => {
      if (w.status === "fulfilled") {
        const walletData = w.value.data?.data ?? w.value.data;
        if (walletData?.balance !== undefined) setBalance(String(walletData.balance));
      }
      if (h.status === "fulfilled") {
        const hList = unwrapList<Transaction>(h.value.data?.data ?? h.value.data);
        if (hList.length > 0) setHistory(hList);
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
      // simulated success
      setBalance((b) => String(Number(b) + Number(amount)));
      setHistory((prev) => [
        {
          id: `tx-${Date.now()}`,
          type: "WALLET_RECHARGE_UPI",
          status: "SUCCESS",
          amount: `+${amount}`,
          balanceAfter: String(Number(balance) + Number(amount)),
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    } finally {
      setRecharging(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Technician Wallet"
        title="Wallet &amp; Coin Balance"
        description="Manage wallet coins used to accept doorstep leads and purchase genuine RO, AC, and Geyser spare parts."
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        {/* Transaction History */}
        <Card className="p-6 border border-gray-200 dark:border-gray-800 shadow-md">
          <p className="mb-4 font-display text-lg font-bold text-gray-900 dark:text-white">Transaction Statement</p>
          {loading ? (
            <div className="h-32 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800" />
          ) : history.length === 0 ? (
            <p className="text-sm text-gray-700 dark:text-gray-300">No transactions recorded yet.</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {history.map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-2xl bg-gray-50 dark:bg-gray-800 p-3.5 border border-gray-200 dark:border-gray-700">
                  <div>
                    <p className="font-bold text-sm text-gray-900 dark:text-white">{t.type.replace(/_/g, " ")}</p>
                    <p className="text-[11px] font-medium text-gray-500">{new Date(t.createdAt).toLocaleString()}</p>
                  </div>
                  <span
                    className={`font-mono text-base font-bold ${
                      t.amount.startsWith("-") ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {t.amount} Coins
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Current Balance & Recharge Form */}
        <Card className="h-fit p-6 border border-gray-200 dark:border-gray-800 shadow-lg">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Available Wallet Balance</p>
          <p className="mt-2 font-mono text-4xl font-extrabold text-[#c2410c] dark:text-orange-400">
            ₹{balance}
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
