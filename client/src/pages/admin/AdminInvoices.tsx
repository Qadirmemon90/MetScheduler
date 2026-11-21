/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import {
  CheckCircle2Icon,
  EyeIcon,
  FileTextIcon,
  FilterIcon,
  PrinterIcon,
  RefreshCwIcon,
  SearchIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";

export default function AdminInvoices() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== "all") params.status = statusFilter;
      if (planFilter !== "all") params.plan = planFilter;

      const { data } = await api.get("/api/admin/invoices", { params });
      setInvoices(data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter, planFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInvoices();
  };

  const printModal = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <FileTextIcon className="size-6 text-red-500" />
            Billing & Invoices
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Official paid receipts generated automatically upon Super Admin payment approvals.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchInvoices}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition"
          >
            <RefreshCwIcon className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full relative">
          <SearchIcon className="size-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Invoice #, Customer name, email, or Transaction ID..."
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
              <option value="paid" className="bg-slate-900">Paid</option>
              <option value="pending" className="bg-slate-900">Pending</option>
              <option value="refunded" className="bg-slate-900">Refunded</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl">
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-300 focus:outline-none"
            >
              <option value="all" className="bg-slate-900">All Plans</option>
              <option value="pro" className="bg-slate-900">Pro</option>
              <option value="business" className="bg-slate-900">Business</option>
            </select>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCwIcon className="size-8 animate-spin mx-auto text-red-500 mb-3" />
            <p className="text-sm">Loading billing invoices...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <FileTextIcon className="size-10 mx-auto text-slate-600 mb-2" />
            <p className="text-sm font-semibold text-slate-300">No invoices found</p>
            <p className="text-xs text-slate-500">
              Invoices are automatically created and assigned when Pakistani payment proofs are approved.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-4">Invoice #</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Plan / Cycle</th>
                  <th className="py-3.5 px-4">Method & TID</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {invoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-mono font-semibold text-red-400">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-white">{inv.customerName}</div>
                      <div className="text-[11px] text-slate-500">{inv.customerEmail}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20">
                        {inv.plan}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-1.5 capitalize">
                        ({inv.billingPeriod || "monthly"})
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="capitalize font-medium text-slate-300">
                        {inv.paymentMethod}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500">
                        {inv.transactionId}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-emerald-400">
                      {inv.currency || "PKR"} {inv.total?.toLocaleString() || inv.amount?.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2Icon className="size-3" />
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(inv.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition"
                      >
                        <EyeIcon className="size-3.5" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice Detail & Print Lightbox */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-600/20 border border-red-500/30 rounded-xl text-red-500">
                  <FileTextIcon className="size-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Invoice Details</h3>
                  <p className="text-xs text-slate-400 font-mono">{selectedInvoice.invoiceNumber}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={printModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold shadow transition"
                >
                  <PrinterIcon className="size-3.5" />
                  Print / Save PDF
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Printable Body Content */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-6 print:bg-white print:text-black">
              {/* Brand and Metadata */}
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-white tracking-tight">MetriSolution ERP</h2>
                  <p className="text-xs text-slate-400">Inventory & Scheduling SaaS Platform</p>
                  <p className="text-xs text-slate-500 mt-1">support@metrisolution.com • Karachi, Pakistan</p>
                </div>
                <div className="sm:text-right">
                  <span className="inline-block px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold uppercase tracking-wider rounded-lg text-xs">
                    Payment Verified (PAID)
                  </span>
                  <p className="text-xs text-slate-400 mt-2 font-mono">Invoice: {selectedInvoice.invoiceNumber}</p>
                  <p className="text-xs text-slate-400">Date: {new Date(selectedInvoice.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Billed To / Payment Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Billed To</h4>
                  <p className="text-sm font-semibold text-white mt-1">{selectedInvoice.customerName}</p>
                  <p className="text-xs text-slate-400">{selectedInvoice.customerEmail}</p>
                </div>
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Payment Information</h4>
                  <p className="text-xs text-slate-300 mt-1 capitalize">
                    Method: <span className="font-semibold text-white">{selectedInvoice.paymentMethod}</span>
                  </p>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    TID: <span className="text-slate-200">{selectedInvoice.transactionId}</span>
                  </p>
                </div>
              </div>

              {/* Items Breakdown Table */}
              <div className="pt-2">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase">
                      <th className="py-2 text-left">Description</th>
                      <th className="py-2 text-center">Cycle</th>
                      <th className="py-2 text-right">Amount (PKR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    <tr>
                      <td className="py-3">
                        <div className="font-semibold text-white">MetriSolution {selectedInvoice.plan} Plan Upgrade</div>
                        <div className="text-[11px] text-slate-500">Premium ERP, Multi-channel scheduling & ChatGPT MCP Server Access</div>
                      </td>
                      <td className="py-3 text-center capitalize">{selectedInvoice.billingPeriod || "Monthly"}</td>
                      <td className="py-3 text-right font-semibold">PKR {selectedInvoice.amount?.toLocaleString()}</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-slate-800 font-bold text-sm">
                      <td colSpan={2} className="py-3 text-right text-slate-400">Total Paid:</td>
                      <td className="py-3 text-right text-emerald-400 font-mono">
                        PKR {selectedInvoice.total?.toLocaleString() || selectedInvoice.amount?.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Verification Stamp */}
              <div className="pt-4 border-t border-slate-800/80 text-center text-[11px] text-slate-500">
                This is a computer-generated tax receipt verified by MetriSolution Platform Super Administration. No physical signature required.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}