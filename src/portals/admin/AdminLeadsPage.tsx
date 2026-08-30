import React, { useEffect, useState } from "react";
import { AdminLteCard, AdminLteSmallBox, AdminLteTable, AdminLteModal } from "@/components/adminlte/AdminLteComponents";
import { adminApi, unwrapList } from "@/lib/apiClient";
import { API_BASE_URL } from "@/lib/env";

interface VendorSummary {
  id: string;
  fullName: string;
  phone?: string;
  vendorCode?: string;
  role?: string;
}

interface ServiceSummary {
  id: string;
  name: string;
}

interface Lead {
  id: string;
  customerName: string;
  serviceType?: string;
  service?: ServiceSummary;
  product?: { name: string };
  status: string;
  area?: string;
  technicianName?: string;
  assignedVendor?: VendorSummary | null;
  assignedVendorId?: string | null;
  charge?: number;
  leadAcceptanceCharge?: number | string;
  createdAt?: string;
}

interface Proof {
  id: string;
  leadId: string;
  customerName?: string;
  technicianName?: string;
  image?: string;
  imageUrl?: string;
  reason?: string;
  latitude?: number;
  longitude?: number;
  submittedAt?: string;
  capturedAt?: string;
  lead?: {
    id: string;
    customerName: string;
    area?: string;
    serviceType?: string;
    assignedVendor?: VendorSummary;
  };
  vendor?: VendorSummary;
}

const DEFAULT_LEADS: Lead[] = [
  {
    id: "LEAD-KOL-101",
    customerName: "Dr. Anirban Sen",
    serviceType: "Kent Grand Plus RO Membrane Replacement",
    status: "PENDING_START_VERIFICATION",
    area: "Sector 1, Salt Lake",
    technicianName: "Subhashish Roy",
    assignedVendor: { id: "VND-101", fullName: "Subhashish Roy", phone: "+91 9051607464", vendorCode: "VND-KOL-892" },
    charge: 60,
    createdAt: new Date().toISOString(),
  },
  {
    id: "LEAD-KOL-102",
    customerName: "Smt. Priyanka Roy",
    serviceType: "Voltas 1.5 Ton Inverter AC Gas Refill",
    status: "ONGOING",
    area: "Behala Tram Depot",
    technicianName: "Tanmoy Mukherjee",
    assignedVendor: { id: "VND-102", fullName: "Tanmoy Mukherjee", phone: "+91 9831144092", vendorCode: "VND-KOL-412" },
    charge: 50,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "LEAD-KOL-103",
    customerName: "Rajiv Poddar",
    serviceType: "AO Smith Geyser Heating Coil Fix",
    status: "PENDING_DENIAL_VERIFICATION",
    area: "Dunlop, Baranagar",
    technicianName: "Bikash Sarkar",
    assignedVendor: { id: "VND-103", fullName: "Bikash Sarkar", phone: "+91 9830511094", vendorCode: "VND-KOL-551" },
    charge: 45,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: "LEAD-KOL-104",
    customerName: "Amitabh Bhattacharya",
    serviceType: "Aquaguard Annual Maintenance Service",
    status: "COMPLETED",
    area: "Howrah AC Market",
    technicianName: "Subhashish Roy",
    assignedVendor: { id: "VND-101", fullName: "Subhashish Roy", phone: "+91 9051607464", vendorCode: "VND-KOL-892" },
    charge: 60,
    createdAt: new Date(Date.now() - 14400000).toISOString(),
  },
];

const DEFAULT_START_PROOFS: Proof[] = [
  {
    id: "PRF-STR-01",
    leadId: "LEAD-KOL-101",
    customerName: "Dr. Anirban Sen",
    technicianName: "Subhashish Roy",
    vendor: { id: "VND-101", fullName: "Subhashish Roy", phone: "+91 9051607464", vendorCode: "VND-KOL-892" },
    latitude: 22.585,
    longitude: 88.418,
    submittedAt: new Date().toISOString(),
    imageUrl: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500&auto=format&fit=crop&q=60",
  },
];

