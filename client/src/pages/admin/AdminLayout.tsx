/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  BarChart3Icon,
  Building2Icon,
  CalendarClockIcon,
  CreditCardIcon,
  DatabaseIcon,
  FileTextIcon,
  GaugeIcon,
  GlobeIcon,
  KeyRoundIcon,
  LayersIcon,
  LogOutIcon,
  MenuIcon,
  ReceiptIcon,
  RefreshCwIcon,
  ServerIcon,
  ShieldCheckIcon,
  UsersIcon,
  WalletIcon,
  XIcon,
} from "lucide-react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0);
  const [cacheStatus, setCacheStatus] = useState<any>(null);
  const [flushingCache, setFlushingCache] = useState(false);

  // Quick stats poll for badges
  const fetchAdminBadges = async () => {
    try {
      const [statsRes, cacheRes] = await Promise.all([
        api.get("/api/admin/stats"),
        api.get("/api/admin/cache-status"),
      ]);
      setPendingPaymentsCount(statsRes.data?.pendingPayments || 0);
      setCacheStatus(cacheRes.data);
    } catch {
      // Ignored if unauthorized
    }
  };

  useEffect(() => {
    fetchAdminBadges();
    const interval = setInterval(fetchAdminBadges, 30000); // 30s poll
    return () => clearInterval(interval);
  }, []);

  const handleFlushCache = async () => {
    setFlushingCache(true);
    try {
      await api.post("/api/admin/flush-cache");
      await fetchAdminBadges();
    } catch (err: any) {
      console.error("Flush cache error:", err);
    } finally {
      setFlushingCache(false);
    }
  };

  if (user && user.role !== "admin") {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-md text-center text-white space-y-4 shadow-2xl">
          <AlertCircleIcon className="size-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold">Admin Portal Access Restricted</h2>
          <p className="text-sm text-slate-400">
            You must be an authorized Administrator to access this control portal.
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-semibold transition"
          >
            <ArrowLeftIcon className="size-4" /> Return to User Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const navGroups = [
    {
      group: "Core",
      items: [
        { label: "Overview", icon: GaugeIcon, path: "/admin" },
        {
          label: "Payment Approvals",
          icon: WalletIcon,
          path: "/admin/payments",
          badge: pendingPaymentsCount > 0 ? pendingPaymentsCount : undefined,
        },
      ],
    },
    {
      group: "Plans & Payments",
      items: [
        { label: "Pricing & Plans", icon: CreditCardIcon, path: "/admin/plans" },
        { label: "Payment Accounts", icon: LayersIcon, path: "/admin/payment-accounts" },
        { label: "Invoices & Receipts", icon: ReceiptIcon, path: "/admin/invoices" },
      ],
    },
    {
      group: "Content & Community",
      items: [
        { label: "Users & Accounts", icon: UsersIcon, path: "/admin/users" },
        { label: "Tenant Organizations", icon: Building2Icon, path: "/admin/organizations" },
        { label: "Posts & Scheduler", icon: CalendarClockIcon, path: "/admin/posts" },
        { label: "Connected Platforms", icon: GlobeIcon, path: "/admin/accounts" },
        { label: "Customer Inquiries", icon: BarChart3Icon, path: "/admin/inquiries" },
      ],
    },
    {
      group: "Website & AI Settings",
      items: [
        { label: "Policies & Legal", icon: FileTextIcon, path: "/admin/policies" },
        { label: "Site & SEO Settings", icon: KeyRoundIcon, path: "/admin/settings" },
        { label: "Redis & Cache Control", icon: DatabaseIcon, path: "/admin/cache" },
        { label: "Activity Audit Logs", icon: ServerIcon, path: "/admin/logs" },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans antialiased">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Admin Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900/95 border-r border-slate-800 backdrop-blur-md flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-red-600 to-rose-700 rounded-xl shadow-lg shadow-red-500/20 text-white">
              <ShieldCheckIcon className="size-5" />
            </div>
            <div>
              <div className="font-bold text-base text-white tracking-tight flex items-center gap-1.5">
                MetScheduler
                <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.2 rounded font-semibold uppercase">
                  Admin
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Master Control Portal</p>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg lg:hidden"
          >
            <XIcon className="size-5" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
          {navGroups.map((group) => (
            <div key={group.group} className="space-y-1">
              <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {group.group}
              </div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.path === "/admin"
                    ? location.pathname === "/admin"
                    : location.pathname.startsWith(item.path);

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group ${
                      isActive
                        ? "bg-red-500/15 text-red-400 border border-red-500/30 shadow-xs"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`size-4 transition ${
                          isActive
                            ? "text-red-400"
                            : "text-slate-500 group-hover:text-slate-300"
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>

                    {item.badge !== undefined && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 animate-pulse">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer Admin Bar */}
        <div className="p-3.5 border-t border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <span
                className={`size-2.5 rounded-full ${
                  cacheStatus?.connected ? "bg-emerald-500 shadow-emerald-500/50 shadow-sm" : "bg-amber-500"
                }`}
              />
              <span className="text-[11px] text-slate-400 font-mono">
                {cacheStatus?.mode === "redis" ? "Redis Live" : "Memory Cache"}
              </span>
            </div>
            <button
              onClick={handleFlushCache}
              disabled={flushingCache}
              title="Flush Cache Now"
              className="p-1 text-slate-400 hover:text-red-400 rounded transition"
            >
              <RefreshCwIcon className={`size-3.5 ${flushingCache ? "animate-spin" : ""}`} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/dashboard"
              className="flex-1 text-center py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition flex items-center justify-center gap-1.5"
            >
              <ArrowLeftIcon className="size-3.5" />
              User Dashboard
            </Link>
            <button
              onClick={() => {
                logout();
                navigate("/login");
              }}
              title="Logout"
              className="p-2 bg-slate-800 hover:bg-red-900/40 text-slate-400 hover:text-red-400 rounded-xl transition"
            >
              <LogOutIcon className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-72 min-w-0">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-slate-400 hover:text-white rounded-lg lg:hidden"
            >
              <MenuIcon className="size-5" />
            </button>
            <h1 className="text-sm font-semibold text-slate-200 hidden sm:block">
              Admin Portal
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {pendingPaymentsCount > 0 && (
              <Link
                to="/admin/payments"
                className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-amber-500/20 transition animate-pulse"
              >
                <WalletIcon className="size-3.5" />
                <span>{pendingPaymentsCount} Payments Pending</span>
              </Link>
            )}

            <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60">
              <div className="size-6 rounded-full bg-gradient-to-r from-red-500 to-rose-600 flex items-center justify-center text-xs font-bold text-white">
                {user?.name?.[0]?.toUpperCase() || "A"}
              </div>
              <div className="text-left hidden md:block">
                <p className="text-xs font-medium text-slate-200 leading-none">{user?.name}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{user?.email}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Nested Admin Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
