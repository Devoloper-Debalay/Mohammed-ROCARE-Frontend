import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { AuthShell } from "@/components/layout/AuthShell";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { customerApi } from "@/lib/apiClient";
import { useCustomerAuth } from "@/store/authStore";
import type { ApiSuccessBody } from "@/lib/apiClient";

type Step = "details" | "otp";

export function CustomerSignupPage() {
  const navigate = useNavigate();
  const setSession = useCustomerAuth((s) => s.setSession);
  const [step, setStep] = useState<Step>("details");
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "", email: "" });
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
      await customerApi.post("/customer/auth/signup", {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        email: form.email || undefined,
      });
      setStep("otp");
    } catch (err) {
      setError(axios.isAxiosError(err) ? err.response?.data?.message ?? "Couldn't create your account. Try again." : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await customerApi.post<ApiSuccessBody<any>>(
        "/customer/auth/verify-otp",
        { identifier: form.phone, code, purpose: "SIGNUP" }
      );
      const rawData = res.data?.data ?? res.data;
      const token = rawData?.accessToken || rawData?.token || (res.data as any)?.accessToken || (res.data as any)?.token;
      const refreshToken = rawData?.refreshToken || (res.data as any)?.refreshToken;
      const user = rawData?.user || rawData?.customer || (res.data as any)?.user || (res.data as any)?.customer;

      if (!token) {
        throw new Error("Invalid response from server: Authentication token missing.");
      }

      setSession({ token, refreshToken, user });
      navigate("/customer/dashboard");
    } catch (err) {
      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.message ?? "That code didn't work. Try again."
          : err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell portalName="Customer portal" accent="teal" tagline="Book once. Watch every stage of the job in real time.">
      <h1 className="font-display text-2xl font-semibold text-ink">
        {step === "details" ? "Create your account" : "Verify your phone"}
      </h1>
      <p className="mt-1.5 text-sm text-ink-soft/70">
        {step === "details" ? "Takes under a minute." : `We sent a code to ${form.phone}.`}
      </p>

      {step === "details" ? (
        <form onSubmit={submitDetails} className="mt-6 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="First name" value={form.firstName} onChange={update("firstName")} required />
            <Input label="Last name" value={form.lastName} onChange={update("lastName")} required />
          </div>
          <Input label="Phone number" placeholder="98765 43210" value={form.phone} onChange={update("phone")} required />
          <Input label="Email (optional)" type="email" placeholder="name@email.com" value={form.email} onChange={update("email")} />
          {error && <p className="text-sm font-medium text-danger">{error}</p>}
          <Button type="submit" accent="teal" loading={loading} fullWidth>
            Create account
          </Button>
        </form>
      ) : (
        <form onSubmit={verifyOtp} className="mt-6 flex flex-col gap-4">
          <Input label="6-digit code" placeholder="123456" value={code} onChange={(e) => setCode(e.target.value)} maxLength={6} required />
          {error && <p className="text-sm font-medium text-danger">{error}</p>}
          <Button type="submit" accent="teal" loading={loading} fullWidth>
            Verify and continue
          </Button>
        </form>
      )}

      <p className="mt-8 text-sm text-ink-soft/70">
        Already have an account?{" "}
        <Link to="/customer/login" className="font-semibold text-teal-deep">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
