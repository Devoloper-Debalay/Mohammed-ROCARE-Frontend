import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { GoogleMapsTracker } from "@/components/tracking/GoogleMapsTracker";
import { vendorApi } from "@/lib/apiClient";
import { useVendorAuth } from "@/store/authStore";

interface Wallet {
  balance: string;
}

interface Lead {
  id: string;
  customerName: string;
  phone?: string;
  address?: string;
  area?: string;
  serviceType?: string;
  status: string;
  leadAcceptanceCharge?: string;
}

const DEFAULT_DEMO_LEADS: Lead[] = [
  { id: "lead-kol-101", customerName: "Rajdeep Banerjee", phone: "+91 98301 23456", address: "Plot 42, Block CA, Sector 1, Salt Lake, Kolkata 700064", area: "Sector 1, Salt Lake, Kolkata", serviceType: "RO Membrane & TDS Filter Service", status: "ACCEPTED", leadAcceptanceCharge: "50" },
  { id: "lead-kol-102", customerName: "Sunita Agarwal", phone: "******8821", address: "********, New Town, 700***", area: "City Centre 2, New Town, Kolkata", serviceType: "Inverter AC Jet Foam Cleaning", status: "NEW", leadAcceptanceCharge: "60" },
  { id: "lead-kol-103", customerName: "Pranab Ghosh", phone: "******4412", address: "********, Dum Dum, 700***", area: "Dum Dum Cantonment, Kolkata", serviceType: "Double Door Refrigerator Gas Leak Repair", status: "NEW", leadAcceptanceCharge: "45" },
  { id: "lead-kol-104", customerName: "Rina Das", phone: "+91 98319 87654", address: "14/2B Diamond Harbour Road, Taratala Crossing, Behala, Kolkata 700038", area: "Taratala Crossing, Behala", serviceType: "25L Geyser Heating Element Replacement", status: "ONGOING", leadAcceptanceCharge: "40" },
];

const leadStatusTone: Record<string, "gold" | "teal" | "success" | "danger" | "neutral"> = {
  NEW: "gold",
  ACCEPTED: "teal",
  ONGOING: "teal",
  PENDING_START_VERIFICATION: "gold",
  PENDING_DENIAL_VERIFICATION: "gold",
  COMPLETED: "success",
  DENIED: "danger",
};

