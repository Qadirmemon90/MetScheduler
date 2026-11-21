/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import {
  GlobeIcon,
  Loader2Icon,
  RefreshCwIcon,
  UserIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";

export default function AdminAccounts() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/admin/accounts");
      setAccounts(data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <GlobeIcon className="size-5 text-red-500" />
            Connected Social Accounts
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Monitor all linked social media channels across users (LinkedIn, Twitter/X, Facebook, Instagram)
          </p>
        </div>

        <button
          onClick={fetchAccounts}
          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700"
        >
          <RefreshCwIcon className="size-3.5" />
          Refresh
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-16 text-center">
            <Loader2Icon className="size-8 text-red-500 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-400">Loading accounts...</p>
          </div>
        ) : accounts.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            <GlobeIcon className="size-10 text-slate-700 mx-auto mb-3" />
            No connected accounts found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/80">
                  <th className="py-3.5 px-4 font-semibold">User</th>
                  <th className="py-3.5 px-4 font-semibold">Platform</th>
                  <th className="py-3.5 px-4 font-semibold">Handle / Name</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold">Connected At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {accounts.map((acc) => (
                  <tr key={acc._id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{acc.user?.name || "User"}</div>
                      <div className="text-[11px] text-slate-400">{acc.user?.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                        {acc.platform}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-white flex items-center gap-2">
                      {acc.avatarUrl ? (
                        <img
                          src={acc.avatarUrl}
                          alt={acc.handle}
                          className="size-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="size-6 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                          <UserIcon className="size-3" />
                        </div>
                      )}
                      <span>{acc.handle || acc.accountName || "Account"}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        {acc.status || "connected"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {new Date(acc.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
