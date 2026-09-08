import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthShell } from "@/components/layout/AuthShell";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { vendorApi, getErrorMessage } from "@/lib/apiClient";
import { useVendorAuth, isVendorApproved } from "@/store/authStore";
import type { ApiSuccessBody } from "@/lib/apiClient";

export function VendorSignupPage() {
  const navigate = useNavigate();
  const setSession = useVendorAuth((s) => s.setSession);
  const [done, setDone] = useState(false);
  const [role, setRole] = useState<"AGENT" | "TECHNICIAN">("TECHNICIAN");
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    referralCode: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

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
    } catch (err) {
      setError(getErrorMessage(err, "Couldn't create your account. Try again."));
      setLoading(false);
      return;
    }

    // Sign the vendor straight in — no OTP or manual login step needed. If this
    // leg fails (network hiccup, etc.), the account still exists, so fall back
    // to the "created" screen with a manual sign-in link rather than an error.
    try {
      const loginRes = await vendorApi.post<ApiSuccessBody<any>>("/vendor/auth/login", {
        identifier: form.phone,
        password: form.password,
      });
      const loginData = loginRes.data?.data ?? loginRes.data;
      const token = loginData?.accessToken || loginData?.token;
      const refreshToken = loginData?.refreshToken;
      if (!token) throw new Error("Signed up, but couldn't sign you in automatically.");

      const profileRes = await vendorApi.get<ApiSuccessBody<any>>("/vendor/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const profileData = profileRes.data?.data ?? profileRes.data;
      setSession({ token, refreshToken, user: profileData });
      navigate(isVendorApproved(profileData) ? "/vendor/dashboard" : "/vendor/profile");
    } catch {
      setDone(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell portalName="Vendor portal" accent="orange" tagline="Accept leads, do the job, get paid — track every step.">
      {!done && (
        <>
          <h1 className="font-display text-2xl font-semibold text-ink">Join as a vendor</h1>
          <p className="mt-1.5 text-sm text-ink-soft/70">Agents and technicians both sign up here.</p>

          <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
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
            <Input
              label="Password"
              type="password"
              placeholder="At least 8 characters"
              value={form.password}
              onChange={update("password")}
              minLength={8}
              required
            />
            <Input
              label="Confirm password"
              type="password"
              value={form.confirmPassword}
              onChange={update("confirmPassword")}
              required
            />
            <Input label="Referral code (optional)" value={form.referralCode} onChange={update("referralCode")} />
            {error && <p className="text-sm font-medium text-danger">{error}</p>}
            <Button type="submit" accent="orange" loading={loading} fullWidth>
              Create account
            </Button>
          </form>

          <p className="mt-8 text-sm text-ink-soft/70">
            Already registered?{" "}
            <Link to="/vendor/login" className="font-semibold text-orange-deep">
              Sign in
            </Link>
          </p>
        </>
      )}

      {done && (
        <div className="mt-6">
          <h1 className="font-display text-2xl font-semibold text-ink">Account created</h1>
          <p className="mt-3 text-sm text-ink-soft/80">
            You can sign in right away with your phone/email and password. Your account still needs admin verification
            before you can accept leads or make purchases — you'll be notified once it's approved.
          </p>
          <Button accent="orange" className="mt-6" onClick={() => navigate("/vendor/login")}>
            Go to sign in
          </Button>
        </div>
      )}
    </AuthShell>
  );
}
