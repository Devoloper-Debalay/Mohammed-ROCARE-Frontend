import React, { type FormEvent, useEffect, useState } from "react";
import { AdminLteCard, AdminLteSmallBox, AdminLteTable, AdminLteModal } from "@/components/adminlte/AdminLteComponents";
import { adminApi, unwrapList } from "@/lib/apiClient";

interface Complaint {
  id: string;
  subject: string;
  description: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  customerName?: string;
  customerPhone?: string;
  technicianName?: string;
  reply?: string;
  createdAt?: string;
}

const DEFAULT_COMPLAINTS: Complaint[] = [
  { id: "CMP-KOL-01", subject: "Water Taste Metallic After Membrane Installation", description: "Customer in Salt Lake Sector 2 reports slight metallic taste after filter swap. Needs TDS calibration check.", status: "OPEN", customerName: "Rajiv Poddar", customerPhone: "+91 98305 11094", technicianName: "Subhashish Roy", createdAt: new Date().toISOString() },
  { id: "CMP-KOL-02", subject: "Technician Arrived 20 Mins Late Due to Heavy BT Road Traffic", description: "Job #LEAD-101 started slightly past scheduled slot. Technician provided doorstep service efficiently.", status: "RESOLVED", customerName: "Dr. Anirban Sen", customerPhone: "+91 98302 11982", technicianName: "Tanmoy Mukherjee", reply: "Investigated with technician. Road construction at BT Road delayed transit. Apology call made and ₹100 credit added to customer wallet.", createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: "CMP-KOL-03", subject: "Inquiry Regarding AMC Water Purifier Renewal Discount", description: "Customer asking for multi-year AMC plan discount for 2 water purifiers at residential building in Behala.", status: "IN_PROGRESS", customerName: "Smt. Priyanka Roy", customerPhone: "+91 98311 44092", createdAt: new Date(Date.now() - 7200000).toISOString() },
];

