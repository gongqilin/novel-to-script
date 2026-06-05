"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface AttachedFile {
  name: string;
  content: string;
  size: number;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  files?: { name: string; size: number }[];
}

interface ChatPanelProps {
  onSend: (message: string, attachedFiles: AttachedFile[]) => Promise<void>;
  loading: boolean;
  messages: ChatMessage[];
  hasScriptUpdate: boolean;
}

/** 格式化文件大小 */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

/** AI 编剧助手 —— 聊天优先界面，支持拖拽 / 粘贴上传文件 */
export default function ChatPanel({
  onSend,
  loading,
  messages,
  hasScriptUpdate,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<AttachedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // 聚焦输入框
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // ── 文件读取 ──

  const readFiles = useCallback(async (fileList: FileList | File[]) => {
    const allowed = [".txt", ".md", ".markdown"];
    const newFiles: AttachedFile[] = [];

    for (const file of fileList) {
      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      if (!allowed.includes(ext)) {
        alert(`不支持的文件类型: ${file.name}。仅支持 .txt / .md`);
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert(`文件过大: ${file.name}。最大支持 10MB`);
        continue;
      }
      const content = await file.text();
      newFiles.push({ name: file.name, content, size: file.size });
    }

    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  // ── 拖拽事件 ──

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      await readFiles(e.dataTransfer.files);
    }
  };

  // ── 发送消息 ──

  const handleSend = async () => {
    const trimmed = input.trim();
    const hasFiles = files.length > 0;
    if (!trimmed && !hasFiles) return;
    if (loading) return;

    const currentFiles = [...files];
    setInput("");
    setFiles([]);
    await onSend(trimmed || "请处理附件中的小说文本", currentFiles);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── 移出文件 ──

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div
      className="flex flex-col h-full bg-white rounded-xl border shadow-sm"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* 拖拽覆盖层 */}
      {isDragOver && (
        <div className="absolute inset-0 bg-blue-50/90 z-50 flex items-center justify-center rounded-xl border-2 border-dashed border-blue-400">
          <div className="text-center">
            <svg
              className="w-12 h-12 text-blue-400 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-blue-600 font-medium">释放文件以上传</p>
            <p className="text-blue-400 text-sm">支持 .txt / .md（最大 10MB）</p>
          </div>
        </div>
      )}

      {/* ── 消息列表 ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <svg
              className="w-12 h-12 text-gray-300 mx-auto mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <p className="text-gray-500 font-medium mb-1">
              欢迎使用 AI 编剧助手
            </p>
            <p className="text-gray-400 text-sm">
              拖拽小说文件到此处，或直接输入文字开始对话
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2.5 text-sm ${
                msg.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {/* 文件附件 */}
              {msg.files && msg.files.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1">
                  {msg.files.map((f, fi) => (
                    <span
                      key={fi}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                        msg.role === "user"
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      📎 {f.name} ({formatSize(f.size)})
                    </span>
                  ))}
                </div>
              )}
              {/* 文本内容 */}
              {msg.role === "user" && msg.content ? (
                msg.content
              ) : msg.role === "assistant" && msg.content.includes("```") ? (
                renderAssistantContent(msg.content)
              ) : (
                <span className="whitespace-pre-wrap">{msg.content}</span>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2.5 text-sm text-gray-500 flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
              <span className="inline-block w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.15s]" />
              <span className="inline-block w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.3s]" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── 文件附件预览条 ── */}
      {files.length > 0 && (
        <div className="px-4 py-2 border-t bg-gray-50 flex flex-wrap gap-2">
          {files.map((f, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border rounded-full text-xs text-gray-700"
            >
              📄 {f.name} ({formatSize(f.size)})
              <button
                onClick={() => removeFile(i)}
                className="text-gray-400 hover:text-red-500"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      {/* ── 输入区域 ── */}
      <div className="px-4 py-3 border-t flex items-end gap-2">
        {/* 文件上传按钮 */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          className="shrink-0 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
          title="上传小说文件"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
          </svg>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.md"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) readFiles(e.target.files);
            e.target.value = "";
          }}
        />

        {/* 文本输入框 */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            files.length > 0
              ? "对 AI 编剧描述你想要的处理方式..."
              : "输入消息，或拖拽小说文件到这里..."
          }
          rows={2}
          disabled={loading}
          className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
        />

        {/* 发送按钮 */}
        <button
          onClick={handleSend}
          disabled={loading || (!input.trim() && files.length === 0)}
          className="shrink-0 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          发送
        </button>
      </div>
    </div>
  );
}

// ─── 渲染助理消息中的 YAML 代码块 ──────────────────────────────────────────────

function renderAssistantContent(content: string) {
  const parts = content.split(/(```[\s\S]*?```)/g);
  return parts.map((part, i) => {
    if (part.startsWith("```")) {
      const inner = part
        .replace(/```yaml\s*/, "")
        .replace(/```$/, "")
        .replace(/```\s*$/, "");
      return (
        <pre
          key={i}
          className="bg-gray-200 rounded p-2 mt-1 text-xs font-mono overflow-x-auto whitespace-pre-wrap"
        >
          {inner}
        </pre>
      );
    }
    return (
      <span key={i} className="whitespace-pre-wrap">
        {part}
      </span>
    );
  });
}
