/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import {
  Loader2Icon,
  RefreshCwIcon,
  ServerIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";

export default function AdminLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/admin/activity-logs");
      setLogs(data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ServerIcon className="size-5 text-red-500" />
            Activity & System Audit Logs
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time trail of scheduled posts, payments submitted, plans upgraded, and user actions
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700"
        >
          <RefreshCwIcon className="size-3.5" />
          Refresh Logs
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-16 text-center">
            <Loader2Icon className="size-8 text-red-500 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-400">Loading activity trail...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            <ServerIcon className="size-10 text-slate-700 mx-auto mb-3" />
            No system activity logs recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/80">
                  <th className="py-3.5 px-4 font-semibold">User</th>
                  <th className="py-3.5 px-4 font-semibold">Action Type</th>
                  <th className="py-3.5 px-4 font-semibold">Details / Description</th>
                  <th className="py-3.5 px-4 font-semibold">Platform</th>
                  <th className="py-3.5 px-4 font-semibold">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{log.user?.name || "System"}</div>
                      <div className="text-[11px] text-slate-400">{log.user?.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-500/15 text-red-400 border border-red-500/30">
                        {log.actionType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-md text-slate-300">
                      {log.description}
                    </td>
                    <td className="py-3.5 px-4 uppercase text-slate-400">
                      {log.platform || "-"}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {new Date(log.createdAt).toLocaleString()}
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
