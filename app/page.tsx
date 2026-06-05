"use client";

import { useState } from "react";
import NovelInput from "./components/NovelInput";
import ScriptPreview from "./components/ScriptPreview";
import type { Script } from "@/types";

export default function HomePage() {
  const [novelText, setNovelText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Script | null>(null);
  const [rawYaml, setRawYaml] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!novelText.trim()) {
      setError("请输入小说文本");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
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

      if (json.data) {
        setResult(json.data);
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

  return (
    <main className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 标题 */}
        <header className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            小说转剧本工具
          </h1>
          <p className="text-gray-500">
            AI 驱动 · 将小说片段转换为结构化剧本格式
          </p>
        </header>

        {/* 输入区 */}
        <NovelInput
          value={novelText}
          onChange={setNovelText}
          onSubmit={handleSubmit}
        />

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
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* 结果展示 */}
        <ScriptPreview script={result} rawYaml={rawYaml} />
      </div>
    </main>
  );
}
