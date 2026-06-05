// 剧本 Schema 类型定义
// 对应 YAML 结构：meta, characters, scenes, beats

/** 剧本元数据 */
export interface Meta {
  title: string;
  author: string;
  adaptor: string;
  format: string;
  version: string;
  source: {
    novel_title: string;
    chapter_range: string;
  };
  notes: string;
}

/** 角色 */
export interface Character {
  id: string;
  name: string;
  aliases: string[];
  description: string;
  traits: string[];
}

/**
 * Beat 类型：
 * - action: 动作/描写
 * - dialogue: 对白
 * - mixed: 动作+对白混合
 */
export type BeatType = "action" | "dialogue" | "mixed";

/** 剧本节拍（动作或对白） */
export interface Beat {
  type: BeatType;
  description?: string;
  speaker?: string;
  line?: string;
  parenthetical?: string;
}

/** 场景 */
export interface Scene {
  scene_id: number;
  scene_heading: string;
  characters_present: string[];
  summary: string;
  beats: Beat[];
}

/** 完整剧本 */
export interface Script {
  meta: Meta;
  characters: Character[];
  scenes: Scene[];
}
