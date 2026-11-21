/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import {
  CheckCircle2Icon,
  CopyIcon,
  CrownIcon,
  FileCheckIcon,
  InfoIcon,
  Loader2Icon,
  SparklesIcon,
  UploadCloudIcon,
  XIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useSiteSettings } from "../context/SiteSettingsContext";

type PakistaniPaymentModalProps = {
  isOpen: boolean;
  defaultPlan?: "pro" | "business";
  onClose: () => void;
  onSuccess?: () => void;
};

type MethodKey = "easypaisa" | "jazzcash" | "bankTransfer" | "sadapay" | "nayapay";

export default function PakistaniPaymentModal({
  isOpen,
  defaultPlan = "pro",
  onClose,
  onSuccess,
}: PakistaniPaymentModalProps) {
  const { user, refreshUser } = useAuth();
  const { settings, plans } = useSiteSettings();

  const [selectedPlan, setSelectedPlan] = useState<"pro" | "business">(defaultPlan);
  const [selectedMethod, setSelectedMethod] = useState<MethodKey>("easypaisa");
  const [transactionId, setTransactionId] = useState("");
  const [senderTitle, setSenderTitle] = useState("");
  const [senderNumber, setSenderNumber] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedPlan(defaultPlan);
      setTransactionId("");
      setSenderTitle(user?.name || "");
      setSenderNumber("");
      setFile(null);
      setPreviewUrl(null);
      setSubmittedSuccess(false);
    }
  }, [defaultPlan, isOpen, user?.name]);

  if (!isOpen) return null;

  // Selected plan details
  const targetPlanObj = plans.find((p) => p.id === selectedPlan) || {
    id: selectedPlan,
    name: selectedPlan.toUpperCase(),
    price: selectedPlan === "pro" ? "PKR 2,500" : "PKR 6,500",
    period: "/month",
  };

  // Payment method data from settings or fallback
  const paymentMethods = settings.paymentMethods || {};
  const currentMethodData = paymentMethods[selectedMethod] || {
    enabled: true,
    accountTitle: "MetScheduler Payments",
    accountNumber: "0300-1234567",
    instructions: "Transfer the plan amount and upload the screenshot.",
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (!selected.type.startsWith("image/")) {
        toast.error("Please upload an image file (PNG, JPG, JPEG, WEBP)");
        return;
      }
      if (selected.size > 10 * 1024 * 1024) {
        toast.error("File size cannot exceed 10MB");
        return;
      }
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!transactionId.trim()) {
      toast.error("Please enter the Transaction ID / Reference Number from your receipt");
      return;
    }

    if (!file) {
      toast.error("Please upload your payment screenshot/receipt");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("targetPlan", selectedPlan);
      formData.append("paymentMethod", selectedMethod);
      formData.append("transactionId", transactionId.trim());
      formData.append("senderAccountTitle", senderTitle.trim());
      formData.append("senderAccountNumber", senderNumber.trim());
      formData.append("screenshot", file);

      await api.post("/api/billing/submit-payment", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await refreshUser();
      setSubmittedSuccess(true);
      toast.success("Payment proof submitted! Pending admin verification.");
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to submit payment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-rose-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-xs">
              <CrownIcon className="size-6 text-amber-300" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Upgrade Your Plan</h2>
              <p className="text-xs text-red-100">
                Direct Pakistani Payment via Easypaisa, JazzCash or Bank Transfer
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition"
          >
            <XIcon className="size-5" />
          </button>
        </div>

        {submittedSuccess ? (
          <div className="p-8 text-center space-y-4">
            <div className="size-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <FileCheckIcon className="size-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Proof Submitted Successfully!</h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              We have received your payment screenshot and Transaction ID{" "}
              <span className="font-semibold text-slate-800">({transactionId})</span>.
              Our admin team will verify the payment and activate your{" "}
              <span className="font-bold text-red-600 uppercase">{selectedPlan}</span> plan.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left text-xs text-amber-800 flex items-start gap-3">
              <InfoIcon className="size-5 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <p className="font-semibold">Verification Timeframe:</p>
                <p className="mt-0.5">
                  Verification usually takes 15 to 30 minutes. You can monitor your active status
                  in your Settings dashboard.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition"
            >
              Back to Dashboard
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Plan Picker */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-2">
                1. Select Upgrade Plan
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedPlan("pro")}
                  className={`p-3.5 rounded-xl border text-left transition flex items-start justify-between ${
                    selectedPlan === "pro"
                      ? "border-red-500 bg-red-50/50 ring-2 ring-red-500/20"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-slate-900">
                      <span>Pro Plan</span>
                      <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">
                        Popular
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">PKR 2,500 / month</p>
                  </div>
                  {selectedPlan === "pro" && <CheckCircle2Icon className="size-4 text-red-600" />}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPlan("business")}
                  className={`p-3.5 rounded-xl border text-left transition flex items-start justify-between ${
                    selectedPlan === "business"
                      ? "border-red-500 bg-red-50/50 ring-2 ring-red-500/20"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-slate-900">
                      <span>Business Plan</span>
                      <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-medium">
                        Agency
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">PKR 6,500 / month</p>
                  </div>
                  {selectedPlan === "business" && (
                    <CheckCircle2Icon className="size-4 text-red-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Payment Method Selector Tabs */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-2">
                2. Select Pakistani Payment Method
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "easypaisa", label: "Easypaisa", color: "text-emerald-600" },
                  { id: "jazzcash", label: "JazzCash", color: "text-amber-600" },
                  { id: "bankTransfer", label: "Bank Transfer", color: "text-blue-600" },
                  { id: "sadapay", label: "SadaPay", color: "text-teal-600" },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMethod(m.id as MethodKey)}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold transition text-center ${
                      selectedMethod === m.id
                        ? "border-red-500 bg-red-50 text-red-700 shadow-xs"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Account Details Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-semibold text-slate-700 uppercase">
                  Transfer Account Details
                </span>
                <span className="text-xs font-bold text-red-600">
                  Amount Due: {targetPlanObj.price}
                </span>
              </div>

              {selectedMethod === "bankTransfer" && currentMethodData.bankName && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Bank Name:</span>
                  <span className="font-semibold text-slate-800">
                    {currentMethodData.bankName}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Account Title:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-800">
                    {currentMethodData.accountTitle || "MetScheduler"}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(currentMethodData.accountTitle || "", "Title")}
                    className="p-1 hover:bg-slate-200 rounded text-slate-500"
                    title="Copy Title"
                  >
                    <CopyIcon className="size-3" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  {selectedMethod === "bankTransfer" ? "IBAN / Account Number:" : "Mobile Number:"}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-slate-900 bg-white px-2 py-1 rounded border border-slate-200 text-sm">
                    {currentMethodData.iban || currentMethodData.accountNumber || "03001234567"}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        currentMethodData.iban || currentMethodData.accountNumber || "",
                        "Number",
                      )
                    }
                    className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-md transition"
                    title="Copy Account Number"
                  >
                    <CopyIcon className="size-3.5" />
                  </button>
                </div>
              </div>

              {currentMethodData.instructions && (
                <div className="pt-2 text-[11px] text-slate-500 border-t border-slate-200 whitespace-pre-line leading-relaxed">
                  {currentMethodData.instructions}
                </div>
              )}
            </div>

            {/* Form Inputs: Transaction ID, Sender Info & Screenshot */}
            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
                3. Submit Payment Proof
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-600 font-medium block mb-1">
                    Transaction ID / TRX ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 29384756201"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className="w-full text-xs font-mono rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-600 font-medium block mb-1">
                    Sender Name or Phone (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Muhammad Ali / 0312-3456789"
                    value={senderTitle}
                    onChange={(e) => setSenderTitle(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-red-500"
                  />
                </div>
              </div>

              {/* Screenshot Upload with Image Preview */}
              <div>
                <label className="text-xs text-slate-600 font-medium block mb-1">
                  Upload Payment Screenshot / Receipt <span className="text-red-500">*</span>
                </label>

                {previewUrl ? (
                  <div className="relative rounded-xl border border-slate-200 bg-slate-50 p-2 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={previewUrl}
                        alt="Screenshot Preview"
                        className="size-16 rounded-lg object-cover border border-slate-200"
                      />
                      <div>
                        <p className="text-xs font-semibold text-slate-800 line-clamp-1">
                          {file?.name}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {((file?.size || 0) / (1024 * 1024)).toFixed(2)} MB • Ready to submit
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null);
                        setPreviewUrl(null);
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-white transition"
                    >
                      <XIcon className="size-4" />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-300 hover:border-red-400 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition bg-slate-50 hover:bg-red-50/20 text-center">
                    <UploadCloudIcon className="size-7 text-slate-400 mb-1" />
                    <span className="text-xs font-medium text-slate-700">
                      Click to upload screenshot from Easypaisa/JazzCash/Bank app
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      PNG, JPG, JPEG up to 10MB
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      required
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !file || !transactionId.trim()}
                className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white rounded-xl text-xs font-semibold shadow-md transition disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2Icon className="size-4 animate-spin" />
                    Uploading & Submitting...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="size-4 text-amber-300" />
                    Submit Payment for Verification
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
