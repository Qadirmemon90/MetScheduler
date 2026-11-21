/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import {
  BarChart3Icon,
  Loader2Icon,
  MailIcon,
  RefreshCwIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";

export default function AdminInquiries() {
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/admin/inquiries");
      setInquiries(data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load inquiries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const { data } = await api.patch(`/api/admin/inquiries/${id}`, { status });
      setInquiries((prev) => prev.map((inq) => (inq._id === id ? data : inq)));
      toast.success("Inquiry status updated!");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update status");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3Icon className="size-5 text-red-500" />
            Customer & Vendor Inquiries
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Questions, custom plan requests, and direct customer vendor inquiries
          </p>
        </div>

        <button
          onClick={fetchInquiries}
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
            <p className="text-xs text-slate-400">Loading inquiries...</p>
          </div>
        ) : inquiries.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            <MailIcon className="size-10 text-slate-700 mx-auto mb-3" />
            No inquiries recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/80">
                  <th className="py-3.5 px-4 font-semibold">Customer</th>
                  <th className="py-3.5 px-4 font-semibold">Interested Plan</th>
                  <th className="py-3.5 px-4 font-semibold">Phone / WhatsApp</th>
                  <th className="py-3.5 px-4 font-semibold">Message</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold">Date</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Update Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {inquiries.map((inq) => (
                  <tr key={inq._id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{inq.name}</div>
                      <div className="text-[11px] text-slate-400">{inq.email}</div>
                      {inq.company && (
                        <div className="text-[10px] text-slate-500">{inq.company}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-500/15 text-red-400 border border-red-500/30">
                        {inq.plan}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {inq.phone || <span className="text-slate-500">-</span>}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="line-clamp-2 text-slate-300">{inq.message || "-"}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      {inq.status === "new" && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          New
                        </span>
                      )}
                      {inq.status === "contacted" && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                          Contacted
                        </span>
                      )}
                      {inq.status === "closed" && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          Closed
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {new Date(inq.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <select
                        value={inq.status || "new"}
                        onChange={(e) => handleStatusChange(inq._id, e.target.value)}
                        className="text-xs bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2 py-1 outline-none focus:border-red-500"
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="closed">Closed</option>
                      </select>
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
