import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthShell } from "@/components/layout/AuthShell";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { customerApi, getErrorMessage } from "@/lib/apiClient";
import { useCustomerAuth } from "@/store/authStore";
import type { ApiSuccessBody } from "@/lib/apiClient";

export function CustomerSignupPage() {
  const navigate = useNavigate();
  const setSession = useCustomerAuth((s) => s.setSession);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    securityAnswer: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.phone && !form.email) {
      setError("Enter a phone number or an email address.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    try {
      const res = await customerApi.post<ApiSuccessBody<any>>("/customer/auth/signup", {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone || undefined,
        email: form.email || undefined,
        password: form.password,
        securityAnswer: form.securityAnswer || undefined,
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
      setError(getErrorMessage(err, "Couldn't create your account. Try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell portalName="Customer portal" accent="teal" tagline="Book once. Watch every stage of the job in real time.">
      <h1 className="font-display text-2xl font-semibold text-ink">Create your account</h1>
      <p className="mt-1.5 text-sm text-ink-soft/70">Takes under a minute.</p>

      <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="First name" value={form.firstName} onChange={update("firstName")} required />
          <Input label="Last name" value={form.lastName} onChange={update("lastName")} required />
        </div>
        <Input label="Phone number" placeholder="98765 43210" value={form.phone} onChange={update("phone")} />
        <Input label="Email (optional if phone given)" type="email" placeholder="name@email.com" value={form.email} onChange={update("email")} />
        <Input
          label="Password"
          type="password"
          placeholder="At least 6 characters"
          value={form.password}
          onChange={update("password")}
          required
          minLength={6}
        />
        <Input
          label="Confirm password"
          type="password"
          value={form.confirmPassword}
          onChange={update("confirmPassword")}
          required
        />
        <Input
          label="Security answer (optional)"
          placeholder="e.g. your hometown — used to recover your password"
          value={form.securityAnswer}
          onChange={update("securityAnswer")}
        />
        {error && <p className="text-sm font-medium text-danger">{error}</p>}
        <Button type="submit" accent="teal" loading={loading} fullWidth>
          Create account
        </Button>
      </form>

      <p className="mt-8 text-sm text-ink-soft/70">
        Already have an account?{" "}
        <Link to="/customer/login" className="font-semibold text-teal-deep">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
