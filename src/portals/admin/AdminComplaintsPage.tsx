import { type FormEvent, useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, Badge } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { adminApi, unwrapList } from "@/lib/apiClient";

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

export function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    adminApi
      .get("/admin/complaints")
      .then((res) => setComplaints(unwrapList<Complaint>(res.data?.data ?? res.data)))
      .catch(() => setComplaints([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const reply = async (id: string, e: FormEvent) => {
    e.preventDefault();
    setSavingId(id);
    try {
      await adminApi.patch(`/admin/complaints/${id}`, { reply: replyDrafts[id], status: "RESOLVED" });
      load();
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div>
      <PageHeader eyebrow="Support" title="Complaints" description="Customer and vendor complaints for your branch." />

      {loading ? (
        <div className="h-40 animate-pulse rounded-card bg-ink/[0.04]" />
      ) : complaints.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="font-display text-lg font-semibold text-ink">No complaints right now</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {complaints.map((c) => (
            <Card key={c.id} className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-ink">{c.subject}</p>
                <Badge tone={statusTone[c.status] ?? "neutral"}>{c.status}</Badge>
              </div>
              <p className="mt-1.5 text-sm text-ink-soft/70">{c.description}</p>
              {c.reply ? (
                <div className="mt-3 rounded-xl bg-base px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-ink-soft/50">Your response</p>
                  <p className="mt-1 text-sm text-ink">{c.reply}</p>
                </div>
              ) : (
                <form onSubmit={(e) => reply(c.id, e)} className="mt-3 flex gap-2">
                  <Input
                    label="Reply"
                    value={replyDrafts[c.id] ?? ""}
                    onChange={(e) => setReplyDrafts((d) => ({ ...d, [c.id]: e.target.value }))}
                    required
                    className="flex-1"
                  />
                  <Button type="submit" accent="slate" loading={savingId === c.id} className="self-end">
                    Send
                  </Button>
                </form>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
