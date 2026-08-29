import { type FormEvent, useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { vendorApi, unwrapList } from "@/lib/apiClient";

interface Transaction {
  id: string;
  type: string;
  status: string;
  amount: string;
  balanceAfter: string;
  createdAt: string;
}

export function VendorWalletPage() {
  const [balance, setBalance] = useState<string | null>(null);
  const [history, setHistory] = useState<Transaction[]>([]);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [recharging, setRecharging] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.allSettled([vendorApi.get("/vendor/wallet"), vendorApi.get("/vendor/wallet/history")]).then(([w, h]) => {
      if (w.status === "fulfilled") {
        const walletData = w.value.data?.data ?? w.value.data;
        setBalance(walletData?.balance !== undefined ? String(walletData.balance) : "0");
      }
      if (h.status === "fulfilled") {
        setHistory(unwrapList<Transaction>(h.value.data?.data ?? h.value.data));
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
    } finally {
      setRecharging(false);
    }
  };

  return (
    <div>
      <PageHeader eyebrow="Wallet" title="Wallet" description="Coins you use to accept leads and buy products." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="p-5">
          <p className="mb-4 font-display text-lg font-semibold text-ink">Recent transactions</p>
          {loading ? (
            <div className="h-32 animate-pulse rounded-xl bg-ink/[0.04]" />
          ) : history.length === 0 ? (
            <p className="text-sm text-ink-soft/70">No transactions yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {history.map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-xl bg-base px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium text-ink">{t.type.replaceAll("_", " ")}</p>
                    <p className="text-xs text-ink-soft/50">{new Date(t.createdAt).toLocaleString()}</p>
                  </div>
                  <span className="font-mono font-semibold text-ink">₹{t.amount}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="h-fit p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-soft/60">Current balance</p>
          <p className="mt-2 font-mono text-3xl font-semibold text-ink">{loading ? "—" : `₹${balance}`}</p>
          <form onSubmit={recharge} className="mt-5 flex flex-col gap-3">
            <Input label="Recharge amount" type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} required />
            <Button type="submit" accent="orange" loading={recharging} fullWidth>
              Recharge
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
