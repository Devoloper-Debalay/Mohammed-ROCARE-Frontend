import { type FormEvent, useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, Badge } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { StageBar } from "@/components/ui/StageRing";
import { GoogleMapsTracker } from "@/components/tracking/GoogleMapsTracker";
import { DemoQrGenerator } from "@/components/qr/DemoQrGenerator";
import { customerApi, unwrapList } from "@/lib/apiClient";

interface ServiceRequest {
  id: string;
  status: string;
  notes?: string;
  scheduledAt?: string;
  createdAt: string;
  service?: { name: string; category: string };
}

interface Address {
  id: string;
  label: string;
}

interface Service {
  id: string;
  name: string;
  category: string;
  price: string;
  description?: string;
}

const DEFAULT_INDIAN_SERVICES: Service[] = [
  // RO Water Purifier
  { id: "srv-ro-1", name: "RO Complete Filter & Membrane Replacement", category: "RO", price: "1,499", description: "Sediment + Carbon + RO 0.0001µm membrane + Post carbon + TDS check." },
  { id: "srv-ro-2", name: "RO Annual Maintenance Contract (AMC Comprehensive)", category: "RO", price: "2,999", description: "3 Periodic services + all filter replacements + electrical parts coverage." },
  { id: "srv-ro-3", name: "RO Alkaline & Copper Mineral Cartridge Upgrade", category: "RO", price: "899", description: "Enrich drinking water with active copper, zinc and pH 8.5 balance." },
  
  // Air Conditioner (AC)
  { id: "srv-ac-1", name: "AC Jet Pump Foam Deep Cleaning Service", category: "AC", price: "699", description: "High-pressure jet cleaning for indoor and outdoor coils + filter wash." },
  { id: "srv-ac-2", name: "AC Gas Leakage Repair & Full Gas Charging", category: "AC", price: "2,200", description: "Nitrogen pressure testing, brazing leak repair, and original R32/R410A gas." },
  { id: "srv-ac-3", name: "AC PCB Circuit Board Diagnostics & Repair", category: "AC", price: "1,200", description: "Component-level PCB testing, capacitor, and sensor replacement." },

  // Refrigerator (Fridge)
  { id: "srv-fridge-1", name: "Refrigerator Gas Refill & Compressor Check", category: "FRIDGE", price: "1,850", description: "Hydrocarbon / R134a charging, capillary tube cleaning and cooling audit." },
  { id: "srv-fridge-2", name: "Fridge Defrost Heater & Thermostat Repair", category: "FRIDGE", price: "750", description: "Resolves ice build-up issues in frost-free double door refrigerators." },
  { id: "srv-fridge-3", name: "Refrigerator Inverter Inverter Board Repair", category: "FRIDGE", price: "1,400", description: "Diagnostics for inverter motor tripping and start relay replacement." },

  // Geyser / Water Heater
  { id: "srv-geyser-1", name: "Geyser Heating Element & Anode Replacement", category: "GEYSER", price: "850", description: "2000W Incoloy heating coil replacement with magnesium anti-corrosion rod." },
  { id: "srv-geyser-2", name: "Geyser Tank Descaling & Deep Cleaning", category: "GEYSER", price: "550", description: "Removes hard water scale deposits, improves heating efficiency." },
  { id: "srv-geyser-3", name: "Geyser Thermostat & Pressure Valve Overhaul", category: "GEYSER", price: "450", description: "Safety cutoff valve inspection and temperature sensor calibration." },
];

const stages = ["Requested", "Assigned", "In progress", "Completed"];

