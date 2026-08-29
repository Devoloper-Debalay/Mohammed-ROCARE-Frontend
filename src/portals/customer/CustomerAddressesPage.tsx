import { type FormEvent, useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { customerApi } from "@/lib/apiClient";

interface Address {
  id: string;
  label: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
}

const emptyForm = { label: "", line1: "", line2: "", city: "", state: "", pincode: "" };

export function CustomerAddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    customerApi
      .get("/customer/addresses")
      .then((res) => setAddresses(res.data?.data ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await customerApi.post("/customer/addresses", form);
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch {
      setError("Couldn't save that address. Check the fields and try again.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    await customerApi.delete(`/customer/addresses/${id}`);
    load();
  };

  return (
    <div>
      <PageHeader
        eyebrow="Account"
        title="Addresses"
        description="Where technicians and deliveries should reach you."
        action={
          <Button accent="teal" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Cancel" : "Add address"}
          </Button>
        }
      />

      {showForm && (
        <Card className="mb-6 p-6">
          <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Label" placeholder="Home, Office…" value={form.label} onChange={update("label")} required />
            <Input label="Pincode" value={form.pincode} onChange={update("pincode")} required />
            <Input label="Address line 1" value={form.line1} onChange={update("line1")} required className="sm:col-span-2" />
            <Input label="Address line 2 (optional)" value={form.line2} onChange={update("line2")} className="sm:col-span-2" />
            <Input label="City" value={form.city} onChange={update("city")} required />
            <Input label="State" value={form.state} onChange={update("state")} required />
            {error && <p className="text-sm font-medium text-danger sm:col-span-2">{error}</p>}
            <div className="sm:col-span-2">
              <Button type="submit" accent="teal" loading={saving}>
                Save address
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="h-32 animate-pulse rounded-card bg-ink/[0.04]" />
      ) : addresses.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="font-display text-lg font-semibold text-ink">No addresses saved</p>
          <p className="mt-1 text-sm text-ink-soft/70">Add one so technicians know where to go.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {addresses.map((a) => (
            <Card key={a.id} className="p-5">
              <div className="flex items-start justify-between">
                <p className="font-semibold text-ink">{a.label}</p>
                <button onClick={() => remove(a.id)} className="text-xs font-semibold text-danger">
                  Remove
                </button>
              </div>
              <p className="mt-1 text-sm text-ink-soft/70">
                {a.line1}
                {a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} {a.pincode}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
