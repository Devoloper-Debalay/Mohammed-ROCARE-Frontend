import { type FormEvent, useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { adminApi, unwrapList } from "@/lib/apiClient";

interface Setting {
  key: string;
  value: unknown;
  description?: string;
}

export function SuperAdminSettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ key: "", value: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    adminApi
      .get("/admin/super/settings")
      .then((res) => {
        const raw = res.data?.data ?? res.data;
        if (Array.isArray(raw)) {
          setSettings(raw);
        } else if (raw && typeof raw === "object") {
          const list = Object.entries(raw).map(([key, val]) => ({
            key,
            value: typeof val === "object" && val !== null && "value" in val ? (val as any).value : val,
            description: typeof val === "object" && val !== null && "description" in val ? (val as any).description : undefined,
          }));
          setSettings(list);
        } else {
          setSettings([]);
        }
      })
      .catch(() => setSettings([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      let value: unknown = form.value;
      try {
        value = JSON.parse(form.value);
      } catch {
        // not JSON — keep as plain string
      }
      await adminApi.put("/admin/super/settings", { key: form.key, value, description: form.description || undefined });
      setForm({ key: "", value: "", description: "" });
      load();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Couldn't save that setting.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader eyebrow="Platform" title="Settings" description="Platform-wide configuration, stored as key/value pairs." />

      <Card className="mb-6 p-6">
        <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Key" placeholder="lead_acceptance_charge" value={form.key} onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))} required />
          <Input
            label="Value"
            placeholder="Plain text or JSON"
            value={form.value}
            onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
            required
          />
          <Input
            label="Description (optional)"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="sm:col-span-2"
          />
          {error && <p className="text-sm font-medium text-danger sm:col-span-2">{error}</p>}
          <div className="sm:col-span-2">
            <Button type="submit" accent="gold" loading={saving}>
              Save setting
            </Button>
          </div>
        </form>
      </Card>

      {loading ? (
        <div className="h-32 animate-pulse rounded-card bg-ink/[0.04]" />
      ) : settings.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="font-display text-lg font-semibold text-ink">No settings configured yet</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {settings.map((s) => (
            <Card key={s.key} className="flex items-center justify-between gap-4 p-4">
              <div>
                <p className="font-mono text-sm font-semibold text-ink">{s.key}</p>
                {s.description && <p className="text-xs text-ink-soft/50">{s.description}</p>}
              </div>
              <span className="font-mono text-sm text-ink-soft/70">{JSON.stringify(s.value)}</span>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
