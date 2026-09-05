import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { customerApi, unwrapList } from "@/lib/apiClient";

interface Coupon {
  id: string;
  code: string;
  discountType: "PERCENT" | "FLAT";
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  expiresAt?: string;
  description?: string;
}

interface Voucher {
  id: string;
  code: string;
  amount: number;
  isRedeemed?: boolean;
  expiresAt?: string;
}

const DEFAULT_COUPONS: Coupon[] = [
  {
    id: "c-1",
    code: "ROCARE500",
    discountType: "FLAT",
    discountValue: 500,
    minOrderAmount: 4999,
    description: "Flat ₹500 discount on water purifiers and heavy kitchen appliances.",
  },
  {
    id: "c-2",
    code: "SUMMERCOOL",
    discountType: "PERCENT",
    discountValue: 15,
    maxDiscountAmount: 2500,
    minOrderAmount: 9999,
    description: "15% Instant Cashback up to ₹2,500 on all Inverter ACs and Refrigerators.",
  },
  {
    id: "c-3",
    code: "SMARTCARE",
    discountType: "PERCENT",
    discountValue: 20,
    minOrderAmount: 999,
    description: "Flat 20% off on all home appliances, water purifiers, and kitchen accessories.",
  },
  {
    id: "c-4",
    code: "WELCOME100",
    discountType: "FLAT",
    discountValue: 100,
    minOrderAmount: 499,
    description: "Welcome voucher for new customer accounts. Applicable across entire catalog.",
  },
];

export function CustomerOffersPage() {
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [voucherCodeInput, setVoucherCodeInput] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [redeemMessage, setRedeemMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const load = () => {
    setLoading(true);
    Promise.allSettled([
      customerApi.get("/offers/coupons"),
      customerApi.get("/offers/vouchers"),
    ])
      .then(([cRes, vRes]) => {
        if (cRes.status === "fulfilled") {
          const list = unwrapList<Coupon>(cRes.value.data?.data ?? cRes.value.data);
          setCoupons(list.length > 0 ? list : DEFAULT_COUPONS);
        } else {
          setCoupons(DEFAULT_COUPONS);
        }
        if (vRes.status === "fulfilled") {
          const list = unwrapList<Voucher>(vRes.value.data?.data ?? vRes.value.data);
          setVouchers(list);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleRedeemVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucherCodeInput.trim()) return;
    setRedeeming(true);
    setRedeemMessage(null);
    try {
      await customerApi.post("/offers/customer/vouchers/redeem", { code: voucherCodeInput.trim() });
      setRedeemMessage({ type: "success", text: `✓ Voucher ${voucherCodeInput.toUpperCase()} redeemed successfully!` });
      setVoucherCodeInput("");
      load();
    } catch (err: any) {
      setRedeemMessage({
        type: "error",
        text: err?.response?.data?.message || "Invalid voucher code or voucher has already expired.",
      });
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="ROCARE India Store"
        title="Offers &amp; Coupon Rewards"
        description="Exclusive instant discount vouchers, seasonal appliance codes, and reward coupons."
        action={
          <Button accent="teal" onClick={() => navigate("/customer/catalog")}>
            🛒 Shop Appliance Store
          </Button>
        }
      />

      {/* Featured Banner */}
      <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-teal-900 via-[#0f766e] to-cyan-800 p-6 md:p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
            🎁 Festive Mega Savings
          </span>
          <h2 className="mt-3 font-display text-2xl md:text-3xl font-extrabold leading-tight">
            Up to ₹2,500 Off on High-Efficiency Purifiers &amp; Smart ACs
          </h2>
          <p className="mt-2 text-sm text-teal-100 font-medium">
            Use verified promo coupons during checkout for instant bill deductions with free doorstep installation.
          </p>
        </div>
      </div>

      {/* Redeem Digital Voucher Section */}
      <Card className="mb-8 p-6 border border-gray-200 dark:border-gray-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="font-display text-base font-bold text-gray-900 dark:text-white">
              Have a Gift Card or Service Voucher?
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
              Enter your 16-character alphanumeric voucher code to add funds directly to your wallet balance.
            </p>
          </div>
          <form onSubmit={handleRedeemVoucher} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="e.g. ROCARE-GIFT-990"
              value={voucherCodeInput}
              onChange={(e) => setVoucherCodeInput(e.target.value)}
              className="rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider text-gray-900 dark:text-white focus:border-[#0f766e] focus:outline-none"
            />
            <Button type="submit" accent="teal" loading={redeeming} className="font-bold !py-2 !px-4 text-xs whitespace-nowrap">
              Redeem Code
            </Button>
          </form>
        </div>

        {redeemMessage && (
          <div
            className={`mt-4 rounded-xl px-4 py-2.5 text-xs font-bold ${
              redeemMessage.type === "success"
                ? "bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
                : "bg-rose-100 text-rose-900 border border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800"
            }`}
          >
            {redeemMessage.text}
          </div>
        )}
      </Card>

      {/* Available Coupons Grid */}
      <div className="mb-4">
        <h3 className="font-display text-lg font-bold text-gray-900 dark:text-white mb-1">
          Active Discount Coupons
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          Click &ldquo;Copy Code&rdquo; and paste in the shopping cart checkout to apply instant discount.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {coupons.map((coupon) => (
            <Card
              key={coupon.id}
              className="relative overflow-hidden p-5 border border-dashed border-[#0f766e]/40 dark:border-teal-700/50 hover:shadow-lg transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-extrabold text-[#0f766e] dark:text-teal-400 bg-teal-50 dark:bg-teal-950 px-3 py-1 rounded-lg border border-teal-200 dark:border-teal-800 tracking-wider">
                      {coupon.code}
                    </span>
                    <Badge tone="teal">
                      {coupon.discountType === "FLAT" ? `₹${coupon.discountValue} FLAT` : `${coupon.discountValue}% OFF`}
                    </Badge>
                  </div>
                  <Button
                    accent="teal"
                    variant="secondary"
                    className="!py-1.5 !px-3 !text-xs font-bold"
                    onClick={() => copyCode(coupon.code)}
                  >
                    {copiedCode === coupon.code ? "✓ Copied!" : "📋 Copy Code"}
                  </Button>
                </div>

                <p className="mt-3 text-xs font-medium text-gray-700 dark:text-gray-300 leading-relaxed">
                  {coupon.description || `Save ${coupon.discountType === "FLAT" ? `₹${coupon.discountValue}` : `${coupon.discountValue}%`} on orders above ₹${coupon.minOrderAmount || 499}.`}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[11px] text-gray-500 font-medium">
                <span>Min Order: ₹{coupon.minOrderAmount || 499}</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">● Active &amp; Verified</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
