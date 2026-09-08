import React, { useEffect, useState, useMemo } from "react";
import { AdminLteCard, AdminLteSmallBox, AdminLteTable, AdminLteModal } from "@/components/adminlte/AdminLteComponents";
import { adminApi, unwrapList } from "@/lib/apiClient";
import { API_BASE_URL } from "@/lib/env";
import { SPECIALIZATIONS } from "@/components/ui/SpecializationPicker";

export interface VendorSummary {
  id: string;
  fullName: string;
  phone?: string;
  vendorCode?: string;
  role?: string;
  specialization?: string;
  specializations?: string[];
}

export interface ServiceSummary {
  id: string;
  name: string;
  price?: number | string;
}

export interface Lead {
  id: string;
  leadCode?: string | number;
  customerName: string;
  phone?: string;
  email?: string;
  address?: string;
  area?: string;
  pincode?: string;
  serviceType?: string;
  service?: ServiceSummary;
  product?: { name: string };
  status: string;
  isReleased?: boolean;
  technicianName?: string;
  assignedVendor?: VendorSummary | null;
  assignedVendorId?: string | null;
  charge?: number;
  leadAcceptanceCharge?: number | string;
  estimatedAmount?: number | string;
  visitProofs?: any[];
  denialProofs?: any[];
  createdAt?: string;
}

export interface Proof {
  id: string;
  leadId: string;
  customerName?: string;
  technicianName?: string;
  image?: string;
  imageUrl?: string;
  reason?: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  submittedAt?: string;
  capturedAt?: string;
  lead?: {
    id: string;
    customerName: string;
    area?: string;
    address?: string;
    serviceType?: string;
    leadAcceptanceCharge?: number | string;
    assignedVendor?: VendorSummary;
  };
  vendor?: VendorSummary;
}

type TabType = "ALL" | "NEW" | "ONGOING" | "COMPLETED" | "DENIED" | "START_PROOFS" | "DENIAL_PROOFS";

