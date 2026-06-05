// Agent 逻辑模块
// 使用 LangChain ChatOpenAI（指向 DeepSeek）+ 工具绑定实现 Agent 循环
// Agent 可自主决定是否调用 generate_script 工具

import { ChatOpenAI } from "@langchain/openai";
import {
  SystemMessage,
  HumanMessage,
  AIMessage,
  ToolMessage,
} from "@langchain/core/messages";
import { dump, load } from "js-yaml";
import { generateScriptTool } from "./tools/generateScriptTool";
import type { Script } from "@/types";

// ─── 类型 ─────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// ─── 工具函数 ─────────────────────────────────────────────────────────────────

/**
 * 从 LLM 响应文本中提取 YAML 代码块并解析为 Script 对象
 */
function extractScriptFromText(text: string): Script | null {
  const yamlMatch = text.match(/```yaml\s*([\s\S]*?)```/);
  if (!yamlMatch) return null;
  try {
    return load(yamlMatch[1].trim()) as Script;
  } catch {
    return null;
  }
}

/**
 * 安全获取 AIMessage 中的 tool_calls（兼容不同 langchain 版本）
 */
function getToolCalls(response: AIMessage): any[] {
  if ((response as any).tool_calls?.length > 0) {
    return (response as any).tool_calls;
  }
  if ((response as any).additional_kwargs?.tool_calls?.length > 0) {
    return (response as any).additional_kwargs.tool_calls.map((tc: any) => ({
      id: tc.id,
      name: tc.function?.name,
      args: JSON.parse(tc.function?.arguments || "{}"),
    }));
  }
  return [];
}

/** 保留最近的消息数量（防止上下文超长） */
const MAX_HISTORY = 20;

// ─── Agent 主函数 ─────────────────────────────────────────────────────────────

export async function runAgent(
  message: string,
  currentScript?: Script | null,
  history?: ChatMessage[],
  novelText?: string
): Promise<{ response: string; script: Script | null }> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const baseURL = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1";
  const modelName = process.env.DEEPSEEK_MODEL || "deepseek-chat";

  if (!apiKey) {
    throw new Error("未配置 DEEPSEEK_API_KEY 环境变量");
  }

  // 初始化 ChatOpenAI 实例，指向 DeepSeek
  const model = new ChatOpenAI({
    model: modelName,
    temperature: 0.3,
    apiKey,
    configuration: {
      baseURL,
    },
  });

  // 绑定工具
  const modelWithTools = model.bindTools([generateScriptTool]);

  // 系统提示词
  const SYSTEM_PROMPT = `你是一个专业的编剧助理 AI。你可以使用工具来帮助用户将小说转换成剧本，或对现有剧本进行修改。
请根据用户的要求，合理使用工具，并以友好、专业的方式回复。
如果用户要求生成剧本，务必调用 generate_script 工具，并在调用后向用户简要说明生成结果。
如果需要返回完整的剧本内容，请使用 \`\`\`yaml 代码块包裹。`;

  // ── 构建消息链 ──
  const messages: (SystemMessage | HumanMessage | AIMessage | ToolMessage)[] = [
    new SystemMessage(SYSTEM_PROMPT),
  ];

  // 注入原始小说上下文（如果有）
  if (novelText) {
    const truncated =
      novelText.length > 80000
        ? novelText.slice(0, 80000) + "\n\n（小说内容过长，已截取前 80000 字符）"
        : novelText;
    messages.push(
      new SystemMessage(
        `用户上传了以下小说文本（你可以参考其中的情节、角色和设定）：\n\n${truncated}`
      )
    );
  }

  // 注入当前编辑中的剧本上下文
  if (currentScript) {
    try {
      const yaml = dump(currentScript, {
        indent: 2,
        lineWidth: -1,
        noRefs: true,
      });
      messages.push(
        new SystemMessage(
          `用户当前正在编辑以下剧本。如果用户要求修改，请在此剧本基础上调整并返回完整的 YAML：\n\`\`\`yaml\n${yaml}\n\`\`\``
        )
      );
    } catch {
      // dump 失败不影响主流程
    }
  }

  // 注入对话历史（最近 MAX_HISTORY 条）
  const recentHistory = history ? history.slice(-MAX_HISTORY) : [];
  for (const msg of recentHistory) {
    if (msg.role === "user") {
      messages.push(new HumanMessage(msg.content));
    } else {
      messages.push(new AIMessage(msg.content));
    }
  }

  // 当前用户消息
  messages.push(new HumanMessage(message));

  // ── Agent 循环（最多 3 轮工具调用） ──
  let finalResponse = "";
  let updatedScript: Script | null = null;

  for (let round = 0; round < 3; round++) {
    const response = await modelWithTools.invoke(messages);
    messages.push(response);

    const toolCalls = getToolCalls(response);

    if (toolCalls.length === 0) {
      finalResponse =
        typeof response.content === "string"
          ? response.content
          : JSON.stringify(response.content);
      const parsed = extractScriptFromText(finalResponse);
      if (parsed) updatedScript = parsed;
      break;
    }

    for (const toolCall of toolCalls) {
      if (toolCall.name === "generate_script") {
        try {
          const args = toolCall.args as { text: string };
          const yamlResult = await generateScriptTool.func(args);
          messages.push(
            new ToolMessage({
              content: yamlResult,
              tool_call_id: toolCall.id,
            })
          );
          try {
            updatedScript = load(yamlResult) as Script;
          } catch {
            // 解析失败不阻塞
          }
        } catch (err) {
          messages.push(
            new ToolMessage({
              content: `工具调用失败: ${
                err instanceof Error ? err.message : "未知错误"
              }`,
              tool_call_id: toolCall.id,
            })
          );
        }
      }
    }
  }

  if (!finalResponse) {
    const last = messages[messages.length - 1] as AIMessage;
    finalResponse =
      typeof last.content === "string"
        ? last.content
        : "Agent 处理完成，请查看结果。";
    const parsed = extractScriptFromText(finalResponse);
    if (parsed) updatedScript = parsed;
  }

  return { response: finalResponse, script: updatedScript };
}
