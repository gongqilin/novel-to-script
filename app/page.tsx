"use client";

import { useState, useMemo, useCallback } from "react";
import { dump } from "js-yaml";
import NovelInput from "./components/NovelInput";
import ScriptPreview from "./components/ScriptPreview";
import YamlPanel from "./components/YamlPanel";
import ChatPanel from "./components/ChatPanel";
import { useScriptEditor } from "@/lib/useScriptEditor";
import type { Script } from "@/types";

// ─── 对话消息类型 ──────────────────────────────────────────────────────────────

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// ─── 主页面 ────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [novelText, setNovelText] = useState("");
  const [loading, setLoading] = useState(false);
  const [rawYaml, setRawYaml] = useState("");
  const [error, setError] = useState("");

  // 编辑状态 Hook
  const editor = useScriptEditor(null);

  // 对话面板状态
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [hasScriptUpdate, setHasScriptUpdate] = useState(false);

  // 实时生成编辑后的 YAML
  const editedYaml = useMemo(() => {
    if (!editor.script) return "";
    try {
      return dump(editor.script, { indent: 2, lineWidth: -1, noRefs: true });
    } catch {
      return "";
    }
  }, [editor.script]);

  // ── 生成剧本（原有流程） ──

  const handleSubmit = async () => {
    if (!novelText.trim()) {
      setError("请输入小说文本");
      return;
    }

    setLoading(true);
    setError("");
    setRawYaml("");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: novelText }),
      });

      const json = await res.json();

      if (!json.success) {
        setError(json.error || "请求失败");
        return;
      }

      // 同步到编辑 Hook（触发实时 YAML 更新）
      if (json.data) {
        editor.setScript(json.data as Script);
      } else {
        editor.setScript(null);
      }
      if (json.yaml) {
        setRawYaml(json.yaml);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "网络请求失败，请检查网络连接"
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Agent 对话（带记忆 + 小说上下文） ──

  const handleChatSend = useCallback(
    async (message: string) => {
      // 立即显示用户消息
      setChatMessages((prev) => [...prev, { role: "user", content: message }]);
      setChatLoading(true);
      setHasScriptUpdate(false);

      try {
        const res = await fetch("/api/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            script: editor.script ?? undefined,
            // 传历史记录（最新 20 条）+ 原始小说
            history: chatMessages,
            novelText: novelText || undefined,
          }),
        });

        const json = await res.json();

        if (!json.success) {
          setChatMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: `抱歉，处理请求时出错：${json.error || "未知错误"}`,
            },
          ]);
          return;
        }

        const { message: reply, script: updatedScript } = json.data;

        setChatMessages((prev) => [
          ...prev,
          { role: "assistant", content: reply || "处理完成。" },
        ]);

        // 如果 Agent 返回了更新后的剧本，同步到编辑器
        if (updatedScript) {
          editor.setScript(updatedScript as Script);
          setHasScriptUpdate(true);
        }
      } catch (err) {
        setChatMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `网络请求失败：${
              err instanceof Error ? err.message : "请检查网络连接"
            }`,
          },
        ]);
      } finally {
        setChatLoading(false);
      }
    },
    [editor, chatMessages, novelText]
  );

  const hasResult = editor.script || rawYaml;

  return (
    <main className="min-h-screen py-8 px-4 pb-20">
      {/* 标题 */}
      <header className="text-center mb-10 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          小说转剧本工具
        </h1>
        <p className="text-gray-500">
          AI 驱动 · 将小说片段转换为结构化剧本格式 · 在线编辑与修正
        </p>
      </header>

      {/* 输入区 */}
      <div className="max-w-4xl mx-auto">
        <NovelInput
          value={novelText}
          onChange={setNovelText}
          onSubmit={handleSubmit}
        />
      </div>

      {/* 加载状态 */}
      {loading && (
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-4 bg-blue-50 rounded-lg border border-blue-200">
            <svg
              className="animate-spin h-5 w-5 text-blue-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <span className="text-blue-700 font-medium">正在生成剧本...</span>
          </div>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="mt-6 p-4 max-w-4xl mx-auto bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* 结果区域 */}
      {hasResult && !loading && (
        <div className="mt-8 flex flex-col xl:flex-row gap-6 max-w-[90rem] mx-auto">
          <div className="flex-1 min-w-0">
            <ScriptPreview
              script={editor.script}
              rawYaml={rawYaml}
              onUpdateCharacter={editor.updateCharacter}
              onUpdateScene={editor.updateScene}
              onDeleteScene={editor.deleteScene}
              onAddScene={editor.addScene}
              onAddBeat={editor.addBeat}
              onUpdateBeat={editor.updateBeat}
              onDeleteBeat={editor.deleteBeat}
              onMoveScene={editor.moveScene}
              onMoveBeat={editor.moveBeat}
            />
          </div>
          <div className="xl:w-96 shrink-0">
            <div className="xl:sticky xl:top-4 xl:max-h-[calc(100vh-2rem)]">
              <YamlPanel
                yaml={editedYaml}
                title={editor.script?.meta?.title}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Agent 对话面板 ── */}
      <ChatPanel
        isOpen={chatOpen}
        onToggle={() => {
          setChatOpen(!chatOpen);
          if (hasScriptUpdate && !chatOpen) {
            setTimeout(() => setHasScriptUpdate(false), 3000);
          }
        }}
        onSend={handleChatSend}
        loading={chatLoading}
        messages={chatMessages}
        hasScriptUpdate={hasScriptUpdate}
      />
    </main>
  );
}
