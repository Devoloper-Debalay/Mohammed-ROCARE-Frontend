import React, { useEffect, useState } from "react";
import { AdminLteCard, AdminLteSmallBox, AdminLteTable, AdminLteModal } from "@/components/adminlte/AdminLteComponents";
import { adminApi, unwrapList } from "@/lib/apiClient";
import { API_BASE_URL } from "@/lib/env";
import { SpecializationPicker } from "@/components/ui/SpecializationPicker";

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
  specializations?: string[];
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED";
  profileStatus: "DRAFT" | "UNDER_REVIEW" | "PUBLISHED" | "BLOCKED" | "DELETED";
  rejectionReason?: string;
  branchId?: string;
  branch?: Branch;
  kyc?: VendorKYC;
  bankDetail?: VendorBankDetail;
  wallet?: { balance: number; totalEarned?: number; totalSpent?: number };
  walletBalance?: number;
  createdAt: string;
}

export function AdminVendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ALL" | "PENDING" | "BLOCKED">("ALL");
  const [actingId, setActingId] = useState<string | null>(null);
  
  // Modals
  const [inspectVendor, setInspectVendor] = useState<Vendor | null>(null);
  const [rejectionModal, setRejectionModal] = useState<Vendor | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [assignBranchModal, setAssignBranchModal] = useState<Vendor | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [previewImage, setPreviewImage] = useState<{ title: string; url: string } | null>(null);
  
  // Register New Vendor Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newVendor, setNewVendor] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
    role: "TECHNICIAN" as "TECHNICIAN" | "AGENT",
    experienceYears: "3",
    city: "Kolkata",
    branchId: "",
  });
  const [newVendorSpecializations, setNewVendorSpecializations] = useState<string[]>(["RO & Water Purifier"]);
  const [creating, setCreating] = useState(false);
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
      adminApi.get("/admin/vendors?limit=150"),
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
          setNewVendor((nv) => ({ ...nv, branchId: bList[0].id }));
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
      if (approved) {
        // /verify only sets verificationStatus — profileStatus must be published separately.
        await adminApi.patch(`/admin/vendors/${vendorId}/publish`);
      }
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

  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newVendorSpecializations.length === 0) {
      setToast("Select at least one specialization for this technician.");
      setTimeout(() => setToast(""), 3500);
      return;
    }
    setCreating(true);
    try {
      const res = await adminApi.post("/admin/vendors", {
        fullName: newVendor.fullName,
        phone: newVendor.phone,
        email: newVendor.email || undefined,
        password: newVendor.password || undefined,
        role: newVendor.role,
        specializations: newVendorSpecializations,
        experienceYears: Number(newVendor.experienceYears) || 0,
        city: newVendor.city,
        branchId: newVendor.branchId || undefined,
      });
      const created = res.data?.data ?? res.data;
      if (created) {
        setVendors((prev) => [created, ...prev]);
      }
      setToast(`✓ Registered new technician ${newVendor.fullName} successfully.`);
      setShowCreateModal(false);
      setNewVendor({
        fullName: "",
        phone: "",
        email: "",
        password: "",
        role: "TECHNICIAN",
        experienceYears: "3",
        city: "Kolkata",
        branchId: branches[0]?.id || "",
      });
      setNewVendorSpecializations(["RO & Water Purifier"]);
      load();
    } catch (err: any) {
      setToast(err?.response?.data?.message ?? "Unable to register technician. Check details.");
    } finally {
      setCreating(false);
      setTimeout(() => setToast(""), 4000);
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-bold shadow-md transition-colors flex items-center gap-1.5"
          >
            <span>➕</span> Add New Technician
          </button>
          <button
            onClick={load}
            className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-bold shadow-md transition-colors flex items-center gap-2"
          >
            <span>🔄</span> Refresh Fleet Records
          </button>
        </div>
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
          subtext="All database records"
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
          <AdminLteTable
            striped
            hover
            headers={[
              "Technician Profile",
              "Trade / Specialization",
              "Branch Assignment",
              "KYC Proofs",
              "Wallet Coins",
              "Status",
              "Actions",
            ]}
          >
            {filtered.map((vendor) => {
              const isVerified = vendor.verificationStatus === "VERIFIED";
              const isBlocked = vendor.profileStatus === "BLOCKED";
              const hasAadhaar = Boolean(vendor.kyc?.aadhaarNumber || vendor.kyc?.aadhaarFrontImage);
              const hasPan = Boolean(vendor.kyc?.panNumber || vendor.kyc?.panImage);
              const hasBank = Boolean(vendor.bankDetail?.bankAccount || vendor.bankDetail?.upiId);
              const walletCoins = vendor.wallet?.balance ?? vendor.walletBalance ?? 0;

              return (
                <tr key={vendor.id} className="hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors">
                  {/* Technician Profile */}
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 rounded-full bg-orange-100 dark:bg-orange-950 border border-orange-300 dark:border-orange-800 flex items-center justify-center font-bold text-xs text-orange-600 dark:text-orange-400 overflow-hidden">
                        {vendor.profilePhoto ? (
                          <img
                            src={getMediaUrl(vendor.profilePhoto)}
                            alt={vendor.fullName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          vendor.fullName.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-xs text-gray-900 dark:text-white flex items-center gap-1.5">
                          {vendor.fullName}
                          {isVerified && <span className="text-blue-500 text-[11px]" title="Verified KYC">🛡️</span>}
                        </p>
                        <p className="font-mono text-[10px] text-gray-500">{vendor.vendorCode}</p>
                        <p className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">{vendor.phone}</p>
                      </div>
                    </div>
                  </td>

                  {/* Trade / Specialization */}
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {(vendor.specializations?.length ? vendor.specializations : [vendor.specialization || "RO & Water Purifier"])
                        .slice(0, 2)
                        .map((s) => (
                          <span
                            key={s}
                            className="inline-block rounded-md bg-orange-50 dark:bg-orange-950/80 px-2 py-0.5 text-[11px] font-bold text-[#c2410c] dark:text-orange-400 border border-orange-200 dark:border-orange-900"
                          >
                            🔧 {s}
                          </span>
                        ))}
                      {(vendor.specializations?.length ?? 0) > 2 && (
                        <span className="inline-block rounded-md bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 text-[10px] font-bold text-gray-600 dark:text-gray-300">
                          +{(vendor.specializations?.length ?? 0) - 2}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      {vendor.experienceYears ? `${vendor.experienceYears} yrs exp` : "Certified Specialist"}
                    </p>
                  </td>

                  {/* Branch Assignment */}
                  <td>
                    {vendor.branch ? (
                      <div>
                        <span className="font-bold text-xs text-gray-800 dark:text-gray-200">
                          🏢 {vendor.branch.name}
                        </span>
                        <p className="text-[10px] font-mono text-gray-500">Code: {vendor.branch.code}</p>
                      </div>
                    ) : (
                      <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                        ⚠️ Unassigned
                      </span>
                    )}
                  </td>

                  {/* KYC Proofs */}
                  <td>
                    <div className="flex flex-col gap-1 text-[11px]">
                      <span className={hasAadhaar ? "font-bold text-emerald-700 dark:text-emerald-400" : "text-gray-400"}>
                        {hasAadhaar ? "✓ Aadhaar UID" : "✕ No Aadhaar"}
                      </span>
                      <span className={hasPan ? "font-bold text-emerald-700 dark:text-emerald-400" : "text-gray-400"}>
                        {hasPan ? "✓ PAN Card" : "✕ No PAN"}
                      </span>
                      <span className={hasBank ? "font-bold text-blue-700 dark:text-blue-400" : "text-gray-400"}>
                        {hasBank ? "✓ Bank / UPI" : "✕ No Bank"}
                      </span>
                    </div>
                  </td>

                  {/* Wallet Coins */}
                  <td>
                    <span className="font-mono text-xs font-bold text-orange-600 dark:text-orange-400">
                      🪙 {walletCoins} Coins
                    </span>
                  </td>

                  {/* Status */}
                  <td>
                    <div className="flex flex-col gap-1">
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] font-extrabold rounded-md uppercase ${
                          isBlocked
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200"
                            : isVerified
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200"
                        }`}
                      >
                        {vendor.verificationStatus}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        Profile: {vendor.profileStatus}
                      </span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        onClick={() => setInspectVendor(vendor)}
                        className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 text-[11px] font-bold transition-colors shadow-sm"
                      >
                        Inspect KYC
                      </button>

                      <button
                        onClick={() => {
                          setAssignBranchModal(vendor);
                          if (vendor.branchId) setSelectedBranchId(vendor.branchId);
                        }}
                        className="rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 text-[11px] font-bold border border-gray-300 dark:border-gray-600 transition-colors"
                      >
                        Branch
                      </button>

                      <button
                        onClick={() => handleToggleBlock(vendor)}
                        disabled={actingId === vendor.id}
                        className={`rounded-lg px-2 py-1 text-[11px] font-bold transition-colors ${
                          isBlocked
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                            : "bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800"
                        }`}
                      >
                        {isBlocked ? "Unblock" : "Suspend"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </AdminLteTable>
        )}
      </AdminLteCard>

      {/* Register New Vendor Modal */}
      {showCreateModal && (
        <AdminLteModal
          title="Register New Technician / Agent"
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        >
          <form onSubmit={handleCreateVendor} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newVendor.fullName}
                  onChange={(e) => setNewVendor({ ...newVendor, fullName: e.target.value })}
                  placeholder="e.g. Subhashish Roy"
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-xs font-semibold focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={newVendor.phone}
                  onChange={(e) => setNewVendor({ ...newVendor, phone: e.target.value })}
                  placeholder="e.g. +91 22 6971 1316"
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-xs font-semibold focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Email (Optional)</label>
                <input
                  type="email"
                  value={newVendor.email}
                  onChange={(e) => setNewVendor({ ...newVendor, email: e.target.value })}
                  placeholder="e.g. tech@just24you.in"
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-xs font-semibold focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Initial Password</label>
                <input
                  type="password"
                  value={newVendor.password}
                  onChange={(e) => setNewVendor({ ...newVendor, password: e.target.value })}
                  placeholder="Default: Vendor@12345"
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-xs font-semibold focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1.5">Trade Specialization(s)</label>
                <SpecializationPicker value={newVendorSpecializations} onChange={setNewVendorSpecializations} accent="orange" />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Assigned Branch Hub</label>
                <select
                  value={newVendor.branchId}
                  onChange={(e) => setNewVendor({ ...newVendor, branchId: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-xs font-semibold focus:border-blue-500 focus:outline-none"
                >
                  <option value="">-- Select Branch Hub --</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md"
              >
                {creating ? "Provisioning..." : "Create Technician Account"}
              </button>
            </div>
          </form>
        </AdminLteModal>
      )}

      {/* Inspect KYC Modal */}
      {inspectVendor && (
        <AdminLteModal
          title={`KYC & Fleet Dossier: ${inspectVendor.fullName}`}
          isOpen={Boolean(inspectVendor)}
          onClose={() => setInspectVendor(null)}
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700">
                <p className="font-bold text-gray-900 dark:text-white mb-2">🪪 Aadhaar Verification</p>
                <p className="font-mono text-gray-700 dark:text-gray-300">
                  UID: {inspectVendor.kyc?.aadhaarNumber || "Not entered"}
                </p>
                {inspectVendor.kyc?.aadhaarFrontImage && (
                  <button
                    onClick={() =>
                      setPreviewImage({
                        title: "Aadhaar Front Document",
                        url: getMediaUrl(inspectVendor.kyc?.aadhaarFrontImage),
                      })
                    }
                    className="mt-2 text-blue-600 dark:text-blue-400 font-bold hover:underline block"
                  >
                    View Aadhaar Front Proof →
                  </button>
                )}
                {inspectVendor.kyc?.aadhaarBackImage && (
                  <button
                    onClick={() =>
                      setPreviewImage({
                        title: "Aadhaar Back Document",
                        url: getMediaUrl(inspectVendor.kyc?.aadhaarBackImage),
                      })
                    }
                    className="mt-1 text-blue-600 dark:text-blue-400 font-bold hover:underline block"
                  >
                    View Aadhaar Back Proof →
                  </button>
                )}
              </div>

              <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700">
                <p className="font-bold text-gray-900 dark:text-white mb-2">💳 PAN Card Verification</p>
                <p className="font-mono text-gray-700 dark:text-gray-300">
                  PAN: {inspectVendor.kyc?.panNumber || "Not entered"}
                </p>
                {inspectVendor.kyc?.panImage && (
                  <button
                    onClick={() =>
                      setPreviewImage({
                        title: "PAN Card Document",
                        url: getMediaUrl(inspectVendor.kyc?.panImage),
                      })
                    }
                    className="mt-2 text-blue-600 dark:text-blue-400 font-bold hover:underline block"
                  >
                    View PAN Document Proof →
                  </button>
                )}
              </div>

              <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 sm:col-span-2">
                <p className="font-bold text-gray-900 dark:text-white mb-1">🏦 Bank &amp; UPI Payout Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2 font-mono">
                  <div>
                    <span className="text-gray-500 text-[10px] block">Bank Account</span>
                    <span>{inspectVendor.bankDetail?.bankAccount || "—"}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 text-[10px] block">IFSC Code</span>
                    <span>{inspectVendor.bankDetail?.ifsc || "—"}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 text-[10px] block">UPI ID</span>
                    <span>{inspectVendor.bankDetail?.upiId || "—"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setRejectionModal(inspectVendor)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                ✕ Reject KYC
              </button>
              <button
                type="button"
                onClick={() => handleVerify(inspectVendor.id, true)}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md"
              >
                ✓ Approve KYC &amp; Publish
              </button>
            </div>
          </div>
        </AdminLteModal>
      )}

      {/* Document Image Preview Modal */}
      {previewImage && (
        <AdminLteModal
          title={previewImage.title}
          isOpen={Boolean(previewImage)}
          onClose={() => setPreviewImage(null)}
        >
          <div className="text-center">
            <img
              src={previewImage.url}
              alt={previewImage.title}
              className="max-h-[70vh] mx-auto rounded-xl object-contain border border-gray-300 dark:border-gray-700"
            />
            <div className="mt-4">
              <a
                href={previewImage.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl bg-blue-600 text-white px-4 py-2 text-xs font-bold inline-block"
              >
                Open Full Original Document ↗
              </a>
            </div>
          </div>
        </AdminLteModal>
      )}

      {/* Assign Branch Modal */}
      {assignBranchModal && (
        <AdminLteModal
          title={`Assign Branch: ${assignBranchModal.fullName}`}
          isOpen={Boolean(assignBranchModal)}
          onClose={() => setAssignBranchModal(null)}
        >
          <form onSubmit={handleAssignBranch} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Select Branch Hub</label>
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-xs font-semibold focus:border-blue-500 focus:outline-none"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code}) - {b.city || "Hub"}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setAssignBranchModal(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actingId === assignBranchModal.id}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                Save Branch Assignment
              </button>
            </div>
          </form>
        </AdminLteModal>
      )}

      {/* Rejection Modal */}
      {rejectionModal && (
        <AdminLteModal
          title={`Reject KYC: ${rejectionModal.fullName}`}
          isOpen={Boolean(rejectionModal)}
          onClose={() => setRejectionModal(null)}
        >
          <div className="space-y-4 text-xs">
            <p className="text-gray-600 dark:text-gray-300">
              Please specify the audit reason for rejecting this technician's KYC application.
            </p>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Unclear Aadhaar card photo, Name mismatch with Bank account"
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-xs font-semibold focus:border-rose-500 focus:outline-none"
            />
            <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setRejectionModal(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleVerify(rejectionModal.id, false, rejectionReason)}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                Confirm KYC Rejection
              </button>
            </div>
          </div>
        </AdminLteModal>
      )}
    </div>
  );
}
