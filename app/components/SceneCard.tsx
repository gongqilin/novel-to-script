"use client";

import type { Scene, Beat } from "@/types";

interface SceneCardProps {
  scene: Scene;
}

/** 场景卡片组件 —— 可折叠，展示 scene_heading 和 beats */
export default function SceneCard({ scene }: SceneCardProps) {
  return (
    <details className="mb-3 bg-white rounded-lg border group">
      <summary className="px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors list-none flex items-center gap-3">
        <span className="text-gray-400 text-sm font-mono">
          #{scene.scene_id}
        </span>
        <div className="flex-1 min-w-0">
          <span className="font-semibold text-gray-800">
            {scene.scene_heading}
          </span>
          {scene.summary && (
            <span className="text-gray-500 text-sm ml-3">
              — {scene.summary}
            </span>
          )}
        </div>
        <span className="text-gray-400 text-xs shrink-0">
          {scene.characters_present.length > 0
            ? scene.characters_present.join("、")
            : ""}
        </span>
      </summary>

      <div className="px-4 pb-4 space-y-2">
        {scene.beats.map((beat, idx) => (
          <BeatItem key={idx} beat={beat} />
        ))}
      </div>
    </details>
  );
}

/** 单个 Beat 渲染 —— 根据 type 切换样式 */
function BeatItem({ beat }: { beat: Beat }) {
  switch (beat.type) {
    case "action":
      return (
        <div className="pl-4 py-2 bg-gray-50 rounded border-l-2 border-gray-300">
          <p className="text-gray-700 text-sm leading-relaxed">
            {beat.description}
          </p>
        </div>
      );

    case "dialogue":
      return (
        <div className="pl-4 py-2">
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-gray-900 text-sm w-16 shrink-0 text-right">
              {beat.speaker}
            </span>
            {beat.parenthetical && (
              <span className="text-xs text-gray-400 italic">
                ({beat.parenthetical})
              </span>
            )}
            <span className="text-gray-800 leading-relaxed">{beat.line}</span>
          </div>
        </div>
      );

    case "mixed":
      return (
        <div className="pl-4 py-2 bg-gray-50 rounded border-l-2 border-blue-300">
          {beat.description && (
            <p className="text-gray-700 text-sm mb-1">{beat.description}</p>
          )}
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-gray-900 text-sm w-16 shrink-0 text-right">
              {beat.speaker}
            </span>
            <span className="text-gray-800 leading-relaxed">{beat.line}</span>
          </div>
        </div>
      );

    default:
      return null;
  }
}