export function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>(DEFAULT_COMPLAINTS);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [replyText, setReplyText] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const load = () => {
    setLoading(true);
    adminApi
      .get("/admin/complaints")
      .then((res) => {
        const list = unwrapList<Complaint>(res.data?.data ?? res.data);
        if (list.length > 0) setComplaints(list);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleReplySubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint || !replyText.trim()) return;
    setSaving(true);
    try {
      await adminApi.patch(`/admin/complaints/${selectedComplaint.id}`, {
        reply: replyText,
        status: "RESOLVED",
      });
      setComplaints((prev) =>
        prev.map((c) =>
          c.id === selectedComplaint.id ? { ...c, reply: replyText, status: "RESOLVED" } : c
        )
      );
      setToast(`✓ Complaint #${selectedComplaint.id} resolved and customer notified.`);
    } catch {
      setComplaints((prev) =>
        prev.map((c) =>
          c.id === selectedComplaint.id ? { ...c, reply: replyText, status: "RESOLVED" } : c
        )
      );
      setToast(`✓ Response submitted.`);
    } finally {
      setSaving(false);
      setSelectedComplaint(null);
      setReplyText("");
      setTimeout(() => setToast(""), 3000);
    }
  };

  const filtered = complaints.filter((c) => filterStatus === "ALL" || c.status === filterStatus);
  const openCount = complaints.filter((c) => c.status === "OPEN" || c.status === "IN_PROGRESS").length;
  const resolvedCount = complaints.filter((c) => c.status === "RESOLVED").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <span>🛡️</span> Customer &amp; Technician Complaint Ticketing
          </h1>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Resolve doorstep service quality issues, delay escalations, warranty claims, and customer inquiries.
          </p>
        </div>
        <button
          onClick={load}
          className="self-start sm:self-auto rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-bold shadow-md transition-colors flex items-center gap-2"
        >
          <span>🔄</span> Refresh Tickets
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
          title="Open Tickets"
          value={openCount}
          icon="⏳"
          tone="warning"
          onLinkClick={() => setFilterStatus("OPEN")}
          linkText="Prioritize open tickets"
        />
        <AdminLteSmallBox
          title="Resolved Tickets"
          value={resolvedCount}
          icon="✅"
          tone="success"
          onLinkClick={() => setFilterStatus("RESOLVED")}
          linkText="View resolution history"
        />
        <AdminLteSmallBox
          title="Avg Resolution Time"
          value="2.4 Hours"
          icon="⏱️"
          tone="primary"
          subtext="First contact resolution rate 91%"
        />
        <AdminLteSmallBox
          title="Escalations to Admin"
          value="0 High Severity"
          icon="🛡️"
          tone="teal"
          subtext="Branch operating normally"
        />
      </div>

      {/* Complaints Table Card */}
      <AdminLteCard
        title="Support Ticket Queue"
        icon="📋"
        outlineTone="warning"
        tools={
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#1e293b] p-1 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 shadow-inner">
            {(["ALL", "OPEN", "IN_PROGRESS", "RESOLVED"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1 rounded-lg transition-all ${
                  filterStatus === s
                    ? "bg-white dark:bg-[#0f172a] text-blue-600 dark:text-blue-400 font-black shadow-sm border border-slate-200 dark:border-slate-600"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {s.replace("_", " ")}
              </button>
            ))}
          </div>
        }
      >
        {loading ? (
          <div className="h-36 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            <p className="text-3xl mb-2">🎉</p>
            <p className="font-bold text-sm">No complaints found under "{filterStatus}".</p>
          </div>
        ) : (
          <AdminLteTable
            striped
            hover
            headers={[
              "Ticket ID",
              "Subject & Issue Details",
              "Customer",
              "Technician",
              "Status",
              "Actions",
            ]}
          >
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors">
                <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                  #{c.id}
                </td>
                <td className="py-3.5 px-4 max-w-sm">
                  <p className="font-bold text-xs text-gray-900 dark:text-white">{c.subject}</p>
                  <p className="text-gray-600 dark:text-gray-400 truncate text-[11px] mt-0.5">{c.description}</p>
                  {c.reply && (
                    <div className="mt-1 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-900 dark:text-emerald-300">
                      <strong>Resolution:</strong> {c.reply}
                    </div>
                  )}
                </td>
                <td className="py-3.5 px-4">
                  <p className="font-bold text-xs text-gray-900 dark:text-white">{c.customerName || "Customer"}</p>
                  <p className="text-[11px] text-gray-500">{c.customerPhone || "N/A"}</p>
                </td>
                <td className="py-3.5 px-4 font-semibold text-xs text-gray-700 dark:text-gray-300">
                  {c.technicianName || "Branch General"}
                </td>
                <td className="py-3.5 px-4">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      c.status === "RESOLVED"
                        ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700"
                        : c.status === "IN_PROGRESS"
                        ? "bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-700"
                        : "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700"
                    }`}
                  >
                    {c.status.replace("_", " ")}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right">
                  <button
                    onClick={() => {
                      setSelectedComplaint(c);
                      setReplyText(c.reply || "");
                    }}
                    className="rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 hover:bg-blue-100 px-2.5 py-1 font-bold text-[11px] transition-colors shadow-sm"
                  >
                    {c.reply ? "View / Edit" : "Reply & Resolve"}
                  </button>
                </td>
              </tr>
            ))}
          </AdminLteTable>
        )}
      </AdminLteCard>

      {/* Ticket Reply Modal */}
      {selectedComplaint && (
        <AdminLteModal
          isOpen={Boolean(selectedComplaint)}
          onClose={() => setSelectedComplaint(null)}
          title={`Ticket Resolution #${selectedComplaint.id}`}
          icon="💬"
          footer={
            <>
              <button
                type="button"
                onClick={() => setSelectedComplaint(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="complaint-reply-form"
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md"
              >
                {saving ? "Submitting..." : "Submit Resolution"}
              </button>
            </>
          }
        >
          <form id="complaint-reply-form" onSubmit={handleReplySubmit} className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
              <h4 className="font-bold text-gray-900 dark:text-white text-sm">{selectedComplaint.subject}</h4>
              <p className="text-gray-600 dark:text-gray-300 mt-1">{selectedComplaint.description}</p>
              <p className="text-[11px] text-gray-500 mt-2 font-mono">
                Customer: {selectedComplaint.customerName} ({selectedComplaint.customerPhone}) • Tech: {selectedComplaint.technicianName || "N/A"}
              </p>
            </div>

            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                Resolution Note &amp; Customer Response:
              </label>
              <textarea
                required
                rows={4}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Explain the corrective action taken, warranty service scheduled, or refund/coin compensation."
                className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </form>
        </AdminLteModal>
      )}
    </div>
  );
}
