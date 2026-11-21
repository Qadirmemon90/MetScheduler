/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2Icon,
  ClockIcon,
  ExternalLinkIcon,
  EyeIcon,
  FileTextIcon,
  Loader2Icon,
  RefreshCwIcon,
  SearchIcon,
  ShieldAlertIcon,
  WalletIcon,
  XCircleIcon,
  XIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";

export default function AdminPayments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [activeScreenshot, setActiveScreenshot] = useState<string | null>(null);

  // Reject modal state
  const [rejectModalItem, setRejectModalItem] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filterStatus !== "all") params.status = filterStatus;
      if (search.trim()) params.search = search.trim();

      const { data } = await api.get("/api/admin/payments", { params });
      setPayments(data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [filterStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPayments();
  };

  const handleApprove = async (id: string, plan: string, userName: string) => {
    if (
      !window.confirm(
        `Are you sure you want to approve this payment? User ${userName}'s plan will immediately upgrade to ${plan.toUpperCase()}.`,
      )
    ) {
      return;
    }

    setActionLoading(true);
    try {
      await api.patch(`/api/admin/payments/${id}/approve`);
      toast.success(`Payment approved! User upgraded to ${plan.toUpperCase()}.`);
      await fetchPayments();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to approve payment");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalItem) return;

    setActionLoading(true);
    try {
      await api.patch(`/api/admin/payments/${rejectModalItem._id}/reject`, {
        rejectionReason: rejectionReason.trim() || "Payment verification failed",
      });
      toast.success("Payment marked as rejected.");
      setRejectModalItem(null);
      setRejectionReason("");
      await fetchPayments();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to reject payment");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <WalletIcon className="size-5 text-red-500" />
            Pakistani Manual Payment Approvals
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Review Easypaisa, JazzCash & Bank receipts with screenshot proofs. Confirming upgrades
            the user account instantly.
          </p>
        </div>

        <button
          onClick={fetchPayments}
          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition self-start sm:self-auto border border-slate-700"
        >
          <RefreshCwIcon className="size-3.5" />
          Refresh
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3.5 rounded-2xl">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {[
            { id: "all", label: "All Requests" },
            { id: "pending", label: "Pending Verification" },
            { id: "approved", label: "Approved" },
            { id: "rejected", label: "Rejected" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterStatus === tab.id
                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-80">
          <div className="relative flex-1">
            <SearchIcon className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search user, TRX ID, email..."
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

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-16 text-center">
            <Loader2Icon className="size-8 text-red-500 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-400">Loading payment requests...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            <WalletIcon className="size-10 text-slate-700 mx-auto mb-3" />
            No payment requests found for this filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/80">
                  <th className="py-3.5 px-4 font-semibold">User Details</th>
                  <th className="py-3.5 px-4 font-semibold">Plan</th>
                  <th className="py-3.5 px-4 font-semibold">Method & Amount</th>
                  <th className="py-3.5 px-4 font-semibold">Transaction ID</th>
                  <th className="py-3.5 px-4 font-semibold">Screenshot Proof</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold">Submitted</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {payments.map((p) => {
                  const isPending = p.status === "pending";
                  const isApproved = p.status === "approved";
                  const isRejected = p.status === "rejected";

                  return (
                    <tr key={p._id} className="hover:bg-slate-800/40 transition">
                      {/* User */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{p.userName}</div>
                        <div className="text-[11px] text-slate-400">{p.userEmail}</div>
                      </td>

                      {/* Plan */}
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-red-500/15 text-red-400 border border-red-500/30">
                          {p.targetPlan}
                        </span>
                      </td>

                      {/* Method & Amount */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-emerald-400">PKR {p.amount}</div>
                        <div className="text-[11px] text-slate-400 capitalize flex items-center gap-1">
                          {p.paymentMethod}
                          {p.senderAccountNumber && (
                            <span className="text-[10px] text-slate-500">
                              ({p.senderAccountNumber})
                            </span>
                          )}
                        </div>
                      </td>

                      {/* TRX ID */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono bg-slate-800 text-slate-200 px-2 py-1 rounded border border-slate-700 text-[11px]">
                          {p.transactionId}
                        </span>
                      </td>

                      {/* Screenshot Thumbnail */}
                      <td className="py-3.5 px-4">
                        {p.proofScreenshotUrl ? (
                          <button
                            type="button"
                            onClick={() => setActiveScreenshot(p.proofScreenshotUrl)}
                            className="group relative size-12 rounded-lg overflow-hidden border border-slate-700 block hover:border-red-400 transition"
                          >
                            <img
                              src={p.proofScreenshotUrl}
                              alt="Receipt"
                              className="size-full object-cover group-hover:scale-105 transition"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                              <EyeIcon className="size-4 text-white" />
                            </div>
                          </button>
                        ) : (
                          <span className="text-slate-500 italic">No image</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            <ClockIcon className="size-3" />
                            Pending
                          </span>
                        )}
                        {isApproved && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2Icon className="size-3" />
                            Approved
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                            <XCircleIcon className="size-3" />
                            Rejected
                          </span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {new Date(p.createdAt).toLocaleString()}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        {isPending ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleApprove(p._id, p.targetPlan, p.userName)}
                              disabled={actionLoading}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setRejectModalItem(p);
                                setRejectionReason("");
                              }}
                              disabled={actionLoading}
                              className="px-3 py-1 bg-slate-800 hover:bg-rose-900/40 text-rose-400 hover:text-rose-300 rounded-lg text-xs font-semibold border border-slate-700 transition"
                            >
                              Reject
                            </button>
                          </div>
                        ) : isApproved && p.invoice ? (
                          <Link
                            to={`/invoice/${p.invoice}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition"
                          >
                            <FileTextIcon className="size-3 text-red-400" />
                            Invoice
                          </Link>
                        ) : (
                          <span className="text-[11px] text-slate-500">
                            {isApproved ? "Verified" : "Closed"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Screenshot Lightbox Modal */}
      {activeScreenshot && (
        <div className="fixed inset-0 z-[120] bg-black/90 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="relative max-w-3xl w-full max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setActiveScreenshot(null)}
              className="absolute -top-10 right-0 p-2 text-white hover:text-red-400 transition"
            >
              <XIcon className="size-6" />
            </button>
            <img
              src={activeScreenshot}
              alt="Full Receipt"
              className="max-h-[80vh] w-auto rounded-xl border border-slate-700 shadow-2xl object-contain"
            />
            <div className="mt-3 flex items-center gap-3">
              <a
                href={activeScreenshot}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 underline"
              >
                Open Original in New Tab <ExternalLinkIcon className="size-3" />
              </a>
              <button
                onClick={() => setActiveScreenshot(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs rounded-lg transition"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Payment Reason Modal */}
      {rejectModalItem && (
        <div className="fixed inset-0 z-[120] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <form
            onSubmit={handleRejectSubmit}
            className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-md w-full space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldAlertIcon className="size-5 text-rose-500" />
                Reject Payment Verification
              </h3>
              <button
                type="button"
                onClick={() => setRejectModalItem(null)}
                className="text-slate-400 hover:text-white"
              >
                <XIcon className="size-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              User: <span className="text-white font-medium">{rejectModalItem.userName}</span> (
              {rejectModalItem.userEmail})<br />
              Transaction ID: <span className="font-mono text-white">{rejectModalItem.transactionId}</span>
            </p>

            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">
                Reason for Rejection <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                placeholder="e.g. Transaction ID not found on bank statement, screenshot unclear, amount mismatch..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full text-xs bg-slate-800 border border-slate-700 rounded-xl p-3 text-slate-200 outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalItem(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading || !rejectionReason.trim()}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
