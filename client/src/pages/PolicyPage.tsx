/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeftIcon, FileTextIcon, Loader2Icon } from "lucide-react";
import api from "../api/axios";

export default function PolicyPage() {
  const location = useLocation();
  const [policies, setPolicies] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Determine policy from path
  const path = location.pathname.replace(/^\//, "");
  let policyKey = "privacyPolicy";
  let title = "Privacy Policy";

  if (path === "terms") {
    policyKey = "termsOfService";
    title = "Terms of Service";
  } else if (path === "refund") {
    policyKey = "refundPolicy";
    title = "Refund Policy";
  } else if (path === "cookies") {
    policyKey = "cookiePolicy";
    title = "Cookie Policy";
  }

  useEffect(() => {
    setLoading(true);
    api
      .get("/api/site-settings/policies")
      .then(({ data }) => setPolicies(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [location.pathname]);

  const content = policies?.[policyKey] || "";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.svg" alt="Logo" className="size-6" />
            <span className="font-serif font-bold text-lg text-slate-900">Scheduler</span>
          </Link>

          <div className="flex items-center gap-4 text-xs font-medium">
            <Link to="/privacy" className="text-slate-600 hover:text-slate-900">
              Privacy
            </Link>
            <Link to="/terms" className="text-slate-600 hover:text-slate-900">
              Terms
            </Link>
            <Link to="/refund" className="text-slate-600 hover:text-slate-900">
              Refund
            </Link>
            <Link
              to="/login"
              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg transition"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 mb-6 transition"
        >
          <ArrowLeftIcon className="size-3.5" /> Back to Home
        </Link>

        <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-6 border-b border-slate-100">
            <div className="p-2.5 bg-red-50 text-red-600 rounded-xl">
              <FileTextIcon className="size-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Official MetScheduler Platform Agreement & Policies
              </p>
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center">
              <Loader2Icon className="size-8 text-red-500 animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-400">Loading document...</p>
            </div>
          ) : (
            <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-sans space-y-4">
              {content || (
                <div className="p-4 bg-slate-50 rounded-xl text-slate-500 italic">
                  This policy has not been configured yet.
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
