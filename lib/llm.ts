// LLM 调用模块
// 使用 OpenAI 兼容客户端接入 DeepSeek 模型
// 从环境变量读取 API 配置，发送小说文本并返回生成的 YAML

import OpenAI from "openai";
import { buildPrompt } from "./prompt";

/**
 * 从 LLM 响应文本中提取 YAML 代码块
 * 匹配 ```yaml ... ``` 格式，未找到则返回原始文本
 */
function extractYaml(text: string): string {
  // 匹配 ```yaml 代码块，支持可能的空白和换行
  const yamlMatch = text.match(/```yaml\s*([\s\S]*?)```/);
  if (yamlMatch) {
    return yamlMatch[1].trim();
  }
  // 如果没有 yaml 标记，尝试匹配 ``` 代码块
  const genericMatch = text.match(/```\s*([\s\S]*?)```/);
  if (genericMatch) {
    return genericMatch[1].trim();
  }
  // 都匹配不到则返回原始文本
  return text.trim();
}

/**
 * 调用 DeepSeek 模型生成剧本 YAML
 * @param novelText - 用户输入的原始小说文本
 * @returns 提取后的 YAML 字符串
 */
export async function generateScript(novelText: string): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const baseURL = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1";
  const model = process.env.DEEPSEEK_MODEL || "deepseek-chat";

  if (!apiKey) {
    throw new Error("未配置 DEEPSEEK_API_KEY 环境变量");
  }

  const client = new OpenAI({
    apiKey,
    baseURL,
  });

  try {
    const response = await client.chat.completions.create({
      model,
      messages: [{ role: "user", content: buildPrompt(novelText) }],
      temperature: 0.3,
      max_tokens: 8192,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("LLM 返回内容为空");
    }

    return extractYaml(content);
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(`LLM 调用失败: ${err.message}`);
    }
    throw new Error("LLM 调用发生未知错误");
  }
}