export function VendorDashboardPage() {
  const user = useVendorAuth((s) => s.user);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [leads, setLeads] = useState<Lead[]>(DEFAULT_DEMO_LEADS);
  const [loading, setLoading] = useState(true);
  const [showNavModal, setShowNavModal] = useState(false);

  useEffect(() => {
    Promise.allSettled([vendorApi.get("/vendor/wallet"), vendorApi.get("/vendor/leads")]).then(([w, l]) => {
      if (w.status === "fulfilled") setWallet(w.value.data?.data ?? null);
      if (l.status === "fulfilled") {
        const fetched = l.value.data?.data ?? [];
        if (fetched.length > 0) setLeads(fetched.slice(0, 5));
      }
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <PageHeader
        eyebrow="ROCARE India Technician Desk"
        title={`Welcome, ${user?.fullName || "Subhashish Roy"}`}
        description="Your doorstep service queue, Google Maps GPS route navigation, and wallet coin balance."
        action={
          <div className="flex gap-2">
            <Button accent="orange" variant="secondary" onClick={() => setShowNavModal(true)} className="font-bold">
              🗺️ Active Job Map
            </Button>
            <Link to="/vendor/leads">
              <Button accent="orange" className="font-bold shadow-md">
                + Browse New Leads
              </Button>
            </Link>
          </div>
        }
      />

      {showNavModal && (
        <GoogleMapsTracker
          isModal
          isOpen={showNavModal}
          onClose={() => setShowNavModal(false)}
          serviceId="JOB-BEHALA-01"
          serviceTitle="RO & Appliance Service Route Navigation"
          vendorName={user?.fullName || "Subhashish Roy (Field Technician)"}
          vendorPhone="+91 9051607464"
          vehicleNumber="WB 02 AX 4819"
        />
      )}

      {/* Field Engineer Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
        <Card className="p-5 border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <span className="text-2xl">💰</span>
            <Badge tone="orange">Wallet</Badge>
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mt-2">Wallet Coins</p>
          <p className="font-mono text-3xl font-extrabold text-[#c2410c] dark:text-orange-400 mt-1">
            {loading ? "450" : `₹${wallet?.balance ?? "450"}`}
          </p>
          <Link to="/vendor/wallet" className="mt-3 inline-block text-xs font-bold text-[#c2410c] dark:text-orange-400 hover:underline">
            + Recharge via UPI QR →
          </Link>
        </Card>

        <Card className="p-5 border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <span className="text-2xl">📋</span>
            <Badge tone="teal">Today's Jobs</Badge>
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mt-2">Assigned Leads</p>
          <p className="font-display text-3xl font-extrabold text-gray-900 dark:text-white mt-1">
            {leads.length}
          </p>
          <Link to="/vendor/leads" className="mt-3 inline-block text-xs font-bold text-[#0f766e] dark:text-teal-400 hover:underline">
            View Job Details →
          </Link>
        </Card>

        <Card className="p-5 border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <span className="text-2xl">⭐</span>
            <Badge tone="success">Top Rated</Badge>
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mt-2">Customer Rating</p>
          <p className="font-display text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            4.9 ★
          </p>
          <span className="text-[11px] font-medium text-gray-500 mt-1 block">Based on 280+ Kolkata jobs</span>
        </Card>

        <Card className="p-5 border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <span className="text-2xl">🛡️</span>
            <Badge tone="success">Verified</Badge>
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mt-2">KYC &amp; Geotag</p>
          <p className="font-display text-base font-bold text-gray-900 dark:text-white mt-1">
            RO &amp; AC Certified
          </p>
          <Link to="/vendor/profile" className="mt-3 inline-block text-xs font-bold text-gray-600 dark:text-gray-400 hover:underline">
            View Badge ID →
          </Link>
        </Card>
      </div>

      {/* Active Field Radar */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>🗺️</span> Current Doorstep Route Navigation (Baranagar ➔ Behala)
          </h3>
          <Button accent="orange" variant="secondary" className="!py-1.5 !px-3 text-xs font-bold" onClick={() => setShowNavModal(true)}>
            Expand Full Map
          </Button>
        </div>
        <GoogleMapsTracker
          isModal={false}
          serviceId="JOB-BEHALA-01"
          serviceTitle="RO Membrane & TDS Filter Service"
          vendorName={user?.fullName || "Subhashish Roy"}
          vendorPhone="+91 9051607464"
          vehicleNumber="WB 02 AX 4819"
        />
      </div>

      {/* Recent Lead Pipeline */}
      <Card className="mt-8 p-6 border border-gray-200 dark:border-gray-800 shadow-md">
        <div className="flex items-center justify-between mb-4 border-b border-gray-200 dark:border-gray-800 pb-3">
          <p className="font-display text-lg font-bold text-gray-900 dark:text-white">Active &amp; Incoming Leads</p>
          <Link to="/vendor/leads" className="text-xs font-bold text-[#c2410c] dark:text-orange-400 hover:underline">
            Manage All ({leads.length}) →
          </Link>
        </div>

        <div className="flex flex-col gap-3">
          {leads.map((lead) => {
            const isNew = lead.status === "NEW";
            return (
              <div key={lead.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gray-50 dark:bg-gray-800/80 p-4 border border-gray-200 dark:border-gray-700 hover:border-orange-500 transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-base text-gray-900 dark:text-white">{lead.customerName}</p>
                    <Badge tone={leadStatusTone[lead.status] ?? "neutral"}>{lead.status.replace(/_/g, " ")}</Badge>
                    {isNew ? (
                      <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                        🔒 Masked Pre-Accept
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        ✓ Unlocked
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mt-1">
                    🔧 {lead.serviceType ?? "Appliance Service"} • 📍 {lead.address || lead.area || "Kolkata"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-mono">
                    📞 {lead.phone || (isNew ? "******•••• (masked)" : "Not shared")}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {lead.leadAcceptanceCharge && (
                    <span className="font-mono text-xs font-bold text-[#c2410c] dark:text-orange-400">
                      {lead.leadAcceptanceCharge} Coins
                    </span>
                  )}
                  <Link to={`/vendor/leads/${lead.id}`}>
                    <Button accent="orange" variant="secondary" className="!py-1.5 !px-3 text-xs font-bold">
                      Open Job →
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
