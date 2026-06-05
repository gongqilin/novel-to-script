"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  onSend: (message: string) => Promise<void>;
  loading: boolean;
  messages: Message[];
  hasScriptUpdate: boolean;
}

/** Agent 对话面板 —— 可折叠，显示对话历史，底部有输入框 */
export default function ChatPanel({
  isOpen,
  onToggle,
  onSend,
  loading,
  messages,
  hasScriptUpdate,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 新消息到来时自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 面板展开时聚焦输入框
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    setInput("");
    await onSend(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* 折叠状态：浮动按钮 */}
      {!isOpen && (
        <div className="flex justify-center pb-4">
          <button
            onClick={onToggle}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border shadow-lg rounded-full hover:shadow-xl transition-shadow text-sm font-medium text-gray-700"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            AI 编剧助手
            {hasScriptUpdate && (
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            )}
          </button>
        </div>
      )}

      {/* 展开状态：完整对话面板 */}
      {isOpen && (
        <div className="bg-white border-t shadow-2xl mx-auto max-w-4xl rounded-t-xl">
          {/* 面板头部 */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50 rounded-t-xl">
            <div className="flex items-center gap-2">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-blue-600"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span className="font-semibold text-gray-800 text-sm">
                AI 编剧助手
              </span>
              {hasScriptUpdate && (
                <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  剧本已更新
                </span>
              )}
            </div>
            <button
              onClick={onToggle}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <line x1="5" y1="5" x2="15" y2="15" />
                <line x1="15" y1="5" x2="5" y2="15" />
              </svg>
            </button>
          </div>

          {/* 消息列表 */}
          <div className="h-64 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-8">
                对 AI 编剧说出你的要求，例如：帮我生成前5章的剧本初稿
              </p>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {/* 助理消息中的 YAML 代码块用等宽字体 */}
                  {msg.role === "assistant" && msg.content.includes("```")
                    ? renderAssistantContent(msg.content)
                    : msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-4 py-2 text-sm text-gray-500 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <span className="inline-block w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                  <span className="inline-block w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.3s]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 输入区 */}
          <div className="px-4 py-3 border-t flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="对 AI 编剧说出你的要求，例如：帮我生成前5章的剧本初稿"
              rows={2}
              disabled={loading}
              className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="shrink-0 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              发送
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 渲染助理消息内容，将 YAML 代码块用等宽字体 + 浅色背景展示，
 * 其余部分正常渲染
 */
function renderAssistantContent(content: string) {
  const parts = content.split(/(```[\s\S]*?```)/g);
  return parts.map((part, i) => {
    if (part.startsWith("```")) {
      const inner = part.replace(/```yaml\s*/, "").replace(/```$/, "").replace(/```\s*$/, "");
      return (
        <pre
          key={i}
          className="bg-gray-200 rounded p-2 mt-1 text-xs font-mono overflow-x-auto"
        >
          {inner}
        </pre>
      );
    }
    return <span key={i}>{part}</span>;
  });
}