const getStatusTheme = (status: string) => {
  const norm = (status || "").toUpperCase();
  if (norm === "COMPLETED" || norm === "DELIVERED" || norm === "RESOLVED") {
    return {
      label: "COMPLETED",
      badgeClass: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40",
      accent: "#10b981", // Emerald 500
      activeIndex: 3,
      isDenied: false,
    };
  }
  if (norm === "ONGOING" || norm === "IN_PROGRESS") {
    return {
      label: norm.replace(/_/g, " "),
      badgeClass: "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40",
      accent: "#f59e0b", // Amber 500
      activeIndex: 2,
      isDenied: false,
    };
  }
  if (norm === "ACCEPTED" || norm === "ASSIGNED") {
    return {
      label: norm.replace(/_/g, " "),
      badgeClass: "bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/40",
      accent: "#0ea5e9", // Sky 500
      activeIndex: 1,
      isDenied: false,
    };
  }
  if (norm === "DENIED" || norm === "CANCELLED" || norm === "REJECTED") {
    return {
      label: norm.replace(/_/g, " "),
      badgeClass: "bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/40",
      accent: "#f43f5e", // Rose 500
      activeIndex: 0,
      isDenied: true,
    };
  }
  return {
    label: norm.replace(/_/g, " ") || "REQUESTED",
    badgeClass: "bg-teal-500/20 text-teal-700 dark:text-teal-400 border border-teal-500/40",
    accent: "#0d9488", // Teal 600
    activeIndex: 0,
    isDenied: false,
  };
};

