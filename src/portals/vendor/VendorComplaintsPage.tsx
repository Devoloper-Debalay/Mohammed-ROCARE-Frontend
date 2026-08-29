import { type FormEvent, useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, Badge } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { vendorApi, unwrapList } from "@/lib/apiClient";

interface Complaint {
  id: string;
  subject: string;
  description: string;
  status: string;
  reply?: string;
}

const statusTone: Record<string, "gold" | "teal" | "success" | "danger" | "neutral"> = {
  OPEN: "gold",
  IN_PROGRESS: "teal",
  RESOLVED: "success",
  CLOSED: "neutral",
};

export function VendorComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ subject: "", description: "" });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    vendorApi
      .get("/vendor/complaints")
      .then((res) => setComplaints(unwrapList<Complaint>(res.data?.data ?? res.data)))
      .catch(() => setComplaints([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await vendorApi.post("/vendor/complaints", form);
      setForm({ subject: "", description: "" });
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Support"
        title="Complaints"
        description="Raise an issue with wallet, leads, payments or products."
        action={
          <Button accent="orange" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Cancel" : "File a complaint"}
          </Button>
        }
      />

      {showForm && (
        <Card className="mb-6 p-6">
          <form onSubmit={submit} className="flex flex-col gap-4">
            <Input label="Subject" value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} required />
            <Input
              label="Description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              required
            />
            <Button type="submit" accent="orange" loading={saving} className="w-fit">
              Submit
            </Button>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="h-32 animate-pulse rounded-card bg-ink/[0.04]" />
      ) : complaints.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="font-display text-lg font-semibold text-ink">No complaints filed</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {complaints.map((c) => (
            <Card key={c.id} className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-ink">{c.subject}</p>
                <Badge tone={statusTone[c.status] ?? "neutral"}>{c.status}</Badge>
              </div>
              <p className="mt-1.5 text-sm text-ink-soft/70">{c.description}</p>
              {c.reply && (
                <div className="mt-3 rounded-xl bg-base px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-ink-soft/50">Response</p>
                  <p className="mt-1 text-sm text-ink">{c.reply}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
