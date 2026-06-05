// useScriptEditor — 剧本编辑状态管理 Hook
// 封装所有编辑操作，使用不可变更新（spread），即时生效无需保存

"use client";

import { useCallback, useState } from "react";
import type { Script, Scene, Beat, Character, Meta, BeatType } from "@/types";

export interface UseScriptEditorReturn {
  script: Script | null;
  setScript: (script: Script | null) => void;
  updateMeta: (key: string, value: string) => void;
  updateMetaSource: (key: string, value: string) => void;
  updateCharacter: (id: string, field: string, value: string) => void;
  updateScene: (sceneId: number, field: string, value: unknown) => void;
  addScene: () => void;
  deleteScene: (sceneId: number) => void;
  addBeat: (sceneId: number) => void;
  updateBeat: (sceneId: number, beatIndex: number, field: string, value: string) => void;
  deleteBeat: (sceneId: number, beatIndex: number) => void;
  moveScene: (fromIndex: number, toIndex: number) => void;
  moveBeat: (sceneId: number, fromIndex: number, toIndex: number) => void;
}

/** 创建空白 beat */
function createEmptyBeat(type: BeatType = "action"): Beat {
  return { type, description: "" };
}

/** 创建空白场景，scene_id 自动递增 */
function createEmptyScene(nextId: number): Scene {
  return {
    scene_id: nextId,
    scene_heading: "",
    characters_present: [],
    summary: "",
    beats: [],
  };
}

export function useScriptEditor(
  initialScript: Script | null
): UseScriptEditorReturn {
  const [script, setScript] = useState<Script | null>(initialScript);

  // 每次 API 返回新结果时同步进来
  // 外部通过 setScript 直接设置（在 page.tsx 的 handleSubmit 中调用）

  const updateMeta = useCallback((key: string, value: string) => {
    setScript((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        meta: { ...prev.meta, [key]: value },
      };
    });
  }, []);

  const updateMetaSource = useCallback((key: string, value: string) => {
    setScript((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        meta: {
          ...prev.meta,
          source: { ...prev.meta.source, [key]: value },
        },
      };
    });
  }, []);

  const updateCharacter = useCallback(
    (id: string, field: string, value: string) => {
      setScript((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          characters: prev.characters.map((c) =>
            c.id === id ? { ...c, [field]: value } : c
          ),
        };
      });
    },
    []
  );

  const updateScene = useCallback(
    (sceneId: number, field: string, value: unknown) => {
      setScript((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          scenes: prev.scenes.map((s) =>
            s.scene_id === sceneId ? { ...s, [field]: value } : s
          ),
        };
      });
    },
    []
  );

  const addScene = useCallback(() => {
    setScript((prev) => {
      if (!prev) return prev;
      const maxId =
        prev.scenes.length > 0
          ? Math.max(...prev.scenes.map((s) => s.scene_id))
          : 0;
      return {
        ...prev,
        scenes: [...prev.scenes, createEmptyScene(maxId + 1)],
      };
    });
  }, []);

  const deleteScene = useCallback((sceneId: number) => {
    setScript((prev) => {
      if (!prev) return prev;
      const filtered = prev.scenes.filter((s) => s.scene_id !== sceneId);
      // 重新分配 scene_id，保持从 1 开始的连续编号
      const reindexed = filtered.map((s, i) => ({ ...s, scene_id: i + 1 }));
      return { ...prev, scenes: reindexed };
    });
  }, []);

  const addBeat = useCallback((sceneId: number) => {
    setScript((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        scenes: prev.scenes.map((s) =>
          s.scene_id === sceneId
            ? { ...s, beats: [...s.beats, createEmptyBeat()] }
            : s
        ),
      };
    });
  }, []);

  const updateBeat = useCallback(
    (sceneId: number, beatIndex: number, field: string, value: string) => {
      setScript((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          scenes: prev.scenes.map((s) => {
            if (s.scene_id !== sceneId) return s;
            const newBeats = [...s.beats];
            newBeats[beatIndex] = { ...newBeats[beatIndex], [field]: value };
            return { ...s, beats: newBeats };
          }),
        };
      });
    },
    []
  );

  const deleteBeat = useCallback((sceneId: number, beatIndex: number) => {
    setScript((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        scenes: prev.scenes.map((s) => {
          if (s.scene_id !== sceneId) return s;
          const newBeats = s.beats.filter((_, i) => i !== beatIndex);
          return { ...s, beats: newBeats };
        }),
      };
    });
  }, []);

  /** 交换场景位置并重新分配 scene_id（从 1 开始） */
  const moveScene = useCallback((fromIndex: number, toIndex: number) => {
    setScript((prev) => {
      if (!prev) return prev;
      const scenes = [...prev.scenes];
      const [moved] = scenes.splice(fromIndex, 1);
      scenes.splice(toIndex, 0, moved);
      // 重新编号
      const reindexed = scenes.map((s, i) => ({ ...s, scene_id: i + 1 }));
      return { ...prev, scenes: reindexed };
    });
  }, []);

  /** 交换场景内节拍位置 */
  const moveBeat = useCallback(
    (sceneId: number, fromIndex: number, toIndex: number) => {
      setScript((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          scenes: prev.scenes.map((s) => {
            if (s.scene_id !== sceneId) return s;
            const beats = [...s.beats];
            const [moved] = beats.splice(fromIndex, 1);
            beats.splice(toIndex, 0, moved);
            return { ...s, beats };
          }),
        };
      });
    },
    []
  );

  return {
    script,
    setScript,
    updateMeta,
    updateMetaSource,
    updateCharacter,
    updateScene,
    addScene,
    deleteScene,
    addBeat,
    updateBeat,
    deleteBeat,
    moveScene,
    moveBeat,
  };
}
