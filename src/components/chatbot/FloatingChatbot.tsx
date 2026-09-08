import React, { useState, useEffect, useRef } from "react";
import { Bot, X, RotateCcw, Maximize2, Minimize2, Sparkles } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

const DEFAULT_N8N_URL = "https://just24you.app.n8n.cloud/webhook/7bb8ab17-7316-4852-8367-162ad26929df/chat";

interface FloatingChatbotProps {
  initialChatUrl?: string;
  botName?: string;
  botSubtitle?: string;
  defaultOpen?: boolean;
}

export const FloatingChatbot: React.FC<FloatingChatbotProps> = ({
  initialChatUrl,
  botName = "Just24You Assistant",
  botSubtitle = "AI Support & Diagnostics",
  defaultOpen = false,
}) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const chatUrl = initialChatUrl || import.meta.env.VITE_N8N_CHAT_URL || DEFAULT_N8N_URL;

  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [mountKey, setMountKey] = useState(0);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // 1. Ensure n8n chat style.css is attached to the document
  useEffect(() => {
    const linkId = "n8n-chat-style";
    if (!document.getElementById(linkId)) {
      const link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      link.href = "https://cdn.jsdelivr.net/npm/@n8n/chat/dist/style.css";
      document.head.appendChild(link);
    }
  }, []);

  // 2. Initialize n8n chat whenever opened or reloaded
  useEffect(() => {
    if (!isOpen || !chatContainerRef.current) return;

    let isSubscribed = true;
    setIsLoading(true);

    // Clear previous container content
    chatContainerRef.current.innerHTML = "";

    const initN8nChat = async () => {
      try {
        // Dynamically import @n8n/chat ESM bundle
        const dynamicImport = new Function("url", "return import(url)");
        const { createChat } = await dynamicImport(
          "https://cdn.jsdelivr.net/npm/@n8n/chat/dist/chat.bundle.es.js"
        );

        if (!isSubscribed || !chatContainerRef.current) return;

        createChat({
          webhookUrl: chatUrl,
          target: chatContainerRef.current,
          mode: "fullscreen",
          showWelcomeScreen: false,
          defaultLanguage: "en",
          initialMessages: [
            "Hi! I am Just24You Assistant. How can I help you today?"
          ],
          i18n: {
            en: {
              title: botName,
              subtitle: botSubtitle,
              inputPlaceholder: `Message ${botName}...`,
            },
          },
        });

        setIsLoading(false);
      } catch (err) {
        console.error("Failed to initialize n8n chat:", err);
        setIsLoading(false);
      }
    };

    initN8nChat();

    return () => {
      isSubscribed = false;
    };
  }, [isOpen, mountKey, chatUrl, botName, botSubtitle]);

  // Keyboard shortcut: Alt+A to toggle open/close, Esc to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === "a" || e.key === "A")) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleReload = () => {
    setMountKey((prev) => prev + 1);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none select-none">
      {/* Floating Chat Modal */}
      {isOpen && (
        <div
          className={`pointer-events-auto mb-4 flex flex-col overflow-hidden rounded-3xl transition-all duration-300 ease-in-out ${
            isDark
              ? "bg-[#0e1117] border border-gray-800 shadow-[0_20px_60px_rgba(0,0,0,0.8)] text-gray-100"
              : "bg-white border border-slate-200 shadow-[0_20px_60px_rgba(15,23,42,0.18)] text-slate-800"
          } ${
            isExpanded
              ? "w-[92vw] h-[85vh] max-w-4xl"
              : "w-[370px] sm:w-[410px] h-[580px] max-h-[82vh]"
          }`}
          style={{
            // Adaptive n8n CSS Variable overrides
            ...(isDark
              ? {
                  ["--chat--color-primary" as any]: "#8b5cf6",
                  ["--chat--color-primary-shade-50" as any]: "#7c3aed",
                  ["--chat--color-primary-tint-50" as any]: "#a78bfa",
                  ["--chat--color-dark" as any]: "#090b10",
                  ["--chat--color-dark-shade-50" as any]: "#040507",
                  ["--chat--color-light" as any]: "#131822",
                  ["--chat--color-light-shade-50" as any]: "#0e131b",
                  ["--chat--color-font" as any]: "#f3f4f6",
                  ["--chat--color-typing" as any]: "#8b5cf6",
                  ["--chat--color-secondary" as any]: "#1e293b",
                }
              : {
                  ["--chat--color-primary" as any]: "#0f766e",
                  ["--chat--color-primary-shade-50" as any]: "#115e59",
                  ["--chat--color-primary-tint-50" as any]: "#14b8a6",
                  ["--chat--color-dark" as any]: "#0f172a",
                  ["--chat--color-dark-shade-50" as any]: "#020617",
                  ["--chat--color-light" as any]: "#ffffff",
                  ["--chat--color-light-shade-50" as any]: "#f8fafc",
                  ["--chat--color-font" as any]: "#0f172a",
                  ["--chat--color-typing" as any]: "#0f766e",
                  ["--chat--color-secondary" as any]: "#e2e8f0",
                }),
          }}
        >
          {/* Header */}
          <div className="relative flex items-center justify-between px-4 py-3.5 bg-gradient-to-r from-teal-600 via-indigo-600 to-purple-600 text-white select-none shadow-md z-20">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md border border-white/25 shadow-inner">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold tracking-wide flex items-center gap-1.5 leading-tight text-white">
                  {botName}
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                </h3>
                <p className="flex items-center text-xs font-medium text-purple-100/90 gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  {botSubtitle}
                </p>
              </div>
            </div>

            {/* Header Action Controls */}
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={handleReload}
                className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/20 transition-colors"
                title="Reset conversation"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/20 transition-colors hidden sm:block"
                title={isExpanded ? "Restore size" : "Maximize"}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/20 transition-colors"
                title="Close (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body Section */}
          <div
            className={`relative flex-1 flex flex-col overflow-hidden select-text ${
              isDark ? "bg-[#090b10]" : "bg-slate-50"
            }`}
          >
            {/* Loading Spinner */}
            {isLoading && (
              <div
                className={`absolute inset-0 z-10 flex flex-col items-center justify-center backdrop-blur-sm ${
                  isDark
                    ? "bg-[#090b10]/85 text-gray-300"
                    : "bg-white/85 text-slate-700"
                }`}
              >
                <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
                <span className="text-xs tracking-wider uppercase font-semibold">
                  Connecting Just24You AI...
                </span>
              </div>
            )}

            {/* n8n Native Chat Container */}
            <div
              ref={chatContainerRef}
              className="w-full h-full [&_.chat-header]:hidden [&_.chat-window]:h-full [&_.chat-window]:w-full [&_.chat-window]:max-w-none [&_.chat-window]:border-0 [&_.chat-window]:rounded-none [&_.chat-window]:shadow-none [&_.chat-layout]:h-full"
            />
          </div>
        </div>
      )}

      {/* Floating Action Button (FAB) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="pointer-events-auto relative group flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-pink-500 via-rose-500 to-purple-600 text-white shadow-xl hover:shadow-pink-500/35 hover:scale-105 active:scale-95 transition-all duration-200"
        aria-label="Toggle Just24You Assistant"
        title="Open Just24You Assistant (Alt+A)"
      >
        {isOpen ? (
          <X className="h-6 w-6 text-white transition-transform duration-200 rotate-0 group-hover:rotate-90" />
        ) : (
          <>
            <Bot className="h-7 w-7 text-white" />
            <span className="absolute top-0 right-0 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white"></span>
            </span>
          </>
        )}
      </button>
    </div>
  );
};
