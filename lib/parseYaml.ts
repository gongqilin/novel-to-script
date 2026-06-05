// 解析 YAML 字符串为 Script 对象
// 使用 js-yaml 库进行解析，异常时返回 null

import { load } from "js-yaml";
import type { Script } from "@/types";

/**
 * 将 YAML 字符串解析为 Script 对象
 * @param yamlStr - LLM 返回的 YAML 字符串
 * @returns Script 对象，解析失败返回 null
 */
export function parseYamlString(yamlStr: string): Script | null {
  try {
    const parsed = load(yamlStr) as Script;
    return parsed;
  } catch (err) {
    console.error("YAML 解析失败:", err);
    return null;
  }
}
