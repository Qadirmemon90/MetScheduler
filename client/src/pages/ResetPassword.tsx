/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  KeyRoundIcon,
  Loader2Icon,
  LockIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  const tokenFromUrl = searchParams.get("token") || "";
  const codeFromUrl = searchParams.get("code") || "";

  const [token, setToken] = useState(tokenFromUrl);
  const [code, setCode] = useState(codeFromUrl);
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (tokenFromUrl) setToken(tokenFromUrl);
    if (codeFromUrl) setCode(codeFromUrl);
  }, [tokenFromUrl, codeFromUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const payload: any = { newPassword };
      if (token) payload.token = token;
      if (code) payload.code = code;
      if (email) payload.email = email.trim().toLowerCase();

      const { data } = await api.post("/api/auth/reset-password", payload);

      toast.success("Password reset successfully!");
      setSuccess(true);

      if (data?.user?.token) {
        login(data.user, data.user.token);
        setTimeout(() => navigate("/dashboard"), 1500);
      } else {
        setTimeout(() => navigate("/login"), 1500);
      }
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || err?.message || "Failed to reset password. Link may be expired.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 space-y-6">
          <div className="flex flex-col items-center text-center">
            <Link to="/" className="flex items-center gap-2 mb-2">
              <img src="/logo.svg" alt="Logo" className="size-7" />
              <h1 className="text-2xl font-serif font-bold text-slate-800">Scheduler</h1>
            </Link>
            <h2 className="text-lg font-bold text-slate-900 mt-2">Reset Account Password</h2>
            <p className="text-slate-500 text-xs mt-1">
              Create a new secure password for your MetScheduler account
            </p>
          </div>

          {success ? (
            <div className="p-6 text-center space-y-3 bg-emerald-50 rounded-xl border border-emerald-200">
              <CheckCircle2Icon className="size-10 text-emerald-600 mx-auto" />
              <h3 className="text-base font-bold text-emerald-950">Password Updated!</h3>
              <p className="text-xs text-emerald-800">
                Your password has been changed successfully. Redirecting you to your dashboard...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {!token && !code && (
                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Your Registered Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-red-500"
                  />
                </div>
              )}

              {code && !token && (
                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-red-500 font-mono text-center tracking-widest text-sm"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  New Password (min 6 characters)
                </label>
                <div className="relative">
                  <LockIcon className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <LockIcon className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white rounded-xl text-xs font-semibold shadow-md transition disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2Icon className="size-4 animate-spin" /> Updating Password...
                  </>
                ) : (
                  <>
                    <KeyRoundIcon className="size-4" /> Reset Password Now
                  </>
                )}
              </button>
            </form>
          )}

          <div className="text-center">
            <Link
              to="/login"
              className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 font-medium"
            >
              <ArrowLeftIcon className="size-3" /> Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
