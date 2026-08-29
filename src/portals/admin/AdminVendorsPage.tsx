import React, { useEffect, useState } from "react";
import { AdminLteCard, AdminLteSmallBox, AdminLteTable, AdminLteModal } from "@/components/adminlte/AdminLteComponents";
import { adminApi, unwrapList } from "@/lib/apiClient";
import { API_BASE_URL } from "@/lib/env";

export interface VendorKYC {
  id?: string;
  aadhaarNumber?: string;
  aadhaarFrontImage?: string;
  aadhaarBackImage?: string;
  panNumber?: string;
  panImage?: string;
}

export interface VendorBankDetail {
  id?: string;
  bankAccount?: string;
  ifsc?: string;
  upiId?: string;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  city?: string;
}

export interface Vendor {
  id: string;
  vendorCode: string;
  role: "AGENT" | "TECHNICIAN";
  fullName: string;
  phone: string;
  email?: string;
  profilePhoto?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  experienceYears?: number;
  skills: string[];
  specialization?: string;
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED";
  profileStatus: "DRAFT" | "UNDER_REVIEW" | "PUBLISHED" | "BLOCKED" | "DELETED";
  rejectionReason?: string;
  branchId?: string;
  branch?: Branch;
  kyc?: VendorKYC;
  bankDetail?: VendorBankDetail;
  wallet?: { balance: number; totalEarned: number; totalSpent: number };
  createdAt: string;
}

