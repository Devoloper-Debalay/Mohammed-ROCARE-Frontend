import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthShell } from "@/components/layout/AuthShell";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { adminApi } from "@/lib/apiClient";
import { useStaffAuth } from "@/store/authStore";
import type { ApiSuccessBody } from "@/lib/apiClient";

export function StaffLoginPage() {
  const navigate = useNavigate();
  const setSession = useStaffAuth((s) => s.setSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await adminApi.post<ApiSuccessBody<any>>("/admin/auth/login", { email, password });
      const rawData = res.data?.data ?? res.data;
      const token = rawData?.accessToken || rawData?.token;
      const user = rawData?.user;
      if (!token) {
        throw new Error("Invalid response from server: Authentication token missing.");
      }
      setSession({ token, user });
      // Same login for ADMIN and SADMIN — each role only ever sees its own nav and routes.
      navigate(user?.role === "SADMIN" ? "/staff/super-admin" : "/staff/dashboard");
    } catch (err) {
      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.message ?? "Couldn't sign you in."
          : err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell portalName="Staff portal" accent="slate" tagline="Branches, vendors and the platform, in one console.">
      <h1 className="font-display text-2xl font-semibold text-ink">Sign in</h1>
      <p className="mt-1.5 text-sm text-ink-soft/70">For admins and super-admins.</p>

      <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="text-sm font-medium text-danger">{error}</p>}
        <Button type="submit" accent="slate" loading={loading} fullWidth>
          Sign in
        </Button>
      </form>
    </AuthShell>
  );
}