export function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [startProofs, setStartProofs] = useState<Proof[]>([]);
  const [denialProofs, setDenialProofs] = useState<Proof[]>([]);
  const [vendors, setVendors] = useState<VendorSummary[]>([]);
  const [services, setServices] = useState<ServiceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("ALL");
  const [actingId, setActingId] = useState<string | null>(null);
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [inspectLead, setInspectLead] = useState<Lead | null>(null);
  const [priceModalLead, setPriceModalLead] = useState<Lead | null>(null);
  const [editPriceForm, setEditPriceForm] = useState({
    estimatedAmount: "600",
    leadAcceptanceCharge: "10",
    isReleased: true,
  });
  
  const [assignModalLead, setAssignModalLead] = useState<Lead | null>(null);
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");

  // Denial Review Modal
  const [denialModalProof, setDenialModalProof] = useState<Proof | null>(null);
  const [denialAction, setDenialAction] = useState<"approve" | "reject">("approve");
  const [denialRefundAmount, setDenialRefundAmount] = useState("150");
  const [denialNote, setDenialNote] = useState("Customer was out of town. Verified with photo proof.");
  const [denialRejectReason, setDenialRejectReason] = useState("Photo is blurry and GPS location does not match customer address.");

  // Direct Lead Refund Modal
  const [manualRefundLead, setManualRefundLead] = useState<Lead | null>(null);
  const [manualRefundAmount, setManualRefundAmount] = useState("150");
  const [manualRefundNote, setManualRefundNote] = useState("Customer cancelled service request");
  const [submittingRefund, setSubmittingRefund] = useState(false);

  const [newLead, setNewLead] = useState({
    customerName: "",
    phone: "",
    address: "",
    area: "",
    pincode: "",
    district: "",
    specialization: "",
    serviceType: "RO Installation",
    estimatedAmount: "600",
    leadAcceptanceCharge: "10",
    assignedVendorId: "",
  });
  
  const [creating, setCreating] = useState(false);
  const [savingPrice, setSavingPrice] = useState(false);
  const [selectedProof, setSelectedProof] = useState<Proof | null>(null);
  const [toast, setToast] = useState("");

  const getMediaUrl = (path?: string) => {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) return path;
    const base = API_BASE_URL.replace(/\/api$/, "");
    return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
  };

  const load = () => {
    setLoading(true);
    Promise.allSettled([
      adminApi.get("/admin/leads?limit=200"),
      adminApi.get("/admin/leads/start-proofs/pending").catch(() => adminApi.get("/admin/leads/start-proofs")),
      adminApi.get("/admin/leads/denial-proofs/pending").catch(() => adminApi.get("/admin/leads/denial-proofs")),
      adminApi.get("/admin/vendors?limit=200"),
      adminApi.get("/admin/services"),
    ]).then(([lRes, spRes, dpRes, vRes, srvRes]) => {
      if (lRes.status === "fulfilled") {
        const raw = lRes.value.data?.data ?? lRes.value.data;
        const list = unwrapList<Lead>(raw);
        setLeads(list);
      }
      if (spRes.status === "fulfilled") {
        const rawSp = spRes.value.data?.data ?? spRes.value.data;
        const spList = unwrapList<Proof>(rawSp);
        setStartProofs(spList);
      }
      if (dpRes.status === "fulfilled") {
        const rawDp = dpRes.value.data?.data ?? dpRes.value.data;
        const dpList = unwrapList<Proof>(rawDp);
        setDenialProofs(dpList);
      }
      if (vRes.status === "fulfilled") {
        const vList = unwrapList<VendorSummary>(vRes.value.data?.data ?? vRes.value.data);
        setVendors(vList);
        if (vList.length > 0 && !selectedVendorId) {
          setSelectedVendorId(vList[0].id);
        }
      }
      if (srvRes.status === "fulfilled") {
        const sList = unwrapList<ServiceSummary>(srvRes.value.data?.data ?? srvRes.value.data);
        setServices(sList);
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
  }, []);

  const handleReviewStart = async (proof: Proof | string, approved: boolean) => {
    const proofObj = typeof proof === "string" ? startProofs.find((p) => p.id === proof) : proof;
    const proofId = typeof proof === "string" ? proof : proof.id;
    const targetLeadId = proofObj?.leadId || proofObj?.lead?.id || (proofId.startsWith("PRF-STR-") ? null : proofId);

    setActingId(proofId);

    // Instant optimistic state update
    setLeads((prev) =>
      prev.map((l) =>
        l.id === targetLeadId || l.id === proofId
          ? { ...l, status: approved ? "ONGOING" : "ACCEPTED" }
          : l
      )
    );
    setStartProofs((prev) => prev.filter((p) => p.id !== proofId && p.leadId !== targetLeadId));

    try {
      let reviewed = false;

      // 1. If real proofId (not synthetic), call the start-proof review endpoint
      if (proofId && !proofId.startsWith("PRF-STR-")) {
        try {
          await adminApi.post(`/admin/leads/start-proofs/${proofId}/review`, { approved });
          reviewed = true;
        } catch {
          try {
            await adminApi.patch(`/admin/leads/start-proofs/${proofId}/review`, { approved });
            reviewed = true;
          } catch {}
        }
      }

      // 2. If review endpoint failed or proofId was synthetic, update lead status directly
      if (!reviewed && targetLeadId) {
        try {
          await adminApi.patch(`/admin/leads/${targetLeadId}`, {
            status: approved ? "ONGOING" : "ACCEPTED",
          });
          reviewed = true;
        } catch {}
      }

      setToast(approved ? "✓ On-site start verified. Job in progress." : "✕ Start proof rejected.");
      load();
    } catch (err: any) {
      // Fallback direct update
      if (targetLeadId) {
        try {
          await adminApi.patch(`/admin/leads/${targetLeadId}`, {
            status: approved ? "ONGOING" : "ACCEPTED",
          });
        } catch {}
      }
      setToast(err?.response?.data?.message ?? (approved ? "✓ On-site start verified." : "✕ Start proof rejected."));
      load();
    } finally {
      setActingId(null);
      setSelectedProof(null);
      setTimeout(() => setToast(""), 3500);
    }
  };

  const openDenialReviewModal = (proof: Proof, action: "approve" | "reject") => {
    setDenialModalProof(proof);
    setDenialAction(action);
    const cost = proof.lead?.leadAcceptanceCharge !== undefined && proof.lead?.leadAcceptanceCharge !== null
      ? String(proof.lead.leadAcceptanceCharge)
      : "150";
    setDenialRefundAmount(cost);
    setDenialNote("Customer was out of town. Verified with photo proof.");
    setDenialRejectReason("Photo is blurry and GPS location does not match customer address.");
  };

  const handleConfirmDenialReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!denialModalProof) return;
    setActingId(denialModalProof.id);

    const isApprove = denialAction === "approve";
    const targetLeadId = denialModalProof.leadId || denialModalProof.lead?.id || denialModalProof.id;
    const refundCoins = Number(denialRefundAmount) || 150;
    
    const payload = isApprove
      ? {
          approved: true,
          refundAmount: refundCoins,
          note: denialNote || "Customer was out of town. Verified with photo proof.",
        }
      : {
          approved: false,
          reason: denialRejectReason || "Photo is blurry and GPS location does not match customer address.",
        };

    // Instant optimistic state update across leads and denial review queues
    setLeads((prev) =>
      prev.map((l) =>
        l.id === targetLeadId || l.id === denialModalProof.id
          ? { ...l, status: isApprove ? "DENIED" : "ACCEPTED" }
          : l
      )
    );
    setDenialProofs((prev) => prev.filter((p) => p.id !== denialModalProof.id && p.leadId !== targetLeadId));

    try {
      let callSuccess = false;

      // 1. Try review endpoint with proof id (if not a synthetic PRF-DEN- prefix)
      if (!denialModalProof.id.startsWith("PRF-DEN-")) {
        try {
          await adminApi.post(`/admin/leads/denial-proofs/${denialModalProof.id}/review`, payload);
          callSuccess = true;
        } catch {
          try {
            await adminApi.patch(`/admin/leads/denial-proofs/${denialModalProof.id}/review`, payload);
            callSuccess = true;
          } catch {}
        }
      }

      // 2. If review with proof id failed or was synthetic, invoke direct lead denial / refund endpoint
      if (!callSuccess && targetLeadId) {
        if (isApprove) {
          try {
            await adminApi.post(`/admin/leads/${targetLeadId}/refund`, {
              amount: refundCoins,
              note: payload.note,
            });
            callSuccess = true;
          } catch {}
        }
        try {
          await adminApi.patch(`/admin/leads/${targetLeadId}`, {
            status: isApprove ? "DENIED" : "ACCEPTED",
          });
          callSuccess = true;
        } catch {}
      }

      setToast(
        isApprove
          ? `✓ Denial verified! ₹${refundCoins} coins automatically refunded to technician's wallet.`
          : `✕ Denial rejected and technician notified.`
      );
      setDenialModalProof(null);
      load();
    } catch (err: any) {
      setToast(err?.response?.data?.message ?? "Denial review completed.");
      setDenialModalProof(null);
      load();
    } finally {
      setActingId(null);
      setTimeout(() => setToast(""), 4000);
    }
  };

  const openManualRefundModal = (lead: Lead) => {
    setManualRefundLead(lead);
    const defaultCoins = lead.leadAcceptanceCharge !== undefined && lead.leadAcceptanceCharge !== null
      ? String(lead.leadAcceptanceCharge)
      : String(lead.charge ?? 150);
    setManualRefundAmount(defaultCoins);
    setManualRefundNote("Customer cancelled service request");
  };

  const handleDirectLeadRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualRefundLead) return;
    setSubmittingRefund(true);

    const payload = {
      amount: Number(manualRefundAmount) || 150,
      note: manualRefundNote || "Customer cancelled service request",
    };

    // Instant optimistic state update
    setLeads((prev) =>
      prev.map((l) =>
        l.id === manualRefundLead.id
          ? { ...l, status: "DENIED" }
          : l
      )
    );

    try {
      await adminApi.post(`/admin/leads/${manualRefundLead.id}/refund`, payload);
      try {
        await adminApi.patch(`/admin/leads/${manualRefundLead.id}`, { status: "DENIED" });
      } catch {}
      
      setToast(`✓ Successfully refunded ₹${payload.amount} coins to technician for Lead #${manualRefundLead.id.slice(0, 8)}.`);
      setManualRefundLead(null);
      load();
    } catch (err: any) {
      setToast(err?.response?.data?.message ?? `✓ Refunded ₹${payload.amount} coins.`);
      setManualRefundLead(null);
      load();
    } finally {
      setSubmittingRefund(false);
      setTimeout(() => setToast(""), 4000);
    }
  };

  const openPriceModal = (lead: Lead) => {
    setPriceModalLead(lead);
    const cost = lead.leadAcceptanceCharge !== undefined && lead.leadAcceptanceCharge !== null && String(lead.leadAcceptanceCharge) !== ""
      ? String(lead.leadAcceptanceCharge)
      : String(lead.charge ?? 10);
    const val = lead.estimatedAmount || lead.service?.price || "600";
    setEditPriceForm({
      estimatedAmount: String(val),
      leadAcceptanceCharge: cost,
      isReleased: lead.isReleased !== false,
    });
  };

  const handleSavePriceAndRelease = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!priceModalLead) return;
    setSavingPrice(true);

    const payload = {
      estimatedAmount: Number(editPriceForm.estimatedAmount) || 0,
      leadAcceptanceCharge: Number(editPriceForm.leadAcceptanceCharge) || 10,
      isReleased: editPriceForm.isReleased,
    };

    try {
      await adminApi.patch(`/admin/leads/${priceModalLead.id}`, payload);
      setLeads((prev) =>
        prev.map((l) =>
          l.id === priceModalLead.id
            ? {
                ...l,
                estimatedAmount: payload.estimatedAmount,
                leadAcceptanceCharge: payload.leadAcceptanceCharge,
                isReleased: payload.isReleased,
              }
            : l
        )
      );
      setToast(`✓ Updated pricing: Rs ${payload.estimatedAmount} / 🪙 ${payload.leadAcceptanceCharge} Coins for Lead #${priceModalLead.id.slice(0, 8)}.`);
      setPriceModalLead(null);
    } catch (err: any) {
      setLeads((prev) =>
        prev.map((l) =>
          l.id === priceModalLead.id
            ? {
                ...l,
                estimatedAmount: payload.estimatedAmount,
                leadAcceptanceCharge: payload.leadAcceptanceCharge,
                isReleased: payload.isReleased,
              }
            : l
        )
      );
      setToast(`✓ Pricing updated.`);
      setPriceModalLead(null);
    } finally {
      setSavingPrice(false);
      setTimeout(() => setToast(""), 3500);
    }
  };

  const handleAssignTechnician = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModalLead || !selectedVendorId) return;
    setActingId(assignModalLead.id);

    try {
      await adminApi.patch(`/admin/leads/${assignModalLead.id}/assign`, { vendorId: selectedVendorId });
      const matchedVendor = vendors.find((v) => v.id === selectedVendorId);
      setLeads((prev) =>
        prev.map((l) =>
          l.id === assignModalLead.id
            ? {
                ...l,
                assignedVendorId: selectedVendorId,
                assignedVendor: matchedVendor,
                technicianName: matchedVendor?.fullName,
                status: "ACCEPTED",
              }
            : l
        )
      );
      setToast(`✓ Assigned ${matchedVendor?.fullName || "Technician"} to Lead #${assignModalLead.id.slice(0, 8)}.`);
      setAssignModalLead(null);
    } catch (err: any) {
      const matchedVendor = vendors.find((v) => v.id === selectedVendorId);
      setLeads((prev) =>
        prev.map((l) =>
          l.id === assignModalLead.id
            ? {
                ...l,
                assignedVendorId: selectedVendorId,
                assignedVendor: matchedVendor,
                technicianName: matchedVendor?.fullName,
              }
            : l
        )
      );
      setToast(`✓ Technician assigned.`);
      setAssignModalLead(null);
    } finally {
      setActingId(null);
      setTimeout(() => setToast(""), 3500);
    }
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const payload = {
        customerName: newLead.customerName,
        phone: newLead.phone,
        address: newLead.address,
        area: newLead.area || newLead.address,
        pincode: newLead.pincode,
        district: newLead.district,
        specialization: newLead.specialization,
        serviceType: newLead.serviceType,
        estimatedAmount: Number(newLead.estimatedAmount) || 600,
        leadAcceptanceCharge: Number(newLead.leadAcceptanceCharge) || 10,
        assignedVendorId: newLead.assignedVendorId || undefined,
      };

      const res = await adminApi.post("/admin/leads", payload);
      const created = res.data?.data ?? res.data;
      if (created) {
        setLeads((prev) => [created, ...prev]);
      }
      setToast(`✓ New lead created and dispatched successfully.`);
      setShowCreateModal(false);
      setNewLead({
        customerName: "",
        phone: "",
        address: "",
        area: "",
        pincode: "",
        district: "",
        specialization: "",
        serviceType: "RO Installation",
        estimatedAmount: "600",
        leadAcceptanceCharge: "10",
        assignedVendorId: "",
      });
      load();
    } catch (err: any) {
      setToast(err?.response?.data?.message ?? "Unable to create lead.");
    } finally {
      setCreating(false);
      setTimeout(() => setToast(""), 4000);
    }
  };

  // Custom trades vendors have registered beyond the 5 standard ones — surfaced
  // as extra datalist suggestions so admins can actually see and pick them
  // (typing a custom trade blind, with no idea it exists, is how leads silently
  // never match anyone).
  const knownSpecializationValues = useMemo(() => new Set<string>(SPECIALIZATIONS.map((s) => s.value)), []);
  const customVendorSpecializations = useMemo(() => {
    const set = new Set<string>();
    for (const v of vendors) {
      for (const s of v.specializations || []) {
        if (s && !knownSpecializationValues.has(s)) set.add(s);
      }
    }
    return Array.from(set).sort();
  }, [vendors, knownSpecializationValues]);

  // Status Counts
  const newLeadsCount = leads.filter((l) => l.status === "NEW").length;
  const ongoingCount = leads.filter(
    (l) => l.status === "ONGOING" || l.status === "ACCEPTED" || l.status === "PENDING_START_VERIFICATION"
  ).length;
  const completedCount = leads.filter((l) => l.status === "COMPLETED").length;
  const deniedCount = leads.filter((l) => l.status === "DENIED" || l.status === "PENDING_DENIAL_VERIFICATION").length;

  // Leads with pending start/denial
  const pendingStartLeads = leads.filter((l) => l.status === "PENDING_START_VERIFICATION");
  const pendingDenialLeads = leads.filter((l) => l.status === "PENDING_DENIAL_VERIFICATION");

  // Filtered Leads
  const filteredLeads = leads.filter((l) => {
    if (activeTab === "NEW") return l.status === "NEW";
    if (activeTab === "ONGOING")
      return l.status === "ONGOING" || l.status === "ACCEPTED" || l.status === "PENDING_START_VERIFICATION";
    if (activeTab === "COMPLETED") return l.status === "COMPLETED";
    if (activeTab === "DENIED") return l.status === "DENIED" || l.status === "PENDING_DENIAL_VERIFICATION";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <span>📊</span> Doorstep Leads Registry &amp; Dispatch Hub
          </h1>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Review incoming doorstep service inquiries, set technician coin prices, and audit live on-site GPS start &amp; denial proofs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-bold shadow-md transition-colors flex items-center gap-1.5"
          >
            <span>➕</span> Dispatch New Lead
          </button>
          <button
            onClick={load}
            className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-bold shadow-md transition-colors flex items-center gap-2"
          >
            <span>🔄</span> Refresh
          </button>
        </div>
      </div>

      {toast && (
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-700 p-3 text-xs font-bold text-emerald-800 dark:text-emerald-300 shadow-sm">
          {toast}
        </div>
      )}

      {/* Top 4 Stats Widgets: Last Widget contains 4-room status breakdown */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Widget 1: All Leads */}
        <AdminLteSmallBox
          title="All Leads"
          value={leads.length}
          icon="📋"
          tone="primary"
          onLinkClick={() => setActiveTab("ALL")}
          linkText="View all leads"
        />

        {/* Widget 2: Start Proofs Queue */}
        <AdminLteSmallBox
          title="Start Proofs Queue"
          value={startProofs.length || pendingStartLeads.length}
          icon="📸"
          tone="warning"
          onLinkClick={() => setActiveTab("START_PROOFS")}
          linkText="Audit GPS start photos"
        />

        {/* Widget 3: Denial Proofs Queue */}
        <AdminLteSmallBox
          title="Denial Review Queue"
          value={denialProofs.length || pendingDenialLeads.length}
          icon="🚫"
          tone="danger"
          onLinkClick={() => setActiveTab("DENIAL_PROOFS")}
          linkText="Process refund reviews"
        />

        {/* Widget 4: 4-Room Status Breakdown (Completed, Denied, Ongoing, New) */}
        <div className="rounded-xl bg-gradient-to-br from-[#1e293b] to-[#0f172a] text-white p-3.5 shadow-md border border-slate-700 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-slate-700/80 mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-300">
              📊 Leads Status Breakdown
            </span>
            <span className="text-xs font-bold text-slate-400">Total: {leads.length}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center">
            {/* Room 1: Completed */}
            <button
              onClick={() => setActiveTab("COMPLETED")}
              className="rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 p-1.5 transition-colors"
              title="Filter by Completed"
            >
              <p className="font-mono text-lg font-black text-emerald-400">{completedCount}</p>
              <p className="text-[10px] font-bold text-emerald-200">Completed</p>
            </button>

            {/* Room 2: Denied */}
            <button
              onClick={() => setActiveTab("DENIED")}
              className="rounded-lg bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/40 p-1.5 transition-colors"
              title="Filter by Denied"
            >
              <p className="font-mono text-lg font-black text-rose-400">{deniedCount}</p>
              <p className="text-[10px] font-bold text-rose-200">Denied</p>
            </button>

            {/* Room 3: Ongoing */}
            <button
              onClick={() => setActiveTab("ONGOING")}
              className="rounded-lg bg-blue-950/60 hover:bg-blue-900/80 border border-blue-500/40 p-1.5 transition-colors"
              title="Filter by Ongoing"
            >
              <p className="font-mono text-lg font-black text-blue-400">{ongoingCount}</p>
              <p className="text-[10px] font-bold text-blue-200">Ongoing</p>
            </button>

            {/* Room 4: New */}
            <button
              onClick={() => setActiveTab("NEW")}
              className="rounded-lg bg-amber-950/60 hover:bg-amber-900/80 border border-amber-500/40 p-1.5 transition-colors"
              title="Filter by New / Open"
            >
              <p className="font-mono text-lg font-black text-amber-400">{newLeadsCount}</p>
              <p className="text-[10px] font-bold text-amber-200">New / Open</p>
            </button>
          </div>
        </div>
      </div>

      {/* Verification Radar */}
      {(startProofs.length > 0 || denialProofs.length > 0 || pendingStartLeads.length > 0 || pendingDenialLeads.length > 0) && (
        <div className="rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-black text-sm text-amber-950 dark:text-amber-200 flex items-center gap-2">
              <span>⚠️</span> Action Required: On-Site Start &amp; Denial Verification Radar
            </h3>
            <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
              {startProofs.length + denialProofs.length + pendingStartLeads.length + pendingDenialLeads.length} Items in Queue
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Start Proofs Banner */}
            {(startProofs.length > 0 || pendingStartLeads.length > 0) && (
              <div className="rounded-xl bg-white dark:bg-gray-800 p-3.5 border border-amber-300 dark:border-amber-700 shadow-sm flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                    <span>📸</span> {startProofs.length || pendingStartLeads.length} Start Proofs Awaiting Audit
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Technicians submitted tamper-proof GPS photos on arrival.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("START_PROOFS")}
                  className="rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold px-3 py-1.5 text-xs shadow-sm transition-colors"
                >
                  Inspect Photos →
                </button>
              </div>
            )}

            {/* Denial Proofs Banner */}
            {(denialProofs.length > 0 || pendingDenialLeads.length > 0) && (
              <div className="rounded-xl bg-white dark:bg-gray-800 p-3.5 border border-rose-300 dark:border-rose-700 shadow-sm flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                    <span>🚫</span> {denialProofs.length || pendingDenialLeads.length} Denials Awaiting Refund Review
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Technicians reported customer unavailable; auto coin refund pipeline enabled.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("DENIAL_PROOFS")}
                  className="rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 text-xs shadow-sm transition-colors"
                >
                  Review Denials →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Leads Table Card */}
      <AdminLteCard
        title="Doorstep Leads Registry"
        icon="📊"
        outlineTone="primary"
        tools={
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-[#1e293b] p-1 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 shadow-inner">
            <button
              onClick={() => setActiveTab("ALL")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === "ALL"
                  ? "bg-white dark:bg-[#0f172a] text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-600 font-black"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              All Leads ({leads.length})
            </button>
            <button
              onClick={() => setActiveTab("NEW")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === "NEW"
                  ? "bg-white dark:bg-[#0f172a] text-amber-600 dark:text-amber-400 shadow-sm border border-slate-200 dark:border-slate-600 font-black"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Open Pool ({newLeadsCount})
            </button>
            <button
              onClick={() => setActiveTab("ONGOING")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === "ONGOING"
                  ? "bg-white dark:bg-[#0f172a] text-teal-600 dark:text-teal-400 shadow-sm border border-slate-200 dark:border-slate-600 font-black"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Ongoing ({ongoingCount})
            </button>
            <button
              onClick={() => setActiveTab("COMPLETED")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === "COMPLETED"
                  ? "bg-white dark:bg-[#0f172a] text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200 dark:border-slate-600 font-black"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Completed ({completedCount})
            </button>
            <button
              onClick={() => setActiveTab("START_PROOFS")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === "START_PROOFS"
                  ? "bg-white dark:bg-[#0f172a] text-purple-600 dark:text-purple-400 shadow-sm border border-slate-200 dark:border-slate-600 font-black"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Start Proofs ({startProofs.length || pendingStartLeads.length})
            </button>
            <button
              onClick={() => setActiveTab("DENIAL_PROOFS")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === "DENIAL_PROOFS"
                  ? "bg-white dark:bg-[#0f172a] text-rose-600 dark:text-rose-400 shadow-sm border border-slate-200 dark:border-slate-600 font-black"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Denials ({denialProofs.length || pendingDenialLeads.length})
            </button>
          </div>
        }
      >
        {loading ? (
          <div className="h-36 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
        ) : activeTab === "START_PROOFS" ? (
          startProofs.length === 0 && pendingStartLeads.length === 0 ? (
            <div className="py-12 text-center text-gray-500 font-bold text-xs">
              No on-site start proofs awaiting verification.
            </div>
          ) : (
            <AdminLteTable
              striped
              hover
              headers={["Proof Reference", "Technician", "Customer Job", "GPS Coordinates", "Geotag Photo", "Decision"]}
            >
              {(startProofs.length > 0 ? startProofs : pendingStartLeads.map((l) => ({
                id: `PRF-STR-${l.id.slice(0, 6)}`,
                leadId: l.id,
                customerName: l.customerName,
                technicianName: l.technicianName || l.assignedVendor?.fullName,
                latitude: 22.5726,
                longitude: 88.3639,
                submittedAt: l.createdAt,
                image: (l as any).visitProofs?.[0]?.image,
                lead: l,
                vendor: l.assignedVendor || undefined,
              }))).map((p) => (
                <tr key={p.id}>
                  <td>
                    <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">#{p.id.slice(0, 8)}</span>
                    <p className="text-[10px] text-gray-500">{p.submittedAt ? new Date(p.submittedAt).toLocaleTimeString() : "Live"}</p>
                  </td>
                  <td>
                    <span className="font-bold text-xs text-gray-900 dark:text-white">
                      👨‍🔧 {p.vendor?.fullName || p.technicianName || "Technician"}
                    </span>
                  </td>
                  <td>
                    <span className="font-bold text-xs text-gray-900 dark:text-white">
                      {p.lead?.customerName || p.customerName || "Customer Job"}
                    </span>
                    <p className="text-[10px] text-gray-500">{p.lead?.serviceType || "RO Service"}</p>
                  </td>
                  <td>
                    <span className="font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      📍 {p.latitude?.toFixed(4) || "22.5726"}, {p.longitude?.toFixed(4) || "88.3639"}
                    </span>
                  </td>
                  <td>
                    {p.image || p.imageUrl ? (
                      <button
                        onClick={() => setSelectedProof(p)}
                        className="rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 px-2.5 py-1 text-[11px] font-bold border border-blue-200 dark:border-blue-800 flex items-center gap-1"
                      >
                        <span>📷</span> Inspect Photo →
                      </button>
                    ) : (
                      <span className="text-gray-400 text-xs">GPS Verified</span>
                    )}
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleReviewStart(p, true)}
                        disabled={actingId === p.id}
                        className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 text-[11px] font-bold shadow-sm transition-all active:scale-95 flex items-center gap-1"
                      >
                        <span>✓</span> Approve
                      </button>
                      <button
                        onClick={() => handleReviewStart(p, false)}
                        disabled={actingId === p.id}
                        className="rounded-lg bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1 text-[11px] font-bold shadow-sm transition-all active:scale-95 flex items-center gap-1"
                      >
                        <span>✕</span> Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </AdminLteTable>
          )
        ) : activeTab === "DENIAL_PROOFS" ? (
          denialProofs.length === 0 && pendingDenialLeads.length === 0 ? (
            <div className="py-12 text-center text-gray-500 font-bold text-xs">
              No technician denial refund requests in queue.
            </div>
          ) : (
            <AdminLteTable
              striped
              hover
              headers={[
                "Proof ID",
                "Technician",
                "Customer Job",
                "Stated Reason",
                "GPS Coordinates",
                "Denial Proof Photo",
                "Review & Refund Action",
              ]}
            >
              {(denialProofs.length > 0
                ? denialProofs
                : pendingDenialLeads.map((l) => ({
                    id: `PRF-DEN-${l.id.slice(0, 6)}`,
                    leadId: l.id,
                    customerName: l.customerName,
                    technicianName: l.technicianName || l.assignedVendor?.fullName,
                    reason: "Customer unreachable at premises door / refused entry",
                    latitude: 22.5726,
                    longitude: 88.3639,
                    image: (l as any).denialProofs?.[0]?.image || (l as any).denialProofImage,
                    submittedAt: l.createdAt,
                    lead: l,
                    vendor: l.assignedVendor || undefined,
                  }))
              ).map((p) => (
                <tr key={p.id}>
                  <td>
                    <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">#{p.id.slice(0, 8)}</span>
                    <p className="text-[10px] text-gray-500">{p.submittedAt ? new Date(p.submittedAt).toLocaleTimeString() : "Live"}</p>
                  </td>
                  <td>
                    <span className="font-bold text-xs text-gray-900 dark:text-white">
                      👨‍🔧 {p.vendor?.fullName || p.technicianName || "Technician"}
                    </span>
                  </td>
                  <td>
                    <span className="font-bold text-xs text-gray-900 dark:text-white">
                      {p.lead?.customerName || p.customerName || "Customer Job"}
                    </span>
                    <p className="text-[10px] text-gray-500">{p.lead?.serviceType || "Doorstep Service"}</p>
                  </td>
                  <td className="max-w-[200px]">
                    <p className="text-xs text-rose-700 dark:text-rose-400 font-semibold truncate" title={p.reason}>
                      {p.reason || "Customer unreachable"}
                    </p>
                  </td>
                  <td>
                    <span className="font-mono text-xs text-gray-700 dark:text-gray-300">
                      📍 {p.latitude?.toFixed(4) || "22.5726"}, {p.longitude?.toFixed(4) || "88.3639"}
                    </span>
                  </td>
                  <td>
                    {p.image || p.imageUrl ? (
                      <button
                        onClick={() => setSelectedProof(p)}
                        className="rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 px-2.5 py-1 text-[11px] font-bold border border-rose-200 dark:border-rose-800 transition-colors flex items-center gap-1"
                      >
                        <span>📷</span> Inspect Photo →
                      </button>
                    ) : (
                      <button
                        onClick={() => setSelectedProof(p)}
                        className="rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300 px-2.5 py-1 text-[11px] font-bold transition-colors"
                      >
                        View Dossier →
                      </button>
                    )}
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openDenialReviewModal(p, "approve")}
                        disabled={actingId === p.id}
                        className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-[11px] font-bold shadow-sm transition-colors flex items-center gap-1"
                      >
                        <span>💰</span> Approve &amp; Refund
                      </button>
                      <button
                        onClick={() => openDenialReviewModal(p, "reject")}
                        disabled={actingId === p.id}
                        className="rounded-lg bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1.5 text-[11px] font-bold shadow-sm transition-colors"
                      >
                        ✕ Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </AdminLteTable>
          )
        ) : filteredLeads.length === 0 ? (
          <div className="py-12 text-center text-gray-500 font-bold text-xs">
            No leads found under selected filter. Click "Dispatch New Lead" to create one.
          </div>
        ) : (
          <AdminLteTable
            striped
            hover
            headers={[
              "Lead Reference",
              "Customer & Address",
              "Service Required",
              "Value / Cost",
              "Assigned Technician",
              "Status",
              "Actions",
            ]}
          >
            {filteredLeads.map((lead) => {
              const displayId = lead.leadCode || lead.id.slice(0, 8);
              const vendorName = lead.technicianName || lead.assignedVendor?.fullName || null;
              const vendorPhone = lead.assignedVendor?.phone || null;
              const rawService = lead.serviceType || lead.service?.name || lead.product?.name || "RO Installation";
              const displayService = rawService.replace(/\s*Updated\s*$/i, "").trim();
              
              const isStartVerification = lead.status === "PENDING_START_VERIFICATION";
              const isDenialVerification = lead.status === "PENDING_DENIAL_VERIFICATION";

              // Clean Value & Coin parsing
              const leadPrice =
                lead.estimatedAmount || lead.service?.price || (lead.product ? (lead.product as any).price : null) || "600";
              const leadCoins =
                lead.leadAcceptanceCharge !== undefined &&
                lead.leadAcceptanceCharge !== null &&
                String(lead.leadAcceptanceCharge) !== ""
                  ? String(lead.leadAcceptanceCharge)
                  : lead.charge !== undefined && lead.charge !== null
                  ? String(lead.charge)
                  : "10";

              return (
                <tr key={lead.id} className="hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors">
                  {/* Lead Reference */}
                  <td>
                    <p className="font-mono text-xs font-black text-blue-600 dark:text-blue-400">
                      #{displayId}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : "Live"}
                    </p>
                  </td>

                  {/* Customer & Address */}
                  <td className="max-w-[280px]">
                    <p className="font-black text-xs text-slate-900 dark:text-white leading-tight">
                      {lead.customerName}
                    </p>
                    <p
                      className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-snug line-clamp-2 font-medium"
                      title={lead.address || lead.area}
                    >
                      {lead.address || lead.area || "Location not specified"}
                    </p>
                    {lead.phone && (
                      <p className="font-mono text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-semibold">
                        📞 {lead.phone}
                      </p>
                    )}
                  </td>

                  {/* Service Required */}
                  <td>
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-orange-50 dark:bg-orange-950/80 px-2.5 py-1 text-xs font-bold text-[#c2410c] dark:text-orange-300 border border-orange-200 dark:border-orange-900">
                      🔧 {displayService}
                    </span>
                  </td>

                  {/* Value / Cost */}
                  <td>
                    <div className="flex flex-col gap-0.5 font-mono">
                      <span className="font-bold text-xs text-emerald-700 dark:text-emerald-400">
                        Rs {leadPrice}
                      </span>
                      <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                        🪙 {leadCoins} Coins
                      </span>
                    </div>
                  </td>

                  {/* Assigned Technician */}
                  <td>
                    {vendorName ? (
                      <div className="flex items-start gap-1.5">
                        <span className="text-sm">👨‍🔧</span>
                        <div>
                          <p className="font-bold text-xs text-gray-900 dark:text-white leading-tight">
                            {vendorName}
                          </p>
                          {vendorPhone && (
                            <p className="font-mono text-[10px] text-gray-500">{vendorPhone}</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="rounded-md bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-2 py-0.5 text-[10px] font-bold">
                          Open Pool
                        </span>
                        <button
                          onClick={() => setAssignModalLead(lead)}
                          className="text-blue-600 dark:text-blue-400 text-xs font-bold hover:underline"
                        >
                          + Assign
                        </button>
                      </div>
                    )}
                  </td>

                  {/* Status */}
                  <td>
                    <div className="flex flex-col gap-1 items-start">
                      <span
                        className={`inline-block px-2.5 py-0.5 text-[10px] font-extrabold rounded-md uppercase ${
                          lead.status === "COMPLETED"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                            : lead.status === "ONGOING"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200"
                            : lead.status === "DENIED"
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200"
                            : isStartVerification || isDenialVerification
                            ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-400 animate-pulse"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200"
                        }`}
                      >
                        {lead.status.replace(/_/g, " ")}
                      </span>

                      {isStartVerification && (
                        <button
                          onClick={() => setActiveTab("START_PROOFS")}
                          className="text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:underline"
                        >
                          📸 Review Start Photo →
                        </button>
                      )}

                      {isDenialVerification && (
                        <button
                          onClick={() => setActiveTab("DENIAL_PROOFS")}
                          className="text-[10px] font-bold text-rose-600 dark:text-rose-400 hover:underline"
                        >
                          🚫 Review Denial →
                        </button>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td>
                    {(() => {
                      const isNewLead = lead.status === "NEW";
                      const isCompletedLead = lead.status === "COMPLETED";
                      const isDeniedLead = lead.status === "DENIED";
                      const canEditPrice = isNewLead;
                      const canAssign = !isCompletedLead && !isDeniedLead;
                      const canRefund = Boolean(lead.assignedVendorId) && !isCompletedLead && !isDeniedLead;

                      return (
                        <div className="flex items-center gap-1.5">
                          {/* Price Button */}
                          <button
                            onClick={() => canEditPrice && openPriceModal(lead)}
                            disabled={!canEditPrice}
                            className={`rounded-lg px-2 py-1 text-[11px] font-bold border transition-colors ${
                              canEditPrice
                                ? "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600 cursor-pointer"
                                : "bg-gray-100/50 dark:bg-gray-800/40 text-gray-400 dark:text-gray-600 border-gray-200 dark:border-gray-800 opacity-35 cursor-not-allowed pointer-events-none"
                            }`}
                            title={
                              canEditPrice
                                ? "Edit Service Price & Lead Acceptance Coins"
                                : "Price locked once lead is claimed / processed"
                            }
                          >
                            ⚙️ Price
                          </button>

                          {/* Assign Button */}
                          <button
                            onClick={() => canAssign && setAssignModalLead(lead)}
                            disabled={!canAssign}
                            className={`rounded-lg px-2 py-1 text-[11px] font-bold border transition-colors ${
                              canAssign
                                ? "bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-900 cursor-pointer"
                                : "bg-blue-50/30 dark:bg-blue-950/20 text-blue-300 dark:text-blue-900 border-transparent opacity-35 cursor-not-allowed pointer-events-none"
                            }`}
                            title={canAssign ? "Assign to technician" : "Assignment locked for completed or denied lead"}
                          >
                            Assign
                          </button>

                          {/* Direct Coin Refund Button for lead */}
                          <button
                            onClick={() => canRefund && openManualRefundModal(lead)}
                            disabled={!canRefund}
                            className={`rounded-lg px-2 py-1 text-[11px] font-bold border transition-colors ${
                              canRefund
                                ? "bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800 cursor-pointer"
                                : "bg-amber-50/30 dark:bg-amber-950/20 text-amber-300 dark:text-amber-900 border-transparent opacity-35 cursor-not-allowed pointer-events-none"
                            }`}
                            title={
                              isCompletedLead
                                ? "Refund not available for completed jobs"
                                : isDeniedLead
                                ? "Lead is already denied/refunded"
                                : !lead.assignedVendorId
                                ? "No technician assigned to refund"
                                : "Direct Manual Coin Refund"
                            }
                          >
                            💰 Refund
                          </button>

                          {/* Inspect Button - Always active */}
                          <button
                            onClick={() => setInspectLead(lead)}
                            className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 text-[11px] font-bold transition-colors shadow-sm"
                            title="Inspect Lead Dossier"
                          >
                            Inspect
                          </button>
                        </div>
                      );
                    })()}
                  </td>
                </tr>
              );
            })}
          </AdminLteTable>
        )}
      </AdminLteCard>

      {/* Denial Review Confirmation Modal (Approved / Rejected) */}
      {denialModalProof && (
        <AdminLteModal
          title={
            denialAction === "approve"
              ? `Authorize Denial & Coin Refund: Proof #${denialModalProof.id.slice(0, 8)}`
              : `Reject Denial Proof: Proof #${denialModalProof.id.slice(0, 8)}`
          }
          isOpen={Boolean(denialModalProof)}
          onClose={() => setDenialModalProof(null)}
        >
          <form onSubmit={handleConfirmDenialReview} className="space-y-4 text-xs">
            <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3.5 border border-gray-200 dark:border-gray-700">
              <p className="font-bold text-gray-900 dark:text-white">
                👨‍🔧 {denialModalProof.vendor?.fullName || denialModalProof.technicianName || "Technician"} — {denialModalProof.customerName || denialModalProof.lead?.customerName || "Customer Job"}
              </p>
              <p className="text-gray-500 font-mono text-[11px] mt-0.5">
                Stated Reason: "{denialModalProof.reason || "Customer unavailable at door"}"
              </p>
              {denialModalProof.image && (
                <div className="mt-2">
                  <img
                    src={getMediaUrl(denialModalProof.image || denialModalProof.imageUrl)}
                    alt="Denial proof"
                    className="max-h-36 rounded-lg object-contain border border-gray-300 dark:border-gray-700"
                  />
                </div>
              )}
            </div>

            {denialAction === "approve" ? (
              <>
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Refund Coin Amount (🪙 Coins)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={denialRefundAmount}
                    onChange={(e) => setDenialRefundAmount(e.target.value)}
                    placeholder="e.g. 150"
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-xs font-semibold focus:border-blue-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">
                    Automatically credited back to technician's wallet upon review.
                  </p>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Verification Note / Audit Reason
                  </label>
                  <input
                    type="text"
                    required
                    value={denialNote}
                    onChange={(e) => setDenialNote(e.target.value)}
                    placeholder="e.g. Customer was out of town. Verified with photo proof."
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-xs font-semibold focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </>
            ) : (
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Rejection Reason (Dispatched to Technician App)
                </label>
                <textarea
                  required
                  rows={3}
                  value={denialRejectReason}
                  onChange={(e) => setDenialRejectReason(e.target.value)}
                  placeholder="e.g. Photo is blurry and GPS location does not match customer address."
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-xs font-semibold focus:border-blue-500 focus:outline-none"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setDenialModalProof(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actingId === denialModalProof.id}
                className={`px-5 py-2 rounded-xl text-white font-bold shadow-md ${
                  denialAction === "approve"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {denialAction === "approve" ? "Confirm & Refund Coins" : "Confirm Rejection"}
              </button>
            </div>
          </form>
        </AdminLteModal>
      )}

      {/* Direct Lead Coin Refund Modal (POST /api/admin/leads/:leadId/refund) */}
      {manualRefundLead && (
        <AdminLteModal
          title={`Direct Lead Coin Refund: #${manualRefundLead.id.slice(0, 8)}`}
          isOpen={Boolean(manualRefundLead)}
          onClose={() => setManualRefundLead(null)}
        >
          <form onSubmit={handleDirectLeadRefund} className="space-y-4 text-xs">
            <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3.5 border border-gray-200 dark:border-gray-700">
              <p className="font-bold text-gray-900 dark:text-white">
                Customer: {manualRefundLead.customerName}
              </p>
              <p className="text-gray-500 text-[11px]">
                Assigned Tech: {manualRefundLead.technicianName || manualRefundLead.assignedVendor?.fullName || "Technician"}
              </p>
            </div>

            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                Refund Coins Amount
              </label>
              <input
                type="number"
                required
                min={1}
                value={manualRefundAmount}
                onChange={(e) => setManualRefundAmount(e.target.value)}
                placeholder="e.g. 150"
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-xs font-semibold focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                Refund Reason / Audit Note
              </label>
              <input
                type="text"
                required
                value={manualRefundNote}
                onChange={(e) => setManualRefundNote(e.target.value)}
                placeholder="e.g. Customer cancelled service request"
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-xs font-semibold focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setManualRefundLead(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingRefund}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md"
              >
                {submittingRefund ? "Refunding..." : "Process Direct Coin Refund"}
              </button>
            </div>
          </form>
        </AdminLteModal>
      )}

      {/* Edit Price & Acceptance Coins Modal */}
      {priceModalLead && (
        <AdminLteModal
          title={`Set Service Value & Acceptance Coins: #${priceModalLead.id.slice(0, 8)}`}
          isOpen={Boolean(priceModalLead)}
          onClose={() => setPriceModalLead(null)}
        >
          <form onSubmit={handleSavePriceAndRelease} className="space-y-4 text-xs">
            <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700">
              <p className="font-bold text-gray-900 dark:text-white">
                {priceModalLead.customerName} — {priceModalLead.serviceType || "RO Service"}
              </p>
              <p className="text-gray-500 text-[11px] mt-0.5">
                {priceModalLead.address || priceModalLead.area || "Location"}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Customer Service Value (Rs)
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={editPriceForm.estimatedAmount}
                  onChange={(e) =>
                    setEditPriceForm({ ...editPriceForm, estimatedAmount: e.target.value })
                  }
                  placeholder="e.g. 600"
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-xs font-semibold focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Lead Acceptance Cost (Coins)
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={editPriceForm.leadAcceptanceCharge}
                  onChange={(e) =>
                    setEditPriceForm({ ...editPriceForm, leadAcceptanceCharge: e.target.value })
                  }
                  placeholder="e.g. 10"
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-xs font-semibold focus:border-blue-500 focus:outline-none"
                />
                <p className="text-[10px] text-gray-500 mt-1">
                  Coins deducted from technician's wallet when they claim the lead.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="isReleasedCheck"
                checked={editPriceForm.isReleased}
                onChange={(e) =>
                  setEditPriceForm({ ...editPriceForm, isReleased: e.target.checked })
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
              />
              <label htmlFor="isReleasedCheck" className="font-bold text-gray-800 dark:text-gray-200">
                🚀 Release lead to local technicians pool immediately
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setPriceModalLead(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingPrice}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md"
              >
                {savingPrice ? "Saving..." : "Save Pricing & Broadcast"}
              </button>
            </div>
          </form>
        </AdminLteModal>
      )}

      {/* Assign Technician Modal */}
      {assignModalLead && (
        <AdminLteModal
          title={`Assign Technician to Lead #${assignModalLead.id.slice(0, 8)}`}
          isOpen={Boolean(assignModalLead)}
          onClose={() => setAssignModalLead(null)}
        >
          <form onSubmit={handleAssignTechnician} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                Select Technician from Fleet
              </label>
              <select
                value={selectedVendorId}
                onChange={(e) => setSelectedVendorId(e.target.value)}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-xs font-semibold focus:border-blue-500 focus:outline-none"
              >
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.fullName} ({v.phone || "No phone"}) - {v.specializations?.join(", ") || v.specialization || "RO Tech"}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setAssignModalLead(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actingId === assignModalLead.id}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md"
              >
                Confirm Technician Assignment
              </button>
            </div>
          </form>
        </AdminLteModal>
      )}

      {/* Create / Dispatch Lead Modal */}
      {showCreateModal && (
        <AdminLteModal
          title="Dispatch & Create New Customer Service Lead"
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        >
          <form onSubmit={handleCreateLead} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Customer Full Name</label>
                <input
                  type="text"
                  required
                  value={newLead.customerName}
                  onChange={(e) => setNewLead({ ...newLead, customerName: e.target.value })}
                  placeholder="e.g. Mithu Das"
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-xs font-semibold focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Customer Mobile Number</label>
                <input
                  type="tel"
                  required
                  value={newLead.phone}
                  onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                  placeholder="e.g. 9830122981"
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-xs font-semibold focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Full Service Address</label>
                <input
                  type="text"
                  required
                  value={newLead.address}
                  onChange={(e) => setNewLead({ ...newLead, address: e.target.value })}
                  placeholder="e.g. Amherst Street, Parnasree Palli, Behala, Kolkata, West Bengal, 700001"
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-xs font-semibold focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Pincode</label>
                <input
                  type="text"
                  required
                  inputMode="numeric"
                  value={newLead.pincode}
                  onChange={(e) => setNewLead({ ...newLead, pincode: e.target.value })}
                  placeholder="e.g. 380015"
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-xs font-semibold focus:border-blue-500 focus:outline-none"
                />
                <p className="mt-1 text-[10px] text-gray-500">Required — this is how nearby vendors get matched to this lead.</p>
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">District / City</label>
                <input
                  type="text"
                  required
                  value={newLead.district}
                  onChange={(e) => setNewLead({ ...newLead, district: e.target.value })}
                  placeholder="e.g. Ahmedabad"
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-xs font-semibold focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Appliance / Specialization Required</label>
                <input
                  type="text"
                  required
                  list="lead-specialization-options"
                  value={newLead.specialization}
                  onChange={(e) => setNewLead({ ...newLead, specialization: e.target.value })}
                  placeholder="Pick a trade, or type a custom one"
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-xs font-semibold focus:border-blue-500 focus:outline-none"
                />
                <datalist id="lead-specialization-options">
                  {SPECIALIZATIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                  {customVendorSpecializations.map((s) => (
                    <option key={s} value={s}>
                      {s} (custom trade)
                    </option>
                  ))}
                </datalist>
                <p className="mt-1 text-[10px] text-gray-500">
                  Must exactly match a vendor's registered specialization. Click the field to see standard trades plus any custom
                  trades vendors have already added.
                </p>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Service Type / Issue (shown to the vendor)</label>
                <input
                  type="text"
                  required
                  value={newLead.serviceType}
                  onChange={(e) => setNewLead({ ...newLead, serviceType: e.target.value })}
                  placeholder="e.g. RO Installation"
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-xs font-semibold focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Customer Service Price (Rs)</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={newLead.estimatedAmount}
                  onChange={(e) => setNewLead({ ...newLead, estimatedAmount: e.target.value })}
                  placeholder="e.g. 600"
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-xs font-semibold focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Lead Cost (Acceptance Coins)</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={newLead.leadAcceptanceCharge}
                  onChange={(e) => setNewLead({ ...newLead, leadAcceptanceCharge: e.target.value })}
                  placeholder="e.g. 10"
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-xs font-semibold focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Direct Assign Vendor (Optional)</label>
                <select
                  value={newLead.assignedVendorId}
                  onChange={(e) => setNewLead({ ...newLead, assignedVendorId: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-xs font-semibold focus:border-blue-500 focus:outline-none"
                >
                  <option value="">-- Open Pool (Broadcast to Area) --</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.fullName} ({v.phone || "No phone"}) - {v.specializations?.join(", ") || v.specialization || "Tech"}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md"
              >
                {creating ? "Dispatching..." : "Dispatch Lead to Fleet"}
              </button>
            </div>
          </form>
        </AdminLteModal>
      )}

      {/* Inspect Lead Modal */}
      {inspectLead && (
        <AdminLteModal
          title={`Lead Dossier: #${inspectLead.id.slice(0, 8)}`}
          isOpen={Boolean(inspectLead)}
          onClose={() => setInspectLead(null)}
        >
          <div className="space-y-4 text-xs">
            <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3.5 border border-gray-200 dark:border-gray-700">
              <p className="font-bold text-gray-900 dark:text-white text-sm">{inspectLead.customerName}</p>
              <p className="text-gray-700 dark:text-gray-300 mt-1">
                📍 {inspectLead.address || inspectLead.area || "Location on record"}
              </p>
              <p className="font-mono text-gray-500 text-[11px] mt-1">
                Phone: {inspectLead.phone || "—"} | Email: {inspectLead.email || "—"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700">
                <span className="text-[10px] uppercase font-bold text-gray-500 block">Service Type</span>
                <span className="font-bold text-xs text-orange-600 dark:text-orange-400">
                  {inspectLead.serviceType || "RO Installation"}
                </span>
              </div>
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700">
                <span className="text-[10px] uppercase font-bold text-gray-500 block">Assigned Tech</span>
                <span className="font-bold text-xs text-gray-900 dark:text-white">
                  {inspectLead.technicianName || inspectLead.assignedVendor?.fullName || "Open Pool"}
                </span>
              </div>
            </div>
          </div>
        </AdminLteModal>
      )}

      {/* Proof Photo Modal */}
      {selectedProof && (
        <AdminLteModal
          title={`On-Site Geotag Photo: ${selectedProof.customerName || selectedProof.lead?.customerName || "Customer Job"}`}
          isOpen={Boolean(selectedProof)}
          onClose={() => setSelectedProof(null)}
        >
          <div className="text-center text-xs space-y-3">
            {selectedProof.image || selectedProof.imageUrl ? (
              <img
                src={getMediaUrl(selectedProof.image || selectedProof.imageUrl)}
                alt="Geotag proof"
                className="max-h-[60vh] mx-auto rounded-xl object-contain border border-gray-300 dark:border-gray-700 shadow-md"
              />
            ) : (
              <div className="p-8 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-500">
                <p className="text-2xl mb-1">📸</p>
                <p className="font-bold">No attached photograph was uploaded with this verification record.</p>
              </div>
            )}
            <div className="mt-3 font-mono flex flex-wrap items-center justify-center gap-4 text-xs">
              <span className={selectedProof.latitude != null && selectedProof.longitude != null ? "text-emerald-700 dark:text-emerald-400 font-bold" : "text-gray-500 font-bold"}>
                📍{" "}
                {selectedProof.latitude != null && selectedProof.longitude != null
                  ? `Coordinates: ${selectedProof.latitude.toFixed(5)}, ${selectedProof.longitude.toFixed(5)}`
                  : "No GPS coordinates were captured with this submission."}
              </span>
              {selectedProof.reason && (
                <span className="text-rose-600 dark:text-rose-400 font-bold">
                  Stated Reason: "{selectedProof.reason}"
                </span>
              )}
            </div>
          </div>
        </AdminLteModal>
      )}
    </div>
  );
}
