import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import type { Role } from "../types";

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login, register, verifyRegistrationOtp, resendRegistrationOtp, loading, resetLoading } = useAuthStore();

  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [awaitingOtp, setAwaitingOtp] = useState(false);
  const [role, setRole] = useState<Role>("DOCTOR");

  useEffect(() => {
    resetLoading();
  }, [resetLoading]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();

    try {
      if (isRegister) {
        if (awaitingOtp) {
          await verifyRegistrationOtp(pendingEmail, otp);
          toast.success("Email verified. Wait for admin approval before login.");
          setIsRegister(false);
          setAwaitingOtp(false);
          setOtp("");
          setPassword("");
          setName("");
          setEmail(pendingEmail);
          return;
        }

        const result = await register({ name, email, password, role });
        setPendingEmail(result.email);
        setAwaitingOtp(true);
        if (result.otpPreview) {
          toast.success(`OTP sent. Dev OTP: ${result.otpPreview}`);
        } else {
          toast.success("OTP sent to your email.");
        }
        return;
      }

      await login(email, password, role);
      toast.success("Welcome back");
      if (role === "DOCTOR") {
        navigate("/doctor-dashboard");
      } else if (role === "TECHNICIAN") {
        navigate("/lab-dashboard");
      } else {
        navigate("/admin/dashboard");
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Authentication failed");
      resetLoading();
    }
  };

  const roleOptions: Array<{ value: Role; label: string }> = [
    { value: "DOCTOR", label: "Doctor" },
    { value: "TECHNICIAN", label: "Lab" },
    { value: "ADMIN", label: "Admin" }
  ];

  const isBusy = loading;

  return (
    <div className="min-h-screen bg-[#f7fbff]">
      <div className="grid min-h-screen w-full overflow-hidden bg-white lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative flex items-center overflow-hidden bg-[linear-gradient(135deg,#eff6ff_0%,#f8fbff_42%,#ffffff_100%)] p-8 md:p-10 lg:p-12">
          <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-blue-200/40 blur-3xl" />
          <div className="absolute bottom-10 right-0 h-64 w-64 rounded-full bg-sky-100/70 blur-3xl" />
          <div className="absolute left-16 top-20 h-3 w-3 rounded-full bg-blue-300/80" />
          <div className="absolute left-28 top-28 h-2 w-2 rounded-full bg-blue-200" />
          <div className="absolute right-20 top-20 h-4 w-4 rounded-full bg-sky-300/70" />

          <div className="relative z-10 mx-auto max-w-xl">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/30">
                <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8" aria-hidden="true">
                  <path d="M5 20h14M7 20V9l5-5 5 5v11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M8.5 12h7M12 8.5v7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold tracking-tight text-slate-800">LAB MANAGEMENT</p>
                <p className="-mt-1 text-sm font-semibold tracking-[0.28em] text-slate-500">SYSTEM</p>
              </div>
            </div>

            <h1 className="max-w-lg text-4xl font-semibold leading-tight text-slate-800 md:text-5xl">Welcome to Lab Management System</h1>
            <p className="mt-4 max-w-md text-lg text-slate-500">Sign in to access your account.</p>

            <div className="mt-10 grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                <p className="text-sm font-semibold text-slate-500">Connected workflows</p>
                <p className="mt-2 text-2xl font-bold text-slate-800">Doctor, Lab, Admin</p>
                <p className="mt-1 text-sm text-slate-500">Secure role-based access for each team.</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                <p className="text-sm font-semibold text-slate-500">Live system state</p>
                <p className="mt-2 text-2xl font-bold text-slate-800">Real-time</p>
                <p className="mt-1 text-sm text-slate-500">Instant updates across requests and reports.</p>
              </div>
            </div>

            <div className="mt-8 grid max-w-lg gap-4 rounded-[1.75rem] border border-sky-100 bg-white p-5 shadow-[0_12px_40px_rgba(37,99,235,0.10)] backdrop-blur-sm md:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-2xl bg-sky-50 p-4">
                <div className="flex items-end gap-3">
                  <div className="h-24 w-16 rounded-t-[28px] bg-blue-500/85 shadow-[0_12px_30px_rgba(37,99,235,0.25)]" />
                  <div className="h-32 w-20 rounded-t-[32px] bg-slate-800/90 shadow-[0_12px_30px_rgba(15,23,42,0.18)]" />
                  <div className="h-20 w-14 rounded-t-[24px] bg-blue-200" />
                </div>
                <div className="mt-4 h-3 rounded-full bg-sky-100" />
                <div className="mt-3 h-2 w-5/6 rounded-full bg-sky-100" />
              </div>
              <div className="flex flex-col justify-between rounded-2xl bg-white p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-blue-500" />
                    <p className="text-sm font-semibold text-slate-700">Secure login</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-emerald-500" />
                    <p className="text-sm font-semibold text-slate-700">Real-time system</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-sky-500" />
                    <p className="text-sm font-semibold text-slate-700">OTP email verification</p>
                  </div>
                </div>
                <p className="mt-4 text-xs leading-5 text-slate-500">Modern, responsive access for your lab operations with admin approval and secure onboarding.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center bg-white p-6 md:p-10 lg:p-12">
          <div className="w-full max-w-md rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.12)] md:p-8">
            <h2 className="text-3xl font-semibold text-slate-800">{isRegister ? "Create account" : "Welcome back"}</h2>
            <p className="mt-2 text-sm text-slate-500">
              {isRegister
                ? awaitingOtp
                  ? "Enter the verification code sent to your email."
                  : "Register your account to begin." 
                : "Sign in to continue to your dashboard."}
            </p>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-1.5">
              <div className="grid grid-cols-3 gap-1">
                {roleOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setRole(option.value)}
                    className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                      role === option.value
                        ? "bg-white text-blue-700 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              {isRegister && !awaitingOtp && (
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
                      <path d="M10 9.3a3 3 0 1 0-3-3 3 3 0 0 0 3 3z" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M4.5 17a5.5 5.5 0 0 1 11 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    placeholder="Username"
                    required
                  />
                </div>
              )}

              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
                    <path d="M2.8 5.8A1.8 1.8 0 0 1 4.6 4h10.8a1.8 1.8 0 0 1 1.8 1.8v8.4a1.8 1.8 0 0 1-1.8 1.8H4.6a1.8 1.8 0 0 1-1.8-1.8V5.8z" stroke="currentColor" strokeWidth="1.4" />
                    <path d="m3.4 6 6 4.3a1 1 0 0 0 1.2 0l6-4.3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                </span>
                <input
                  type="email"
                  value={awaitingOtp ? pendingEmail : email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={awaitingOtp}
                  className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50"
                  placeholder="Email"
                  required
                />
              </div>

              {!awaitingOtp ? (
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
                      <rect x="3.5" y="9" width="13" height="7.5" rx="1.7" stroke="currentColor" strokeWidth="1.4" />
                      <path d="M6.7 9V7.2a3.3 3.3 0 1 1 6.6 0V9" stroke="currentColor" strokeWidth="1.4" />
                    </svg>
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    placeholder="Password"
                    required
                  />
                </div>
              ) : (
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  placeholder="Enter 6-digit OTP"
                  inputMode="numeric"
                  maxLength={6}
                  required
                />
              )}

              {!awaitingOtp && !isRegister && (
                <div className="flex items-center justify-between gap-3 text-sm">
                  <label className="flex items-center gap-2 text-slate-600">
                    <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    Remember me
                  </label>
                  <button type="button" className="font-medium text-blue-700 transition hover:text-blue-600">
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={isBusy}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(37,99,235,0.25)] transition duration-200 hover:scale-[1.01] hover:bg-blue-500 hover:shadow-[0_18px_34px_rgba(37,99,235,0.32)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isBusy && <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white" />}
                {isBusy ? "Please wait..." : isRegister ? (awaitingOtp ? "Verify OTP" : "Create Account") : "Login"}
              </button>
            </form>

            {isRegister && awaitingOtp && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    const result = await resendRegistrationOtp(pendingEmail);
                    if (result.otpPreview) {
                      toast.success(`New OTP sent. Dev OTP: ${result.otpPreview}`);
                    } else {
                      toast.success("New OTP sent to your email.");
                    }
                  } catch (error: any) {
                    toast.error(error?.response?.data?.message || "Failed to resend OTP");
                  }
                }}
                className="mt-3 text-sm font-medium text-blue-700 transition hover:text-blue-600"
              >
                Resend OTP
              </button>
            )}

            <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-200 pt-5 text-sm">
              <button
                type="button"
                onClick={() => {
                  setIsRegister((prev) => !prev);
                  setAwaitingOtp(false);
                  setOtp("");
                }}
                className="font-medium text-slate-600 transition hover:text-slate-900"
              >
                {isRegister ? "Already have an account? Login" : "Need an account? Register"}
              </button>
              <div className="text-right text-xs leading-5 text-slate-500">
                <p>Secure login</p>
                <p>Contact Admin after OTP verification</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
