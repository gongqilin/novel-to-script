// Prompt 构建模块
// 将小说文本拼接系统指令和格式要求，生成发送给 LLM 的完整消息

// Schema 来源：types/index.ts 中定义的 Script / Scene / Beat / Character / Meta 接口
// 下方 YAML 模板与类型定义严格一致，确保 LLM 输出可被 parseYamlString 解析

const SYSTEM_ROLE =
  "你是一位专业的剧本编辑，擅长从小说中提取信息并转换成结构化的剧本格式。";

const OUTPUT_FORMAT = `请将以下小说文本转换为结构化的剧本 YAML。输出要求：

1. 只输出一个 YAML 代码块（用 \`\`\`yaml 包裹），不要包含任何额外文字。
2. YAML 缩进使用两个空格，所有字段名必须与以下 Schema 完全一致。
3. beats 数组必须按时间顺序排列，动作和对话不能分离成两个独立列表。
4. 心理活动要转化为可视外部动作；对白尽量忠于原文，可微调标点。
5. 自动将地点变化切分为新场景，并生成标准的 scene_heading（格式：INT./EXT. 地点 - 时间）。

YAML Schema 模板：
\`\`\`yaml
meta:
  title: "剧本标题"
  author: "原作者"
  adaptor: "AI"
  format: "script"
  version: "1.0"
  source:
    novel_title: "原小说名"
    chapter_range: "第1-3章"
  notes: ""
characters:
  - id: "char_01"
    name: "角色姓名"
    aliases: []
    description: ""
    traits: []
scenes:
  - scene_id: 1
    scene_heading: "INT./EXT. 地点 - 时间"
    characters_present: []
    summary: ""
    beats:
      - type: "action"
        description: "动作描写"
      - type: "dialogue"
        speaker: "char_01"
        line: "对白"
        parenthetical: ""
\`\`\``;

/**
 * 构建发送给 LLM 的完整用户消息
 * @param novelText - 用户输入的原始小说文本
 * @returns 完整 prompt 字符串
 */
export function buildPrompt(novelText: string): string {
  return `${SYSTEM_ROLE}\n\n${OUTPUT_FORMAT}\n\n下面是将要转换的小说文本：\n\n${novelText}`;
}
