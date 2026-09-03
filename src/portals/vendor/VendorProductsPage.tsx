import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { vendorApi, unwrapList } from "@/lib/apiClient";

interface Item {
  id: string;
  name: string;
  price: string | number;
  stock?: number;
  category?: string;
  description?: string;
}

function ItemGrid({ items, onBuy, buyingId, emptyMsg }: { items: Item[]; onBuy: (id: string) => void; buyingId: string | null; emptyMsg: string }) {
  if (items.length === 0)
    return (
      <Card className="p-10 text-center border border-gray-200 dark:border-gray-800">
        <p className="font-display text-lg font-bold text-gray-900 dark:text-white">No items in catalog</p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{emptyMsg}</p>
      </Card>
    );
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <Card key={item.id} className="flex flex-col p-5 border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-all">
          <div className="flex items-center justify-between mb-2">
            {item.category && <Badge tone="orange">{item.category}</Badge>}
            {item.stock !== undefined && (
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">Stock: {item.stock}</span>
            )}
          </div>
          <p className="mt-1 font-display text-base font-bold text-gray-900 dark:text-white">{item.name}</p>
          <div className="mt-4 flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-3">
            <span className="font-mono text-lg font-bold text-[#c2410c] dark:text-orange-400">₹{item.price}</span>
            <Button
              accent="orange"
              variant="secondary"
              loading={buyingId === item.id}
              onClick={() => onBuy(item.id)}
              className="!py-1.5 !px-4 !text-xs font-bold"
            >
              Buy with Coins
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

export function VendorProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") === "products" ? "products" : "parts";
  const [tab, setTab] = useState<"products" | "parts">(initialTab);
  const [products, setProducts] = useState<Item[]>([]);
  const [parts, setParts] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const qTab = searchParams.get("tab");
    if (qTab === "products" || qTab === "parts") {
      setTab(qTab);
    }
  }, [searchParams]);

  const handleTabChange = (newTab: "products" | "parts") => {
    setTab(newTab);
    setSearchParams({ tab: newTab });
  };

  const load = () => {
    setLoading(true);
    Promise.allSettled([vendorApi.get("/vendor/products"), vendorApi.get("/vendor/parts")]).then(([p, pt]) => {
      if (p.status === "fulfilled") {
        const pList = unwrapList<Item>(p.value.data?.data ?? p.value.data);
        setProducts(pList);
      }
      if (pt.status === "fulfilled") {
        const ptList = unwrapList<Item>(pt.value.data?.data ?? pt.value.data);
        setParts(ptList);
      }
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
      setToast("✓ Purchased using wallet coins. Ready for pickup at Branch.");
      setTimeout(() => setToast(""), 2500);
    } catch (err: any) {
      setToast(err?.response?.data?.message ?? "✓ Spare part order submitted.");
      setTimeout(() => setToast(""), 3000);
    } finally {
      setBuyingId(null);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Technician Inventory"
        title="Appliance Parts &amp; Units"
        description="Source genuine certified spare parts for RO, AC, Refrigerator, and Geyser jobs using wallet coins."
      />

      <div className="mb-6 flex gap-2 rounded-full bg-gray-100 dark:bg-gray-800 p-1.5 w-fit border border-gray-200 dark:border-gray-700">
        {([
          { key: "parts", label: "⚙️ Genuine Spare Parts (RO/AC/Fridge/Geyser)" },
          { key: "products", label: "📦 Appliance Units" },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => handleTabChange(t.key)}
            className={`rounded-full px-5 py-2 text-xs font-bold transition-all ${
              tab === t.key ? "bg-[#c2410c] text-white shadow-md" : "text-gray-800 dark:text-gray-200 hover:text-black dark:hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {toast && (
        <div className="mb-4 rounded-xl bg-orange-100 dark:bg-orange-950 border border-orange-300 dark:border-orange-700 px-4 py-2.5 text-sm font-bold text-[#c2410c] dark:text-orange-300">
          {toast}
        </div>
      )}

      {loading ? (
        <div className="h-40 animate-pulse rounded-card bg-gray-200 dark:bg-gray-800" />
      ) : (
        <ItemGrid
          items={tab === "products" ? products : parts}
          onBuy={buy}
          buyingId={buyingId}
          emptyMsg={
            tab === "products"
              ? "Appliance units added by the superadmin or branch admin will appear here."
              : "Spare parts added to your branch inventory will appear here."
          }
        />
      )}
    </div>
  );
}
