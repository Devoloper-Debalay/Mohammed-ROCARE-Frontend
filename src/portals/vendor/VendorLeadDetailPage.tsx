import { type FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { StageBar } from "@/components/ui/StageRing";
import { vendorApi } from "@/lib/apiClient";

interface Lead {
  id: string;
  customerName: string;
  area?: string;
  serviceType?: string;
  issue?: string;
  status: string;
  leadAcceptanceCharge?: string;
}

const stageOf: Record<string, number> = {
  NEW: 0,
  ACCEPTED: 1,
  PENDING_START_VERIFICATION: 1,
  ONGOING: 2,
  PENDING_DENIAL_VERIFICATION: 2,
  COMPLETED: 3,
  DENIED: 3,
};
const stages = ["New", "Accepted", "In progress", "Closed"];

function getGeo(): Promise<{ latitude?: number; longitude?: number }> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve({});
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => resolve({}),
      { timeout: 4000 }
    );
  });
}

export function VendorLeadDetailPage() {
  const { leadId } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState("");
  const [denyReason, setDenyReason] = useState("");
  const [showDenyForm, setShowDenyForm] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);

  const load = () => {
    if (!leadId) return;
    vendorApi
      .get(`/vendor/leads/${leadId}`)
      .then((res) => setLead(res.data?.data ?? null))
      .finally(() => setLoading(false));
  };

  useEffect(load, [leadId]);

  const accept = async () => {
    setActing(true);
    setError("");
    try {
      await vendorApi.post(`/vendor/leads/${leadId}/accept`);
      load();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Couldn't accept — check your wallet balance.");
    } finally {
      setActing(false);
    }
  };

  const start = async (e: FormEvent) => {
    e.preventDefault();
    setActing(true);
    setError("");
    try {
      const geo = await getGeo();
      const fd = new FormData();
      if (geo.latitude) fd.append("latitude", String(geo.latitude));
      if (geo.longitude) fd.append("longitude", String(geo.longitude));
      if (proofFile) fd.append("image", proofFile);
      await vendorApi.post(`/vendor/leads/${leadId}/start`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      load();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Couldn't submit start proof.");
    } finally {
      setActing(false);
    }
  };

  const deny = async (e: FormEvent) => {
    e.preventDefault();
    setActing(true);
    setError("");
    try {
      const geo = await getGeo();
      const fd = new FormData();
      if (geo.latitude) fd.append("latitude", String(geo.latitude));
      if (geo.longitude) fd.append("longitude", String(geo.longitude));
      fd.append("reason", denyReason);
      if (proofFile) fd.append("image", proofFile);
      await vendorApi.post(`/vendor/leads/${leadId}/deny`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      load();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Couldn't submit denial.");
    } finally {
      setActing(false);
    }
  };

  const complete = async () => {
    setActing(true);
    setError("");
    try {
      await vendorApi.post(`/vendor/leads/${leadId}/complete`);
      load();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Couldn't mark complete.");
    } finally {
      setActing(false);
    }
  };

  if (loading) return <div className="h-64 animate-pulse rounded-card bg-ink/[0.04]" />;
  if (!lead)
    return (
      <Card className="p-10 text-center">
        <p className="font-display text-lg font-semibold text-ink">Lead not found</p>
        <Button accent="orange" variant="secondary" className="mt-4" onClick={() => navigate("/vendor/leads")}>
          Back to leads
        </Button>
      </Card>
    );

  return (
    <div>
      <PageHeader eyebrow="Lead" title={lead.customerName} description={`${lead.serviceType ?? "Service"} · ${lead.area ?? "Area not shared"}`} />

      <Card className="p-6">
        <div className="mb-5 flex items-center justify-between">
          <Badge tone="orange">{lead.status.replaceAll("_", " ")}</Badge>
          {lead.leadAcceptanceCharge && <span className="font-mono text-sm text-ink-soft/70">{lead.leadAcceptanceCharge} coins to accept</span>}
        </div>

        <StageBar stages={stages} activeIndex={stageOf[lead.status] ?? 0} accent="var(--color-orange)" />

        {lead.issue && <p className="mt-5 text-sm text-ink-soft/70">{lead.issue}</p>}

        {error && <p className="mt-4 text-sm font-medium text-danger">{error}</p>}

        <div className="mt-6 flex flex-wrap gap-3">
          {lead.status === "NEW" && (
            <Button accent="orange" loading={acting} onClick={accept}>
              Accept lead
            </Button>
          )}

          {lead.status === "ACCEPTED" && !showDenyForm && (
            <>
              <Button accent="orange" variant="secondary" onClick={() => setShowDenyForm(true)}>
                Can't do this job
              </Button>
            </>
          )}
        </div>

        {lead.status === "ACCEPTED" && !showDenyForm && (
          <form onSubmit={start} className="mt-6 flex flex-col gap-3 rounded-xl bg-base p-4">
            <p className="text-sm font-semibold text-ink">Submit start-of-work proof</p>
            <input type="file" accept="image/*" onChange={(e) => setProofFile(e.target.files?.[0] ?? null)} className="text-sm" />
            <p className="text-xs text-ink-soft/60">Your location is captured automatically and sent with the proof for admin verification.</p>
            <Button type="submit" accent="orange" loading={acting} className="w-fit">
              Start job
            </Button>
          </form>
        )}

        {showDenyForm && (
          <form onSubmit={deny} className="mt-6 flex flex-col gap-3 rounded-xl bg-base p-4">
            <p className="text-sm font-semibold text-ink">Submit denial proof</p>
            <Input label="Reason" value={denyReason} onChange={(e) => setDenyReason(e.target.value)} required />
            <input type="file" accept="image/*" onChange={(e) => setProofFile(e.target.files?.[0] ?? null)} className="text-sm" />
            <div className="flex gap-2">
              <Button type="submit" accent="orange" loading={acting}>
                Submit denial
              </Button>
              <Button type="button" variant="ghost" accent="orange" onClick={() => setShowDenyForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {lead.status === "ONGOING" && (
          <Button accent="orange" loading={acting} onClick={complete} className="mt-6">
            Mark job complete
          </Button>
        )}

        {(lead.status === "PENDING_START_VERIFICATION" || lead.status === "PENDING_DENIAL_VERIFICATION") && (
          <p className="mt-6 text-sm text-ink-soft/70">Waiting on admin to verify your submitted proof.</p>
        )}
      </Card>
    </div>
  );
}