export function CustomerServiceRequestsPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [services, setServices] = useState<Service[]>(DEFAULT_INDIAN_SERVICES);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ serviceId: "", addressId: "", scheduledAt: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [trackingRequest, setTrackingRequest] = useState<ServiceRequest | null>(null);
  const [qrRequest, setQrRequest] = useState<ServiceRequest | null>(null);

  const load = () => {
    setLoading(true);
    Promise.allSettled([
      customerApi.get("/customer/service-request"),
      customerApi.get("/customer/service-requests"),
      customerApi.get("/customer/addresses"),
      customerApi.get("/catalog/service"),
    ]).then(([r1, r2, a, s]) => {
      let reqList: ServiceRequest[] = [];
      if (r1.status === "fulfilled") reqList = unwrapList<ServiceRequest>(r1.value.data?.data ?? r1.value.data);
      if (reqList.length === 0 && r2.status === "fulfilled") reqList = unwrapList<ServiceRequest>(r2.value.data?.data ?? r2.value.data);
      setRequests(reqList);

      if (a.status === "fulfilled") setAddresses(unwrapList<Address>(a.value.data?.data ?? a.value.data));
      if (s.status === "fulfilled") {
        const sList = unwrapList<Service>(s.value.data?.data ?? s.value.data);
        if (sList.length > 0) setServices(sList);
      }
      setLoading(false);
    });
  };

  useEffect(load, []);

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await customerApi.post("/customer/service-request", {
        serviceId: form.serviceId,
        addressId: form.addressId || undefined,
        scheduledAt: form.scheduledAt || undefined,
        notes: form.notes || undefined,
      });
      setForm({ serviceId: "", addressId: "", scheduledAt: "", notes: "" });
      setShowForm(false);
      load();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Couldn't raise that request. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const selectedService = services.find((s) => s.id === form.serviceId);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Doorstep Appliance Maintenance"
        title="Service Requests &amp; Live Tracking"
        description="Book on-demand RO filter swap, AC servicing, Geyser repair, and track your technician with GPS updates."
        action={
          <Button accent="teal" onClick={() => setShowForm((v) => !v)} className="font-bold shadow-md">
            {showForm ? "✕ Cancel Form" : "+ Raise Service Request"}
          </Button>
        }
      />

      {/* Google Maps Tracking Modal */}
      {trackingRequest && (
        <GoogleMapsTracker
          isModal
          isOpen={Boolean(trackingRequest)}
          onClose={() => setTrackingRequest(null)}
          serviceId={trackingRequest.id}
          serviceTitle={trackingRequest.service?.name || "Doorstep Appliance Service"}
          vendorName="Verified Just24You Technician"
          vendorPhone="+91 22 6971 1316"
        />
      )}

      {/* Floating QR Modal */}
      {qrRequest && (
        <DemoQrGenerator
          isModal
          isOpen={Boolean(qrRequest)}
          onClose={() => setQrRequest(null)}
          title={`Service Verification Pass • #${qrRequest.id.slice(0, 8)}`}
          subtitle="Show this QR code to the verified technician on doorstep arrival"
          initialValue={`Just24You-SERVICE:${qrRequest.id}:OTP-5812:STATUS:${qrRequest.status}`}
        />
      )}

      {showForm && (
        <Card className="mb-6 p-6 border border-gray-200 dark:border-gray-800 shadow-xl">
          <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-sm font-bold text-gray-900 dark:text-white">
                Select Appliance &amp; Service Package
              </label>
              <select
                value={form.serviceId}
                onChange={(e) => setForm((f) => ({ ...f, serviceId: e.target.value }))}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-[15px] font-semibold text-gray-900 dark:text-white focus:border-[#0f766e] focus:outline-none"
                required
              >
                <option value="" disabled>
                  Select service package...
                </option>
                {Array.from(new Set(services.map((s) => s.category || "General Appliance Services"))).map((catName) => {
                  const inCat = services.filter((s) => (s.category || "General Appliance Services") === catName);
                  if (inCat.length === 0) return null;
                  return (
                    <optgroup key={catName} label={catName} className="font-bold text-gray-900 dark:text-white">
                      {inCat.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} — ₹{s.price}
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
              {selectedService?.description && (
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mt-1">
                  ℹ️ {selectedService.description}
                </p>
              )}
            </div>

            {addresses.length > 0 && (
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-sm font-bold text-gray-900 dark:text-white">Doorstep Address</label>
                <select
                  value={form.addressId}
                  onChange={(e) => setForm((f) => ({ ...f, addressId: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-[15px] font-medium text-gray-900 dark:text-white focus:border-[#0f766e] focus:outline-none"
                >
                  <option value="">Select an address</option>
                  {addresses.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <Input label="Preferred Date & Time Slot" type="datetime-local" value={form.scheduledAt} onChange={update("scheduledAt")} />
            <Input label="Issue Description / Symptoms" placeholder="e.g. RO water taste bad, AC not cooling, Fridge making noise" value={form.notes} onChange={update("notes")} />

            {error && <p className="text-sm font-bold text-red-600 dark:text-red-400 sm:col-span-2">{error}</p>}

            <div className="sm:col-span-2">
              <Button type="submit" accent="teal" loading={saving} disabled={!form.serviceId} className="!py-3 !px-6 font-bold shadow-md">
                Confirm &amp; Book Doorstep Technician
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="h-32 animate-pulse rounded-card bg-gray-200 dark:bg-gray-800" />
      ) : requests.length === 0 ? (
        <Card className="p-10 text-center border border-gray-200 dark:border-gray-800">
          <p className="font-display text-xl font-bold text-gray-900 dark:text-white">No active service requests</p>
          <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
            Book a service above to get a certified Just24You India technician dispatched with live Google Maps tracking.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {requests.map((r) => {
            const theme = getStatusTheme(r.status);
            return (
              <Card key={r.id} className="p-5 hover:shadow-lg transition-all border border-gray-200 dark:border-gray-800">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-bold text-base text-gray-900 dark:text-white">{r.service?.name ?? "Appliance Service Request"}</p>
                    <p className="font-mono text-xs font-semibold text-gray-500">#{r.id.slice(0, 8)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-black uppercase ${theme.badgeClass}`}>
                      {theme.label}
                    </span>
                    <Button
                      accent="teal"
                      variant="secondary"
                      className={`!py-1.5 !px-3 !text-xs font-bold ${theme.isDenied ? "opacity-35 cursor-not-allowed" : ""}`}
                      disabled={theme.isDenied}
                      onClick={() => setQrRequest(r)}
                    >
                      📱 QR Pass
                    </Button>
                    <Button
                      accent="teal"
                      className={`!py-1.5 !px-3.5 !text-xs font-bold shadow-sm ${theme.isDenied ? "opacity-35 cursor-not-allowed" : ""}`}
                      disabled={theme.isDenied}
                      onClick={() => setTrackingRequest(r)}
                    >
                      🗺️ Google Maps Track
                    </Button>
                  </div>
                </div>
                {r.notes && <p className="mt-2 text-xs font-medium text-gray-700 dark:text-gray-300">Notes: {r.notes}</p>}
                
                {/* Dynamic Status Stage Bar */}
                <div className="mt-4">
                  {theme.isDenied ? (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 font-bold">
                      <span>🚫</span> Service Request Denied / Cancelled by Technician
                    </div>
                  ) : (
                    <StageBar stages={stages} activeIndex={theme.activeIndex} accent={theme.accent} />
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
