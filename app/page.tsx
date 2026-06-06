"use client";

import { useState, useMemo, useCallback } from "react";
import { dump } from "js-yaml";
import ScriptPreview from "./components/ScriptPreview";
import YamlPanel from "./components/YamlPanel";
import ChatPanel from "./components/ChatPanel";
import { useScriptEditor } from "@/lib/useScriptEditor";
import type { Script } from "@/types";

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

export default function HomePage() {
  const [novelText, setNovelText] = useState("");
  const editor = useScriptEditor(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [hasScriptUpdate, setHasScriptUpdate] = useState(false);

  const editedYaml = useMemo(() => {
    if (!editor.script) return "";
    try {
      return dump(editor.script, { indent: 2, lineWidth: -1, noRefs: true });
    } catch {
      return "";
    }
  }, [editor.script]);

  const handleChatSend = useCallback(
    async (message: string, attachedFiles: AttachedFile[]) => {
      const fileContents =
        attachedFiles.length > 0
          ? attachedFiles.map((f) => f.content).join("\n\n")
          : "";

      if (fileContents) {
        setNovelText(fileContents);
      }

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
      </header>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
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
            <div className="shrink-0 border-t bg-white px-4 py-3 max-h-48 overflow-y-auto">
              <YamlPanel
                yaml={editedYaml}
                title={editor.script?.meta?.title}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
