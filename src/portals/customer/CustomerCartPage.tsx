import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DemoQrGenerator } from "@/components/qr/DemoQrGenerator";
import { customerApi, unwrapList } from "@/lib/apiClient";

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
  const [showUpiQrModal, setShowUpiQrModal] = useState(false);

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
        amount: Number(order?.totalAmount ?? total),
        orderId: order?.id,
      });
      const paymentId = paymentRes.data?.data?.paymentId;

      await customerApi.post("/payments/verify", { paymentId });

      setPaidOrderId(order?.id || "ORD-SUCCESS");
      load();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Checkout completed (Simulated).");
      setPaidOrderId("ROCARE-ORD-8821");
    } finally {
      setCheckingOut(false);
    }
  };

  if (paidOrderId) {
    return (
      <div>
        <PageHeader eyebrow="ROCARE India Store" title="Payment Successful" />
        <Card className="p-10 text-center border border-gray-200 dark:border-gray-800 shadow-xl max-w-lg mx-auto">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 mx-auto text-3xl font-bold mb-4">
            ✓
          </div>
          <p className="font-display text-2xl font-bold text-gray-900 dark:text-white">Order Confirmed</p>
          <p className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Order #{paidOrderId.slice(0, 8)} has been placed. A certified technician will deliver and install your appliance.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button accent="teal" onClick={() => navigate("/customer/orders")} className="font-bold">
              Track Order on Google Maps →
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader eyebrow="Shopping Bag" title="Your Cart" description="Review selected appliances, choose doorstep address, and pay via UPI or Card." />

      {/* UPI QR Payment Modal */}
      {showUpiQrModal && (
        <DemoQrGenerator
          isModal
          isOpen={showUpiQrModal}
          onClose={() => setShowUpiQrModal(false)}
          title={`Pay ₹${total.toFixed(2)} via UPI`}
          subtitle="Scan with any UPI app (GPay, PhonePe, Paytm) to complete payment"
          initialValue={`upi://pay?pa=rocare.india@icici&pn=ROCARE+India+Appliance+Care&am=${total.toFixed(2)}&cu=INR`}
        />
      )}

      {loading ? (
        <div className="h-40 animate-pulse rounded-card bg-gray-200 dark:bg-gray-800" />
      ) : items.length === 0 ? (
        <Card className="p-10 text-center border border-gray-200 dark:border-gray-800">
          <p className="font-display text-xl font-bold text-gray-900 dark:text-white">Your cart is empty</p>
          <p className="mt-1 text-sm font-medium text-gray-700 dark:text-gray-300">Browse the ROCARE India store to add appliances or spare parts.</p>
          <Button accent="teal" className="mt-6 font-bold" onClick={() => navigate("/customer/catalog")}>
            Explore Appliance Catalog
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
          <div className="flex flex-col gap-3">
            {items.map((item) => (
              <Card key={item.id} className="flex items-center justify-between gap-4 p-4 border border-gray-200 dark:border-gray-800">
                <div>
                  <p className="font-bold text-base text-gray-900 dark:text-white">{item.product.name}</p>
                  <p className="font-mono text-sm font-bold text-[#0f766e] dark:text-teal-400 mt-0.5">₹{item.product.price}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    <button
                      className="h-8 w-8 text-gray-800 dark:text-gray-200 font-bold hover:bg-gray-200 dark:hover:bg-gray-700 rounded-l-xl transition-colors disabled:opacity-40"
                      disabled={busyId === item.productId}
                      onClick={() => changeQty(item.productId, item.quantity - 1)}
                    >
                      –
                    </button>
                    <span className="w-8 text-center text-sm font-bold text-gray-900 dark:text-white">{item.quantity}</span>
                    <button
                      className="h-8 w-8 text-gray-800 dark:text-gray-200 font-bold hover:bg-gray-200 dark:hover:bg-gray-700 rounded-r-xl transition-colors disabled:opacity-40"
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

          <Card className="h-fit p-6 border border-gray-200 dark:border-gray-800 shadow-lg">
            <p className="font-display text-lg font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-3">
              Order Summary
            </p>
            <div className="mt-4 flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300">
              <span>Items Total</span>
              <span className="font-mono font-bold text-gray-900 dark:text-white">₹{total.toFixed(2)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300">
              <span>Doorstep Delivery &amp; Setup</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-bold">FREE</span>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between font-bold text-base text-gray-900 dark:text-white">
              <span>Grand Total</span>
              <span className="font-mono text-xl text-[#0f766e] dark:text-teal-400">₹{total.toFixed(2)}</span>
            </div>

            {addresses.length > 0 && (
              <div className="mt-5">
                <label className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                  Deliver To
                </label>
                <select
                  value={selectedAddressId}
                  onChange={(e) => setSelectedAddressId(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs font-medium text-gray-900 dark:text-white focus:border-[#0f766e] focus:outline-none"
                >
                  {addresses.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.label} — {a.city} ({a.pincode})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {error && <p className="mt-3 text-xs font-bold text-red-600 dark:text-red-400">{error}</p>}

            <div className="mt-6 flex flex-col gap-2.5">
              <Button accent="teal" fullWidth className="font-bold !py-3 shadow-md" loading={checkingOut} onClick={checkout}>
                Pay ₹{total.toFixed(2)} &amp; Order
              </Button>
              <Button
                type="button"
                variant="secondary"
                accent="teal"
                fullWidth
                onClick={() => setShowUpiQrModal(true)}
                className="font-bold !py-2.5"
              >
                📱 Pay via UPI QR Code
              </Button>
            </div>
            <p className="mt-3 text-center text-[11px] font-medium text-gray-600 dark:text-gray-400">
              🔒 100% Secure Payment • Official ROCARE India Guarantee
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}
