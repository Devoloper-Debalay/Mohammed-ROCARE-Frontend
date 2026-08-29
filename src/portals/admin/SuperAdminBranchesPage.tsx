import { type FormEvent, useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, Badge } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { adminApi, unwrapList } from "@/lib/apiClient";

interface Branch {
  id: string;
  code: string;
  name: string;
  city: string;
  state: string;
  pincode?: string;
  isActive: boolean;
}

const emptyForm = { code: "", name: "", city: "", state: "", pincode: "" };

export function SuperAdminBranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    adminApi
      .get("/admin/super/branches")
      .then((res) => setBranches(unwrapList<Branch>(res.data?.data ?? res.data)))
      .catch(() => setBranches([]))
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
      await adminApi.post("/admin/super/branches", form);
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Couldn't create that branch.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Platform"
        title="Branches"
        description="Create and manage branches across the platform."
        action={
          <Button accent="gold" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Cancel" : "Add branch"}
          </Button>
        }
      />

      {showForm && (
        <Card className="mb-6 p-6">
          <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Code" placeholder="KOL-01" value={form.code} onChange={update("code")} required />
            <Input label="Name" value={form.name} onChange={update("name")} required />
            <Input label="City" value={form.city} onChange={update("city")} required />
            <Input label="State" value={form.state} onChange={update("state")} required />
            <Input label="Pincode (optional)" value={form.pincode} onChange={update("pincode")} />
            {error && <p className="text-sm font-medium text-danger sm:col-span-2">{error}</p>}
            <div className="sm:col-span-2">
              <Button type="submit" accent="gold" loading={saving}>
                Create branch
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="h-32 animate-pulse rounded-card bg-ink/[0.04]" />
      ) : branches.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="font-display text-lg font-semibold text-ink">No branches yet</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {branches.map((b) => (
            <Card key={b.id} className="p-5">
              <div className="flex items-center justify-between">
                <p className="font-mono text-xs text-ink-soft/50">{b.code}</p>
                <Badge tone={b.isActive ? "success" : "neutral"}>{b.isActive ? "Active" : "Inactive"}</Badge>
              </div>
              <p className="mt-1 font-display text-base font-semibold text-ink">{b.name}</p>
              <p className="text-sm text-ink-soft/60">{b.city}, {b.state}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
