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
import { vendorApi, getErrorMessage } from "@/lib/apiClient";
import { sfx } from "@/lib/soundEffects";
import { ActionSuccessModal } from "@/components/ui/ActionSuccessModal";
import { KycStatusModal } from "@/components/ui/KycStatusModal";
import { useVendorAuth, isVendorApproved } from "@/store/authStore";
import { openRazorpayCheckout } from "@/lib/razorpay";

interface Lead {
  id: string;
  customerName: string;
  phone?: string;
  email?: string;
  address?: string;
  area?: string;
  serviceType?: string;
  issue?: string;
  status: string;
  leadAcceptanceCharge?: string;
  estimatedAmount?: string;
  createdAt?: string;
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
  const { user } = useVendorAuth();
  const approved = isVendorApproved(user);
  const [showKycModal, setShowKycModal] = useState(false);
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
  const [showCompleteChoice, setShowCompleteChoice] = useState(false);
  const [showCashModal, setShowCashModal] = useState(false);
  const [cashAmount, setCashAmount] = useState("");

  // Modern Animated Success Modal State
  const [successModal, setSuccessModal] = useState<{
    isOpen: boolean;
    type: "ACCEPT" | "DENY" | "COMPLETE" | "CREATE";
    title: string;
    message: string;
    leadId?: string;
    subDetail?: string;
  }>({
    isOpen: false,
    type: "ACCEPT",
    title: "",
    message: "",
  });

  const load = () => {
    if (!leadId) return;
    vendorApi
      .get(`/vendor/leads/${leadId}`)
      .then((res) => setLead(res.data?.data ?? null))
      .finally(() => setLoading(false));
  };

  useEffect(load, [leadId]);

