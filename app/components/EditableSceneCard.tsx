"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { Scene, Beat, BeatType } from "@/types";
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

// ─── Props ───────────────────────────────────────────────────────────────────

interface EditableSceneCardProps {
  scene: Scene;
  index: number;
  totalScenes: number;
  onUpdateScene: (field: string, value: string | string[]) => void;
  onDeleteScene: () => void;
  onAddBeat: () => void;
  onUpdateBeat: (beatIndex: number, field: string, value: string) => void;
  onDeleteBeat: (beatIndex: number) => void;
  onMoveBeat: (fromIndex: number, toIndex: number) => void;
}

// ─── InlineEdit 通用内联编辑组件 ─────────────────────────────────────────────

/** 点击后切换为输入框/文本域，失焦或回车时保存 */
function InlineEdit({
  value,
  onSave,
  as = "input",
  className = "",
  placeholder = "",
  emptyDisplay = "(空)",
}: {
  value: string;
  onSave: (v: string) => void;
  as?: "input" | "textarea";
  className?: string;
  placeholder?: string;
  emptyDisplay?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const commit = useCallback(() => {
    setEditing(false);
    if (draft !== value) onSave(draft);
  }, [draft, value, onSave]);

  if (editing) {
    const shared =
      "w-full border border-blue-400 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500";
    return as === "textarea" ? (
      <textarea
        ref={inputRef as React.Ref<HTMLTextAreaElement>}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
        className={`${shared} resize-y min-h-[2rem] ${className}`}
        placeholder={placeholder}
        rows={2}
      />
    ) : (
      <input
        ref={inputRef as React.Ref<HTMLInputElement>}
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
        className={`${shared} ${className}`}
        placeholder={placeholder}
      />
    );
  }

  const display = value || emptyDisplay;
  return (
    <span
      onClick={() => setEditing(true)}
      className={`cursor-pointer hover:bg-yellow-100 rounded px-1 -mx-1 transition-colors ${
        !value ? "text-gray-400 italic" : ""
      } ${className}`}
      title="点击编辑"
    >
      {display}
    </span>
  );
}

// ─── Beat 类型选择器 ──────────────────────────────────────────────────────────

const BEAT_TYPE_OPTIONS: { value: BeatType; label: string }[] = [
  { value: "action", label: "动作" },
  { value: "dialogue", label: "对白" },
  { value: "mixed", label: "混合" },
];

function BeatTypeSelect({
  value,
  onChange,
}: {
  value: BeatType;
  onChange: (v: BeatType) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as BeatType)}
      className="text-xs border rounded px-1 py-0.5 bg-white text-gray-600 shrink-0"
    >
      {BEAT_TYPE_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

// ─── 可排序 Beat 条目 ─────────────────────────────────────────────────────────

function SortableBeatItem({
  beat,
  index,
  onUpdate,
  onDelete,
}: {
  beat: Beat;
  index: number;
  onUpdate: (field: string, value: string) => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `beat-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-2 group/beat"
    >
      {/* 拖拽手柄 */}
      <button
        {...attributes}
        {...listeners}
        className="mt-2 shrink-0 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 transition-colors"
        title="拖拽排序"
      >
        <svg width="12" height="20" viewBox="0 0 12 20" fill="currentColor">
          <circle cx="3" cy="4" r="1.5" />
          <circle cx="9" cy="4" r="1.5" />
          <circle cx="3" cy="10" r="1.5" />
          <circle cx="9" cy="10" r="1.5" />
          <circle cx="3" cy="16" r="1.5" />
          <circle cx="9" cy="16" r="1.5" />
        </svg>
      </button>

      {/* Beat 内容 */}
      <div className="flex-1 min-w-0 py-1">
        <div className="flex items-center gap-2 mb-1">
          <BeatTypeSelect
            value={beat.type}
            onChange={(v) => onUpdate("type", v)}
          />
        </div>

        <BeatContent beat={beat} onUpdate={onUpdate} />
      </div>

      {/* 删除按钮 */}
      <button
        onClick={onDelete}
        className="mt-1 shrink-0 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover/beat:opacity-100"
        title="删除节拍"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <line x1="4" y1="4" x2="12" y2="12" />
          <line x1="12" y1="4" x2="4" y2="12" />
        </svg>
      </button>
    </div>
  );
}

/** 根据 beat.type 渲染不同的编辑控件 */
function BeatContent({
  beat,
  onUpdate,
}: {
  beat: Beat;
  onUpdate: (field: string, value: string) => void;
}) {
  switch (beat.type) {
    case "action":
      return (
        <div className="pl-3 py-1.5 bg-gray-50 rounded border-l-2 border-gray-300">
          <InlineEdit
            value={beat.description || ""}
            onSave={(v) => onUpdate("description", v)}
            as="textarea"
            placeholder="动作描写..."
          />
        </div>
      );

    case "dialogue":
      return (
        <div className="pl-3 py-1.5 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 shrink-0">说话人:</span>
            <InlineEdit
              value={beat.speaker || ""}
              onSave={(v) => onUpdate("speaker", v)}
              placeholder="角色名或 ID"
              className="font-bold"
            />
            <span className="text-xs text-gray-400 shrink-0">提示:</span>
            <InlineEdit
              value={beat.parenthetical || ""}
              onSave={(v) => onUpdate("parenthetical", v)}
              placeholder="(情绪/动作)"
              className="text-xs italic"
              emptyDisplay=""
            />
          </div>
          <div className="flex items-start gap-2">
            <span className="text-xs text-gray-400 shrink-0 mt-1">对白:</span>
            <InlineEdit
              value={beat.line || ""}
              onSave={(v) => onUpdate("line", v)}
              as="textarea"
              placeholder="对白内容..."
            />
          </div>
        </div>
      );

    case "mixed":
      return (
        <div className="pl-3 py-1.5 bg-gray-50 rounded border-l-2 border-blue-300 space-y-1">
          <div className="flex items-start gap-2">
            <span className="text-xs text-gray-400 shrink-0 mt-1">动作:</span>
            <InlineEdit
              value={beat.description || ""}
              onSave={(v) => onUpdate("description", v)}
              as="textarea"
              placeholder="动作描写..."
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 shrink-0">说话人:</span>
            <InlineEdit
              value={beat.speaker || ""}
              onSave={(v) => onUpdate("speaker", v)}
              placeholder="角色名或 ID"
              className="font-bold"
            />
          </div>
          <div className="flex items-start gap-2">
            <span className="text-xs text-gray-400 shrink-0 mt-1">对白:</span>
            <InlineEdit
              value={beat.line || ""}
              onSave={(v) => onUpdate("line", v)}
              as="textarea"
              placeholder="对白内容..."
            />
          </div>
        </div>
      );

    default:
      return null;
  }
}

// ─── 主组件 ───────────────────────────────────────────────────────────────────

export default function EditableSceneCard({
  scene,
  index,
  totalScenes,
  onUpdateScene,
  onDeleteScene,
  onAddBeat,
  onUpdateBeat,
  onDeleteBeat,
  onMoveBeat,
}: EditableSceneCardProps) {
  const [expanded, setExpanded] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleBeatDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        const fromIdx = Number(String(active.id).replace("beat-", ""));
        const toIdx = Number(String(over.id).replace("beat-", ""));
        onMoveBeat(fromIdx, toIdx);
      }
    },
    [onMoveBeat]
  );

  const beatIds = scene.beats.map((_, i) => `beat-${i}`);

  return (
    <div className="mb-3 bg-white rounded-lg border">
      {/* ── 标题栏 ── */}
      <div
        className="px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {/* 展开/折叠图标 */}
        <span className="text-gray-400 text-xs shrink-0">
          {expanded ? "▼" : "▶"}
        </span>

        {/* 场景序号 */}
        <span className="text-gray-400 text-sm font-mono shrink-0">
          #{scene.scene_id}
        </span>

        {/* 可编辑 scene_heading */}
        <div className="flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
          <InlineEdit
            value={scene.scene_heading}
            onSave={(v) => onUpdateScene("scene_heading", v)}
            placeholder="INT./EXT. 地点 - 时间"
            className="font-semibold text-gray-800"
          />
        </div>

        {/* 删除场景按钮 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm("确定删除这个场景？")) onDeleteScene();
          }}
          className="shrink-0 text-gray-300 hover:text-red-500 transition-colors"
          title="删除场景"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <line x1="5" y1="5" x2="13" y2="13" />
            <line x1="13" y1="5" x2="5" y2="13" />
          </svg>
        </button>
      </div>

      {/* ── 摘要栏 ── */}
      <div
        className="px-12 pb-1"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-xs text-gray-400 mr-2">摘要:</span>
        <InlineEdit
          value={scene.summary}
          onSave={(v) => onUpdateScene("summary", v)}
          placeholder="场景摘要..."
          className="text-sm text-gray-500"
          emptyDisplay=""
        />
      </div>

      {/* ── 展开内容 ── */}
      {expanded && (
        <div className="px-4 pb-4">
          {/* Beats 列表（带拖拽排序） */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleBeatDragEnd}
          >
            <SortableContext
              items={beatIds}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1 ml-6">
                {scene.beats.length === 0 && (
                  <p className="text-gray-400 text-sm py-4 text-center">
                    暂无节拍，点击下方按钮添加
                  </p>
                )}
                {scene.beats.map((beat, idx) => (
                  <SortableBeatItem
                    key={`beat-${idx}`}
                    beat={beat}
                    index={idx}
                    onUpdate={(field, value) =>
                      onUpdateBeat(idx, field, value)
                    }
                    onDelete={() => onDeleteBeat(idx)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {/* 添加节拍按钮 */}
          <div className="mt-3 ml-6">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddBeat();
              }}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="8" y1="2" x2="8" y2="14" />
                <line x1="2" y1="8" x2="14" y2="8" />
              </svg>
              添加节拍
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
