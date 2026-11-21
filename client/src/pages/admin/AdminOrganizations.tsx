/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import {
  AlertTriangleIcon,
  Building2Icon,
  CheckCircle2Icon,
  FilterIcon,
  LayersIcon,
  RefreshCwIcon,
  SearchIcon,
  UsersIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";

export default function AdminOrganizations() {
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrganizations = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== "all") params.status = statusFilter;
      if (planFilter !== "all") params.plan = planFilter;

      const { data } = await api.get("/api/admin/organizations", { params });
      setOrganizations(data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load organizations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, [statusFilter, planFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrganizations();
  };

  const handleStatusChange = async (id: string, currentStatus: string, orgName: string) => {
    const nextStatus = currentStatus === "active" ? "suspended" : "active";
    if (
      !window.confirm(
        `Are you sure you want to change organization "${orgName}" status to "${nextStatus.toUpperCase()}"?`,
      )
    ) {
      return;
    }

    setUpdatingId(id);
    try {
      await api.patch(`/api/admin/organizations/${id}/status`, { status: nextStatus });
      toast.success(`Organization "${orgName}" is now ${nextStatus}`);
      await fetchOrganizations();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update organization status");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Building2Icon className="size-6 text-red-500" />
            Tenant Organizations
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Multi-tenant business accounts, branch setups, and enterprise inventory access controls.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchOrganizations}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition"
          >
            <RefreshCwIcon className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full relative">
          <SearchIcon className="size-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search organizations by name, slug, or contact email..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-red-500"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl">
            <FilterIcon className="size-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-300 focus:outline-none"
            >
              <option value="all" className="bg-slate-900">All Statuses</option>
              <option value="active" className="bg-slate-900">Active</option>
              <option value="trial" className="bg-slate-900">Trial</option>
              <option value="suspended" className="bg-slate-900">Suspended</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl">
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-300 focus:outline-none"
            >
              <option value="all" className="bg-slate-900">All Plans</option>
              <option value="free" className="bg-slate-900">Free</option>
              <option value="pro" className="bg-slate-900">Pro</option>
              <option value="business" className="bg-slate-900">Business</option>
            </select>
          </div>
        </div>
      </div>

      {/* Organizations Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCwIcon className="size-8 animate-spin mx-auto text-red-500 mb-3" />
            <p className="text-sm">Loading tenant organizations...</p>
          </div>
        ) : organizations.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Building2Icon className="size-10 mx-auto text-slate-600 mb-2" />
            <p className="text-sm font-semibold text-slate-300">No organizations found</p>
            <p className="text-xs text-slate-500">
              New customer organizations will appear here as accounts are registered.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-4">Organization Name</th>
                  <th className="py-3.5 px-4">Owner Account</th>
                  <th className="py-3.5 px-4">Plan</th>
                  <th className="py-3.5 px-4 text-center">Branches & Warehouses</th>
                  <th className="py-3.5 px-4 text-center">Users</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {organizations.map((org) => {
                  const isActive = org.status === "active";
                  return (
                    <tr key={org._id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white flex items-center gap-2">
                          <Building2Icon className="size-4 text-red-400" />
                          {org.name}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          slug: /{org.slug || "default"}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-200">
                          {org.owner?.name || "System Admin"}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {org.owner?.email || org.contactEmail || "N/A"}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20">
                          {org.plan}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-950 rounded-lg text-slate-300 font-medium">
                          <LayersIcon className="size-3 text-slate-500" />
                          <span>{org.branchesCount || 1} Branches</span>
                          <span className="text-slate-600">•</span>
                          <span>{org.warehousesCount || 1} Wh</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-slate-300">
                        <span className="inline-flex items-center gap-1">
                          <UsersIcon className="size-3 text-slate-500" />
                          {org.usersCount || 1}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isActive
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          }`}
                        >
                          {isActive ? (
                            <CheckCircle2Icon className="size-3" />
                          ) : (
                            <AlertTriangleIcon className="size-3" />
                          )}
                          {org.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleStatusChange(org._id, org.status, org.name)}
                          disabled={updatingId === org._id}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold border transition ${
                            isActive
                              ? "bg-rose-950/40 border-rose-800/60 text-rose-400 hover:bg-rose-900/60"
                              : "bg-emerald-950/40 border-emerald-800/60 text-emerald-400 hover:bg-emerald-900/60"
                          }`}
                        >
                          {updatingId === org._id
                            ? "Updating..."
                            : isActive
                            ? "Suspend Tenant"
                            : "Activate Tenant"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}