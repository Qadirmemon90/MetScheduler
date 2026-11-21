/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import {
  BotIcon,
  CheckCircle2Icon,
  CopyIcon,
  KeyIcon,
  Loader2Icon,
  RefreshCwIcon,
  TerminalIcon,
  Wand2Icon,
  XIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/axios";

type McpIntegrationModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function McpIntegrationModal({ isOpen, onClose }: McpIntegrationModalProps) {
  const [loading, setLoading] = useState(true);
  const [mcpData, setMcpData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"desktop" | "web" | "test">("desktop");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [regenerating, setRegenerating] = useState(false);

  const fetchCredentials = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/mcp/my-credentials");
      setMcpData(data);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load MCP credentials");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCredentials();
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const handleRegenerate = async () => {
    if (!window.confirm("Are you sure? Any existing ChatGPT connections with the old key will need to be updated.")) {
      return;
    }
    setRegenerating(true);
    try {
      const { data } = await api.post("/api/mcp/regenerate-key");
      toast.success("New MCP Key generated!");
      setMcpData((prev: any) => ({ ...prev, mcpApiKey: data.mcpApiKey }));
      await fetchCredentials();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to regenerate key");
    } finally {
      setRegenerating(false);
    }
  };

  const runTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const { data } = await api.post("/api/mcp", {
        jsonrpc: "2.0",
        id: "test-call",
        method: "initialize",
        params: {},
        apiKey: mcpData?.mcpApiKey,
      });

      if (data?.result?.serverInfo) {
        setTestResult({
          success: true,
          message: `Connected successfully! Server: ${data.result.serverInfo.name} v${data.result.serverInfo.version}`,
          details: data.result,
        });
      } else if (data?.error) {
        setTestResult({
          success: false,
          message: data.error.message || "MCP returned an error",
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.response?.data?.error?.message || err?.message || "Connection failed",
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-xs">
              <BotIcon className="size-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                ChatGPT MCP Integration
                <span className="text-[10px] bg-emerald-400 text-slate-900 font-bold px-2 py-0.5 rounded-full uppercase">
                  Live
                </span>
              </h2>
              <p className="text-xs text-emerald-100">
                Connect ChatGPT directly to schedule posts and manage your social accounts
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

        {loading ? (
          <div className="p-12 text-center space-y-3">
            <Loader2Icon className="size-8 text-emerald-600 animate-spin mx-auto" />
            <p className="text-sm text-slate-500">Generating your MCP connection keys...</p>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            {/* User MCP API Key Bar */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <KeyIcon className="size-3.5 text-emerald-600" />
                  Your Personal MCP API Key
                </span>
                <button
                  type="button"
                  onClick={handleRegenerate}
                  disabled={regenerating}
                  className="text-[11px] text-slate-500 hover:text-red-600 flex items-center gap-1 transition"
                >
                  <RefreshCwIcon className={`size-3 ${regenerating ? "animate-spin" : ""}`} />
                  Regenerate Key
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={mcpData?.mcpApiKey || ""}
                  className="flex-1 font-mono text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 select-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(mcpData?.mcpApiKey || "", "MCP API Key")}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition shadow-xs"
                >
                  <CopyIcon className="size-3.5" />
                  Copy Key
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <button
                type="button"
                onClick={() => setActiveTab("desktop")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  activeTab === "desktop"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <TerminalIcon className="size-3.5" />
                ChatGPT / Claude Desktop
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("web")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  activeTab === "web"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Wand2Icon className="size-3.5" />
                ChatGPT Web (Custom GPT)
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("test")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  activeTab === "test"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <CheckCircle2Icon className="size-3.5" />
                Test MCP Connection
              </button>
            </div>

            {/* Tab 1: Desktop JSON Config */}
            {activeTab === "desktop" && (
              <div className="space-y-3">
                <p className="text-xs text-slate-600 leading-relaxed">
                  To connect MetScheduler to <strong>ChatGPT Desktop</strong> or{" "}
                  <strong>Claude Desktop</strong>, add this configuration block into your config
                  file:
                </p>

                <div className="text-[11px] font-mono text-slate-500 bg-slate-100 p-2 rounded-lg">
                  Windows Path:{" "}
                  <code className="text-slate-800">%APPDATA%\OpenAI\chatgpt_desktop_config.json</code>
                </div>

                <div className="relative">
                  <pre className="text-[11px] font-mono bg-slate-900 text-slate-100 p-3.5 rounded-xl overflow-x-auto max-h-48">
                    {JSON.stringify(mcpData?.desktopConfig, null, 2)}
                  </pre>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        JSON.stringify(mcpData?.desktopConfig, null, 2),
                        "Desktop MCP Configuration",
                      )
                    }
                    className="absolute top-2 right-2 px-2.5 py-1 bg-white/20 hover:bg-white/30 text-white rounded text-[10px] font-medium backdrop-blur-xs flex items-center gap-1"
                  >
                    <CopyIcon className="size-3" />
                    Copy JSON
                  </button>
                </div>
              </div>
            )}

            {/* Tab 2: ChatGPT Web Custom GPT Actions */}
            {activeTab === "web" && (
              <div className="space-y-3">
                <p className="text-xs text-slate-600 leading-relaxed">
                  You can connect MetScheduler to <strong>ChatGPT Plus / Team (Web)</strong> as a
                  Custom GPT Action in 2 steps:
                </p>

                <ol className="text-xs text-slate-600 space-y-2 list-decimal list-inside bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <li>In ChatGPT, open <strong>Explore GPTs</strong> &rarr; <strong>Create a GPT</strong>.</li>
                  <li>Click <strong>Configure</strong> &rarr; <strong>Add Actions</strong>.</li>
                  <li>
                    Paste the <strong>OpenAPI Schema URL</strong> below into{" "}
                    <em>"Import from URL"</em>:
                  </li>
                </ol>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={mcpData?.openApiSpecUrl || ""}
                    className="flex-1 font-mono text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 select-all outline-none"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(mcpData?.openApiSpecUrl || "", "OpenAPI Schema URL")
                    }
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
                  >
                    <CopyIcon className="size-3.5" />
                    Copy URL
                  </button>
                </div>

                <p className="text-[11px] text-slate-500">
                  Authentication in Custom GPT: Select <strong>Bearer Token</strong> and paste your
                  MCP API key from above.
                </p>
              </div>
            )}

            {/* Tab 3: Test MCP Connection */}
            {activeTab === "test" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-600">
                    Verify that your MCP API endpoint is responding properly with your key:
                  </p>
                  <button
                    type="button"
                    onClick={runTestConnection}
                    disabled={testing}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-xs"
                  >
                    {testing ? (
                      <>
                        <Loader2Icon className="size-3.5 animate-spin" />
                        Pinging MCP...
                      </>
                    ) : (
                      <>
                        <CheckCircle2Icon className="size-3.5" />
                        Test Connection Now
                      </>
                    )}
                  </button>
                </div>

                {testResult && (
                  <div
                    className={`p-4 rounded-xl border text-xs ${
                      testResult.success
                        ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                        : "bg-red-50 border-red-200 text-red-900"
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold mb-1">
                      {testResult.success ? "✅ Status: Healthy" : "❌ Connection Failed"}
                    </div>
                    <p>{testResult.message}</p>
                    {testResult.details && (
                      <pre className="mt-2 text-[10px] bg-white/70 p-2 rounded border border-emerald-200 overflow-x-auto">
                        {JSON.stringify(testResult.details, null, 2)}
                      </pre>
                    )}
                  </div>
                )}

                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2">
                  <span className="text-[11px] font-semibold text-slate-700 uppercase">
                    Available MCP Tools for your account:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <code>metscheduler_list_accounts</code>
                      <p className="text-[10px] text-slate-500 mt-0.5">List social media accounts</p>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <code>metscheduler_schedule_post</code>
                      <p className="text-[10px] text-slate-500 mt-0.5">Schedule new post</p>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <code>metscheduler_list_posts</code>
                      <p className="text-[10px] text-slate-500 mt-0.5">List queue & past posts</p>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <code>metscheduler_publish_now</code>
                      <p className="text-[10px] text-slate-500 mt-0.5">Live instant publish</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="pt-2 flex justify-end border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
