import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { customerApi } from "@/lib/apiClient";

interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: { id: string; name: string; price: string; images: string[] };
}

export function CustomerCartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => {
    customerApi
      .get("/cart")
      .then((res) => setItems(res.data?.data?.items ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const changeQty = async (productId: string, quantity: number) => {
    setBusyId(productId);
    try {
      if (quantity < 1) {
        await customerApi.delete(`/cart/items/${productId}`);
      } else {
        await customerApi.patch(`/cart/items/${productId}`, { quantity });
      }
      load();
    } finally {
      setBusyId(null);
    }
  };

  const total = items.reduce((sum, i) => sum + Number(i.product.price) * i.quantity, 0);

  return (
    <div>
      <PageHeader eyebrow="Cart" title="Your cart" description="Review items before checkout." />

      {loading ? (
        <div className="h-40 animate-pulse rounded-card bg-ink/[0.04]" />
      ) : items.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="font-display text-lg font-semibold text-ink">Your cart is empty</p>
          <p className="mt-1 text-sm text-ink-soft/70">Browse the catalog to add products.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-3">
            {items.map((item) => (
              <Card key={item.id} className="flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="font-medium text-ink">{item.product.name}</p>
                  <p className="font-mono text-sm text-ink-soft/70">₹{item.product.price}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center rounded-full border border-ink/10">
                    <button
                      className="h-8 w-8 text-ink-soft disabled:opacity-40"
                      disabled={busyId === item.productId}
                      onClick={() => changeQty(item.productId, item.quantity - 1)}
                    >
                      –
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                    <button
                      className="h-8 w-8 text-ink-soft disabled:opacity-40"
                      disabled={busyId === item.productId}
                      onClick={() => changeQty(item.productId, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Card className="h-fit p-5">
            <p className="font-display text-lg font-semibold text-ink">Order summary</p>
            <div className="mt-4 flex items-center justify-between text-sm text-ink-soft/80">
              <span>Subtotal</span>
              <span className="font-mono">₹{total.toFixed(2)}</span>
            </div>
            <Button accent="teal" fullWidth className="mt-5">
              Proceed to checkout
            </Button>
            <p className="mt-2 text-center text-xs text-ink-soft/50">Checkout flow ships in the next update.</p>
          </Card>
        </div>
      )}
    </div>
  );
}
