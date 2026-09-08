import { useEffect, useState, useMemo, useCallback } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { vendorApi, unwrapList } from "@/lib/apiClient";
import { sfx } from "@/lib/soundEffects";
import { ActionSuccessModal } from "@/components/ui/ActionSuccessModal";
import { KycStatusModal } from "@/components/ui/KycStatusModal";
import { useVendorAuth, isVendorApproved } from "@/store/authStore";

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
  issue?: string;
  status: "NEW" | "ACCEPTED" | "ONGOING" | "PENDING_START_VERIFICATION" | "PENDING_DENIAL_VERIFICATION" | "COMPLETED" | "DENIED" | "CANCELLED" | string;
  leadAcceptanceCharge?: string | number;
  estimatedAmount?: string | number;
  service?: {
    id: string;
    name: string;
    price?: number | string;
  };
  product?: {
    id: string;
    name: string;
    price?: number | string;
  };
  createdAt?: string;
  updatedAt?: string;
}

type FilterTab = "ALL" | "NEW" | "ACCEPTED" | "ONGOING" | "COMPLETED" | "DENIED";

export function VendorLeadsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useVendorAuth();
  const approved = isVendorApproved(user);
  const [showKycModal, setShowKycModal] = useState(false);

  const initialStatus = searchParams.get("status")?.toUpperCase() || "ALL";
  const [activeTab, setActiveTab] = useState<FilterTab>(
    ["ALL", "NEW", "ACCEPTED", "ONGOING", "COMPLETED", "DENIED"].includes(initialStatus)
      ? (initialStatus as FilterTab)
      : "ALL"
  );
  
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [successToast, setSuccessToast] = useState("");
  const [walletBalance, setWalletBalance] = useState<number | string>("0");

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

  // Add Lead Modal State
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [newLeadForm, setNewLeadForm] = useState({
    customerName: "",
    phone: "",
    address: "",
    area: "",
    pincode: "",
    serviceType: "RO Repair & Service",
    estimatedAmount: "600",
    issue: "",
  });

  const fetchLeads = useCallback((silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);

    vendorApi
      .get("/vendor/leads")
      .then((res) => {
        const list = unwrapList<Lead>(res.data?.data ?? res.data);
        setLeads(list);
        setError("");
      })
      .catch((err) => {
        if (!silent) {
          setError(err?.response?.data?.message ?? "Unable to connect to backend leads service.");
          setLeads([]);
        }
      })
      .finally(() => {
        setLoading(false);
        setIsRefreshing(false);
      });
  }, []);

  // Initial load
  useEffect(() => {
    fetchLeads(false);
  }, [fetchLeads]);

  useEffect(() => {
    vendorApi
      .get("/vendor/wallet")
      .then((res) => {
        const wallet = res.data?.data ?? res.data;
        if (wallet?.balance !== undefined) setWalletBalance(wallet.balance);
      })
      .catch(() => {});
  }, []);

  // Realtime Polling every 12 seconds for live lead assignment dispatches
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLeads(true);
    }, 12000);
    return () => clearInterval(interval);
  }, [fetchLeads]);

  // Synchronize state with URL query param if changed from outside
  useEffect(() => {
    const status = searchParams.get("status")?.toUpperCase();
    if (status && ["ALL", "NEW", "ACCEPTED", "ONGOING", "COMPLETED", "DENIED"].includes(status)) {
      setActiveTab(status as FilterTab);
    }
  }, [searchParams]);

  const handleTabChange = (tab: FilterTab) => {
    setActiveTab(tab);
    if (tab === "ALL") {
      searchParams.delete("status");
      setSearchParams(searchParams);
    } else {
      setSearchParams({ status: tab });
    }
  };

  const acceptLead = async (leadId: string, leadCharge: string | number = 50) => {
    if (!approved) {
      setShowKycModal(true);
      return;
    }
    setActingId(leadId);
    setError("");
    try {
      await vendorApi.post(`/vendor/leads/${leadId}/accept`);
      sfx.playAccept();
      setSuccessModal({
        isOpen: true,
        type: "ACCEPT",
        title: "Lead Accepted Successfully! ⚡",
        message: `You have successfully claimed this service job. ${leadCharge} coins deducted from your wallet.`,
        leadId: leadId.slice(0, 8),
        subDetail: "Customer contact phone number and GPS doorstep navigation route unlocked.",
      });
      setSuccessToast(`✓ Lead successfully accepted! ${leadCharge} coins deducted.`);
      setTimeout(() => setSuccessToast(""), 3500);
      fetchLeads(false);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Couldn't accept lead. Please verify your wallet coin balance.");
      setTimeout(() => setError(""), 4000);
    } finally {
      setActingId(null);
    }
  };

  const handleCreateVendorLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approved) {
      setShowAddLeadModal(false);
      setShowKycModal(true);
      return;
    }
    setIsSubmittingLead(true);
    setError("");

    const payload = {
      customerName: newLeadForm.customerName,
      phone: newLeadForm.phone,
      address: newLeadForm.address,
      area: newLeadForm.area || newLeadForm.address,
      pincode: newLeadForm.pincode || undefined,
      serviceType: newLeadForm.serviceType,
      estimatedAmount: Number(newLeadForm.estimatedAmount) || 600,
      issue: newLeadForm.issue || undefined,
    };

    try {
      let createdLead: any = null;
      try {
        const res = await vendorApi.post("/vendor/leads", payload);
        createdLead = res.data?.data ?? res.data;
      } catch {
        try {
          const res = await vendorApi.post("/vendor/leads/create", payload);
          createdLead = res.data?.data ?? res.data;
        } catch {
          const res = await vendorApi.post("/leads", payload);
          createdLead = res.data?.data ?? res.data;
        }
      }

      if (createdLead) {
        setLeads((prev) => [createdLead, ...prev]);
      }
      sfx.playAccept();
      setSuccessModal({
        isOpen: true,
        type: "CREATE",
        title: "Direct Lead Registered! ✨",
        message: "New customer service lead has been created and logged in your active queue.",
        leadId: createdLead?.id ? String(createdLead.id).slice(0, 8) : undefined,
        subDetail: `Customer: ${newLeadForm.customerName} • ${newLeadForm.phone}`,
      });
      setSuccessToast("✓ Direct service lead created and added to your pipeline!");
      setShowAddLeadModal(false);
      setNewLeadForm({
        customerName: "",
        phone: "",
        address: "",
        area: "",
        pincode: "",
        serviceType: "RO Repair & Service",
        estimatedAmount: "600",
        issue: "",
      });
      fetchLeads(true);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to create lead. Please check the fields.");
    } finally {
      setIsSubmittingLead(false);
      setTimeout(() => setSuccessToast(""), 4000);
    }
  };

  // Accurate Tab Counts
  const counts = useMemo(() => {
    const res: Record<FilterTab, number> = {
      ALL: leads.length,
      NEW: 0,
      ACCEPTED: 0,
      ONGOING: 0,
      COMPLETED: 0,
      DENIED: 0,
    };

    leads.forEach((l) => {
      const st = l.status?.toUpperCase() || "NEW";
      if (st === "NEW") res.NEW++;
      else if (st === "ACCEPTED" || st === "PENDING_START_VERIFICATION") res.ACCEPTED++;
      else if (st === "ONGOING" || st === "PENDING_DENIAL_VERIFICATION") res.ONGOING++;
      else if (st === "COMPLETED") res.COMPLETED++;
      else if (st === "DENIED") res.DENIED++;
    });

    return res;
  }, [leads]);

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const st = lead.status?.toUpperCase() || "NEW";
      if (activeTab === "NEW" && st !== "NEW") return false;
      if (activeTab === "ACCEPTED" && st !== "ACCEPTED" && st !== "PENDING_START_VERIFICATION") return false;
      if (activeTab === "ONGOING" && st !== "ONGOING" && st !== "PENDING_DENIAL_VERIFICATION") return false;
      if (activeTab === "COMPLETED" && st !== "COMPLETED") return false;
      if (activeTab === "DENIED" && st !== "DENIED") return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchName = lead.customerName?.toLowerCase().includes(q);
      const matchPhone = lead.phone?.toLowerCase().includes(q);
      const matchAddress = lead.address?.toLowerCase().includes(q) || lead.area?.toLowerCase().includes(q);
      const matchPincode = lead.pincode?.toLowerCase().includes(q);
      const matchIssue =
        lead.issue?.toLowerCase().includes(q) ||
        lead.serviceType?.toLowerCase().includes(q) ||
        lead.service?.name?.toLowerCase().includes(q) ||
        lead.product?.name?.toLowerCase().includes(q);
      const matchId = String(lead.leadCode || lead.id).toLowerCase().includes(q);
      return matchName || matchPhone || matchAddress || matchPincode || matchIssue || matchId;
    });
  }, [leads, activeTab, searchQuery]);

  const getTabTitle = () => {
    switch (activeTab) {
      case "NEW":
        return "New Leads";
      case "ACCEPTED":
        return "Accepted Leads";
      case "ONGOING":
        return "Ongoing Leads";
      case "COMPLETED":
        return "completed Leads";
      case "DENIED":
        return "Denied Leads";
      default:
        return "All Leads";
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      {/* Top Header matching reference */}
      <div className="rounded-2xl bg-gradient-to-r from-[#2196F3] to-[#1E88E5] text-white p-4 sm:p-5 shadow-lg mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/vendor/dashboard")}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white font-extrabold text-xl transition-colors shadow-sm"
            title="Back to Dashboard"
          >
            ←
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight capitalize">
                {getTabTitle()}
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-ping" />
                Live Sync
              </span>
            </div>
            <p className="text-xs text-blue-100 font-medium">
              Showing {filteredLeads.length} of {leads.length} live database leads
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Add Lead Button */}
          <button
            onClick={() => (approved ? setShowAddLeadModal(true) : setShowKycModal(true))}
            className="flex items-center gap-1.5 rounded-xl bg-white text-[#1E88E5] hover:bg-white/90 px-3.5 py-2 text-xs font-black shadow-md transition-all active:scale-95"
            title="Create Direct Service Lead"
          >
            <span>➕</span>
            <span>Add Lead</span>
          </button>
          <button
            onClick={() => fetchLeads(false)}
            disabled={loading || isRefreshing}
            className="rounded-xl bg-white/20 hover:bg-white/30 p-2 text-xs font-bold transition-colors"
            title="Refresh Leads"
          >
            {isRefreshing ? "⏳" : "🔄"}
          </button>
          <Link
            to="/vendor/wallet"
            className="flex items-center gap-1.5 rounded-xl bg-white/20 hover:bg-white/30 px-3 py-1.5 text-xs font-bold transition-colors"
            title="Wallet balance"
          >
            <span>💰</span>
            <span>🪙 {walletBalance} Coins</span>
          </Link>
        </div>
      </div>

      {/* Button-Based Filter Toolbar */}
      <div className="mb-5">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
          Filter Leads by Status:
        </p>
        <div className="flex flex-wrap gap-2">
          {(
            [
              { key: "ALL", label: "All Leads", activeColor: "bg-blue-600 text-white shadow-blue-500/30", textActive: "text-blue-600" },
              { key: "NEW", label: "New Leads", activeColor: "bg-sky-500 text-white shadow-sky-500/30", textActive: "text-sky-600" },
              { key: "ACCEPTED", label: "Accepted Lead", activeColor: "bg-emerald-600 text-white shadow-emerald-500/30", textActive: "text-emerald-600" },
              { key: "ONGOING", label: "Ongoing Lead", activeColor: "bg-amber-500 text-white shadow-amber-500/30", textActive: "text-amber-600" },
              { key: "COMPLETED", label: "Completed Leads", activeColor: "bg-teal-600 text-white shadow-teal-500/30", textActive: "text-teal-600" },
              { key: "DENIED", label: "Denied Leads", activeColor: "bg-rose-600 text-white shadow-rose-500/30", textActive: "text-rose-600" },
            ] as const
          ).map((tab) => {
            const count = counts[tab.key] || 0;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-sm ${
                  isActive
                    ? `${tab.activeColor} scale-105 shadow-md`
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-750 border border-gray-200 dark:border-gray-700"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                    isActive
                      ? `bg-white ${tab.textActive}`
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="mb-6">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            🔍
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search leads by customer name, phone, area, pincode, service or ID..."
            className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 py-2.5 pl-9 pr-4 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Success Toast */}
      {successToast && (
        <div className="mb-4 rounded-xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 p-3 text-xs font-bold text-emerald-800 dark:text-emerald-300 shadow-sm flex items-center justify-between">
          <span>{successToast}</span>
          <button onClick={() => setSuccessToast("")} className="text-xs opacity-60">✕</button>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="mb-4 rounded-xl bg-rose-50 dark:bg-rose-950 border border-rose-300 dark:border-rose-800 p-3 text-xs font-bold text-rose-800 dark:text-rose-300 shadow-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")} className="text-xs opacity-60">✕</button>
        </div>
      )}

      {/* Leads List Rendering */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-44 rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse border border-gray-200 dark:border-gray-700"
            />
          ))}
        </div>
      ) : filteredLeads.length === 0 ? (
        <Card className="p-8 text-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm">
          <p className="text-3xl mb-2">📋</p>
          <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
            No leads found under "{getTabTitle()}"
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {searchQuery
              ? "Try clearing the search query or adjusting your filters."
              : activeTab === "NEW"
              ? "New service dispatches from admin or customer bookings will appear here."
              : "No leads currently under this status filter."}
          </p>
          {searchQuery && (
            <Button
              onClick={() => setSearchQuery("")}
              className="mt-4 text-xs font-bold bg-[#2196F3] text-white"
            >
              Clear Search
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredLeads.map((lead) => {
            const isNew = lead.status === "NEW";
            const isAccepted = lead.status === "ACCEPTED" || lead.status === "PENDING_START_VERIFICATION";
            const isOngoing = lead.status === "ONGOING" || lead.status === "PENDING_DENIAL_VERIFICATION";
            const isCompleted = lead.status === "COMPLETED";
            const isDenied = lead.status === "DENIED";

            const displayId = lead.leadCode || lead.id.slice(0, 8);
            const leadCost =
              lead.leadAcceptanceCharge !== undefined && lead.leadAcceptanceCharge !== null
                ? lead.leadAcceptanceCharge
                : 50;

            // Card Style Variants matching reference images
            const cardBg = isNew
              ? "bg-[#E3F2FD] dark:bg-blue-950/60 border-[#90CAF9] dark:border-blue-800 text-[#0D47A1] dark:text-blue-200"
              : isAccepted
              ? "bg-[#E8F5E9] dark:bg-emerald-950/60 border-[#A5D6A7] dark:border-emerald-800 text-[#1B5E20] dark:text-emerald-200"
              : isOngoing
              ? "bg-[#FFF3E0] dark:bg-amber-950/60 border-[#FFE082] dark:border-amber-800 text-[#E65100] dark:text-amber-200"
              : isCompleted
              ? "bg-[#F1F8E9] dark:bg-teal-950/60 border-[#C5E1A5] dark:border-teal-800 text-[#33691E] dark:text-teal-200"
              : "bg-[#FFEBEE] dark:bg-rose-950/60 border-[#FFCDD2] dark:border-rose-800 text-[#B71C1C] dark:text-rose-200";

            return (
              <div
                key={lead.id}
                className={`rounded-2xl border-2 p-5 shadow-sm transition-all hover:shadow-md ${cardBg}`}
              >
                {/* Header with Name & Status Badge */}
                <div className="flex items-start justify-between gap-2 border-b border-black/10 dark:border-white/15 pb-3">
                  <div>
                    <h3 className="font-black text-base sm:text-lg tracking-tight text-slate-900 dark:text-white">
                      {lead.customerName}
                    </h3>
                    <p className="text-xs font-semibold opacity-85 mt-0.5">
                      📍 {lead.address || lead.area || "Location specified in booking"}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span className="rounded-full bg-white/80 dark:bg-black/40 px-3 py-1 text-[11px] font-black uppercase tracking-wider shadow-sm">
                      {lead.status.replace(/_/g, " ")}
                    </span>
                    {lead.createdAt && (
                      <span className="text-[10px] font-mono opacity-70">
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Details Grid matching reference Image 1 & 2 */}
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold leading-relaxed">
                  <p>
                    <span className="font-normal opacity-85">Phone: </span>
                    <span className="font-mono font-bold">
                      {isNew ? (
                        <span className="text-amber-700 dark:text-amber-300">
                          🔒 Hidden (Accept to unlock)
                        </span>
                      ) : (
                        lead.phone || "N/A"
                      )}
                    </span>
                  </p>

                  <p>
                    <span className="font-normal opacity-85">Customer Issue: </span>
                    <span>{lead.issue || lead.serviceType || "RO Water Purifier Service"}</span>
                  </p>

                  <p>
                    <span className="font-normal opacity-85">Address: </span>
                    <span>{lead.address || lead.area || "Address on record"}</span>
                  </p>

                  <p>
                    <span className="font-normal opacity-85">Service Price: </span>
                    <span className="font-mono font-bold">
                      Rs {lead.estimatedAmount || lead.service?.price || "600"}
                    </span>
                  </p>

                  <p>
                    <span className="font-normal opacity-85">Email: </span>
                    <span className="font-mono">{lead.email || (isNew ? "Masked until accepted" : "N/A")}</span>
                  </p>

                  <p>
                    <span className="font-normal opacity-85">Pincode: </span>
                    <span className="font-mono font-bold">{lead.pincode || (lead.address ? lead.address.match(/\b\d{6}\b/)?.[0] : null) || "N/A"}</span>
                  </p>

                  <p>
                    <span className="font-normal opacity-85">Lead ID: </span>
                    <span className="font-mono font-black">{displayId}</span>
                  </p>
                </div>

                {/* Action Toolbar */}
                <div className="mt-4 pt-3 border-t border-black/10 dark:border-white/15 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs font-bold opacity-80">
                    Service: {lead.serviceType || lead.service?.name || "Doorstep Appliance Service"}
                  </div>

                  <div className="flex items-center gap-2">
                    {isNew ? (
                      <>
                        <button
                          onClick={() => acceptLead(lead.id, leadCost)}
                          disabled={actingId === lead.id}
                          className="rounded-xl bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 text-xs font-black shadow-lg hover:shadow-orange-600/40 transition-all flex items-center gap-1.5"
                        >
                          {actingId === lead.id ? (
                            "Accepting..."
                          ) : (
                            <>
                              <span>⚡ Accept Lead</span>
                              <span className="bg-orange-800/80 rounded-md px-1.5 py-0.5 text-[10px]">
                                {leadCost} Coins
                              </span>
                            </>
                          )}
                        </button>
                        <Link
                          to={`/vendor/leads/${lead.id}`}
                          className="rounded-xl bg-white/80 dark:bg-black/40 hover:bg-white text-gray-900 dark:text-white px-3.5 py-2.5 text-xs font-bold transition-colors"
                        >
                          Details →
                        </Link>
                      </>
                    ) : (
                      <>
                        {lead.phone && (
                          <a
                            href={`tel:${lead.phone}`}
                            className="inline-flex items-center gap-1 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-2 text-xs font-black shadow-md transition-colors"
                          >
                            📞 Call Customer
                          </a>
                        )}
                        <Link
                          to={`/vendor/leads/${lead.id}`}
                          className="inline-flex items-center gap-1 rounded-xl bg-white text-[#1976D2] hover:bg-blue-50 px-4 py-2 text-xs font-black shadow-md transition-colors"
                        >
                          🗺️ Manage Job Details →
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Lead Modal for Technicians */}
      {showAddLeadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-2xl border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800 mb-4">
              <h2 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                <span>➕</span> Create Direct Service Lead
              </h2>
              <button
                onClick={() => setShowAddLeadModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateVendorLead} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newLeadForm.customerName}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, customerName: e.target.value })}
                    placeholder="e.g. Ramesh Ghosh"
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2.5 text-xs font-semibold focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Customer Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={newLeadForm.phone}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, phone: e.target.value })}
                    placeholder="e.g. 9830123456"
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2.5 text-xs font-semibold focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Full Service Address *
                </label>
                <input
                  type="text"
                  required
                  value={newLeadForm.address}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, address: e.target.value })}
                  placeholder="e.g. 14B, Dilip Ganguly Sarani, Dunlop, Kolkata"
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2.5 text-xs font-semibold focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Area / Locality
                  </label>
                  <input
                    type="text"
                    value={newLeadForm.area}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, area: e.target.value })}
                    placeholder="e.g. Dunlop / Behala / Salt Lake"
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2.5 text-xs font-semibold focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Pincode
                  </label>
                  <input
                    type="text"
                    value={newLeadForm.pincode}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, pincode: e.target.value })}
                    placeholder="e.g. 700108"
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2.5 text-xs font-semibold focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Service Type
                  </label>
                  <select
                    value={newLeadForm.serviceType}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, serviceType: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2.5 text-xs font-semibold focus:border-blue-500 focus:outline-none"
                  >
                    <option value="RO Repair & Service">RO Repair &amp; Service</option>
                    <option value="RO Installation">RO Installation &amp; Uninstallation</option>
                    <option value="RO Filter Replacement">Filter &amp; Candle Replacement</option>
                    <option value="RO Membrane Change">RO Membrane &amp; Pump Change</option>
                    <option value="Water Leakage Repair">Water Leakage / TDS Check</option>
                    <option value="Annual Maintenance (AMC)">Comprehensive Annual AMC</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Estimated Price (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newLeadForm.estimatedAmount}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, estimatedAmount: e.target.value })}
                    placeholder="e.g. 600"
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2.5 text-xs font-semibold focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Customer Issue / Remarks
                </label>
                <input
                  type="text"
                  value={newLeadForm.issue}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, issue: e.target.value })}
                  placeholder="e.g. Water taste sour / low flow rate"
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2.5 text-xs font-semibold focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowAddLeadModal(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingLead}
                  className="px-5 py-2 rounded-xl bg-[#2196F3] hover:bg-[#1E88E5] text-white font-bold shadow-md transition-colors"
                >
                  {isSubmittingLead ? "Creating..." : "Create & Claim Lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
    </div>
  );
}
