/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  KeyRoundIcon,
  Loader2Icon,
  LockIcon,
  MailIcon,
  ShieldAlertIcon,
  User2Icon,
  XIcon,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function Login() {
  const [loginState, setLoginState] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);

  // Forgot password modal state
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccessData, setForgotSuccessData] = useState<any | null>(null);

  const navigate = useNavigate();
  const { login, user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setRateLimitError(null);
    try {
      const { data } = await api.post(
        `/api/auth/${loginState ? "login" : "register"}`,
        { name, email, password },
      );

      login(data, data.token);
      navigate("/dashboard");
    } catch (error: any) {
      if (error?.response?.status === 429) {
        const msg =
          error?.response?.data?.message ||
          "Too many login attempts. Please wait 15 minutes before trying again.";
        setRateLimitError(msg);
        toast.error(msg);
      } else {
        toast.error(error.response?.data?.message || error?.message || "Authentication failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      toast.error("Please enter your registered email");
      return;
    }

    setForgotLoading(true);
    try {
      const { data } = await api.post("/api/auth/forgot-password", {
        email: forgotEmail.trim(),
      });
      setForgotSuccessData(data);
      toast.success("Password reset instructions generated!");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to process forgot password");
    } finally {
      setForgotLoading(false);
    }
  };

  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user]);

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          <div className="flex flex-col items-center mb-8">
            <Link to="/" className="flex items-center gap-2">
              <img src="/logo.svg" alt="Logo" className="size-7" />
              <h1 className="text-2xl font-serif font-bold text-slate-800">Scheduler</h1>
            </Link>
            <p className="text-slate-500 text-xs mt-1">
              {loginState ? "Sign in to your MetScheduler Dashboard" : "Create your MetScheduler Account"}
            </p>
          </div>

          {rateLimitError && (
            <div className="mb-5 bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-xl text-xs flex items-start gap-2.5">
              <ShieldAlertIcon className="size-4 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <p className="font-semibold">Security Rate Limit Active:</p>
                <p className="mt-0.5">{rateLimitError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {!loginState && (
              <div>
                <label className="block mb-1.5 font-medium text-slate-700">Name</label>
                <div className="relative">
                  <User2Icon className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-red-500"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block mb-1.5 font-medium text-slate-700">Email Address</label>
              <div className="relative">
                <MailIcon className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="you@company.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-red-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-medium text-slate-700">Password</label>
                {loginState && (
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email);
                      setForgotSuccessData(null);
                      setForgotModalOpen(true);
                    }}
                    className="text-[11px] text-red-600 hover:text-red-700 font-medium"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <LockIcon className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-red-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white rounded-xl text-xs font-semibold shadow-md transition disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  {loginState ? "Signing in..." : "Creating Account..."}
                </>
              ) : (
                <>
                  {loginState ? "Sign In" : "Sign Up"} <ArrowRightIcon className="size-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            {loginState ? (
              <>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => setLoginState(false)}
                  className="text-red-600 hover:text-red-700 font-semibold"
                >
                  Create one free
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setLoginState(true)}
                  className="text-red-600 hover:text-red-700 font-semibold"
                >
                  Sign In
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-[120] bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl max-w-md w-full space-y-4 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setForgotModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"
            >
              <XIcon className="size-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-red-50 text-red-600 rounded-xl">
                <KeyRoundIcon className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Forgot Password</h3>
                <p className="text-xs text-slate-500">
                  Enter your email to receive a password reset code / link
                </p>
              </div>
            </div>

            {forgotSuccessData ? (
              <div className="space-y-4 bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs">
                <div className="flex items-center gap-2 text-emerald-800 font-bold">
                  <CheckCircle2Icon className="size-4 text-emerald-600" />
                  Reset Instructions Generated!
                </div>
                <p className="text-emerald-700">
                  Password reset details have been prepared for{" "}
                  <strong>{forgotEmail}</strong>.
                </p>

                {forgotSuccessData.code && (
                  <div className="bg-white p-3 rounded-lg border border-emerald-200 text-center">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                      Verification Code:
                    </span>
                    <span className="text-xl font-mono font-bold text-slate-900 tracking-widest">
                      {forgotSuccessData.code}
                    </span>
                  </div>
                )}

                <div className="pt-2 flex justify-end gap-2">
                  <Link
                    to={`/reset-password?token=${forgotSuccessData.resetToken || ""}&code=${
                      forgotSuccessData.code || ""
                    }`}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold transition"
                  >
                    Reset Password Now &rarr;
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block mb-1 font-medium text-slate-700">
                    Your Registered Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="you@company.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-red-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(false)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading || !forgotEmail.trim()}
                    className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-semibold transition disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {forgotLoading && <Loader2Icon className="size-3.5 animate-spin" />}
                    Send Reset Instructions
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
