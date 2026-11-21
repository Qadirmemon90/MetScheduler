/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import {
  ArrowLeftIcon,
  EyeIcon,
  EyeOffIcon,
  KeyRoundIcon,
  Loader2Icon,
  LockIcon,
  MailIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

export default function AdminLogin() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);

  // If already logged in as admin, redirect
  useEffect(() => {
    if (user) {
      if (user.role === "admin") {
        navigate("/admin");
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRateLimitError(null);

    if (!email || !password) {
      toast.error("Please provide administrator email and password");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/api/auth/login", { email, password });
      const userData = res.data.user;

      if (userData.role !== "admin") {
        toast.error("Access Denied: This account lacks Super Admin permissions.");
        setLoading(false);
        return;
      }

      login(res.data.token, userData);
      toast.success("Welcome to MetriSolution Super Admin Portal");
      navigate("/admin");
    } catch (err: any) {
      if (err?.response?.status === 429) {
        setRateLimitError(
          err?.response?.data?.message ||
            "Too many failed login attempts. Please wait 15 minutes before retrying.",
        );
      } else {
        toast.error(err?.response?.data?.message || "Invalid administrator credentials");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-red-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Banner */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-gradient-to-br from-red-600 to-rose-700 rounded-2xl shadow-xl shadow-red-600/20 text-white mb-2">
            <ShieldCheckIcon className="size-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            MetriSolution
            <span className="text-xs bg-red-500/20 border border-red-500/40 text-red-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
              Super Admin
            </span>
          </h1>
          <p className="text-xs text-slate-400">
            Platform Infrastructure & Management Authentication
          </p>
        </div>

        {/* Login Box */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-7 shadow-2xl space-y-5">
          {rateLimitError && (
            <div className="p-3.5 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-start gap-2.5">
              <ShieldAlertIcon className="size-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{rateLimitError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Administrator Email
              </label>
              <div className="relative">
                <MailIcon className="size-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@metrisolution.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">Password</label>
                <Link
                  to="/login"
                  className="text-[11px] text-red-400 hover:text-red-300 transition"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <LockIcon className="size-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-10 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-red-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  Authenticating Super Admin...
                </>
              ) : (
                <>
                  <KeyRoundIcon className="size-4" />
                  Sign In to Administration
                </>
              )}
            </button>
          </form>

          <div className="pt-2 border-t border-slate-800/80 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition"
            >
              <ArrowLeftIcon className="size-3.5" /> Back to Customer Portal
            </Link>
          </div>
        </div>

        {/* Security Notice */}
        <p className="text-center text-[11px] text-slate-500">
          This portal is protected by rate limiting, encrypted JWT credentials, and activity audit logging.
        </p>
      </div>
    </div>
  );
}