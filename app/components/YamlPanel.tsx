"use client";

import { useState } from "react";

interface YamlPanelProps {
  yaml: string;
  title?: string;
}

/** 实时 YAML 侧边栏 —— 展示当前编辑后剧本的 YAML 文本 */
export default function YamlPanel({ yaml, title }: YamlPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(yaml);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 降级方案
      const textarea = document.createElement("textarea");
      textarea.value = yaml;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const filename = title ? `剧本_${title}.yaml` : "script.yaml";
    const blob = new Blob([yaml], { type: "application/x-yaml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!yaml) return null;

  return (
    <div className="bg-white rounded-lg border flex flex-col h-full">
      {/* 面板头部 */}
      <div className="px-4 py-3 border-b flex items-center justify-between shrink-0">
        <h3 className="font-semibold text-gray-800 text-sm">实时 YAML</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="text-xs px-2.5 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
          >
            {copied ? "已复制" : "复制"}
          </button>
          <button
            onClick={handleDownload}
            className="text-xs px-2.5 py-1 rounded bg-blue-100 hover:bg-blue-200 text-blue-700 transition-colors"
          >
            下载
          </button>
        </div>
      </div>

      {/* YAML 内容 */}
      <div className="flex-1 overflow-auto">
        <pre className="p-4 text-xs font-mono text-gray-700 whitespace-pre-wrap break-all leading-relaxed">
          {yaml}
        </pre>
      </div>
    </div>
  );
}
