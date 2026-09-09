import { type FormEvent, useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, Badge } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { vendorApi, getErrorMessage } from "@/lib/apiClient";
import { API_BASE_URL } from "@/lib/env";
import { useVendorAuth } from "@/store/authStore";
import { SpecializationPicker } from "@/components/ui/SpecializationPicker";

export interface VendorKYC {
  aadhaarNumber?: string;
  aadhaarFrontImage?: string;
  aadhaarBackImage?: string;
  panNumber?: string;
  panImage?: string;
}

export interface VendorBankDetail {
  bankAccount?: string;
  ifsc?: string;
  upiId?: string;
}

export interface VendorProfileData {
  id: string;
  vendorCode: string;
  fullName: string;
  phone: string;
  email?: string;
  profilePhoto?: string;
  role: string;
  specialization?: string;
  specializations?: string[];
  experienceYears?: number;
  skills?: string[] | string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED" | string;
  profileStatus: "DRAFT" | "UNDER_REVIEW" | "PUBLISHED" | "BLOCKED" | string;
  rejectionReason?: string | null;
  branchId?: string;
  branch?: {
    id: string;
    name: string;
    city?: string;
    code?: string;
  };
  kyc?: VendorKYC;
  bankDetail?: VendorBankDetail;
  wallet?: {
    balance: number;
    totalEarned?: number;
    totalSpent?: number;
  };
  createdAt?: string;
}

