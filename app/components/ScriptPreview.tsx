"use client";

import { useCallback, useState, useRef, useEffect } from "react";
import type { Script } from "@/types";
import EditableSceneCard from "./EditableSceneCard";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ─── InlineEdit（与 EditableSceneCard 共用逻辑，此处简化版） ──────────────────

function InlineEditSmall({
  value,
  onSave,
  placeholder = "",
  emptyDisplay = "(空)",
  className = "",
}: {
  value: string;
  onSave: (v: string) => void;
  placeholder?: string;
  emptyDisplay?: string;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const commit = () => {
    setEditing(false);
    if (draft !== value) onSave(draft);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
        className={`border border-blue-400 rounded px-1.5 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${className}`}
        placeholder={placeholder}
      />
    );
  }

  return (
    <span
      onClick={() => setEditing(true)}
      className={`cursor-pointer hover:bg-yellow-100 rounded px-1 -mx-0.5 transition-colors ${
        !value ? "text-gray-400 italic" : ""
      } ${className}`}
      title="点击编辑"
    >
      {value || emptyDisplay}
    </span>
  );
}

// ─── 可排序场景包装器 ─────────────────────────────────────────────────────────

function SortableSceneWrapper({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group/scene">
      {/* 拖拽手柄 —— 悬浮在卡片左侧 */}
      <button
        {...attributes}
        {...listeners}
        className="absolute -left-8 top-3 text-gray-300 hover:text-gray-500 transition-colors cursor-grab active:cursor-grabbing opacity-0 group-hover/scene:opacity-100 z-10"
        title="拖拽排序场景"
      >
        <svg width="14" height="24" viewBox="0 0 14 24" fill="currentColor">
          <circle cx="4" cy="5" r="1.8" />
          <circle cx="10" cy="5" r="1.8" />
          <circle cx="4" cy="12" r="1.8" />
          <circle cx="10" cy="12" r="1.8" />
          <circle cx="4" cy="19" r="1.8" />
          <circle cx="10" cy="19" r="1.8" />
        </svg>
      </button>
      {children}
    </div>
  );
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface ScriptPreviewProps {
  script: Script | null;
  rawYaml: string;
  onUpdateCharacter: (id: string, field: string, value: string) => void;
  onUpdateScene: (sceneId: number, field: string, value: string | string[]) => void;
  onDeleteScene: (sceneId: number) => void;
  onAddScene: () => void;
  onAddBeat: (sceneId: number) => void;
  onUpdateBeat: (sceneId: number, beatIndex: number, field: string, value: string) => void;
  onDeleteBeat: (sceneId: number, beatIndex: number) => void;
  onMoveScene: (fromIndex: number, toIndex: number) => void;
  onMoveBeat: (sceneId: number, fromIndex: number, toIndex: number) => void;
}

// ─── 主组件 ───────────────────────────────────────────────────────────────────

export default function ScriptPreview({
  script,
  rawYaml,
  onUpdateCharacter,
  onUpdateScene,
  onDeleteScene,
  onAddScene,
  onAddBeat,
  onUpdateBeat,
  onDeleteBeat,
  onMoveScene,
  onMoveBeat,
}: ScriptPreviewProps) {
  // 降级：YAML 解析失败时展示原始文本
  if (!script && rawYaml) {
    return (
      <div className="mt-8 w-full">
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
      </div>
    );
  }

  if (!script) return null;

  // 场景级拖拽传感器
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleSceneDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        const fromIdx = Number(String(active.id).replace("scene-", ""));
        const toIdx = Number(String(over.id).replace("scene-", ""));
        onMoveScene(fromIdx, toIdx);
      }
    },
    [onMoveScene]
  );

  const sceneIds = script.scenes.map((_, i) => `scene-${i}`);

  return (
    <div className="mt-8 w-full">
      {/* ── 剧本元数据 ── */}
      <section className="mb-8 bg-white rounded-lg border p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-900">剧本元数据</h2>
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
            <span className="font-medium">
              {script.meta.source.novel_title}
            </span>
          </div>
          <div>
            <span className="text-gray-500">章节范围：</span>
            <span className="font-medium">
              {script.meta.source.chapter_range}
            </span>
          </div>
        </div>
      </section>

      {/* ── 人物表（可编辑） ── */}
      <section className="mb-8 bg-white rounded-lg border p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-900">人物表</h2>
        <div className="space-y-3">
          {script.characters.map((char) => (
            <div
              key={char.id}
              className="p-3 bg-gray-50 rounded-lg border border-gray-100"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-gray-400 font-mono">
                  {char.id}
                </span>
                <InlineEditSmall
                  value={char.name}
                  onSave={(v) => onUpdateCharacter(char.id, "name", v)}
                  placeholder="角色名"
                  className="font-semibold text-gray-900"
                />
                {char.aliases.length > 0 && (
                  <span className="text-xs text-gray-400">
                    ({char.aliases.join("、")})
                  </span>
                )}
              </div>
              <InlineEditSmall
                value={char.description}
                onSave={(v) => onUpdateCharacter(char.id, "description", v)}
                placeholder="角色描述..."
                className="text-sm text-gray-600"
                emptyDisplay=""
              />
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

      {/* ── 场景列表（可拖拽排序） ── */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">场景</h2>
          <span className="text-xs text-gray-400">
            拖拽左侧手柄可排序 · 共 {script.scenes.length} 个场景
          </span>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleSceneDragEnd}
        >
          <SortableContext
            items={sceneIds}
            strategy={verticalListSortingStrategy}
          >
            <div className="pl-8">
              {script.scenes.map((scene, idx) => (
                <SortableSceneWrapper key={`scene-${idx}`} id={`scene-${idx}`}>
                  <EditableSceneCard
                    scene={scene}
                    index={idx}
                    totalScenes={script.scenes.length}
                    onUpdateScene={(field, value) =>
                      onUpdateScene(scene.scene_id, field, value)
                    }
                    onDeleteScene={() => onDeleteScene(scene.scene_id)}
                    onAddBeat={() => onAddBeat(scene.scene_id)}
                    onUpdateBeat={(beatIdx, field, value) =>
                      onUpdateBeat(scene.scene_id, beatIdx, field, value)
                    }
                    onDeleteBeat={(beatIdx) =>
                      onDeleteBeat(scene.scene_id, beatIdx)
                    }
                    onMoveBeat={(from, to) =>
                      onMoveBeat(scene.scene_id, from, to)
                    }
                  />
                </SortableSceneWrapper>
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {/* 添加场景按钮 */}
        <div className="mt-3 pl-8">
          <button
            onClick={onAddScene}
            className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 transition-colors font-medium"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="9" y1="3" x2="9" y2="15" />
              <line x1="3" y1="9" x2="15" y2="9" />
            </svg>
            添加场景
          </button>
        </div>
      </section>
    </div>
  );
}
