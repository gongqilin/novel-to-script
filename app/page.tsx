"use client";

import { useState, useMemo } from "react";
import { dump } from "js-yaml";
import ScriptPreview from "./components/ScriptPreview";
import YamlPanel from "./components/YamlPanel";
import { useScriptEditor } from "@/lib/useScriptEditor";
import type { Script } from "@/types";

<<<<<<< Updated upstream
=======
// ─── 类型 ─────────────────────────────────────────────────────────────────────

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  files?: { name: string; size: number }[];
}

interface AttachedFile {
  name: string;
  content: string;
  size: number;
}

// ─── 主页面 ────────────────────────────────────────────────────────────────────

>>>>>>> Stashed changes
export default function HomePage() {
  const [novelText, setNovelText] = useState("");

  // 编辑状态 Hook
  const editor = useScriptEditor(null);

<<<<<<< Updated upstream
=======
  // 对话状态
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [hasScriptUpdate, setHasScriptUpdate] = useState(false);

>>>>>>> Stashed changes
  // 实时生成编辑后的 YAML
  const editedYaml = useMemo(() => {
    if (!editor.script) return "";
    try {
      return dump(editor.script, { indent: 2, lineWidth: -1, noRefs: true });
    } catch {
      return "";
    }
  }, [editor.script]);

<<<<<<< Updated upstream
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
        // 解析失败但有原始 yaml
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

  const hasResult = editor.script || rawYaml;

  return (
    <main className="min-h-screen py-8 px-4">
      {/* 标题 */}
      <header className="text-center mb-10 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          小说转剧本工具
        </h1>
        <p className="text-gray-500">
          AI 驱动 · 将小说片段转换为结构化剧本格式 · 在线编辑与修正
        </p>
=======
  // ── Agent 对话（支持文件附件） ──

  const handleChatSend = useCallback(
    async (message: string, attachedFiles: AttachedFile[]) => {
      // 合并文件内容为 novelText 并持久化
      const fileContents =
        attachedFiles.length > 0
          ? attachedFiles.map((f) => f.content).join("\n\n")
          : "";

      if (fileContents) {
        setNovelText(fileContents);
      }

      // 添加到对话历史
      setChatMessages((prev) => [
        ...prev,
        {
          role: "user",
          content: message,
          files: attachedFiles.length > 0
            ? attachedFiles.map((f) => ({ name: f.name, size: f.size }))
            : undefined,
        },
      ]);
      setChatLoading(true);
      setHasScriptUpdate(false);

      try {
        const res = await fetch("/api/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            script: editor.script ?? undefined,
            history: chatMessages,
            novelText: fileContents || novelText || undefined,
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

  const hasResult = editor.script !== null;

  return (
    <main className="h-screen flex flex-col">
      {/* ── 顶部标题栏 ── */}
      <header className="shrink-0 border-b bg-white px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">小说转剧本工具</h1>
          <p className="text-xs text-gray-400">
            AI 编剧助手 · 拖拽上传小说文件或直接对话
          </p>
        </div>
        {hasScriptUpdate && (
          <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full animate-pulse">
            剧本已更新
          </span>
        )}
>>>>>>> Stashed changes
      </header>

      {/* ── 主体：聊天 + 编辑器 ── */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* 左侧 / 上方：聊天面板 */}
        <div
          className={`flex flex-col min-h-0 ${
            hasResult ? "lg:w-[45%] lg:border-r" : "w-full max-w-3xl mx-auto"
          }`}
        >
          <ChatPanel
            onSend={handleChatSend}
            loading={chatLoading}
            messages={chatMessages}
            hasScriptUpdate={hasScriptUpdate}
          />
        </div>

        {/* 右侧 / 下方：剧本编辑器（有结果时显示） */}
        {hasResult && (
          <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <ScriptPreview
                script={editor.script}
                rawYaml={editedYaml}
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

<<<<<<< Updated upstream
      {/* 结果区域：左右分栏（桌面端）/ 上下分栏（移动端） */}
      {hasResult && !loading && (
        <div className="mt-8 flex flex-col xl:flex-row gap-6 max-w-[90rem] mx-auto">
          {/* 左侧：可编辑剧本预览 */}
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

          {/* 右侧：实时 YAML 侧边栏 */}
          <div className="xl:w-96 shrink-0">
            <div className="xl:sticky xl:top-4 xl:max-h-[calc(100vh-2rem)]">
=======
            {/* YAML 面板（底部固定） */}
            <div className="shrink-0 border-t bg-white px-4 py-3 max-h-48 overflow-y-auto">
>>>>>>> Stashed changes
              <YamlPanel
                yaml={editedYaml}
                title={editor.script?.meta?.title}
              />
            </div>
          </div>
<<<<<<< Updated upstream
        </div>
      )}
=======
        )}
      </div>
>>>>>>> Stashed changes
    </main>
  );
}
