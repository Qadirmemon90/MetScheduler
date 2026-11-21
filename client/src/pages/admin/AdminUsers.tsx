/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import {
  KeyIcon,
  Loader2Icon,
  RefreshCwIcon,
  SearchIcon,
  ShieldCheckIcon,
  Trash2Icon,
  UsersIcon,
  XIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterPlan, setFilterPlan] = useState("all");

  // Reset password modal state
  const [resetModalUser, setResetModalUser] = useState<any | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (search.trim()) params.search = search.trim();
      if (filterRole !== "all") params.role = filterRole;
      if (filterPlan !== "all") params.plan = filterPlan;

      const { data } = await api.get("/api/admin/users", { params });
      setUsers(data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filterRole, filterPlan]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const handlePlanChange = async (userId: string, plan: string) => {
    try {
      const billingStatus = plan === "free" ? "free" : "active";
      await api.patch(`/api/admin/users/${userId}/plan`, { plan, billingStatus });
      toast.success("User plan updated!");
      await fetchUsers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update plan");
    }
  };

  const handleRoleChange = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    if (
      !window.confirm(
        `Are you sure you want to change this user's role to ${newRole.toUpperCase()}?`,
      )
    ) {
      return;
    }
    try {
      await api.patch(`/api/admin/users/${userId}/role`, { role: newRole });
      toast.success(`User role changed to ${newRole}!`);
      await fetchUsers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to change role");
    }
  };

  const handleStatusToggle = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === "suspended" ? "active" : "suspended";
    try {
      await api.patch(`/api/admin/users/${userId}/status`, { status: newStatus });
      toast.success(`User status changed to ${newStatus}!`);
      await fetchUsers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update status");
    }
  };

  const handleDeleteUser = async (userId: string, name: string) => {
    if (
      !window.confirm(
        `DANGER: Permanently delete user '${name}' and all associated posts, accounts, and history? This action cannot be undone.`,
      )
    ) {
      return;
    }
    try {
      await api.delete(`/api/admin/users/${userId}`);
      toast.success("User deleted permanently.");
      await fetchUsers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete user");
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalUser || !newPassword || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setActionLoading(true);
    try {
      await api.post(`/api/admin/users/${resetModalUser._id}/reset-password`, {
        newPassword,
      });
      toast.success(`Password reset for ${resetModalUser.email}!`);
      setResetModalUser(null);
      setNewPassword("");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to reset password");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <UsersIcon className="size-5 text-red-500" />
            User Management Directory
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage registered users, update subscription plans, grant Admin privileges, suspend
            abusive accounts, or reset passwords.
          </p>
        </div>

        <button
          onClick={fetchUsers}
          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition self-start sm:self-auto border border-slate-700"
        >
          <RefreshCwIcon className="size-3.5" />
          Refresh
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3.5 rounded-2xl">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Role Filter */}
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="text-xs bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-3 py-1.5 outline-none focus:border-red-500"
          >
            <option value="all">All Roles</option>
            <option value="user">Users Only</option>
            <option value="admin">Admins Only</option>
          </select>

          {/* Plan Filter */}
          <select
            value={filterPlan}
            onChange={(e) => setFilterPlan(e.target.value)}
            className="text-xs bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-3 py-1.5 outline-none focus:border-red-500"
          >
            <option value="all">All Plans</option>
            <option value="free">Free Plan</option>
            <option value="pro">Pro Plan</option>
            <option value="business">Business Plan</option>
          </select>
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-80">
          <div className="relative flex-1">
            <SearchIcon className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 outline-none focus:border-red-500"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition border border-slate-700"
          >
            Search
          </button>
        </form>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-16 text-center">
            <Loader2Icon className="size-8 text-red-500 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-400">Loading user records...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            <UsersIcon className="size-10 text-slate-700 mx-auto mb-3" />
            No users match this filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/80">
                  <th className="py-3.5 px-4 font-semibold">User</th>
                  <th className="py-3.5 px-4 font-semibold">Role</th>
                  <th className="py-3.5 px-4 font-semibold">Subscription Plan</th>
                  <th className="py-3.5 px-4 font-semibold">Billing Status</th>
                  <th className="py-3.5 px-4 font-semibold">Account Status</th>
                  <th className="py-3.5 px-4 font-semibold">MCP Key</th>
                  <th className="py-3.5 px-4 font-semibold">Registered</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {users.map((u) => {
                  const isAdmin = u.role === "admin";
                  const isSuspended = u.status === "suspended";

                  return (
                    <tr key={u._id} className="hover:bg-slate-800/40 transition">
                      {/* Name & Email */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white flex items-center gap-1.5">
                          {u.name}
                          {isAdmin && (
                            <span title="Admin User">
                              <ShieldCheckIcon className="size-3.5 text-red-400" />
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">{u.email}</div>
                      </td>

                      {/* Role Toggle Button */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleRoleChange(u._id, u.role)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition ${
                            isAdmin
                              ? "bg-red-500/20 text-red-400 border border-red-500/30"
                              : "bg-slate-800 text-slate-400 hover:text-white"
                          }`}
                        >
                          {u.role || "user"}
                        </button>
                      </td>

                      {/* Plan Dropdown */}
                      <td className="py-3.5 px-4">
                        <select
                          value={u.plan || "free"}
                          onChange={(e) => handlePlanChange(u._id, e.target.value)}
                          className="text-xs bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2 py-1 outline-none focus:border-red-500 font-semibold uppercase"
                        >
                          <option value="free">Free</option>
                          <option value="pro">Pro</option>
                          <option value="business">Business</option>
                        </select>
                      </td>

                      {/* Billing Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            u.billingStatus === "active"
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                              : u.billingStatus === "payment_pending"
                              ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          {u.billingStatus || "free"}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleStatusToggle(u._id, u.status)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition ${
                            isSuspended
                              ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                              : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                          }`}
                        >
                          {u.status || "active"}
                        </button>
                      </td>

                      {/* MCP API Key */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-[10px] text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded">
                          {u.mcpApiKey ? `${u.mcpApiKey.substring(0, 12)}...` : "None"}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setResetModalUser(u);
                              setNewPassword("");
                            }}
                            title="Reset Password"
                            className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition"
                          >
                            <KeyIcon className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u._id, u.name)}
                            title="Delete User"
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                          >
                            <Trash2Icon className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reset Password Modal */}
      {resetModalUser && (
        <div className="fixed inset-0 z-[120] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <form
            onSubmit={handleResetPasswordSubmit}
            className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-sm w-full space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <KeyIcon className="size-4 text-amber-400" />
                Reset User Password
              </h3>
              <button
                type="button"
                onClick={() => setResetModalUser(null)}
                className="text-slate-400 hover:text-white"
              >
                <XIcon className="size-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Set a new password for <span className="text-white font-semibold">{resetModalUser.email}</span>.
            </p>

            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">
                New Password (minimum 6 characters)
              </label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full text-xs bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setResetModalUser(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading || !newPassword || newPassword.length < 6}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition disabled:opacity-50"
              >
                Update Password
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
