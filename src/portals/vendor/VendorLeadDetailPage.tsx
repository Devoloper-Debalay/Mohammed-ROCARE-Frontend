import { type FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { StageBar } from "@/components/ui/StageRing";
import { GoogleMapsTracker } from "@/components/tracking/GoogleMapsTracker";
import { GeoTaggedCamera } from "@/components/camera/GeoTaggedCamera";
import { DemoQrGenerator } from "@/components/qr/DemoQrGenerator";
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
  const [showNavigation, setShowNavigation] = useState(false);
  const [showGeoCamera, setShowGeoCamera] = useState<"start" | "deny" | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [geoCoords, setGeoCoords] = useState<{ latitude?: number; longitude?: number }>({});

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

  const handleGeoCapture = (file: File, geo: { latitude: number; longitude: number }) => {
    setProofFile(file);
    setGeoCoords({ latitude: geo.latitude, longitude: geo.longitude });
    setShowGeoCamera(null);
  };

  const start = async (e: FormEvent) => {
    e.preventDefault();
    setActing(true);
    setError("");
    try {
      const fd = new FormData();
      if (geoCoords.latitude) fd.append("latitude", String(geoCoords.latitude));
      if (geoCoords.longitude) fd.append("longitude", String(geoCoords.longitude));
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
      const fd = new FormData();
      if (geoCoords.latitude) fd.append("latitude", String(geoCoords.latitude));
      if (geoCoords.longitude) fd.append("longitude", String(geoCoords.longitude));
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
      <Card className="p-10 text-center border border-ink/[0.08]">
        <p className="font-display text-lg font-semibold text-ink">Lead not found</p>
        <Button accent="orange" variant="secondary" className="mt-4" onClick={() => navigate("/vendor/leads")}>
          Back to leads
        </Button>
      </Card>
    );

  return (
    <div>
      <PageHeader
        eyebrow="Lead Details"
        title={lead.customerName}
        description={`${lead.serviceType ?? "Service"} · ${lead.area ?? "Area not shared"}`}
        action={
          <div className="flex gap-2">
            <Button accent="orange" variant="secondary" onClick={() => setShowQrModal(true)}>
              📱 QR Pass
            </Button>
            {(lead.status === "ACCEPTED" || lead.status === "ONGOING") && (
              <Button accent="orange" onClick={() => setShowNavigation((v) => !v)}>
                {showNavigation ? "Hide Google Map" : "🗺️ Google Maps Navigation"}
              </Button>
            )}
          </div>
        }
      />

      {/* Demo QR Generator Modal */}
      {showQrModal && (
        <DemoQrGenerator
          isModal
          isOpen={showQrModal}
          onClose={() => setShowQrModal(false)}
          title={`Job QR Pass • #${lead.id.slice(0, 8)}`}
          initialValue={`ROCARE-LEAD:${lead.id}:CUSTOMER:${lead.customerName}`}
        />
      )}

      {/* Geo-Tagged Camera Modal */}
      {showGeoCamera && (
        <GeoTaggedCamera
          isOpen={Boolean(showGeoCamera)}
          onCapture={handleGeoCapture}
          onCancel={() => setShowGeoCamera(null)}
          title={showGeoCamera === "start" ? "On-Site Start Job Geotag" : "Denial On-Site Geotag"}
          subtitle="Captures tamper-proof GPS coordinates and official watermark onto photo"
        />
      )}

      {/* Google Maps Route Navigation View */}
      {showNavigation && (
        <div className="mb-6">
          <GoogleMapsTracker
            isModal={false}
            serviceId={`LEAD-${lead.id.slice(0, 8)}`}
            serviceTitle={`Navigating to: ${lead.customerName} (${lead.serviceType ?? "RO Service"})`}
            customerAddress={lead.area ?? "Customer Site"}
            initialStage={lead.status}
          />
        </div>
      )}

      <Card className="p-6 border border-ink/[0.08]">
        <div className="mb-5 flex items-center justify-between">
          <Badge tone="orange">{lead.status.replace(/_/g, " ")}</Badge>
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
              <Button accent="orange" onClick={() => setShowNavigation(true)}>
                🗺️ Start Navigation
              </Button>
            </>
          )}
        </div>

        {/* Start Proof with Geo-Tagged Camera Integration */}
        {lead.status === "ACCEPTED" && !showDenyForm && (
          <form onSubmit={start} className="mt-6 flex flex-col gap-3 rounded-2xl bg-base p-5 border border-ink/[0.06]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-ink">Submit start-of-work proof</p>
                <p className="text-xs text-ink-soft/70">
                  Must include verified on-site photo with GPS geotag metadata.
                </p>
              </div>
              <Button
                type="button"
                accent="orange"
                variant="secondary"
                onClick={() => setShowGeoCamera("start")}
                className="!py-1.5 !px-3 !text-xs"
              >
                📸 Open Geotagged Cam
              </Button>
            </div>

            {proofFile ? (
              <div className="rounded-xl bg-surface p-3 border border-emerald-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <div>
                    <p className="text-xs font-semibold text-ink">{proofFile.name}</p>
                    <p className="text-[11px] font-mono text-ink-soft/70">
                      GPS: {geoCoords.latitude?.toFixed(4)}, {geoCoords.longitude?.toFixed(4)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setProofFile(null);
                    setGeoCoords({});
                  }}
                  className="text-xs text-danger font-medium hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
                className="text-sm border border-ink/10 rounded-xl p-2 bg-surface text-ink"
              />
            )}

            <Button type="submit" accent="orange" loading={acting} className="w-fit mt-2">
              Submit &amp; Start Job
            </Button>
          </form>
        )}

        {/* Denial Proof with Geo-Tagged Camera Integration */}
        {showDenyForm && (
          <form onSubmit={deny} className="mt-6 flex flex-col gap-3 rounded-2xl bg-base p-5 border border-ink/[0.06]">
            <p className="text-sm font-semibold text-ink">Submit denial proof</p>
            <Input label="Reason" value={denyReason} onChange={(e) => setDenyReason(e.target.value)} required />
            <div className="flex items-center justify-between">
              <span className="text-xs text-ink-soft/70">Attach customer denial / locked site photo</span>
              <Button
                type="button"
                accent="orange"
                variant="secondary"
                onClick={() => setShowGeoCamera("deny")}
                className="!py-1 !px-2.5 !text-xs"
              >
                📸 Geotag Photo
              </Button>
            </div>
            {proofFile && (
              <p className="text-xs text-emerald-600 font-mono">✓ Attached: {proofFile.name}</p>
            )}
            <div className="flex gap-2 mt-2">
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
