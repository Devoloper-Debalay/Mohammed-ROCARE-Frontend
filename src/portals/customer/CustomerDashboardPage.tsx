import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { GoogleMapsTracker } from "@/components/tracking/GoogleMapsTracker";
import { DemoQrGenerator } from "@/components/qr/DemoQrGenerator";
import { customerApi, unwrapList } from "@/lib/apiClient";
import { useCustomerAuth } from "@/store/authStore";

const APPLIANCE_HEALTH = [
  { name: "RO Water Purifier", status: "Healthy (TDS 45 ppm)", filterLife: "82%", nextService: "In 45 Days", icon: "💧", tone: "teal" as const },
  { name: "Living Room AC (1.5T)", status: "Optimal Cooling", filterLife: "90%", nextService: "In 60 Days", icon: "❄️", tone: "orange" as const },
  { name: "Kitchen Refrigerator", status: "Sub-Zero Chill Normal", filterLife: "100%", nextService: "Routine Checkup", icon: "🧊", tone: "teal" as const },
  { name: "Bathroom Geyser", status: "Element Descaled", filterLife: "95%", nextService: "Winter Ready", icon: "🔥", tone: "orange" as const },
];

export function CustomerDashboardPage() {
  const user = useCustomerAuth((s) => s.user);
  const [addressCount, setAddressCount] = useState<number | null>(null);
  const [completedServicesCount, setCompletedServicesCount] = useState<number>(0);
  const [lifetimeRevenue, setLifetimeRevenue] = useState<number>(0);
  const [referralCount, setReferralCount] = useState<number>(0);
  const [rewardCoins, setRewardCoins] = useState<number>(0);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showFullTracker, setShowFullTracker] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  const referralCode = (user as any)?.referralCode || `ROC-${(user?.id || "CUST").slice(0, 6).toUpperCase()}`;

  useEffect(() => {
    // Load addresses
    customerApi
      .get("/customer/addresses")
      .then((res) => setAddressCount(res.data?.data?.length ?? 0))
      .catch(() => setAddressCount(0));

    // Load service requests / orders across all possible backend routes
    Promise.allSettled([
      customerApi.get("/customer/service-request"),
      customerApi.get("/customer/service-requests"),
      customerApi.get("/orders/customer"),
      customerApi.get("/customer/orders"),
      customerApi.get("/customer/dashboard"),
      customerApi.get("/customer/profile"),
    ]).then((results) => {
      let maxCompleted = 0;
      let totalRev = 0;

      for (const r of results) {
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

            // Sum item amounts/prices
            let listSum = 0;
            for (const item of list) {
              const val = Number(item.totalAmount || item.amount || item.price || item.total || 0);
              if (!isNaN(val) && val > 0) listSum += val;
            }
            totalRev = Math.max(totalRev, listSum);
          }
        }
      }
      setCompletedServicesCount(maxCompleted);
      setLifetimeRevenue(totalRev);
    });
  }, []);

  // Compute Customer Badge Tier based on Revenue / Spend contributed
  const getCustomerTier = (revenue: number) => {
    if (revenue >= 50000) {
      return {
        name: "Platinum Elite VIP",
        icon: "💎",
        tone: "primary" as const,
        color: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800",
        discount: "15% VIP Discount",
        tierLabel: "₹50,000+ Revenue VIP",
        nextTarget: 100000,
      };
    }
    if (revenue >= 15000) {
      return {
        name: "Gold VIP Club",
        icon: "🥇",
        tone: "warning" as const,
        color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800",
        discount: "10% VIP Discount",
        tierLabel: "₹15,000 – ₹49,999 Revenue VIP",
        nextTarget: 50000,
      };
    }
    if (revenue >= 5000) {
      return {
        name: "Silver Member",
        icon: "🥈",
        tone: "info" as const,
        color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800",
        discount: "5% VIP Discount",
        tierLabel: "₹5,000 – ₹14,999 Revenue Contributor",
        nextTarget: 15000,
      };
    }
    return {
      name: "Bronze Explorer",
      icon: "🥉",
      tone: "teal" as const,
      color: "text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 border-teal-200 dark:border-teal-800",
      discount: "Standard Rates & Free TDS Check",
      tierLabel: "₹0 – ₹4,999 Entry Tier",
      nextTarget: 5000,
    };
  };

  const customerTier = getCustomerTier(lifetimeRevenue);

  const copyReferral = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const shareOnWhatsApp = () => {
    const text = encodeURIComponent(
      `Get ₹100 OFF on your first RO Water Purifier / Home Appliance service with Just24You! Use my referral code: ${referralCode}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Just24You India Customer Desk"
        title={`Welcome back, ${user?.firstName || user?.name || "Customer"}`}
        description="Monitor your home appliance health, track live technician visits on Google Maps, and manage orders."
        action={
          <div className="flex flex-wrap items-center gap-2">
            {/* Customer Tier Badge */}
            <div className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-black shadow-sm ${customerTier.color}`}>
              <span className="text-base">{customerTier.icon}</span>
              <span>{customerTier.name}</span>
            </div>
            <Button accent="teal" variant="secondary" onClick={() => setShowQrModal(true)} className="font-bold">
              📱 Digital Pass
            </Button>
            <Link to="/customer/service-requests">
              <Button accent="teal" className="font-bold shadow-md">
                + Book Service Visit
              </Button>
            </Link>
          </div>
        }
      />

      {/* Customer Loyalty Tier & Badge Status Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 text-white p-4 shadow-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{customerTier.icon}</span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black tracking-tight">{customerTier.name}</span>
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">
                {customerTier.discount}
              </span>
            </div>
            <p className="text-[11px] text-teal-100 mt-0.5">
              Lifetime Revenue Contributed: <span className="font-bold text-white">₹{lifetimeRevenue.toLocaleString("en-IN")}</span> • {completedServicesCount} verified doorstep visits
            </p>
          </div>
        </div>

        <Link
          to="/customer/profile"
          className="rounded-xl bg-white text-teal-900 hover:bg-teal-50 px-3.5 py-1.5 text-xs font-black shadow-md transition-colors"
        >
          View Full Profile &amp; Perks →
        </Link>
      </div>

      {/* Floating QR Modal */}
      {showQrModal && (
        <DemoQrGenerator
          isModal
          isOpen={showQrModal}
          onClose={() => setShowQrModal(false)}
          title="Customer Digital Service Pass"
          subtitle="Show this QR code on technician doorstep arrival for instant job verification"
          initialValue={`Just24You-CUSTOMER:${user?.id || "CUST-9012"}:NAME:${user?.firstName || "Customer"}:CITY:KOLKATA`}
        />
      )}

      {/* Google Maps Modal */}
      {showFullTracker && (
        <GoogleMapsTracker
          isModal
          isOpen={showFullTracker}
          onClose={() => setShowFullTracker(false)}
          serviceId="SR-2026-08114"
          serviceTitle="Water Purifier (RO) & Appliance Service"
          vendorName="Subhashish Roy (Just24You India Certified Vendor)"
          vendorPhone="+91 90516 07464"
        />
      )}

      {/* Stat Metric Cards (Addresses, Cart, Active Visit, Completed Services) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Completed Services Metric */}
        <Card className="p-5 hover:shadow-lg transition-all border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white to-teal-50/40 dark:from-gray-900 dark:to-teal-950/20">
          <div className="flex items-center justify-between">
            <span className="text-2xl">✅</span>
            <Badge tone="teal">Verified</Badge>
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mt-2">Completed Services</p>
          <p className="font-display text-3xl font-extrabold text-[#0f766e] dark:text-teal-400 mt-1">
            {completedServicesCount} Visits
          </p>
          <Link to="/customer/service-requests" className="mt-3 inline-block text-xs font-bold text-[#0f766e] dark:text-teal-400 hover:underline">
            View Service History →
          </Link>
        </Card>

        <Card className="p-5 hover:shadow-lg transition-all border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <span className="text-2xl">🏠</span>
            <Badge tone="teal">Saved</Badge>
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mt-2">Saved Addresses</p>
          <p className="font-display text-3xl font-extrabold text-gray-900 dark:text-white mt-1">
            {addressCount ?? 2}
          </p>
          <Link to="/customer/addresses" className="mt-3 inline-block text-xs font-bold text-[#0f766e] dark:text-teal-400 hover:underline">
            Manage Doorstep Addresses →
          </Link>
        </Card>

        <Card className="p-5 hover:shadow-lg transition-all border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <span className="text-2xl">🛒</span>
            <Badge tone="orange">Store</Badge>
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mt-2">Shopping Cart</p>
          <p className="font-display text-3xl font-extrabold text-gray-900 dark:text-white mt-1">
            Appliance Store
          </p>
          <Link to="/customer/cart" className="mt-3 inline-block text-xs font-bold text-[#c2410c] dark:text-orange-400 hover:underline">
            View Cart &amp; Checkout →
          </Link>
        </Card>

        <Card className="p-5 hover:shadow-lg transition-all border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <span className="text-2xl">🛵</span>
            <Badge tone="teal">Active Visit</Badge>
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mt-2">Technician Arrival</p>
          <p className="font-display text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            47 Mins
          </p>
          <button
            onClick={() => setShowFullTracker(true)}
            className="mt-3 inline-block text-xs font-bold text-[#0f766e] dark:text-teal-400 hover:underline text-left"
          >
            Track on Google Maps →
          </button>
        </Card>
      </div>

      {/* Refer & Earn MLM Bonus Card */}
      <div className="rounded-2xl bg-gradient-to-r from-teal-700 via-teal-800 to-emerald-900 text-white p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎁</span>
            <h3 className="text-base font-black tracking-tight">Refer Friends &amp; Earn Service Reward Coins</h3>
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">50 Coins / Friend</span>
          </div>
          <p className="text-xs text-teal-100 max-w-xl">
            Share your unique referral code with family and friends. When they book their first appliance service or installation, both of you earn instant discount coins!
          </p>
          <div className="flex items-center gap-4 text-xs font-semibold text-teal-200 pt-1">
            <span>👥 {referralCount} Friends Joined</span>
            <span>•</span>
            <span>🪙 ₹{rewardCoins} Earned in Wallet</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto">
          <div className="flex items-center rounded-xl bg-black/30 border border-white/20 px-3 py-2 text-xs font-mono font-black">
            <span>{referralCode}</span>
          </div>
          <button
            onClick={copyReferral}
            className="rounded-xl bg-white text-teal-900 hover:bg-teal-50 px-3.5 py-2 text-xs font-black shadow-md transition-all active:scale-95 flex items-center gap-1"
          >
            <span>{copiedCode ? "✓ Copied" : "📋 Copy"}</span>
          </button>
          <button
            onClick={shareOnWhatsApp}
            className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white px-3.5 py-2 text-xs font-black shadow-md transition-all active:scale-95 flex items-center gap-1"
          >
            <span>💬 WhatsApp</span>
          </button>
        </div>
      </div>

      {/* Appliance Health & Maintenance Status */}
      <div>
        <h2 className="font-display text-xl font-bold text-gray-900 dark:text-white mb-4">
          Registered Appliances &amp; Health Overview
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {APPLIANCE_HEALTH.map((app) => (
            <Card key={app.name} className="p-4 border border-gray-200 dark:border-gray-800 flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{app.icon}</span>
                  <Badge tone={app.tone}>{app.filterLife} Life</Badge>
                </div>
                <h4 className="font-bold text-sm text-gray-900 dark:text-white">{app.name}</h4>
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1">{app.status}</p>
                <p className="text-[11px] font-medium text-gray-500 mt-0.5">Next Service: {app.nextService}</p>
              </div>
              <Link to="/customer/service-requests" className="mt-4 pt-2 border-t border-gray-100 dark:border-gray-800 text-[11px] font-bold text-[#0f766e] dark:text-teal-400 hover:underline">
                Book Maintenance →
              </Link>
            </Card>
          ))}
        </div>
      </div>

      {/* Active Service Radar & Google Maps Tracking */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600"></span>
            </span>
            <h2 className="font-display text-lg font-bold text-gray-900 dark:text-white">
              Live Technician Google Maps Dispatch
            </h2>
          </div>
          <Button
            accent="teal"
            variant="secondary"
            className="!py-1.5 !px-3.5 !text-xs font-bold"
            onClick={() => setShowFullTracker(true)}
          >
            🗺️ Expand Fullscreen Map
          </Button>
        </div>

        <GoogleMapsTracker
          isModal={false}
          serviceId="SR-2026-08114"
          serviceTitle="Water Purifier (RO) & Appliance Service"
          vendorName="Subhashish Roy (Just24You India Certified Vendor)"
          vendorPhone="+91 93115 87744"
          vehicleNumber="WB 02 AX 4819"
        />
      </div>
    </div>
  );
}
