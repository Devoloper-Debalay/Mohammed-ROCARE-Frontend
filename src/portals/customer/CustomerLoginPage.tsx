import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthShell } from "@/components/layout/AuthShell";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { customerApi, getErrorMessage } from "@/lib/apiClient";
import { useCustomerAuth } from "@/store/authStore";
import type { ApiSuccessBody } from "@/lib/apiClient";

type Mode = "login" | "forgot-identify" | "forgot-reset";

export function CustomerLoginPage() {
  const navigate = useNavigate();
  const setSession = useCustomerAuth((s) => s.setSession);
  const [mode, setMode] = useState<Mode>("login");

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetDone, setResetDone] = useState(false);

  const login = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await customerApi.post<ApiSuccessBody<any>>("/customer/auth/login", {
        identifier,
        password,
      });

      const rawData = res.data?.data ?? res.data;
      const token = rawData?.accessToken || rawData?.token;
      const user = rawData?.customer || rawData?.user;

      if (!token) {
        throw new Error("Invalid response from server: Authentication token missing.");
      }

      setSession({ token, user });
      navigate("/customer/dashboard");
    } catch (err) {
      setError(getErrorMessage(err, "Invalid phone/email or password."));
    } finally {
      setLoading(false);
    }
  };

  const findSecurityQuestion = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await customerApi.get<ApiSuccessBody<any>>("/customer/auth/security-question", {
        params: { identifier },
      });
      const rawData = res.data?.data ?? res.data;
      setSecurityQuestion(rawData?.securityQuestion || "Security question");
      setMode("forgot-reset");
    } catch (err) {
      setError(getErrorMessage(err, "Couldn't find an account with that phone/email."));
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await customerApi.post("/customer/auth/reset-password", {
        identifier,
        securityAnswer,
        newPassword,
      });
      setResetDone(true);
    } catch (err) {
      setError(getErrorMessage(err, "Couldn't reset your password. Try again."));
    } finally {
      setLoading(false);
    }
  };

  const backToLogin = () => {
    setMode("login");
    setError("");
    setPassword("");
    setSecurityAnswer("");
    setNewPassword("");
    setResetDone(false);
  };

  return (
    <AuthShell portalName="Customer portal" accent="teal" tagline="Book once. Watch every stage of the job in real time.">
      {mode === "login" && (
        <>
          <h1 className="font-display text-2xl font-semibold text-ink">Sign in</h1>
          <p className="mt-1.5 text-sm text-ink-soft/70">Welcome back.</p>

          <form onSubmit={login} className="mt-6 flex flex-col gap-4">
            <Input
              label="Phone or email"
              placeholder="98765 43210 or name@email.com"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <p className="text-sm font-medium text-danger">{error}</p>}
            <Button type="submit" accent="teal" loading={loading} fullWidth>
              Sign in
            </Button>
            <button
              type="button"
              onClick={() => {
                setError("");
                setMode("forgot-identify");
              }}
              className="text-sm font-medium text-ink-soft hover:text-ink"
            >
              Forgot password?
            </button>
          </form>
        </>
      )}

      {mode === "forgot-identify" && (
        <>
          <h1 className="font-display text-2xl font-semibold text-ink">Reset your password</h1>
          <p className="mt-1.5 text-sm text-ink-soft/70">Enter the phone or email on your account.</p>

          <form onSubmit={findSecurityQuestion} className="mt-6 flex flex-col gap-4">
            <Input
              label="Phone or email"
              placeholder="98765 43210 or name@email.com"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
            {error && <p className="text-sm font-medium text-danger">{error}</p>}
            <Button type="submit" accent="teal" loading={loading} fullWidth>
              Continue
            </Button>
            <button type="button" onClick={backToLogin} className="text-sm font-medium text-ink-soft hover:text-ink">
              Back to sign in
            </button>
          </form>
        </>
      )}

      {mode === "forgot-reset" && (
        <>
          <h1 className="font-display text-2xl font-semibold text-ink">Answer your security question</h1>
          {resetDone ? (
            <>
              <p className="mt-1.5 text-sm text-ink-soft/70">Your password has been reset. You can sign in now.</p>
              <Button type="button" accent="teal" fullWidth className="mt-6" onClick={backToLogin}>
                Back to sign in
              </Button>
            </>
          ) : (
            <form onSubmit={resetPassword} className="mt-6 flex flex-col gap-4">
              <p className="text-sm text-ink-soft/70">{securityQuestion}</p>
              <Input
                label="Your answer"
                value={securityAnswer}
                onChange={(e) => setSecurityAnswer(e.target.value)}
                required
              />
              <Input
                label="New password"
                type="password"
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
              {error && <p className="text-sm font-medium text-danger">{error}</p>}
              <Button type="submit" accent="teal" loading={loading} fullWidth>
                Reset password
              </Button>
              <button type="button" onClick={backToLogin} className="text-sm font-medium text-ink-soft hover:text-ink">
                Back to sign in
              </button>
            </form>
          )}
        </>
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
