import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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

interface Address {
  id: string;
  label: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
}

import { unwrapList } from "@/lib/apiClient";

export function CustomerCartPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState("");
  const [paidOrderId, setPaidOrderId] = useState<string | null>(null);

  const load = () => {
    Promise.allSettled([customerApi.get("/cart"), customerApi.get("/customer/addresses")]).then(([c, a]) => {
      if (c.status === "fulfilled") {
        const cartPayload = c.value.data?.data ?? c.value.data;
        const cartItems = Array.isArray(cartPayload?.items)
          ? cartPayload.items
          : Array.isArray(cartPayload)
          ? cartPayload
          : [];
        setItems(cartItems);
      }
      if (a.status === "fulfilled") {
        const list = unwrapList<Address>(a.value.data?.data ?? a.value.data);
        setAddresses(list);
        if (list[0]) setSelectedAddressId((curr) => curr || list[0].id);
      }
      setLoading(false);
    });
  };

  useEffect(load, []);

  const changeQty = async (productId: string, quantity: number) => {
    setBusyId(productId);
    try {
      if (quantity < 1) {
        await customerApi.delete(`/cart/items/${productId}`);
      } else {
        await customerApi.patch(`/cart/items/${productId}`, { productId, quantity });
      }
      load();
    } catch {
      // fallback reload
      load();
    } finally {
      setBusyId(null);
    }
  };

  const total = items.reduce((sum, i) => sum + Number(i.product.price) * i.quantity, 0);

  const checkout = async () => {
    setCheckingOut(true);
    setError("");
    try {
      const addr = addresses.find((a) => a.id === selectedAddressId);
      const deliveryAddress = addr ? `${addr.line1}${addr.line2 ? ", " + addr.line2 : ""}, ${addr.city}, ${addr.state} ${addr.pincode}` : undefined;

      const orderRes = await customerApi.post("/orders/checkout", { deliveryAddress });
      const order = orderRes.data?.data;

      const paymentRes = await customerApi.post("/payments/create-order", {
        amount: Number(order.totalAmount ?? total),
        orderId: order.id,
      });
      const paymentId = paymentRes.data?.data?.paymentId;

      await customerApi.post("/payments/verify", { paymentId });

      setPaidOrderId(order.id);
      load();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Checkout failed. Please try again.");
    } finally {
      setCheckingOut(false);
    }
  };

  if (paidOrderId) {
    return (
      <div>
        <PageHeader eyebrow="Cart" title="Payment successful" />
        <Card className="p-10 text-center">
          <p className="font-display text-xl font-semibold text-ink">Order placed</p>
          <p className="mt-2 text-sm text-ink-soft/70">Order #{paidOrderId.slice(0, 8)} is confirmed and paid.</p>
          <Button accent="teal" className="mt-6" onClick={() => navigate("/customer/orders")}>
            View my orders
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader eyebrow="Cart" title="Your cart" description="Review items, pick a delivery address, and pay." />

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

            {addresses.length > 0 && (
              <div className="mt-4">
                <label className="text-sm font-medium text-ink-soft">Deliver to</label>
                <select
                  value={selectedAddressId}
                  onChange={(e) => setSelectedAddressId(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-ink/10 bg-surface px-3 py-2 text-sm text-ink"
                >
                  {addresses.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.label} — {a.city}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {error && <p className="mt-3 text-sm font-medium text-danger">{error}</p>}

            <Button accent="teal" fullWidth className="mt-5" loading={checkingOut} onClick={checkout}>
              Pay ₹{total.toFixed(2)} & place order
            </Button>
            <p className="mt-2 text-center text-xs text-ink-soft/50">Payments are simulated in this environment — no real charge occurs.</p>
          </Card>
        </div>
      )}
    </div>
  );
}

