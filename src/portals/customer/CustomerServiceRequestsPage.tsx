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

const stageOf: Record<string, number> = {
  REQUESTED: 0,
  NEW: 0,
  ASSIGNED: 1,
  ACCEPTED: 1,
  IN_PROGRESS: 2,
  ONGOING: 2,
  COMPLETED: 3,
};
const stages = ["Requested", "Assigned", "In progress", "Completed"];

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
      customerApi.get("/customer/addresses"),
      customerApi.get("/catalog/service"),
    ]).then(([r, a, s]) => {
      if (r.status === "fulfilled") setRequests(unwrapList<ServiceRequest>(r.value.data?.data ?? r.value.data));
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
    <div>
      <PageHeader
        eyebrow="Doorstep Care"
        title="Appliance Service Requests"
        description="Book on-site repair and maintenance for RO Purifiers, ACs, Refrigerators, and Geysers with Google Maps live technician tracking."
        action={
          <Button accent="teal" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Cancel" : "+ Book a Service Visit"}
          </Button>
        }
      />

      {/* Live Google Maps Tracker Modal when active */}
      {trackingRequest && (
        <GoogleMapsTracker
          isModal
          isOpen={Boolean(trackingRequest)}
          onClose={() => setTrackingRequest(null)}
          serviceId={trackingRequest.id.slice(0, 10)}
          serviceTitle={trackingRequest.service?.name ?? "Appliance Service"}
          initialStage={trackingRequest.status}
        />
      )}

      {/* Demo QR Generator Modal */}
      {qrRequest && (
        <DemoQrGenerator
          isModal
          isOpen={Boolean(qrRequest)}
          onClose={() => setQrRequest(null)}
          title={`Service Verification Pass • #${qrRequest.id.slice(0, 8)}`}
          subtitle="Show this QR code to the verified technician on doorstep arrival"
          initialValue={`ROCARE-SERVICE:${qrRequest.id}:OTP-5812:STATUS:${qrRequest.status}`}
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
                {[
                  { key: "RO", label: "💧 RO Water Purifier Services" },
                  { key: "AC", label: "❄️ Air Conditioner (AC) Services" },
                  { key: "FRIDGE", label: "🧊 Refrigerator (Fridge) Services" },
                  { key: "GEYSER", label: "🔥 Water Heater (Geyser) Services" },
                  { key: "OTHER", label: "⚙️ General Appliance Repair" },
                ].map((cat) => {
                  const inCat = services.filter((s) => s.category?.toUpperCase() === cat.key);
                  if (inCat.length === 0) return null;
                  return (
                    <optgroup key={cat.key} label={cat.label} className="font-bold text-gray-900 dark:text-white">
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
            Book a service above to get a certified ROCARE India technician dispatched with live Google Maps tracking.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button
              accent="teal"
              variant="secondary"
              onClick={() =>
                setTrackingRequest({
                  id: "DEMO-SR-08114",
                  status: "IN_PROGRESS",
                  createdAt: new Date().toISOString(),
                  service: { name: "RO Membrane Replacement & Multi-Stage TDS Calibration", category: "RO" },
                })
              }
            >
              🗺️ Google Maps Live Tracking Demo
            </Button>
            <Button
              accent="teal"
              variant="secondary"
              onClick={() =>
                setQrRequest({
                  id: "DEMO-SR-08114",
                  status: "IN_PROGRESS",
                  createdAt: new Date().toISOString(),
                  service: { name: "RO Membrane Replacement & Multi-Stage TDS Calibration", category: "RO" },
                })
              }
            >
              📱 View Demo QR Pass
            </Button>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {requests.map((r) => (
            <Card key={r.id} className="p-5 hover:shadow-lg transition-all border border-gray-200 dark:border-gray-800">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-bold text-base text-gray-900 dark:text-white">{r.service?.name ?? "Appliance Service Request"}</p>
                  <p className="font-mono text-xs font-semibold text-gray-500">#{r.id.slice(0, 8)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone="teal">{r.status.replace(/_/g, " ")}</Badge>
                  <Button
                    accent="teal"
                    variant="secondary"
                    className="!py-1.5 !px-3 !text-xs font-bold"
                    onClick={() => setQrRequest(r)}
                  >
                    📱 QR Pass
                  </Button>
                  <Button
                    accent="teal"
                    className="!py-1.5 !px-3.5 !text-xs font-bold shadow-sm"
                    onClick={() => setTrackingRequest(r)}
                  >
                    🗺️ Google Maps Track
                  </Button>
                </div>
              </div>
              {r.notes && <p className="mt-2 text-xs font-medium text-gray-700 dark:text-gray-300">Notes: {r.notes}</p>}
              <div className="mt-4">
                <StageBar stages={stages} activeIndex={stageOf[r.status] ?? 0} accent="var(--color-teal)" />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
