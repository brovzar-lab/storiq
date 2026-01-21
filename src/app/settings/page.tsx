"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAI } from "@/lib/ai/context";
import { useAppStore } from "@/lib/store";

interface ServerConfig {
  isConfigured: boolean;
  provider: string | null;
  source: "server" | null;
}

export default function SettingsPage() {
  const router = useRouter();
  const { isConfigured: clientConfigured, isValidating, providerName: clientProvider, setApiKey, clearApiKey } = useAI();
  const resetStore = useAppStore((state) => state.reset);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [serverConfig, setServerConfig] = useState<ServerConfig | null>(null);

  // Check server-side configuration on mount
  useEffect(() => {
    const checkServerConfig = async () => {
      try {
        const response = await fetch("/api/check-config");
        if (response.ok) {
          const config = await response.json();
          setServerConfig(config);
        }
      } catch (err) {
        console.error("Failed to check server config:", err);
      }
    };
    checkServerConfig();
  }, []);

  // Determine effective configuration status
  const isConfigured = clientConfigured || serverConfig?.isConfigured;
  const providerName = clientConfigured
    ? clientProvider
    : serverConfig?.isConfigured
      ? `${serverConfig.provider} (server)`
      : "Not configured";
  const configSource = clientConfigured ? "browser" : serverConfig?.isConfigured ? "server (.env.local)" : null;

  const handleSaveApiKey = async () => {
    setError("");
    setSuccess(false);

    if (!apiKeyInput.trim()) {
      setError("Please enter an API key");
      return;
    }

    if (!apiKeyInput.startsWith("sk-ant-")) {
      setError("Invalid API key format. Anthropic API keys start with 'sk-ant-'");
      return;
    }

    const isValid = await setApiKey(apiKeyInput);

    if (isValid) {
      setSuccess(true);
      setApiKeyInput("");
    } else {
      setError("Invalid API key. Please check your key and try again.");
    }
  };

  const handleClearApiKey = () => {
    clearApiKey();
    setSuccess(false);
    setError("");
  };

  const handleResetData = () => {
    if (!resetConfirm) {
      setResetConfirm(true);
      return;
    }
    // Clear all app data (but NOT the AI config)
    resetStore();
    // Clear localStorage for screenplay data (the store uses "storiq-storage")
    localStorage.removeItem("storiq-storage");
    setResetConfirm(false);
    // Redirect to home
    router.push("/");
  };

  return (
    <main className="min-h-screen bg-[#0f0f0f]">
      {/* Header */}
      <header className="border-b border-[#3d3a38] bg-[#1a1816]">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-[#f5f5f5]">Settings</h1>
              <p className="text-sm text-[#78716c]">Configure your AI provider</p>
            </div>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 text-sm text-[#78716c] hover:text-[#a8a29e] transition-colors"
            >
              Back
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        {/* AI Provider Section */}
        <div className="bg-[#1a1816] rounded-xl border border-[#3d3a38] p-6 mb-6">
          <h2 className="text-lg font-semibold text-[#f5f5f5] mb-4">AI Provider</h2>

          {/* Current Status */}
          <div className="mb-6 p-4 bg-[#242220] rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-[#78716c]">Status</div>
                <div className="flex items-center gap-2 mt-1">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isConfigured ? "bg-green-500" : "bg-[#78716c]"
                    }`}
                  />
                  <span className="text-[#f5f5f5]">
                    {isConfigured ? "Connected" : "Not configured"}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-[#78716c]">Provider</div>
                <div className="text-[#f5f5f5] mt-1">{providerName}</div>
              </div>
            </div>
            {configSource && (
              <div className="mt-3 pt-3 border-t border-[#3d3a38]">
                <div className="text-xs text-[#78716c]">
                  API key source: <span className="text-[#a8a29e]">{configSource}</span>
                </div>
              </div>
            )}
          </div>

          {/* Server Config Notice */}
          {serverConfig?.isConfigured && !clientConfigured && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-sm text-green-400">
                Using API key from server environment (.env.local). You can optionally add a different key below to override it.
              </p>
            </div>
          )}

          {/* API Key Input */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#a8a29e] mb-2">
                Anthropic API Key
              </label>
              <p className="text-sm text-[#78716c] mb-3">
                Enter your Anthropic API key to enable AI-powered analysis. Your key is stored
                locally and never sent to our servers.
              </p>
              <div className="flex gap-3">
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder={clientConfigured ? "••••••••••••••••" : "sk-ant-..."}
                  className="flex-1 px-4 py-2 bg-[#242220] border border-[#3d3a38] rounded-lg text-[#f5f5f5] placeholder-[#525252] focus:outline-none focus:border-[#d4a574]"
                  disabled={isValidating}
                />
                <button
                  onClick={handleSaveApiKey}
                  disabled={isValidating || !apiKeyInput.trim()}
                  className="px-6 py-2 bg-[#d4a574] text-[#0f0f0f] rounded-lg font-medium hover:bg-[#c49664] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isValidating ? "Validating..." : "Save"}
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="mt-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <p className="text-sm text-green-400">
                    API key saved and validated successfully!
                  </p>
                </div>
              )}
            </div>

            {/* Clear Key Button */}
            {clientConfigured && (
              <div className="pt-4 border-t border-[#3d3a38]">
                <button
                  onClick={handleClearApiKey}
                  className="px-4 py-2 text-sm text-[#ef4444] hover:text-red-300 transition-colors"
                >
                  Remove Browser API Key
                </button>
                {serverConfig?.isConfigured && (
                  <p className="mt-2 text-xs text-[#78716c]">
                    This will revert to using the server-configured API key.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Get API Key Info */}
        <div className="bg-[#1a1816] rounded-xl border border-[#3d3a38] p-6">
          <h2 className="text-lg font-semibold text-[#f5f5f5] mb-4">How to Get an API Key</h2>
          <ol className="space-y-3 text-sm text-[#a8a29e]">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#d4a574]/20 text-[#d4a574] flex items-center justify-center text-xs font-medium">
                1
              </span>
              <span>
                Visit{" "}
                <a
                  href="https://console.anthropic.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#d4a574] hover:underline"
                >
                  console.anthropic.com
                </a>{" "}
                and create an account
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#d4a574]/20 text-[#d4a574] flex items-center justify-center text-xs font-medium">
                2
              </span>
              <span>Navigate to API Keys in your account settings</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#d4a574]/20 text-[#d4a574] flex items-center justify-center text-xs font-medium">
                3
              </span>
              <span>Create a new API key and copy it</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#d4a574]/20 text-[#d4a574] flex items-center justify-center text-xs font-medium">
                4
              </span>
              <span>Paste the key in the field above</span>
            </li>
          </ol>

          <div className="mt-6 p-4 bg-[#242220] rounded-lg">
            <h3 className="text-sm font-medium text-[#f5f5f5] mb-2">Privacy & Security</h3>
            <ul className="text-sm text-[#78716c] space-y-1">
              <li>• Your API key is stored only in your browser&apos;s local storage</li>
              <li>• API calls are made directly to Anthropic from your browser</li>
              <li>• We never see or store your API key or screenplay content</li>
              <li>• You can remove your key at any time</li>
            </ul>
          </div>
        </div>

        {/* Reset Data Section */}
        <div className="bg-[#1a1816] rounded-xl border border-red-500/30 p-6 mt-6">
          <h2 className="text-lg font-semibold text-[#f5f5f5] mb-4">Reset Screenplay Data</h2>
          <p className="text-sm text-[#78716c] mb-4">
            Clear all stored screenplay data including sequences, genre selections, and soul analysis.
            This will NOT remove your API key configuration.
          </p>
          <div className="flex items-center gap-4">
            <button
              onClick={handleResetData}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                resetConfirm
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
              }`}
            >
              {resetConfirm ? "Click Again to Confirm" : "Reset Screenplay Data"}
            </button>
            {resetConfirm && (
              <button
                onClick={() => setResetConfirm(false)}
                className="px-4 py-2 text-sm text-[#78716c] hover:text-[#a8a29e]"
              >
                Cancel
              </button>
            )}
          </div>
          {resetConfirm && (
            <p className="mt-3 text-sm text-red-400">
              This will clear your screenplay data but keep your API key settings.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
