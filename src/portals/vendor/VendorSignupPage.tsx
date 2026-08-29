import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthShell } from "@/components/layout/AuthShell";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { vendorApi } from "@/lib/apiClient";

type Step = "details" | "otp" | "done";

export function VendorSignupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("details");
  const [role, setRole] = useState<"AGENT" | "TECHNICIAN">("TECHNICIAN");
  const [form, setForm] = useState({ fullName: "", phone: "", email: "", password: "", referralCode: "" });
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const submitDetails = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await vendorApi.post("/vendor/auth/signup", {
        role,
        fullName: form.fullName,
        phone: form.phone,
        email: form.email || undefined,
        password: form.password,
        referralCode: form.referralCode || undefined,
      });
      await vendorApi.post("/vendor/auth/send-otp", { identifier: form.phone, purpose: "SIGNUP" });
      setStep("otp");
    } catch (err) {
      setError(axios.isAxiosError(err) ? err.response?.data?.message ?? "Couldn't create your account." : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await vendorApi.post("/vendor/auth/verify-otp", { identifier: form.phone, code, purpose: "SIGNUP" });
      setStep("done");
    } catch (err) {
      setError(axios.isAxiosError(err) ? err.response?.data?.message ?? "That code didn't work." : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell portalName="Vendor portal" accent="orange" tagline="Accept leads, do the job, get paid — track every step.">
      {step !== "done" && (
        <>
          <h1 className="font-display text-2xl font-semibold text-ink">{step === "details" ? "Join as a vendor" : "Verify your phone"}</h1>
          <p className="mt-1.5 text-sm text-ink-soft/70">
            {step === "details" ? "Agents and technicians both sign up here." : `Code sent to ${form.phone}.`}
          </p>
        </>
      )}

      {step === "details" && (
        <form onSubmit={submitDetails} className="mt-6 flex flex-col gap-4">
          <div className="flex gap-2 rounded-full bg-base p-1">
            {(["TECHNICIAN", "AGENT"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`flex-1 rounded-full py-2 text-sm font-semibold transition-colors ${
                  role === r ? "bg-orange text-white" : "text-ink-soft"
                }`}
              >
                {r === "TECHNICIAN" ? "Technician" : "Agent"}
              </button>
            ))}
          </div>
          <Input label="Full name" value={form.fullName} onChange={update("fullName")} required />
          <Input label="Phone number" placeholder="98765 43210" value={form.phone} onChange={update("phone")} required />
          <Input label="Email (optional)" type="email" value={form.email} onChange={update("email")} />
          <Input label="Password" type="password" value={form.password} onChange={update("password")} minLength={8} required />
          <Input label="Referral code (optional)" value={form.referralCode} onChange={update("referralCode")} />
          {error && <p className="text-sm font-medium text-danger">{error}</p>}
          <Button type="submit" accent="orange" loading={loading} fullWidth>
            Create account
          </Button>
        </form>
      )}

      {step === "otp" && (
        <form onSubmit={verifyOtp} className="mt-6 flex flex-col gap-4">
          <Input label="6-digit code" value={code} onChange={(e) => setCode(e.target.value)} maxLength={6} required />
          {error && <p className="text-sm font-medium text-danger">{error}</p>}
          <Button type="submit" accent="orange" loading={loading} fullWidth>
            Verify phone
          </Button>
        </form>
      )}

      {step === "done" && (
        <div className="mt-6">
          <p className="text-sm text-ink-soft/80">
            Phone verified. Your account now needs admin verification before you can sign in — you'll be notified once it's approved.
          </p>
          <Button accent="orange" className="mt-6" onClick={() => navigate("/vendor/login")}>
            Go to sign in
          </Button>
        </div>
      )}

      {step !== "done" && (
        <p className="mt-8 text-sm text-ink-soft/70">
          Already registered?{" "}
          <Link to="/vendor/login" className="font-semibold text-orange-deep">
            Sign in
          </Link>
        </p>
      )}
    </AuthShell>
  );
}
