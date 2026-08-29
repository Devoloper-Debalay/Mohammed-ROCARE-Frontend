import { type FormEvent, useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, Badge } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { adminApi, unwrapList } from "@/lib/apiClient";

interface Admin {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: string;
  isActive?: boolean;
}

const emptyForm = { firstName: "", lastName: "", email: "", jobTitle: "" };

export function SuperAdminAdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    adminApi
      .get("/admin/super/admins")
      .then((res) => setAdmins(unwrapList<Admin>(res.data?.data ?? res.data)))
      .catch(() => setAdmins([]))
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
      await adminApi.post("/admin/super/admins", form);
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Couldn't create that admin.");
    } finally {
      setSaving(false);
    }
  };

  const changeRole = async (id: string, role: string) => {
    await adminApi.patch(`/admin/super/admins/${id}/role`, { role });
    load();
  };

  return (
    <div>
      <PageHeader
        eyebrow="Platform"
        title="Admins"
        description="Manage admin accounts and roles."
        action={
          <Button accent="gold" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Cancel" : "Add admin"}
          </Button>
        }
      />

      {showForm && (
        <Card className="mb-6 p-6">
          <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="First name" value={form.firstName} onChange={update("firstName")} required />
            <Input label="Last name" value={form.lastName} onChange={update("lastName")} required />
            <Input label="Email" type="email" value={form.email} onChange={update("email")} required />
            <Input label="Job title (optional)" value={form.jobTitle} onChange={update("jobTitle")} />
            {error && <p className="text-sm font-medium text-danger sm:col-span-2">{error}</p>}
            <p className="text-xs text-ink-soft/60 sm:col-span-2">
              A temporary password is generated automatically if none is set — the new admin resets it on first login.
            </p>
            <div className="sm:col-span-2">
              <Button type="submit" accent="gold" loading={saving}>
                Create admin
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="h-32 animate-pulse rounded-card bg-ink/[0.04]" />
      ) : admins.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="font-display text-lg font-semibold text-ink">No admins yet</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {admins.map((a) => (
            <Card key={a.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-medium text-ink">{a.firstName} {a.lastName}</p>
                <p className="text-sm text-ink-soft/60">{a.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={a.role === "SADMIN" ? "gold" : "slate"}>{a.role}</Badge>
                <select
                  defaultValue=""
                  onChange={(e) => e.target.value && changeRole(a.id, e.target.value)}
                  className="rounded-lg border border-ink/10 bg-surface px-2 py-1.5 text-xs"
                >
                  <option value="" disabled>
                    Change role
                  </option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="SADMIN">SADMIN</option>
                </select>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
