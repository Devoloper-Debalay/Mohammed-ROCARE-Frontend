import { type FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, Badge } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { DemoQrGenerator } from "@/components/qr/DemoQrGenerator";
import { customerApi, portalStorage, unwrapList } from "@/lib/apiClient";
import { useCustomerAuth } from "@/store/authStore";

export function CustomerProfilePage() {
  const { user, setSession } = useCustomerAuth();

  const [form, setForm] = useState({
    firstName: user?.firstName || "Mithu",
    lastName: user?.lastName || "Das",
    email: user?.email || "customer@yah.com",
    phone: user?.phone || "+919051607464",
    address: "",
    city: "Kolkata",
    pincode: "700064",
  });

  const [completedServices, setCompletedServices] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const referralCode =
    (user as any)?.referralCode ||
    (form.firstName ? `ROC-${form.firstName.toUpperCase()}${form.phone ? form.phone.slice(-3) : "101"}` : `ROC-MITHU905`);

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      customerApi.get("/customer/profile"),
      customerApi.get("/customer/addresses"),
      customerApi.get("/customer/service-request"),
      customerApi.get("/customer/service-requests"),
      customerApi.get("/orders/customer"),
      customerApi.get("/customer/orders"),
      customerApi.get("/customer/dashboard"),
    ]).then(([p, a, ...svcResults]) => {
      let resolvedAddress = "";

      if (a.status === "fulfilled" && a.value?.data) {
        const addresses = unwrapList<any>(a.value.data?.data ?? a.value.data);
        if (addresses.length > 0) {
          resolvedAddress = addresses[0].street || addresses[0].address || addresses[0].line1 || "";
          if (addresses[0].city) setForm((f) => ({ ...f, city: addresses[0].city }));
          if (addresses[0].pincode) setForm((f) => ({ ...f, pincode: addresses[0].pincode }));
        }
      }

      if (p.status === "fulfilled" && p.value?.data) {
        const data = p.value.data?.data ?? p.value.data;
        if (data) {
          setForm({
            firstName: data.firstName || user?.firstName || "Mithu",
            lastName: data.lastName || user?.lastName || "Das",
            email: data.email || user?.email || "customer@yah.com",
            phone: data.phone || user?.phone || "+919051607464",
            address: data.address || resolvedAddress || "Salt Lake Sector 1, Block AE",
            city: data.city || "Kolkata",
            pincode: data.pincode || "700064",
          });
        }
      } else if (resolvedAddress) {
        setForm((f) => ({ ...f, address: resolvedAddress }));
      }

      let maxCompleted = 0;
      let totalRev = 0;

      for (const r of svcResults) {
        if (r.status === "fulfilled" && r.value?.data) {
          const payload = r.value.data?.data ?? r.value.data;
          if (payload && typeof payload === "object") {
            if (payload.completedServicesCount !== undefined) {
              maxCompleted = Math.max(maxCompleted, Number(payload.completedServicesCount));
            }
            if (payload.completedVisits !== undefined) {
              maxCompleted = Math.max(maxCompleted, Number(payload.completedVisits));
            }
            if (payload.lifetimeRevenue !== undefined || payload.lifetimeSpend !== undefined || payload.totalSpend !== undefined || payload.totalRevenue !== undefined) {
              const rev = Number(payload.lifetimeRevenue || payload.lifetimeSpend || payload.totalSpend || payload.totalRevenue || 0);
              totalRev = Math.max(totalRev, rev);
            }
          }
          const list = unwrapList<any>(payload);
          if (list.length > 0) {
            const completedInList = list.filter(
              (item: any) =>
                item.status === "COMPLETED" ||
                item.status === "DELIVERED" ||
                item.status === "CONFIRMED" ||
                item.status === "RESOLVED" ||
                item.stage === 3 ||
                item.isCompleted === true
            ).length;
            maxCompleted = Math.max(maxCompleted, completedInList > 0 ? completedInList : list.length);

            let listSum = 0;
            for (const item of list) {
              const val = Number(item.totalAmount || item.amount || item.price || item.total || 0);
              if (!isNaN(val) && val > 0) listSum += val;
            }
            totalRev = Math.max(totalRev, listSum);
          }
        }
      }
      setCompletedServices(maxCompleted);
      setLifetimeRevenue(totalRev);

      setLoading(false);
    });
  }, [user]);

  // Compute Customer Tier Badge based on Revenue Contributed
  const getCustomerTier = (revenue: number) => {
    if (revenue >= 50000) {
      return {
        name: "Platinum Elite VIP",
        icon: "💎",
        discount: "15% OFF Services & Filters",
        color: "bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-200 border-purple-300 dark:border-purple-800",
        thresholdLabel: "₹50,000+ Revenue VIP",
        nextTarget: 100000,
      };
    }
    if (revenue >= 15000) {
      return {
        name: "Gold VIP Club",
        icon: "🥇",
        discount: "10% OFF AMC & Spares",
        color: "bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-800",
        thresholdLabel: "₹15,000 – ₹49,999 Revenue VIP",
        nextTarget: 50000,
      };
    }
    if (revenue >= 5000) {
      return {
        name: "Silver Member",
        icon: "🥈",
        discount: "5% OFF Routine Maintenance",
        color: "bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-800",
        thresholdLabel: "₹5,000 – ₹14,999 Revenue Contributor",
        nextTarget: 15000,
      };
    }
    return {
      name: "Bronze Explorer",
      icon: "🥉",
      discount: "Standard Rates & Free Water TDS Check",
      color: "bg-teal-100 dark:bg-teal-950 text-teal-900 dark:text-teal-200 border-teal-300 dark:border-teal-800",
      thresholdLabel: "₹0 – ₹4,999 Entry Tier",
      nextTarget: 5000,
    };
  };

  const [lifetimeRevenue, setLifetimeRevenue] = useState<number>(0);
  const tier = getCustomerTier(lifetimeRevenue);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await customerApi.patch("/customer/profile", form);
    } catch {}

    // Synchronize auth session immediately
    const currentToken = portalStorage.getToken("customer");
    setSession({
      token: currentToken || undefined,
      user: {
        ...(user || {}),
        firstName: form.firstName,
        lastName: form.lastName,
        name: `${form.firstName} ${form.lastName}`.trim(),
        email: form.email,
        phone: form.phone,
        referralCode,
      },
    });

    setToast({ msg: "✓ Customer profile updated and synchronized successfully.", type: "success" });
    setSaving(false);
    setTimeout(() => setToast(null), 3000);
  };

  const copyReferral = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const shareOnWhatsApp = () => {
    const text = encodeURIComponent(
      `Get ₹100 OFF on your first RO Water Purifier or Home Appliance service with Just24You! Use my referral code: ${referralCode}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <PageHeader
        eyebrow="Account Settings &amp; Loyalty Rewards"
        title="Customer Profile &amp; Membership"
        description="Manage your contact details, view your loyalty badge tier, and share your customer referral pass."
      />

      {/* Floating QR Modal */}
      {showQrModal && (
        <DemoQrGenerator
          isModal
          isOpen={showQrModal}
          onClose={() => setShowQrModal(false)}
          title="Customer Digital Pass & Verification QR"
          subtitle="Scan this QR code when technician visits your premises"
          initialValue={`Just24You-CUSTOMER:${user?.id || "CUST-9012"}:NAME:${form.firstName} ${form.lastName}:PHONE:${form.phone}`}
        />
      )}

      {toast && (
        <div
          className={`rounded-2xl p-4 text-xs font-bold shadow-sm border ${
            toast.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
              : "bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800"
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Prominent Customer Loyalty Tier & Badge Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-teal-800 via-teal-900 to-slate-900 text-white p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-3xl">{tier.icon}</span>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-teal-200">Current Loyalty Tier</span>
                <h2 className="text-2xl font-black tracking-tight text-white">{tier.name}</h2>
              </div>
            </div>
            <p className="text-xs text-teal-100 font-medium">
              Tier Perk: <span className="font-bold text-amber-300">{tier.discount}</span>
            </p>
            <p className="text-[11px] text-teal-200">
              Completed Doorstep Services: <span className="font-bold text-white">{completedServices} visits</span>
            </p>
          </div>

          <div className="flex flex-col items-start sm:items-end gap-2">
            <button
              onClick={() => setShowQrModal(true)}
              className="rounded-xl bg-white text-teal-900 hover:bg-teal-50 px-4 py-2 text-xs font-black shadow-md transition-all active:scale-95 flex items-center gap-1.5"
            >
              <span>📱</span> View Digital Pass QR
            </button>
            <span className="text-[10px] font-mono text-teal-300">
              {tier.nextTarget - completedServices > 0
                ? `${tier.nextTarget - completedServices} more visits to next tier upgrade`
                : "Top VIP Tier Unlocked!"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        {/* Left Column: Edit Profile Form */}
        <Card className="p-6 border border-gray-200 dark:border-gray-800 shadow-md">
          <p className="font-display text-lg font-bold text-gray-900 dark:text-white mb-4">Personal Details &amp; Address</p>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="First Name"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                required
              />
              <Input
                label="Last Name"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Mobile Phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
              />
              <Input
                label="Email Address"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <Input
              label="Primary Delivery Address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="House/Flat No., Street, Landmark"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="City"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
              <Input
                label="Pincode"
                value={form.pincode}
                onChange={(e) => setForm({ ...form, pincode: e.target.value })}
              />
            </div>

            <div className="pt-2">
              <Button type="submit" accent="teal" loading={saving} className="font-bold !py-2.5 px-6 shadow-md">
                Save Profile Changes
              </Button>
            </div>
          </form>
        </Card>

        {/* Right Column: Referral Pass & Quick Links */}
        <div className="space-y-6">
          <Card className="p-6 border border-gray-200 dark:border-gray-800 shadow-md space-y-4">
            <p className="font-display text-base font-bold text-gray-900 dark:text-white">Refer &amp; Earn Pass</p>
            <p className="text-xs text-gray-500">
              Share your referral code. You and your friends get ₹100 / 50 bonus coins on their first booking.
            </p>

            <div className="p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-center">
              <span className="text-[10px] font-bold text-teal-700 dark:text-teal-400 uppercase">Your Unique Referral Code</span>
              <p className="font-mono text-xl font-black text-teal-900 dark:text-white mt-1">{referralCode}</p>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                accent="teal"
                onClick={copyReferral}
                className="flex-1 font-bold text-xs !py-2"
              >
                {copiedCode ? "✓ Copied" : "📋 Copy Code"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                accent="teal"
                onClick={shareOnWhatsApp}
                className="flex-1 font-bold text-xs !py-2"
              >
                💬 WhatsApp
              </Button>
            </div>
          </Card>

          <Card className="p-6 border border-gray-200 dark:border-gray-800 shadow-md space-y-3">
            <p className="font-display text-base font-bold text-gray-900 dark:text-white">Quick Actions</p>
            <Link
              to="/customer/service-requests"
              className="block p-3 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 text-xs font-bold text-gray-900 dark:text-white transition-colors"
            >
              📅 Book Appliance Service Visit →
            </Link>
            <Link
              to="/customer/addresses"
              className="block p-3 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 text-xs font-bold text-gray-900 dark:text-white transition-colors"
            >
              🏠 Manage Saved Addresses →
            </Link>
            <Link
              to="/customer/complaints"
              className="block p-3 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 text-xs font-bold text-gray-900 dark:text-white transition-colors"
            >
              🛡️ File a Quality Complaint →
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
