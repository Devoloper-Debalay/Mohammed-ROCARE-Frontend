import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { GoogleMapsTracker } from "@/components/tracking/GoogleMapsTracker";
import { DemoQrGenerator } from "@/components/qr/DemoQrGenerator";
import { customerApi } from "@/lib/apiClient";
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
  const [showFullTracker, setShowFullTracker] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  useEffect(() => {
    customerApi
      .get("/customer/addresses")
      .then((res) => setAddressCount(res.data?.data?.length ?? 2))
      .catch(() => setAddressCount(2));
  }, []);

  return (
    <div>
      <PageHeader
        eyebrow="ROCARE India Customer Desk"
        title={`Welcome back, ${user?.firstName || user?.name || "Customer"}`}
        description="Monitor your home appliance health, track live technician visits on Google Maps, and manage orders."
        action={
          <div className="flex gap-2">
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

      {/* Floating QR Modal */}
      {showQrModal && (
        <DemoQrGenerator
          isModal
          isOpen={showQrModal}
          onClose={() => setShowQrModal(false)}
          title="Customer Digital Service Pass"
          subtitle="Show this QR code on technician doorstep arrival for instant job verification"
          initialValue={`ROCARE-CUSTOMER:${user?.id || "CUST-9012"}:NAME:${user?.firstName || "Customer"}:CITY:KOLKATA`}
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
          vendorName="Subhashish Roy (RO Care India Certified Vendor)"
          vendorPhone="+91 90516 07464"
        />
      )}

      {/* Stat Metric Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
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

      {/* Appliance Health & Maintenance Status */}
      <div className="mt-8">
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
      <div className="mt-8">
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
          vendorName="Subhashish Roy (RO Care India Certified Vendor)"
          vendorPhone="+91 93115 87744"
          vehicleNumber="WB 02 AX 4819"
        />
      </div>
    </div>
  );
}
