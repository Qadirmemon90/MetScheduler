/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import {
  DatabaseIcon,
  Loader2Icon,
  RefreshCwIcon,
  Trash2Icon,
  ZapIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";

export default function AdminCache() {
  const [cacheStatus, setCacheStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [flushing, setFlushing] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/admin/cache-status");
      setCacheStatus(data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to fetch cache status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleFlush = async () => {
    if (!window.confirm("Are you sure you want to flush all website and API cache?")) return;
    setFlushing(true);
    try {
      await api.post("/api/admin/flush-cache");
      toast.success("Cache successfully purged across all layers!");
      await fetchStatus();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to flush cache");
    } finally {
      setFlushing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <DatabaseIcon className="size-5 text-red-500" />
            Redis & Website Cache Control
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Monitor real-time caching performance, connection health, and purge cache with 1-click
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchStatus}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700"
          >
            <RefreshCwIcon className="size-3.5" />
            Check Health
          </button>

          <button
            onClick={handleFlush}
            disabled={flushing || loading}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-rose-500/20 flex items-center gap-2 transition disabled:opacity-50"
          >
            {flushing ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <Trash2Icon className="size-4" />
            )}
            Flush All Cache
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <Loader2Icon className="size-8 text-red-500 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-400">Pinging cache engine...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Connection Mode */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
              <span className="text-xs text-slate-400 font-medium">Cache Mode</span>
              <div className="flex items-center gap-2">
                <span
                  className={`size-3 rounded-full ${
                    cacheStatus?.connected
                      ? "bg-emerald-500 shadow-sm shadow-emerald-500"
                      : "bg-amber-500"
                  }`}
                />
                <span className="text-lg font-bold text-white capitalize">
                  {cacheStatus?.mode === "redis" ? "Redis (Distributed)" : "In-Memory Store"}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                {cacheStatus?.connected
                  ? "Connected to Redis server. Distributed caching active."
                  : "Redis offline, safely operating with high-speed in-memory TTL caching."}
              </p>
            </div>

            {/* Total Keys */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
              <span className="text-xs text-slate-400 font-medium">Active Cached Keys</span>
              <div className="text-2xl font-extrabold text-white">
                {cacheStatus?.keysCount || 0}
              </div>
              <p className="text-[11px] text-slate-500">
                Cached public settings, user permissions, and rate limit counters
              </p>
            </div>

            {/* Redis Endpoint */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
              <span className="text-xs text-slate-400 font-medium">Redis Host URL</span>
              <div className="text-sm font-mono text-slate-300 truncate">
                {cacheStatus?.url || "redis://127.0.0.1:6379"}
              </div>
              <p className="text-[11px] text-slate-500">
                Configurable via <code className="text-red-400 font-mono">REDIS_URL</code> in .env
              </p>
            </div>
          </div>

          {/* Details & Architecture Info */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ZapIcon className="size-4 text-amber-400" />
              Caching & Rate Limiting Architecture
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-400">
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                <span className="font-semibold text-slate-200">1. Route & Response Caching:</span>
                <p>
                  High-traffic public endpoints like <code className="text-slate-300">/api/site-settings/public</code> and{" "}
                  <code className="text-slate-300">/api/site-settings/policies</code> are cached with TTL. Cache is automatically invalidated whenever you update settings or plans.
                </p>
              </div>

              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                <span className="font-semibold text-slate-200">2. Security & Rate Limiting:</span>
                <p>
                  Brute force protection is enabled on <code className="text-slate-300">/api/auth/login</code> and password reset routes. Excessive requests are throttled with HTTP 429 Too Many Requests.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
