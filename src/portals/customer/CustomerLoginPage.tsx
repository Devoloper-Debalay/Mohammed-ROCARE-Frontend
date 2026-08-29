import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthShell } from "@/components/layout/AuthShell";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { customerApi } from "@/lib/apiClient";
import { useCustomerAuth } from "@/store/authStore";
import type { ApiSuccessBody } from "@/lib/apiClient";
import axios from "axios";

type Step = "identify" | "otp";

export function CustomerLoginPage() {
  const navigate = useNavigate();
  const setSession = useCustomerAuth((s) => s.setSession);
  const [step, setStep] = useState<Step>("identify");
  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const sendOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await customerApi.post("/customer/auth/login", { identifier, purpose: "LOGIN" });
      setStep("otp");
    } catch (err) {
      setError(axios.isAxiosError(err) ? err.response?.data?.message ?? "Couldn't send the code. Try again." : "Something went wrong.");
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
        { identifier, code, purpose: "LOGIN" }
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
        {step === "identify" ? "Sign in" : "Enter the code"}
      </h1>
      <p className="mt-1.5 text-sm text-ink-soft/70">
        {step === "identify" ? "We'll text or email you a one-time code." : `Sent to ${identifier}.`}
      </p>

      {step === "identify" ? (
        <form onSubmit={sendOtp} className="mt-6 flex flex-col gap-4">
          <Input
            label="Phone or email"
            placeholder="98765 43210 or name@email.com"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
          />
          {error && <p className="text-sm font-medium text-danger">{error}</p>}
          <Button type="submit" accent="teal" loading={loading} fullWidth>
            Send code
          </Button>
        </form>
      ) : (
        <form onSubmit={verifyOtp} className="mt-6 flex flex-col gap-4">
          <Input
            label="6-digit code"
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={6}
            required
          />
          {error && <p className="text-sm font-medium text-danger">{error}</p>}
          <Button type="submit" accent="teal" loading={loading} fullWidth>
            Verify and continue
          </Button>
          <button type="button" onClick={() => setStep("identify")} className="text-sm font-medium text-ink-soft hover:text-ink">
            Use a different phone or email
          </button>
        </form>
      )}

      <p className="mt-8 text-sm text-ink-soft/70">
        New here?{" "}
        <Link to="/customer/signup" className="font-semibold text-teal-deep">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}