  const accept = async () => {
    if (!approved) {
      setShowKycModal(true);
      return;
    }
    setActing(true);
    setError("");
    try {
      await vendorApi.post(`/vendor/leads/${leadId}/accept`);
      sfx.playAccept();
      setSuccessModal({
        isOpen: true,
        type: "ACCEPT",
        title: "Lead Accepted Successfully! ⚡",
        message: "50 coins deducted from your balance. Customer contact phone number & live GPS route unlocked.",
        leadId: leadId ? leadId.slice(0, 8) : undefined,
        subDetail: `Customer: ${lead?.customerName || "Customer"}`,
      });
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
    if (!approved) {
      setShowKycModal(true);
      return;
    }
    setActing(true);
    setError("");
    try {
      const fd = new FormData();
      if (geoCoords.latitude) fd.append("latitude", String(geoCoords.latitude));
      if (geoCoords.longitude) fd.append("longitude", String(geoCoords.longitude));
      if (proofFile) fd.append("image", proofFile);
      await vendorApi.post(`/vendor/leads/${leadId}/start`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      sfx.playAccept();
      setSuccessModal({
        isOpen: true,
        type: "ACCEPT",
        title: "Work Started! 🔧",
        message: "Start geotag proof submitted. You can now service the customer appliance.",
        leadId: leadId ? leadId.slice(0, 8) : undefined,
      });
      load();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Couldn't submit start proof.");
    } finally {
      setActing(false);
    }
  };

  const deny = async (e: FormEvent) => {
    e.preventDefault();
    if (!approved) {
      setShowKycModal(true);
      return;
    }
    setActing(true);
    setError("");
    try {
      const fd = new FormData();
      if (geoCoords.latitude) fd.append("latitude", String(geoCoords.latitude));
      if (geoCoords.longitude) fd.append("longitude", String(geoCoords.longitude));
      fd.append("reason", denyReason);
      if (proofFile) fd.append("image", proofFile);
      await vendorApi.post(`/vendor/leads/${leadId}/deny`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      sfx.playDeny();
      setSuccessModal({
        isOpen: true,
        type: "DENY",
        title: "Lead Denial Proof Submitted 🚫",
        message: "Your denial reason and geo-tagged proof have been submitted for admin verification and coin refund processing.",
        leadId: leadId ? leadId.slice(0, 8) : undefined,
        subDetail: `Reason: ${denyReason || "Customer unavailable / out of service range"}`,
      });
      load();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Couldn't submit denial.");
    } finally {
      setActing(false);
    }
  };

  const openCompleteChoice = () => {
    if (!approved) {
      setShowKycModal(true);
      return;
    }
    setError("");
    setCashAmount(lead?.estimatedAmount || "");
    setShowCompleteChoice(true);
  };

  const onJobCompleted = () => {
    sfx.playComplete();
    setSuccessModal({
      isOpen: true,
      type: "COMPLETE",
      title: "Service Completed Successfully! 🎉",
      message: "Congratulations! The doorstep appliance service has been marked complete and customer warranty updated.",
      leadId: leadId ? leadId.slice(0, 8) : undefined,
      subDetail: "Customer satisfaction score recorded and credited to your technician profile.",
    });
    load();
  };

  const completeCash = async (e: FormEvent) => {
    e.preventDefault();
    const amount = Number(cashAmount);
    if (!amount || amount <= 0) {
      setError("Enter a valid cash amount.");
      return;
    }
    setActing(true);
    setError("");
    try {
      await vendorApi.post(`/vendor/leads/${leadId}/complete/cash`, { amount });
      setShowCashModal(false);
      onJobCompleted();
    } catch (err) {
      setError(getErrorMessage(err, "Couldn't record cash payment."));
    } finally {
      setActing(false);
    }
  };

  const completeRazorpay = async () => {
    setActing(true);
    setError("");
    try {
      const orderRes = await vendorApi.post(`/vendor/leads/${leadId}/complete/razorpay/order`);
      const order = orderRes.data?.data ?? orderRes.data;

      await openRazorpayCheckout({
        key: order.keyId,
        amount: Math.round(order.amount * 100),
        currency: order.currency,
        order_id: order.orderId,
        name: "Just24You India",
        description: `Payment for ${lead?.serviceType || "service"}`,
        prefill: { name: lead?.customerName, contact: lead?.phone },
        theme: { color: "#c2410c" },
        handler: async (response) => {
          try {
            await vendorApi.post(`/vendor/leads/${leadId}/complete/razorpay/verify`, {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            onJobCompleted();
          } catch (err) {
            setError(getErrorMessage(err, "Payment received but verification failed. Contact support."));
          } finally {
            setActing(false);
          }
        },
        modal: { ondismiss: () => setActing(false) },
      });
    } catch (err) {
      setError(getErrorMessage(err, "Couldn't start the payment. Try again."));
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

  const isNew = lead.status === "NEW";

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
            {!isNew && (
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
          initialValue={`Just24You-LEAD:${lead.id}:CUSTOMER:${lead.customerName}`}
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
            customerAddress={lead.address || lead.area || "Customer Site"}
            initialStage={lead.status}
          />
        </div>
      )}

      <Card className="p-6 border border-ink/[0.08]">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge tone="orange">{lead.status.replace(/_/g, " ")}</Badge>
            {isNew ? (
              <Badge tone="gold">🔒 Contact Details Masked</Badge>
            ) : (
              <Badge tone="success">✓ Contact Details Unlocked</Badge>
            )}
          </div>
          {lead.leadAcceptanceCharge && (
            <span className="font-mono text-sm font-semibold text-orange-600 dark:text-orange-400">
              {lead.leadAcceptanceCharge} coins to accept
            </span>
          )}
        </div>

        <StageBar stages={stages} activeIndex={stageOf[lead.status] ?? 0} accent="var(--color-orange)" />

        {/* Customer Contact & Address Card */}
        <div className="mt-6">
          {isNew ? (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-5">
              <div className="flex items-center justify-between gap-2 border-b border-amber-500/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/20 text-base">
                    🔒
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-ink">
                      Customer Contact &amp; Address Protected
                    </h4>
                    <p className="text-xs text-ink-soft/70">
                      This lead is in <strong>NEW</strong> stage. Contact details are masked until you accept the lead.
                    </p>
                  </div>
                </div>
                <Badge tone="gold">Pre-Acceptance</Badge>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-surface p-4 border border-ink/[0.06] shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-ink-soft/60">Phone Number</p>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="font-mono text-lg font-bold text-ink tracking-wide">
                      {lead.phone || "******••••"}
                    </span>
                    <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                      🔒 Masked
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-ink-soft/60">
                    Accept to reveal full 10-digit number &amp; direct calling
                  </p>
                </div>

                <div className="rounded-xl bg-surface p-4 border border-ink/[0.06] shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-ink-soft/60">Service Address &amp; Area</p>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-sm font-semibold text-ink">
                      {lead.address || lead.area || "Location masked"}
                    </span>
                    <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                      🔒 Street Masked
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-ink-soft/60">
                    Full doorstep house/flat number &amp; GPS navigation unlock upon acceptance
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-amber-500/10 pt-3">
                <span className="text-xs text-ink-soft/70">
                  Wallet deduction: <strong className="font-mono font-bold text-orange-600 dark:text-orange-400">{lead.leadAcceptanceCharge || "50"} Coins</strong>
                </span>
                <Button accent="orange" loading={acting} onClick={accept} className="shadow-md font-bold">
                  Accept Lead &amp; Unlock Full Details →
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-5">
              <div className="flex items-center justify-between gap-2 border-b border-emerald-500/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-base text-emerald-600 font-bold">
                    ✓
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-ink">
                      Full Customer Contact &amp; Doorstep Address Unlocked
                    </h4>
                    <p className="text-xs text-ink-soft/70">
                      You have claimed this job. You can now call, WhatsApp, and navigate directly to the customer.
                    </p>
                  </div>
                </div>
                <Badge tone="success">Unlocked</Badge>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-surface p-4 border border-ink/[0.06] shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-ink-soft/60">Customer Phone</p>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <span className="font-mono text-lg font-bold text-ink">
                      {lead.phone || "Not provided"}
                    </span>
                    {lead.phone && (
                      <div className="flex items-center gap-1.5">
                        <a
                          href={`tel:${lead.phone}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-sm"
                        >
                          📞 Call
                        </a>
                        <a
                          href={`https://wa.me/91${lead.phone.replace(/\D/g, "").slice(-10)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 transition-colors"
                        >
                          💬 WhatsApp
                        </a>
                      </div>
                    )}
                  </div>
                  <p className="mt-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    ✓ Direct line to customer
                  </p>
                </div>

                <div className="rounded-xl bg-surface p-4 border border-ink/[0.06] shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-ink-soft/60">Full Service Address</p>
                  <div className="mt-1 flex items-start justify-between gap-2">
                    <span className="text-sm font-semibold text-ink leading-snug">
                      {lead.address || lead.area || "Customer Address"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowNavigation((v) => !v)}
                      className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-[#c2410c] px-3 py-1.5 text-xs font-bold text-white hover:bg-orange-700 transition-colors shadow-sm"
                    >
                      🗺️ {showNavigation ? "Hide Map" : "Directions"}
                    </button>
                  </div>
                  {lead.area && lead.address && lead.area !== lead.address && (
                    <p className="mt-1.5 text-xs text-ink-soft/70">Area: {lead.area}</p>
                  )}
                </div>
              </div>

              {lead.email && (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-surface p-2.5 text-xs border border-ink/[0.05]">
                  <span className="text-ink-soft/70 font-semibold">Customer Email:</span>
                  <a href={`mailto:${lead.email}`} className="text-orange-600 dark:text-orange-400 font-mono font-medium hover:underline">
                    {lead.email}
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {lead.issue && (
          <div className="mt-5 rounded-xl bg-ink/[0.02] p-3.5 border border-ink/[0.06]">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-soft/60">Reported Problem / Issue</p>
            <p className="mt-1 text-sm text-ink">{lead.issue}</p>
          </div>
        )}

        {error && <p className="mt-4 text-sm font-medium text-danger">{error}</p>}

        {/* Action Buttons Toolbar */}
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

          {lead.status === "ONGOING" && !showDenyForm && (
            <div className="flex flex-wrap items-center gap-3 w-full">
              <Button accent="orange" loading={acting} onClick={openCompleteChoice} className="flex-1 sm:flex-none">
                ✓ Mark job complete
              </Button>
              <Button
                accent="orange"
                variant="secondary"
                onClick={() => setShowDenyForm(true)}
                className="!text-danger !border-danger/30 hover:!bg-danger/10"
              >
                ✕ Deny / Cancel lead
              </Button>
              <Button accent="orange" variant="ghost" onClick={() => setShowNavigation((v) => !v)}>
                🗺️ {showNavigation ? "Hide Map" : "Directions"}
              </Button>
            </div>
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
          <form onSubmit={deny} className="mt-6 flex flex-col gap-3 rounded-2xl bg-base p-5 border border-danger/20 bg-danger/[0.02]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-danger">Submit Job Denial / Cancellation Proof</p>
                <p className="text-xs text-ink-soft/70">
                  Attach on-site photo with GPS geotag and provide the reason for denial.
                </p>
              </div>
              <Button
                type="button"
                accent="orange"
                variant="secondary"
                onClick={() => setShowGeoCamera("deny")}
                className="!py-1.5 !px-3 !text-xs"
              >
                📸 Open Geotagged Cam
              </Button>
            </div>

            <Input
              label="Denial / Cancellation Reason"
              placeholder="e.g. Customer unavailable / refused service / locked premises"
              value={denyReason}
              onChange={(e) => setDenyReason(e.target.value)}
              required
            />

            {proofFile ? (
              <div className="rounded-xl bg-surface p-3 border border-danger/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-danger font-bold">✓</span>
                  <div>
                    <p className="text-xs font-semibold text-ink">{proofFile.name}</p>
                    {geoCoords.latitude && (
                      <p className="text-[11px] font-mono text-ink-soft/70">
                        GPS: {geoCoords.latitude?.toFixed(4)}, {geoCoords.longitude?.toFixed(4)}
                      </p>
                    )}
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

            <div className="flex gap-2 mt-2">
              <Button type="submit" accent="orange" loading={acting} className="!bg-danger !text-white hover:!bg-danger/90">
                Confirm &amp; Submit Denial Proof
              </Button>
              <Button type="button" variant="ghost" accent="orange" onClick={() => setShowDenyForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {lead.status === "PENDING_START_VERIFICATION" && !showDenyForm && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
              ⏳ Start-of-work proof submitted. Waiting on admin to verify your geotag proof.
            </p>
            <Button
              accent="orange"
              variant="secondary"
              onClick={() => setShowDenyForm(true)}
              className="!text-xs !py-1.5 !px-3 !text-danger !border-danger/30 hover:!bg-danger/10"
            >
              ✕ Deny Job Instead
            </Button>
          </div>
        )}

        {lead.status === "PENDING_DENIAL_VERIFICATION" && (
          <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <p className="text-xs font-medium text-red-800 dark:text-red-300">
              ⏳ Denial proof submitted. Waiting on admin verification for refund.
            </p>
          </div>
        )}
      </Card>

      {/* Floating Animated Action Success Modal */}
      <ActionSuccessModal
        isOpen={successModal.isOpen}
        onClose={() => setSuccessModal((prev) => ({ ...prev, isOpen: false }))}
        type={successModal.type}
        title={successModal.title}
        message={successModal.message}
        leadId={successModal.leadId}
        subDetail={successModal.subDetail}
      />

      <KycStatusModal
        isOpen={showKycModal}
        onClose={() => setShowKycModal(false)}
        verificationStatus={user?.verificationStatus}
        profileStatus={user?.profileStatus}
      />

      {/* Payment method choice, shown when marking a job complete */}
      {showCompleteChoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-2xl border border-gray-200 dark:border-gray-800 text-center">
            <h2 className="text-lg font-black text-gray-900 dark:text-white">How was payment collected?</h2>
            <p className="mt-1.5 text-xs text-gray-500">
              Choose how the customer paid for this job before marking it complete.
            </p>

            <div className="mt-5 flex flex-col gap-3">
              <Button
                accent="orange"
                fullWidth
                onClick={() => {
                  setShowCompleteChoice(false);
                  setShowCashModal(true);
                }}
              >
                💵 Received Cash
              </Button>
              <Button
                accent="orange"
                variant="secondary"
                fullWidth
                loading={acting}
                onClick={() => {
                  setShowCompleteChoice(false);
                  completeRazorpay();
                }}
              >
                💳 Pay via Razorpay
              </Button>
              <button
                type="button"
                onClick={() => setShowCompleteChoice(false)}
                className="text-xs font-semibold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mt-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cash amount entry */}
      {showCashModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-2xl border border-gray-200 dark:border-gray-800">
            <h2 className="text-lg font-black text-gray-900 dark:text-white text-center">Cash Received</h2>
            <p className="mt-1.5 text-xs text-gray-500 text-center">
              Enter the amount you collected in cash. This is recorded for admin — it won't be added to your wallet.
            </p>

            <form onSubmit={completeCash} className="mt-5 flex flex-col gap-3">
              <Input
                label="Amount received (₹)"
                type="number"
                min={1}
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
                required
                autoFocus
              />
              {error && <p className="text-xs font-semibold text-danger">{error}</p>}
              <Button type="submit" accent="orange" loading={acting} fullWidth>
                Confirm &amp; Complete Job
              </Button>
              <button
                type="button"
                onClick={() => {
                  setShowCashModal(false);
                  setError("");
                }}
                className="text-xs font-semibold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
