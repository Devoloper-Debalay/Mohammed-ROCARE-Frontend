import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthShell } from "@/components/layout/AuthShell";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { vendorApi } from "@/lib/apiClient";
import { useVendorAuth } from "@/store/authStore";
import type { ApiSuccessBody } from "@/lib/apiClient";

export function VendorLoginPage() {
  const navigate = useNavigate();
  const setSession = useVendorAuth((s) => s.setSession);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await vendorApi.post<ApiSuccessBody<any>>(
        "/vendor/auth/login",
        { identifier, password }
      );
      const rawData = res.data?.data ?? res.data;
      const token = rawData?.accessToken || rawData?.token;
      const refreshToken = rawData?.refreshToken;
      if (!token) {
        throw new Error("Invalid response from server: Authentication token missing.");
      }
      // Login only returns tokens + id — fetch the full profile to populate the session.
      const profileRes = await axios.get<ApiSuccessBody<any>>(`${vendorApi.defaults.baseURL}/vendor/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const profileData = profileRes.data?.data ?? profileRes.data;
      setSession({ token, refreshToken, user: profileData });
      navigate("/vendor/dashboard");
    } catch (err) {
      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.message ?? "Couldn't sign you in. Check your details."
          : err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell portalName="Vendor portal" accent="orange" tagline="Accept leads, do the job, get paid — track every step.">
      <h1 className="font-display text-2xl font-semibold text-ink">Sign in</h1>
      <p className="mt-1.5 text-sm text-ink-soft/70">Use your phone or email and password.</p>

      <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
        <Input label="Phone or email" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
        <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="text-sm font-medium text-danger">{error}</p>}
        <div className="flex items-center justify-between text-sm">
          <Link to="/vendor/forgot-password" className="font-medium text-ink-soft hover:text-ink">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" accent="orange" loading={loading} fullWidth>
          Sign in
        </Button>
      </form>

      <p className="mt-8 text-sm text-ink-soft/70">
        New vendor or technician?{" "}
        <Link to="/vendor/signup" className="font-semibold text-orange-deep">
          Sign up
        </Link>
      </p>
    </AuthShell>
  );
}
