import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { vendorApi } from "@/lib/apiClient";

import { unwrapList } from "@/lib/apiClient";

interface Item {
  id: string;
  name: string;
  price: string | number;
  stock?: number;
  category?: string;
}

function ItemGrid({ items, onBuy, buyingId }: { items: Item[]; onBuy: (id: string) => void; buyingId: string | null }) {
  if (items.length === 0)
    return (
      <Card className="p-10 text-center">
        <p className="font-display text-lg font-semibold text-ink">Nothing listed yet</p>
        <p className="mt-1 text-sm text-ink-soft/70">Check back once your branch admin adds items.</p>
      </Card>
    );
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <Card key={item.id} className="flex flex-col p-5">
          {item.category && <Badge tone="orange">{item.category}</Badge>}
          <p className="mt-2 font-display text-base font-semibold text-ink">{item.name}</p>
          <div className="mt-4 flex items-center justify-between">
            <span className="font-mono text-lg font-semibold text-ink">₹{item.price}</span>
            <Button accent="orange" variant="secondary" loading={buyingId === item.id} onClick={() => onBuy(item.id)}>
              Buy
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

export function VendorProductsPage() {
  const [tab, setTab] = useState<"products" | "parts">("products");
  const [products, setProducts] = useState<Item[]>([]);
  const [parts, setParts] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  const load = () => {
    setLoading(true);
    Promise.allSettled([vendorApi.get("/vendor/products"), vendorApi.get("/vendor/parts")]).then(([p, pt]) => {
      if (p.status === "fulfilled") setProducts(unwrapList<Item>(p.value.data?.data ?? p.value.data));
      if (pt.status === "fulfilled") setParts(unwrapList<Item>(pt.value.data?.data ?? pt.value.data));
      setLoading(false);
    });
  };

  useEffect(load, []);

  const buy = async (id: string) => {
    setBuyingId(id);
    try {
      if (tab === "products") {
        await vendorApi.post("/vendor/products/purchase", { productId: id, quantity: 1 });
      } else {
        await vendorApi.post("/vendor/parts/purchase", { partId: id, quantity: 1 });
      }
      setToast("Purchased using wallet coins.");
      setTimeout(() => setToast(""), 2500);
    } catch (err: any) {
      setToast(err?.response?.data?.message ?? "Purchase failed — check your balance.");
      setTimeout(() => setToast(""), 3000);
    } finally {
      setBuyingId(null);
    }
  };

  return (
    <div>
      <PageHeader eyebrow="Store" title="Products & parts" description="Buy products and spare parts using wallet coins." />

      <div className="mb-6 flex gap-2 rounded-full bg-base p-1 w-fit">
        {(["products", "parts"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-2 text-sm font-semibold capitalize transition-colors ${
              tab === t ? "bg-orange text-white" : "text-ink-soft"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {toast && <div className="mb-4 rounded-xl bg-orange-tint px-4 py-2.5 text-sm font-medium text-orange-deep">{toast}</div>}

      {loading ? (
        <div className="h-40 animate-pulse rounded-card bg-ink/[0.04]" />
      ) : (
        <ItemGrid items={tab === "products" ? products : parts} onBuy={buy} buyingId={buyingId} />
      )}
    </div>
  );
}
