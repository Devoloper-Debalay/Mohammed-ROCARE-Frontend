import { type FormEvent, useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, Badge } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { StageBar } from "@/components/ui/StageRing";
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
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ serviceId: "", addressId: "", scheduledAt: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    Promise.allSettled([
      customerApi.get("/customer/service-request"),
      customerApi.get("/customer/addresses"),
      customerApi.get("/catalog/service"),
    ]).then(([r, a, s]) => {
      if (r.status === "fulfilled") setRequests(unwrapList<ServiceRequest>(r.value.data?.data ?? r.value.data));
      if (a.status === "fulfilled") setAddresses(unwrapList<Address>(a.value.data?.data ?? a.value.data));
      if (s.status === "fulfilled") setServices(unwrapList<Service>(s.value.data?.data ?? s.value.data));
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
        eyebrow="Service"
        title="Service requests"
        description="Raise and track RO, AC and geyser service jobs."
        action={
          <Button accent="teal" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Cancel" : "Raise a request"}
          </Button>
        }
      />

      {showForm && (
        <Card className="mb-6 p-6">
          <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-sm font-medium text-ink-soft">Service</label>
              <select
                value={form.serviceId}
                onChange={(e) => setForm((f) => ({ ...f, serviceId: e.target.value }))}
                className="w-full rounded-xl border border-ink/10 bg-surface px-4 py-2.5 text-[15px] text-ink"
                required
              >
                <option value="" disabled>
                  {services.length === 0 ? "No services available" : "Select a service"}
                </option>
                {["RO", "AC", "GEYSER", "OTHER"].map((cat) => {
                  const inCat = services.filter((s) => s.category === cat);
                  if (inCat.length === 0) return null;
                  return (
                    <optgroup key={cat} label={cat}>
                      {inCat.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} — ₹{s.price}
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
              {selectedService?.description && <p className="text-xs text-ink-soft/60">{selectedService.description}</p>}
            </div>
            {addresses.length > 0 && (
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-sm font-medium text-ink-soft">Address</label>
                <select
                  value={form.addressId}
                  onChange={(e) => setForm((f) => ({ ...f, addressId: e.target.value }))}
                  className="w-full rounded-xl border border-ink/10 bg-surface px-4 py-2.5 text-[15px] text-ink"
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
            <Input label="Preferred date (optional)" type="datetime-local" value={form.scheduledAt} onChange={update("scheduledAt")} />
            <Input label="Notes (optional)" placeholder="Describe the issue" value={form.notes} onChange={update("notes")} />
            {error && <p className="text-sm font-medium text-danger sm:col-span-2">{error}</p>}
            <div className="sm:col-span-2">
              <Button type="submit" accent="teal" loading={saving} disabled={!form.serviceId}>
                Submit request
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="h-32 animate-pulse rounded-card bg-ink/[0.04]" />
      ) : requests.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="font-display text-lg font-semibold text-ink">No service requests yet</p>
          <p className="mt-1 text-sm text-ink-soft/70">Raise one above to get a technician assigned.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {requests.map((r) => (
            <Card key={r.id} className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-ink">{r.service?.name ?? "Service request"}</p>
                  <p className="font-mono text-xs text-ink-soft/50">#{r.id.slice(0, 8)}</p>
                </div>
                <Badge tone="teal">{r.status.replaceAll("_", " ")}</Badge>
              </div>
              {r.notes && <p className="mt-2 text-sm text-ink-soft/70">{r.notes}</p>}
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

