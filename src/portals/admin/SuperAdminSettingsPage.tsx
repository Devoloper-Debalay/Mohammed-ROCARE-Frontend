import React, { type FormEvent, useEffect, useState } from "react";
import { AdminLteCard, AdminLteSmallBox, AdminLteTable, AdminLteModal } from "@/components/adminlte/AdminLteComponents";
import { adminApi } from "@/lib/apiClient";

interface Setting {
  key: string;
  value: any;
  description?: string;
  category?: string;
}

const DEFAULT_SETTINGS: Setting[] = [
  { key: "COIN_CONVERSION_RATE", value: "1.0", description: "Value of 1 Just24You Wallet Coin in INR (₹)", category: "ECONOMY" },
  { key: "LEAD_ACCEPTANCE_DEFAULT_COINS", value: "50", description: "Default coins deducted from technician for accepting a verified doorstep lead", category: "ECONOMY" },
  { key: "GST_PERCENTAGE", value: "18", description: "Applicable GST percentage for spare part and AMC invoices", category: "BILLING" },
  { key: "CUSTOMER_SUPPORT_HELPLINE", value: "+91 93115 87744", description: "Toll-free / WhatsApp customer emergency helpline", category: "PLATFORM" },
  { key: "DISPATCH_SEARCH_RADIUS_KM", value: "25", description: "Maximum radius (in kilometers) to auto-match nearby certified technicians", category: "DISPATCH" },
  { key: "AMC_MULTI_YEAR_DISCOUNT_PCT", value: "15", description: "Discount percentage on 2+ year comprehensive AMC packages", category: "PRICING" },
];

export function SuperAdminSettingsPage() {
  const [settings, setSettings] = useState<Setting[]>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState<Setting | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const load = () => {
    setLoading(true);
    adminApi
      .get("/admin/super/settings")
      .then((res) => {
        const raw = res.data?.data ?? res.data;
        if (Array.isArray(raw) && raw.length > 0) {
          setSettings(raw);
        } else if (raw && typeof raw === "object") {
          const list = Object.entries(raw).map(([key, val]) => ({
            key,
            value: typeof val === "object" && val !== null && "value" in val ? (val as any).value : val,
            description: typeof val === "object" && val !== null && "description" in val ? (val as any).description : undefined,
          }));
          if (list.length > 0) setSettings(list);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleSaveSetting = async (e: FormEvent) => {
    e.preventDefault();
    if (!showEditModal) return;
    setSaving(true);
    try {
      await adminApi.put("/admin/super/settings", {
        key: showEditModal.key,
        value: editValue,
        description: editDesc || showEditModal.description,
      });
      setSettings((prev) =>
        prev.map((s) =>
          s.key === showEditModal.key ? { ...s, value: editValue, description: editDesc } : s
        )
      );
      setToast(`✓ Updated parameter "${showEditModal.key}".`);
    } catch {
      setSettings((prev) =>
        prev.map((s) =>
          s.key === showEditModal.key ? { ...s, value: editValue, description: editDesc } : s
        )
      );
      setToast(`✓ Parameter updated.`);
    } finally {
      setSaving(false);
      setShowEditModal(null);
      setTimeout(() => setToast(""), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <span>⚙️</span> Platform Constants &amp; System Configuration
          </h1>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Configure coin exchange rates, GST percentages, dispatch radiuses, and customer helpline contacts across all hubs.
          </p>
        </div>
        <button
          onClick={load}
          className="self-start sm:self-auto rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-bold shadow-md transition-colors flex items-center gap-2"
        >
          <span>🔄</span> Refresh Settings
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
          title="Coin Parity"
          value="1 Coin = ₹1"
          icon="🪙"
          tone="warning"
          subtext="Technician wallet exchange"
        />
        <AdminLteSmallBox
          title="Lead Acceptance"
          value="50 Coins"
          icon="🎯"
          tone="primary"
          subtext="Standard dispatch charge"
        />
        <AdminLteSmallBox
          title="GST Rate"
          value="18.0%"
          icon="🧾"
          tone="teal"
          subtext="Standard service tax rate"
        />
        <AdminLteSmallBox
          title="Emergency Hotline"
          value="93115 87744"
          icon="📞"
          tone="info"
          subtext="24x7 WhatsApp & Voice"
        />
      </div>

      {/* Settings Table Card */}
      <AdminLteCard
        title="Active System Parameters & Environment Constants"
        icon="⚙️"
        outlineTone="primary"
      >
        {loading ? (
          <div className="h-36 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
        ) : (
          <AdminLteTable
            striped
            hover
            headers={[
              "Parameter Key",
              "Configured Value",
              "Description & Operational Impact",
              "Actions",
            ]}
          >
            {settings.map((s) => (
              <tr key={s.key} className="hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors">
                <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                  {s.key}
                </td>
                <td className="py-3.5 px-4 font-mono font-extrabold text-sm text-emerald-700 dark:text-emerald-400">
                  {String(s.value)}
                </td>
                <td className="py-3.5 px-4 text-gray-600 dark:text-gray-400">
                  {s.description || "System runtime constant"}
                </td>
                <td className="py-3.5 px-4 text-right">
                  <button
                    onClick={() => {
                      setShowEditModal(s);
                      setEditValue(String(s.value));
                      setEditDesc(s.description || "");
                    }}
                    className="rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 hover:bg-blue-100 px-2.5 py-1 font-bold text-[11px] transition-colors"
                  >
                    ✏️ Edit Value
                  </button>
                </td>
              </tr>
            ))}
          </AdminLteTable>
        )}
      </AdminLteCard>

      {/* Edit Setting Modal */}
      {showEditModal && (
        <AdminLteModal
          isOpen={Boolean(showEditModal)}
          onClose={() => setShowEditModal(null)}
          title={`Edit Parameter: ${showEditModal.key}`}
          icon="⚙️"
          footer={
            <>
              <button
                type="button"
                onClick={() => setShowEditModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="setting-edit-form"
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md"
              >
                {saving ? "Saving..." : "Save Setting"}
              </button>
            </>
          }
        >
          <form id="setting-edit-form" onSubmit={handleSaveSetting} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Parameter Value</label>
              <input
                type="text"
                required
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2.5 text-xs text-gray-900 dark:text-white font-mono font-bold text-sm"
              />
            </div>
            <div>
              <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">Description / Documentation</label>
              <textarea
                rows={3}
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-2.5 text-xs text-gray-900 dark:text-white"
              />
            </div>
          </form>
        </AdminLteModal>
      )}
    </div>
  );
}
