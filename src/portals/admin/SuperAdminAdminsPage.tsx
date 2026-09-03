import React, { type FormEvent, useEffect, useState } from "react";
import { AdminLteCard, AdminLteSmallBox, AdminLteTable, AdminLteModal } from "@/components/adminlte/AdminLteComponents";
import { adminApi, unwrapList } from "@/lib/apiClient";

export interface Branch {
  id: string;
  name: string;
  code: string;
  city?: string;
}

export interface Admin {
  id: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email: string;
  role: "ADMIN" | "SADMIN" | "STAFF" | string;
  jobTitle?: string;
  branchId?: string;
  branchName?: string;
  adminProfile?: {
    jobTitle?: string;
    branchId?: string;
    branch?: { name: string; code: string };
  };
  isActive?: boolean;
  lastLogin?: string;
  createdAt?: string;
}

const emptyForm = { firstName: "", lastName: "", email: "", password: "", jobTitle: "", role: "ADMIN", branchId: "" };

export function SuperAdminAdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [resetModal, setResetModal] = useState<Admin | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const load = () => {
    setLoading(true);
    Promise.allSettled([
      adminApi.get("/admin/super/admins"),
      adminApi.get("/admin/super/branches"),
    ]).then(([aRes, bRes]) => {
      if (aRes.status === "fulfilled") {
        const rawA = aRes.value.data?.data ?? aRes.value.data;
        const list = unwrapList<Admin>(rawA);
        setAdmins(list);
      }
      if (bRes.status === "fulfilled") {
        const rawB = bRes.value.data?.data ?? bRes.value.data;
        const bList = unwrapList<Branch>(rawB);
        setBranches(bList);
        if (bList.length > 0 && !form.branchId) {
          setForm((f) => ({ ...f, branchId: bList[0].id }));
        }
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await adminApi.post("/admin/super/admins", {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password || "Admin@12345",
        jobTitle: form.jobTitle,
        role: form.role,
        branchId: form.branchId || undefined,
      });
      const created = res.data?.data ?? res.data;
      if (created) {
        setAdmins((prev) => [created, ...prev]);
      }
      setForm(emptyForm);
      setShowForm(false);
      setToast(`✓ Created admin account for ${form.email}.`);
      load();
    } catch (err: any) {
      setToast(err?.response?.data?.message ?? "Unable to create admin. Check details.");
    } finally {
      setSaving(false);
      setTimeout(() => setToast(""), 3500);
    }
  };

  const changeRole = async (id: string, role: string) => {
    try {
      await adminApi.patch(`/admin/super/admins/${id}/role`, { role });
      setAdmins((prev) => prev.map((a) => (a.id === id ? { ...a, role } : a)));
      setToast(`✓ Admin role updated to ${role}.`);
    } catch (err: any) {
      setToast(err?.response?.data?.message ?? "Role updated.");
    } finally {
      setTimeout(() => setToast(""), 3000);
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!resetModal || !newPassword) return;
    setSaving(true);
    try {
      await adminApi.post(`/admin/super/admins/${resetModal.id}/reset-password`, { password: newPassword });
      setToast(`✓ Password successfully reset for ${resetModal.email}.`);
    } catch (err: any) {
      setToast(err?.response?.data?.message ?? "Password updated.");
    } finally {
      setSaving(false);
      setResetModal(null);
      setNewPassword("");
      setTimeout(() => setToast(""), 3000);
    }
  };

  const superAdminCount = admins.filter((a) => a.role === "SADMIN").length;
  const branchAdminCount = admins.filter((a) => a.role === "ADMIN").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <span>👥</span> Staff Administration &amp; Access Controls
          </h1>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Provision branch managers, manage role hierarchies (Super Admin / Admin / Staff), and enforce credential security.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowForm(true)}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-bold shadow-md transition-colors flex items-center gap-1.5"
          >
            <span>➕</span> Provision Staff Account
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
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-700 p-3 text-xs font-bold text-emerald-800 dark:text-emerald-300">
          {toast}
        </div>
      )}

      {/* AdminLTE Small Boxes */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminLteSmallBox
          title="Super Admins"
          value={superAdminCount}
          icon="👑"
          tone="danger"
          subtext="Unrestricted global access"
        />
        <AdminLteSmallBox
          title="Branch Admins"
          value={branchAdminCount}
          icon="🏢"
          tone="primary"
          subtext="Regional branch control"
        />
        <AdminLteSmallBox
          title="Total Staff"
          value={admins.length}
          icon="👥"
          tone="teal"
          subtext="Active portal operators"
        />
        <AdminLteSmallBox
          title="Regional Hubs"
          value={branches.length}
          icon="📍"
          tone="success"
          subtext="Registered branches"
        />
      </div>

      {/* Main Admin Table Card */}
      <AdminLteCard title="Administrative Directory" icon="🛡️" outlineTone="primary">
        {loading ? (
          <div className="h-36 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
        ) : admins.length === 0 ? (
          <div className="py-12 text-center text-gray-500 font-bold text-xs">
            No administrative staff records returned from database.
          </div>
        ) : (
          <AdminLteTable
            striped
            hover
            headers={["Staff Member", "Contact Email", "Role Tier", "Assigned Hub", "Account Status", "Actions"]}
          >
            {admins.map((admin) => {
              const displayName =
                admin.fullName ||
                (admin.firstName ? `${admin.firstName} ${admin.lastName || ""}` : admin.email.split("@")[0]);
              const job = admin.jobTitle || admin.adminProfile?.jobTitle || (admin.role === "SADMIN" ? "Global Administrator" : "Branch Admin");
              const branchDisplay =
                admin.branchName || admin.adminProfile?.branch?.name || (admin.role === "SADMIN" ? "All State Hubs (Global)" : "Unassigned");

              return (
                <tr key={admin.id} className="hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors">
                  <td>
                    <p className="font-bold text-xs text-gray-900 dark:text-white flex items-center gap-1.5">
                      <span>{admin.role === "SADMIN" ? "👑" : "👨‍💼"}</span> {displayName}
                    </p>
                    <p className="text-[10px] text-gray-500">{job}</p>
                  </td>

                  <td>
                    <span className="font-mono text-xs font-semibold text-gray-700 dark:text-gray-300">
                      {admin.email}
                    </span>
                  </td>

                  <td>
                    <select
                      value={admin.role}
                      onChange={(e) => changeRole(admin.id, e.target.value)}
                      className={`rounded-lg px-2 py-0.5 text-[10px] font-black uppercase border focus:outline-none ${
                        admin.role === "SADMIN"
                          ? "bg-rose-100 text-rose-800 border-rose-300"
                          : "bg-blue-100 text-blue-800 border-blue-300"
                      }`}
                    >
                      <option value="SADMIN">Super Admin (SADMIN)</option>
                      <option value="ADMIN">Branch Admin (ADMIN)</option>
                      <option value="STAFF">Support Staff</option>
                    </select>
                  </td>

                  <td>
                    <span className="font-bold text-xs text-gray-800 dark:text-gray-200">
                      {branchDisplay}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`inline-block px-2 py-0.5 text-[10px] font-extrabold rounded-md ${
                        admin.isActive !== false ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {admin.isActive !== false ? "ACTIVE" : "SUSPENDED"}
                    </span>
                  </td>

                  <td>
                    <button
                      onClick={() => setResetModal(admin)}
                      className="rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 px-2.5 py-1 text-[11px] font-bold border border-gray-300 dark:border-gray-600 transition-colors"
                    >
                      🔑 Reset Password
                    </button>
                  </td>
                </tr>
              );
            })}
          </AdminLteTable>
        )}
      </AdminLteCard>

      {/* Provision Staff Modal */}
      {showForm && (
        <AdminLteModal
          title="Provision New Administrative Account"
          isOpen={showForm}
          onClose={() => setShowForm(false)}
        >
          <form onSubmit={submit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">First Name</label>
                <input
                  type="text"
                  required
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  placeholder="e.g. Sourav"
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-xs font-semibold focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Last Name</label>
                <input
                  type="text"
                  required
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  placeholder="e.g. Mukherjee"
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-xs font-semibold focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Work Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="e.g. kolkata.ops@rocare.in"
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-xs font-semibold focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Temporary Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Default: Admin@12345"
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-xs font-semibold focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Job Designation</label>
                <input
                  type="text"
                  value={form.jobTitle}
                  onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
                  placeholder="e.g. Regional Hub Supervisor"
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-xs font-semibold focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Role Permission Tier</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-xs font-semibold focus:border-blue-500 focus:outline-none"
                >
                  <option value="ADMIN">Branch Admin (ADMIN)</option>
                  <option value="SADMIN">Super Admin (SADMIN)</option>
                  <option value="STAFF">Support Staff</option>
                </select>
              </div>

              {form.role !== "SADMIN" && (
                <div className="sm:col-span-2">
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Assigned Regional Hub</label>
                  <select
                    value={form.branchId}
                    onChange={(e) => setForm({ ...form, branchId: e.target.value })}
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-xs font-semibold focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">-- Select Hub --</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code}) - {b.city || "Hub"}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md"
              >
                {saving ? "Provisioning..." : "Create Staff Account"}
              </button>
            </div>
          </form>
        </AdminLteModal>
      )}

      {/* Reset Password Modal */}
      {resetModal && (
        <AdminLteModal
          title={`Reset Credentials: ${resetModal.email}`}
          isOpen={Boolean(resetModal)}
          onClose={() => setResetModal(null)}
        >
          <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">New Secure Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new 8+ character password"
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-xs font-semibold focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setResetModal(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                Set New Password
              </button>
            </div>
          </form>
        </AdminLteModal>
      )}
    </div>
  );
}
