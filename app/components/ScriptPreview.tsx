"use client";

import type { Script } from "@/types";
import SceneCard from "./SceneCard";

interface ScriptPreviewProps {
  script: Script | null;
  rawYaml: string;
}

/** 剧本预览组件 —— 展示解析后的剧本或原始 YAML */
export default function ScriptPreview({ script, rawYaml }: ScriptPreviewProps) {
  if (!script && !rawYaml) return null;

  /** 触发浏览器下载 YAML 文件 */
  const handleDownload = () => {
    const blob = new Blob([rawYaml], { type: "application/x-yaml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "script.yaml";
    a.click();
    URL.revokeObjectURL(url);
  };

  // 降级：YAML 解析失败时展示原始文本
  if (!script && rawYaml) {
    return (
      <div className="mt-8 w-full max-w-4xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <p className="text-yellow-800 text-sm">
            YAML 解析失败，请手动复制下方内容
          </p>
        </div>
        <textarea
          readOnly
          value={rawYaml}
          className="w-full h-64 p-4 border rounded-lg font-mono text-sm bg-gray-50"
        />
        <button
          onClick={handleDownload}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          下载 YAML
        </button>
      </div>
    );
  }

  if (!script) return null;

  return (
    <div className="mt-8 w-full max-w-4xl mx-auto">
      {/* 剧本元数据 */}
      <section className="mb-8 bg-white rounded-lg border p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">剧本元数据</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-500">标题：</span>
            <span className="font-medium">{script.meta.title}</span>
          </div>
          <div>
            <span className="text-gray-500">作者：</span>
            <span className="font-medium">{script.meta.author}</span>
          </div>
          <div>
            <span className="text-gray-500">改编：</span>
            <span className="font-medium">{script.meta.adaptor}</span>
          </div>
          <div>
            <span className="text-gray-500">原著：</span>
            <span className="font-medium">{script.meta.source.novel_title}</span>
          </div>
          <div>
            <span className="text-gray-500">章节范围：</span>
            <span className="font-medium">{script.meta.source.chapter_range}</span>
          </div>
        </div>
      </section>

      {/* 人物表 */}
      <section className="mb-8 bg-white rounded-lg border p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">人物表</h2>
        <div className="space-y-3">
          {script.characters.map((char) => (
            <div
              key={char.id}
              className="p-3 bg-gray-50 rounded-lg border border-gray-100"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-gray-900">{char.name}</span>
                {char.aliases.length > 0 && (
                  <span className="text-xs text-gray-400">
                    ({char.aliases.join("、")})
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">{char.description}</p>
              {char.traits.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {char.traits.map((trait, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full"
                    >
                      {trait}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 场景列表 */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">场景</h2>
        {script.scenes.map((scene) => (
          <SceneCard key={scene.scene_id} scene={scene} />
        ))}
      </section>

      {/* 下载按钮 */}
      <div className="flex justify-center pb-12">
        <button
          onClick={handleDownload}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          下载 YAML
        </button>
      </div>
    </div>
  );
}
