import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { generateScript } from "@/lib/llm";

export const generateScriptTool = new DynamicStructuredTool({
  name: "generate_script",
  description:
    "将用户提供的小说文本转换为结构化的剧本 YAML。调用时机：当用户要求生成剧本、转换小说、或创建剧本初稿时。输入必须包含 text 字段，值为小说的原始文本。",
  schema: z.object({
    text: z.string().describe("需要转换为剧本的小说原始文本"),
  }),
  func: async ({ text }) => {
    try {
      return await generateScript(text);
    } catch (err) {
      return `剧本生成失败: ${err instanceof Error ? err.message : "未知错误"}`;
    }
  },
});
