import { type FormEvent, useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, Badge } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { vendorApi } from "@/lib/apiClient";

export function VendorProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [form, setForm] = useState({ city: "", state: "", pincode: "", address: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    vendorApi
      .get("/vendor/profile")
      .then((res) => {
        const data = res.data?.data;
        setProfile(data);
        setForm({ city: data?.city ?? "", state: data?.state ?? "", pincode: data?.pincode ?? "", address: data?.address ?? "" });
      })
      .finally(() => setLoading(false));
  }, []);

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await vendorApi.patch("/vendor/profile", form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="h-64 animate-pulse rounded-card bg-ink/[0.04]" />;

  return (
    <div>
      <PageHeader eyebrow="Account" title="Profile & KYC" description="Keep your service area up to date." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="p-6">
          <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Address" value={form.address} onChange={update("address")} className="sm:col-span-2" />
            <Input label="City" value={form.city} onChange={update("city")} />
            <Input label="State" value={form.state} onChange={update("state")} />
            <Input label="Pincode" value={form.pincode} onChange={update("pincode")} />
            {saved && <p className="text-sm font-medium text-success sm:col-span-2">Profile updated.</p>}
            <div className="sm:col-span-2">
              <Button type="submit" accent="orange" loading={saving}>
                Save changes
              </Button>
            </div>
          </form>
        </Card>

        <Card className="h-fit p-5">
          <p className="font-display text-lg font-semibold text-ink">{profile?.fullName}</p>
          <p className="text-sm text-ink-soft/60">{profile?.vendorCode}</p>
          <div className="mt-4 flex flex-col gap-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-ink-soft/70">Role</span>
              <Badge tone="orange">{profile?.role}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink-soft/70">Verification</span>
              <Badge tone={profile?.verificationStatus === "VERIFIED" ? "success" : "gold"}>{profile?.verificationStatus}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink-soft/70">Profile status</span>
              <Badge tone="neutral">{profile?.profileStatus}</Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
