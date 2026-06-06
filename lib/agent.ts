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

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function extractScriptFromText(text: string): Script | null {
  const m = text.match(/```yaml\s*([\s\S]*?)```/);
  if (!m) return null;
  try { return load(m[1].trim()) as Script; } catch { return null; }
}

function getToolCalls(res: AIMessage): any[] {
  if ((res as any).tool_calls?.length) return (res as any).tool_calls;
  if ((res as any).additional_kwargs?.tool_calls?.length) {
    return (res as any).additional_kwargs.tool_calls.map((t: any) => ({
      id: t.id, name: t.function?.name,
      args: JSON.parse(t.function?.arguments || "{}"),
    }));
  }
  return [];
}

const MAX_HISTORY = 20;

export async function runAgent(
  message: string,
  currentScript?: Script | null,
  history?: ChatMessage[],
  novelText?: string
): Promise<{ response: string; script: Script | null }> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const baseURL = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1";
  const modelName = process.env.DEEPSEEK_MODEL || "deepseek-chat";

  if (!apiKey) throw new Error("未配置 DEEPSEEK_API_KEY 环境变量");

  const model = new ChatOpenAI({
    model: modelName, temperature: 0.3, apiKey,
    configuration: { baseURL },
  });

  const modelWithTools = model.bindTools([generateScriptTool]);

  const SYSTEM = `你是一个专业的编剧助理 AI。你可以使用工具来帮助用户将小说转换成剧本，或对现有剧本进行修改。
请根据用户的要求，合理使用工具，并以友好、专业的方式回复。
如果用户要求生成剧本，务必调用 generate_script 工具，并在调用后向用户简要说明生成结果。
如果需要返回完整的剧本内容，请使用 \`\`\`yaml 代码块包裹。`;

  const messages: (SystemMessage | HumanMessage | AIMessage | ToolMessage)[] = [
    new SystemMessage(SYSTEM),
  ];

  if (novelText) {
    const t = novelText.length > 80000
      ? novelText.slice(0, 80000) + "\n\n（小说内容过长，已截取前 80000 字符）"
      : novelText;
    messages.push(new SystemMessage(`用户上传了以下小说文本（你可以参考其中的情节、角色和设定）：\n\n${t}`));
  }

  if (currentScript) {
    try {
      const y = dump(currentScript, { indent: 2, lineWidth: -1, noRefs: true });
      messages.push(new SystemMessage(`用户当前正在编辑以下剧本。如果用户要求修改，请在此剧本基础上调整并返回完整的 YAML：\n\`\`\`yaml\n${y}\n\`\`\``));
    } catch {}
  }

  for (const msg of (history || []).slice(-MAX_HISTORY)) {
    messages.push(msg.role === "user" ? new HumanMessage(msg.content) : new AIMessage(msg.content));
  }

  messages.push(new HumanMessage(message));

  let final = "";
  let updated: Script | null = null;

  for (let r = 0; r < 3; r++) {
    const resp = await modelWithTools.invoke(messages);
    messages.push(resp);
    const tcs = getToolCalls(resp);

    if (!tcs.length) {
      final = typeof resp.content === "string" ? resp.content : JSON.stringify(resp.content);
      const p = extractScriptFromText(final);
      if (p) updated = p;
      break;
    }

    for (const tc of tcs) {
      if (tc.name === "generate_script") {
        try {
          const yaml = await generateScriptTool.func(tc.args as { text: string });
          messages.push(new ToolMessage({ content: yaml, tool_call_id: tc.id }));
          try { updated = load(yaml) as Script; } catch {}
        } catch (e) {
          messages.push(new ToolMessage({
            content: `工具调用失败: ${e instanceof Error ? e.message : "未知错误"}`,
            tool_call_id: tc.id,
          }));
        }
      }
    }
  }

  if (!final) {
    const last = messages[messages.length - 1] as AIMessage;
    final = typeof last.content === "string" ? last.content : "Agent 处理完成，请查看结果。";
    const p = extractScriptFromText(final);
    if (p) updated = p;
  }

  return { response: final, script: updated };
}
