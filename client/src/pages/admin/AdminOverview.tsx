/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import {
  ArrowRightIcon,
  BarChart3Icon,
  CalendarClockIcon,
  CheckCircle2Icon,
  CreditCardIcon,
  GlobeIcon,
  LayersIcon,
  Loader2Icon,
  RefreshCwIcon,
  TrendingUpIcon,
  UsersIcon,
  WalletIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import api from "../../api/axios";

export default function AdminOverview() {
  const [stats, setStats] = useState<any>(null);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, paymentsRes] = await Promise.all([
        api.get("/api/admin/stats"),
        api.get("/api/admin/payments?status=pending"),
      ]);
      setStats(statsRes.data);
      setRecentPayments(paymentsRes.data.slice(0, 5));
    } catch (err: any) {
      console.error("Admin stats fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2Icon className="size-8 text-red-500 animate-spin" />
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Users",
      value: stats?.totalUsers || 0,
      icon: UsersIcon,
      color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
      link: "/admin/users",
    },
    {
      label: "Total Revenue (PKR)",
      value: `Rs ${(stats?.totalRevenuePKR || 0).toLocaleString()}`,
      icon: TrendingUpIcon,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      link: "/admin/payments",
    },
    {
      label: "Pending Approvals",
      value: stats?.pendingPayments || 0,
      icon: WalletIcon,
      color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
      link: "/admin/payments",
      alert: (stats?.pendingPayments || 0) > 0,
    },
    {
      label: "Connected Platforms",
      value: stats?.connectedAccounts || 0,
      icon: GlobeIcon,
      color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
      link: "/admin/accounts",
    },
    {
      label: "Scheduled Posts",
      value: stats?.scheduledPosts || 0,
      icon: CalendarClockIcon,
      color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
      link: "/admin/posts",
    },
    {
      label: "Published Posts",
      value: stats?.publishedPosts || 0,
      icon: CheckCircle2Icon,
      color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
      link: "/admin/posts",
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Platform Command Center</h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time control over Pakistani payments, users, pricing, policies, and scheduler
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={fetchData}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700"
          >
            <RefreshCwIcon className="size-3.5" />
            Refresh
          </button>
          <Link
            to="/admin/payments"
            className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-red-500/20 flex items-center gap-1.5 transition"
          >
            <WalletIcon className="size-3.5" />
            Review Payments
          </Link>
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              to={card.link}
              className={`p-5 rounded-2xl border transition-all hover:scale-[1.01] bg-slate-900/80 border-slate-800 hover:border-slate-700 group block relative ${
                card.alert ? "ring-2 ring-amber-500/50" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">{card.label}</span>
                <div className={`p-2.5 rounded-xl border ${card.color}`}>
                  <Icon className="size-5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-white tracking-tight">
                  {card.value}
                </span>
                <span className="text-xs text-slate-500 group-hover:text-red-400 transition flex items-center gap-1">
                  Manage <ArrowRightIcon className="size-3" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Pending Pakistani Transfers Spotlight */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
              <WalletIcon className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Pending Pakistani Upgrade Requests</h3>
              <p className="text-xs text-slate-400">
                Customers waiting for manual verification with screenshot
              </p>
            </div>
          </div>
          <Link
            to="/admin/payments"
            className="text-xs font-semibold text-red-400 hover:text-red-300 flex items-center gap-1"
          >
            View All ({stats?.pendingPayments || 0}) <ArrowRightIcon className="size-3" />
          </Link>
        </div>

        {recentPayments.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            <CheckCircle2Icon className="size-8 text-emerald-500/60 mx-auto mb-2" />
            No pending payments right now. All customer requests are up to date!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800">
                  <th className="pb-3 font-semibold">User</th>
                  <th className="pb-3 font-semibold">Plan</th>
                  <th className="pb-3 font-semibold">Method</th>
                  <th className="pb-3 font-semibold">Amount</th>
                  <th className="pb-3 font-semibold">TRX ID</th>
                  <th className="pb-3 font-semibold">Submitted</th>
                  <th className="pb-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {recentPayments.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 font-medium text-white">{p.userName}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-500/20 text-red-400 border border-red-500/30">
                        {p.targetPlan}
                      </span>
                    </td>
                    <td className="py-3 capitalize text-slate-300">{p.paymentMethod}</td>
                    <td className="py-3 font-semibold text-emerald-400">PKR {p.amount}</td>
                    <td className="py-3 font-mono text-slate-400">{p.transactionId}</td>
                    <td className="py-3 text-slate-400">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        to="/admin/payments"
                        className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-[11px] font-semibold transition"
                      >
                        Verify
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Fast Control Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/admin/plans"
          className="p-5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl flex items-center gap-4 transition group"
        >
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20 group-hover:scale-110 transition">
            <CreditCardIcon className="size-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Pricing & Plans</h4>
            <p className="text-xs text-slate-400 mt-0.5">Edit prices, limits & features</p>
          </div>
        </Link>

        <Link
          to="/admin/payment-accounts"
          className="p-5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl flex items-center gap-4 transition group"
        >
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 group-hover:scale-110 transition">
            <LayersIcon className="size-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Payment Accounts</h4>
            <p className="text-xs text-slate-400 mt-0.5">Easypaisa, JazzCash, Meezan Bank</p>
          </div>
        </Link>

        <Link
          to="/admin/policies"
          className="p-5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl flex items-center gap-4 transition group"
        >
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20 group-hover:scale-110 transition">
            <BarChart3Icon className="size-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Legal & Policies</h4>
            <p className="text-xs text-slate-400 mt-0.5">Privacy, Terms & Refund policy</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
