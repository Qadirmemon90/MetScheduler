/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  FileTextIcon,
  PrinterIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";

export default function InvoiceView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get(`/api/billing/invoices/${id}`);
        setInvoice(data);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to load invoice receipt");
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-slate-400">
        <div className="text-center space-y-3">
          <FileTextIcon className="size-10 animate-pulse text-red-500 mx-auto" />
          <p className="text-sm">Retrieving verified invoice...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
          <FileTextIcon className="size-12 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-white">Invoice Not Found</h2>
          <p className="text-xs text-slate-400">{error || "The requested invoice could not be located."}</p>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition"
          >
            <ArrowLeftIcon className="size-3.5" /> Return
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 font-sans">
      {/* Top Controls (Hidden on Print) */}
      <div className="max-w-3xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-medium border border-slate-800 transition"
        >
          <ArrowLeftIcon className="size-3.5" /> Back
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-600/20 transition"
          >
            <PrinterIcon className="size-3.5" /> Print / Save PDF
          </button>
        </div>
      </div>

      {/* Invoice Document Card */}
      <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-12 shadow-2xl space-y-8 print:bg-white print:text-black print:border-none print:shadow-none print:p-0">
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-6 border-b border-slate-800 print:border-neutral-200">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-red-600 text-white rounded-xl">
                <ShieldCheckIcon className="size-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white print:text-black">
                  MetriSolution ERP
                </h1>
                <p className="text-xs text-slate-400 print:text-neutral-500">
                  Inventory, Social Automation & ERP SaaS
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-3 leading-relaxed print:text-neutral-600">
              MetriSolution Technologies (Pvt) Ltd.<br />
              Karachi, Sindh, Pakistan<br />
              Email: support@metrisolution.com
            </p>
          </div>

          <div className="sm:text-right space-y-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold uppercase tracking-wider rounded-lg text-xs print:bg-emerald-50 print:text-emerald-700">
              <CheckCircle2Icon className="size-3.5" /> Paid Receipt
            </span>
            <div className="pt-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 print:text-neutral-500">
                Invoice Number
              </p>
              <p className="text-base font-mono font-bold text-red-400 print:text-red-700">
                {invoice.invoiceNumber}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 print:text-neutral-600">
                Date: {new Date(invoice.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
          </div>
        </div>

        {/* Customer & Transaction Meta */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 border-b border-slate-800 print:border-neutral-200">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 print:text-neutral-500">
              Billed To
            </h3>
            <p className="text-base font-semibold text-white print:text-black mt-1">
              {invoice.customerName}
            </p>
            <p className="text-xs text-slate-400 print:text-neutral-600">
              {invoice.customerEmail}
            </p>
            {invoice.user?.plan && (
              <p className="text-[11px] text-slate-500 mt-0.5 print:text-neutral-500">
                Account Plan: {invoice.user.plan.toUpperCase()}
              </p>
            )}
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 print:text-neutral-500">
              Payment Settlement
            </h3>
            <p className="text-xs text-slate-300 print:text-neutral-800 mt-1 capitalize">
              Method: <span className="font-semibold text-white print:text-black">{invoice.paymentMethod}</span>
            </p>
            <p className="text-xs text-slate-300 print:text-neutral-800 font-mono mt-0.5">
              Transaction ID: <span className="font-bold text-slate-100 print:text-black">{invoice.transactionId}</span>
            </p>
            <p className="text-xs text-slate-400 print:text-neutral-600 mt-0.5">
              Settled At: {new Date(invoice.paidAt || invoice.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="space-y-4">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-800 print:border-neutral-200 text-slate-400 print:text-neutral-500 uppercase font-semibold">
                <th className="py-2.5 text-left">Item & Description</th>
                <th className="py-2.5 text-center">Billing Cycle</th>
                <th className="py-2.5 text-right">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 print:divide-neutral-200 text-slate-300 print:text-neutral-800">
              <tr>
                <td className="py-4">
                  <div className="font-bold text-white print:text-black text-sm">
                    MetriSolution {invoice.plan} Subscription
                  </div>
                  <div className="text-xs text-slate-400 print:text-neutral-500 mt-0.5">
                    Full ERP Inventory, Multi-account Social Publisher & ChatGPT Remote MCP Server Integration
                  </div>
                </td>
                <td className="py-4 text-center capitalize">
                  {invoice.billingPeriod || "Monthly"}
                </td>
                <td className="py-4 text-right font-mono font-semibold">
                  PKR {invoice.amount?.toLocaleString()}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-800 print:border-neutral-200">
                <td colSpan={2} className="pt-4 text-right text-slate-400 print:text-neutral-600">
                  Subtotal:
                </td>
                <td className="pt-4 text-right font-mono font-medium text-slate-300 print:text-neutral-800">
                  PKR {invoice.amount?.toLocaleString()}
                </td>
              </tr>
              <tr>
                <td colSpan={2} className="py-1 text-right text-slate-400 print:text-neutral-600">
                  Sales Tax (0% GST):
                </td>
                <td className="py-1 text-right font-mono text-slate-400 print:text-neutral-600">
                  PKR 0
                </td>
              </tr>
              <tr className="border-t border-slate-700 print:border-neutral-300">
                <td colSpan={2} className="pt-3 text-right text-base font-bold text-white print:text-black">
                  Total Paid:
                </td>
                <td className="pt-3 text-right font-mono text-base font-black text-emerald-400 print:text-emerald-700">
                  {invoice.currency || "PKR"} {invoice.total?.toLocaleString() || invoice.amount?.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Legal & Notice */}
        <div className="pt-6 border-t border-slate-800/80 print:border-neutral-200 text-center space-y-1">
          <p className="text-xs text-slate-400 print:text-neutral-600">
            Thank you for choosing MetriSolution ERP.
          </p>
          <p className="text-[11px] text-slate-500 print:text-neutral-400">
            This digital receipt confirms the manual transaction proof verified by MetriSolution Platform Super Administration.
          </p>
        </div>
      </div>
    </div>
  );
}