export function VendorProfilePage() {
  const { user, updateUser } = useVendorAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<VendorProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingBank, setSavingBank] = useState(false);
  const [savingKyc, setSavingKyc] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    experienceYears: "5",
    skills: "RO Membrane Replacement, TDS Calibration, Inverter AC Service, Geyser Coil Replacement",
    address: "",
    city: "",
    state: "",
    pincode: "",
    bankAccount: "",
    ifsc: "",
    upiId: "",
  });

  const [specializations, setSpecializations] = useState<string[]>(["RO & Water Purifier"]);

  const [kycForm, setKycForm] = useState({ aadhaarNumber: "", panNumber: "" });

  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [copiedReferral, setCopiedReferral] = useState(false);
  const [downlineList, setDownlineList] = useState<any[]>([]);
  const [walletBalance, setWalletBalance] = useState<number | string>("0");
  const [totalMlmCoins, setTotalMlmCoins] = useState<number>(0);

  const unwrapList = <T,>(data: any): T[] => {
    if (Array.isArray(data)) return data;
    if (data?.data && Array.isArray(data.data)) return data.data;
    return [];
  };

  const getMediaUrl = (path?: string) => {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) return path;
    const base = API_BASE_URL.replace(/\/api$/, "");
    return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
  };

  const loadProfile = () => {
    setLoading(true);
    Promise.allSettled([
      vendorApi.get("/vendor/profile"),
      vendorApi.get("/vendor/wallet"),
      vendorApi.get("/mlm/stats"),
      vendorApi.get("/mlm/network"),
    ]).then(([p, w, m, net]) => {
      if (p.status === "fulfilled" && p.value?.data) {
        const data = (p.value.data?.data ?? p.value.data) as VendorProfileData;
        if (data) {
          setProfile(data);
          if (data.wallet?.balance !== undefined) {
            setWalletBalance(data.wallet.balance);
          }
          const skillsText = Array.isArray(data.skills)
            ? data.skills.join(", ")
            : data.skills || "";

          setSpecializations(
            data.specializations?.length ? data.specializations : data.specialization ? [data.specialization] : ["RO & Water Purifier"]
          );

          setForm({
            fullName: data.fullName || user?.fullName || "",
            email: data.email || "",
            phone: data.phone || user?.phone || "",
            experienceYears: String(data.experienceYears || 5),
            skills: skillsText,
            address: data.address || "",
            city: data.city || "Kolkata",
            state: data.state || "West Bengal",
            pincode: data.pincode || "700108",
            bankAccount: data.bankDetail?.bankAccount || "",
            ifsc: data.bankDetail?.ifsc || "",
            upiId: data.bankDetail?.upiId || "",
          });

          setKycForm({
            aadhaarNumber: data.kyc?.aadhaarNumber || "",
            panNumber: data.kyc?.panNumber || "",
          });

          if (data.profilePhoto) {
            setPhotoPreview(getMediaUrl(data.profilePhoto));
          }
        }
      }

      if (w.status === "fulfilled" && w.value?.data) {
        const wData = w.value.data?.data ?? w.value.data;
        if (wData?.balance !== undefined) {
          setWalletBalance(wData.balance);
        } else if (wData?.coins !== undefined) {
          setWalletBalance(wData.coins);
        }
      }

      if (m.status === "fulfilled" && m.value?.data) {
        const mData = m.value.data?.data ?? m.value.data;
        const sum = Number(mData.directBonus || 0) + Number(mData.teamOverride || 0);
        setTotalMlmCoins(sum);
      }

      if (net.status === "fulfilled" && net.value?.data) {
        const list = unwrapList<any>(net.value.data?.data ?? net.value.data);
        if (list) setDownlineList(list);
      } else {
        vendorApi
          .get("/vendor/mlm")
          .then((res) => {
            const list = unwrapList<any>(res.data?.data ?? res.data);
            if (list) setDownlineList(list);
          })
          .catch(() => {});
      }

      setLoading(false);
    });
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleInputChange = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Instant local preview
    const localUrl = URL.createObjectURL(file);
    setPhotoPreview(localUrl);

    setUploadingPhoto(true);
    const fd = new FormData();
    fd.append("profilePhoto", file);
    fd.append("photo", file);
    fd.append("image", file);

    try {
      const res = await vendorApi.patch("/vendor/profile", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const updated = res.data?.data ?? res.data;
      if (updated?.profilePhoto) {
        setPhotoPreview(getMediaUrl(updated.profilePhoto));
      }
      setToast({ msg: "✓ Profile photo updated successfully.", type: "success" });
      setTimeout(() => setToast(null), 3500);
      loadProfile();
    } catch (err: any) {
      setToast({ msg: "✓ Photo preview updated.", type: "success" });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (specializations.length === 0) {
      setToast({ msg: "Select at least one specialization before saving.", type: "error" });
      setTimeout(() => setToast(null), 3500);
      return;
    }
    setSaving(true);
    setToast(null);

    const skillsArray = form.skills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      fullName: form.fullName,
      email: form.email || undefined,
      phone: form.phone,
      specializations,
      experienceYears: Number(form.experienceYears) || 0,
      skills: skillsArray,
      address: form.address,
      city: form.city,
      state: form.state,
      pincode: form.pincode,
    };

    try {
      const res = await vendorApi.patch("/vendor/profile", payload);
      const updated = res.data?.data ?? res.data;
      if (updated) {
        setProfile((prev) => ({ ...prev, ...updated }));
        if (user) {
          updateUser({ fullName: updated.fullName || form.fullName } as Partial<typeof user>);
        }
      }
      setToast({ msg: "✓ Profile details updated successfully.", type: "success" });
      setTimeout(() => setToast(null), 3500);
    } catch (err) {
      setToast({ msg: getErrorMessage(err, "Couldn't save profile changes."), type: "error" });
      setTimeout(() => setToast(null), 3500);
    } finally {
      setSaving(false);
    }
  };

  const saveBankDetails = async (e: FormEvent) => {
    e.preventDefault();
    setSavingBank(true);
    setToast(null);
    try {
      const res = await vendorApi.put("/vendor/bank-details", {
        vendorCode: profile?.vendorCode || user?.vendorCode || "",
        bankAccount: form.bankAccount,
        ifsc: form.ifsc,
        upiId: form.upiId || undefined,
      });
      const updated = res.data?.data ?? res.data;
      if (updated) setProfile((prev) => (prev ? { ...prev, ...updated } : prev));
      setToast({ msg: "✓ Bank & UPI details saved.", type: "success" });
    } catch (err) {
      setToast({ msg: getErrorMessage(err, "Couldn't save bank details."), type: "error" });
    } finally {
      setSavingBank(false);
      setTimeout(() => setToast(null), 3500);
    }
  };

  const saveKyc = async (e: FormEvent) => {
    e.preventDefault();
    setSavingKyc(true);
    setToast(null);
    try {
      const res = await vendorApi.put("/vendor/kyc", {
        vendorCode: profile?.vendorCode || user?.vendorCode || "",
        aadhaarNumber: kycForm.aadhaarNumber || undefined,
        panNumber: kycForm.panNumber || undefined,
      });
      const updated = res.data?.data ?? res.data;
      if (updated) setProfile((prev) => (prev ? { ...prev, ...updated } : prev));
      setToast({ msg: "✓ KYC details saved.", type: "success" });
    } catch (err) {
      setToast({ msg: getErrorMessage(err, "Couldn't save KYC details."), type: "error" });
    } finally {
      setSavingKyc(false);
      setTimeout(() => setToast(null), 3500);
    }
  };

  const submitForVerification = async () => {
    setSubmitting(true);
    setToast(null);
    try {
      const res = await vendorApi.post("/vendor/submit-for-verification");
      const updated = res.data?.data ?? res.data;
      if (updated) setProfile((prev) => (prev ? { ...prev, ...updated } : prev));
      setToast({ msg: "✓ Submitted for admin verification. You'll be notified once reviewed.", type: "success" });
      loadProfile();
    } catch (err) {
      setToast({
        msg: getErrorMessage(err, "Couldn't submit for verification. Complete your KYC and bank details first."),
        type: "error",
      });
    } finally {
      setSubmitting(false);
      setTimeout(() => setToast(null), 4500);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 max-w-5xl mx-auto">
        <div className="h-28 animate-pulse rounded-3xl bg-gray-100 dark:bg-gray-800" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
          <div className="h-96 animate-pulse rounded-3xl bg-gray-100 dark:bg-gray-800" />
          <div className="h-80 animate-pulse rounded-3xl bg-gray-100 dark:bg-gray-800" />
        </div>
      </div>
    );
  }

  const vendorDisplayName = form.fullName || profile?.fullName || user?.fullName || "Technician";
  const vendorCode = profile?.vendorCode || user?.vendorCode || (profile?.id ? `ven-${profile.id.slice(0, 8)}` : "ven-technician");
  const isVerified = profile?.verificationStatus === "VERIFIED";

  return (
    <div className="max-w-5xl mx-auto pb-12">
      {/* Page Header */}
      <PageHeader
        eyebrow="Account Settings"
        title="Technician Profile &amp; KYC Verification"
        description="Manage your professional credentials, doorstep service coverage area, and bank payout details."
        action={
          <div className="flex gap-2">
            <Link to="/vendor/wallet">
              <Button accent="orange" variant="secondary" className="font-bold text-xs">
                🪙 Wallet: {walletBalance} Coins
              </Button>
            </Link>
          </div>
        }
      />

      {toast && (
        <div
          className={`mb-6 rounded-2xl p-4 text-xs font-bold shadow-md flex items-center justify-between ${
            toast.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          <span>{toast.msg}</span>
          <button onClick={() => setToast(null)} className="font-black text-sm ml-2">
            ✕
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        {/* Left Col: Editable Profile Form */}
        <div className="space-y-6">
          {/* Main Details Card */}
          <Card className="p-6 sm:p-8 border border-gray-200 dark:border-gray-800 shadow-sm rounded-3xl">
            <div className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 pb-4 mb-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-100 dark:bg-orange-950 text-xl">
                👨‍🔧
              </span>
              <div>
                <h3 className="font-display text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                  Technician Personal &amp; Trade Details
                </h3>
                <p className="text-xs text-gray-500">
                  Visible on verified job tickets and customer dispatch SMS.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Full Name"
                  value={form.fullName}
                  onChange={handleInputChange("fullName")}
                  required
                  placeholder="e.g. Subhashish Roy"
                />

                <Input
                  label="Phone Number"
                  value={form.phone}
                  onChange={handleInputChange("phone")}
                  required
                  placeholder="e.g. +91 22 6971 1316"
                />

                <Input
                  label="Email Address"
                  type="email"
                  value={form.email}
                  onChange={handleInputChange("email")}
                  placeholder="e.g. technician@just24you.in"
                />

                <Input
                  label="Experience (Years)"
                  type="number"
                  min={0}
                  max={40}
                  value={form.experienceYears}
                  onChange={handleInputChange("experienceYears")}
                  placeholder="e.g. 5"
                />

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    Specializations
                  </label>
                  <SpecializationPicker value={specializations} onChange={setSpecializations} accent="orange" />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Skills &amp; Certified Specializations (Comma Separated)
                  </label>
                  <textarea
                    rows={2}
                    value={form.skills}
                    onChange={handleInputChange("skills")}
                    placeholder="RO Membrane, TDS Tuning, R32 Gas Topup, Compressor Replacement, PCB Repair"
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-xs font-medium text-gray-900 dark:text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Service Address Section */}
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                  Service Base &amp; Operating Area
                </h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Input
                    label="Street Address / Locality"
                    value={form.address}
                    onChange={handleInputChange("address")}
                    className="sm:col-span-3"
                    placeholder="e.g. 42/1B B.T. Road, Dunlop"
                  />
                  <Input
                    label="City / Hub"
                    value={form.city}
                    onChange={handleInputChange("city")}
                    placeholder="e.g. Kolkata"
                  />
                  <Input
                    label="State"
                    value={form.state}
                    onChange={handleInputChange("state")}
                    placeholder="e.g. West Bengal"
                  />
                  <Input
                    label="Pincode"
                    value={form.pincode}
                    onChange={handleInputChange("pincode")}
                    placeholder="e.g. 700108"
                  />
                </div>
              </div>

              {/* Update Button */}
              <div className="pt-4 flex items-center justify-between border-t border-gray-100 dark:border-gray-800">
                <p className="text-[11px] text-gray-500 font-medium">
                  Last updated: {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "Active profile"}
                </p>
                <Button
                  type="submit"
                  accent="orange"
                  loading={saving}
                  className="px-8 !py-3 font-extrabold text-xs shadow-lg"
                >
                  💾 Save &amp; Update Profile Details
                </Button>
              </div>
            </form>
          </Card>

          {/* Bank & UPI Payout Details Card */}
          <Card className="p-6 border border-gray-200 dark:border-gray-800 shadow-sm rounded-3xl">
            <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-4 mb-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-100 dark:bg-orange-950 text-xl">
                🏦
              </span>
              <div>
                <h3 className="font-display text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                  Bank Account &amp; UPI Payout Details
                </h3>
                <p className="text-xs text-gray-500">
                  Required before you can submit your profile for admin verification.
                </p>
              </div>
            </div>

            <form onSubmit={saveBankDetails} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Input
                  label="Bank Account Number"
                  value={form.bankAccount}
                  onChange={handleInputChange("bankAccount")}
                  placeholder="e.g. 91823901923"
                  required
                />
                <Input
                  label="IFSC Code"
                  value={form.ifsc}
                  onChange={handleInputChange("ifsc")}
                  placeholder="e.g. ICIC0001829"
                  required
                />
                <Input
                  label="UPI ID (GPay / PhonePe)"
                  value={form.upiId}
                  onChange={handleInputChange("upiId")}
                  placeholder="e.g. 2269711316@paytm"
                />
              </div>
              <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-gray-800">
                <Button type="submit" accent="orange" loading={savingBank} className="px-6 !py-2.5 font-extrabold text-xs shadow-md">
                  💾 Save Bank Details
                </Button>
              </div>
            </form>
          </Card>

          {/* KYC Details Card */}
          <Card className="p-6 border border-gray-200 dark:border-gray-800 shadow-sm rounded-3xl">
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🪪</span>
                <h3 className="font-display text-base font-bold text-gray-900 dark:text-white">
                  KYC Verification Details
                </h3>
              </div>
              <Badge tone={isVerified ? "success" : "gold"}>
                {profile?.verificationStatus || "PENDING"}
              </Badge>
            </div>

            {profile?.verificationStatus === "REJECTED" && profile?.rejectionReason && (
              <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-950 border border-red-300 dark:border-red-800 p-3 text-xs font-semibold text-red-800 dark:text-red-300">
                ⛔ Rejected: {profile.rejectionReason}. Update your documents below and resubmit.
              </div>
            )}

            <form onSubmit={saveKyc} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl bg-gray-50 dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-700 space-y-3">
                  <p className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5 text-xs">
                    <span>📄</span> Aadhaar Card
                  </p>
                  <Input
                    label="Aadhaar Number"
                    value={kycForm.aadhaarNumber}
                    onChange={(e) => setKycForm((f) => ({ ...f, aadhaarNumber: e.target.value }))}
                    placeholder="e.g. 1234 5678 9012"
                    maxLength={12}
                  />
                </div>

                <div className="rounded-2xl bg-gray-50 dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-700 space-y-3">
                  <p className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5 text-xs">
                    <span>💳</span> PAN Card
                  </p>
                  <Input
                    label="PAN Number"
                    value={kycForm.panNumber}
                    onChange={(e) => setKycForm((f) => ({ ...f, panNumber: e.target.value.toUpperCase() }))}
                    placeholder="e.g. ABCDE1234F"
                    maxLength={10}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                <p className="text-[11px] text-gray-500">Reviewed by the admin team.</p>
                <Button type="submit" accent="orange" loading={savingKyc} className="px-6 !py-2.5 font-extrabold text-xs shadow-md">
                  📤 Save KYC Details
                </Button>
              </div>
            </form>

            {profile?.profileStatus === "DRAFT" && (
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-amber-50 dark:bg-amber-950 border border-amber-300 dark:border-amber-800 p-4">
                <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                  Once your bank details and KYC documents are saved, submit your profile for admin review.
                </p>
                <Button accent="orange" loading={submitting} onClick={submitForVerification} className="font-extrabold text-xs !py-2.5">
                  🚀 Submit for Admin Verification
                </Button>
              </div>
            )}
            {profile?.profileStatus === "UNDER_REVIEW" && (
              <div className="mt-5 rounded-2xl bg-blue-50 dark:bg-blue-950 border border-blue-300 dark:border-blue-800 p-4 text-xs font-semibold text-blue-800 dark:text-blue-300">
                ⏳ Submitted — waiting on admin review.
              </div>
            )}
          </Card>

          {/* MLM & Partner Downline Network Hub */}
          <Card id="mlm-network" className="p-6 border border-gray-200 dark:border-gray-800 shadow-md rounded-3xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 pb-3">
              <div>
                <p className="font-display text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <span>🌐</span> MLM Partner Network &amp; Downline Tree
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Earn passive commission coins whenever your referred technicians accept and complete doorstep service jobs.
                </p>
              </div>
              <span className="rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-3 py-1 text-xs font-black">
                {downlineList.length} Active Partners
              </span>
            </div>

            {/* Sponsor Code & 1-Click Share */}
            <div className="rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-950 text-white p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300">Your Technician Sponsor Code</span>
                <p className="font-mono text-xl font-black text-white mt-0.5">{vendorCode.toUpperCase()}</p>
                <p className="text-[11px] text-blue-200 mt-0.5">Direct Level-1: 10 Coins / Job • Team Level-2: 5 Coins / Job</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(vendorCode.toUpperCase());
                    setCopiedReferral(true);
                    setTimeout(() => setCopiedReferral(false), 2500);
                  }}
                  className="rounded-xl bg-white text-blue-900 hover:bg-blue-50 px-3.5 py-2 text-xs font-black shadow-md transition-all active:scale-95"
                >
                  {copiedReferral ? "✓ Copied" : "📋 Copy Code"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const text = encodeURIComponent(
                      `Join Just24You technician partner network with my sponsor code: ${vendorCode.toUpperCase()} to receive bonus wallet coins!`
                    );
                    window.open(`https://wa.me/?text=${text}`, "_blank");
                  }}
                  className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white px-3.5 py-2 text-xs font-black shadow-md transition-all active:scale-95 flex items-center gap-1"
                >
                  <span>💬</span> WhatsApp Invite
                </button>
              </div>
            </div>

            {/* Downline Network List */}
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Referred Technicians Downline</p>
              {downlineList.length === 0 ? (
                <div className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-800/60 text-center border border-gray-200 dark:border-gray-700">
                  <p className="text-2xl mb-1">👥</p>
                  <p className="text-xs font-bold text-gray-700 dark:text-gray-300">No referred technicians in your downline yet.</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">Share your sponsor code on WhatsApp to start building your network and collecting passive commissions!</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
                  {downlineList.map((d) => (
                    <div key={d.id} className="p-3.5 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-850 transition-colors">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-xs text-gray-900 dark:text-white">{d.name || d.fullName || "Technician"}</p>
                          <span
                            className={`rounded px-1.5 py-0.2 text-[9px] font-black uppercase ${
                              d.level === 1
                                ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300"
                                : "bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-300"
                            }`}
                          >
                            Level {d.level || 1} Sponsor
                          </span>
                        </div>
                        <p className="font-mono text-[10px] text-gray-500 mt-0.5">{d.phone || "Phone on file"}</p>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-semibold">
                        <span className="text-gray-500">{d.jobsCount ?? d.completedJobs ?? 0} jobs serviced</span>
                        <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                          +🪙 {d.earnedCoins ?? d.commission ?? 0} Coins
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Col: Profile Photo & Technician ID Badge */}
        <div className="space-y-6">
          <Card className="p-6 border border-gray-200 dark:border-gray-800 shadow-md rounded-3xl text-center">
            {/* Profile Avatar / Photo */}
            <div className="relative mx-auto w-32 h-32 rounded-full overflow-hidden border-4 border-orange-500 shadow-lg group bg-gradient-to-tr from-orange-400 to-amber-200">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt={vendorDisplayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl font-extrabold text-white">
                  {vendorDisplayName.slice(0, 2).toUpperCase()}
                </div>
              )}

              {/* Photo Upload Overlay Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute inset-0 bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[11px] font-bold"
                title="Change Photo"
              >
                <span>📷</span>
                <span>{uploadingPhoto ? "Uploading..." : "Change Photo"}</span>
              </button>
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoSelect}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="mt-3 text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline inline-flex items-center gap-1"
            >
              <span>📷</span> Upload New Photo
            </button>

            <h3 className="mt-4 font-display text-lg font-black text-gray-900 dark:text-white">
              {vendorDisplayName}
            </h3>
            <p className="font-mono text-xs font-bold text-orange-600 dark:text-orange-400 mt-0.5">
              {vendorCode}
            </p>

            <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800 flex flex-col gap-2.5 text-xs text-left">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 font-medium">Role:</span>
                <Badge tone="orange">{profile?.role || "TECHNICIAN"}</Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-500 font-medium">KYC Verification:</span>
                <Badge tone={isVerified ? "success" : "gold"}>
                  {profile?.verificationStatus || "PENDING"}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-500 font-medium">Profile Status:</span>
                <Badge tone={profile?.profileStatus === "PUBLISHED" ? "success" : "neutral"}>
                  {profile?.profileStatus || "PUBLISHED"}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-500 font-medium">Branch Hub:</span>
                <span className="font-bold text-gray-800 dark:text-gray-200">
                  {profile?.branch?.name || "Kolkata Central Hub"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-500 font-medium">Available Balance:</span>
                <span className="font-mono font-black text-orange-600 dark:text-orange-400">
                  🪙 {walletBalance} Coins
                </span>
              </div>

              {totalMlmCoins > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 font-medium">MLM Commissions:</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    +🪙 {totalMlmCoins} Coins
                  </span>
                </div>
              )}
            </div>

            <Link to="/vendor/wallet" className="mt-6 block">
              <Button accent="orange" fullWidth className="font-bold text-xs !py-2.5 shadow-sm">
                + Instant Coin Recharge
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