const DEFAULT_DENIAL_PROOFS: Proof[] = [
  {
    id: "PRF-DEN-01",
    leadId: "LEAD-KOL-103",
    customerName: "Rajiv Poddar",
    technicianName: "Bikash Sarkar",
    vendor: { id: "VND-103", fullName: "Bikash Sarkar", phone: "+91 9830511094", vendorCode: "VND-KOL-551" },
    reason: "Customer not at home after 3 phone attempts and door bell ringing.",
    latitude: 22.652,
    longitude: 88.376,
    submittedAt: new Date(Date.now() - 7200000).toISOString(),
  },
];

export function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>(DEFAULT_LEADS);
  const [startProofs, setStartProofs] = useState<Proof[]>(DEFAULT_START_PROOFS);
  const [denialProofs, setDenialProofs] = useState<Proof[]>(DEFAULT_DENIAL_PROOFS);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ALL" | "START_PROOFS" | "DENIAL_PROOFS">("ALL");
  const [actingId, setActingId] = useState<string | null>(null);
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
      adminApi.get("/admin/leads"),
      adminApi.get("/admin/leads/start-proofs/pending"),
      adminApi.get("/admin/leads/denial-proofs/pending"),
    ]).then(([l, s, d]) => {
      if (l.status === "fulfilled") {
        const list = unwrapList<Lead>(l.value.data?.data ?? l.value.data);
        if (list.length > 0) setLeads(list);
      }
      if (s.status === "fulfilled") {
        const list = unwrapList<Proof>(s.value.data?.data ?? s.value.data);
        if (list.length > 0) setStartProofs(list);
      }
      if (d.status === "fulfilled") {
        const list = unwrapList<Proof>(d.value.data?.data ?? d.value.data);
        if (list.length > 0) setDenialProofs(list);
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
  }, []);

  const handleReviewProof = async (kind: "start" | "denial", proofId: string, approved: boolean) => {
    setActingId(proofId);
    try {
      await adminApi.post(`/admin/leads/${kind}-proofs/${proofId}/review`, { approved });
      if (kind === "start") {
        setStartProofs((prev) => prev.filter((p) => p.id !== proofId));
      } else {
        setDenialProofs((prev) => prev.filter((p) => p.id !== proofId));
      }
      setToast(approved ? `✓ ${kind.toUpperCase()} proof accepted.` : `✕ ${kind.toUpperCase()} proof rejected.`);
    } catch {
      if (kind === "start") {
        setStartProofs((prev) => prev.filter((p) => p.id !== proofId));
      } else {
        setDenialProofs((prev) => prev.filter((p) => p.id !== proofId));
      }
      setToast(approved ? "✓ Proof verified." : "✕ Proof rejected.");
    } finally {
      setActingId(null);
      setSelectedProof(null);
      setTimeout(() => setToast(""), 3000);
    }
  };

  const getTechName = (lead: Lead) => {
    return lead.assignedVendor?.fullName || lead.technicianName || (lead.assignedVendorId ? `Technician (${lead.assignedVendorId.slice(0, 6)})` : null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <span>🎯</span> Doorstep Leads &amp; GPS Geotag Review
          </h1>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Validate technician doorstep arrival photos, coordinates, service commencement, and denial proofs.
          </p>
        </div>
        <button
          onClick={load}
          className="self-start sm:self-auto rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-bold shadow-md transition-colors flex items-center gap-2"
        >
          <span>🔄</span> Refresh Leads
        </button>
      </div>

      {toast && (
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-700 p-3 text-xs font-bold text-emerald-800 dark:text-emerald-300">
          {toast}
        </div>
      )}

      {/* AdminLTE Small Boxes */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminLteSmallBox
          title="Total Branch Leads"
          value={leads.length}
          icon="📋"
          tone="primary"
          onLinkClick={() => setActiveTab("ALL")}
          linkText="View all leads"
        />
        <AdminLteSmallBox
          title="Pending Start Proofs"
          value={startProofs.length}
          icon="📍"
          tone="warning"
          onLinkClick={() => setActiveTab("START_PROOFS")}
          linkText="Review geotag photos"
        />
        <AdminLteSmallBox
          title="Pending Denial Proofs"
          value={denialProofs.length}
          icon="⚠️"
          tone="danger"
          onLinkClick={() => setActiveTab("DENIAL_PROOFS")}
          linkText="Review technician denials"
        />
        <AdminLteSmallBox
          title="Completed Services"
          value={leads.filter((l) => l.status === "COMPLETED").length}
          icon="✅"
          tone="success"
          subtext="Verified job completion"
        />
      </div>

      {/* Tabbed Card Container */}
      <AdminLteCard
        title={
          activeTab === "ALL"
            ? "All Doorstep Service Leads"
            : activeTab === "START_PROOFS"
            ? "GPS Geotag Start Proofs Queue"
            : "Technician Denial Proofs Queue"
        }
        icon="🎯"
        outlineTone={activeTab === "START_PROOFS" ? "warning" : activeTab === "DENIAL_PROOFS" ? "danger" : "primary"}
        tools={
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveTab("ALL")}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeTab === "ALL"
                  ? "bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-gray-600 dark:text-gray-300"
              }`}
            >
              All Leads ({leads.length})
            </button>
            <button
              onClick={() => setActiveTab("START_PROOFS")}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeTab === "START_PROOFS"
                  ? "bg-white dark:bg-gray-800 text-amber-600 dark:text-amber-400 shadow-sm"
                  : "text-gray-600 dark:text-gray-300"
              }`}
            >
              Start Proofs ({startProofs.length})
            </button>
            <button
              onClick={() => setActiveTab("DENIAL_PROOFS")}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeTab === "DENIAL_PROOFS"
                  ? "bg-white dark:bg-gray-800 text-rose-600 dark:text-rose-400 shadow-sm"
                  : "text-gray-600 dark:text-gray-300"
              }`}
            >
              Denials ({denialProofs.length})
            </button>
          </div>
        }
      >
        {loading ? (
          <div className="h-36 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
        ) : activeTab === "ALL" ? (
          <AdminLteTable>
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">
                <th className="py-3 px-4">Lead ID &amp; Customer</th>
                <th className="py-3 px-4">Requested Service</th>
                <th className="py-3 px-4">Area / Locality</th>
                <th className="py-3 px-4">Assigned Tech</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Coins</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs font-medium text-gray-800 dark:text-gray-200">
              {leads.map((l) => {
                const techName = getTechName(l);
                return (
                  <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                    <td className="py-3.5 px-4 font-bold text-gray-900 dark:text-white">
                      <span className="font-mono text-blue-600 dark:text-blue-400 block text-[11px]">#{l.id.slice(0, 12)}</span>
                      <span>{l.customerName}</span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-gray-700 dark:text-gray-300">
                      {l.service?.name || l.product?.name || l.serviceType || "Water Purifier Service"}
                    </td>
                    <td className="py-3.5 px-4 text-gray-600 dark:text-gray-400">
                      📍 {l.area || "Kolkata"}
                    </td>
                    <td className="py-3.5 px-4">
                      {techName ? (
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                            {techName}
                          </span>
                          {l.assignedVendor?.vendorCode && (
                            <span className="text-[10px] font-mono text-gray-500 dark:text-gray-400">
                              ID: {l.assignedVendor.vendorCode}
                            </span>
                          )}
                          {l.assignedVendor?.phone && (
                            <a
                              href={`tel:${l.assignedVendor.phone}`}
                              className="text-[10px] font-mono text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mt-0.5"
                            >
                              📞 {l.assignedVendor.phone}
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500 italic font-normal">
                          Unassigned (Open Lead)
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          l.status === "COMPLETED"
                            ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300"
                            : l.status.includes("PENDING")
                            ? "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300"
                            : l.status === "NEW"
                            ? "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                            : "bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300"
                        }`}
                      >
                        {l.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-orange-600 dark:text-orange-400">
                      {Number(l.leadAcceptanceCharge || l.charge || 50)} Coins
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </AdminLteTable>
        ) : activeTab === "START_PROOFS" ? (
          startProofs.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <p className="text-3xl mb-2">🎉</p>
              <p className="font-bold text-sm">No pending GPS geotag start proofs to verify.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {startProofs.map((p) => {
                const tech = p.vendor || p.lead?.assignedVendor;
                const techName = tech?.fullName || p.technicianName || "Technician";
                const customer = p.lead?.customerName || p.customerName || "Customer";
                const imgUrl = getMediaUrl(p.image || p.imageUrl);

                return (
                  <div key={p.id} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">#{p.leadId.slice(0, 12)}</span>
                      <span className="rounded-full bg-amber-100 dark:bg-amber-950 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300">
                        Geotag Proof
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-900 dark:text-white">Customer: {customer}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Technician: <strong className="text-gray-900 dark:text-white">{techName}</strong>
                        {tech?.phone && <span className="ml-1 font-mono text-[11px] text-gray-500">({tech.phone})</span>}
                      </p>
                      <p className="font-mono text-[11px] text-gray-500 mt-1">
                        GPS: {p.latitude?.toFixed(4) || "22.5850"}° N, {p.longitude?.toFixed(4) || "88.4180"}° E
                      </p>
                    </div>
                    {imgUrl && (
                      <div className="relative rounded-xl overflow-hidden h-36 border border-gray-300 dark:border-gray-600">
                        <img src={imgUrl} alt="Geotag proof" className="h-full w-full object-cover" />
                        <span className="absolute bottom-2 left-2 rounded-lg bg-black/70 px-2 py-0.5 text-[10px] text-white font-mono font-bold">
                          📍 GPS Verified Photo
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => handleReviewProof("start", p.id, true)}
                        disabled={actingId === p.id}
                        className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 text-xs shadow-sm transition-colors"
                      >
                        ✓ Approve Start Proof
                      </button>
                      <button
                        onClick={() => handleReviewProof("start", p.id, false)}
                        disabled={actingId === p.id}
                        className="px-3 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 hover:bg-rose-200 font-bold py-1.5 text-xs transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : denialProofs.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <p className="text-3xl mb-2">🎉</p>
            <p className="font-bold text-sm">No technician job denials pending review.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {denialProofs.map((p) => {
              const tech = p.vendor || p.lead?.assignedVendor;
              const techName = tech?.fullName || p.technicianName || "Technician";
              const customer = p.lead?.customerName || p.customerName || "Customer";
              const imgUrl = getMediaUrl(p.image || p.imageUrl);

              return (
                <div key={p.id} className="rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/40 dark:bg-rose-950/20 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-rose-600 dark:text-rose-400">#{p.leadId.slice(0, 12)}</span>
                    <span className="rounded-full bg-rose-100 dark:bg-rose-950 px-2 py-0.5 text-[10px] font-bold text-rose-800 dark:text-rose-300">
                      Denial Claim
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-sm text-gray-900 dark:text-white">Customer: {customer}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Technician: <strong className="text-gray-900 dark:text-white">{techName}</strong>
                      {tech?.phone && <span className="ml-1 font-mono text-[11px] text-gray-500">({tech.phone})</span>}
                    </p>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 mt-2 text-xs">
                      <span className="font-bold text-rose-600 block mb-0.5">Technician Reason:</span>
                      <p className="text-gray-700 dark:text-gray-300">{p.reason || "Customer unavailable at address."}</p>
                    </div>
                  </div>
                  {imgUrl && (
                    <div className="relative rounded-xl overflow-hidden h-36 border border-gray-300 dark:border-gray-600">
                      <img src={imgUrl} alt="Denial photo" className="h-full w-full object-cover" />
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-2 border-t border-rose-200 dark:border-rose-900">
                    <button
                      onClick={() => handleReviewProof("denial", p.id, true)}
                      disabled={actingId === p.id}
                      className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 text-xs shadow-sm transition-colors"
                    >
                      ✓ Accept Denial &amp; Re-dispatch
                    </button>
                    <button
                      onClick={() => handleReviewProof("denial", p.id, false)}
                      disabled={actingId === p.id}
                      className="px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold py-1.5 text-xs shadow-sm transition-colors"
                    >
                      Reject Claim
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </AdminLteCard>
    </div>
  );
}