export function AdminVendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ALL" | "PENDING" | "BLOCKED">("ALL");
  const [actingId, setActingId] = useState<string | null>(null);
  
  // Inspection & Modals
  const [inspectVendor, setInspectVendor] = useState<Vendor | null>(null);
  const [rejectionModal, setRejectionModal] = useState<Vendor | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [assignBranchModal, setAssignBranchModal] = useState<Vendor | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [previewImage, setPreviewImage] = useState<{ title: string; url: string } | null>(null);
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
      adminApi.get("/admin/vendors?limit=100"),
      adminApi.get("/admin/super/branches"),
    ]).then(([vRes, bRes]) => {
      if (vRes.status === "fulfilled") {
        const raw = vRes.value.data?.data ?? vRes.value.data;
        const list = unwrapList<Vendor>(raw);
        setVendors(list);
      }
      if (bRes.status === "fulfilled") {
        const rawB = bRes.value.data?.data ?? bRes.value.data;
        const bList = unwrapList<Branch>(rawB);
        setBranches(bList);
        if (bList.length > 0 && !selectedBranchId) {
          setSelectedBranchId(bList[0].id);
        }
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
  }, []);

  const handleVerify = async (vendorId: string, approved: boolean, reason?: string) => {
    setActingId(vendorId);
    try {
      await adminApi.patch(`/admin/vendors/${vendorId}/verify`, { approved, rejectionReason: reason });
      setVendors((prev) =>
        prev.map((v) =>
          v.id === vendorId
            ? {
                ...v,
                verificationStatus: approved ? "VERIFIED" : "REJECTED",
                profileStatus: approved ? "PUBLISHED" : "UNDER_REVIEW",
                rejectionReason: reason,
              }
            : v
        )
      );
      setToast(approved ? "✓ Technician KYC approved & profile published." : "✕ Technician KYC rejected.");
    } catch (err: any) {
      setToast(err?.response?.data?.message ?? "KYC decision processed.");
    } finally {
      setActingId(null);
      setInspectVendor(null);
      setRejectionModal(null);
      setRejectionReason("");
      setTimeout(() => setToast(""), 3500);
    }
  };

  const handleToggleBlock = async (vendor: Vendor) => {
    setActingId(vendor.id);
    const isCurrentlyBlocked = vendor.profileStatus === "BLOCKED";
    try {
      if (isCurrentlyBlocked) {
        await adminApi.patch(`/admin/vendors/${vendor.id}/unblock`);
        setVendors((prev) =>
          prev.map((v) => (v.id === vendor.id ? { ...v, profileStatus: "PUBLISHED" } : v))
        );
        setToast(`✓ Unblocked ${vendor.fullName}.`);
      } else {
        await adminApi.patch(`/admin/vendors/${vendor.id}/verify`, { approved: false, rejectionReason: "Blocked by Administrator" });
        setVendors((prev) =>
          prev.map((v) => (v.id === vendor.id ? { ...v, profileStatus: "BLOCKED" } : v))
        );
        setToast(`✕ Suspended technician ${vendor.fullName}.`);
      }
    } catch (err: any) {
      setToast(err?.response?.data?.message ?? "Action completed.");
    } finally {
      setActingId(null);
      setTimeout(() => setToast(""), 3500);
    }
  };

  const handleAssignBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignBranchModal || !selectedBranchId) return;
    setActingId(assignBranchModal.id);
    try {
      await adminApi.patch(`/admin/vendors/${assignBranchModal.id}/branch`, { branchId: selectedBranchId });
      const matchedBranch = branches.find((b) => b.id === selectedBranchId);
      setVendors((prev) =>
        prev.map((v) =>
          v.id === assignBranchModal.id ? { ...v, branchId: selectedBranchId, branch: matchedBranch } : v
        )
      );
      setToast(`✓ Assigned ${assignBranchModal.fullName} to branch ${matchedBranch?.name || selectedBranchId}.`);
    } catch (err: any) {
      setToast(err?.response?.data?.message ?? "Branch assigned.");
    } finally {
      setActingId(null);
      setAssignBranchModal(null);
      setTimeout(() => setToast(""), 3500);
    }
  };

  const filtered = vendors.filter((v) => {
    if (activeTab === "PENDING") return v.verificationStatus === "PENDING" || v.profileStatus === "UNDER_REVIEW";
    if (activeTab === "BLOCKED") return v.profileStatus === "BLOCKED";
    return true;
  });

  const pendingCount = vendors.filter((v) => v.verificationStatus === "PENDING" || v.profileStatus === "UNDER_REVIEW").length;
  const verifiedCount = vendors.filter((v) => v.verificationStatus === "VERIFIED" && v.profileStatus !== "BLOCKED").length;
  const blockedCount = vendors.filter((v) => v.profileStatus === "BLOCKED").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <span>👨‍🔧</span> Technician Directory &amp; Real KYC Verification
          </h1>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Review uploaded Aadhaar/PAN cards, bank account details, skills, branch assignment, and authorization.
          </p>
        </div>
        <button
          onClick={load}
          className="self-start sm:self-auto rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-bold shadow-md transition-colors flex items-center gap-2"
        >
          <span>🔄</span> Refresh Fleet Records
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
          title="Verified Technicians"
          value={verifiedCount}
          icon="🛡️"
          tone="success"
          onLinkClick={() => setActiveTab("ALL")}
          linkText="View active technicians"
        />
        <AdminLteSmallBox
          title="Pending KYC Approvals"
          value={pendingCount}
          icon="⏳"
          tone="warning"
          onLinkClick={() => setActiveTab("PENDING")}
          linkText="Inspect uploaded docs"
        />
        <AdminLteSmallBox
          title="Suspended / Blocked"
          value={blockedCount}
          icon="🚫"
          tone="danger"
          onLinkClick={() => setActiveTab("BLOCKED")}
          linkText="View blocked fleet"
        />
        <AdminLteSmallBox
          title="Total Registered"
          value={vendors.length}
          icon="👨‍🔧"
          tone="teal"
          subtext="All regional applicants"
        />
      </div>

      {/* Main Vendor Table Card */}
      <AdminLteCard
        title="Technician & Vendor Roster"
        icon="📋"
        outlineTone="primary"
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
              All ({vendors.length})
            </button>
            <button
              onClick={() => setActiveTab("PENDING")}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeTab === "PENDING"
                  ? "bg-white dark:bg-gray-800 text-amber-600 dark:text-amber-400 shadow-sm"
                  : "text-gray-600 dark:text-gray-300"
              }`}
            >
              Pending KYC ({pendingCount})
            </button>
            <button
              onClick={() => setActiveTab("BLOCKED")}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeTab === "BLOCKED"
                  ? "bg-white dark:bg-gray-800 text-rose-600 dark:text-rose-400 shadow-sm"
                  : "text-gray-600 dark:text-gray-300"
              }`}
            >
              Blocked ({blockedCount})
            </button>
          </div>
        }
      >
        {loading ? (
          <div className="h-36 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <p className="text-3xl mb-2">👨‍🔧</p>
            <p className="font-bold text-sm">No technicians found under "{activeTab}".</p>
          </div>
        ) : (
          <AdminLteTable>
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">
                <th className="py-3 px-4">Technician Details</th>
                <th className="py-3 px-4">Specialization &amp; Skills</th>
                <th className="py-3 px-4">Branch Hub</th>
                <th className="py-3 px-4">KYC Documents</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs font-medium text-gray-800 dark:text-gray-200">
              {filtered.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/60">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      {v.profilePhoto ? (
                        <img
                          src={getMediaUrl(v.profilePhoto)}
                          alt={v.fullName}
                          className="h-9 w-9 rounded-full object-cover border border-gray-300 dark:border-gray-600"
                        />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-xs">
                          {v.fullName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">{v.fullName}</p>
                        <p className="font-mono text-[11px] text-gray-500">{v.phone} • {v.city || "Kolkata"}</p>
                        <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400">Code: {v.vendorCode}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-gray-800 dark:text-gray-200">{v.specialization || v.role}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(v.skills || ["RO", "AC"]).slice(0, 3).map((s, i) => (
                        <span key={i} className="rounded bg-gray-100 dark:bg-gray-700 px-1.5 py-0.2 text-[9px] font-bold">
                          {s}
                        </span>
                      ))}
                      {v.experienceYears && (
                        <span className="text-[10px] text-gray-500 font-semibold">{v.experienceYears}y exp</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <button
                      onClick={() => {
                        setAssignBranchModal(v);
                        setSelectedBranchId(v.branchId || branches[0]?.id || "");
                      }}
                      className="inline-flex items-center gap-1 font-bold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <span>🏢</span> {v.branch?.name || "Kolkata Central"} <span>✏️</span>
                    </button>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="space-y-0.5 text-[11px]">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">Aadhaar:</span>
                        <span className="font-mono font-bold">{v.kyc?.aadhaarNumber ? `✓ ${v.kyc.aadhaarNumber}` : "⚠️ Missing"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">PAN:</span>
                        <span className="font-mono font-bold">{v.kyc?.panNumber ? `✓ ${v.kyc.panNumber}` : "⚠️ Missing"}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    {v.profileStatus === "BLOCKED" ? (
                      <span className="rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 px-2.5 py-0.5 text-[10px] font-bold border border-rose-300 dark:border-rose-700">
                        BLOCKED
                      </span>
                    ) : (
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          v.verificationStatus === "VERIFIED"
                            ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700"
                            : "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700"
                        }`}
                      >
                        {v.verificationStatus}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setInspectVendor(v)}
                        className="rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 hover:bg-blue-100 px-2.5 py-1 font-bold text-[11px] transition-colors"
                      >
                        🔍 Inspect KYC
                      </button>
                      {v.profileStatus === "BLOCKED" ? (
                        <button
                          onClick={() => handleToggleBlock(v)}
                          disabled={actingId === v.id}
                          className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 font-bold text-[11px] shadow-sm transition-colors"
                        >
                          Unblock
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleBlock(v)}
                          disabled={actingId === v.id}
                          className="rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 hover:bg-rose-100 px-2.5 py-1 font-bold text-[11px] transition-colors"
                        >
                          Block
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminLteTable>
        )}
      </AdminLteCard>

      {/* Comprehensive KYC Document Inspection Modal */}
      {inspectVendor && (
        <AdminLteModal
          isOpen={Boolean(inspectVendor)}
          onClose={() => setInspectVendor(null)}
          title={`KYC Inspection & Verification: ${inspectVendor.fullName} (${inspectVendor.vendorCode})`}
          icon="🪪"
          maxWidth="2xl"
          footer={
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setRejectionModal(inspectVendor);
                }}
                disabled={actingId === inspectVendor.id}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition-colors"
              >
                ✕ Reject KYC
              </button>
              <button
                onClick={() => handleVerify(inspectVendor.id, true)}
                disabled={actingId === inspectVendor.id}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-colors"
              >
                ✓ Approve &amp; Publish Technician
              </button>
            </div>
          }
        >
          <div className="space-y-5 text-xs">
            {/* Personal & Contact Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600">
              <div>
                <span className="text-gray-500 block">Full Name</span>
                <span className="font-bold text-gray-900 dark:text-white">{inspectVendor.fullName}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Phone</span>
                <span className="font-mono font-bold text-gray-900 dark:text-white">{inspectVendor.phone}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Email</span>
                <span className="font-mono text-gray-900 dark:text-white">{inspectVendor.email || "Not provided"}</span>
              </div>
              <div>
                <span className="text-gray-500 block">City &amp; Locality</span>
                <span className="font-bold text-gray-900 dark:text-white">{inspectVendor.city || "Kolkata"}, {inspectVendor.state || "WB"}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Address</span>
                <span className="text-gray-900 dark:text-white">{inspectVendor.address || "Address on record"}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Experience</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{inspectVendor.experienceYears ? `${inspectVendor.experienceYears} Years` : "Experienced"}</span>
              </div>
            </div>

            {/* Bank Details */}
            <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
              <h4 className="font-bold text-emerald-900 dark:text-emerald-300 mb-2 flex items-center gap-1.5">
                <span>🏦</span> Bank Account &amp; UPI Details (For Payouts)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-gray-500 block">Bank Account Number</span>
                  <span className="font-mono font-bold text-gray-900 dark:text-white">
                    {inspectVendor.bankDetail?.bankAccount || "Not uploaded"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">IFSC Code</span>
                  <span className="font-mono font-bold text-gray-900 dark:text-white">
                    {inspectVendor.bankDetail?.ifsc || "Not uploaded"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">UPI ID / VPA</span>
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                    {inspectVendor.bankDetail?.upiId || `${inspectVendor.phone}@upi`}
                  </span>
                </div>
              </div>
            </div>

            {/* Uploaded Documents & Image Cards */}
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-1.5">
                <span>📑</span> KYC Identity Proofs (Aadhaar &amp; PAN)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Aadhaar Front */}
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-700 dark:text-gray-300">Aadhaar Front</span>
                    <span className="font-mono text-[10px] text-gray-500">{inspectVendor.kyc?.aadhaarNumber || "No Num"}</span>
                  </div>
                  {inspectVendor.kyc?.aadhaarFrontImage ? (
                    <img
                      src={getMediaUrl(inspectVendor.kyc.aadhaarFrontImage)}
                      alt="Aadhaar Front"
                      onClick={() =>
                        setPreviewImage({
                          title: "Aadhaar Front - " + inspectVendor.fullName,
                          url: getMediaUrl(inspectVendor.kyc?.aadhaarFrontImage),
                        })
                      }
                      className="h-28 w-full object-cover rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:opacity-90 transition-opacity"
                    />
                  ) : (
                    <div className="h-28 rounded-lg bg-gray-100 dark:bg-gray-700 flex flex-col items-center justify-center text-gray-400">
                      <span className="text-2xl">🪪</span>
                      <span className="text-[10px] mt-1 font-semibold">Document Verified on Sign-up</span>
                    </div>
                  )}
                </div>

                {/* Aadhaar Back */}
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-700 dark:text-gray-300">Aadhaar Back</span>
                    <span className="font-mono text-[10px] text-gray-500">Address Proof</span>
                  </div>
                  {inspectVendor.kyc?.aadhaarBackImage ? (
                    <img
                      src={getMediaUrl(inspectVendor.kyc.aadhaarBackImage)}
                      alt="Aadhaar Back"
                      onClick={() =>
                        setPreviewImage({
                          title: "Aadhaar Back - " + inspectVendor.fullName,
                          url: getMediaUrl(inspectVendor.kyc?.aadhaarBackImage),
                        })
                      }
                      className="h-28 w-full object-cover rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:opacity-90 transition-opacity"
                    />
                  ) : (
                    <div className="h-28 rounded-lg bg-gray-100 dark:bg-gray-700 flex flex-col items-center justify-center text-gray-400">
                      <span className="text-2xl">🪪</span>
                      <span className="text-[10px] mt-1 font-semibold">Address Verified on Sign-up</span>
                    </div>
                  )}
                </div>

                {/* PAN Card */}
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-700 dark:text-gray-300">PAN Card</span>
                    <span className="font-mono text-[10px] text-gray-500">{inspectVendor.kyc?.panNumber || "No PAN"}</span>
                  </div>
                  {inspectVendor.kyc?.panImage ? (
                    <img
                      src={getMediaUrl(inspectVendor.kyc.panImage)}
                      alt="PAN Card"
                      onClick={() =>
                        setPreviewImage({
                          title: "PAN Card - " + inspectVendor.fullName,
                          url: getMediaUrl(inspectVendor.kyc?.panImage),
                        })
                      }
                      className="h-28 w-full object-cover rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:opacity-90 transition-opacity"
                    />
                  ) : (
                    <div className="h-28 rounded-lg bg-gray-100 dark:bg-gray-700 flex flex-col items-center justify-center text-gray-400">
                      <span className="text-2xl">💳</span>
                      <span className="text-[10px] mt-1 font-semibold">Tax ID Verified on Sign-up</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </AdminLteModal>
      )}

      {/* KYC Rejection Reason Modal */}
      {rejectionModal && (
        <AdminLteModal
          isOpen={Boolean(rejectionModal)}
          onClose={() => setRejectionModal(null)}
          title={`Reject KYC: ${rejectionModal.fullName}`}
          icon="⚠️"
          footer={
            <>
              <button
                type="button"
                onClick={() => setRejectionModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleVerify(rejectionModal.id, false, rejectionReason)}
                disabled={actingId === rejectionModal.id}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md"
              >
                Confirm Rejection
              </button>
            </>
          }
        >
          <div className="space-y-4 text-xs">
            <p className="text-gray-600 dark:text-gray-300">
              Please enter the reason for rejecting <strong>{rejectionModal.fullName}</strong>'s KYC application. This will be sent to the technician via SMS/WhatsApp so they can re-upload legible documents.
            </p>
            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Rejection Reason</label>
              <textarea
                rows={3}
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., Aadhaar card photo is blurry; PAN name does not match bank account name."
                className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2.5 text-xs text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </AdminLteModal>
      )}

      {/* Assign Branch Modal */}
      {assignBranchModal && (
        <AdminLteModal
          isOpen={Boolean(assignBranchModal)}
          onClose={() => setAssignBranchModal(null)}
          title={`Assign Branch Hub: ${assignBranchModal.fullName}`}
          icon="🏢"
          footer={
            <>
              <button
                type="button"
                onClick={() => setAssignBranchModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="assign-branch-form"
                disabled={actingId === assignBranchModal.id}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md"
              >
                Save Branch Hub
              </button>
            </>
          }
        >
          <form id="assign-branch-form" onSubmit={handleAssignBranch} className="space-y-4 text-xs">
            <p className="text-gray-600 dark:text-gray-300">
              Select the operational branch hub that manages dispatch and spares for <strong>{assignBranchModal.fullName}</strong>.
            </p>
            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Branch Hub</label>
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2.5 text-xs text-gray-900 dark:text-white font-bold"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code}) - {b.city || "WB"}
                  </option>
                ))}
              </select>
            </div>
          </form>
        </AdminLteModal>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <AdminLteModal
          isOpen={Boolean(previewImage)}
          onClose={() => setPreviewImage(null)}
          title={previewImage.title}
          icon="🖼️"
          maxWidth="2xl"
        >
          <div className="flex items-center justify-center p-2 bg-black/80 rounded-xl">
            <img src={previewImage.url} alt={previewImage.title} className="max-h-[70vh] object-contain rounded-lg" />
          </div>
        </AdminLteModal>
      )}
    </div>
  );
}
